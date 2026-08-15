# Marketing pages SEO map

Reviewed on 2026-08-15. This is the durable page/locale decision record; runtime
Catalog and server validation remain authoritative for product capability.

Phase 3 opens one routable tool slice: `/tools` and
`/tools/ai-image-generator` now return substantive en/zh pages. Both remain
`noindex` and are omitted from sitemap, hreflang, llms, Header/Home navigation,
and other discovery surfaces until the later discovery and production release
gate. The directory filters through the exact-locale content manifest, so every
other Catalog tool still returns 404 despite having an infrastructure route
registration. A later phase may change one locale to `index` only after its own
release gate passes; the other locale does not follow automatically.

External follow-up remains conditional on a production deployment: repeat the
representative URL fetch and review Search Console on 2026-08-22 (day 7) and
2026-09-14 (day 30). If the pages are not deployed by either checkpoint, record
that fact here and reschedule from the actual release date rather than treating
the repository snapshot as production evidence.

Search-result review showed distinct task language for text-to-image, editing,
background work, text/image/reference-to-video, and model evaluation in both
English and Chinese. This supports separate task pages while keeping model pages
focused on evaluation/specification. Phase 3 image intent evidence reviewed on
2026-08-15: [QuillBot AI Image Generator](https://quillbot.com/ai-image-generator)
and [Cloudinary image prompt guidance](https://cloudinary.com/guides/image-generation/image-generation-prompts)
for English task/prompt result shapes; [Alibaba Cloud Model Studio text-to-image
prompt guidance](https://help.aliyun.com/zh/model-studio/text-to-image-prompt)
and [Vidu AI 图片生成器](https://www.vidu.com/zh/ai-image-generator) for Chinese
task language. Earlier video/model evidence remains Runway, Pixlr, Alibaba Cloud
Model Studio, MiniMax, and ByteDance official pages reviewed 2026-08-14. No
search volume, ranking, pricing, or unsupported capability is inferred from
these results.

Current fixed pages remain explicitly registered per locale: `/`, `/pricing`,
`/privacy-policy`, and `/terms-of-service` are `index` for en and zh. Blog is
database-driven and follows its separate explicit published-locale contract.

Shared fields for the entries below:

- Publication: `listed`; canonical paths are locale-free inputs.
- Indexable alternates: none while `noindex`.
- OG asset: pending immutable R2 upload; pages without a verified asset emit a
  summary card and never fall back to local marketing media.
- Structured data: visible `BreadcrumbList`; `FAQPage` only if the same FAQ is
  rendered on the page. No Product/ratings/reviews schema.
- Actual content updated at: unknown unless an entry below records a date.
- Repository checks: phase 3 test, type, format, asset, bundle, build, route inventory, and Cloudflare budget gate passed on 2026-08-15.
- External verification: not available before production deployment.

## tools-directory · en

- Route: `/tools`
- Entity: `directory:tools`; locale: `en`; publication: routable
- Availability: live directory; indexing decision: `noindex`
- Primary intent/query cluster: discover available creation workflows; `AI tools`, adjacent `AI image tools`
- User stage: discover
- Canonical path: `/tools`; indexable alternates: none while noindex
- Adjacent pages: `/tools/ai-image-generator`, future `/models`
- Cannibalization boundary: category discovery only; the detail page owns text-to-image task completion
- Required visible evidence: one content-backed tool card and truthful availability state
- Claim sources: Catalog selector plus exact-locale tool content manifest
- Inbound links: none before the phase 7 discovery wiring
- Outbound links: `/tools/ai-image-generator` → “AI Image Generator”
- OG asset: none until an immutable R2 sharing asset is uploaded
- Structured data: visible `BreadcrumbList`
- Actual content updated at: 2026-08-15; reviewed at: 2026-08-15
- Repository checks: passed phase 3 full test/type/format/build, route inventory, asset, route-bundle, and Cloudflare budget gates on 2026-08-15
- External verification: pending production deployment
- Notes/risks: stays noindex and absent from sitemap/llms until intentional inbound links and production checks exist

## tools-directory · zh

- Route: `/tools`
- Entity: `directory:tools`; locale: `zh`; publication: routable
- Availability: live directory; indexing decision: `noindex`
- Primary intent/query cluster: 发现可用的 AI 创作工作流；`AI 工具`、邻近`AI 图片工具`
- User stage: discover
- Canonical path: `/tools`; indexable alternates: noindex 期间为空
- Adjacent pages: 中文 `/tools/ai-image-generator`，未来 `/models`
- Cannibalization boundary: 只承担类别发现；文生图任务由详情页完成
- Required visible evidence: 一个具备同语言正文的工具卡片和真实可用状态
- Claim sources: Catalog selector 与精确语言 tool content manifest
- Inbound links: 阶段 7 接入发现面之前暂无
- Outbound links: `/tools/ai-image-generator` →“AI 图片生成器”
- OG asset: 等待不可变 R2 分享图，不使用本地回退
- Structured data: 与页面一致的 `BreadcrumbList`
- Actual content updated at: 2026-08-15; reviewed at: 2026-08-15
- Repository checks: 2026-08-15 已通过阶段 3 全量测试、类型、格式、构建、路由清单、资源、route bundle 与 Cloudflare 预算门禁
- External verification: 等待生产部署
- Notes/risks: 在有意接入内链和生产验证前保持 noindex，不进入 sitemap/llms

## ai-image-generator · en

- Route: `/tools/ai-image-generator`
- Entity: `tool:ai-image-generator`; locale: `en`
- Publication: `listed`; availability: `live`; indexing decision: `noindex`
- Primary intent: create an image from a written visual brief
- Query cluster: `AI image generator`, `text to image`, `AI image prompts`
- User stage: create
- Canonical path: `/tools/ai-image-generator`; indexable alternates: none while noindex
- Adjacent pages: future `/models/gpt-image-2`, `/tools/ai-image-editor`
- Cannibalization boundary: completes a general text-to-image task; it does not evaluate GPT Image 2 or promise reference-image editing as the primary workflow
- Required visible evidence: three adaptable prompt examples, workflow, output controls, prompt guidance, use cases, runtime-backed limitations, visible FAQ
- Claim sources: `AGENT_IMAGE_MODEL_OPTIONS`, `DEFAULT_IMAGE_MODEL`, server cost normalization, `generate_image`, Catalog entry policy
- Inbound links: `/tools` → “AI Image Generator”; homepage intentionally deferred to phase 5/7
- Outbound/related links: breadcrumb to `/tools`, CTA to `/pricing`; unopened Catalog relations are filtered out rather than linked to 404s
- OG asset: none pending immutable R2 upload; summary card only
- Structured data: visible `BreadcrumbList` and `FAQPage` from the same typed content
- Actual content updated at: 2026-08-15; reviewed at: 2026-08-15
- Repository checks: passed phase 3 full test/type/format/build, route inventory, asset, route-bundle, and Cloudflare budget gates on 2026-08-15
- External verification: production fetch and Search Console not authorized
- Notes/risks: generated results vary; no result gallery is claimed without verified R2 examples

## ai-image-generator · zh

- Route: `/tools/ai-image-generator`
- Entity: `tool:ai-image-generator`; locale: `zh`
- Publication: `listed`; availability: `live`; indexing decision: `noindex`
- Primary intent: 用清晰的文字需求生成图片
- Query cluster: `AI 图片生成器`、`文生图`、`AI 图片提示词`
- User stage: create
- Canonical path: `/tools/ai-image-generator`; indexable alternates: noindex 期间为空
- Adjacent pages: 未来 `/models/gpt-image-2`、`/tools/ai-image-editor`
- Cannibalization boundary: 完成通用文生图任务；不承担 GPT Image 2 模型评估，也不把参考图编辑作为主要意图
- Required visible evidence: 三组可改写中文提示词、工作流、输出控制、提示词指导、使用场景、运行时限制和可见 FAQ
- Claim sources: `AGENT_IMAGE_MODEL_OPTIONS`、`DEFAULT_IMAGE_MODEL`、服务端价格重算、`generate_image`、Catalog entry policy
- Inbound links: 中文 `/tools` →“AI 图片生成器”；首页内链留到阶段 5/7
- Outbound/related links: 面包屑返回 `/tools`，CTA 到 `/pricing`；未开放的 Catalog 关联页会被过滤，不产生 404 内链
- OG asset: 等待不可变 R2 分享图；当前只输出 summary card
- Structured data: 与页面同源的 `BreadcrumbList` 与 `FAQPage`
- Actual content updated at: 2026-08-15; reviewed at: 2026-08-15
- Repository checks: 2026-08-15 已通过阶段 3 全量测试、类型、格式、构建、路由清单、资源、route bundle 与 Cloudflare 预算门禁
- External verification: 未授权生产抓取和 Search Console
- Notes/risks: 生成结果具有随机性；没有已验证 R2 案例时不宣称结果 gallery

## ai-image-editor · en

- Route: `/tools/ai-image-editor`
- Entity: `tool:ai-image-editor`; availability: `live`; decision: `noindex`
- Primary intent/query cluster: edit or combine supplied images with instructions; `AI image editor`, `generative image editing`
- User stage: create
- Boundary: requires image input; not the zero-input generator or deterministic background extraction
- Required evidence/limits: before/after examples, accepted inputs, generative-edit limitations
- Claim source: `generate_image` edit path and GPT Image 2 runtime entry
- Inbound/outbound: `/tools` → “AI image editor”; related to generator, background editor, GPT Image 2

## ai-image-editor · zh

- Route: `/tools/ai-image-editor`
- Entity: `tool:ai-image-editor`; availability: `live`; decision: `noindex`
- Primary intent/query cluster: 按指令编辑或组合参考图；`AI 图片编辑`、`生成式图片编辑`
- User stage: create
- Boundary: 必须有图片输入，不等同于零输入文生图或确定性抠图
- Required evidence/limits: 前后对比、输入要求和生成式编辑限制
- Claim source: `generate_image` 编辑路径和 GPT Image 2 runtime 条目
- Inbound/outbound: 中文 `/tools` →“AI 图片编辑”；关联图片生成、背景编辑、GPT Image 2

## text-to-video · en

- Route: `/tools/text-to-video`
- Entity: `tool:text-to-video`; availability: `live`; decision: `noindex`
- Primary intent/query cluster: generate a clip from a written prompt; `text to video`, `AI video generator from text`
- User stage: create
- Boundary: zero-reference task page; model pages compare a named engine, while image/reference pages start from media
- Required evidence/limits: real clips/prompts, supported duration/resolution derived from runtime, temporal limitations
- Claim source: `generate_video`, `AGENT_MODEL_OPTIONS`
- Inbound/outbound: homepage and `/tools` → “text to video”; related to image/reference tools and MiniMax H3

## text-to-video · zh

- Route: `/tools/text-to-video`
- Entity: `tool:text-to-video`; availability: `live`; decision: `noindex`
- Primary intent/query cluster: 用文字提示生成视频；`文生视频`、`AI 视频生成器`
- User stage: create
- Boundary: 无参考媒体的任务页；具体模型页只承担模型评估
- Required evidence/limits: 真实视频与提示词、运行时派生时长/分辨率、时序限制
- Claim source: `generate_video`, `AGENT_MODEL_OPTIONS`
- Inbound/outbound: 中文首页和 `/tools` →“文生视频”；关联图生/参考生视频与 MiniMax H3

## image-to-video · en

- Route: `/tools/image-to-video`
- Entity: `tool:image-to-video`; availability: `live`; decision: `noindex`
- Primary intent/query cluster: animate an input image into a video; `image to video AI`, `animate image`
- User stage: create
- Boundary: one or more image-led inputs; reference-to-video covers broader multimodal guidance
- Required evidence/limits: source/result pairs, motion prompts, accepted image count and model limits
- Claim source: `animate_image`, video runtime model catalog
- Inbound/outbound: homepage and `/tools` → “image to video”; related to text/reference tools and Seedance 2.0

## image-to-video · zh

- Route: `/tools/image-to-video`
- Entity: `tool:image-to-video`; availability: `live`; decision: `noindex`
- Primary intent/query cluster: 将图片转成动态视频；`图生视频`、`图片生成视频`
- User stage: create
- Boundary: 以图片为起点；多模态参考需求由参考生视频页承担
- Required evidence/limits: 原图/结果、运动提示词、图片数量和模型限制
- Claim source: `animate_image` 与视频 runtime Catalog
- Inbound/outbound: 中文首页和 `/tools` →“图生视频”；关联文生/参考生视频与 Seedance 2.0

## reference-to-video · en

- Route: `/tools/reference-to-video`
- Entity: `tool:reference-to-video`; availability: `live`; decision: `noindex`
- Primary intent/query cluster: direct a video with image/video/audio references; `reference to video`, `multimodal video generation`
- User stage: create
- Boundary: broader reference workflow than image-to-video; executable only after deployment readiness confirms routing and storage
- Required evidence/limits: supported reference combinations, real workflow, readiness and input-limit explanation
- Claim source: Agent reference-media validation and server deployment configuration
- Inbound/outbound: `/tools` → “reference-guided video”; related to text/image tools and Seedance 2.0

## reference-to-video · zh

- Route: `/tools/reference-to-video`
- Entity: `tool:reference-to-video`; availability: `live`; decision: `noindex`
- Primary intent/query cluster: 使用图片、视频或音频参考生成视频；`参考生视频`、`多模态视频生成`
- User stage: create
- Boundary: 比图生视频覆盖更广；必须通过模型路由与存储就绪检查才可提交
- Required evidence/limits: 支持的参考组合、真实流程、就绪状态与输入上限
- Claim source: Agent 参考媒体校验和服务端部署配置
- Inbound/outbound: 中文 `/tools` →“参考生视频”；关联文生/图生视频与 Seedance 2.0

## background-remover · en

- Route: `/tools/background-remover`
- Entity: `tool:background-remover`; availability: `beta`; decision: `noindex`
- Primary intent/query cluster: generatively replace or simplify a background; `AI background editor`, adjacent `background remover`
- User stage: create
- Boundary: not deterministic segmentation; never promises transparent PNG, alpha masks, or unchanged subject pixels
- Required evidence/limits: visible before/after, explicit beta wording, failure cases and output-format truth
- Claim source: GPT Image 2 general editing path in `image-tools.ts`
- Inbound/outbound: `/tools` → “generative background editor”; related to image editor and GPT Image 2

## background-remover · zh

- Route: `/tools/background-remover`
- Entity: `tool:background-remover`; availability: `beta`; decision: `noindex`
- Primary intent/query cluster: 生成式替换或简化背景；`AI 背景编辑`，邻近`图片去背景`
- User stage: create
- Boundary: 不是确定性分割；不承诺透明 PNG、alpha mask 或主体像素不变
- Required evidence/limits: 前后对比、Beta 说明、失败案例和真实输出格式
- Claim source: `image-tools.ts` 中 GPT Image 2 通用编辑路径
- Inbound/outbound: 中文 `/tools` →“生成式背景编辑”；关联图片编辑和 GPT Image 2

## gpt-image-2 · en

- Route: `/models/gpt-image-2`
- Entity: `model:gpt-image-2`; availability: `live`; decision: `noindex`
- Primary intent/query cluster: evaluate the available GPT Image 2 model and its supported controls; `GPT Image 2 model`
- User stage: compare
- Boundary: model evidence/specification page, not the general image-generation or editing task page
- Required evidence/limits: runtime-derived resolutions, qualities, reference limit, real examples and costs from server truth
- Claim source: `AGENT_IMAGE_MODEL_OPTIONS`, provider mappings and credit functions
- Inbound/outbound: `/models` and related tool pages → “GPT Image 2”; related to image generator/editor

## gpt-image-2 · zh

- Route: `/models/gpt-image-2`
- Entity: `model:gpt-image-2`; availability: `live`; decision: `noindex`
- Primary intent/query cluster: 评估 GPT Image 2 及当前支持参数；`GPT Image 2 模型`
- User stage: compare
- Boundary: 模型规格/证据页，不争夺通用文生图或图片编辑任务意图
- Required evidence/limits: runtime 派生分辨率、质量、参考图上限、真实案例和服务端积分
- Claim source: `AGENT_IMAGE_MODEL_OPTIONS`、Provider mapping 与积分函数
- Inbound/outbound: 中文 `/models` 与关联工具页 →“GPT Image 2”；关联图片生成/编辑

## minimax-h3 · en

- Route: `/models/minimax-h3`
- Entity: `model:minimax-h3`; availability: `live`; decision: `noindex`
- Primary intent/query cluster: evaluate MiniMax H3 video generation in this product; `MiniMax H3 video model`
- User stage: compare
- Boundary: named-model evaluation, not a generic text/image-to-video task page
- Required evidence/limits: runtime-derived duration, resolution, aspect ratios, image count, provider availability and examples
- Claim source: `AGENT_MODEL_OPTIONS.minimax-h3`; MiniMax official model/API docs only for reviewed external context
- Inbound/outbound: `/models` and tool pages → “MiniMax H3”; related to video tools and Seedance 2.5

## minimax-h3 · zh

- Route: `/models/minimax-h3`
- Entity: `model:minimax-h3`; availability: `live`; decision: `noindex`
- Primary intent/query cluster: 评估产品内 MiniMax H3 视频生成；`MiniMax H3 视频模型`
- User stage: compare
- Boundary: 具体模型评估，不替代通用文生/图生视频任务页
- Required evidence/limits: runtime 派生时长、分辨率、比例、图片数、Provider 可用性和案例
- Claim source: `AGENT_MODEL_OPTIONS.minimax-h3`；MiniMax 官方模型/API 文档仅作外部背景
- Inbound/outbound: 中文 `/models` 与工具页 →“MiniMax H3”；关联视频工具与 Seedance 2.5

## seedance-2-5 · en

- Route: `/models/seedance-2-5`
- Entity: `model:seedance-2-5`; availability: `live`; decision: `noindex`
- Primary intent/query cluster: evaluate the product's Seedance 2.5 route and supported parameters; `Seedance 2.5 model`
- User stage: compare
- Boundary: only product-verified runtime facts; no unsupported official/provider claims
- Required evidence/limits: runtime parameters, actual configured provider route, examples, audio/reference and resolution limits
- Claim source: `AGENT_MODEL_OPTIONS.seedance-2-5`; external specification verification pending
- Inbound/outbound: `/models` and video tools → “Seedance 2.5”; related to MiniMax H3 and task pages

## seedance-2-5 · zh

- Route: `/models/seedance-2-5`
- Entity: `model:seedance-2-5`; availability: `live`; decision: `noindex`
- Primary intent/query cluster: 评估产品内 Seedance 2.5 路由与支持参数；`Seedance 2.5 模型`
- User stage: compare
- Boundary: 只描述产品 runtime 可验证事实，不扩写未核实官方/Provider 能力
- Required evidence/limits: runtime 参数、实际 Provider 路由、案例、音频/参考和分辨率限制
- Claim source: `AGENT_MODEL_OPTIONS.seedance-2-5`；外部规格待上线前核验
- Inbound/outbound: 中文 `/models` 与视频工具 →“Seedance 2.5”；关联 MiniMax H3 与任务页

## seedance-2-0 · en

- Route: `/models/seedance-2-0`
- Entity: `model:seedance-2-0`; availability: `live`; decision: `noindex`
- Primary intent/query cluster: evaluate Seedance 2.0 video generation and multimodal use; `Seedance 2.0 model`
- User stage: compare
- Boundary: model capabilities/specification; task execution remains on image/reference/text-to-video pages
- Required evidence/limits: runtime parameters and provider route, real examples, inputs and limitations
- Claim source: `AGENT_MODEL_OPTIONS.seedance-2-0`; ByteDance Seedance 2.0 official launch/model pages reviewed 2026-08-14
- Inbound/outbound: `/models` and image/reference tools → “Seedance 2.0”; related to Seedance 2.5

## seedance-2-0 · zh

- Route: `/models/seedance-2-0`
- Entity: `model:seedance-2-0`; availability: `live`; decision: `noindex`
- Primary intent/query cluster: 评估 Seedance 2.0 视频生成与多模态使用；`Seedance 2.0 模型`
- User stage: compare
- Boundary: 模型能力/规格页；图生、参考生、文生任务仍由工具页完成
- Required evidence/limits: runtime 参数和 Provider 路由、真实案例、输入及限制
- Claim source: `AGENT_MODEL_OPTIONS.seedance-2-0`；字节 Seedance 2.0 官方发布/模型页，2026-08-14 复核
- Inbound/outbound: 中文 `/models` 与图生/参考工具 →“Seedance 2.0”；关联 Seedance 2.5
