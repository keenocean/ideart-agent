# ShipAny Video Agent 营销页面体系实施计划

配套设计与长期维护规则见 `docs/marketing-pages-guide.md`。实施过程中若本计划与指导文档发生冲突，以本计划的验收标准和运行时安全边界为准，并同步修正文档，禁止两份规则长期漂移。

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
5. 补齐导航、SEO、sitemap、llms 文档和双语文案。
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
- 当前没有 `/tools/*` 或 `/models/*` 路由；sitemap 也没有这些页面：`src/routes/sitemap.xml.ts:7`。
- 当前运行时媒体模式是 `auto | image | video`：`src/lib/agent-settings.ts:23`。
- 当前真实模型只有 GPT Image 2、MiniMax H3、Seedance 2.5、Seedance 2.0：`src/lib/agent-settings.ts:38`、`:147`。
- 当前真实媒体工具只有 `generate_image`、`generate_video`、`animate_image`：`src/modules/agent/tools.ts:1021`。
- Background Remover 只能通过 GPT Image 2 通用编辑近似完成，当前没有透明 PNG、alpha mask 或确定性抠图契约：`src/modules/agent/image-tools.ts:479`。
- 匿名首页提交会跳到 `/chat/$sessionId`，但 Agent auth guard 没有保留 callback：`src/components/agent/agent-layout.tsx:33`。
- 工作树已有大量 Agent、图片、Skills 和 turn lease 未提交实现；营销改造必须追加修改，不能覆盖现有 Composer 和 runtime 文件。

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

### 3.3 Catalog 同时表达“发布”与“能力”

```ts
type Publication = 'listed' | 'unlisted' | 'hidden';
type Availability = 'live' | 'beta' | 'coming-soon';

type MarketingPlacement = {
  homeFeatured?: boolean;
  homeOrder?: number;
  directoryOrder: number;
};
```

发布规则：

| 状态                 | 详情路由 | 首页/目录 | sitemap | robots  | Workbench        |
| -------------------- | -------- | --------- | ------- | ------- | ---------------- |
| listed + live        | 200      | 显示      | 收录    | index   | 可运行           |
| listed + beta        | 200      | 显示 Beta | 收录    | index   | 可运行并展示限制 |
| listed + coming-soon | 200      | 可选显示  | 收录    | index   | 禁用，转等待 CTA |
| unlisted             | 200      | 不显示    | 不收录  | noindex | 按 availability  |
| hidden               | 404      | 不显示    | 不收录  | —       | —                |

Catalog selector 是首页、目录、related cards、sitemap 和 llms 文档的唯一发布判断来源，避免各页面状态不一致。首页只挑选 `listed + homeFeatured` 条目并按 `homeOrder` 排序，目录按 `directoryOrder` 排序；新项目不需要改页面代码即可调整展示集合和顺序。

### 3.4 Catalog 不成为业务权威

`ModelDefinition.modelKey` 只能引用 `src/lib/agent-settings.ts` 已存在的模型 key。模型规格、分辨率、时长、参考图数量和积分由运行时 Catalog 派生，不在营销 Catalog 复制。

工具定义只能选择白名单执行适配器：

```ts
type ToolExecution =
  | { kind: 'agent-preset'; preset: GenerationPreset }
  | { kind: 'dedicated-api'; operation: DedicatedToolOperation };
```

Catalog 永远不能配置 Provider ID、积分、系统 Prompt、任意 tool permission 或未经服务端验证的 Skill。

### 3.5 公共骨架与页面差异化

不要求所有页面代码完全一致。复用分三层：

| 层级           | 策略                 | 示例                                           |
| -------------- | -------------------- | ---------------------------------------------- |
| UI primitives  | 跨项目长期复用       | SectionHeading、FAQList、Steps、CardGrid       |
| Page shells    | 工具/模型页共享      | ToolDetailPage、ModelDetailPage、DirectoryPage |
| Project blocks | 按项目或重点页面重写 | 首页 sections、专属案例、深度 Prompt 教程      |

普通详情页目标约为 70% 公共骨架、30% 内容与变体；重点 SEO 页面允许增加专属 Block。差异化通过受控 variant 和 optional sections 表达：

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

### 3.6 Cloudflare Worker 体积预算

动态 `/tools/$slug` 和 `/models/$slug` 路由保持固定数量，页面数量本身不会复制 route module；Worker 体积主要增长于被 import 的代码、Catalog、翻译和长文本。图片、视频和字体必须通过 `public/`/Workers Static Assets 提供，禁止作为 Base64 或大字符串打进 TS/JSON。

当前项目内部预算：

- Cloudflare Free 目标：Worker gzip 不超过 2.4 MB。
- Cloudflare Paid 目标：Worker gzip 不超过 8 MB。
- 单次营销页面改造增加超过 100 KB gzip 时必须记录原因并优化或说明。
- 每次批量新增工具/模型后运行 `pnpm cf:build` 和 `npx wrangler deploy --outdir bundled --dry-run`，记录 Total Upload、gzip、startup time、静态资产数量和最大单文件。

以上是内部余量目标，不替代 Cloudflare 官方限制。若未来达到数百/数千页，优先将长内容迁移到按需内容模块、MDX、KV/D1/R2 或预渲染静态 HTML，而不是扩大根 Worker bundle。

## 4. 生成入口重构

### 4.1 目标接口

从现有 `PromptLauncher` 中抽取共享生成入口契约：

```ts
type GenerationPreset = {
  initialPrompt?: string;
  mediaMode?: 'auto' | 'image' | 'video';
  modelKey?: AgentModelKey;
  requiredInput?: 'none' | 'image' | 'video' | 'media';
  settings?: SafeComposerSettings;
  locks?: {
    mediaMode?: boolean;
    model?: boolean;
  };
};
```

语义：

- `default`：没有用户持久化选择时使用，适合首页。
- `locked`：页面任务必须固定模式/模型时使用，适合工具和模型页。
- 页面预设必须经过现有 settings normalization。
- 页面预设不得把工具页选择污染到全局 `localStorage`，除非用户主动修改并确认。

### 4.2 组件边界

- `GenerationWorkbench`：纯展示，接收值、错误、上传状态和 callbacks。
- `useGenerationEntry`：管理持久化设置、Skill、上传、首轮 stash 和跳转。
- `GenerationEntryBlock`：读取 i18n 和页面 definition，组装 controller 与 UI。
- `PromptLauncher`：保留为 `/chat` 的默认 wrapper，防止现有入口行为改变。

先为当前 handoff、settings normalization、Skill/attachment 保留行为补回归测试，再做抽取。

### 4.3 匿名提交回跳

- Agent auth guard 跳转登录时携带当前 `/chat/$sessionId` 为安全 callback。
- 登录成功回到原会话页后再消费 `sessionStorage` 初始 turn。
- callback 继续使用现有同站 URL 校验，不接受外部 URL。
- 验证纯文本、图片附件和 Skill 三种首轮 payload 均可恢复。

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

模型页 Workbench 锁定 `modelKey`，但允许用户调整该模型支持的比例、分辨率、时长、质量和参考输入。无效参数继续由现有 normalization 修正，服务端再次验证。

## 8. 文案与内容组织

- 新增 `marketing.home.*`、`marketing.tools.*`、`marketing.models.*` flat keys 到中英文消息文件。
- 已知固定文案使用静态 `m['key']()` 调用。
- 动态 slug 通过显式 `switch`/resolver 映射到静态 message functions，避免拼接 key 导致整包失去 tree-shaking。
- Catalog 只保存 id/slug/状态/关联/素材/能力引用，不保存双语长文案。
- 每个新项目替换 blocks、Catalog、messages 和 assets；通用 components/routes 保留。

## 9. 导航、SEO 与发现性

- Header 增加 `/tools`、`/models`、`/pricing`、`/blog`。
- Footer 增加工具、模型和资源栏目，并只链接 listed 实体或目录页。
- 首页、目录页、详情页均输出 localized title、description、canonical、hreflang 和 x-default。
- 工具/模型详情页输出 Breadcrumb JSON-LD；有真实 FAQ 时输出 FAQPage JSON-LD。
- 只有 listed 页面进入 `sitemap.xml`。
- unlisted 页面输出 `noindex,follow`。
- hidden 页面返回 404，不生成 metadata。
- `llms.txt` 和 `llms-full.txt` 从相同 Catalog selector 输出已发布能力摘要。
- Open Graph 图片只引用存在的本地资源；没有专属图时使用站点默认图。

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

1. 记录当前 dirty worktree，禁止覆盖 Agent/Skills/图片 runtime 的未提交实现。
2. 运行并保存 `pnpm test`、`pnpm build` 基线结果。
3. 为首轮 handoff、preset normalization 和 Catalog selector 建立回归测试。
4. 确认所有营销案例资源真实存在；缺失资源不进入页面。

### 阶段 1：Marketing 类型和 Catalog

1. 新增 marketing types、tool/model Catalog 和 selectors。
2. 建立 slug 唯一性、related 引用、publication/availability/placement 组合校验。
3. 建立 modelKey 对 runtime Catalog 的一致性测试。
4. 建立“listed/unlisted/hidden”选择器测试。
5. 定义受控 DetailPageVariant、optional sections 和重点页面 Block registry。

### 阶段 2：Durable marketing components

1. 实现 section heading、cards、steps、gallery、FAQ、related pages、CTA 和详情 shell。
2. 所有内容从 props 输入，不读 i18n、不访问 server modules。
3. 支持 light/dark、desktop/mobile、键盘导航和 reduced motion。
4. 实现 BeforeAfterSlider、ModelSpecsTable 和受控页面 slot，不构建巨型万能组件。

### 阶段 3：共享生成入口

1. 先锁定现有 `PromptLauncher` 行为测试。
2. 抽取 controller/hook 和 `GenerationWorkbench`。
3. 实现 default/locked preset、required input 和 source tracking。
4. 保留 `/chat` 当前默认行为。
5. 修复匿名提交 → 登录 → 原 session 回跳。

### 阶段 4：首页重组

1. 新建首页 blocks，接入 Catalog、真实案例和 i18n。
2. 重写 `src/routes/index.tsx` 的 section composition。
3. 移除登录用户访问首页时的自动 redirect。
4. 校验首页不引用 demo/缺失素材，且 CTA 路径有效。

### 阶段 5：工具页

1. 实现 `/tools` 目录 loader/head/component。
2. 实现 `/tools/$slug` Catalog resolver、404/noindex/SEO。
3. 接入工具 preset、输入要求、限制说明和 related tools。
4. 上线五个 live workflow 与一个 beta background-remover 页面。
5. 为 Background Remover、Image to Video 等页面接入差异化 Workbench/案例 Block，并执行 listed 内容门槛检查。

### 阶段 6：模型页

1. 实现 `/models` 目录 loader/head/component。
2. 实现 `/models/$slug` Catalog resolver、404/noindex/SEO。
3. 从 runtime Catalog 派生规格和安全 preset。
4. 发布当前四个真实模型页面，不发布 FLUX。
5. 为四个模型分别提供真实规格、最佳场景、案例和 Prompt 指南，禁止仅替换模型名称。

### 阶段 7：全站接线

1. 更新 Header/Footer。
2. 更新 sitemap、llms、canonical/hreflang、JSON-LD。
3. 确保首页、目录、related 和 sitemap 使用相同 selector。
4. 更新中英文全部 message keys 并运行 i18n parity 检查。

### 阶段 8：验证与视觉迭代

1. 单元测试和 Catalog 一致性测试。
2. `pnpm test` 全量通过。
3. `pnpm build` 通过，无新增 route/type warning。
4. 桌面 1440px 与移动 390px 分别验证首页、目录、工具详情、图片模型详情、视频模型详情。
5. 覆盖 en/zh、light/dark、登录/匿名状态。
6. 验证所有图片/视频请求无 404，交互无 console error。
7. 对照参考站检查 section 节奏、内容密度、卡片层级和 CTA 清晰度，但不复制品牌资产与文案。
8. 运行 `pnpm cf:build` 和 Wrangler dry-run，记录 Worker gzip、startup time 与静态资产统计，并对比实施前基线。

## 11. 可测试验收标准

### 架构

- 首页路由只负责 loader/head 和 block composition，不包含大段 section UI。
- 所有 durable marketing components 不读取 `m`，所有项目文案在 blocks/content resolver 中组装。
- 不存在任意 JSON section renderer。
- 工具和模型 Catalog 无重复 slug、无失效 related 引用。
- 每个 listed 模型的 runtime key 都能在现有 Catalog 中解析。
- ToolDetailPage/ModelDetailPage 支持受控 variant 和专属 Block registry，Catalog 不能注入任意 React component。

### 显示规则

- listed 页面出现在目录、related、sitemap；unlisted/hidden 不出现。
- unlisted 详情可访问但包含 `noindex`；hidden 返回 404。
- coming-soon 不显示可提交 Workbench。
- beta 页面显示限制说明和 Beta 状态。

### 生成链路

- 首页默认模式不覆盖用户已有合法设置。
- 工具页可以锁定 mediaMode 和 required input。
- 模型页可以锁定 modelKey，并只显示模型支持的参数。
- 匿名用户提交后登录，自动返回同一 `/chat/$sessionId` 并消费原始 prompt/settings/skill/attachments。
- 客户端 preset 不能修改积分、Provider、系统 Prompt 或工具权限。

### 内容与 SEO

- 首页包含 Hero、Tools、Models、Examples、Capabilities、Use Cases、How It Works、FAQ、CTA。
- 中英文消息 key 完全一致，无页面硬编码主文案。
- 所有公开页面有唯一 title、description、canonical、hreflang。
- sitemap/llms 只暴露允许发布的实体。
- `flux-schnell` 不出现在 live 模型列表。
- Background Remover 不承诺透明 PNG 或确定性抠图。
- 每个 listed 页面至少包含独特介绍、真实案例/Prompt、能力与限制、适用场景中的三类实质内容；仅名称替换的页面不得发布。
- 结构化数据与页面可见内容一致，不生成页面中不存在的 FAQ、价格或评价。

### 质量

- `pnpm test` 全部通过。
- `pnpm build` 成功。
- 关键页面在 390px 无横向滚动，在 1440px 无异常大面积空白。
- en/zh、light/dark 均可读，所有交互可用键盘操作。
- 控制台无新增错误，页面静态资源无 404。
- Cloudflare dry-run 完成并记录体积；Free 目标 gzip ≤ 2.4 MB、Paid 目标 gzip ≤ 8 MB。
- 单次营销改造若增加超过 100 KB gzip，计划交付记录中包含来源分析和处理结论。

## 12. 风险与缓解

| 风险                                       | 缓解                                                                       |
| ------------------------------------------ | -------------------------------------------------------------------------- |
| 覆盖当前未提交 Agent/Skills 改动           | 小步 `apply_patch`，先读当前文件；不替换整文件；每阶段检查 diff            |
| `PromptLauncher` 拆分导致现有 `/chat` 回归 | 先写回归测试；保留 wrapper；首页/工具/模型逐个迁移                         |
| 页面 Catalog 与 runtime 能力漂移           | build/test 中验证 modelKey 和 preset；权威规格只从 runtime 导出            |
| Background Remover 营销过度承诺            | beta 标识、限制说明；专用后端上线前不写透明 PNG 契约                       |
| 工具/模型状态在多个页面不一致              | 所有列表、related、sitemap、llms 共用 selector                             |
| 大量双语文案破坏 Paraglide tree-shaking    | 固定 slug 使用显式静态 message resolver，不拼动态 key                      |
| 首页媒体拖慢首屏                           | 首屏只加载必要素材；below-fold lazy load；视频视口内播放                   |
| 参考站视觉复制导致品牌同质化               | 只参考信息架构和密度，继续使用本项目主题 token、字体和组件语言             |
| 所有差异塞入一个组件导致 props 爆炸        | 公共 shell 只支持受控 variant；复杂页面通过专属 Block registry 扩展        |
| 页面大量复用造成内容同质、SEO 价值低       | listed 内容门槛；每页提供真实案例、能力限制、场景和 Prompt 指南            |
| 工具/模型增长推高 Worker bundle            | 动态路由、静态资产外置、避免根模块全量 import、每批次执行 dry-run 体积门禁 |

## 13. 完成条件与停止条件

只有满足以下条件才宣告实施完成：

1. 首页、工具目录/详情、模型目录/详情均按 Catalog 工作。
2. 当前四个真实模型和约定工具状态正确。
3. 匿名首轮生成回跳链路通过验证。
4. 中英文、桌面/移动、light/dark 完成视觉检查。
5. `pnpm test`、`pnpm build` 全部通过。
6. Cloudflare dry-run 未突破选定套餐的内部体积预算，或已有书面原因与拆分方案。
7. 无已知 console error、资源 404、重复薄内容或公开能力虚假声明。

在用户明确要求开始实施前，本计划阶段不修改业务源代码。
