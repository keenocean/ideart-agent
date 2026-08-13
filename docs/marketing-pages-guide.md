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

经验目标是：普通详情页约 70% 公共骨架、30% 页面内容和变体；重点 SEO 页面可以有更多专属内容。

## 2. 推荐目录

```text
src/
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

### 3.1 发布状态与能力状态分离

```ts
type Publication = 'listed' | 'unlisted' | 'hidden';
type Availability = 'live' | 'beta' | 'coming-soon';

type MarketingPlacement = {
  homeFeatured?: boolean;
  homeOrder?: number;
  directoryOrder: number;
};
```

发布语义：

| 状态                 | 详情页 | 首页/目录 | Sitemap | Robots  | Workbench        |
| -------------------- | ------ | --------- | ------- | ------- | ---------------- |
| listed + live        | 200    | 显示      | 收录    | index   | 可运行           |
| listed + beta        | 200    | 显示 Beta | 收录    | index   | 可运行并显示限制 |
| listed + coming-soon | 200    | 可显示    | 收录    | index   | 禁用             |
| unlisted             | 200    | 不显示    | 不收录  | noindex | 按能力状态       |
| hidden               | 404    | 不显示    | 不收录  | —       | 无               |

首页、目录、Related、Sitemap 和 llms 文档必须共用 selector，不能分别维护发布列表。

### 3.2 Catalog 只描述营销映射

工具定义可以包含：

- slug
- publication / availability
- 首页和目录排序
- 关联工具
- 素材标识
- 页面变体
- 安全的生成预设
- 执行适配器类型

模型定义可以包含：

- slug
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

这些信息应从 `src/lib/agent-settings.ts` 或服务端 Catalog 派生，并在服务端再次验证。

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

- 首页使用 default preset，不覆盖用户已有合法设置。
- 工具页可以锁定 mediaMode 和 requiredInput。
- 模型页可以锁定 modelKey。
- 所有 preset 必须通过现有 normalization。
- preset 不得修改积分、Provider、系统 Prompt 或工具权限。

工具执行适配器保留两种方式：

```ts
type ToolExecution =
  | { kind: 'agent-preset'; preset: GenerationPreset }
  | { kind: 'dedicated-api'; operation: DedicatedToolOperation };
```

- 生成式图片、视频和编辑任务进入 Chat。
- 未来确定性抠图、压缩、格式转换等工具可以留在当前页调用专用 API。

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

每个 listed 页面至少应有自己的：

- title 和 meta description
- 唯一 H1
- 清晰的任务/模型介绍
- 真实 Workbench 预设
- 独特案例和 Prompt
- 能力、适用场景与限制
- 相关页面内链
- canonical 和 hreflang
- Open Graph 图片
- Breadcrumb JSON-LD

结构化数据必须与页面上真实可见的内容一致。不要为了 Rich Results 生成页面没有展示的 FAQ、价格或评价。

### 7.1 Blog 内容层

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
3. 确认封面资源使用外部对象存储 URL；只有真实存在的译文才声明对应 hreflang。
4. 验证 SSR 文章页、canonical、结构化数据、sitemap、`llms.txt` 与 `llms-full.txt`。

SEO 发布门槛：

- 只有标题和一段替换文案的页面不得 listed。
- 没有真实运行能力的页面必须标记 beta/coming-soon。
- 同一内容只保留一个 canonical URL。
- unlisted 页面输出 `noindex,follow`。
- hidden 页面返回 404。

参考：

- [Google SEO Starter Guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide)
- [Creating helpful, reliable, people-first content](https://developers.google.com/search/docs/fundamentals/creating-helpful-content)
- [Breadcrumb structured data](https://developers.google.com/search/docs/appearance/structured-data/breadcrumb)

## 8. Cloudflare Worker 体积控制

工具和模型数量增加时，主要增长来源是被打进 Worker 的代码和文本，不是 URL 数量。动态 `$slug` 路由不会随条目数量复制路由模块。

### 8.1 资源放置

- 图片、视频、字体放 `public/` 或 Workers Static Assets。
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

## 9. 新增工具页流程

1. 确认运行时真实支持该能力。
2. 选择 `agent-preset` 或 `dedicated-api`。
3. 在 Tool Catalog 注册 slug、状态、placement、related 和 variant。
4. 添加中英文文案和真实案例。
5. 若需要，添加专属 Block；否则使用共享模板。
6. 添加 preset/能力一致性测试。
7. 验证首页、目录、Related、Sitemap、llms 的显示规则。
8. 验证生成入口、登录回跳和输入要求。
9. 运行 test/build/Cloudflare dry-run/视觉检查。

## 10. 新增模型页流程

1. 先将模型完整接入 runtime Catalog、Provider、计费和工具 allowlist。
2. 在 Model Catalog 引用已有 runtime key。
3. 注册 slug、状态、placement、related 和 variant。
4. 从 runtime Catalog 派生规格，不复制业务数据。
5. 添加模型特有案例、Prompt 指南、适用场景和限制。
6. 添加 runtime key 一致性测试。
7. 验证锁定模型 Workbench 只显示受支持参数。
8. 运行 test/build/Cloudflare dry-run/视觉检查。

## 11. 新项目复用流程

新项目默认保留：

- `components/marketing/*`
- 动态 tools/models routes
- Catalog 类型与 selectors
- GenerationEntry 接口
- SEO、Sitemap 和 llms 生成器

新项目主要替换：

- 首页 blocks 和 section 顺序
- 工具/模型 Catalog
- `messages/*` 文案
- 案例和品牌素材
- 页面 variants 与少量专属 Blocks

## 12. 发布检查清单

- [ ] 页面实体的 publication/availability 正确
- [ ] 首页、目录、Related、Sitemap 使用相同 selector
- [ ] listed 页面有实质性独特内容
- [ ] 模型规格来自 runtime Catalog
- [ ] 页面 preset 不能修改积分、Provider 或权限
- [ ] Background Remover 等 beta 能力有清晰限制
- [ ] title、description、H1、canonical、hreflang 完整
- [ ] Breadcrumb 与结构化数据和可见内容一致
- [ ] 中英文 message key 一致
- [ ] 图片、视频请求无 404
- [ ] 390px 和 1440px 布局正常
- [ ] light/dark、en/zh、登录/匿名均验证
- [ ] `pnpm test` 通过
- [ ] `pnpm build` 通过
- [ ] Cloudflare dry-run 未突破内部体积预算
