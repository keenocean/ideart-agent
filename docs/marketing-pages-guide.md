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
  负责项目文案、i18n、素材、Catalog 与业务接线
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
- `messages/{en,zh}.json` 只承载多语言文案。
- `src/config/marketing/*` 用 TypeScript Catalog 表达可发布实体。
- 模型、参数、积分和 Provider 继续以运行时 Catalog 为权威。

### 1.2 不追求所有代码复用

复用的目标是减少重复维护，而不是把所有页面压进一个巨型组件。

建议按三层处理：

| 层级           | 是否长期复用 | 示例                                           |
| -------------- | ------------ | ---------------------------------------------- |
| UI primitives  | 是           | SectionHeading、FAQList、Steps、CardGrid       |
| Page shells    | 是           | ToolDetailPage、ModelDetailPage、DirectoryPage |
| Project blocks | 视项目重写   | HomeHero、案例、品牌内容、专属教程             |

普通详情页可把约 70% 公共骨架、30% 页面内容和变体作为内部设计启发，不把比例当作硬性验收指标；重点 SEO 页面可以有更多专属内容。

## 2. 推荐目录

```text
src/
├── lib/
│   └── seo.ts
├── components/marketing/
│   ├── section-heading.tsx
│   ├── directory-card-grid.tsx
│   ├── example-gallery.tsx
│   ├── feature-grid.tsx
│   ├── steps.tsx
│   ├── faq-list.tsx
│   ├── related-pages.tsx
│   ├── final-cta.tsx
│   ├── before-after-slider.tsx
│   ├── model-specs-table.tsx
│   └── detail-page-shell.tsx
├── config/marketing/
│   ├── types.ts
│   ├── tools.ts
│   ├── models.ts
│   └── selectors.ts
├── blocks/marketing/
│   ├── home-*.tsx
│   ├── tool-directory.tsx
│   ├── tool-detail.tsx
│   ├── model-directory.tsx
│   ├── model-detail.tsx
│   ├── variants/
│   └── content/
└── routes/
    ├── index.tsx
    ├── tools/index.tsx
    ├── tools/$slug.tsx
    ├── models/index.tsx
    └── models/$slug.tsx
```

无论有多少实体，都只有一条工具详情路由和一条模型详情路由，不为每个 slug 复制 route 文件。

## 3. Catalog 设计

### 3.1 发布、收录与能力状态分离

```ts
type Publication = 'listed' | 'unlisted' | 'hidden';
type Availability = 'live' | 'beta' | 'coming-soon';
type Indexing = 'index' | 'noindex';

type MarketingVisibility =
  | {
      publication: 'listed';
      indexing: Indexing;
      placement: {
        homeFeatured?: boolean;
        homeOrder?: number;
        directoryOrder: number;
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

发布语义：

| 状态                 | 详情页 | 首页/目录 | Sitemap                           | Robots                           | Workbench                  |
| -------------------- | ------ | --------- | --------------------------------- | -------------------------------- | -------------------------- |
| listed + live        | 200    | 显示      | 仅显式 index 时收录               | 按 indexing                      | 按部署就绪度运行           |
| listed + beta        | 200    | 显示 Beta | 仅显式 index 时收录               | 按 indexing                      | 按部署就绪度运行并显示限制 |
| listed + coming-soon | 200    | 可显示    | 仅有实质预发布内容且显式 index 时 | 默认 noindex，内容审核后可 index | 禁用                       |
| unlisted             | 200    | 不显示    | 不收录                            | noindex,follow                   | 按能力与部署就绪度         |
| hidden               | 404    | 不显示    | 不收录                            | —                                | 无                         |

`publication`、`availability` 和 `indexing` 分别表达发现性、产品生命周期和搜索收录，不能互相代替。coming-soon 空壳页保持 noindex；只有已经提供稳定、独特、可帮助用户的预发布内容时才允许 index。

首页、目录、Related、Sitemap 和 llms 文档必须共享同一个 selector 模块和状态语义，但使用与消费场景匹配的命名投影：`selectHomeEntries`、`selectDirectoryEntries`、`selectRelatedEntries`、`selectIndexableEntries`、`selectLlmsEntries`。Related 只返回显式引用、存在、非自身且 listed 的目标；Sitemap 只返回 indexable canonical 页面。

### 3.2 Catalog 只描述营销映射

工具定义可以包含：

- slug
- publication / availability / indexing
- 首页和目录排序
- 关联工具
- 素材标识
- 页面变体
- 安全的生成预设
- 执行适配器类型

模型定义可以包含：

- slug
- runtime model key
- publication / availability / indexing
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

- 首页使用 default preset，不覆盖用户已有合法设置。
- 工具页可以锁定 mediaMode 和 input policy。
- 模型页使用与 image/video modality 匹配的 modelKey。
- 所有 preset 必须通过现有 normalization。
- 设置优先级固定为 runtime defaults → 合法持久化设置 → 页面 default 补缺 → 页面 locked 覆盖 → normalization。
- 工具/模型页的设置修改默认只作用于本次 handoff；用户显式保存为默认值后才能写全局 localStorage。
- input policy 只表达入口规则，`maximum` 只能收紧、不能放宽 runtime 上限；真实模型/operation 上限继续从 runtime 派生并由服务端验证。
- preset 不得修改积分、Provider、系统 Prompt 或工具权限。

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

认证回跳必须使用一个共享的纯函数 sanitizer。Agent/App guard、sign-in、sign-up、verify-email 和 OAuth 均接受同站相对 callback，拒绝外部 URL、协议相对 URL、编码绕过和认证页循环；已登录分支也必须尊重合法 callback。首轮 prompt/settings/skill/attachments 只有在服务端接受 turn 后才从 sessionStorage 删除。OAuth 没有可用凭据或合法回调域时以 mock/contract test 验证，只有环境具备条件时才要求真实 provider smoke。

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

新增 listed 页面默认 `indexing: 'noindex'`。只有以下条件全部满足后才切换为 `index`：

- SSR HTML 有唯一 H1、实质正文、真实案例/Prompt、能力和限制。
- 搜索意图明确，和相邻页面不存在未解释的关键词蚕食。
- 关键页面能从首页、目录、Blog 或 related cards 通过描述性 anchor 到达。
- route metadata、sitemap 和状态矩阵测试通过。
- 当前语言是真实本地化内容，而不只是补齐 message key。

`alternates` 只记录具备实质内容且允许 index 的真实语言版本，并为每种语言保存准确的 locale-free canonical path；翻译缺失或仍为 noindex 时不要输出对应 hreflang。显式 path 也能兼容未来不同语言使用不同 slug。

### 7.2 统一 route head 契约

`src/lib/seo.ts` 作为唯一 metadata 构造入口，统一输出 TanStack Router 的 `head.meta`、`head.links` 和 `head.scripts`。路由不分别手写 canonical、hreflang、Open Graph 或 JSON-LD。

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

动态路由的 loader 先读取 locale、解析 definition 和内容；hidden/未知 slug 在生成 head 前 `throw notFound()`。loader 只返回可序列化数据，route `head({ loaderData })` 再调用 `buildSeoHead(loaderData.seo)`。React 值、message functions 和 server-only 对象不得进入 loaderData。

根路由维护站点级默认项；子路由维护页面级 title、description、URL 和图片。最终 head 中每种页面级标签只保留一份，不依赖覆盖顺序制造重复项。

### 7.3 Canonical、hreflang、robots 与 sitemap

- 唯一内容页使用 self-referencing canonical：英文保持 locale-free URL，中文使用 `/zh`，中文不得 canonical 到英文。
- canonical 和 alternate 使用基于生产 `VITE_APP_URL` 的绝对 HTTPS URL，去掉 hash 和追踪参数，并遵守统一 trailing-slash 规则。分页、筛选等功能参数必须有显式 index/canonical 策略，不能由通用 helper 一律删除。
- hreflang 只在当前页及目标语言页均可索引时输出，并包含当前页自身；同组页面必须 reciprocal。只有 baseLocale 版本真实存在时才输出指向它的 `x-default`。
- noindex 页面可保留 self-canonical，但不进入 sitemap。不要用 robots.txt 屏蔽 noindex URL，否则爬虫看不到 noindex 指令。
- `robots.txt` 保持公开 canonical 页面可抓取、屏蔽私有 app/admin/API 路径，并输出唯一的绝对 sitemap 地址。
- sitemap 只输出 `selectIndexableEntries` 的 canonical URL；`lastmod` 使用真实内容更新时间，没有可靠值时省略，禁止写构建时间。Google 会忽略 `priority` 和 `changefreq`，不要把它们当作优化手段。
- 已发布 slug 变更必须维护 `legacySlug → 301 canonical target`；永久删除使用明确 410 或经过评审的替代跳转。
- hidden 页面返回 404，不生成实体 metadata。
- `llms.txt` 和 `llms-full.txt` 是实验性发现端点，不是搜索引擎标准或发布阻塞项；只输出 `selectLlmsEntries` 允许公开发现的内容，并返回 `X-Robots-Tag: noindex`，同时保留缓存、体积和转义边界。

### 7.4 Open Graph 与 Twitter Card

- 工具、模型、首页和目录页使用 `og:type=website`；Blog 使用 `article`。
- 页面输出 localized title/description、`og:url`、站点名、图片 URL/alt/width/height/type、`og:locale` 和真实 alternate locales。
- 维护类型安全的 app locale → Open Graph locale 映射（当前项目如 `en → en_US`、`zh → zh_CN`），不要把 Paraglide 的短 locale code 原样写进 `og:locale`。
- `og:url` 必须等于当前语言 canonical；Twitter 输出 `summary_large_image`、title、description、image 和 image alt，并复用同一数据源。
- 图片必须是公开、绝对、返回 200 的 URL。优先使用 1200×630 专属图，没有时回退到经过验证的站点默认图；禁止 localhost、需认证或缺失资源。
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

| 页面状态                       | HTTP | robots         | canonical | hreflang                         | sitemap | JSON-LD                    |
| ------------------------------ | ---- | -------------- | --------- | -------------------------------- | ------- | -------------------------- |
| listed + index                 | 200  | index,follow   | self      | 有译文时互返；可用时含 x-default | 是      | 与可见内容一致             |
| listed + noindex               | 200  | noindex,follow | self      | —                                | 否      | 可选，但必须与可见内容一致 |
| unlisted                       | 200  | noindex,follow | self      | —                                | 否      | 可选，但必须与可见内容一致 |
| hidden / 未知 slug             | 404  | —              | —         | —                                | 否      | 不生成实体数据             |
| coming-soon + 实质内容 + index | 200  | index,follow   | self      | 有译文时互返；可用时含 x-default | 是      | 只描述已公开事实           |
| coming-soon + 空壳/待审核      | 200  | noindex,follow | self      | —                                | 否      | 不输出误导性功能声明       |

route head、SSR smoke 和 sitemap 必须共同遵守这张矩阵，禁止各自维护另一套解释。

### 7.7 Blog 内容层

Blog 以 SEO 为第一目标，正文只从数据库读取：

- 数据库文章使用 `(slug, locale)` 唯一键；空 locale 仅用于兼容旧数据，表示语言中立。
- 请求语言文章优先于语言中立文章，同 slug 只显示一篇。
- 分类在公共层统一为稳定 `slug + title`，URL 只使用 slug，显示名称可以本地化。
- 列表分页和分类筛选由 server function 完成，不把数据库模块导入组件。
- Markdown/MDX 可以保留为仓库外或 `src/content/posts/` 下的编辑源，但运行时代码不得 import；发布必须通过 Admin → Posts 写入数据库。
- `pnpm blog:check-bundle` 会拒绝任何本地文章运行时引用，生产与 Cloudflare 构建都会自动执行该检查。

数据库迁移按 provider 管理：仓库当前生成的 `drizzle/0002_brown_shockwave.sql` 仅适用于 D1/SQLite。PostgreSQL 或 MySQL 部署必须使用对应 provider 重新生成并审阅迁移，不能执行该 SQLite SQL。

文章详情必须输出 canonical、仅指向真实译文的 hreflang、Open Graph、Twitter Card 和 `BlogPosting` JSON-LD。`sitemap.xml` 每种可用语言输出独立 `<url>`；`llms-full.txt` 应包含正文并避免逐篇数据库查询。发现性端点使用短期共享缓存，降低爬虫对数据库的重复读取。

发布文章时必须同时：

1. 在 Admin → Posts 创建对应语言的数据库文章并设为 `published`。
2. 填写标题、唯一描述、封面、作者、分类和完整正文。
3. 确认封面资源使用外部对象存储 URL；只有真实存在且允许 index 的译文才声明对应 hreflang。
4. 验证 SSR 文章页、canonical、结构化数据、sitemap、`llms.txt` 与 `llms-full.txt`。

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

- 小型图片、视频、字体放 `public/` 或 Workers Static Assets；单文件必须小于 Cloudflare 的 25 MiB 限制。
- 更大的示例视频放 R2/S3，并使用优化 poster，不能依赖 Worker Static Assets 部署。
- 不把大图片转为 Base64 写入 TS/JSON。
- 不把完整视频或大型案例数据 import 到 Worker 全局模块。
- Blog 正文固定存入 D1/Postgres 等外部数据层，不随 Worker 代码部署；大封面和媒体固定放 R2/S3。
- 避免根模块一次性 import 所有页面专属组件。

Cloudflare 当前官方 Worker 脚本限制：

- Free：gzip 后 3 MB
- Paid：gzip 后 10 MB
- 未压缩：64 MB

项目内部预算：

- Free 目标：gzip ≤ 2.4 MB。
- Paid 目标：gzip ≤ 8 MB。
- 单次营销改造增加超过 100 KB gzip 时必须分析原因。
- 预算是项目质量门槛，不是 Cloudflare 官方额外限制。

测量命令：

```bash
pnpm cf:build
npx wrangler deploy --outdir bundled --dry-run
```

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

- H1、核心正文、能力/限制和关键内链必须出现在 SSR HTML。
- 上传器、案例画廊、Skill 面板和 below-fold 重交互按路由或交互懒加载。
- 图片提供固有尺寸、响应式来源和准确 alt；视频首屏使用轻量 poster，避免自动下载非必要媒体。
- 检查公共 shell 是否意外把全部页面专属 Block 打入每条路由。
- Lighthouse 以 LCP ≤ 2.5s、CLS ≤ 0.1 为实验室目标；上线后监测真实用户 75 分位 INP ≤ 200ms。

## 9. 新增工具页流程

1. 确认运行时真实支持该能力。
2. 选择 `agent-preset` 或 `dedicated-api`。
3. 在 `docs/marketing-pages-seo-map.md` 建立中英文搜索意图/query map、内链来源和与其他工具/模型页的边界；新条目先注册为 noindex。
4. 在 Tool Catalog 注册 slug、publication/availability/indexing、placement、related 和 variant。
5. 添加中英文文案、真实案例、内链来源和专属 OG 图片或已验证的默认图。
6. 若需要，添加专属 Block；否则使用共享模板。
7. 添加 modality-safe preset、input policy、runtime 能力和 DeploymentReadiness 一致性测试。
8. 验证统一 route head、Home/Directory/Related/Indexable/llms selectors 和技术状态矩阵。
9. 验证生成入口和登录/注册/验证/OAuth callback contract/已登录回跳；真实 OAuth smoke 只在已配置合法回调域时要求。
10. 内容与技术门槛全部通过后才切换为 index，并运行 test/typecheck/format/build、SSR/SEO smoke、Cloudflare dry-run 和视觉/性能检查。

## 10. 新增模型页流程

1. 先将模型完整接入 runtime Catalog、Provider、计费和工具 allowlist。
2. 在 Model Catalog 引用已有 runtime key。
3. 在 `docs/marketing-pages-seo-map.md` 建立中英文搜索意图/query map、内链来源和与通用工具/其他模型页的边界；新条目先注册为 noindex。
4. 注册 slug、publication/availability/indexing、placement、related 和 variant。
5. 从 runtime Catalog 派生规格，不复制业务数据。
6. 添加模型特有案例、Prompt 指南、适用场景、限制、内链来源和专属 OG 图片或已验证的默认图。
7. 添加 image/video modality 与 runtime key 一致性测试。
8. 验证统一 route head、锁定模型 Workbench 支持参数和目标部署能力预检。
9. 内容与技术门槛全部通过后才切换为 index，并运行 test/typecheck/format/build、SSR/SEO smoke、Cloudflare dry-run 和视觉/性能检查。

## 11. 新项目复用流程

新项目默认保留：

- `components/marketing/*`
- 动态 tools/models routes
- Catalog 类型与 selectors
- GenerationEntry 接口
- `src/lib/seo.ts`、Sitemap 和实验性 llms 生成器

新项目主要替换：

- 首页 blocks 和 section 顺序
- 工具/模型 Catalog
- `messages/*` 文案
- 案例和品牌素材
- 页面 variants 与少量专属 Blocks

## 12. 发布检查清单

- [ ] 页面实体的 publication/availability/indexing/placement 组合合法
- [ ] 首页、目录、Related、Sitemap、llms 使用同一 selector 模块中的正确命名投影
- [ ] 每个 indexable 页面有按语言审核的搜索意图/query map、页面边界、内链来源和实质性独特内容
- [ ] 模型规格来自 runtime Catalog，modelKey 与 image/video modality 一致
- [ ] listed/live Workbench 在目标部署通过 Provider、模型路由和存储能力预检
- [ ] 页面 preset 不能修改积分、Provider 或权限
- [ ] 工具/模型页设置默认不污染全局 localStorage
- [ ] Background Remover 等 beta 能力有清晰限制
- [ ] 统一 helper 输出唯一 title、description、robots、canonical、hreflang、OG/Twitter，生产值不含 localhost
- [ ] canonical 为当前语言 self URL；hreflang 只引用真实且可索引的译文、存在时 reciprocal，x-default 只指向真实 base locale 页面
- [ ] 追踪参数不进入 canonical；分页和筛选参数有显式 index/canonical 策略
- [ ] `og:url` 等于 canonical；OG/Twitter 图片是公开、绝对、返回 200 且带尺寸/alt 的 URL
- [ ] Breadcrumb 与结构化数据和可见内容一致；没有虚构价格、评分、评价或 schema
- [ ] 代表性 JSON-LD 通过 Rich Results Test 或 Schema Validator
- [ ] JSON-LD 由共享 serializer 安全 SSR 输出并可解析
- [ ] sitemap 仅包含 canonical/indexable URL，lastmod 为真实内容时间或省略
- [ ] robots.txt 允许公开 canonical 页面、屏蔽私有路径并声明 sitemap；noindex URL 未被屏蔽，llms 端点返回 `X-Robots-Tag: noindex`
- [ ] 已发布 slug 变更有测试覆盖的 301/410 策略
- [ ] 中英文 message key 一致
- [ ] 图片、视频请求无 404
- [ ] Static Assets 单文件小于 25 MiB；更大媒体来自 R2/S3
- [ ] 390px 和 1440px 布局正常
- [ ] light/dark、en/zh、登录/匿名均验证
- [ ] `pnpm test` 通过
- [ ] `pnpm exec tsc --noEmit` 和 `pnpm format:check` 通过
- [ ] `pnpm build` 通过
- [ ] en/zh SSR 的 200/404、noindex、canonical、hreflang、x-default smoke 通过
- [ ] SSR HTML 含 H1、核心正文和关键内链；route client JS 与首屏资源相对基线无未解释增长
- [ ] Lighthouse 移动端无显著回归；LCP/CLS 达标，上线后监测真实用户 INP
- [ ] Cloudflare dry-run 未突破内部体积预算

## 13. 上线后 SEO 运营

代码交付完成不代表页面已经被搜索引擎正确收录。生产发布后还需要：

1. 抓取代表性 en/zh URL，复核实际响应状态、rendered HTML、metadata、JSON-LD、sitemap 和 redirects。
2. 在 Google Search Console 提交 sitemap，并用 URL Inspection 检查首页、目录、工具、模型和 Blog 代表页。
3. 在第 7 天和第 30 天记录索引状态、Google 选择的 canonical、抓取错误、查询/落地页分布和关键词蚕食。
4. 监测真实用户 Core Web Vitals，按证据调整内容、内链与性能。

如果没有 Search Console 或生产权限，交付清单必须明确 owner、计划日期、记录位置和未验证项，不能把“已生成 sitemap”写成“已收录”。

## 14. Agent-native SEO 操作方式

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
