# ShipAny Video Agent 营销页面体系实施计划

配套设计与长期维护规则见 `docs/marketing-pages-guide.md`。实施过程中若本计划与指导文档发生冲突，以本计划的验收标准和运行时安全边界为准，并同步修正文档，禁止两份规则长期漂移。新增、更新、重命名、下线或监测公开工具/模型/营销页面时默认调用项目级 `/marketing-seo` Skill，由 Agent 负责搜索意图、实现、收录决策、验证和上线后 handoff；用户无需提供技术 SEO 方案。

## 1. 目标与范围

在保留现有对话式图片/视频 Agent 运行时的前提下，将公开站点扩展为参考 `image-generator.shipany.site` 的丰满信息架构，并继承 `shipany-tanstack` 的模板理念：

- `src/routes/*` 用代码明确编排页面和 SEO。
- `src/blocks/*` 是项目内容与 i18n 接线层，可在新项目中重写。
- `src/components/*` 是跨项目保留的 durable primitives。
- `messages/{en,zh}.json` 只承载多语言文案。
- Typed Catalog 控制工具/模型的 slug、发布状态、关联关系和安全预设。
- 真实模型、参数、积分与 Provider 能力继续以 `src/lib/agent-settings.ts` 为权威来源。

本阶段包含：

1. 重组公开首页。
2. 新增工具目录与动态工具详情页。
3. 新增模型目录与动态模型详情页。
4. 抽取可跨首页、工具页、模型页复用的生成入口。
5. 补齐导航、SEO、sitemap、实验性 llms 文档和双语文案。
6. 修复匿名首页提交后登录不能回到原会话的问题。

本阶段不包含：

- 新增 FLUX Schnell 后端支持。
- 新增确定性透明 PNG 抠图服务。
- 新增 CMS/数据库管理工具和模型页面。
- 建立任意 JSON → React 的通用页面解释器。
- 修改现有积分、Provider 或媒体生成计费规则。

## 2. 当前基线与约束

- 当前首页已组合 `Header → Hero → Blog → Footer → SupportWidget`；其余丰满首页 sections 尚未实施。
- `Hero` 只是 `PromptLauncher` 的薄包装：`src/blocks/hero.tsx:3`。
- `PromptLauncher` 同时承担标题、Composer、案例、上传、设置、Skill 和 session handoff，只有 `className` 可配置：`src/components/agent/prompt-launcher.tsx:58`、`:360`、`:386`。
- 首页和 `/chat` 首页共用 `PromptLauncher`：`src/routes/(agent)/chat/index.tsx:9`。
- 当前没有 `/tools/*` 或 `/models/*` 路由；sitemap 也没有这些页面：`src/routes/sitemap[.]xml.ts:6`。
- 当前运行时媒体模式是 `auto | image | video`：`src/lib/agent-settings.ts:23`。
- 当前真实模型只有 GPT Image 2、MiniMax H3、Seedance 2.5、Seedance 2.0：`src/lib/agent-settings.ts:38`、`:147`。
- 当前真实媒体工具只有 `generate_image`、`generate_video`、`animate_image`：`src/modules/agent/tools.ts:1021`。
- Background Remover 只能通过 GPT Image 2 通用编辑近似完成，当前没有透明 PNG、alpha mask 或确定性抠图契约：`src/modules/agent/image-tools.ts:479`。
- 匿名首页提交会跳到 `/chat/$sessionId`，但 Agent auth guard 没有保留 callback：`src/components/agent/agent-layout.tsx:33`。
- 实施开始时必须重新记录工作树状态；若届时存在 Agent、图片、Skills 或 turn lease 等未提交实现，营销改造只能追加修改，不能覆盖现有 Composer 和 runtime 文件。本计划评审时工作树为干净状态，不把这一瞬时状态写成长期前提。

## 3. 核心架构决策

### 3.1 页面结构不做 JSON renderer

首页 section 顺序继续由 `src/routes/index.tsx` 显式表达。这样保留：

- React/TypeScript 类型检查。
- 每个 section 的自由交互和响应式布局。
- 清晰的 code splitting、SEO 和可访问性控制。
- 对新项目可直接删除、重排或替换 blocks 的能力。

JSON 只负责 i18n 文案；重复卡片和页面实体由 Typed Catalog 驱动。

### 3.2 模板底盘与项目内容包分离

建议目录：

```text
src/
├── lib/
│   └── seo.ts                       # route head、canonical/hreflang 与 JSON-LD 公共构造器
├── components/marketing/          # durable，纯 props 展示
│   ├── section-heading.tsx
│   ├── directory-card-grid.tsx
│   ├── example-gallery.tsx
│   ├── steps.tsx
│   ├── feature-grid.tsx
│   ├── faq-list.tsx
│   ├── related-pages.tsx
│   ├── final-cta.tsx
│   ├── before-after-slider.tsx
│   ├── model-specs-table.tsx
│   └── detail-page-shell.tsx
├── config/marketing/              # typed、无翻译的项目 Catalog
│   ├── types.ts
│   ├── tools.ts
│   ├── models.ts
│   └── selectors.ts
├── blocks/marketing/              # 项目文案、素材与业务接线
│   ├── home-*.tsx
│   ├── tool-directory.tsx
│   ├── tool-detail.tsx
│   ├── model-directory.tsx
│   ├── model-detail.tsx
│   ├── variants/
│   └── content/{tools,models}.ts
└── routes/
    ├── index.tsx
    ├── tools/index.tsx
    ├── tools/$slug.tsx
    ├── models/index.tsx
    └── models/$slug.tsx
```

### 3.3 Catalog 分离“发布”“收录”与“能力”

```ts
type Publication = 'listed' | 'unlisted' | 'hidden';
type Availability = 'live' | 'beta' | 'coming-soon';
type Indexing = 'index' | 'noindex';

type MarketingVisibility =
  | {
      publication: 'listed';
      indexing: Indexing;
      placement: {
        directoryOrder: number;
        homeFeatured?: boolean;
        homeOrder?: number;
      };
    }
  | {
      publication: 'unlisted' | 'hidden';
      indexing?: never;
      placement?: never;
    };

type MarketingDefinitionBase = MarketingVisibility & {
  availability: Availability;
};
```

发布规则：

| 状态                 | 详情路由 | 首页/目录 | sitemap                                 | robots                           | Workbench                    |
| -------------------- | -------- | --------- | --------------------------------------- | -------------------------------- | ---------------------------- |
| listed + live        | 200      | 显示      | 仅 `indexing === 'index'` 时收录        | 按 `indexing`                    | 按部署就绪度运行             |
| listed + beta        | 200      | 显示 Beta | 仅 `indexing === 'index'` 时收录        | 按 `indexing`                    | 按部署就绪度运行并展示限制   |
| listed + coming-soon | 200      | 可选显示  | 仅已有实质预发布内容且显式 index 时收录 | 默认 noindex；内容审核后可 index | 禁用，转等待 CTA             |
| unlisted             | 200      | 不显示    | 不收录                                  | noindex,follow                   | 按 availability 和部署就绪度 |
| hidden               | 404      | 不显示    | 不收录                                  | —                                | —                            |

`publication` 决定发现性，`availability` 决定产品生命周期，`indexing` 决定搜索收录；三者不得互相代替。coming-soon 只有在已经提供稳定、独特、可帮助用户的预发布内容时才允许 index，空壳等待页保持 noindex。

首页、目录、related、sitemap 和 llms 文档必须共享同一个 selector 模块和状态语义，但不能误用成完全相同的过滤函数：

- `selectHomeEntries`：`listed + homeFeatured`，按 `homeOrder`。
- `selectDirectoryEntries`：`listed`，按 `directoryOrder`。
- `selectRelatedEntries`：只保留 definition 显式引用、存在、非自身且 `listed` 的目标。
- `selectIndexableEntries`：只保留 `listed + indexing === 'index'` 的 canonical 页面，供 sitemap 使用。
- `selectLlmsEntries`：只保留允许公开发现的已发布能力；不得输出 unlisted/hidden 或部署秘密。

新项目无需改页面代码即可调整展示集合和顺序；selector 测试负责阻止各消费端状态漂移。

### 3.4 Catalog 不成为业务权威

`ModelDefinition` 使用按模态区分的 runtime model ref，只能引用 `src/lib/agent-settings.ts` 对应 Catalog 已存在的模型 key。模型规格、分辨率、时长、参考图数量和积分由运行时 Catalog 派生，不在营销 Catalog 复制。

工具定义只能选择白名单执行适配器：

```ts
const DEDICATED_TOOL_OPERATIONS = [] as const; // 本阶段没有专用 operation
type DedicatedToolOperation = (typeof DEDICATED_TOOL_OPERATIONS)[number];

type ToolExecution =
  | { kind: 'agent-preset'; preset: GenerationPreset }
  | { kind: 'dedicated-api'; operation: DedicatedToolOperation };
```

本阶段所有初始工具都只能使用 `agent-preset`。未来接入真实专用 API 时，先在服务端实现和验证 operation，再把对应 literal 加入 `DEDICATED_TOOL_OPERATIONS`；Catalog 不能提前引用不存在的 operation。Catalog 永远不能配置 Provider ID、积分、系统 Prompt、任意 tool permission 或未经服务端验证的 Skill。

模型引用必须按模态验证：图片模型使用 `AgentImageModelOptionValue`，视频模型使用 `AgentModelOptionValue`，不能用一个未定义的通用 key 模糊两套运行时契约。

### 3.5 产品状态与部署就绪度分离

Catalog 的 `availability: 'live'` 只表示代码和产品契约已经发布，不保证当前部署已经配置好所需 Provider、模型路由和对象存储。Workbench 是否可提交必须由服务端派生的安全能力快照决定：

```ts
type DeploymentReadiness = {
  executable: boolean;
  reason?:
    | 'provider-unconfigured'
    | 'model-route-unavailable'
    | 'storage-unconfigured';
};
```

- 客户端只能收到布尔状态和可公开的原因，不能收到 API key、Provider 配置或内部模型映射。
- `reference-to-video` 只有在 gRouter、对应模型路由和对象存储就绪时可提交；一般视频生成也必须有受支持 Provider 和对象存储。
- 临时配置或服务故障不得让 SEO URL 在 sitemap 中反复进出；publication/indexing 保持稳定，Workbench 就地禁用并显示可行动说明。
- 上线验收时，目标生产环境中的每个 `listed + live` Workbench 都必须实际通过一次能力预检；未就绪则降级状态或阻止发布。

### 3.6 公共骨架与页面差异化

不要求所有页面代码完全一致。复用分三层：

| 层级           | 策略                 | 示例                                           |
| -------------- | -------------------- | ---------------------------------------------- |
| UI primitives  | 跨项目长期复用       | SectionHeading、FAQList、Steps、CardGrid       |
| Page shells    | 工具/模型页共享      | ToolDetailPage、ModelDetailPage、DirectoryPage |
| Project blocks | 按项目或重点页面重写 | 首页 sections、专属案例、深度 Prompt 教程      |

普通详情页可把约 70% 公共骨架、30% 内容与变体作为内部设计启发，不把比例当作硬性验收指标；重点 SEO 页面允许增加专属 Block。差异化通过受控 variant 和 optional sections 表达：

```ts
type DetailPageVariant = {
  hero?: 'centered' | 'split' | 'visual-first';
  workbench?: 'composer' | 'upload-first' | 'before-after';
  examples?: 'gallery' | 'comparison' | 'timeline';
  sections?: Array<
    | 'capabilities'
    | 'workflow'
    | 'prompt-guide'
    | 'model-specs'
    | 'comparison'
    | 'before-after'
    | 'use-cases'
    | 'limitations'
  >;
};
```

普通页面由 Catalog 选择受控变体；Background Remover、Image to Video 或重点模型页等特殊页面可由 Block registry 提供专属 Workbench、Before/After、时间线或深度内容。Catalog 不直接保存任意 React component，也不允许演变成通用 JSON renderer。

SEO 差异来自最终可见内容，不来自复制不同组件文件。listed 页面必须具备自己的标题、介绍、案例、能力/限制、适用场景、Prompt 指南或其他实质内容；只有名称替换和短描述不同的页面不得 listed。

### 3.7 Cloudflare Worker 体积预算

动态 `/tools/$slug` 和 `/models/$slug` 路由保持固定数量，页面数量本身不会复制 route module；Worker 体积主要增长于被 import 的代码、Catalog、翻译和长文本。小型图片、视频和字体可通过 `public/`/Workers Static Assets 提供，禁止作为 Base64 或大字符串打进 TS/JSON；单个 Static Asset 必须小于 Cloudflare 的 25 MiB 限制，更大的视频必须放 R2/S3 并使用优化 poster。

当前项目内部预算：

- Cloudflare Free 目标：Worker gzip 不超过 2.4 MB。
- Cloudflare Paid 目标：Worker gzip 不超过 8 MB。
- 单次营销页面改造增加超过 100 KB gzip 时必须记录原因并优化或说明。
- 每次批量新增工具/模型后运行 `pnpm cf:build` 和 `npx wrangler deploy --outdir bundled --dry-run`，记录 Total Upload、gzip、startup time、静态资产数量和最大单文件。

以上是内部余量目标，不替代 Cloudflare 官方限制。若未来达到数百/数千页，优先将长内容迁移到按需内容模块、MDX、KV/D1/R2 或预渲染静态 HTML，而不是扩大根 Worker bundle。

### 3.8 客户端性能预算

Worker gzip 预算不能代替浏览器侧性能预算。阶段 0 必须记录首页和代表性详情页的 route client JS gzip、Lighthouse 与首屏资源基线；阶段 8 对比新增路由，任何显著增长都要定位到具体 chunk、组件或媒体并记录理由。固定数值门槛在基线测量后确定，避免脱离现状拍脑袋设限。

- H1、主要说明、能力/限制和关键内链必须存在于 SSR HTML，不能依赖交互后才渲染。
- Workbench 的上传器、案例画廊、Skill 面板和 below-fold 重交互可按路由或交互懒加载。
- 图片提供正确的尺寸、响应式来源和有意义的 alt；视频首屏优先使用轻量 poster，不自动下载非必要媒体。
- 页面数量增加时检查公共 shell 是否意外把所有专属 Block 打进每条路由。

## 4. 生成入口重构

### 4.1 目标接口

从现有 `PromptLauncher` 中抽取共享生成入口契约：

```ts
type GenerationPreset = {
  initialPrompt?: string;
  target:
    | { mediaMode: 'auto'; modelKey?: never }
    | { mediaMode: 'image'; modelKey?: AgentImageModelOptionValue }
    | { mediaMode: 'video'; modelKey?: AgentModelOptionValue };
  settings?: Partial<AgentComposerSettings>;
  inputPolicy?: {
    minimum: number;
    maximum?: number;
    accepts: readonly AttachmentMediaType[];
  };
  locks?: {
    mediaMode?: boolean;
    model?: boolean;
  };
};
```

语义：

- `default`：没有用户持久化选择时使用，适合首页。
- `locked`：页面任务必须固定模式/模型时使用，适合工具和模型页；图片与视频 key 必须由联合类型在编译期匹配模态。
- `inputPolicy` 只表达页面入口约束；`maximum` 只能收紧 runtime 上限，不能放宽。模型/operation 的真实输入上限仍从 runtime 派生并由服务端再次验证。
- 页面预设必须经过现有 settings normalization。
- 设置优先级固定为：runtime defaults → 合法持久化设置 → 页面 default 补缺 → 页面 locked 字段覆盖 → normalization。
- 工具/模型页内的修改默认只影响本次 handoff，不写全局 `localStorage`；只有用户显式执行“保存为默认设置”时才持久化。
- source tracking 只记录 `home | tool:<slug> | model:<slug>` 等来源信息，不参与权限、计费或工具选择。

### 4.2 组件边界

- `GenerationWorkbench`：纯展示，接收值、错误、上传状态和 callbacks。
- `useGenerationEntry`：管理持久化设置、Skill、上传、首轮 stash 和跳转。
- `GenerationEntryBlock`：读取 i18n 和页面 definition，组装 controller 与 UI。
- `PromptLauncher`：保留为 `/chat` 的默认 wrapper，防止现有入口行为改变。

先为当前 handoff、settings normalization、Skill/attachment 保留行为补回归测试，再做抽取。

### 4.3 匿名提交回跳

- Agent auth guard 跳转登录时携带当前 `/chat/$sessionId` 为安全 callback。
- 登录成功回到原会话页后再消费 `sessionStorage` 初始 turn。
- 抽取单一纯函数 `sanitizeAuthCallback()`，供 Agent/App guard、sign-in、sign-up 和 verify-email 共用；接受同站相对路径，拒绝外部 URL、协议相对 URL、编码绕过和认证页循环。
- 已登录用户访问 sign-in/sign-up 时也必须尊重合法 callback，不能无条件回首页。
- 验证邮箱登录、注册、邮箱验证、社交登录 callback 契约和已登录分支；覆盖 locale 前缀与 query string。OAuth 无可用凭据或合法回调域时使用 mock/contract test，不伪造一次真实 provider 成功。
- 验证纯文本、图片附件和 Skill 三种首轮 payload 均可一次性恢复，服务端接受首轮后才删除 stash。

## 5. 首页实施结构

`src/routes/index.tsx` 保持显式 composition：

1. `Header`
2. `HomeHero`：产品定位 + 可直接提交的 Agent Workbench
3. `HomeTools`：按 Catalog 展示精选 listed 工具
4. `HomeModels`：按 Catalog 展示精选 listed 模型
5. `HomeExamples`：真实图片/视频作品与 prompt
6. `HomeCapabilities`：对话迭代、参考媒体、多模型路由、Skill、历史资产
7. `HomeUseCases`：广告、产品展示、UGC、社媒、品牌创意等工作流
8. `HomeHowItWorks`：描述 → 选择/上传 → Agent 执行 → 继续迭代
9. `HomeFAQ`
10. `HomeCTA`
11. `Footer`
12. `SupportWidget`

首页不嵌入完整 PricingTable；继续保留 `/pricing` 独立页，并在 Header/CTA 中链接。原因是参考站首页主要围绕生成能力和 SEO 内容展开，完整价格表会打断主任务。

首页登录行为改为继承 `shipany-tanstack`：登录用户仍可访问 `/`，Header 根据 session 显示进入工作台的入口，不自动重定向 `/chat`。

案例要求：

- 不使用渐变占位图。
- 只引用仓库中真实存在的静态资源。
- 图片/视频加载失败时有明确 fallback，不出现空白卡片。
- 视频默认静音、循环、进入视口再播放，尊重 reduced motion。

## 6. 工具目录与详情页

### 6.1 初始工具 Catalog

| slug                 | 能力                       | 初始状态    | 预设                |
| -------------------- | -------------------------- | ----------- | ------------------- |
| `ai-image-generator` | 文生图                     | listed/live | image，无必需输入   |
| `ai-image-editor`    | 参考图编辑/组合            | listed/live | image，要求图片     |
| `text-to-video`      | 文生视频                   | listed/live | video，无必需输入   |
| `image-to-video`     | 图生视频                   | listed/live | video，要求图片     |
| `reference-to-video` | 多媒体参考视频             | listed/live | video，要求参考媒体 |
| `background-remover` | GPT Image 2 生成式背景编辑 | listed/beta | image，要求图片     |

表中的 live 是产品生命周期状态，不代表任意部署都已配置完成。`reference-to-video` 必须在服务端能力快照确认 gRouter、对应模型路由和对象存储就绪后才启用提交；其他 live 工具也必须通过各自的 Provider/存储预检。

Background Remover 页面必须明确：

- 当前是生成式图片编辑，不是像素级确定性抠图。
- 不承诺透明 PNG、alpha mask 或原图像素完全不变。
- 若未来接入专用 operation，只替换 `execution.kind`，页面结构和 slug 不变。

### 6.2 工具页共同结构

1. Breadcrumb + 状态 Badge
2. 标题、价值说明与专用 Workbench
3. 输入要求和输出限制
4. Before/After 或真实案例
5. How it works
6. Features
7. Use cases
8. Related tools
9. FAQ
10. CTA

`/tools` 仅展示 `publication === 'listed'` 的条目。`/tools/$slug` loader 解析 Catalog，不存在或 hidden 时调用 `notFound()`。

## 7. 模型目录与详情页

### 7.1 初始模型 Catalog

| slug           | runtime key    | 模态  | 初始状态    |
| -------------- | -------------- | ----- | ----------- |
| `gpt-image-2`  | `gpt-image-2`  | image | listed/live |
| `minimax-h3`   | `minimax-h3`   | video | listed/live |
| `seedance-2-5` | `seedance-2-5` | video | listed/live |
| `seedance-2-0` | `seedance-2-0` | video | listed/live |

不注册 `flux-schnell`。未来只有在 runtime Catalog、Provider mapping、计费、工具 allowlist 和 UI 全部接入后，才能将其加入 live Catalog。

### 7.2 模型页共同结构

1. Breadcrumb + 模态/状态 Badge
2. 模型标题、定位和锁定模型的 Workbench
3. 从 runtime Catalog 派生的规格表
4. 真实示例与 Prompt
5. Strengths / Best for
6. 参数和 Prompt 指南
7. Related models
8. FAQ
9. CTA

模型页 Workbench 锁定与 image/video modality 匹配的 `modelKey`，但允许用户调整该模型支持的比例、分辨率、时长、质量和参考输入。无效参数继续由现有 normalization 修正，服务端再次验证。

## 8. 文案与内容组织

- 新增 `marketing.home.*`、`marketing.tools.*`、`marketing.models.*` flat keys 到中英文消息文件。
- 已知固定文案使用静态 `m['key']()` 调用。
- 动态 slug 通过显式 `switch`/resolver 映射到静态 message functions，避免拼接 key 导致整包失去 tree-shaking。
- Catalog 只保存 id/slug/状态/关联/素材/能力引用，不保存双语长文案。
- 每个新项目替换 blocks、Catalog、messages 和 assets；通用 components/routes 保留。

## 9. 导航、SEO 与发现性

- Header 增加 `/tools`、`/models`、`/pricing`、`/blog`。
- Footer 增加工具、模型和资源栏目，并只链接 listed 实体或目录页。

### 9.1 搜索意图、内容门槛与内链

每个准备 `index` 的首页、目录或详情页都必须先有中英文 SEO 内容 brief，至少记录：

- 每种语言的主要搜索意图与 query cluster；翻译不能代替本地化关键词判断。
- 次要问题、用户决策阶段、页面要解决的任务和可验证的差异点。
- 唯一 canonical target、与相邻页面的内容边界、避免关键词蚕食的说明。
- 来自首页、目录、相关文章和 related cards 的内链来源，以及自然、描述性的 anchor 计划。
- 独特案例、Prompt、能力证据、限制和内容审核状态。

`ai-image-generator` 与 `gpt-image-2`、通用 text/image-to-video 工具与具体视频模型页面必须分别服务“完成任务”和“评估模型”两类意图；不能用近似文案争夺同一查询。新增 listed 页面默认 `indexing: 'noindex'`，只有内容 brief、独特正文、SSR 内链和 metadata 验收全部通过后才能切换为 `index`。`alternates` 只包含具备实质本地化内容且允许 index 的语言，不因 message key 存在就自动声明译文。

### 9.2 统一 route metadata 契约

新增 `src/lib/seo.ts`，集中构造 `head.meta`、`head.links` 和 `head.scripts`；页面不得分别手写 canonical、hreflang、Open Graph 或 JSON-LD。建议输入契约：

```ts
type SeoHeadInput = {
  title: string;
  description: string;
  path: string;
  locale: (typeof locales)[number];
  alternates: readonly {
    locale: (typeof locales)[number];
    path: string;
  }[];
  indexing: 'index' | 'noindex';
  image?: {
    src: string;
    alt: string;
    width: number;
    height: number;
    type?: string;
  };
  breadcrumbs?: readonly SeoBreadcrumb[];
  faq?: readonly SeoFaq[];
};
```

动态详情路由按以下顺序工作：

1. loader 读取 locale、解析 Catalog definition 和对应内容。
2. hidden 或未知 slug 在生成 head 前 `throw notFound()`。
3. loader 只返回可序列化的页面数据与 `SeoHeadInput`，不返回 React 值、message function 或 server-only 对象。
4. route `head({ loaderData })` 调用统一 `buildSeoHead(loaderData.seo)`；根路由只维护站点级默认值，页面级 title、description、URL 和图片由子路由覆盖且不得重复。

### 9.3 Canonical、hreflang、robots 与 sitemap

- 每个唯一页面使用 self-referencing canonical：英文保持 locale-free URL，中文使用 `/zh`；中文页不得 canonical 到英文页。
- canonical 和 alternate 必须是基于生产 `VITE_APP_URL` 的绝对 HTTPS URL，移除 hash 和追踪参数，并遵守全站统一的 trailing-slash 规则。分页、筛选等功能参数必须有显式 index/canonical 策略，不能被通用 helper 一律删除。
- `alternates` 为每个语言版本提供准确的 locale-free canonical path，支持未来使用不同的本地化 slug；只在当前页及目标语言页均可索引时输出，并包含 self。同一翻译组必须互相返回相同的 reciprocal 集合；只有 baseLocale 版本真实存在时才输出指向它的 `x-default`。
- noindex 页面可保留 self-canonical，但不得进入 sitemap；robots 不能屏蔽该 URL，否则爬虫无法读取 `noindex`。
- `robots.txt` 保持公开 canonical 页面可抓取、屏蔽私有 app/admin/API 路径，并输出唯一的绝对 sitemap 地址。
- sitemap 只包含 `selectIndexableEntries` 返回的 canonical URL。`lastmod` 只在有真实内容更新时间时输出，不能使用每次构建时间；不把 Google 忽略的 `priority`/`changefreq` 当成优化杠杆。
- 已公开 slug 改名必须登记 `legacySlug → 301 canonical target`；若内容永久删除则明确返回 410 或经过评审的替代跳转，不能默默制造软 404。
- hidden 页面直接返回 404，不生成该实体的 route metadata。实验性 `llms.txt`/`llms-full.txt` 可访问但设置 `X-Robots-Tag: noindex`，并继续遵守缓存、体积、内容转义和 `selectLlmsEntries` 边界。

### 9.4 Open Graph 与 Twitter Card

- 工具、模型和目录页输出 `og:type=website`、localized title/description、`og:url`、站点名、图片 URL/alt/width/height/type、`og:locale` 与真实 alternate locales；Blog 使用 `article`。
- 维护类型安全的 app locale → Open Graph locale 映射（当前项目如 `en → en_US`、`zh → zh_CN`），不能把 Paraglide 的短 locale code 原样当作 `og:locale`。
- `og:url` 必须等于当前语言 canonical。Twitter 输出 `summary_large_image`、title、description、image 和 image alt，并与 Open Graph 共享同一内容来源。
- 分享图片使用可公开访问、返回 200 的绝对 URL；优先准备 1200×630 专属图，没有时回退到已验证的站点默认图。禁止引用缺失、本地开发或需要认证的资源。
- 除非存在稳定、公开、适合分享的媒体 URL，否则不输出 `og:video`。Open Graph 用于分享呈现，不视为搜索排名保证。

### 9.5 Structured data

- 根路由维护与站点真实身份一致的 `WebSite`/`Organization`；工具/模型目录与详情页按可见导航输出 `BreadcrumbList`。
- 只有页面完整展示来自同一内容源的 FAQ 时才输出 `FAQPage`；其优先级低于正文、内链、canonical、hreflang 和 Breadcrumb，也不承诺普通商业站点获得 FAQ 富结果。
- Blog 继续输出与可见文章一致的 `BlogPosting`。工具/模型页不得虚构 `Product`、`SoftwareApplication`、评分、评价、价格或不存在的 AI 模型 schema；只有真实满足 Google 必填字段及业务语义时才添加相应类型。
- 所有 JSON-LD 必须 SSR 输出、可解析，并通过共享安全序列化函数转义 `<`，避免 `</script>` 注入；现有 root 与 Blog 的局部实现应在实施时统一到 `src/lib/seo.ts`。
- 代表性页面使用 Rich Results Test 或 Schema Validator 验证，但测试通过只证明语法/资格，不保证展示富结果。

### 9.6 技术状态矩阵

| 页面状态                       | HTTP | robots         | canonical | hreflang                         | sitemap | JSON-LD                     |
| ------------------------------ | ---- | -------------- | --------- | -------------------------------- | ------- | --------------------------- |
| listed + index                 | 200  | index,follow   | self      | 有译文时互返；可用时含 x-default | 是      | 与可见内容一致              |
| listed + noindex               | 200  | noindex,follow | self      | —                                | 否      | 可选，但必须与可见内容一致  |
| unlisted                       | 200  | noindex,follow | self      | —                                | 否      | 可选，但必须与可见内容一致  |
| hidden / 未知 slug             | 404  | —              | —         | —                                | 否      | 不生成该实体的结构化数据    |
| coming-soon + 实质内容 + index | 200  | index,follow   | self      | 有译文时互返；可用时含 x-default | 是      | 只描述已公开事实            |
| coming-soon + 空壳或待审核内容 | 200  | noindex,follow | self      | —                                | 否      | 不输出误导性的产品/功能声明 |

同一状态矩阵必须驱动 route head、SSR smoke 和 sitemap 断言，不能在三个位置分别解释。

## 10. 分阶段实施步骤

### 已完成：Blog 公共内容基础（2026-08-13）

1. 首页和公开导航已接入双语 Blog；仓库内 Markdown/MDX 只作为编辑源，正式发布内容从数据库读取。
2. Blog 列表支持分类筛选与服务端分页；卡片和文章详情显示分类。
3. 数据库文章新增 locale，slug 唯一约束改为 `(slug, locale)`；后台可设置语言和封面。
4. 文章详情补齐 canonical、真实译文 hreflang、OG/Twitter 与 `BlogPosting` JSON-LD。
5. sitemap 按语言输出独立 URL；llms-full 通过单次数据库查询输出正文并去除 N+1 查询；发现端点增加缓存。
6. D1/SQLite 迁移 `drizzle/0002_brown_shockwave.sql` 已生成但未应用；该 SQL 不是 PostgreSQL/MySQL 通用迁移，生产必须按实际数据库方言单独生成、审阅后执行。
7. Blog 合并、去重、分类和分页已有单元测试；全量测试与生产构建通过后才进入后续营销阶段。

### 阶段 0：基线锁定

1. 运行 `git status --short` 并保存实施时工作树快照；若存在未提交实现，禁止覆盖 Agent/Skills/图片 runtime 文件。
2. 运行并保存 `pnpm test`、`pnpm build`、`pnpm exec tsc --noEmit` 和 `pnpm format:check` 基线结果；若仓库没有某类检查器，明确记录而不临时新增依赖。
3. 为首轮 handoff、preset normalization、auth callback sanitizer 和 Catalog selectors 建立回归测试。
4. 确认所有营销案例资源真实存在并记录单文件大小；超过 Workers Static Assets 25 MiB 限制的媒体改用 R2/S3。
5. 保存当前 root/首页/Blog 的 title、description、canonical、hreflang、OG/Twitter、JSON-LD、robots、sitemap 和响应状态快照，避免统一 helper 迁移时产生静默回归。
6. 记录首页和代表性详情页的 route client JS gzip、Lighthouse 与首屏网络基线；据此确定可执行的前端回归阈值。

### 阶段 1：Marketing 类型和 Catalog

1. 新增 marketing types、tool/model Catalog 和命名 selectors。
2. 建立 slug 唯一性、related 引用、publication/availability/indexing/placement 组合校验。
3. 建立图片/视频 modality 与 runtime model key 的一致性测试，并定义 `inputPolicy` 与 runtime 能力合并规则。
4. 建立 home/directory/related/indexable/llms selectors 测试。
5. 定义服务端 DeploymentReadiness 安全快照；验证不向客户端泄露凭据或内部路由。
6. 定义受控 DetailPageVariant、optional sections 和重点页面 Block registry；registry 留在 blocks 层，Catalog 不保存 React 值。
7. 建立 `docs/marketing-pages-seo-map.md`，记录每页/每语言 SEO 内容 brief、query map、内链来源和工具页/模型页意图边界；所有新增实体先以 `noindex` 注册。
8. 实现统一 `src/lib/seo.ts` 契约、绝对 URL 构造、JSON-LD 安全序列化和状态矩阵测试；覆盖追踪/功能 query、trailing slash、alternates 与注入输入，并迁移 root/Blog 的重复实现。

### 阶段 2：Durable marketing components

1. 实现 section heading、cards、steps、gallery、FAQ、related pages、CTA 和详情 shell。
2. 所有内容从 props 输入，不读 i18n、不访问 server modules。
3. 支持 light/dark、desktop/mobile、键盘导航和 reduced motion。
4. 实现 BeforeAfterSlider、ModelSpecsTable 和受控页面 slot，不构建巨型万能组件。

### 阶段 3：共享生成入口

1. 先锁定现有 `PromptLauncher` 行为测试。
2. 抽取 controller/hook 和 `GenerationWorkbench`。
3. 实现 modality-safe default/locked preset、input policy、明确的设置优先级、临时/持久化分离和 source tracking。
4. 保留 `/chat` 当前默认行为。
5. 抽取统一 callback sanitizer，修复匿名提交 → 登录/注册/验证/OAuth → 原 session 回跳，并覆盖已登录分支。

### 阶段 4：首页重组

1. 新建首页 blocks，接入 Catalog、真实案例和 i18n。
2. 重写 `src/routes/index.tsx` 的 section composition。
3. 移除登录用户访问首页时的自动 redirect。
4. 校验首页不引用 demo/缺失素材，且 CTA 路径有效。

### 阶段 5：工具页

1. 实现 `/tools` 目录 loader/head/component。
2. 实现 `/tools/$slug` Catalog resolver、404/noindex 和统一 route metadata。
3. 接入工具 preset、输入要求、DeploymentReadiness、限制说明和 related tools。
4. 上线五个 live workflow 与一个 beta background-remover 页面。
5. 为 Background Remover、Image to Video 等页面接入差异化 Workbench/案例 Block，并逐页执行搜索意图、内容、内链和 index 门槛检查。

### 阶段 6：模型页

1. 实现 `/models` 目录 loader/head/component。
2. 实现 `/models/$slug` Catalog resolver、404/noindex 和统一 route metadata。
3. 从 runtime Catalog 派生规格、安全 preset 和 DeploymentReadiness。
4. 发布当前四个真实模型页面，不发布 FLUX。
5. 为四个模型分别提供真实规格、最佳场景、案例和 Prompt 指南，明确与通用工具页的搜索意图区别，禁止仅替换模型名称。

### 阶段 7：全站接线

1. 更新 Header/Footer。
2. 通过 `src/lib/seo.ts` 接入 canonical/hreflang、robots、Open Graph、Twitter 和 JSON-LD，消除 route 内的平行实现。
3. 更新 robots、sitemap、legacy slug redirects 和实验性 llms 端点；llms 响应添加 `X-Robots-Tag: noindex`。
4. 确保首页、目录、related、sitemap 和 llms 使用同一 selector 模块中的正确命名投影。
5. 更新中英文全部 message keys 并运行 i18n parity 检查；只有具备实质译文且允许 index 的页面进入 `alternates`，并携带该语言的准确 canonical path。

### 阶段 8：验证与视觉迭代

1. 单元测试和 Catalog 一致性测试。
2. `pnpm test`、`pnpm exec tsc --noEmit` 和 `pnpm format:check` 全量通过。
3. `pnpm build` 通过，无新增 route/type warning。
4. 对 en/zh 动态页面执行 SSR smoke：每页恰有一组有效 title/description/canonical、OG URL 与 canonical 一致、hreflang 存在时 reciprocal、x-default 存在时指向真实 baseLocale 页面、robots/status 符合矩阵且 JSON-LD 可安全解析；生产输出不得含 localhost。
5. 桌面 1440px 与移动 390px 分别验证首页、目录、工具详情、图片模型详情、视频模型详情。
6. 覆盖 en/zh、light/dark、登录/匿名状态，以及邮箱登录、注册验证、OAuth callback contract 和已登录 callback 分支；仅在已配置合法回调域时执行真实 OAuth smoke。
7. 验证所有图片/视频请求无 404，交互无 console error；Static Assets 单文件小于 25 MiB，较大媒体来自 R2/S3。
8. 记录 Lighthouse 移动端基线与回归；以 LCP ≤ 2.5s、CLS ≤ 0.1 为实验室目标，上线后以真实用户 75 分位 INP ≤ 200ms 为目标。
9. 验证每个 OG/Twitter 图片 URL 可公开返回 200、尺寸/alt 完整；用 Rich Results Test 或 Schema Validator 检查代表性工具/模型详情页的 Breadcrumb/FAQ JSON-LD。
10. 对照参考站检查 section 节奏、内容密度、卡片层级和 CTA 清晰度，但不复制品牌资产与文案。
11. 运行 `pnpm cf:build` 和 Wrangler dry-run，记录 Worker gzip、startup time 与静态资产统计，并对比实施前基线。
12. 记录每条代表性路由的 client JS gzip 与首屏资源，确认 SSR 正文/内链存在、重交互按需加载且相对阶段 0 无未解释的显著回归。

### 阶段 9：上线后 SEO 验证（不阻塞代码交付）

1. 在生产环境抓取代表性 en/zh URL，复核实际响应状态、rendered HTML、canonical/hreflang、robots、OG、JSON-LD、sitemap 和重定向。
2. 向 Google Search Console 提交 sitemap，并使用 URL Inspection 检查首页、目录、工具详情、模型详情和 Blog 代表页；没有访问权限时交付可执行清单并明确标记未验证项。
3. 上线后第 7 天与第 30 天检查收录、Google 选择的 canonical、抓取错误、查询/落地页分布和关键词蚕食；按证据调整内容与内链，不以“已提交 sitemap”代替收录结果。
4. 监测真实用户 Core Web Vitals；性能或收录异常作为独立修复任务处理。该运营阶段不阻塞仓库实现完成，但必须有 owner、日期和记录位置。

## 11. 可测试验收标准

### 架构

- 首页路由只负责 loader/head 和 block composition，不包含大段 section UI。
- 所有 durable marketing components 不读取 `m`，所有项目文案在 blocks/content resolver 中组装。
- 不存在任意 JSON section renderer。
- 工具和模型 Catalog 无重复 slug、无失效 related 引用。
- 每个非 hidden 模型的 runtime key 都能按 image/video modality 在对应运行时 Catalog 中解析。
- publication/availability/indexing/placement 不存在非法组合；unlisted/hidden 不能携带首页或目录 placement。
- ToolDetailPage/ModelDetailPage 支持受控 variant 和专属 Block registry，Catalog 不能注入任意 React component。

### 显示规则

- listed 页面出现在目录；related 只显示显式引用、存在、非自身且 listed 的目标。
- sitemap 只包含 `listed + indexing === 'index'` 的 canonical 页面；listed/noindex、unlisted、hidden 均不出现。
- unlisted 详情可访问但包含 `noindex`；hidden 返回 404。
- coming-soon 不显示可提交 Workbench；无实质预发布内容时必须 noindex。
- beta 页面显示限制说明和 Beta 状态。
- 临时 DeploymentReadiness 变化只影响 Workbench，不改变 publication/indexing 或 sitemap。

### 生成链路

- 首页默认模式不覆盖用户已有合法设置。
- 工具页可以锁定 mediaMode 和 input policy；模型 key 的类型与 image/video modality 一致。
- 模型页可以锁定对应模态的 modelKey，并只显示模型支持的参数。
- 工具/模型页面设置默认不写全局 localStorage，用户显式保存后才持久化。
- 匿名用户通过邮箱登录、注册/邮箱验证或 OAuth callback contract 后，自动返回同一 `/chat/$sessionId` 并一次性消费原始 prompt/settings/skill/attachments；已登录分支也尊重合法 callback。OAuth 未配置时以 mock/contract test 验证，真实 provider smoke 只在具备合法回调域时要求。
- callback sanitizer 拒绝外部 URL、协议相对 URL、编码绕过和认证页循环，同时保留合法 locale-free path 与 query。
- 每个 `listed + live` Workbench 在目标生产配置中通过 Provider、模型路由和存储能力预检；未就绪时不可提交并显示明确原因。
- 客户端 preset 不能修改积分、Provider、系统 Prompt 或工具权限。

### 内容与 SEO

- 首页包含 Hero、Tools、Models、Examples、Capabilities、Use Cases、How It Works、FAQ、CTA。
- 中英文消息 key 完全一致，无页面硬编码主文案。
- 每个 indexable 页面有按语言审核的搜索意图、query cluster、页面边界、内链来源和独特证据；工具页与对应模型页不存在未解释的关键词蚕食。
- 所有公开页面通过统一 helper 输出唯一 title、description、canonical、robots、Open Graph 和 Twitter Card；`og:url` 等于 canonical，生产输出不含 localhost。
- canonical 为当前语言 self URL；hreflang 只指向真实且可索引的语言版本，存在翻译组时互相返回，且仅在 base locale 版本存在时输出 x-default。
- 追踪参数不进入 canonical；分页和筛选参数按页面类型执行显式 index/canonical 策略，不被全局错误折叠。
- sitemap 只暴露 indexable canonical 实体；实验性 llms 端点只暴露允许公开发现的实体和内容，不泄露部署配置。
- `llms.txt` 和 `llms-full.txt` 返回 `X-Robots-Tag: noindex`；noindex 页面没有被 robots.txt 屏蔽。
- Sitemap 的 `lastmod` 来自真实内容更新时间或省略；已公开 slug 改名有明确 301/410 策略。
- `flux-schnell` 不出现在 live 模型列表。
- Background Remover 不承诺透明 PNG 或确定性抠图。
- 每个 listed 页面至少包含独特介绍、真实案例/Prompt、能力与限制、适用场景中的三类实质内容；仅名称替换的页面不得发布。
- Breadcrumb/FAQ/BlogPosting/WebSite/Organization JSON-LD 与页面可见内容和站点事实一致，通过共享 serializer SSR 输出；不生成页面中不存在的 FAQ、价格、评价、评分或虚构 schema。
- 所有 OG/Twitter 图片使用公开、绝对且返回 200 的 URL，并具备正确尺寸和 alt；无稳定公开视频时不输出 `og:video`。

### 质量

- `pnpm test` 全部通过。
- `pnpm exec tsc --noEmit` 和 `pnpm format:check` 通过。
- `pnpm build` 成功。
- en/zh 代表性 SSR URL 的 200/404、noindex、canonical、hreflang、x-default 和 JSON-LD smoke 验证通过。
- 关键页面在 390px 无横向滚动，在 1440px 无异常大面积空白。
- en/zh、light/dark 均可读，所有交互可用键盘操作。
- 控制台无新增错误，页面静态资源无 404。
- Workers Static Assets 单文件小于 25 MiB；更大视频从 R2/S3 提供。
- 记录 Lighthouse 移动端基线且无显著回归；实验室 LCP ≤ 2.5s、CLS ≤ 0.1，上线后监测真实用户 75 分位 INP ≤ 200ms。
- 代表性路由的 SSR HTML 包含 H1、核心正文和关键内链；client JS gzip 与首屏资源相对基线无未解释的显著增长。
- Cloudflare dry-run 完成并记录体积；Free 目标 gzip ≤ 2.4 MB、Paid 目标 gzip ≤ 8 MB。
- 单次营销改造若增加超过 100 KB gzip，计划交付记录中包含来源分析和处理结论。

## 12. 风险与缓解

| 风险                                       | 缓解                                                                        |
| ------------------------------------------ | --------------------------------------------------------------------------- |
| 覆盖当前未提交 Agent/Skills 改动           | 小步 `apply_patch`，先读当前文件；不替换整文件；每阶段检查 diff             |
| `PromptLauncher` 拆分导致现有 `/chat` 回归 | 先写回归测试；保留 wrapper；首页/工具/模型逐个迁移                          |
| 页面 Catalog 与 runtime 能力漂移           | 按模态验证 modelKey/preset；权威规格只从 runtime 导出；服务端派生部署就绪度 |
| live 页面在目标部署缺少 Provider/存储      | 发布前能力预检；Workbench 就地禁用；不让瞬时就绪度扰动 sitemap              |
| callback 分支规则漂移或产生开放重定向      | 单一 sanitizer；登录/注册/验证/OAuth/已登录共用并测试攻击输入               |
| Background Remover 营销过度承诺            | beta 标识、限制说明；专用后端上线前不写透明 PNG 契约                        |
| 工具/模型状态在多个页面不一致              | 所有消费端共用 selector 模块，并调用各自的命名投影                          |
| listed、indexable 和 related 语义被混用    | 使用命名 selector 投影，并分别测试目录、关联、sitemap、llms                 |
| 大量双语文案破坏 Paraglide tree-shaking    | 固定 slug 使用显式静态 message resolver，不拼动态 key                       |
| 首页媒体拖慢首屏                           | 首屏只加载必要素材；below-fold lazy load；视频视口内播放                    |
| 参考站视觉复制导致品牌同质化               | 只参考信息架构和密度，继续使用本项目主题 token、字体和组件语言              |
| 所有差异塞入一个组件导致 props 爆炸        | 公共 shell 只支持受控 variant；复杂页面通过专属 Block registry 扩展         |
| 页面大量复用造成内容同质、SEO 价值低       | listed 内容门槛；每页提供真实案例、能力限制、场景和 Prompt 指南             |
| 工具/模型增长推高 Worker bundle            | 动态路由、静态资产外置、避免根模块全量 import、每批次执行 dry-run 体积门禁  |
| 案例视频超过 Static Assets 单文件限制      | 小媒体进 public；大于 25 MiB 的视频放 R2/S3，并提供优化 poster              |
| 把 llms/FAQ schema 当成确定性 SEO 收益     | llms 保持实验性非阻塞；FAQ 只映射可见内容并以验证工具检查，不承诺富结果     |
| 动态 route 各自手写 metadata 导致漂移      | 单一 `src/lib/seo.ts` 契约；状态矩阵驱动 head、SSR smoke 和 sitemap         |
| canonical/hreflang 语言或域名错误          | 绝对 URL 构造器、self/reciprocal/x-default 测试、生产环境无 localhost 断言  |
| 工具页与模型页关键词蚕食                   | 每页/每语言 query map；发布前明确“任务意图”与“模型评估意图”的内容边界       |
| 虚构 Product/SoftwareApplication 数据      | schema 类型白名单；只从可见事实生成，不填虚假价格、评分或评价               |
| slug 改名造成链接资产丢失                  | 维护 legacy slug 映射并测试 301；永久删除使用明确 410/替代策略              |
| 客户端 JS 与首屏媒体吞噬 CWV               | 分路由体积基线、重交互懒加载、SSR 核心内容、poster/尺寸/响应式图片          |
| 上线后无人验证真实收录                     | 指定 Search Console/RUM owner，在第 7/30 天记录索引、canonical 与 CWV       |

## 13. 完成条件与停止条件

只有满足以下条件才宣告实施完成：

1. 首页、工具目录/详情、模型目录/详情均按 Catalog 工作。
2. 当前四个真实模型和约定工具状态正确。
3. 匿名首轮生成在登录/注册/验证/OAuth callback contract/已登录分支均能安全回跳；具备合法回调域时完成真实 OAuth smoke，且所有 live Workbench 在目标部署通过能力预检。
4. 中英文、桌面/移动、light/dark 完成视觉检查。
5. `pnpm test`、`pnpm exec tsc --noEmit`、`pnpm format:check`、`pnpm build` 全部通过，SSR/SEO smoke 无错误。
6. Cloudflare dry-run 未突破选定套餐的内部体积预算，或已有书面原因与拆分方案。
7. 无已知 console error、资源 404、重复薄内容或公开能力虚假声明。
8. SEO 技术状态矩阵、搜索意图 map、legacy slug 策略和上线后第 7/30 天检查 handoff 均已有记录；外部平台未授权项明确标记为未验证而不是假定通过。

在用户明确要求开始实施前，本计划阶段不修改业务源代码。
