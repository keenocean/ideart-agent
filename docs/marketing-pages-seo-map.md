# Marketing pages SEO map

Reviewed on 2026-08-14. This is the durable page/locale decision record; runtime
Catalog and server validation remain authoritative for product capability.

All Catalog routes below are infrastructure registrations only. They have no
public detail route or substantive localized body in phase 1, so every concrete
locale URL is `noindex` and omitted from sitemap, hreflang, llms, navigation,
and other discovery surfaces. A later phase may change one locale to `index`
only after its own content and release gate passes; the other locale does not
follow automatically.

Search-result review showed distinct task language for text-to-image, editing,
background work, text/image/reference-to-video, and model evaluation in both
English and Chinese. This supports separate task pages while keeping model pages
focused on evaluation/specification. Intent evidence reviewed: Runway AI Video
Generator, Pixlr, Alibaba Cloud Model Studio video generation, MiniMax model/API
documentation, and ByteDance Seedance 2.0 official model/launch pages. No search
volume, ranking, pricing, or unsupported model capability is inferred from those
results.

Current fixed pages remain explicitly registered per locale: `/`, `/pricing`,
`/privacy-policy`, and `/terms-of-service` are `index` for en and zh. Blog is
database-driven and follows its separate explicit published-locale contract.

Shared fields for the entries below:

- Publication: `listed`; canonical paths are locale-free inputs.
- Indexable alternates: none while `noindex`.
- OG asset: pending immutable R2 upload; no local fallback is permitted.
- Structured data: visible `BreadcrumbList`; `FAQPage` only if the same FAQ is
  rendered on the page. No Product/ratings/reviews schema.
- Actual content updated at: unknown; phase 1 contains no detail content.
- Repository checks: phase 0/1 test, type, format, asset, bundle, and build gate.
- External verification: not available before production deployment.

## ai-image-generator · en

- Route: `/tools/ai-image-generator`
- Entity: `tool:ai-image-generator`; availability: `live`; decision: `noindex`
- Primary intent/query cluster: create an AI image from a text prompt; `AI image generator`, `text to image`
- User stage: create
- Boundary: task completion page, not a GPT Image 2 model evaluation page
- Required evidence/limits: real prompt examples, image settings, editing boundary, model/runtime limits
- Claim source: `AGENT_IMAGE_MODEL_OPTIONS`, `generate_image`
- Inbound/outbound: `/tools` and homepage → “AI image generator”; related to image editor and GPT Image 2

## ai-image-generator · zh

- Route: `/tools/ai-image-generator`
- Entity: `tool:ai-image-generator`; availability: `live`; decision: `noindex`
- Primary intent/query cluster: 用提示词生成图片；`AI 图片生成器`、`文生图`
- User stage: create
- Boundary: 解决生成任务，不承担 GPT Image 2 模型评估意图
- Required evidence/limits: 中文提示词案例、图片设置、编辑边界和运行时限制
- Claim source: `AGENT_IMAGE_MODEL_OPTIONS`, `generate_image`
- Inbound/outbound: 中文 `/tools` 与首页 →“AI 图片生成器”；关联图片编辑和 GPT Image 2

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
