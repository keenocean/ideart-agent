# ShipAny Video Agent 营销页面体系实施计划

配套设计与长期维护规则见 `docs/marketing-pages-guide.md`。本文件只负责本次实施范围、阶段顺序、迁移约束和验收证据；长期架构与新增页面流程只在指导文档维护，代码中的类型、resolver 和自动化测试落地后成为最终权威。若三者冲突，先停止发布并同步修正，禁止通过复制规则形成第三套解释。新增、更新、重命名、下线或监测公开工具/模型/营销页面时默认调用项目级 `/marketing-seo` Skill，由 Agent 负责搜索意图、实现、收录决策、验证和上线后 handoff；用户无需提供技术 SEO 方案。

## 1. 目标与范围

在保留现有对话式图片/视频 Agent 运行时的前提下，将公开站点扩展为参考 `image-generator.shipany.site` 的丰满信息架构，并继承 `shipany-tanstack` 的模板理念：

- `src/routes/*` 用代码明确编排页面和 SEO。
- `src/blocks/*` 是项目内容与 i18n 接线层，可在新项目中重写。
- `src/components/*` 是跨项目保留的 durable primitives。
- `messages/{en,zh}.json` 承载全站短 UI 与 metadata 文案；大量营销长正文只有在生产 bundle 证明可按路由 tree-shake 时才放入，否则使用按 locale/slug 懒加载的 typed content module。
- Typed Catalog 控制工具/模型的 slug、发布状态、关联关系和安全预设。
- 真实模型、参数、积分与 Provider 能力继续以 `src/lib/agent-settings.ts` 为权威来源。
- 新增或实质改造的公开营销组件所展示的图片、视频、video poster 与社交分享图统一托管在 R2，并通过稳定的 R2 公网域名 URL 渲染；不得继续把页面内容媒体加入 `public/`。

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
- 实施开始时必须重新记录工作树状态；若届时存在 Agent、图片、Skills 或 turn lease 等未提交实现，营销改造只能追加修改，不能覆盖现有 Composer 和 runtime 文件。本次计划修订开始时三份规划/Skill reference 已有未提交改动，因此任何后续阶段都不得假定工作树干净。
- 当前 `public/` 共 48 个文件、约 50.50 MiB，其中 17 个 MP4 与 31 个图片/图标；`prompt-examples.ts`、Blog MDX、root/Blog metadata 仍直接引用 `/videos/*`、`/images/*`、`/imgs/*` 或 `/logo.png`。这批文件是待治理的历史资产，不是新组件可继续复制的模式。
- 项目已有 DB/Admin 驱动的 `R2Provider`、`r2_domain` 和公开 URL 生成能力；营销媒体只有在 `r2_domain` 配置为可匿名访问的 HTTPS CDN/custom domain 后才视为可发布。未配置 public domain 时生成的 S3 API endpoint 不得用于页面或 OG/Twitter metadata。
- 当前通用上传契约只传 `Content-Type` 与 `Content-Disposition`，且未配置存储时会回退 `public/uploads`。阶段 0 的营销素材流程必须补齐 cache metadata，并在 R2/`r2_domain` 缺失时 fail closed；该本地开发 fallback 只服务现有运行时上传，不得被营销内容复用。

## 3. 核心架构决策

### 3.1 页面结构不做 JSON renderer

首页 section 顺序继续由 `src/routes/index.tsx` 显式表达。这样保留：

- React/TypeScript 类型检查。
- 每个 section 的自由交互和响应式布局。
- 清晰的 code splitting、SEO 和可访问性控制。
- 对新项目可直接删除、重排或替换 blocks 的能力。

JSON 只负责 i18n 文案；重复卡片和页面实体由 Typed Catalog 驱动。

#### 内容载体与所有权

“内容数据化”不等于“页面 JSON 化”。本次实施固定使用以下边界：

| 内容/规则                                                          | 权威位置                                          | 格式与加载方式                                                |
| ------------------------------------------------------------------ | ------------------------------------------------- | ------------------------------------------------------------- |
| 页面 section 顺序、交互和特殊布局                                  | `src/routes/*` + `src/blocks/*`                   | React/TypeScript 显式 composition                             |
| 导航、按钮、状态、短标题和短 metadata                              | `messages/<locale>.json`                          | flat JSON key，已知 key 静态调用                              |
| entityId、slug、publication、indexing、placement、related、variant | `src/config/catalog/*`                            | Typed TypeScript Catalog                                      |
| 介绍、案例说明、Prompt 教程、限制、长 FAQ 等 SEO 正文              | `src/content/<kind>/pages/<entityId>/<locale>.ts` | 可序列化 typed module，按实体与语言自动发现、懒加载并参与 SSR |
| 模型能力、参数、积分、Provider、权限和执行限制                     | Runtime/服务端权威源                              | 运行时派生并在服务端验证                                      |
| 图片、视频、poster 和分享图                                        | R2 + typed asset ref                              | 代码只保存已验证的稳定公网引用和展示 metadata                 |
| Blog 正文                                                          | 数据库                                            | 按 `(slug, locale)` 精确读取                                  |

不得建立包含任意 `sections[]`、component name 或 props 的通用页面 JSON，也不得把长正文、Base64 媒体或业务能力复制进 messages/Catalog。typed content module 只提供内容数据；最终 section 顺序仍由 React 决定。若生产 bundle 证明某段长正文能保持 route-local，允许继续使用静态 Paraglide message functions，但必须以 route bundle 报告为证据，不能凭源码 import 形态推断。

### 3.2 模板底盘与项目内容包分离

建议目录：

```text
src/
├── lib/
│   └── seo.ts                       # route head、canonical/hreflang 与 JSON-LD 公共构造器
├── components/catalog/            # 工具/模型目录的 durable、纯 props 组件
│   ├── directory-card-grid.tsx
│   ├── example-gallery.tsx
│   ├── related-pages.tsx
│   ├── before-after-slider.tsx
│   ├── model-specs-table.tsx
│   └── detail-page-shell.tsx
├── config/catalog/                # typed、无翻译的公开页面 Catalog
│   ├── types.ts
│   ├── tools.ts
│   ├── models.ts
│   ├── paths.ts
│   ├── selectors.ts
│   └── legacy-routes.ts
├── config/seo/
│   └── public-routes.ts           # 固定公开路由的逐语言 index 状态
├── content/
│   ├── catalog-pages.ts            # Catalog × content 发布门禁与精确 locale target
│   ├── tools/
│   │   ├── manifest.ts            # 非 eager glob + 精确语言 resolver
│   │   └── pages/<entityId>/<locale>.ts
│   └── models/                    # 阶段 4 沿用同一约定
│       ├── manifest.ts
│       └── pages/<entityId>/<locale>.ts
├── blocks/                        # 现有公开内容层保持扁平，以领域前缀分组
│   ├── hero.tsx
│   ├── features.tsx
│   ├── models-strip.tsx
│   ├── tool-directory.tsx
│   ├── tool-detail.tsx
│   ├── tool-detail-variants.tsx
│   ├── model-directory.tsx
│   ├── model-detail.tsx
│   └── model-detail-variants.tsx
└── routes/
    ├── index.tsx
    ├── tools/index.tsx
    ├── tools/$slug.tsx
    ├── models/index.tsx
    └── models/$slug.tsx
```

`src/blocks/` 中可执行的 React Blocks 保持扁平，不再增加重复的 `blocks/marketing/` 命名空间；序列化正文统一放在 `src/content/<kind>/pages/`，不是新的 Block 层。Catalog 同时驱动路由、目录、Related、Sitemap 与 llms 投影，因此使用 `config/catalog/`，避免把它误解为仅供营销文案使用。`components/catalog/` 只容纳工具/模型目录真正共享的纯展示组件；SectionHeading、Steps、FeatureGrid、FAQList、FinalCTA 等通用抽象必须在出现至少两个真实消费者后再提取，优先复用现有 blocks 和 UI primitives。

### 3.3 Catalog 分离“发布”“逐语言收录”与“能力”

```ts
type Publication = 'listed' | 'unlisted' | 'hidden';
type Availability = 'live' | 'beta' | 'coming-soon';
type Indexing = 'index' | 'noindex';

// 这里只保存 locale-free 的 route segment，不保存 `/zh` 前缀、绝对 URL、
// query 或 hash。最终 URL 只能由 route kind + slug + localizeUrl() 生成。
type CatalogRouteSegment = string & { readonly __brand: 'CatalogRouteSegment' };
type CatalogLocaleRoute = {
  slug: CatalogRouteSegment;
  // 只有正文真实变化时才更新；无可靠值时省略 sitemap lastmod。
  contentModifiedAt?: string;
};
type CatalogLocalePage = CatalogLocaleRoute & { indexing: Indexing };

type CatalogLocaleRoutes<T = CatalogLocalePage> = Partial<
  Record<(typeof locales)[number], T>
>;

type LocalePageState = {
  // locale-free、由真实文件路由接受的 path。
  path: string;
  indexing: Indexing;
  contentModifiedAt?: string;
};

type FixedPublicRoute = {
  id: string;
  localePages: Partial<Record<(typeof locales)[number], LocalePageState>>;
};

type CatalogVisibility =
  | {
      publication: 'listed';
      // 至少有一个语言页面；每种语言独立通过内容与 index gate。
      localePages: CatalogLocaleRoutes;
      placement: {
        directoryOrder: number;
        home?: { featured: true; order: number };
      };
    }
  | {
      publication: 'unlisted';
      localePages: CatalogLocaleRoutes<CatalogLocaleRoute>;
      placement?: never;
    }
  | {
      publication: 'hidden';
      // 可保留旧 route segment 供 resolver 识别，但一律返回 404，且不输出 metadata。
      localePages?: CatalogLocaleRoutes<CatalogLocaleRoute>;
      placement?: never;
    };

type CatalogDefinitionBase = CatalogVisibility & {
  availability: Availability;
};
```

发布规则：

| 状态                 | 详情路由 | 首页/目录                             | sitemap                                       | robots                           | Workbench                    |
| -------------------- | -------- | ------------------------------------- | --------------------------------------------- | -------------------------------- | ---------------------------- |
| listed + live        | 200      | 显示                                  | 仅 `indexing === 'index'` 时收录              | 按 `indexing`                    | 按部署就绪度运行             |
| listed + beta        | 200      | 显示 Beta                             | 仅 `indexing === 'index'` 时收录              | 按 `indexing`                    | 按部署就绪度运行并展示限制   |
| listed + coming-soon | 200      | 目录显示；首页仅 placement 指定时显示 | 仅已有实质预发布内容且该语言显式 index 时收录 | 默认 noindex；内容审核后可 index | 禁用，转等待 CTA             |
| unlisted             | 200      | 不显示                                | 不收录                                        | noindex,follow                   | 按 availability 和部署就绪度 |
| hidden               | 404      | 不显示                                | 不收录                                        | —                                | —                            |

`publication` 决定实体发现性，`availability` 决定产品生命周期，`localePages[locale].indexing` 决定该语言 URL 的搜索收录；三者不得互相代替。中英文 key parity 不代表两种语言都可收录，也不得触发 baseLocale 正文 fallback。coming-soon 只有在该语言已经提供稳定、独特、可帮助用户的预发布内容时才允许 index，空壳等待页保持 noindex。

URL 与路由规则必须复用本项目及 `shipany-tanstack` 已验证的三段式机制：`vite.config.ts` 的 Paraglide `urlPatterns`、`src/server.ts` 的 `paraglideMiddleware`、`src/router.tsx` 的 `deLocalizeUrl/localizeUrl` rewrite。工具/模型 route 文件和 Catalog 永远保持 locale-free：当前英文 `/tools/foo`，中文由同一个 locale-free `/tools/foo` 生成 `/zh/tools/foo`；不得新建 `$locale` 路由、不得在 Catalog 存 `/zh`，也不得手写语言前缀。未来若语言使用不同 slug，只在各自 `localePages[locale].slug` 保存 route segment，动态 loader 必须按“当前 locale + 当前 slug”精确解析，不允许回退到另一语言并制造看似 200 的重复页。

参考仓库只用于确认上述低层路径机制，不复制其较早的 SEO 实现：静态 sitemap 列表、按 locale 机械扩增、`priority/changefreq`、静态页语言 fallback 和分散 metadata 均不进入本项目。

新增唯一 URL 构造与解析边界：

- `catalogPath(kind, slug)` 只接受经过校验的单段 slug，返回 `/tools/<slug>` 或 `/models/<slug>`；拒绝斜杠、`.`/`..`、百分号编码、query、hash 和已带 locale 前缀的输入。
- `catalogUrl(kind, locale, slug)` 只对 `catalogPath()` 的结果调用 `localizeUrl()`，并使用规范化后的生产 `VITE_APP_URL`；其他模块不得自行拼接 canonical。
- `resolveCatalogRoute(kind, locale, slug)` 是详情 loader、内容 resolver、head 和 redirect 共用的唯一解析器。当前语言记录不存在、slug 不匹配、实体 unknown/hidden 时先 `throw notFound()`，不得 fallback 到 base locale。
- 首页、Pricing、静态页、`/tools`、`/models` 等固定公开文件路由在 `src/config/seo/public-routes.ts` 以 `FixedPublicRoute` 显式登记逐语言 index 状态，但不伪装成 Catalog 详情实体。注册校验必须证明每个 path 由真实文件路由接受。

首页、目录、related、sitemap 和 llms 文档必须共享同一个 selector 模块和状态语义，但不能误用成完全相同的过滤函数。所有 Catalog selector 都必须显式接收 `CatalogPageAvailability`；生产消费端统一传入 `isCatalogPageContentAvailable`，测试 fixture 才能传入其他 predicate，禁止留下绕过正文门禁的默认值：

- `selectHomeEntries(locale)`：`listed + placement.home + localePages[locale]`，按 `placement.home.order`。
- `selectDirectoryEntries(locale)`：`listed + localePages[locale]`，按 `directoryOrder`；coming-soon 是否展示必须通过显式 placement/policy 决定，不得写成“可选”却没有类型落点。
- `selectRelatedEntries(definition, locale)`：只保留 definition 显式引用、存在、非自身、`listed` 且该 locale 页面真实存在的目标。
- `selectIndexableUrls(..., isPageAvailable)`：展开为 `{ kind, entityId, locale, path, modifiedAt? }[]`，只保留 `listed + localePages[locale].indexing === 'index' + 同语言正文存在` 的 canonical URL，作为 sitemap 的 Catalog 输入。
- `selectLlmsEntries(locale, isPageAvailable)`：只保留该 locale 允许公开发现且存在同语言正文的已发布能力；不得输出 unlisted/hidden、缺失语言版本或部署秘密。

新项目无需改页面代码即可调整展示集合和顺序；类型校验与 selector 测试共同阻止各消费端状态漂移。测试必须证明 `localePages` 非空、同一 kind/locale 下 slug 唯一、placement 组合合法、每个 selector 返回的 path 都能被同一个 resolver 反向解析。

`localePages[locale]` 只证明 Catalog 有意注册该语言 route，不单独证明同语言正文已经存在。页面展示和 SEO 使用双门禁：

1. Catalog resolver 证明 entity、locale route、publication/indexing 状态合法。
2. 内容 resolver 的 lazy module key manifest 证明对应 `kind + entityId + locale` 内容存在，并能按需加载。

内容 manifest 通过非 eager `import.meta.glob('./pages/*/*.ts')` 从约定目录自动建立模块 key 与动态 loader，禁止手工重复登记或 eager import 全部正文。manifest 校验 entityId 路径、路径语言与加载后的 entityId/locale 身份；Catalog locale page 仍是独立发布门禁。`src/content/catalog-pages.ts` 将各 kind 的精确语言 manifest 汇总为唯一 availability predicate 和 locale-free target 投影；尚未实现 content resolver 的 kind 一律 fail closed。首页、目录和 Related 在 selector 内组合 Catalog 与该 predicate；Sitemap 与 llms 还会按需加载候选模块并验证导出身份，不能只凭文件路径存在就公开 URL。详情 loader 加载同语言内容，任一门禁失败即 404。语言切换消费 `locale → Catalog path`，不得假设不同语言共享 slug。`indexing: 'index'` 的注册校验和发布 smoke 还必须证明内容模块、真实文件路由、SSR 正文与发现面同时存在，避免仅修改 Catalog 就把薄页或 404 放入 sitemap。

### 3.4 Catalog 不成为业务权威

`ModelDefinition` 使用按模态区分的 runtime model ref，只能引用 `src/lib/agent-settings.ts` 对应 Catalog 已存在的模型 key。模型规格、分辨率、时长、参考图数量和积分由运行时 Catalog 派生，不在页面 Catalog 复制。

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

页面之间的预期复用边界：

| 能力/组件                                        | 首页           | 工具页                 | 模型页            | 约束                                                         |
| ------------------------------------------------ | -------------- | ---------------------- | ----------------- | ------------------------------------------------------------ |
| `GenerationWorkbench`                            | default preset | 工具 media/input locks | 模态与 model lock | UI/controller 共用，服务端 policy 按 entryContext 重建       |
| `DirectoryCardGrid` / Catalog card               | 精选工具与模型 | 目录、Related          | 目录、Related     | 使用受控 `featured/directory/related` 密度，不复制 slug 规则 |
| `ExampleGallery`                                 | 综合作品       | 任务案例               | 模型案例          | 媒体组件共用，内容与 alt 按 locale 独立                      |
| `SectionHeading`、`Steps`、`FAQList`、`FinalCTA` | 可用           | 可用                   | 可用              | 至少两个真实消费者后再抽取                                   |
| `DetailPageShell`                                | 不使用         | 使用                   | 使用              | 只提供稳定 slots/variant，不承载项目文案                     |
| `BeforeAfterSlider`                              | 可选           | 编辑类工具             | 可选              | 仅真实 before/after 数据使用                                 |
| `ModelSpecsTable`                                | 不使用         | 不使用                 | 使用              | 规格只从 Runtime 派生                                        |

`HomeHero`、`ToolDetail`、`ModelDetail` 继续是独立 Block；它们可以共享 Workbench、卡片、Gallery 和 section primitives，但不能合并成带大量 boolean props 的万能 `MarketingPage`。首页负责产品定位，工具页负责完成任务，模型页负责能力评估，三类页面的内容、loader 和 SEO 意图必须保持独立。

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

SEO 差异来自最终可见内容，不来自复制不同组件文件。每个已注册的 listed locale page 必须具备同语言标题、介绍、案例、能力/限制、适用场景、Prompt 指南或其他实质内容；只有名称替换和短描述不同的语言页面不得 index。

### 3.7 R2 页面媒体契约与 Cloudflare Worker 体积预算

动态 `/tools/$slug` 和 `/models/$slug` 路由保持固定数量，页面数量本身不会复制 route module；Worker 体积主要增长于被 import 的代码、Catalog、翻译和长文本。页面内容媒体不参与 Worker Static Assets 部署：Hero、案例、目录卡片、before/after、Blog 封面、工具/模型图、视频、video poster 与 OG/Twitter 图片都必须先上传 R2，再通过绝对公网 URL 渲染。禁止把这些文件作为 Base64/大字符串打进 TS/JSON，也禁止在新增组件中使用 `/images/*`、`/videos/*`、`/imgs/*` 等新的本地路径。

现有本地媒体可在完全未触碰的旧页面暂时保留；只要某个新组件或本次改造页面使用、复制或替换该素材，就必须在合并前把对应对象迁到 R2 并改为 R2 URL。`public/` 只允许 favicon、manifest icon 等必须随站点壳同源启动的浏览器资产，以及与公开营销内容无关的功能性小图标；`logo.png` 一旦被页面、Blog author image 或 OG/Twitter 使用，就不属于例外。字体不属于本条“页面图片/视频”迁移范围，但仍需遵守现有打包预算。

R2 交付契约：

- Admin Storage 中的 `r2_domain` 必须是可匿名 `GET/HEAD`、生产可用的 HTTPS CDN/custom domain；不得使用 `*.r2.cloudflarestorage.com` S3 API endpoint、localhost、需鉴权地址或会过期的 signed URL。
- 组件只接收媒体 props，不读取存储配置，也不拼接 R2 域名。绝对 URL、kind、宽高、MIME、字节数和可选 poster 进入类型安全的内容/Catalog asset ref；本地化 alt/caption 留在逐语言内容源。
- 对象 key 使用不可变版本，例如 `marketing/<surface>/<slug>/<content-hash>.<ext>`。内容改变时上传新 key，再更新引用；不要覆盖长缓存对象，也不要依赖 query string 做缓存失效。
- 图片在上传前确定固有宽高与响应式策略；视频必须提供优化 poster、正确 `Content-Type`、`Content-Disposition: inline`，并验证字节范围请求。内容 hash key 使用 `Cache-Control: public, max-age=31536000, immutable`；HTML/Catalog 不缓存 R2 凭据。
- 采用“先上传 → 验证所有 R2 URL 为 200 且响应契约正确 → 再合并页面引用”的顺序，避免代码先上线产生资源 404。测试 fixture 可使用明确的测试 URL，但生产内容不得回退到 `public/`。
- Blog 图片使用独立 Admin 上传入口：服务端读取文件真实宽高、按 SHA-256 生成 `marketing/blog/<slug>/<hash>.<ext>`，上传后验证公网 HEAD，再返回类型安全 asset ref。封面和正文图片都保存 URL、MIME、宽高、字节数、逐语言 alt 与可选 caption；发布文章必须有封面，非受控正文图片拒绝保存。该链路不得复用会回退 `public/uploads` 的通用上传接口。

当前项目内部预算：

- Cloudflare Free 目标：Worker gzip 不超过 2.4 MB。
- Cloudflare Paid 目标：Worker gzip 不超过 8 MB。
- 单次营销页面改造增加超过 100 KB gzip 时必须记录原因并优化或说明。
- 每次批量新增工具/模型后运行 `pnpm cf:build` 和 `npx wrangler deploy --outdir bundled --dry-run`，记录 Total Upload、gzip、startup time、静态资产数量和最大单文件。

以上是内部余量目标，不替代 Cloudflare 官方限制。当前官方上限包括 Worker Free 3 MB / Paid 10 MB、单个 Static Asset 25 MiB，以及 Static Assets Free 20,000 / Paid 100,000 个文件；平台数值可能调整，实施时以锁定 Wrangler 版本的 dry-run 和官方 limits 页面为准。若未来达到数百/数千页，优先将长内容迁移到按需内容模块、MDX、KV/D1/R2 或预渲染静态 HTML，而不是扩大根 Worker bundle。

预算必须可重复执行，不能只写在交付说明里。阶段 0 先用现有 Node 能力添加并固定输出格式：

- `pnpm bundle:report-routes`：解析 TanStack Start/Vite manifest，统计每条代表性 route 的直接及传递 preload raw/gzip，单独报告共享 messages chunk。
- `pnpm marketing:check-assets`：离线模式报告 `public/` 总字节/文件数/增量，拒绝 allowlist 外新增或被新营销组件引用的本地图片/视频，扫描 Base64 大字符串，并校验所有营销 asset ref 为 `r2_domain` 下的绝对 HTTPS URL且具备 kind/宽高/MIME/alt 或 poster 契约；release/online 模式对每个 R2 URL 做 `HEAD`/最小 `GET`，验证 200、MIME、缓存、体积，视频额外验证 range response。网络不可用时只能把 online 项标为未验证，不能伪报通过。
- `pnpm cf:dry-run` / `pnpm cf:check-budget`：封装 `cf:build + wrangler --dry-run`，保存可审阅报告并按所选套餐的内部预算失败。

这些检查脚本不得引入新依赖。阈值配置和基线报告提交到仓库；CI/发布流程消费同一配置，避免本地与上线口径不一致。

### 3.8 客户端性能预算

Worker gzip 预算不能代替浏览器侧性能预算。阶段 0 必须通过 `bundle:report-routes` 记录首页和代表性详情页的传递 client JS gzip，通过固定 URL、viewport、节流参数和工具版本记录 Lighthouse 与首屏资源基线；阶段 8 对比新增路由，任何显著增长都要定位到具体 chunk、组件或媒体并记录理由。固定数值门槛在基线测量后确定，避免脱离现状拍脑袋设限。

- H1、主要说明、能力/限制和关键内链必须存在于 SSR HTML，不能依赖交互后才渲染。
- Workbench 的上传器、案例画廊、Skill 面板和 below-fold 重交互可按路由或交互懒加载。
- R2 图片提供正确的尺寸、响应式来源和有意义的 alt；R2 视频首屏优先使用轻量 poster，不自动下载非必要媒体，below-fold 只在接近视口时取媒体资源。
- 页面数量增加时检查公共 shell 是否意外把所有专属 Block 打进每条路由。
- 当前 `PromptLauncher` 会把上传器、案例、预览 Dialog 和媒体逻辑带入首页；抽取时 H1/核心文案保持 SSR，重交互和 Dialog 以路由/视口/用户动作形成明确 chunk 边界。禁止创建一个静态 import 全部专属 blocks 的 registry 后再声称已懒加载。

## 4. 生成入口重构

### 4.1 目标接口

从现有 `PromptLauncher` 中抽取共享生成入口契约：

```ts
type GenerationPreset = {
  initialPrompt?: string;
  target:
    | { mediaMode: 'auto'; modelKey?: never }
    | { mediaMode: 'image'; modelKey: AgentImageModelOptionValue }
    | { mediaMode: 'video'; modelKey?: AgentModelOptionValue };
  // 不重复 target 字段，避免 settings.mediaMode/model 与 target 冲突。
  settings?: Omit<
    Partial<AgentComposerSettings>,
    'mediaMode' | 'modelOption' | 'imageModelOption'
  >;
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

阶段 2 已增加并贯通 `imageModelOption: AgentImageModelOptionValue`：composer state → normalization → session handoff → `AgentGenerationSettings.imageModelName` → API validation → Agent tool context。图片模型页仍必须使用 Catalog 中已登记且 Runtime 可解析的图片模型 key，不能用客户端字符串扩展模型 allowlist。

Catalog preset 不是安全边界。首轮 handoff 额外保存稳定的 `entryContext`（`home`，或 `tool/model + entityId + locale`）；这里的 locale 只用于验证用户进入的页面版本真实存在，不决定 Provider、积分或工具权限。客户端不得发送整份 preset 作为权威配置。`POST /api/agent/chat` 根据 `entryContext` 从服务端可用的 Catalog 重新解析 `EffectiveGenerationPolicy`，然后再执行以下顺序：

1. 校验 entry 存在、非 hidden、当前 locale route 存在且 execution 为允许的 adapter。
2. 将用户设置正规化，再覆盖服务端解析出的 locked media/model；未知 entityId 直接 400，不降级成普通 Agent 请求。
3. 在请求边界校验真实附件数量与媒体类型，`inputPolicy.maximum` 只能取页面限制与 runtime/provider 限制的更小值。
4. 将 policy 传入 Agent tool context；`generate_image`、`generate_video`、`animate_image` 的显式 tool 参数也不得绕过 locked model、modality 或输入上限。
5. 积分、Provider、系统 Prompt、tool allowlist 始终从 Runtime/服务端派生，不接受 Catalog 客户端副本或 source tracking 覆盖。

若某个页面只需要预填而不需要强制执行，应使用独立的 `defaults` 字段，不得使用 `locks`。测试必须分别覆盖 UI 约束、伪造 chat request、Agent tool 显式覆盖和已下线 entryId。

### 4.2 组件边界

- `GenerationWorkbench`：纯展示，接收值、错误、上传状态和 callbacks。
- `useGenerationEntry`：管理页面内临时设置、Skill、上传、首轮 stash 和跳转；默认 setter 只更新内存，不能复用当前“每次变化立即写 localStorage”的 `useComposerSettings()`。
- `GenerationEntryBlock`：读取 i18n 和页面 definition，组装 controller 与 UI。
- `PromptLauncher`：保留为 `/chat` 的默认 wrapper，防止现有入口行为改变。

只有用户点击“保存为默认设置”时才调用明确的 persistence action；测试需证明浏览工具/模型页和修改控件不会污染 `/chat` 的全局默认值。

先为当前 handoff、settings normalization、Skill/attachment 保留行为补回归测试，再做抽取。

### 4.3 匿名提交回跳

- Agent auth guard 跳转登录时携带当前 `/chat/$sessionId` 为安全 callback。
- 登录成功回到原会话页后再消费 `sessionStorage` 初始 turn。
- 抽取单一纯函数 `sanitizeAuthCallback()`，供 Agent/App guard、sign-in、sign-up 和 verify-email 共用；接受同站相对路径，拒绝外部 URL、协议相对 URL、编码绕过和认证页循环。
- 已登录用户访问 sign-in/sign-up 时也必须尊重合法 callback，不能无条件回首页。
- 验证邮箱登录、注册、邮箱验证、社交登录 callback 契约和已登录分支；覆盖 locale 前缀与 query string。OAuth 无可用凭据或合法回调域时使用 mock/contract test，不伪造一次真实 provider 成功。
- 验证纯文本、已上传附件和 Skill 三种首轮 payload 均可一次性恢复，服务端接受首轮后才删除 stash。

`sessionStorage` 不跨浏览器标签页。邮箱验证链接在新标签打开时，新标签只能完成验证并安全导航，不能假装持有原始 payload；原标签通过 session polling/focus 或 `BroadcastChannel` 获知验证成功，再消费自己的 stash 并跳回原 session。验收默认要求“原标签仍存在”这一隐私更安全的流程；原标签已关闭时明确提示草稿不可恢复。若未来必须跨标签/设备恢复，另行设计有 TTL、所有权绑定、一次性消费和删除审计的服务端 pending draft，禁止把 prompt/附件长期写入 `localStorage`。

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

首页数据与渲染流固定为：

```text
index route loader
  → getLocale + fixed-route SEO state
  → selectHomeEntries(tool/model)
  → 用 content manifest 过滤并加载当前语言卡片摘要
  → 返回可序列化 loaderData
  → Home* Blocks 组装 i18n/品牌内容
  → durable Components 渲染
```

`src/routes/index.tsx` 不实现卡片、FAQ 或 Gallery UI，也不手写工具/模型 slug；它只负责 loader/head 和显式 Block composition。首页精选卡片与目录/Related 共用 Catalog card primitive，但首页 Block 独立决定 section 节奏、精选数量和 `featured` 展示密度。`HomeHero` 与工具/模型详情 Hero 不合并；它只复用 `GenerationWorkbench`，并使用不会覆盖用户合法持久化设置的 home default policy。

首页不嵌入完整 PricingTable；继续保留 `/pricing` 独立页，并在 Header/CTA 中链接。原因是参考站首页主要围绕生成能力和 SEO 内容展开，完整价格表会打断主任务。

首页登录行为改为继承 `shipany-tanstack`：登录用户仍可访问 `/`，Header 根据 session 显示进入工作台的入口，不自动重定向 `/chat`。

案例要求：

- 不使用渐变占位图。
- 只引用已上传、可公开访问且已进入 typed asset ref 的 R2 对象；不得把现有 `public/` 示例路径直接复制进新首页组件。
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

`/tools` 与 `/models` 只展示 `selectDirectoryEntries(locale)` 返回的条目，即 `publication === 'listed'` 且当前 locale route 与同语言内容真实存在。`/tools/$slug`、`/models/$slug` loader 统一通过 `resolveCatalogRoute(kind, locale, slug)` 精确解析；当前语言缺路由/内容、不存在或 hidden 时调用 `notFound()`。

工具目录与详情的数据流：

```text
/tools loader
  → selectDirectoryEntries(toolCatalog, locale)
  → content manifest 过滤 + 加载当前语言卡片摘要
  → DirectoryPage / DirectoryCardGrid

/tools/$slug loader
  → resolveCatalogRoute('tool', locale, slug)
  → loadToolContent(entityId, locale)
  → derive DeploymentReadiness + related entries
  → 构造 SeoHeadInput
  → ToolDetail Block
  → DetailPageShell + GenerationWorkbench + 可选专属 Block
```

详情 loader 必须在生成 metadata 前完成 route 与内容双门禁，只返回可序列化数据；React component、message function 和 server-only provider 配置不得进入 loaderData。目录卡片、Related 和详情 canonical 必须从同一个 resolver 产生 path，不能各自拼接 slug。

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

模型页沿用工具页的数据流和共享 shell，但 `loadModelContent()` 只提供当前语言的定位、案例、Prompt、适用场景和限制；规格、参数范围、模型能力和成本继续从 Runtime 投影。`ModelSpecsTable` 接收派生后的纯数据，不能读取 Catalog 文案或复制 Runtime 常量。工具页与模型页可以共用 UI，但前者的 SEO 意图是“完成任务”，后者是“评估模型”，两者不得使用仅替换名称的正文。

## 8. 文案与内容组织

- 短 UI、导航、表单、状态、title/description 等新增为 `marketing.home.*`、`marketing.tools.*`、`marketing.models.*` flat keys 到中英文消息文件，保持全站 Paraglide 习惯与 key parity。
- 已知固定文案使用静态 `m['key']()` 调用；公共营销 import graph 禁止调用 `tDynamic()` 或把 `m` cast 成动态 record。动态 slug 通过显式静态 resolver 映射，不能拼接 key。
- 阶段 0 先记录当前全局 messages chunk 和各 route preload。只有生产 manifest 证明新增正文留在目标 route chunk 时，长正文才可继续放 messages；否则将案例说明、Prompt 教程、FAQ 正文等迁到 `src/content/<kind>/pages/<entityId>/<locale>.ts`，并通过 `import.meta.glob(..., { eager: false })` 按实体与当前 locale 加载。不得使用 eager glob、单体 content 文件或根模块静态 import 所有正文。
- locale content module 只导出经过类型约束、可序列化的页面内容；它不是任意 JSON renderer。缺少当前 locale module 时 resolver 返回缺失并触发 404/noindex gate，绝不 fallback 到 baseLocale 伪装成译文。
- Catalog 只保存 id/逐语言 slug/状态/关联/素材/能力引用，不保存双语长文案。
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

`ai-image-generator` 与 `gpt-image-2`、通用 text/image-to-video 工具与具体视频模型页面必须分别服务“完成任务”和“评估模型”两类意图；不能用近似文案争夺同一查询。新增 listed locale page 默认 `localePages[locale].indexing: 'noindex'`，只有该语言的内容 brief、独特正文、SSR 内链和 metadata 验收全部通过后才能单独切换为 `index`。`alternates` 只包含具备实质本地化内容且允许 index 的语言，不因 message key 存在就自动声明译文。

### 9.2 统一 route metadata 契约

新增 `src/lib/seo.ts`，集中构造 `head.meta`、`head.links` 和 `head.scripts`；页面不得分别手写 canonical、hreflang、Open Graph 或 JSON-LD。TanStack Router 只明确自动去重 title/meta，不能依赖它去重 canonical、hreflang 或 JSON-LD；helper 与 SSR 测试必须保证这些输出唯一。建议输入契约：

```ts
type SeoRouteRef = {
  locale: (typeof locales)[number];
  // locale-free、已由真实 route resolver 接受的 path；不含 origin/query/hash。
  path: string;
};

type SeoBaseInput = {
  title: string;
  description: string;
  canonical: SeoRouteRef;
  alternates: readonly SeoRouteRef[];
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

type SeoHeadInput =
  | (SeoBaseInput & { kind: 'website' })
  | (SeoBaseInput & {
      kind: 'article';
      publishedTime: string;
      modifiedTime: string;
      author?: SeoAuthor;
    });
```

固定首页/目录/价格/静态页与 Catalog 详情都先产生 route-backed `SeoRouteRef`。`buildSeoHead()` 不接受调用者传入的绝对 canonical，也不猜测 locale path：它校验 locale-free path，使用 `localizeUrl()` + `VITE_APP_URL` 生成绝对 URL；production 拒绝 localhost、非 HTTPS（明确的本地/预览环境除外）、重复斜杠和错误 trailing slash。功能 query 的 canonical 策略由页面显式传入经过验证的 search policy，helper 只剥离已登记的 tracking 参数，不能一律丢弃 query。

当 `indexing === 'noindex'` 时 helper 强制不输出 hreflang；当为 index 时，alternates 必须包含 self，且只能来自 resolver 确认存在并允许 index 的 locale routes。`x-default` 只在真实、可索引的 baseLocale route 存在时由 helper 添加。`og:url` 直接复用 canonical，Article 分支负责现有 Blog 的 published/modified/author，避免迁移 `src/routes/blog/$slug.tsx` 时丢字段。

动态详情路由按以下顺序工作：

1. loader 读取 locale，用 `resolveCatalogRoute(kind, locale, slug)` 解析 definition，再加载同 locale 内容。
2. 语言版本缺失、内容模块缺失、hidden 或未知 slug 在生成 head 前 `throw notFound()`；不得返回英文 fallback。
3. loader 只返回可序列化的页面数据与 `SeoHeadInput`，不返回 React 值、message function 或 server-only 对象。
4. route `head({ loaderData })` 调用统一 `buildSeoHead(loaderData.seo)`；根路由只维护站点级默认值，页面级 title、description、URL 和图片由子路由覆盖且不得重复。

### 9.3 Canonical、hreflang、robots 与 sitemap

- 每个唯一页面使用 self-referencing canonical：英文保持 locale-free URL，中文使用 `/zh`；中文页不得 canonical 到英文页。
- canonical 和 alternate 必须由 route-backed locale-free path 基于生产 `VITE_APP_URL` 生成绝对 HTTPS URL，移除 hash 和已登记的追踪参数，并遵守全站统一的 trailing-slash 规则。分页、筛选等功能参数必须有显式 index/canonical 策略，不能被通用 helper 一律删除。
- `alternates` 为每个语言版本提供准确的 locale-free canonical path，支持未来使用不同的本地化 slug；只在当前页及目标语言页均可索引时输出，并包含 self。同一翻译组必须互相返回相同的 reciprocal 集合；只有 baseLocale 版本真实存在且允许 index 时才输出指向它的 `x-default`。
- noindex 页面可保留 self-canonical，但不得进入 sitemap；robots 不能屏蔽该 URL，否则爬虫无法读取 `noindex`。
- `robots.txt` 只用于抓取预算，不作为删除或保密机制。公开的 listed/unlisted/noindex 营销 URL 与 `llms*.txt` 必须保持可抓取，才能读取 meta/header noindex；私有 `/chat`、`/admin`、`/settings` 必须依靠认证/授权与 HTML noindex 保护，API 依靠认证，robots 可额外 Disallow。若对私有页面使用 Disallow，必须为每个实际 locale URL 前缀生成规则，不能只挡 `/admin` 却漏掉 `/zh/admin`。文件只输出一个规范化绝对 sitemap 地址。
- 最终 sitemap 是三类已验证 URL 的去重并集：显式登记且可索引的固定公开 route locale states、Catalog `selectIndexableUrls()`、数据库查询得到的已发布 Blog locale URLs。三类记录都必须先经过相同的绝对 URL/path 校验；不能因为 Catalog selector 存在而丢掉首页、Pricing、静态页或 Blog。`lastmod` 只在有真实内容更新时间时输出，不能使用每次构建时间；新实现删除 `priority`/`changefreq`，避免制造无效配置面。
- 已公开 URL 生命周期统一登记在 `src/config/catalog/legacy-routes.ts`，以 `{ kind, locale, fromSlug }` 精确匹配：重命名使用单跳 301 到 resolver 生成的当前 canonical；无相关替代的永久删除返回经过 TanStack/Nitro 集成测试证明的 410；其余未知/hidden 返回 404。legacy source 不得同时作为 active slug，不得进入目录、Related、hreflang、sitemap 或 llms，测试必须拒绝 redirect chain、loop、跨语言误跳和目标 404。
- hidden 页面直接返回 404，不生成该实体的 route metadata。实验性 `llms.txt`/`llms-full.txt` 是非 HTML 文本响应，保持可抓取并设置 HTTP `X-Robots-Tag: noindex`（不是无效的 route meta fallback），继续遵守缓存、体积、内容转义和 `selectLlmsEntries` 边界。

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

| 页面状态                       | HTTP | robots         | canonical | hreflang                                  | sitemap | JSON-LD                     |
| ------------------------------ | ---- | -------------- | --------- | ----------------------------------------- | ------- | --------------------------- |
| listed + index                 | 200  | index,follow   | self      | index 译文互返；index base 时含 x-default | 是      | 与可见内容一致              |
| listed + noindex               | 200  | noindex,follow | self      | —                                         | 否      | 可选，但必须与可见内容一致  |
| unlisted                       | 200  | noindex,follow | self      | —                                         | 否      | 可选，但必须与可见内容一致  |
| hidden / 未知 slug             | 404  | —              | —         | —                                         | 否      | 不生成该实体的结构化数据    |
| coming-soon + 实质内容 + index | 200  | index,follow   | self      | index 译文互返；index base 时含 x-default | 是      | 只描述已公开事实            |
| coming-soon + 空壳或待审核内容 | 200  | noindex,follow | self      | —                                         | 否      | 不输出误导性的产品/功能声明 |

矩阵的判断单位是一个具体 locale route，不是整个实体。同一状态矩阵必须驱动 route head、SSR smoke 和 sitemap 断言，不能在三个位置分别解释。

### 9.7 404 所有权与 Search Console 治理

发布目标不是把 Search Console 的 404 总数清零，而是让“站点主动发布或引用的 URL”意外 404 为零。实现和测试必须分开维护两类 inventory：

- **正向 published URL inventory**：固定公开 route、Catalog locale route、Header/Footer、首页、目录、Related、canonical、hreflang、sitemap、llms 和 legacy redirect target。任何意外 404 都阻塞发布。
- **负向 route fixtures**：unknown slug、hidden、未注册 locale、缺少同语言内容、非法 path 和无替代的永久删除 URL。它们必须返回真实 404/经决策的 410，并且绝不能进入正向 inventory。

按 URL 生命周期选择响应，不能为了报表好看篡改状态：

| 场景                                   | 响应与处理                                       |
| -------------------------------------- | ------------------------------------------------ |
| 页面真实、有实质内容但暂不允许收录     | `200 + noindex`，保持可抓取                      |
| URL 从未存在或该 locale 页面未注册     | 真实 404；不进入站内链接、sitemap、hreflang/llms |
| 已发布 URL 改名且存在真正等价页面      | 单跳 301 到返回 200 的当前 canonical             |
| 已发布 URL 永久删除且没有等价替代      | 真实 404 或经过集成验证的 410                    |
| 临时数据库、内容服务或部署故障         | 正确 5xx；不得误报成 404                         |
| 空壳、跨语言 fallback 或错误提示式页面 | 不得伪装成 200，避免 soft 404                    |

Search Console 的 `Not found (404)` 只作为来源诊断：优先修复由 sitemap、站内链接、canonical/hreflang、redirect target 发现的 URL，以及仍有外链、历史排名或自然流量的旧 URL。随机猜测、拼写错误和本就不应存在的地址可以保持真实 404；不得把它们批量跳转到首页、目录或另一语言，也不得用 robots.txt 隐藏报表。404 数量突然增长仍须排查 locale 机械扩增、筛选参数、错误链接或无限 URL 空间。

上线后的 404 记录至少包含 `url`、`locale`、`discoverySource`、`expected`、`lifecycle`、历史流量/外链证据、`action`、`owner`、`observedAt` 与 `resolvedAt`；没有固定数量阈值，任何正向 inventory 404 或 unexpected 404 突增都触发处理。

Google 当前指导同样要求优先修复站点自己链接或提交的 404，真实缺失内容使用 404/410，并避免持续消耗抓取的 soft 404。参考 [Page indexing report](https://support.google.com/webmasters/answer/7440203)、[404 errors](https://support.google.com/webmasters/answer/2445990) 与 [Crawl budget management](https://developers.google.com/crawling/docs/crawl-budget)。

## 10. 分阶段实施步骤

### 已完成：Blog 公共内容基础（2026-08-13）

1. 首页和公开导航已接入双语 Blog；仓库内 Markdown/MDX 只作为编辑源，正式发布内容从数据库读取。
2. Blog 列表支持分类筛选与服务端分页；卡片和文章详情显示分类。
3. 数据库文章以 `(slug, locale)` 保证每种语言一个版本；每篇文章必须选择 Paraglide 已注册语言，同一篇文章的译文共用 slug，后台不提供“全部语言/语言中立”发布选项。
4. 文章详情按“当前 locale + slug”精确查询；缺少该语言版本返回真实 404，不回退到 base locale 或空 locale。canonical、hreflang、OG/Twitter 与 `BlogPosting` JSON-LD 只描述真实文章。
5. sitemap 与 hreflang 只展开数据库中真实存在、已发布且仍在 Paraglide `locales` 内的版本；空 locale 和未注册语言不进入 sitemap、hreflang、`llms.txt` 或 `llms-full.txt`。
6. D1/SQLite 迁移 `drizzle/0002_brown_shockwave.sql` 已生成但未应用；该 SQL 不是 PostgreSQL/MySQL 通用迁移，生产必须按实际数据库方言单独生成、审阅后执行。
7. 本项目是新项目，没有已确认的历史 Blog URL 或语言中立内容，因此不增加 Blog legacy redirect、translation group 或数据迁移体系。若数据库意外出现空 locale 行，该行保持不公开，先在 Admin 明确归属一个已注册语言后才能发布。
8. Blog 语言枚举、后台选项、URL、hreflang、sitemap、日期和 Open Graph locale 均从 Paraglide 当前语言集合/BCP 47 locale 派生，不硬编码中英文；`vite.config.ts` 与 `i18n:check` 直接读取 `project.inlang/settings.json`。以后新增语言时按系统流程登记 locale、完整消息文件和语言名称，再创建对应语言文章；其他静态 MDX 页面仍须补同语言内容，否则保持 404 且不进入 sitemap。
9. 某语言尚无已发布文章时，该语言 `/blog` 保持可访问的 `200 + noindex,follow`，不进入 sitemap，也不参加 hreflang；出现第一篇已发布文章后自动进入对应发现面。分类筛选和第 2 页起的分页 URL 同样 `noindex,follow` 且不输出 hreflang，避免把功能性参数页机械扩展到所有语言。
10. Blog 详情页的语言选择器只在真实已发布译文存在时保留当前详情路径；目标语言缺少译文时进入目标语言 `/blog` 目录，不主动导航到已知 404。该 UX 回退不是 SEO 重定向，缺译文的详情 URL 仍保持真实 404，且不进入站内链接、hreflang 或 sitemap。
11. Blog 列表、详情和 sitemap 的数据库/内容服务异常按临时故障处理：权威 Blog 页面返回 503，并带 `Retry-After`；sitemap 返回 503 而不是静默输出缺少 Blog URL 的 200。首页 Blog 推荐区属于非权威装饰内容，可在故障时省略以维持首页可用性。

### 阶段 0：基线与可执行门禁

1. 运行 `git status --short` 并保存实施时工作树快照；若存在未提交实现，禁止覆盖 Agent/Skills/图片 runtime 文件。
2. 运行并保存 `pnpm test`、`pnpm build`、`pnpm exec tsc --noEmit` 和 `pnpm format:check` 基线结果；若仓库没有某类检查器，明确记录而不临时新增依赖。
3. 保存当前 root、首页、Pricing、静态页和 Blog 的 HTTP 状态、title、description、canonical、hreflang、robots、OG/Twitter、JSON-LD、robots.txt、sitemap 与 llms 响应快照，特别锁定 Blog Article 字段和现有 noindex 页面行为。
4. 建立不新增依赖的检查入口：`bundle:report-routes` 报告 route client JS/preload，`marketing:check-assets` 检查本地媒体禁入规则、R2 asset ref 与资源响应契约，`cf:dry-run` 或 `cf:check-budget` 检查 Worker/静态资产预算。阈值、`public/` 壳资源 allowlist 与 baseline 作为可审阅配置提交，缺失脚本不能以手工目测代替。
5. 记录当前 messages chunk 是否被根路由全量 preload、首页/代表页 Lighthouse 与首屏网络基线；公开营销模块的 import graph 同时扫描 `tDynamic`、runtime-built message key 和 eager 全量内容映射。
6. 保存当前 `public/` 的 48 文件/50.50 MiB 清单与代码引用，区分壳资源和历史页面媒体；建立复用现有 `R2Provider` 的幂等上传/typed asset ref 流程，补齐 cache metadata，要求 R2 与 `r2_domain`，缺失时 fail closed，先上传并在线验证，再提交页面引用。该流程只提交对象 key、公网 URL 和展示 metadata，不提交 R2 凭据，也不使用 `public/uploads` fallback。
7. 建立首轮 handoff、preset normalization、auth callback sanitizer 和现有 `/chat` 行为的回归测试。

### 阶段 1：locale-first URL 与 SEO 基础设施

1. 在 `src/config/catalog/` 新增共享类型、tool/model Catalog、`paths.ts`、`selectors.ts` 与 `legacy-routes.ts`，在 `src/config/seo/public-routes.ts` 登记固定公开文件路由的逐语言 index 状态；locale-free path 是唯一业务输入，沿用本项目和参考仓库的 `rewrite + urlPatterns + middleware`，禁止新增 `$locale` route、手拼 `/zh` 或生成不存在的 locale URL。
2. 建立 entityId/slug 唯一性、每语言 slug 冲突、related 引用、publication/availability/locale indexing/placement、legacy source/target 与 redirect chain/loop 校验。
3. 为 `catalogPath`、`catalogUrl`、`resolveCatalogRoute` 做正反向测试；固定路由、未来不同语言 slug、baseLocale 无前缀和中文 `/zh` 必须来自同一个 resolver 契约。
4. 实现 locale-aware home/directory/related/indexable/llms selectors；`selectIndexableUrls()` 直接返回真实 locale URL 记录，不允许从实体级 `indexing` 机械扩增语言。
5. 定义服务端 DeploymentReadiness 安全快照、受控 DetailPageVariant、optional sections 和重点页面 Block registry；registry 留在 blocks 层，Catalog 不保存 React 值。
6. 建立 `docs/marketing-pages-seo-map.md`，按页面、语言记录 SEO brief、query map、内链来源和工具页/模型页意图边界；所有新增 locale 页面先以 `noindex` 注册。
7. 实现统一 `src/lib/seo.ts`、绝对 URL 构造、JSON-LD 安全序列化和技术状态矩阵测试；迁移 root、Pricing、静态页与 Blog 的平行实现，同时保留 Blog Article 字段并修正任何 noindex 页面仍输出 alternates 的旧行为。
8. robots、sitemap、llms 与 legacy handlers 改用共享 URL 投影：sitemap 合并已登记固定 routes、Catalog locale URLs 和已发布 Blog URLs，去重后删除 `priority`/`changefreq`；公开 noindex 页面保持可抓取；`llms*.txt` 返回 `X-Robots-Tag: noindex`；私有 Disallow 覆盖所有真实 locale 前缀。

#### 阶段 0 → 阶段 1 实施检查点（2026-08-14）

- 阶段 0 与阶段 1 的代码和文档门禁已实施；基线、变更后 route bundle、Cloudflare dry-run 与 HTTP/SEO 结果记录在 `docs/marketing-pages-baseline.md`。
- Catalog、固定公开路由、URL/resolver/selectors、DeploymentReadiness、受控 variant/Block registry、SEO helper、JSON-LD serializer、robots/sitemap/llms 投影和 R2 营销素材发布契约均已有测试。当前 Catalog locale pages 只是 `noindex` 基础设施登记，在阶段 3/4 创建真实路由与同语言正文前不进入 sitemap、hreflang、llms 或导航；因此不会把尚不存在的 URL 暴露给 Google。
- 项目没有已确认的历史工具/模型 URL，`legacyCatalogRoutes` 保持空数组；没有凭空添加 redirect 或 410 handler。后续只有在证明旧 URL 曾公开后才登记，并由同一 Catalog target 校验。
- 隔离 SQLite 正向 smoke 已验证：en/zh Blog 列表和真实译文详情为 200，缺少中文译文的 `/zh/blog/english-only` 为真实 404 且不出现在 hreflang/sitemap；sitemap 13 个 URL 全部唯一，不含 noindex Catalog、`priority` 或 `changefreq`。
- 当前没有新增 R2 asset ref，所以离线 public/import graph 门禁通过，online asset inventory 为 0 项；没有为了测试上传或改动外部 R2 对象。Lighthouse 因仓库没有现成 runner/依赖仍明确标记为 `not verified`，留到有浏览器测量环境的视觉阶段执行。

#### Blog 图片实施检查点（2026-08-15）

- Admin → Posts 已接入封面和正文图片的专用 R2 上传流程；只接受 JPEG/PNG/WebP，记录真实宽高、MIME、字节数、alt/caption，并通过不可变 hash key 与公网 HEAD 验证阻断错误资源引用。
- 数据库不新增媒体表或列：版本化封面引用复用 `post.image`，正文继续保存 Markdown，受控图片语法携带完整展示元数据。公共 Blog SSR、Open Graph、Twitter 与 Article JSON-LD 消费同一封面引用，正文图片输出带固有尺寸的 `figure`。
- 发布时必须有封面；草稿可无图。手写/粘贴的普通 Markdown 图片、非配置 `r2_domain` URL、缺少 alt 或尺寸元数据的图片均不能通过 API 校验，因此不会进入公开页面或搜索发现面。
- hash 对象可跨引用复用，替换/移除文章图片时不在交互请求内直接删 R2。当前未实现 reference-aware orphan GC；若存量需要治理，应另做全库引用扫描、保留期和 dry-run 后再删除，避免破坏其他语言文章或正文共享对象。
- 本检查点不开放正文视频，也未在无凭据环境中写入真实 R2。自动验证覆盖图片字节解析、存储/Markdown round-trip、安全 SSR 和生产构建；上线前仍必须在目标 R2 配置下完成一次真实上传与 online asset check。

#### 首页、工具页与模型页实施状态（2026-08-15）

- 阶段 0/1 的 Catalog、resolver/selectors、SEO helper、固定公开路由、sitemap/llms 和 R2 检查底座已经落地；阶段 3 已为 `ai-image-generator` 增加真实同语言正文和路由，但工具/模型 locale route 当前仍全部保持 `noindex`。
- 阶段 2 的共享生成入口安全链路及 2.5 收口已经完成：`PromptLauncher` 已成为复用 `useGenerationEntry` + `GenerationWorkbench` 的兼容 wrapper，图片模型状态已贯通；服务端会从 `entryContext` 与精确语言正文共同重建 policy，并在 API/tool 两层执行锁定、附件来源与媒体复用约束。Agent guard/认证页/邮箱验证保留原 session callback，402 拒绝不会提前消费首轮 stash。
- 阶段 3 的首个工具纵向切片已经完成：`/tools`、`/tools/$slug`、纯 props Catalog 组件、工具 Blocks、精确语言 content manifest/resolver 和服务端 DeploymentReadiness 已存在；仅 `ai-image-generator` 有 en/zh 正文并可访问。详情展示层已按 image-generator 与 video-lite 双参考完成结构对齐，新增 typed 图片/视频媒体、动态平衡瀑布流、媒体预览、图文交错、工具/模型 show-card 网格与带前后导航、移动端文案卡的横向视频灵感轮播；四张工具卡会把真实工作流提示词带回 composer，模型区只显示并选择当前已接入的 GPT Image 2，不伪造其他模型或详情路由。阶段 4 模型详情切片尚未开始，`src/routes/models/*` 与 model content modules 仍不存在，Block registry 仍为空；marketing asset registry 已登记 15 张图片与 12 个带共享 poster 的视频，共 27 个经在线验证的 `ai-image-generator` R2 对象。
- 阶段 5 尚未开始：首页仍是旧的 `Header → Hero(PromptLauncher) → Blog → Footer → SupportWidget`，登录用户仍自动跳转 `/chat`。仓库中未接线的 `Features`、`ModelsStrip`、`Gallery`、`FAQ`、`CTA` 等旧/demo Blocks 不计为本计划首页实施，其中渐变 placeholder 不符合真实 R2 案例门禁。
- Header/Footer 和首页尚未接入 Tools/Models；`/tools` 已成为首个 Catalog directory 消费者，related selector 只输出具备同语言正文的目标。sitemap/llms 虽已接线，但因为 Catalog locale pages 均为 noindex，不输出这些 URL。
- 2026-08-15 案例扩容后全量 52 个测试文件/312 项测试、TypeScript、`pnpm format:check`、`pnpm build`、27 个 R2 对象在线检查、route bundle 和 Cloudflare 构建/dry-run/预算门禁均通过；中英文 1440px/390px 动态瀑布流、折叠展开、视口视频播放、poster 与弹窗已完成本地浏览器检查且无横向溢出。真实 OAuth/provider、浏览器生成 smoke、Lighthouse、更新后生产页面抓取与 Search Console 仍只在具备相应环境时执行，不能据此宣告阶段 4–9 已完成或开放索引。

### 已完成：阶段 2 共享生成入口安全链路（2026-08-15）

1. 在现有回归测试保护下抽取 controller/hook 与纯展示 `GenerationWorkbench`，保留 `/chat` 默认 wrapper 和当前默认行为。
2. 先贯通 `imageModelOption` 的 composer state、normalization、handoff、runtime settings、API validation 和 Agent tool context，再允许图片模型页声明 locked model。
3. 实现 modality-safe defaults/locks、input policy、设置优先级、临时/显式持久化分离和 source tracking；客户端 Catalog/preset 只用于 UI。
4. `POST /api/agent/chat` 根据 `entryContext` 重新解析服务端 policy，验证 entry/locale/execution/附件，并将 locks 传到 tool context，阻止显式工具参数绕过。
5. 抽取统一 callback sanitizer，修复匿名提交 → 登录/注册/验证/OAuth → 原 session 回跳并覆盖已登录分支。邮箱验证采用“原标签页保存 sessionStorage 并等待完成”的明确契约；验证标签页不能伪造或读取 payload，原标签页关闭后的数据不承诺恢复。

#### 阶段 2 实施检查点

- `GenerationWorkbench` 只负责展示，`useGenerationEntry` 管理内存设置、Skill、上传、首轮 stash 与跳转；`PromptLauncher` 显式启用原有的“设置变化即持久化”，营销工具/模型入口默认不持久化，并暴露 `saveSettingsAsDefault()` 作为唯一显式写入动作。
- `generationPresetFor()` 从客户端 Catalog 生成 modality-safe UI preset；它不进入服务端信任链。首轮 handoff 只携带 `home` 或 `tool/model + entityId + locale`，非法 context 不降级为 home。
- `POST /api/agent/chat` 先正规化客户端设置，再从服务端 Catalog 解析 `EffectiveGenerationPolicy`、验证 locale route/availability/execution、结构化附件与消息附件块，然后覆盖 locked modality/model。validated attachment snapshot 与 locks 一并传入 Agent tool context，显式 tool model/reference 参数无法换模态、换模型、超上限或引用未声明媒体。
- `imageModelOption` 已覆盖 composer 默认值与控件、持久化升级、handoff、runtime/API normalization、价格重算、系统 Prompt 和 `generate_image` tool fallback/lock；客户端价格字段仍会被服务端重算。
- Agent auth guard 保留当前 locale-free path + query；sign-in/sign-up、已登录分支、邮箱验证和 OAuth callback 共用 `sanitizeAuthCallback()`。验证邮件落到无 payload 的 completion page，只通过 `BroadcastChannel` 发信号；原标签页确认 session 后才回到原 `/chat/$sessionId` 消费 stash，验证标签页明确说明原标签关闭后无法恢复草稿。
- 自动验证覆盖 preset 优先级、图片模型规范化、handoff、Catalog policy、伪造 entry、附件绑定、tool 参数绕过、callback sanitizer 与跨标签 signal contract。真实 OAuth/provider 和浏览器跨标签 smoke 未在无凭据环境中伪造成功，留给有合法回调域的发布环境。

#### 阶段 2.5 安全与发布门禁收口（2026-08-15）

- 首轮与后续上传现在由服务端签发短期 HMAC media receipt，绑定 `userId + chatId + mediaType + exact URL + expiry`；空密钥、开发占位密钥、过期、篡改、超长或跨会话凭证均 fail closed。上传仍先完成鉴权、MIME allowlist 与 magic-byte 校验，去重对象也只为最终公开 URL 签名。
- Agent API 只接受当前有效 receipt，或 owner-scoped 同一 chat 中由历史 user audit metadata / 关联成功的内置媒体 tool result 证明过的精确类型与 URL。跨 chat Library 选择必须再次通过 owner-scoped source message 校验并签发目标 chat receipt；legacy text-only URL 不自动升级为可信附件。
- 当前 turn 的已验证媒体写入 user audit metadata，receipt 本身不持久化；工具只能从“当前已验证 + 同 chat 历史 allowlist”的并集中选引用。入口 minimum 只统计 policy 接受的媒体类型，tool 调用仍独立执行 minimum/maximum/type 校验。
- `POST /api/agent/chat` 在读取历史或校验媒体前先完成 owner、active lease 与 active task 门禁；402 不触发 client `onAccepted`，因此首轮 sessionStorage payload 保留供充值/订阅后重试。App 已登录分支与认证页继续共用 `sanitizeAuthCallback()`。
- Catalog policy 不再有正文 availability 默认值；生产调用必须显式注入 `isCatalogPageContentAvailable`。Sitemap 合并固定路由、Catalog 与 Blog 后统一去重并保留各自真实 `lastmod`；llms 标题/摘要来自精确语言正文投影。
- R2 发布验证统一检查精确 MIME、`inline`、immutable cache、对象字节数和视频 range；route gzip 基线增长超过 100 KiB 必须有非空审阅说明。Cloudflare dry-run 每次先清理旧产物，同时门禁 Worker gzip、静态文件数与单文件大小；Docker 发布依赖同一 quality-gates job。
- 收口验证通过 51 个测试文件/309 项测试、TypeScript、Prettier、生产构建、离线营销资源检查和 route bundle gate。清理后 Cloudflare dry-run 为 Worker gzip 2,207,282 / 2,516,582 bytes、235 / 250 个静态资产、最大静态文件 4,731,048 / 26,214,400 bytes。R2 inventory 当前为 0，因此真实 R2 online check、OAuth/provider、浏览器生成、Lighthouse、生产抓取与 Search Console 仍是外部待验证项；页面继续 `noindex`。

### 已完成：阶段 3 第一个工具纵向切片（2026-08-15）

1. 以已经作为 noindex 基础设施登记的 `ai-image-generator` 作为唯一开放切片；实现 `/tools`、`/tools/$slug`、同语言 content manifest/resolver、404 和统一 SEO head。其他工具即使已存在 Catalog definition，也必须在同语言正文与 route inventory 完成前保持不可发现。
2. 以这个真实页面实现最小目录卡片、详情 shell、案例 gallery、related 与 Workbench；组件只接收 props，不读 i18n、不访问 server modules。切片用到的图片、视频、poster 和分享图必须先进入 R2 typed asset ref，不得引用 `public/` 历史路径。
3. 长正文先测 bundle：若 Paraglide 不能让该 route 独享内容，则迁移到按 `slug + locale` 懒加载的类型安全 content module；不允许 fallback 到另一语言。
4. 运行该切片的 route inventory：en/zh 目录和详情为 200，missing/hidden 为 404，head/noindex/canonical 正确，页面产生的每个链接都能解析并返回预期状态。

#### 阶段 3 实施检查点

- `/tools` 和 `/tools/ai-image-generator` 已提供独立 en/zh SSR 页面。详情 loader 先解析 Catalog route，再从 `src/content/tools/pages/<entityId>/<locale>.ts` 约定目录自动发现并加载精确语言 content module；任一门禁缺失都返回真实 404，不回退到另一语言。新增工具/语言内容文件无需再手写 manifest loader，自动化测试遍历所有发现模块而不复制页面清单。
- Catalog selectors 强制注入同语言内容 availability；目录与 Related 无法仅凭 Catalog `listed` 输出内容缺失的 URL，Sitemap 与 llms 还会验证 lazy 模块确实可加载且导出身份匹配。详情语言切换使用内容-backed Catalog locale target，可支持各语言不同 slug；模型正文 resolver 尚未实现时保持 fail closed。
- 工具目录和详情组件只接收 props；Blocks 负责 i18n、Catalog preset、`useGenerationEntry` 与 `GenerationWorkbench` 接线。公开 readiness 只返回 Agent LLM、图片 Provider、模型 route 和存储是否配置，不向客户端序列化凭据。
- `ai-image-generator` 正文覆盖输入/输出、27 组媒体案例、步骤、功能、提示词指导、使用场景、限制、FAQ 和 CTA。15 张图片包含原有三张 Codex 生成图、四张复用自 legacy `public` 的生成案例，以及八张从已选公共示例视频提取的匹配 poster；十二个短视频作为未来视频工具页的临时组件预览，正文明确说明它们不是当前图片生成器的视频输出能力。全部媒体都先上传到 Admin Storage 指向的 R2 content-hash key，视频复用对应图片作为 poster，并验证公网状态、MIME、字节数、inline disposition、immutable cache 与 Range 206；中英文页面共享 typed asset ref、分别提供本地化 alt。案例数超过阈值时瀑布流自动折叠并显示“查看全部”，避免页面无界增高。当前仍没有专属分享图，因此社交 metadata 继续使用 summary card。
- 详情视觉层以双参考证据和组件规格为输入：`CatalogMedia` 同时接受带尺寸的图片与带 poster 的视频；图片案例使用按自然高度平衡的 3/2/1 显式 lane，密集视频案例使用 video-lite 的 4/3/2 CSS columns；`CatalogMediaFeatureList` 通过 `mediaPosition` 控制桌面左右交错、移动端统一媒体优先。媒体解释面板、四步卡、横向 snap 轮播、主题化媒体弹窗和宽版 CTA 已作为纯 props 组件落地，不读取 i18n/服务端模块，也没有引入任意 `sections[]` renderer。
- 四个开放 URL 均经生产 HTTP 快照验证为 `200 + noindex,follow + self canonical`，无 hreflang；目录输出可见 `BreadcrumbList`，详情输出与可见内容同源的 `BreadcrumbList + FAQPage`。`/tools/missing`、`/zh/tools/missing` 和尚未开放的 `ai-image-editor` en/zh URL 均为 404。
- 内容按语言拆成独立 client chunks（en 约 2.89 KiB gzip，zh 约 3.20 KiB gzip）；代表路由报告为 `/tools/` 约 362.7 KiB gzip、`/tools/$slug` 约 381.9 KiB gzip，根路由不 preload 工具内容。
- 案例扩容后全量 52 个测试文件/312 项测试、TypeScript、Prettier、生产构建、27 个 R2 对象在线检查、route bundle 与 Cloudflare build/dry-run/budget 均通过；`/tools/$slug` gzip 为 389,555 bytes、相对记录基线增加 7,325 bytes，Worker gzip 为 2,222,591 bytes，低于 free 预算 2,516,582 bytes，静态资产 235 / 250。中英文详情页继续为 `noindex,follow` 并只引用已验证 R2 媒体；桌面 3 列、移动单列、案例数量阈值折叠/展开、视频进入视口后播放、poster、视频弹窗和 1440px/390px 中英文无横向溢出均完成本地浏览器检查。更新后生产页面仍等待部署抓取。
- 页面继续保持 noindex，Header/Home、sitemap、hreflang 和 llms 发现面留到阶段 7。上线前还需在真实 Provider/Storage 配置下完成浏览器生成 smoke；加入案例/分享媒体时必须先走不可变 R2 typed asset 与 online check。

### 阶段 4：第一个模型纵向切片与克制抽取

1. 以已经作为 noindex 基础设施登记的 `gpt-image-2` 作为唯一开放切片；实现 `/models`、`/models/$slug`、运行时规格派生、安全 preset、DeploymentReadiness 与同语言 content manifest/resolver。其他模型保持不可发现，直到各自纵向切片完成。
2. 消费阶段 2 已完成的 locked image model 链路，并在真实模型页再次验证页面 UI → handoff → API policy → Agent tool context；任一环节回归时模型页保持不可提交。
3. 比较工具、图片模型两个真实消费者后，才抽取重复行为稳定的 SectionHeading、Steps、FeatureGrid、FAQList、FinalCTA 等；保留受控 variant/slot，不建设任意 JSON renderer 或巨型万能组件。
4. 重跑 en/zh route inventory、SEO/head、404、资源与 route client JS 检查，确认新增模型内容没有进入工具页或根路由 preload。

### 阶段 5：首页重组

1. 重写或补充现有扁平首页 blocks，接入已经验证的 locale-aware Catalog selectors、真实案例和 i18n；`src/routes/index.tsx` 只保留 loader/head 与 block composition。
2. 移除登录用户访问首页时的自动 redirect，保留安全的生成 handoff；校验首页 CTA、Header/Footer 预备链接都来自 route resolver。
3. 首页使用的现有示例素材先上传到 R2 并验证公网 URL，再替换引用；首屏只加载必要的 R2 图片/poster，below-fold 媒体 lazy load，重交互 Workbench 保持独立动态边界，检查 SSR 核心正文和内链仍存在。

### 阶段 6：逐页扩展工具与模型

1. 工具按 `image-to-video`、`text-to-video`、`ai-video-generator`、`background-remover` 等逐个纵向增加；模型按实际 runtime 支持逐个增加。每个 locale 版本独立经历 route/content/SEO/能力/资源/链接检查，不能一批机械扩增。
2. Background Remover 保持 beta 与限制说明；FLUX 在 runtime 真正支持前不注册 public locale routes。
3. 每页提供真实规格、案例、最佳场景、限制和 Prompt 指南，明确“任务意图”与“模型评估意图”；所有新增页面媒体先上传 R2 并登记 typed asset ref，只有改名的薄页保持 noindex 或不发布。
4. 每增加一个 locale page 就运行增量 route inventory；其 canonical/alternate/related/directory URL 必须反向解析到同一 entry，缺内容或缺路由立即 404 而不是语言 fallback。

### 阶段 7：发现面接线与按语言开放索引

1. Header、Footer、首页、目录、Related、sitemap 和 llms 全部消费同一 locale-aware resolver/selectors；禁止任何消费端自己拼 slug 或 locale 前缀。
2. 先构建正向 published URL inventory：固定公开路由、每个已发布 Catalog locale route、Header/Footer、目录、Related、canonical、hreflang、sitemap loc/alternate、llms 链接和 legacy target 均必须实际返回矩阵规定的非 404 状态；负向 fixtures 另组验证。
3. 只有某个具体 locale 页面通过内容、内部链接、能力、资源、canonical/hreflang reciprocal 和 SSR 检查后，才把该 locale 的 `indexing` 从 `noindex` 改成 `index`；另一语言不会自动跟随。
4. 索引开关后重新生成 sitemap/alternates 并全量验证：legacy source 不进入发现面，301 只能单跳到 200 canonical，gone 返回已验证的 410，其余 unknown/hidden 返回 404。

### 阶段 8：验证与视觉迭代

1. 单元测试和 Catalog 一致性测试必须覆盖所有 locale routes、正反向 resolver、selector、legacy 与非法状态组合，不能只抽样实体。
2. `pnpm test`、`pnpm exec tsc --noEmit`、`pnpm format:check`、`pnpm bundle:report-routes`、`pnpm marketing:check-assets` 全量通过。
3. `pnpm build` 通过，无新增 route/type warning。
4. 对两类 inventory 执行 SSR/HTTP smoke：正向 published URL inventory 中意外 404 必须为零，indexable/noindex 页面为 200，legacy 为单跳 301→200；负向 fixtures 中 gone 为 410，hidden/unknown/unregistered locale 为 404，至少显式断言 `/tools/missing`、`/zh/tools/missing`、`/models/missing`、`/zh/models/missing`。每个 200 HTML 页面恰有一组有效 title/description/canonical，OG URL 与 canonical 一致，hreflang 存在时 self + reciprocal，x-default 只指向真实 indexable baseLocale，robots/status 符合矩阵且 JSON-LD 可安全解析；生产输出不得含 localhost。
5. 桌面 1440px 与移动 390px 分别验证首页、目录、工具详情、图片模型详情、视频模型详情。
6. 覆盖 en/zh、light/dark、登录/匿名状态，以及邮箱登录、注册验证、OAuth callback contract 和已登录 callback 分支；验证邮箱跨标签页只通知原标签页继续消费 sessionStorage payload，原标签页关闭时显示明确不可恢复状态。仅在已配置合法回调域时执行真实 OAuth smoke。
7. 离线扫描确认新营销组件没有引用 allowlist 外的 `public/` 图片/视频；online asset inventory 对所有 R2 图片、视频、poster 和分享图验证 HTTPS `r2_domain`、200、MIME、缓存与体积，视频验证 range response。所有媒体请求无 404，交互无 console error。
8. 记录 Lighthouse 移动端基线与回归；以 LCP ≤ 2.5s、CLS ≤ 0.1 为实验室目标，上线后以真实用户 75 分位 INP ≤ 200ms 为目标。
9. 验证每个 OG/Twitter 图片 URL 可公开返回 200、尺寸/alt 完整；用 Rich Results Test 或 Schema Validator 检查代表性工具/模型详情页的 Breadcrumb/FAQ JSON-LD。
10. 对照参考站检查 section 节奏、内容密度、卡片层级和 CTA 清晰度，但不复制品牌资产与文案。
11. 运行 `pnpm cf:build` 和 `pnpm cf:dry-run`/`pnpm cf:check-budget`，记录 Worker gzip、startup time、静态资产数量/单文件大小并对比实施前基线；CI 中超出选定套餐内部预算即失败。
12. 记录每类公开路由的 client JS gzip、transitive preload 和首屏资源，确认 SSR 正文/内链存在、重交互与 locale content 按需加载，messages/所有 Catalog 内容没有被根路由全量预载，且相对阶段 0 无未解释的显著回归。

### 阶段 9：上线后 SEO 验证（不阻塞代码交付）

1. 在生产环境抓取代表性 en/zh URL，复核实际响应状态、rendered HTML、canonical/hreflang、robots、OG、JSON-LD、sitemap 和重定向。
2. 向 Google Search Console 提交 sitemap，并使用 URL Inspection 检查首页、目录、工具详情、模型详情和 Blog 代表页；没有访问权限时交付可执行清单并明确标记未验证项。
3. 上线后第 7 天与第 30 天检查收录、Google 选择的 canonical、抓取错误、查询/落地页分布和关键词蚕食。404 必须按发现来源和 URL 生命周期分类：站点自有来源立即修复，随机猜测/拼写错误记录为 expected；不以总数清零为目标，也不以“已提交 sitemap”代替收录结果。
4. 监测真实用户 Core Web Vitals；性能或收录异常作为独立修复任务处理。该运营阶段不阻塞仓库实现完成，但必须有 owner、日期和记录位置。

## 11. 可测试验收标准

### 架构

- 首页路由只负责 loader/head 和 block composition，不包含大段 section UI。
- `components/catalog/*` 不读取 `m`、Catalog、R2/Admin 配置或 server-only modules，所有项目文案在扁平的 `blocks/*` 与 content resolver 中组装。
- 不存在任意 JSON section renderer。
- 短 UI/metadata、Typed Catalog、route-local 长正文、Runtime 事实、R2 媒体和 Blog 数据库分别位于规定的权威源；Catalog/messages 不复制业务能力或整页长正文。
- 工具和模型 Catalog 无重复 entityId、同语言 slug 或失效 related 引用；每条 locale route 都能由 `catalogPath/catalogUrl` 生成并被 `resolveCatalogRoute` 反向解析。
- 每个非 hidden 模型的 runtime key 都能按 image/video modality 在对应运行时 Catalog 中解析。
- publication/availability/locale indexing/placement 不存在非法组合；unlisted/hidden 不能携带首页或目录 placement，未声明 locale route 不会因实体存在而凭空生成 URL。
- ToolDetailPage/ModelDetailPage 支持受控 variant 和专属 Block registry，Catalog 不能注入任意 React component。

### 显示规则

- listed 且当前 locale route/同语言 lazy content manifest key 存在的页面才出现在该 locale 首页或目录；related 只显示显式引用、存在、非自身、listed 且当前 locale route/内容存在的目标。
- 详情 loader 在 metadata 之前完成 Catalog route 与同语言内容双门禁；缺任一门禁即 404。任何 `indexing: 'index'` entry 必须由自动检查证明内容模块、文件路由、SSR 正文和发现面同时存在。
- sitemap 的 Catalog 部分只包含 `selectIndexableUrls()` 返回的 locale canonical；同一实体的另一语言处于 noindex、缺内容或未注册时不会被机械扩增。最终 sitemap 仍保留已验证的固定公开 routes 与已发布 Blog locale URLs，listed/noindex、unlisted、hidden Catalog 页面均不出现。
- unlisted 的已注册 locale route 可访问但包含 `noindex`；hidden、未注册 locale、缺少同语言内容和未知 slug 均返回 404。
- coming-soon 不显示可提交 Workbench；无实质预发布内容时必须 noindex。
- beta 页面显示限制说明和 Beta 状态。
- 临时 DeploymentReadiness 变化只影响 Workbench，不改变 publication/indexing 或 sitemap。

### 生成链路

- 首页默认模式不覆盖用户已有合法设置。
- 工具页可以锁定 mediaMode 和 input policy；模型 key 的类型与 image/video modality 一致。
- 模型页可以锁定对应模态的 modelKey，并只显示模型支持的参数。
- 工具/模型页面设置默认不写全局 localStorage，用户显式保存后才持久化。
- 匿名用户通过邮箱登录或 OAuth callback contract 后返回同一 `/chat/$sessionId` 并一次性消费原始 prompt/settings/skill/attachments；邮箱注册验证由保存 sessionStorage payload 的原标签页接收完成通知后继续，验证标签页不能读取/伪造 payload，原标签页关闭后的 payload 明确不保证恢复。已登录分支也尊重合法 callback。OAuth 未配置时以 mock/contract test 验证，真实 provider smoke 只在具备合法回调域时要求。
- callback sanitizer 拒绝外部 URL、协议相对 URL、编码绕过和认证页循环，同时保留合法 locale-free path 与 query。
- 每个 `listed + live` Workbench 在目标生产配置中通过 Provider、模型路由和存储能力预检；未就绪时不可提交并显示明确原因。
- 客户端 preset 不能修改积分、Provider、系统 Prompt 或工具权限。

### 内容与 SEO

- 首页包含 Hero、Tools、Models、Examples、Capabilities、Use Cases、How It Works、FAQ、CTA。
- 中英文短 UI/metadata 消息 key 完全一致，无页面硬编码主文案；长内容为每个已注册 locale 提供同语言模块且不会 fallback，public import graph 不使用 `tDynamic` 或运行时拼 message key。
- 每个 indexable 页面有按语言审核的搜索意图、query cluster、页面边界、内链来源和独特证据；工具页与对应模型页不存在未解释的关键词蚕食。
- 所有公开页面通过统一 helper 输出唯一 title、description、canonical、robots、Open Graph 和 Twitter Card；`og:url` 等于 canonical，生产输出不含 localhost。
- canonical 为当前语言 self URL；hreflang 只指向真实且可索引的语言版本，存在翻译组时互相返回，且仅在 base locale 版本真实存在并允许 index 时输出 x-default。
- 追踪参数不进入 canonical；分页和筛选参数按页面类型执行显式 index/canonical 策略，不被全局错误折叠。
- sitemap 合并固定公开 routes、Catalog 与已发布 Blog 的 indexable locale canonical URL，校验并去重，不输出 `priority`/`changefreq`；实验性 llms 端点只暴露允许公开发现的 locale URL 和内容，不泄露部署配置，标题/摘要来自同语言审核内容而不是 raw entityId 通用占位文案。
- `llms.txt` 和 `llms-full.txt` 返回 `X-Robots-Tag: noindex`；noindex 页面没有被 robots.txt 屏蔽。
- Sitemap 的 `lastmod` 来自真实内容更新时间或省略；已公开 slug 改名登记 `{ kind, locale, fromSlug }`，301 单跳到返回 200 的当前 canonical，永久删除仅在集成测试证明响应码后使用 410。
- 正向 published URL inventory 中意外 404 为零；负向 fixtures 返回预期 404/410，二者不得混用。Search Console 404 结论包含发现来源和生命周期，不以总数清零驱动无关重定向。
- `flux-schnell` 不出现在 live 模型列表。
- Background Remover 不承诺透明 PNG 或确定性抠图。
- 每个 listed 页面至少包含独特介绍、真实案例/Prompt、能力与限制、适用场景中的三类实质内容；仅名称替换的页面不得发布。
- Breadcrumb/FAQ/BlogPosting/WebSite/Organization JSON-LD 与页面可见内容和站点事实一致，通过共享 serializer SSR 输出；不生成页面中不存在的 FAQ、价格、评价、评分或虚构 schema。
- 本计划新增或实质改造组件的页面图片、视频、video poster，以及统一 SEO helper 输出的 OG/Twitter 图片，都来自配置的 HTTPS `r2_domain`，使用稳定、非签名的绝对 URL 并返回 200；图片具备正确尺寸和本地化 alt，视频具备 poster/range 响应。无稳定公开视频时不输出 `og:video`。

### 质量

- `pnpm test` 全部通过。
- `pnpm exec tsc --noEmit` 和 `pnpm format:check` 通过。
- `pnpm build` 成功。
- `pnpm bundle:report-routes`、`pnpm marketing:check-assets` 与 Cloudflare budget check 通过，阈值和基线可审阅。
- 正向 published URL inventory 的全部 en/zh URL 完成 200/301→200、noindex、canonical、hreflang、x-default 和 JSON-LD smoke且意外 404 为零；独立负向 fixtures 完成 404/410 smoke，`/tools/missing`、`/zh/tools/missing`、`/models/missing`、`/zh/models/missing` 明确为 404。
- 关键页面在 390px 无横向滚动，在 1440px 无异常大面积空白。
- en/zh、light/dark 均可读，所有交互可用键盘操作。
- 控制台无新增错误，页面媒体资源无 404。
- 新增或实质改造的公开营销组件不引用 allowlist 外 `public/` 图片/视频；所有登记的 R2 asset refs 通过离线 origin/metadata 检查与发布前 online response 检查，`public/` 总媒体体积不因营销页面实现而增长。
- 记录 Lighthouse 移动端基线且无显著回归；实验室 LCP ≤ 2.5s、CLS ≤ 0.1，上线后监测真实用户 75 分位 INP ≤ 200ms。
- 每类公开路由的 SSR HTML 包含 H1、核心正文和关键内链；client JS gzip、transitive preload 与首屏资源相对基线无未解释的显著增长，根路由不预载全部 locale Catalog 正文。
- Cloudflare dry-run 完成并记录体积；Free 目标 gzip ≤ 2.4 MB、Paid 目标 gzip ≤ 8 MB。
- 单次营销改造若增加超过 100 KB gzip，计划交付记录中包含来源分析和处理结论。

## 12. 风险与缓解

| 风险                                       | 缓解                                                                                                   |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| 覆盖当前未提交 Agent/Skills 改动           | 小步 `apply_patch`，先读当前文件；不替换整文件；每阶段检查 diff                                        |
| `PromptLauncher` 拆分导致现有 `/chat` 回归 | 先写回归测试；保留 wrapper；首页/工具/模型逐个迁移                                                     |
| 页面 Catalog 与 runtime 能力漂移           | 按模态验证 modelKey/preset；权威规格只从 runtime 导出；服务端派生部署就绪度                            |
| live 页面在目标部署缺少 Provider/存储      | 发布前能力预检；Workbench 就地禁用；不让瞬时就绪度扰动 sitemap                                         |
| callback 分支规则漂移或产生开放重定向      | 单一 sanitizer；登录/注册/验证/OAuth/已登录共用并测试攻击输入；验证 payload 只留在原标签页             |
| Background Remover 营销过度承诺            | beta 标识、限制说明；专用后端上线前不写透明 PNG 契约                                                   |
| 工具/模型状态在多个页面不一致              | 所有消费端共用 selector 模块，并调用各自的命名投影                                                     |
| listed、indexable 和 related 语义被混用    | 使用命名 selector 投影，并分别测试目录、关联、sitemap、llms                                            |
| Catalog 注册了 locale route 但正文不存在   | lazy content key manifest 双门禁；首页/目录/Related 过滤；详情在 head 前 404；index 发布校验阻断       |
| 大量双语文案进入全局 messages preload      | 报告 transitive preload；禁用动态 key；无法 route-local tree-shake 时改为按 slug+locale 懒加载内容模块 |
| 机械扩增 locale URL 产生大量 404           | locale route 显式登记；所有发现面共用 resolver；全量 route inventory 检查真实状态                      |
| 为清空 Search Console 批量错误跳转         | 区分正向 inventory 与负向 fixtures；按发现来源治理，禁止跳首页/目录/另一语言和 soft 404                |
| 首页 R2 媒体拖慢首屏                       | 首屏只加载必要图片/poster；below-fold lazy load；视频视口内播放；记录网络基线                          |
| 参考站视觉复制导致品牌同质化               | 只参考信息架构和密度，继续使用本项目主题 token、字体和组件语言                                         |
| 所有差异塞入一个组件导致 props 爆炸        | 公共 shell 只支持受控 variant；复杂页面通过专属 Block registry 扩展                                    |
| 页面大量复用造成内容同质、SEO 价值低       | listed 内容门槛；每页提供真实案例、能力限制、场景和 Prompt 指南                                        |
| 工具/模型增长推高 Worker bundle            | 动态路由、营销媒体固定外置 R2、避免根模块全量 import、每批次执行 dry-run 体积门禁                      |
| 新组件继续复制 `public/` 历史媒体          | allowlist + import scan 阻断；触碰即迁 R2；`public/` 媒体字节数增量门禁                                |
| R2 对象或公网域配置错误造成资源 404        | 强制 HTTPS `r2_domain`；先上传/验证后合并引用；全量 online asset inventory                             |
| 覆盖同 key 导致 CDN 旧内容或缓存污染       | content-hash/versioned key + immutable cache；内容变更发布新对象，不以 query string 失效               |
| 把 llms/FAQ schema 当成确定性 SEO 收益     | llms 保持实验性非阻塞；FAQ 只映射可见内容并以验证工具检查，不承诺富结果                                |
| 动态 route 各自手写 metadata 导致漂移      | 单一 `src/lib/seo.ts` 契约；状态矩阵驱动 head、SSR smoke 和 sitemap                                    |
| canonical/hreflang 语言或域名错误          | 绝对 URL 构造器、self/reciprocal/x-default 测试、生产环境无 localhost 断言                             |
| 工具页与模型页关键词蚕食                   | 每页/每语言 query map；发布前明确“任务意图”与“模型评估意图”的内容边界                                  |
| 虚构 Product/SoftwareApplication 数据      | schema 类型白名单；只从可见事实生成，不填虚假价格、评分或评价                                          |
| slug 改名造成链接资产丢失                  | locale-aware legacy registry；测试单跳 301→200、无 chain/loop；410 先做 Nitro 集成验证                 |
| 客户端 JS 与首屏媒体吞噬 CWV               | 分路由体积基线、重交互懒加载、SSR 核心内容、poster/尺寸/响应式图片                                     |
| 上线后无人验证真实收录                     | 指定 Search Console/RUM owner，在第 7/30 天记录索引、canonical 与 CWV                                  |

## 13. 完成条件与停止条件

只有满足以下条件才宣告实施完成：

1. 首页、工具目录/详情、模型目录/详情均按 Catalog 工作。
2. 当前真实模型和约定工具的每个 locale route、indexing、availability 与内容状态正确；未注册 locale、hidden 和 unknown slug 不会被任何发现面生成且真实返回 404。
3. 匿名首轮生成在登录/注册/原标签页邮箱验证/OAuth callback contract/已登录分支均按已声明的数据恢复边界安全回跳；具备合法回调域时完成真实 OAuth smoke，且所有 live Workbench 在目标部署通过能力预检。
4. 中英文、桌面/移动、light/dark 完成视觉检查。
5. `pnpm test`、`pnpm exec tsc --noEmit`、`pnpm format:check`、`pnpm build`、route bundle/assets/Cloudflare budget checks 全部通过；正向 published URL inventory 意外 404 为零，负向 fixtures 的 SSR/SEO/status smoke 全部符合矩阵。
6. Cloudflare dry-run 未突破选定套餐的内部体积预算，或已有书面原因与拆分方案。
7. 无已知 console error、资源 404、重复薄内容或公开能力虚假声明。
8. SEO 技术状态矩阵、搜索意图 map、legacy slug 策略和上线后第 7/30 天检查 handoff 均已有记录；外部平台未授权项明确标记为未验证而不是假定通过。

在用户明确要求开始实施前，本计划阶段不修改业务源代码。
