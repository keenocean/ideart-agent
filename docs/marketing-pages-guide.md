# 营销首页、工具页与模型页设计指导

本文定义 ShipAny TanStack 模板中公开营销页面的长期实现方式，适用于当前 Video Agent 项目，也适用于以后基于该模板创建的图片、视频、音频或其他 AI SaaS 项目。

目标不是制造一个可以解释任意 JSON 的页面系统，而是在以下四点之间保持平衡：

1. 页面可以快速复用和换品牌。
2. 工具和模型数量增加后仍然容易维护。
3. 重点页面可以做真实的内容与交互差异化。
4. Cloudflare Worker 代码体积和静态资源规模可测量、可控制。

## 1. 基本原则

### 1.1 继承 ShipAny 模板边界

```text
Routes
  负责页面组合、loader、head、canonical、hreflang、404
    ↓
Blocks
  负责项目文案、i18n、R2 素材引用、Catalog 与业务接线
    ↓
Components
  负责可复用的布局和交互，只接收 props
    ↓
Runtime
  负责模型、工具、积分、Provider、权限和实际执行
```

- `src/routes/*` 用代码表达页面 section 顺序。
- `src/blocks/*` 是项目内容包，允许在新项目中重写。
- `src/components/*` 是模板底盘，尽量跨项目保留。
- `messages/{en,zh}.json` 承载短 UI 与 metadata 文案；长正文只有在构建证明 route-local tree-shaking 时才放 messages，否则使用按 `slug + locale` 懒加载的类型安全内容模块。
- `src/config/catalog/*` 用 TypeScript Catalog 表达可发布实体。
- 模型、参数、积分和 Provider 继续以运行时 Catalog 为权威。

`/Users/jun/Github/shipany-tanstack` 只作为这套 locale rewrite 路径机制的实现参考：它同样让 route 保持 locale-free，再由 Paraglide 在 URL 层生成 `/zh`。它的 sitemap 静态列表、按 locale 机械扩增、`priority/changefreq`、静态页语言 fallback 和分散 metadata 属于较早实现，不复制到本项目；本项目以显式 locale route、统一 SEO helper 和真实 HTTP route inventory 为准。

### 1.2 不追求所有代码复用

复用的目标是减少重复维护，而不是把所有页面压进一个巨型组件。

建议按三层处理：

| 层级           | 是否长期复用 | 示例                                           |
| -------------- | ------------ | ---------------------------------------------- |
| UI primitives  | 是           | SectionHeading、FAQList、Steps、CardGrid       |
| Page shells    | 是           | ToolDetailPage、ModelDetailPage、DirectoryPage |
| Project blocks | 视项目重写   | HomeHero、案例、品牌内容、专属教程             |

普通详情页可把约 70% 公共骨架、30% 页面内容和变体作为内部设计启发，不把比例当作硬性验收指标；重点 SEO 页面可以有更多专属内容。

### 1.3 内容不是页面 JSON

本项目允许“内容数据化”，但不允许“页面解释器化”。长期内容边界如下：

| 内容/规则                                      | 权威位置                                          | 说明                                                          |
| ---------------------------------------------- | ------------------------------------------------- | ------------------------------------------------------------- |
| section 顺序、交互和特殊布局                   | Routes + Blocks                                   | React/TypeScript 显式 composition                             |
| 导航、按钮、状态、短标题、短 metadata          | `messages/<locale>.json`                          | flat JSON key；已知 key 静态调用                              |
| slug、发布状态、排序、related、variant         | `src/config/catalog/*`                            | Typed TypeScript，不保存长正文                                |
| 工具/模型介绍、案例、Prompt 教程、限制、长 FAQ | `src/content/<kind>/pages/<entityId>/<locale>.ts` | 可序列化 typed module，按实体与语言自动发现、懒加载并进入 SSR |
| 能力、参数、积分、Provider、权限               | Runtime/服务端                                    | 营销层只能派生和解释，不能重定义                              |
| 图片、视频、poster、OG/Twitter 图片            | R2 + typed asset ref                              | 内容源只保存已验证公网引用和展示 metadata                     |
| Blog 正文                                      | 数据库                                            | 按 `(slug, locale)` 发布与读取                                |

禁止使用包含任意 `sections[]`、component name、props 或 HTML 的通用页面 JSON。typed content module 可以包含数组化的 FAQ、Steps、案例和段落，但它只提供内容；React Block 仍决定这些内容是否出现、按什么顺序出现以及使用哪个受控 variant。

选择内容载体时按以下顺序判断：

1. 是否是 Runtime/产品事实？是则从权威运行时派生。
2. 是否是全站短 UI 或短 metadata？是则进入 messages JSON。
3. 是否是某个 slug/locale 独有的长正文？默认进入 route-local typed content module。
4. 只有 route bundle 报告证明长正文不会被首页或无关页面预载时，才允许继续放 Paraglide messages。
5. 媒体永远不以 Base64、大字符串或本地营销路径进入 TS/JSON。

## 2. 推荐目录

```text
src/
├── lib/
│   └── seo.ts
├── components/catalog/
│   ├── directory-card-grid.tsx
│   ├── example-gallery.tsx
│   ├── related-pages.tsx
│   ├── before-after-slider.tsx
│   ├── model-specs-table.tsx
│   └── detail-page-shell.tsx
├── config/catalog/
│   ├── types.ts
│   ├── tools.ts
│   ├── models.ts
│   ├── paths.ts
│   ├── selectors.ts
│   └── legacy-routes.ts
├── config/seo/
│   └── public-routes.ts
├── content/
│   ├── catalog-pages.ts             # Catalog × content 门禁与精确 locale target
│   ├── tools/
│   │   ├── manifest.ts
│   │   └── pages/<entityId>/<locale>.ts
│   └── models/                     # 阶段 4 沿用同一约定
│       ├── manifest.ts
│       └── pages/<entityId>/<locale>.ts
├── blocks/
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

无论有多少实体，都只有一条工具详情路由和一条模型详情路由，不为每个 slug 复制 route 文件。

`src/blocks/` 中可执行的 React Blocks 保持现有扁平结构，并用 `tool-*`、`model-*` 文件名前缀分组，不再添加 `blocks/marketing/`。序列化长正文统一放在 `src/content/<kind>/pages/`，不是新的 Block 层。Catalog 会被路由、目录、Related、Sitemap 和 llms 共同消费，使用 `config/catalog/` 比 `config/marketing/` 更准确。只有工具页和模型页真正共享的 durable 纯展示组件进入 `components/catalog/`；通用 section 组件在至少出现两个真实消费者后再抽取，避免预建无用抽象。

每个 kind 的 `manifest.ts` 只通过 `import.meta.glob(..., { eager: false })` 自动发现 `pages/<entityId>/<locale>.ts` 并建立动态 loader 索引。新增内容文件不再手写 manifest entry；manifest 必须校验 entityId 路径、路径语言属于 Paraglide locales，并在加载后校验导出的 entityId/locale 与路径一致。`src/content/catalog-pages.ts` 汇总各 kind 的精确语言 availability 与 locale-free target；未实现 content resolver 的 kind 必须 fail closed。manifest 可以回答某个 `kind + entityId + locale` 是否有正文并按需加载，但不得 eager import 全部内容，也不得反向依赖 React page shell。

## 3. Catalog 设计

### 3.1 发布、收录与能力状态分离

```ts
type Publication = 'listed' | 'unlisted' | 'hidden';
type Availability = 'live' | 'beta' | 'coming-soon';
type Indexing = 'index' | 'noindex';
type CatalogLocale = (typeof locales)[number];
type CatalogRouteSegment = string & { readonly __brand: 'CatalogRouteSegment' };

type CatalogLocaleRoute = {
  slug: CatalogRouteSegment;
  contentModifiedAt?: string;
};

type CatalogLocalePage = CatalogLocaleRoute & {
  indexing: Indexing;
};

type CatalogLocaleRoutes<T = CatalogLocalePage> = Partial<
  Record<CatalogLocale, T>
>;

type LocalePageState = {
  path: string; // locale-free、由真实文件路由接受
  indexing: Indexing;
  contentModifiedAt?: string;
};

type FixedPublicRoute = {
  id: string;
  localePages: Partial<Record<CatalogLocale, LocalePageState>>;
};

type CatalogVisibility =
  | {
      publication: 'listed';
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
      localePages?: CatalogLocaleRoutes<CatalogLocaleRoute>;
      placement?: never;
    };

type CatalogDefinitionBase = CatalogVisibility & {
  availability: Availability;
};
```

发布语义：

| 状态                 | 详情页 | 首页/目录 | Sitemap                           | Robots                           | Workbench                  |
| -------------------- | ------ | --------- | --------------------------------- | -------------------------------- | -------------------------- |
| listed + live        | 200    | 显示      | 仅显式 index 时收录               | 按 indexing                      | 按部署就绪度运行           |
| listed + beta        | 200    | 显示 Beta | 仅显式 index 时收录               | 按 indexing                      | 按部署就绪度运行并显示限制 |
| listed + coming-soon | 200    | 可显示    | 仅有实质预发布内容且显式 index 时 | 默认 noindex，内容审核后可 index | 禁用                       |
| unlisted             | 200    | 不显示    | 不收录                            | noindex,follow                   | 按能力与部署就绪度         |
| hidden               | 404    | 不显示    | 不收录                            | —                                | 无                         |

`publication` 决定实体发现性，`availability` 决定产品生命周期，`localePages[locale].indexing` 决定该语言 URL 的搜索收录，不能互相代替。没有登记的 locale route 就不存在；不得因为英文存在而生成中文 URL，也不得把英文正文 fallback 成中文 200。coming-soon 空壳页保持 noindex；只有该语言已经提供稳定、独特、可帮助用户的预发布内容时才允许 index。

首页、目录、Related、Sitemap 和 llms 文档必须共享同一个 locale-aware resolver/selector 模块和状态语义，但使用与消费场景匹配的命名投影：`selectHomeEntries(locale, isPageAvailable)`、`selectDirectoryEntries(locale, isPageAvailable)`、`selectRelatedEntries(entityId, locale, isPageAvailable)`、`selectIndexableUrls(isPageAvailable)`、`selectLlmsEntries(locale, isPageAvailable)`。availability 参数没有默认值，生产端统一传 `isCatalogPageContentAvailable`，从接口层阻止消费端只凭 Catalog 生成 URL。Related 只返回当前语言存在、显式引用、非自身、listed 且有正文的目标；Sitemap/llms 再通过 `selectLoadableIndexableCatalogUrls()` / `selectLoadableLlmsEntries()` 按需验证模块可加载且导出 identity 与路径一致，路径存在但模块错误时 fail closed。

路由继续沿用本项目和 `shipany-tanstack` 的 Paraglide 三段式机制：`vite.config.ts` 的 `urlPatterns`、`src/server.ts` 的 `paraglideMiddleware`、`src/router.tsx` 的 `deLocalizeUrl/localizeUrl` rewrite。route 文件、Catalog 和内部链接一律保存 locale-free path；不得新增 `$locale` route、手拼 `/zh` 或假定每个实体都有所有语言。`catalogPath`/`catalogUrl` 与 `resolveCatalogRoute(kind, locale, slug)` 必须共享同一映射并做正反向测试。

首页、Pricing、静态页、工具/模型目录等固定公开文件路由在 `src/config/seo/public-routes.ts` 以 `FixedPublicRoute` 登记逐语言 index 状态；校验必须证明 path 由真实文件路由接受。它们不伪装成 Catalog 详情实体，Blog locale URLs 仍由数据库发布状态查询产生。

TypeScript 的 `Partial<Record<...>>` 不能保证至少一个语言版本，因此注册校验必须拒绝空 `localePages`、同 kind/locale 重复 slug、非法 placement、指向不存在目标的 Related 和与 active slug 冲突的 legacy source。

### 3.2 Catalog 只描述页面映射

工具定义可以包含：

- 稳定 entityId 和每语言 slug/indexing
- publication / availability
- 首页和目录排序
- 关联工具
- R2 素材标识或类型安全 asset ref
- 页面变体
- 安全的生成预设
- 执行适配器类型

模型定义可以包含：

- 稳定 entityId 和每语言 slug/indexing
- runtime model key
- publication / availability
- 首页和目录排序
- 关联模型
- 页面变体和案例标识

Catalog 不得成为以下信息的权威来源：

- 价格与积分
- Provider model ID
- 系统 Prompt
- Agent tool permissions
- 任意 Skill 名称
- 模型分辨率、时长等运行时约束

这些信息应从 `src/lib/agent-settings.ts` 或服务端 Catalog 派生，并在服务端再次验证。模型引用按模态区分：图片使用 `AgentImageModelOptionValue`，视频使用 `AgentModelOptionValue`，不创建模糊两套约束的通用 key。

### 3.3 产品状态与部署就绪度分离

`availability: 'live'` 表示产品契约已经发布，不保证当前部署已经配置好 Provider、模型路由和对象存储。Workbench 必须读取服务端派生的安全能力快照，只向客户端返回 `executable` 和可公开原因，不返回凭据或内部模型映射。

- Reference-to-video 需要 gRouter、对应模型路由和对象存储。
- 一般视频生成也需要至少一个受支持 Provider 和对象存储。
- 瞬时就绪度只控制 Workbench，不改变 publication/indexing 或 Sitemap，避免 SEO URL 随配置或故障抖动。
- 上线前，目标生产环境中每个 listed/live Workbench 都必须通过能力预检；未就绪则降级状态或阻止发布。

## 4. 共享生成入口

当前生成式工具和模型页都使用 Agent 执行路径：

```text
营销页面 Workbench
  → 校验输入与安全 preset
  → 创建 sessionId
  → 保存 prompt/settings/skill/attachments
  → /chat/$sessionId
  → 自动执行首轮 Agent
```

不能跳到空的 `/chat`，必须跳到携带任务上下文的 `/chat/$sessionId`。

建议预设类型：

```ts
type GenerationPreset = {
  initialPrompt?: string;
  target:
    | { mediaMode: 'auto'; modelKey?: never }
    | { mediaMode: 'image'; modelKey: AgentImageModelOptionValue }
    | { mediaMode: 'video'; modelKey?: AgentModelOptionValue };
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

- 首页使用 default preset，不覆盖用户已有合法设置。
- 工具页可以锁定 mediaMode 和 input policy。
- 模型页使用与 image/video modality 匹配的 modelKey。
- 所有 preset 必须通过现有 normalization。
- 设置优先级固定为 runtime defaults → 合法持久化设置 → 页面 default 补缺 → 页面 locked 覆盖 → normalization。
- 工具/模型页的设置修改默认只作用于本次 handoff；用户显式保存为默认值后才能写全局 localStorage。
- input policy 只表达入口规则，`maximum` 只能收紧、不能放宽 runtime 上限；真实模型/operation 上限继续从 runtime 派生并由服务端验证。
- preset 不得修改积分、Provider、系统 Prompt 或工具权限。

`AgentComposerSettings.imageModelOption` 已在阶段 2 贯通 composer state、normalization、session handoff、runtime settings、API validation 和 Agent tool context。新增图片模型页必须使用 Catalog/Runtime 已登记的 `AgentImageModelOptionValue`；客户端字符串不能扩展模型 allowlist。

客户端 preset 不是安全边界。handoff 只保存稳定的 `entryContext`（`home` 或 `tool/model + entityId + locale`），`POST /api/agent/chat` 必须从服务端 Catalog 重新解析 `EffectiveGenerationPolicy`，验证 entry、locale route、execution 和真实附件，再在 normalization 后覆盖 locked media/model，并把约束传入 Agent tool context。未知或已下线 entityId 返回 400；工具显式参数也不能绕过锁定模型、模态或输入上限。积分、Provider、系统 Prompt 和 tool allowlist 始终以服务端 Runtime 为权威。

工具执行适配器保留两种方式：

```ts
const DEDICATED_TOOL_OPERATIONS = [] as const; // 当前没有专用 operation
type DedicatedToolOperation = (typeof DEDICATED_TOOL_OPERATIONS)[number];

type ToolExecution =
  | { kind: 'agent-preset'; preset: GenerationPreset }
  | { kind: 'dedicated-api'; operation: DedicatedToolOperation };
```

- 生成式图片、视频和编辑任务进入 Chat。
- 当前初始 Catalog 只能使用 `agent-preset`。未来确定性抠图、压缩、格式转换等工具先实现并验证服务端 operation，再把 literal 加入白名单，之后才允许留在当前页调用专用 API。

认证回跳必须使用一个共享的纯函数 sanitizer。Agent/App guard、sign-in、sign-up、verify-email 和 OAuth 均接受同站相对 callback，拒绝外部 URL、协议相对 URL、编码绕过和认证页循环；已登录分支也必须尊重合法 callback。首轮 prompt/settings/skill/attachments 只有在服务端接受 turn 后才从 sessionStorage 删除。

`sessionStorage` 不跨标签页。邮箱验证必须采用明确的原标签页契约：原标签页保存 payload 并通过 `BroadcastChannel`/受控轮询等待认证完成，验证标签页只完成验证和发送不可伪造为 payload 的完成信号；原标签页关闭后数据不保证恢复，并展示明确提示。若未来要求跨设备/关页恢复，应增加服务端 TTL pending-draft，而不是把 prompt/附件长期写入 localStorage。OAuth 没有可用凭据或合法回调域时以 mock/contract test 验证，只有环境具备条件时才要求真实 provider smoke。

### 4.1 阶段 2 已实现的调用边界

- 页面从 Catalog definition 调用 `generationPresetFor(definition)` 只生成 UI preset；服务端不接收整份 preset。
- 页面以 `useGenerationEntry({ entryContext, preset })` 获取 controller，再把其值和 callbacks 交给 `GenerationWorkbench`。默认只更新内存；只有显式调用 `saveSettingsAsDefault()` 才写全局 composer 设置。
- 旧首页和 `/chat` 继续通过 `PromptLauncher` 使用同一 controller，但 wrapper 显式保留原有设置持久化行为。
- handoff 中的 `entryContext` 必须是 `{ kind: 'home' }` 或 `{ kind: 'tool' | 'model', entityId, locale }`。非法 context 会使 handoff 失效；未知/下线 entityId 由 API 返回 400，不能回退为 home。
- `startRun()` 同时发送结构化附件摘要；API 将其与消息末尾附件块绑定并校验公开 URL、类型、数量、页面 policy 和模型 runtime 上限。服务端随后把 validated attachment snapshot 传到 tool context，Agent 显式参数只能使用已验证媒体。
- 工具/模型页进入 `/chat/$sessionId` 时不会把页面锁定设置写入全局 `localStorage`；home handoff 仍保持历史行为。
- 验证邮件 callback 指向无草稿数据的 completion page。completion page 只广播安全 callback identity，原标签页必须重新确认 session 后才能跳转并一次性消费自己的 stash。

阶段 2 的自动验证覆盖 46 个测试文件/267 项测试，并通过 TypeScript、Prettier 和生产构建。真实 OAuth/provider 与浏览器跨标签 smoke 只在有合法回调域和凭据的发布环境执行；不得用无凭据环境中的 mock 冒充真实 provider 成功。

### 4.2 阶段 3 已实现的工具页消费方式

首个 `ai-image-generator` 纵向切片已经把阶段 2 的生成入口放进真实公开路由，后续工具页沿用同一流程：

```text
/tools/$slug loader
  → resolveCatalogRoute('tool', locale, slug)
  → loadToolContent(entityId, locale)
  → 缺 Catalog route 或缺同语言 content 均 404
  → getImageToolReadinessFn() 返回无凭据的公开就绪快照
  → ToolDetail Block 读取 Catalog + i18n
  → useGenerationEntry({ entryContext, preset })
  → GenerationWorkbench
```

具体边界：

- `src/content/tools/manifest.ts` 用非 eager `import.meta.glob('./pages/*/*.ts')` 自动发现 `pages/<entityId>/<locale>.ts` 并保存动态 loader；没有发现同语言文件就不存在该语言页面，不能回退到另一语言，也不需要手写 loader entry。
- `/tools` 使用注入 `isCatalogPageContentAvailable` 的 `selectDirectoryEntries()`，再加载已经通过双门禁的卡片摘要。因此阶段 3 只展示 `ai-image-generator`，其他基础设施 Catalog 条目不会产生薄页或 404 内链。
- `src/content/tools/pages/ai-image-generator/{en,zh}.ts` 保存可序列化长正文；以后新增工具或语言遵守同一目录约定。内容模块不保存 React、任意 `sections[]`、执行权限、Provider 信息或 HTML。
- `src/components/catalog/*` 只接收 props；`src/blocks/tool-*` 负责 i18n、Catalog preset、Workbench controller 与项目接线。
- Workbench 根据服务端 `DeploymentReadiness` 禁用未配置部署中的提交，但临时就绪状态不修改 publication、indexing 或 sitemap。
- 页面设置默认只留在本次 handoff；用户点击“保存为默认设置”才调用 `saveSettingsAsDefault()`。
- `/tools` 和首个详情页当前均为 `200 + noindex`，无 hreflang、sitemap 或 llms 条目。阶段 7 完成发现面和生产发布门槛后，才能逐语言改为 index。
- 阶段 3 没有已在线验证的 R2 案例/分享图，因此只展示真实提示词案例并输出 summary card；禁止用本地占位图、渐变图或未上传 URL 冒充结果 gallery。未来添加媒体时必须先上传不可变 R2 key、登记 typed asset ref 并通过 online asset check。

阶段 3 的完成证据为：47 个测试文件/281 项测试、TypeScript、Prettier、生产构建、en/zh HTTP route inventory、营销资源检查和 Cloudflare build/dry-run/budget 全部通过；`/tools/` 与 `/tools/$slug` 已纳入 `config/marketing-quality.json` 的代表路由，`src/content/tools` 与 `src/routes/tools` 已纳入 import graph 扫描。后续工具页不能删除这些门禁或只靠浏览器目测验收。

## 5. 页面公共骨架与差异化

### 5.1 工具页公共结构

1. Breadcrumb 和状态
2. 工具标题与专用 Workbench
3. 输入要求和输出限制
4. 真实案例
5. How It Works
6. Features
7. Use Cases
8. Related Tools
9. FAQ
10. CTA

### 5.2 模型页公共结构

1. Breadcrumb、模态和状态
2. 模型标题与锁定模型的 Workbench
3. 从 runtime Catalog 派生的规格表
4. 真实示例和 Prompt
5. Strengths / Best For
6. 参数与 Prompt 指南
7. Related Models
8. FAQ
9. CTA

### 5.3 受控页面变体

差异化通过受控的 variant 和 optional sections 实现，不使用任意 JSON renderer：

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

重点页面还可以通过 Block registry 提供专属内容：

```tsx
<ToolDetailPage
  definition={tool}
  workbench={<BackgroundRemovalWorkbench />}
  primaryExample={<BeforeAfterSlider />}
  additionalContent={<BackgroundRemovalGuide />}
/>
```

普通页面走共享模板；只有确实需要特殊交互或深度内容的页面才增加专属 Block。

### 5.4 首页、工具页与模型页的复用矩阵

| 能力/组件                                        | 首页           | 工具页            | 模型页              | 复用边界                                       |
| ------------------------------------------------ | -------------- | ----------------- | ------------------- | ---------------------------------------------- |
| `GenerationWorkbench`                            | default preset | media/input locks | modality/model lock | 展示与 controller 共用，服务端 policy 分开重建 |
| Catalog card + `DirectoryCardGrid`               | 精选工具/模型  | 目录、Related     | 目录、Related       | 使用受控 `featured/directory/related` variant  |
| `ExampleGallery`                                 | 综合作品       | 任务案例          | 模型案例            | UI 共用，内容、Prompt、alt 按 locale 独立      |
| `SectionHeading`、`Steps`、`FAQList`、`FinalCTA` | 可用           | 可用              | 可用                | 至少两个真实消费者后抽取                       |
| `DetailPageShell`                                | 不使用         | 使用              | 使用                | 只提供 slots/布局，不读取项目文案              |
| `BeforeAfterSlider`                              | 可选           | 编辑类工具        | 可选                | 只展示真实 before/after 资产                   |
| `ModelSpecsTable`                                | 不使用         | 不使用            | 使用                | 规格从 Runtime 派生                            |

`HomeHero`、`ToolDetail`、`ModelDetail` 是三个独立 Block。它们可以共用 Workbench、卡片、Gallery 和 section primitives，但不能合并成一个带大量 boolean props、动态 component name 或任意 section 数组的万能 `MarketingPage`。

所有 durable component 必须：

- 只接收 props，不读取 `m`、Catalog、R2/Admin 配置或 server-only module。
- 不生成 slug、locale 前缀、canonical 或业务能力声明。
- 用稳定 slot 或有限 variant 表达真实差异；第三个以上互斥 boolean 出现前重新评估 API。
- 保持键盘、响应式、light/dark 和 reduced-motion 行为一致。

### 5.5 页面数据流与内容双门禁

首页使用显式 composition：

```text
index route loader
  → locale + fixed-route SEO state
  → selectHomeEntries(tool/model)
  → content manifest 过滤并加载当前语言卡片摘要
  → Home* Blocks
  → durable Components
```

工具/模型目录使用同一套卡片组件，但使用 directory selector 和目录密度：

```text
/tools 或 /models loader
  → selectDirectoryEntries(kind, locale)
  → content manifest 过滤 + 当前语言摘要
  → DirectoryPage / DirectoryCardGrid
```

动态详情页必须在 metadata 之前完成 route 与内容双门禁：

```text
/$kind/$slug loader
  → resolveCatalogRoute(kind, locale, slug)
  → loadCatalogContent(kind, entityId, locale)
  → readiness + related + Runtime projection
  → SeoHeadInput
  → project Block
  → shared shell/components
```

`localePages[locale]` 只表示 Catalog 有意注册该语言 URL，不证明正文存在。约定目录自动发现的 lazy content manifest 是第二道门禁：

- 首页、目录和 Related 只链接同时通过 Catalog 与内容门禁的 locale entry。
- 详情页缺 route、缺同语言内容、hidden 或 unknown 时在生成 head 前返回 404。
- `indexing: 'index'` 的自动检查必须证明 lazy content key、真实文件路由、SSR 正文和发现面全部存在。
- loaderData 只返回可序列化数据；React 值、message function、Provider 配置和 server-only 对象不进入 loaderData。
- sitemap/llms 从 Catalog index 状态与 exact-locale content 的交集投影，并在请求时验证 lazy 模块导出的 entityId/locale；即使误把缺正文 entry 切到 index，或内容文件 identity 写错，也不会生成 URL。发布 gate 仍必须把这种配置视为失败，而不是依赖静默过滤掩盖错误。
- 详情页语言切换使用每个内容-backed locale 的 Catalog path；不同语言 slug 可以不同。缺少目标语言正文或 Catalog locale route 时回到目标语言目录，直接访问缺失 URL 仍返回 404。

## 6. 差异化示例

### Background Remover

- upload-first Workbench
- Before/After Slider
- 主体类型和复杂边缘说明
- 背景替换 Prompt 建议
- 电商、头像、产品图案例
- 当前为生成式编辑的限制说明

在专用抠图 operation 上线前，不得承诺透明 PNG、alpha mask 或原图像素完全不变。

### Text to Video

- prompt-first Workbench
- 镜头、运动和风格 Prompt 结构
- 时长与分辨率说明
- 广告、电影感、社媒案例
- 视频模型选择建议

### Image to Video

- 输入图片和输出视频并列
- 运动幅度说明
- 主体一致性技巧
- 参考图和首尾帧建议

### GPT Image 2

- 图片模式 Workbench
- 多参考图编辑与组合案例
- 1K/2K/4K 和质量档位
- 文字渲染、品牌物料、商品图场景

### MiniMax H3 / Seedance

- 对应模型的真实分辨率、时长、音频和参考图能力
- 不同模型各自的最佳使用场景
- 参数和成本取舍
- 不做仅替换模型名称的重复页面

## 7. SEO 指导

共享 React 组件不会造成 SEO 问题。搜索引擎读取的是最终 HTML，关键是页面是否提供独特、准确、对用户有价值的内容。

SEO 实现分为三层：内容与搜索意图决定页面是否值得 index，统一 route head 契约决定爬虫和分享平台读到什么，状态矩阵与上线监测负责证明它持续正确。不能用补齐标签掩盖薄内容或重叠页面。

### 7.1 搜索意图与发布门槛

每个准备 `index` 的页面必须先建立按语言区分的 SEO 内容 brief：

- 主要搜索意图、query cluster 和用户决策阶段
- 次要问题与正文必须覆盖的主题
- canonical target，以及与相邻页面的内容边界
- 来自首页、目录、Blog、related cards 的内链来源和 anchor 策略
- 独特案例、Prompt、能力证据、限制和内容审核状态

工具页回答“如何完成某项任务”，模型页回答“该模型是否适合某场景”。例如通用 AI 图片生成器与 GPT Image 2、通用 text/image-to-video 与具体视频模型页面不能用近似标题和正文争夺同一查询。

新增 listed locale page 默认 `localePages[locale].indexing: 'noindex'`。只有该语言满足以下条件后才单独切换为 `index`：

- SSR HTML 有唯一 H1、实质正文、真实案例/Prompt、能力和限制。
- 搜索意图明确，和相邻页面不存在未解释的关键词蚕食。
- 关键页面能从首页、目录、Blog 或 related cards 通过描述性 anchor 到达。
- route metadata、sitemap 和状态矩阵测试通过。
- 当前语言是真实本地化内容，而不只是补齐 message key。

`alternates` 只记录具备实质内容且允许 index 的真实语言版本，并为每种语言保存准确的 locale-free canonical path；翻译缺失或仍为 noindex 时不要输出对应 hreflang。显式 path 也能兼容未来不同语言使用不同 slug。

### 7.2 统一 route head 契约

`src/lib/seo.ts` 作为唯一 metadata 构造入口，统一输出 TanStack Router 的 `head.meta`、`head.links` 和 `head.scripts`。路由不分别手写 canonical、hreflang、Open Graph 或 JSON-LD。TanStack Router 只明确去重 title/meta，canonical、hreflang 和 JSON-LD 的唯一性必须由 helper 与 SSR 测试保证。

```ts
type SeoRouteRef = {
  locale: (typeof locales)[number];
  // locale-free、已经被真实 route resolver 接受；不含 origin/query/hash。
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

固定首页、目录、Pricing、静态页与 Catalog 详情都先产生 route-backed `SeoRouteRef`。`buildSeoHead()` 不接受调用者传绝对 canonical 或手拼 locale URL；它验证 locale-free path，使用 `localizeUrl()` 和 `VITE_APP_URL` 生成绝对 URL。生产环境拒绝 localhost、错误协议、重复斜杠和不一致 trailing slash。只剥离已登记 tracking 参数；分页、筛选等功能 query 由页面传入显式 search policy。

动态路由的 loader 先读取 locale，以 `resolveCatalogRoute(kind, locale, slug)` 精确解析 definition，再加载同 locale 内容；语言版本缺失、内容模块缺失、hidden 或未知 slug 在生成 head 前 `throw notFound()`，不得 fallback 到英文。loader 只返回可序列化数据，route `head({ loaderData })` 再调用 `buildSeoHead(loaderData.seo)`。React 值、message functions 和 server-only 对象不得进入 loaderData。

`indexing === 'noindex'` 时 helper 强制不输出 hreflang；index 页面 alternates 必须包含 self，且只来自 resolver 确认存在并允许 index 的 locale routes。`x-default` 只在真实 indexable baseLocale route 存在时添加。Article 分支保留 Blog 的 published/modified/author，统一 helper 迁移不能退化为 website metadata。

根路由维护站点级默认项；子路由维护页面级 title、description、URL 和图片。最终 head 中每种页面级标签只保留一份，不依赖覆盖顺序制造重复项。

### 7.3 Canonical、hreflang、robots 与 sitemap

- 唯一内容页使用 self-referencing canonical：英文保持 locale-free URL，中文使用 `/zh`，中文不得 canonical 到英文。
- canonical 和 alternate 使用基于生产 `VITE_APP_URL` 的绝对 HTTPS URL，去掉 hash 和追踪参数，并遵守统一 trailing-slash 规则。分页、筛选等功能参数必须有显式 index/canonical 策略，不能由通用 helper 一律删除。
- hreflang 只在当前页及目标语言页均可索引时输出，并包含当前页自身；同组页面必须 reciprocal。只有 baseLocale 版本真实存在且允许 index 时才输出指向它的 `x-default`。
- noindex 页面可保留 self-canonical，但不进入 sitemap。不要用 robots.txt 屏蔽 noindex URL，否则爬虫看不到 noindex 指令。
- `robots.txt` 只用于抓取预算，不是删除或保密机制。公开 listed/unlisted/noindex 页面和 `llms*.txt` 保持可抓取；私有 `/chat`、`/admin`、`/settings` 依靠认证和 HTML noindex，API 依靠认证。若额外 Disallow 私有路由，必须覆盖实际 locale 前缀，不能漏掉 `/zh/...`。
- 最终 sitemap 合并三类已验证 locale canonical URL：显式登记且允许 index 的固定公开 routes、Catalog `selectIndexableUrls()`、数据库中的已发布 Blog URLs。合并后统一校验和去重，不能因为接入 Catalog 而丢掉首页、Pricing、静态页或 Blog。`lastmod` 使用真实内容更新时间，没有可靠值时省略，禁止写构建时间；新实现不输出 `priority`/`changefreq`。
- 已发布 URL 生命周期登记在 `src/config/catalog/legacy-routes.ts`，以 `{ kind, locale, fromSlug }` 精确匹配。重命名只允许单跳 301 到返回 200 的 resolver canonical；永久删除只有在 TanStack/Nitro 集成测试证明 410 后使用。legacy source 不得进入目录、Related、hreflang、sitemap 或 llms。
- hidden、未注册 locale、缺少同语言内容和未知 slug 返回 404，不生成实体 metadata。
- `llms.txt` 和 `llms-full.txt` 是实验性发现端点，不是搜索引擎标准或发布阻塞项；只输出 `selectLlmsEntries` 允许公开发现的内容，并返回 `X-Robots-Tag: noindex`，同时保留缓存、体积和转义边界。标题与摘要来自同语言、已审核的内容投影，不以 raw entityId 加通用 “Published page” 文案代替真实内容。

### 7.4 Open Graph 与 Twitter Card

- 工具、模型、首页和目录页使用 `og:type=website`；Blog 使用 `article`。
- 页面输出 localized title/description、`og:url`、站点名、图片 URL/alt/width/height/type、`og:locale` 和真实 alternate locales。
- 维护类型安全的 app locale → Open Graph locale 映射（当前项目如 `en → en_US`、`zh → zh_CN`），不要把 Paraglide 的短 locale code 原样写进 `og:locale`。
- `og:url` 必须等于当前语言 canonical；Twitter 输出 `summary_large_image`、title、description、image 和 image alt，并复用同一数据源。
- 图片必须是配置的 HTTPS `r2_domain` 下公开、绝对、稳定且返回 200 的 URL。优先使用 1200×630 专属图，没有时回退到经过验证的 R2 站点默认图；禁止 localhost、R2 S3 API endpoint、临时签名 URL、需认证或缺失资源。
- 没有稳定、公开、适合分享的视频时不输出 `og:video`。Open Graph 优化分享呈现，不构成排名保证。

### 7.5 Structured data

- 根路由维护真实的 `WebSite`/`Organization`。
- 目录和详情页的 `BreadcrumbList` 必须与可见 breadcrumb 一致。
- 只有页面完整展示来自同一内容源的对应问答时才输出 `FAQPage`；它是可选语义增强，不承诺普通商业站点获得 FAQ 富结果。
- Blog 使用与可见文章一致的 `BlogPosting`。
- 不得虚构 `Product`、`SoftwareApplication`、价格、评分、评价或不存在的 AI 模型 schema。只有业务事实和 Google 必填字段都满足时才引入相应类型。
- JSON-LD 必须在 SSR HTML 中输出、可解析，并通过共享 serializer 将 `<` 转义为 `\u003c`，防止 `</script>` 注入。现有 root 与 Blog 的局部 serializer 应迁移到 `src/lib/seo.ts`。

代表性页面使用 Rich Results Test 或 Schema Validator 验证；通过表示语法和资格满足规则，不保证搜索结果一定展示富结果。

### 7.6 技术状态矩阵

| 页面状态                       | HTTP | robots         | canonical | hreflang                                  | sitemap | JSON-LD                    |
| ------------------------------ | ---- | -------------- | --------- | ----------------------------------------- | ------- | -------------------------- |
| listed + index                 | 200  | index,follow   | self      | index 译文互返；index base 时含 x-default | 是      | 与可见内容一致             |
| listed + noindex               | 200  | noindex,follow | self      | —                                         | 否      | 可选，但必须与可见内容一致 |
| unlisted                       | 200  | noindex,follow | self      | —                                         | 否      | 可选，但必须与可见内容一致 |
| hidden / 未知 slug             | 404  | —              | —         | —                                         | 否      | 不生成实体数据             |
| coming-soon + 实质内容 + index | 200  | index,follow   | self      | index 译文互返；index base 时含 x-default | 是      | 只描述已公开事实           |
| coming-soon + 空壳/待审核      | 200  | noindex,follow | self      | —                                         | 否      | 不输出误导性功能声明       |

矩阵判断单位是一个具体 locale route，不是整个实体。route head、SSR smoke 和 sitemap 必须共同遵守这张矩阵，禁止各自维护另一套解释。

### 7.7 404 所有权与 Search Console 治理

不要把 Search Console 的 404 总数当作必须清零的 SEO KPI。发布与监测需要分开维护：

- **正向 published URL inventory**：固定公开 route、已发布 Catalog locale routes、Header/Footer、目录、Related、canonical、hreflang、sitemap、llms 和 legacy redirect targets。该集合的意外 404 必须为零。
- **负向 route fixtures**：unknown slug、hidden、未注册 locale、缺少同语言内容、非法 path 和无替代的永久删除 URL。它们必须返回真实 404/经决策的 410，并且不能出现在正向 inventory。

状态选择：

| 场景                                   | 正确处理                             |
| -------------------------------------- | ------------------------------------ |
| 页面真实、有实质内容但暂不允许收录     | `200 + noindex`，保持可抓取          |
| URL 从未存在或当前 locale 页面未注册   | 真实 404；不输出任何站内发现信号     |
| 已发布 URL 改名且有真正等价页面        | 单跳 301 到返回 200 的当前 canonical |
| 已发布 URL 永久删除且没有等价替代      | 真实 404 或经集成验证的 410          |
| 临时数据库、内容或部署故障             | 正确 5xx；不得误报 404               |
| 空壳、跨语言 fallback 或错误提示式页面 | 不得伪装成 200，避免 soft 404        |

Search Console 中的 404 按发现来源治理：sitemap、站内链接、canonical/hreflang、redirect target 产生的必须修复；仍有外链、历史排名或自然流量的旧 URL 要恢复或跳到真正等价页面；随机猜测、拼写错误和本就不应存在的 URL 可以保持 404。禁止为了清空报表把它们批量跳到首页、目录或另一语言，也不要用 robots.txt 隐藏。若 404 突然增长，排查 locale 机械扩增、筛选参数、错误链接和无限 URL 空间。

生产 404 记录至少保存 `url`、`locale`、`discoverySource`、`expected`、`lifecycle`、历史流量/外链证据、`action`、`owner`、`observedAt` 和 `resolvedAt`。不设置脱离来源的固定总量阈值；任何正向 inventory 404 或 unexpected 404 突增都触发处理。

Google 当前指导要求优先修复站点自己链接或提交的 404，真实缺失内容使用 404/410，并避免 soft 404 浪费抓取。参考 [Page indexing report](https://support.google.com/webmasters/answer/7440203)、[404 errors](https://support.google.com/webmasters/answer/2445990) 与 [Crawl budget management](https://developers.google.com/crawling/docs/crawl-budget)。

### 7.8 Blog 内容层

Blog 以 SEO 为第一目标，正文只从数据库读取：

- 数据库文章使用 `(slug, locale)` 唯一键；每篇文章必须保存一个 Paraglide 已注册语言，空 locale 不是公开内容状态。
- 同一篇文章的各语言译文共用 slug，并按“当前 locale + slug”精确查询。当前语言版本不存在时返回真实 404，不回退到 base locale 或空 locale。
- 可用语言从 Paraglide `locales` 动态派生，不在 Blog 代码中硬编码 `en/zh`。`vite.config.ts` 的 locale path patterns 与 `pnpm i18n:check` 都读取 `project.inlang/settings.json`；新增系统语言、完整消息文件和 `localeNames` 后，Admin 选项、日期格式、Open Graph locale、hreflang 和 sitemap 随语言集合扩展。只有真实创建并发布的该语言文章才产生发现信号；静态 MDX 缺少该语言内容时保持 404 且不得进入 sitemap。
- 空 locale 或已从系统移除的语言行不得出现在公开列表、文章 hreflang、sitemap、`llms.txt` 或 `llms-full.txt`；必须先在 Admin 归属到当前受支持语言才能公开。
- 某语言没有已发布文章时，该语言 Blog 首页返回 `200 + noindex,follow`，不进入 sitemap 且不输出 hreflang；发布第一篇该语言文章后才自动开放这些发现信号。
- 分类筛选和第 2 页起的分页 URL 是可用但不收录的功能页：保持 `200 + noindex,follow`、self canonical，不输出 hreflang，也不进入 sitemap。
- 详情页语言选择器只对真实译文保留当前 slug；缺少目标语言译文时切到目标语言 `/blog`。这只是用户导航回退，不创建 SEO redirect；直接请求缺译文详情仍返回 404。
- 数据库或内容服务临时不可用时，Blog 列表、详情和 sitemap 返回 503（建议带 `Retry-After`），不得伪装成空列表 200、文章 404 或缺少 Blog URL 的静态 sitemap 200。首页的非权威 Blog 推荐区可以省略以保护首页可用性。
- 分类在公共层统一为稳定 `slug + title`，URL 只使用 slug，显示名称可以本地化。
- 列表分页和分类筛选由 server function 完成，不把数据库模块导入组件。
- Markdown/MDX 可以保留为仓库外或 `src/content/posts/` 下的编辑源，但运行时代码不得 import；发布必须通过 Admin → Posts 写入数据库。
- `pnpm blog:check-bundle` 会拒绝任何本地文章运行时引用，生产与 Cloudflare 构建都会自动执行该检查。

数据库迁移按 provider 管理：仓库当前生成的 `drizzle/0002_brown_shockwave.sql` 仅适用于 D1/SQLite。PostgreSQL 或 MySQL 部署必须使用对应 provider 重新生成并审阅迁移，不能执行该 SQLite SQL。

文章详情必须输出 canonical、仅指向真实译文的 hreflang、Open Graph、Twitter Card 和 `BlogPosting` JSON-LD。`sitemap.xml` 每种可用语言输出独立 `<url>`，Blog 目录只为至少有一篇已发布文章的语言输出；`llms-full.txt` 应包含正文并避免逐篇数据库查询。发现性端点使用短期共享缓存，降低爬虫对数据库的重复读取。

发布文章时必须同时：

1. 在 Admin → Posts 明确选择一个当前已注册语言，创建数据库文章并设为 `published`；同一文章的其他语言版本使用相同 slug 分别创建。
2. 填写标题、唯一描述、封面、作者、分类和完整正文。发布状态必须有封面；草稿可以暂时没有。
3. 封面和正文图片都通过 Admin 的 Blog 图片入口上传，不手填 URL。先填写合法 slug，再选择 JPEG、PNG 或 WebP 文件，并为每张图片填写与当前语言一致的 alt；caption 可选。
4. 验证 SSR 文章页、canonical、结构化数据、sitemap、`llms.txt` 与 `llms-full.txt`。

Blog 图片发布契约：

- 专用接口 `POST /api/admin/posts/media` 只允许 Admin 上传单张 JPEG、PNG 或 WebP，单文件上限 10 MiB；服务端根据文件字节读取真实固有宽高，拒绝 MIME 不匹配、损坏、超大边长或超大像素图片。
- 接口只使用已配置的 R2 与 HTTPS `r2_domain`，不调用通用上传接口，也不回退 `public/uploads`。对象 key 为 `marketing/blog/<slug>/<sha256>.<ext>`；重复内容复用同一对象。
- 上传完成后服务端对公网 URL 执行 `HEAD`，验证 200、MIME、字节数和 `public, max-age=31536000, immutable`；任一项失败都不把资源写入文章。
- 封面在现有 `post.image` 文本字段中保存版本化、类型安全的图片引用；正文仍保存 Markdown，但图片必须使用编辑器生成的受控语法，同时携带 URL、MIME、字节数、宽高、alt 和可选 caption。这样不新增数据库列，也不允许手写 Markdown 图片绕过发布校验。
- 保存草稿或发布时，API 会重新验证封面和正文所有图片都属于当前配置的 `r2_domain`；已发布文章缺少封面、正文存在非受控图片或任一 URL 越界时保存失败。
- 公共列表和详情页从同一图片引用渲染真实宽高与 alt；正文图片 SSR 为 `figure/img/figcaption`，below-fold 使用 lazy loading。封面保留 eager 默认以避免延迟潜在 LCP，并把同一封面元数据传给 Open Graph、Twitter 与 `BlogPosting`。
- 替换或移除引用时不在保存请求内同步删除旧对象：相同 hash 对象可能被其他语言文章或正文复用。当前以内容寻址去重控制增量空间；如后续需要清理，必须基于全库引用清单与保留期做独立 R2 GC，禁止按单个表单动作直接删除。
- 当前只实现图片。正文视频在明确 poster、字幕/文本替代、range、尺寸与编辑格式契约前不开放，不能用手写 HTML 或 Markdown 绕过。

SEO 发布门槛：

- 只有标题和一段替换文案的页面不得 listed。
- 没有真实运行能力的页面必须标记 beta/coming-soon。
- coming-soon 空壳页必须 noindex；只有通过内容审核的实质预发布页才允许 index 并进入 Sitemap。
- 同一内容只保留一个 canonical URL。
- unlisted 页面输出 `noindex,follow`。
- hidden 页面返回 404。

参考：

- [Google SEO Starter Guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide)
- [Creating helpful, reliable, people-first content](https://developers.google.com/search/docs/fundamentals/creating-helpful-content)
- [TanStack Router document head management](https://tanstack.com/router/latest/docs/guide/document-head-management)
- [Canonical URL guidance](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls)
- [Block indexing with noindex](https://developers.google.com/search/docs/crawling-indexing/block-indexing)
- [Breadcrumb structured data](https://developers.google.com/search/docs/appearance/structured-data/breadcrumb)
- [Structured data general guidelines](https://developers.google.com/search/docs/appearance/structured-data/sd-policies)
- [Software app structured data](https://developers.google.com/search/docs/appearance/structured-data/software-app)
- [Build and submit a sitemap](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap)
- [Localized versions and hreflang](https://developers.google.com/search/docs/specialty/international/localized-versions)
- [FAQ rich result availability](https://developers.google.com/search/blog/2023/08/howto-faq-changes)
- [Open Graph protocol](https://ogp.me/)
- [llms.txt proposal](https://llmstxt.org/)
- [Core Web Vitals](https://web.dev/articles/vitals)

## 8. Cloudflare Worker 体积控制

工具和模型数量增加时，主要增长来源是被打进 Worker 的代码和文本，不是 URL 数量。动态 `$slug` 路由不会随条目数量复制路由模块。

### 8.1 资源放置

- 新增或实质改造的公开营销组件所展示的图片、视频、video poster、Blog 封面与 OG/Twitter 分享图全部放 Cloudflare R2，通过配置的 `r2_domain` 公网地址显示；文件大小不构成继续放 `public/` 的理由。
- `public/` 只保留 favicon、manifest icon 等必须随站点壳同源启动的浏览器资产，以及不属于公开营销内容的功能性小图标。页面、Blog 或 metadata 中使用的 logo 不属于例外；现有本地页面媒体是待迁移历史资产，不能作为新组件的复制来源。
- 旧页面完全未触碰时可暂时保留现状；新组件复用旧素材或旧页面被实质改造时，先把所用对象上传 R2、验证成功，再替换成本地化内容/Catalog 中的 typed asset ref。不得在生产代码中静默 fallback 到 `public/`。
- 不把大图片转为 Base64 写入 TS/JSON。
- 不把完整视频或大型案例数据 import 到 Worker 全局模块。
- Blog 正文固定存入 D1/Postgres 等外部数据层，不随 Worker 代码部署；封面和正文媒体固定放 R2。
- 避免根模块一次性 import 所有页面专属组件。

R2 URL 与对象规则：

- `r2_domain` 必须配置为可匿名访问的 HTTPS custom domain/CDN。`R2Provider` 未配置 public domain 时回退的 `*.r2.cloudflarestorage.com` S3 API endpoint 不是页面交付地址；临时 signed URL 也不能进入页面、sitemap、JSON-LD 或社交 metadata。
- 现有通用上传接口在未配置存储时会写入 `public/uploads`，并且尚未暴露 cache metadata；这是运行时/本地开发兼容路径，不是营销素材发布路径。营销上传流程必须补齐缓存 metadata，并在 R2 或 `r2_domain` 缺失时 fail closed。
- Blog 图片已经使用独立的 fail-closed R2 上传接口；不得为了复用通用上传 UI 将它改回本地 fallback。其他营销 surface 仍按上条契约逐步接入专用发布流程。
- 组件只消费 props，不读取 Admin Storage 配置或拼接域名。asset ref 保存绝对 URL、kind、MIME、宽高、字节数与可选 poster；逐语言 alt/caption 保存在对应 locale 内容源。
- 对象使用 `marketing/<surface>/<slug>/<content-hash>.<ext>` 一类不可变 key；内容变化上传新 key 并更新引用。为内容 hash 对象返回正确 `Content-Type`、`Content-Disposition: inline` 与 `Cache-Control: public, max-age=31536000, immutable`；视频验证 range request。
- 发布顺序固定为“上传对象 → `HEAD`/最小 `GET` 验证 URL、MIME、缓存、尺寸/体积与视频 range → 合并页面引用 → 部署”。R2 凭据只留在 Admin/服务端，不能进入客户端 bundle、Catalog 或提交文件。

Cloudflare 当前官方 Worker 脚本限制：

- Free：gzip 后 3 MB
- Paid：gzip 后 10 MB
- 未压缩：64 MB
- Static Assets：单文件 25 MiB；Free 最多 20,000 个文件，Paid 最多 100,000 个文件

这些数值会随平台调整；实施和发布时以锁定 Wrangler 版本的 dry-run 与 Cloudflare 官方 limits 页面为准。

项目内部预算：

- Free 目标：gzip ≤ 2.4 MB。
- Paid 目标：gzip ≤ 8 MB。
- 单次营销改造增加超过 100 KB gzip 时必须分析原因。
- 预算是项目质量门槛，不是 Cloudflare 官方额外限制。

测量命令：

```bash
pnpm cf:build
pnpm cf:dry-run
pnpm cf:check-budget
```

`cf:dry-run`/`cf:check-budget` 封装锁定版本的 Wrangler dry-run，并按选定套餐内部预算失败；阈值和 baseline 必须作为可审阅配置提交。另提供 `pnpm marketing:check-assets`：离线检查 `public/` allowlist/体积增量、本地营销媒体引用、Base64 大字符串、R2 origin 与 asset metadata；release/online 模式全量请求 R2 URL，验证 200、MIME、缓存、体积和视频 range。网络不可用时必须明确标记 online 检查未执行，不能把离线通过等同于资源已上线。以上脚本使用现有 Node 能力，不为检查器新增依赖。

每次批量新增工具或模型后记录：

- Worker Total Upload
- gzip 大小
- startup time
- 静态资产文件数量
- 最大单文件体积

参考：

- [Cloudflare Workers limits](https://developers.cloudflare.com/workers/platform/limits/)
- [Cloudflare Static Assets](https://developers.cloudflare.com/workers/static-assets/)
- [Static Assets billing and limitations](https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/)

### 8.2 浏览器侧性能

Worker gzip 体积只衡量服务端部署包，不能代替浏览器 route JS 和首屏资源预算。实现前记录首页与代表性详情页的 route client JS gzip、Lighthouse 和网络瀑布，再据此设定回归阈值；新增页面不得出现未解释的显著增长。

使用 `pnpm bundle:report-routes` 解析 TanStack Start/Vite manifest，报告每类公开 route 的直接与传递 preload raw/gzip，并单独列出共享 messages chunk。短 UI/metadata 使用静态 `m['key']()`；公共营销 import graph 禁止 `tDynamic()`、把 `m` cast 成动态 record 或拼接 message key。长正文只有在报告证明不会被根路由/无关页面预载时才进入 messages，否则使用 `import.meta.glob(..., { eager: false })` 按 `slug + locale` 加载类型安全内容模块。没有同语言内容时 404，不 fallback。

- H1、核心正文、能力/限制和关键内链必须出现在 SSR HTML。
- 上传器、案例画廊、Skill 面板和 below-fold 重交互按路由或交互懒加载。
- R2 图片提供固有尺寸、响应式来源和准确 alt；R2 视频首屏使用轻量 poster，避免自动下载非必要媒体，below-fold 媒体接近视口时再加载。
- 检查公共 shell 是否意外把全部页面专属 Block 打入每条路由。
- 禁止创建静态 import 全部专属 blocks/content 的 registry 后再声称已懒加载。
- Lighthouse 以 LCP ≤ 2.5s、CLS ≤ 0.1 为实验室目标；上线后监测真实用户 75 分位 INP ≤ 200ms。

## 9. 新增公开页面的统一流程

以后新增、更新、重命名、发布、下线或审核公开首页、目录、工具、模型、功能、比较、集成或其他营销页时，默认调用项目级 `/marketing-seo` Skill。Agent 负责技术 SEO 选择、逐语言 index/noindex/blocked 决策和验证，不要求用户设计 canonical、hreflang、schema 或 sitemap 规则。

### 9.1 先确定页面类型和权威来源

| 页面类型           | 主要变更面                                                          | 内容权威                              | 发现性来源                       |
| ------------------ | ------------------------------------------------------------------- | ------------------------------------- | -------------------------------- |
| 首页或固定 Landing | route、固定公开路由 registry、扁平 Blocks、messages/typed content   | 项目 Blocks + Runtime 事实            | Header/Footer、固定路由、sitemap |
| 工具/模型目录      | 固定目录 route、Directory Block、Catalog cards                      | Catalog + 同语言内容摘要              | Header/Footer、首页、固定路由    |
| 工具详情           | Tool Catalog、同语言 content module、共享动态 route、可选专属 Block | Runtime execution + Tool content      | 首页/目录/Related/Blog           |
| 模型详情           | Model Catalog、同语言 content module、Runtime specs、可选专属 Block | Runtime model catalog + Model content | 首页/目录/Related/Blog           |
| Blog               | Admin/数据库文章与媒体                                              | 数据库 `(slug, locale)`               | Blog 列表、相关内容、sitemap     |
| 静态政策/说明页    | MDX + thin route + 固定公开路由 registry                            | 对应 locale MDX                       | Header/Footer 或明确内链         |

新增 Catalog 详情实体时复用已有 `/tools/$slug` 或 `/models/$slug`，不创建每个 slug 的 route 文件。只有新增一种真实页面类型时才新增固定 route，并同步登记 `src/config/seo/public-routes.ts`。

### 9.2 标准实施顺序

1. 记录工作树并解析影响图：route、locale、Catalog、首页/目录卡片、Related、Workbench、metadata、sitemap/llms、legacy URL 和媒体。
2. 确认产品事实和执行能力。营销内容不得先于 Runtime、Provider、计费、权限或专用 operation 声称能力。
3. 在 `docs/marketing-pages-seo-map.md` 为每个目标 locale 记录主要意图、query cluster、相邻页面边界、可验证证据、限制、内链来源、canonical、OG 资产和初始发布决策。
4. 新 locale route 默认 `noindex`。缺少内容的语言不注册 route，也不生成 hreflang。
5. 按 1.3 的决策树选择 messages、typed content、Runtime projection、数据库或 R2，不新增页面 JSON renderer。
6. 先盘点现有消费者：复用 durable component；项目文案和接线留在 Block；只有至少两个真实消费者时才抽取新的通用 section primitive。
7. 实现 route loader/head。动态页先过 Catalog resolver，再过同语言 content resolver；核心 H1、正文、限制和内链必须 SSR。
8. 上传并在线验证 R2 图片、视频、poster 与分享图，再合并 typed asset ref；禁止代码先引用尚不存在的对象。
9. 接入 Header/Footer、首页、目录、Related 或 Blog 中计划好的描述性内链；所有 path 由 resolver 生成。
10. 通过统一 SEO helper 生成 robots、canonical、hreflang、OG/Twitter、breadcrumb/FAQ JSON-LD，并让 sitemap/llms 消费同一发布状态。
11. 运行内容、resolver、SSR/status、metadata、正向 inventory、负向 fixtures、媒体、bundle、视觉、测试、类型、格式、构建和 Cloudflare 门禁。
12. Agent 按具体 locale 给出 `index`、`noindex` 或 `blocked` 决策。只有 release gate 全部通过才切到 index；生产/Search Console 无权限时交付 owner、日期和未验证项。

### 9.3 Typed content module 契约

长内容模块导出稳定、可序列化、按 locale 完整的数据。例如：

```ts
export const content = {
  seo: {
    title: '...',
    description: '...',
  },
  hero: {
    title: '...',
    description: '...',
  },
  introduction: ['...'],
  examples: [
    {
      title: '...',
      prompt: '...',
      assetId: '...',
      alt: '...',
    },
  ],
  workflow: [{ title: '...', description: '...' }],
  useCases: [{ title: '...', description: '...' }],
  limitations: ['...'],
  faq: [{ question: '...', answer: '...' }],
} satisfies ToolPageContent;
```

约束：

- 不保存 React、component name、HTML、任意 section type 或执行权限。
- assetId 必须解析到已验证的 typed R2 asset，alt/caption 留在当前 locale 内容中。
- FAQ 可见 UI 与 FAQ JSON-LD 使用同一数组；breadcrumb 和分享 metadata 同样只有一个内容来源。
- content module 的 key 进入 lazy manifest，但模块本身不能被 root、Catalog registry 或静态 Block registry 全量 import。
- 正文实际变化时才更新 `contentModifiedAt`；SEO 审核时间或构建时间不能伪装成 sitemap lastmod。

### 9.4 完成与交接

仓库实现完成需要同时满足：页面事实真实、当前 locale 内容完整、状态矩阵正确、正向发现 URL 无意外 404、负向 URL 返回预期 404/410、媒体可访问、构建与预算门禁通过。生产上线、Search Console URL Inspection 和第 7/30 天复查属于明确的后续证据，不得用“已生成 sitemap”代替“已收录”。

## 10. 新增工具页流程

1. 确认运行时真实支持该能力。
2. 选择 `agent-preset` 或 `dedicated-api`。
3. 在 `docs/marketing-pages-seo-map.md` 建立中英文搜索意图/query map、内链来源和与其他工具/模型页的边界；新条目先注册为 noindex。
4. 在 Tool Catalog 注册稳定 entityId、各语言 slug/indexing、publication/availability、placement、related 和 variant；新 locale 先 noindex，没有内容的语言不要注册 route，也不能出现在首页/目录/Related。
5. 为每个已注册 locale 添加 `src/content/tools/pages/<entityId>/<locale>.ts`、真实案例、内链来源和专属 OG 图片或已验证的默认图；lazy manifest 会按文件约定自动发现，不再手写 loader entry。禁止另一语言 fallback。所有图片、视频和 poster 先上传 R2，并以 typed asset ref 记录 `r2_domain` 绝对 URL 与展示 metadata。
6. 若需要，添加专属 Block；否则使用共享模板。
7. 添加 modality-safe preset、input policy、runtime 能力和 DeploymentReadiness 一致性测试。
8. 验证统一 route head、Catalog + content 双门禁、正反向 resolver、Home/Directory/Related/Indexable/llms selectors 和技术状态矩阵；所有生成链接必须实际返回预期状态。
9. 验证服务端 policy、生成入口和登录/注册/原标签页邮箱验证/OAuth callback contract/已登录回跳；真实 OAuth smoke 只在已配置合法回调域时要求。
10. 只有某个具体 locale 的内容与技术门槛全部通过后才把该 locale 切换为 index；运行 test/typecheck/format/build、正向 published inventory 与负向 fixtures、SSR/SEO smoke、bundle/assets/Cloudflare checks 和视觉/性能检查，另一语言不自动跟随。

## 11. 新增模型页流程

1. 先将模型完整接入 runtime Catalog、Provider、计费和工具 allowlist。
2. 在 Model Catalog 引用已有 runtime key。
3. 在 `docs/marketing-pages-seo-map.md` 建立中英文搜索意图/query map、内链来源和与通用工具/其他模型页的边界；新条目先注册为 noindex。
4. 注册稳定 entityId、各语言 slug/indexing、publication/availability、placement、related 和 variant；新 locale 先 noindex，没有同语言 content module 时不要注册 route，也不能出现在首页/目录/Related。
5. 从 runtime Catalog 派生规格，不复制业务数据。
6. 添加 `src/content/models/pages/<entityId>/<locale>.ts` 形式的模型同语言 typed content module、案例、Prompt 指南、适用场景、限制、内链来源和专属 OG 图片或已验证的默认图；model manifest 沿用工具页的约定目录自动发现，涉及的页面媒体先上传 R2 并通过 online asset check。
7. 添加 image/video modality 与 runtime key 一致性测试。
8. 验证统一 route head、Catalog + content 双门禁、正反向 resolver、服务端锁定模型 policy、Agent tool context、Workbench 支持参数和目标部署能力预检；图片模型还必须证明 `imageModelOption` 已全链路贯通。
9. 只有某个具体 locale 的内容与技术门槛全部通过后才把该 locale 切换为 index；运行 test/typecheck/format/build、正向 published inventory 与负向 fixtures、SSR/SEO smoke、bundle/assets/Cloudflare checks 和视觉/性能检查，另一语言不自动跟随。

## 12. 新项目复用流程

新项目默认保留：

- `components/catalog/*`
- 动态 tools/models routes
- Catalog 类型与 selectors
- GenerationEntry 接口
- `src/lib/seo.ts`、Sitemap 和实验性 llms 生成器

新项目主要替换：

- 扁平的首页/工具/模型 blocks 和 section 顺序
- 工具/模型 Catalog
- `messages/*` 中的短 UI/metadata 文案与按 `slug + locale` 的长内容模块
- 案例和品牌素材（对象放 R2，代码只保存已验证的公网 asset ref）
- 页面 variants 与少量专属 Blocks

## 13. 发布检查清单

- [ ] 页面结构由 Route/Block 显式 composition；没有任意 `sections[]` JSON renderer、component name 或 HTML 驱动页面
- [ ] 短 UI/metadata、Typed Catalog、route-local 长正文、Runtime 事实、R2 媒体和 Blog 数据库各自位于规定的权威源，没有互相复制
- [ ] durable Components 只接收 props，不读取 `m`、Catalog、R2/Admin 配置或 server-only modules；Home/Tool/Model Blocks 保持独立
- [ ] 页面实体的 publication/availability/locale indexing/placement 组合合法；每条 locale path 能正向生成并反向解析
- [ ] 每条会被首页、目录或 Related 链接的 Catalog locale route 同时存在 `pages/<entityId>/<locale>.ts`，能被 lazy content manifest 自动发现；详情 loader 缺 route/内容时在生成 head 前返回 404
- [ ] 首页、目录、Related、Sitemap、llms 使用同一 selector 模块中的正确命名投影
- [ ] 每个 indexable 页面有按语言审核的搜索意图/query map、页面边界、内链来源和实质性独特内容
- [ ] 模型规格来自 runtime Catalog，modelKey 与 image/video modality 一致
- [ ] listed/live Workbench 在目标部署通过 Provider、模型路由和存储能力预检
- [ ] 客户端 preset 不能修改积分、Provider 或权限；服务端根据 entryContext 重建 policy，tool 参数不能绕过锁定
- [ ] 图片模型页的 `imageModelOption` 已贯通 composer、normalization、handoff、API、runtime 和 Agent tool context
- [ ] 工具/模型页设置默认不污染全局 localStorage
- [ ] Background Remover 等 beta 能力有清晰限制
- [ ] 统一 helper 输出唯一 title、description、robots、canonical、hreflang、OG/Twitter，生产值不含 localhost
- [ ] canonical 为当前语言 self URL；hreflang 只引用真实且可索引的译文、存在时 reciprocal，x-default 只指向真实且允许 index 的 base locale 页面
- [ ] 追踪参数不进入 canonical；分页和筛选参数有显式 index/canonical 策略
- [ ] `og:url` 等于 canonical；OG/Twitter 图片是公开、绝对、返回 200 且带尺寸/alt 的 URL
- [ ] 新增或实质改造组件的图片、视频、poster、Blog 封面和分享图全部使用配置的 HTTPS `r2_domain`；无 S3 API endpoint、临时签名 URL、localhost 或组件内域名拼接
- [ ] R2 对象先上传后引用，使用不可变 version/hash key；MIME、inline disposition、immutable cache 与视频 range response 已验证，凭据未进入客户端或仓库
- [ ] Breadcrumb 与结构化数据和可见内容一致；没有虚构价格、评分、评价或 schema
- [ ] 代表性 JSON-LD 通过 Rich Results Test 或 Schema Validator
- [ ] JSON-LD 由共享 serializer 安全 SSR 输出并可解析
- [ ] sitemap 合并并去重已登记固定 routes、`selectIndexableUrls()` Catalog URLs 和已发布 Blog URLs；只含 indexable locale canonical，lastmod 为真实内容时间或省略，不输出 priority/changefreq
- [ ] robots.txt 允许公开 index/noindex 页面并声明唯一 sitemap；私有路径依靠认证/noindex，额外 Disallow 覆盖实际 locale 前缀；llms 端点返回 `X-Robots-Tag: noindex`
- [ ] llms 标题与摘要来自同语言审核内容，不输出 raw entityId 加通用占位描述
- [ ] 已发布 slug 变更在 locale-aware legacy registry 中；301 单跳到 200 canonical，无 chain/loop；410 已有 TanStack/Nitro 集成验证
- [ ] 中英文短 UI/metadata message key 一致；长正文按已注册 locale 独立存在，无 fallback，public graph 无 `tDynamic`/拼接 key
- [ ] 图片、视频请求无 404；发布前 online asset inventory 中所有 R2 URL 为 200
- [ ] `public/` 只有壳资源 allowlist 和非营销功能图标；新营销实现无本地媒体路径，`public/` 媒体字节数未增长
- [ ] 390px 和 1440px 布局正常
- [ ] light/dark、en/zh、登录/匿名均验证
- [ ] `pnpm test` 通过
- [ ] `pnpm exec tsc --noEmit` 和 `pnpm format:check` 通过
- [ ] `pnpm build` 通过
- [ ] 所有 Header/Footer/目录/Related/canonical/hreflang/sitemap/llms/legacy target URL 都进入正向 published inventory，意外 404 为零
- [ ] 负向 fixtures 独立验证；`/tools/missing`、`/zh/tools/missing`、`/models/missing`、`/zh/models/missing` 均为 404，未注册 locale/缺同语言内容不会得到 fallback 200
- [ ] 全量正向 inventory 的 200/301→200、noindex、canonical、hreflang、x-default smoke 与负向 fixtures 的 404/410 smoke 通过
- [ ] Search Console 404 按 sitemap/站内链接/hreflang/redirect target/历史价值/随机猜测分类，不以总数清零制造跳首页、跨语言跳转或 soft 404
- [ ] SSR HTML 含 H1、核心正文和关键内链；route client JS、transitive preload 与首屏资源相对基线无未解释增长，根路由不预载全部 locale 正文
- [ ] Lighthouse 移动端无显著回归；LCP/CLS 达标，上线后监测真实用户 INP
- [ ] `bundle:report-routes`、`marketing:check-assets` 和 Cloudflare dry-run/budget checks 未突破可审阅阈值

## 14. 上线后 SEO 运营

代码交付完成不代表页面已经被搜索引擎正确收录。生产发布后还需要：

1. 抓取代表性 en/zh URL，复核实际响应状态、rendered HTML、metadata、JSON-LD、sitemap 和 redirects。
2. 在 Google Search Console 提交 sitemap，并用 URL Inspection 检查首页、目录、工具、模型和 Blog 代表页。
3. 在第 7 天和第 30 天记录索引状态、Google 选择的 canonical、抓取错误、查询/落地页分布和关键词蚕食；404 按发现来源和 URL 生命周期分类，站点自有来源立即修复，正确的 guessed/typo 404 记录为 expected。
4. 监测真实用户 Core Web Vitals，按证据调整内容、内链与性能。

如果没有 Search Console 或生产权限，交付清单必须明确 owner、计划日期、记录位置和未验证项，不能把“已生成 sitemap”写成“已收录”。

## 15. Agent-native SEO 操作方式

项目级 `/marketing-seo` Skill 是工具页、模型页和其他公开营销页的默认 SEO owner。以下请求即使没有显式提到 SEO，也应触发该 Skill：

- 新增或大幅更新工具页、模型页、目录页或落地页
- 修改页面能力、案例、FAQ、slug、publication 或 indexing
- 发布、下线、重命名或合并公开页面
- 检查某个营销页是否应该收录
- 生产发布后的索引、查询、canonical 或流量复查

标准执行链路：

```text
能力与事实核查
  → 按语言研究搜索意图
  → 更新 docs/marketing-pages-seo-map.md
  → 以 noindex 实现或更新页面
  → 验证内容、SSR、metadata、sitemap 与性能
  → Agent 给出 index / noindex / blocked 决策
  → 获得授权时完成生产与 Search Console 操作
  → 第 7/30 天复查并记录证据
```

Agent 不把 canonical、hreflang、schema、sitemap 或 indexing 选择交给不熟悉 SEO 的用户。只有产品事实无法从 Runtime/可信来源发现、业务定位存在实质分叉或外部系统写操作尚未授权时才请求输入；其余安全、可逆工作继续完成。

Skill 使用“通用内核 + 项目适配器”，避免把某个工具、模型或 slug 写进执行规则。权威文件：

- `.claude/skills/marketing-seo/SKILL.md`：框架无关的自主执行流程与停止条件
- `.claude/skills/marketing-seo/references/release-contract.md`：框架无关的信任顺序、技术矩阵与发布门槛
- `.claude/skills/marketing-seo/references/shipany-tanstack.md`：本仓库的 Routes/Blocks/Components、Catalog、Paraglide 和验证命令适配
- `.claude/skills/marketing-seo/assets/seo-map-entry.md`：SEO Map 条目模板
- `.claude/skills/marketing-seo/assets/seo-release-report.md`：最终证据报告模板

具体页面名称只能存在于页面数据、SEO Map 或 Skill 的离线评测样本中；评测样本不属于运行时指令，也不会成为白名单、分支规则或默认结论。

`launch-audit seo` 继续负责全站横向扫描；`marketing-seo` 负责单个营销实体从创建到上线后监测的纵向生命周期，两者互补而不重复。
