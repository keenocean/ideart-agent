# 通用 Agent 模板最终形态实施计划

> 日期：2026-08-13  
> 状态：本地实现与自动化验证已完成；待人工审查 migration、staging 验证和 production 发布  
> 当前模式：单 Agent；为未来多 Agent 保留 ID 和接口，但本期不实现编排

## 0. 实施状态（2026-08-13）

- Phase 0-4 已按顺序完成；Phase 5 的本地测试、格式、类型、Node/Cloudflare 构建和 bundle 防泄露检查已通过。
- 唯一数据库 artifact 为 `drizzle/0001_tense_starfox.sql`，只新增 `agent_turn_lease` 及必要索引；SHA-256 为 `595f7d3cc7743faa1d0572d9bca9b32448e668bddbfb1ae8994187576bb311e8`。
- migration 尚未应用，staging 多 isolate/真实 Provider 验证、首次 drain 和 production 发布仍须严格按 Phase 5 执行；不得把本地验证记录误写成已发布。
- 本次未迁移或重命名原图片/视频 Provider、工具、settings、SSE、storage、计费和媒体 UI 契约，也未新增 adapter 或 orchestration 目录。

## 1. 最终目标

把当前 Video Agent 改造成一套可复用的 Agent SaaS 模板，同时保证现有视频业务行为不回退：

1. 模板提供稳定、不可被后台覆盖的 Agent Runtime、安全边界、会话、SSE、Skill、配置和审计能力。
2. 每个新项目通常只需修改一个服务端项目定义，不再修改聊天主链路或内建媒体能力。
3. 业务 System Prompt 可在后台修改，保存后下一次 Agent Turn 即生效，不需要重新构建或部署 Worker。
4. Skill 继续保存在私有 R2；只有用户选中 Skill 时才拉取并注入本轮 System Prompt。
5. 工具只能由代码白名单授权。后台 Prompt、用户输入和 R2 Skill 都不能新增工具或扩大权限。
6. 生图、生视频是模板内建的标准 Agent 能力；当前 Video Agent 的工具、设置、计费、任务和 UI 实现继续原位复用，不为假设中的无媒体 Agent 提前抽象。

最终希望新项目通常只替换以下项目定义面：

```text
src/config/agent.ts    服务端项目身份、默认 Prompt 和 maxTurns
```

其余 Runtime、内建图片/视频能力、聊天 API、历史消息、Skill/R2、媒体 UI 和后台 Prompt 编辑器不应随项目变化。只有真实项目以后明确不需要媒体能力或引入完全不同的工具生命周期时，才另行评估 adapter，不纳入本期。

## 2. 已确认的现状

### 可直接复用

- `src/modules/agent/service.ts:154-167` 的 Agent 创建和事件循环。
- `src/routes/api/agent/chat.ts:121-196,206-297` 的 SSE、消息持久化和事件归并。
- `src/modules/agent/history.ts:18-74` 的数据库消息到 SDK 消息转换。
- `src/modules/agent/skills.ts:27-82` 的 Skill Prompt 安全边界和只读资源工具。
- `src/modules/config/service.ts`、`src/routes/api/admin/config.ts` 和配置表构成的后台 KV 配置能力。
- 三种数据库的 `config` 表已经是 `name + text value`，System Prompt 不需要数据库迁移。

### 必须调整的边界

| 位置                                                 | 当前耦合                                       | 模板化目标                                     |
| ---------------------------------------------------- | ---------------------------------------------- | ---------------------------------------------- |
| `src/modules/agent/service.ts:29-43`                 | Video Agent 身份、工具名、模型和 clip 规则写死 | 只迁移身份/默认 Prompt；内建媒体规则原位保留   |
| `src/modules/agent/service.ts:249-281`               | 视频设置拼入用户消息                           | 保持现有 Turn Context 行为和命名，不做抽象迁移 |
| `src/modules/agent/tools.ts:789-984`                 | 固定注册图片/视频工具并按 `mediaMode` 切换     | 作为模板内建媒体能力原位保留                   |
| `src/routes/api/agent/chat.ts:87-107`                | 固定媒体参数校验和图片/视频积分预检            | 原位保留；只在外围接入 Turn 准入和审计         |
| `src/routes/api/agent/chat.$sessionId.stop.ts:22-28` | 固定媒体生成任务取消                           | 保留现有流程，最小增加 `turnId` 精确过滤       |
| `src/routes/api/agent/chat.$sessionId.ts:40-63`      | 悬空调用终结遗漏 `generate_image`              | 使用通用 long-running tool 元数据              |
| `src/lib/agent-settings.ts`                          | 图片/视频模型、价格和能力                      | 作为模板内建媒体配置原位保留                   |
| `src/components/agent/*`、会话页                     | 固定显示视频模型和生成设置                     | 作为模板内建媒体 UI 原位保留                   |

### 当前必须修复或由回归测试锁定的一致性问题

1. `src/modules/config/service.ts:12-24` 使用 Worker isolate 内存缓存，TTL 为 1 小时。保存配置只清理当前 isolate 的缓存；其他热 isolate 仍可能在一小时内使用或显示旧 Prompt。因此 Agent Turn 和后台 Prompt 编辑器的 GET 读取都必须使用专用强新鲜度路径，不能经过现有 `getAllConfigs()`/`getAdminConfigs()` 的 1 小时缓存。
2. 当前用户消息重复进入模型上下文的问题已经修复：chat route 将持久化后的用户消息 ID 传给 Runtime，Runtime 加载历史时排除该 ID，`history.ts` 也已有对应过滤和单元回归测试。Phase 0 不再“先复现、再修复”该问题，而是保留现有实现并补充 route/Runtime 级回归测试，证明 SDK 收到的 history + query 中本轮用户输入始终只出现一次。
3. 三种 schema template 和当前 migration 已经包含 nullable `chat_message.metadata`。Phase 1 的真实工作是定义 user/assistant 两类版本化结构并打通写入关联，Phase 4 再固化兼容读取和授权审计路径；不得默认重复新增该字段。
4. `respErr()` 默认返回 HTTP 200。Prompt 校验失败如果只返回错误 envelope，将无法满足“明确 HTTP 400”的验收标准。保存路径必须显式设置 status，并校验 request body 中对应字段确实是字符串。
5. 当前最小间隔限流使用 Worker isolate 内存 Map，不能充当同一 chat 的并发 Turn 锁。最终实现必须使用数据库原子租约序列化同一 chat 的 Turn，并用显式 `turnId` 关联用户消息、assistant/tool 消息和审计快照。
6. 当前 Agent 已支持 `generate_image`：默认/auto 模式注册图片和两个视频工具，image/video 模式分别缩小工具集合，预检、计费、UI 和 durable `ai_task` 也覆盖图片。但历史恢复仍只把 `generate_video`/`animate_image` 的悬空调用终结，遗漏 `generate_image`。Phase 0 必须把真实图片/视频能力锁入基线，并最小修复该恢复遗漏，不能把旧的“两种视频工具”描述当成当前事实。

## 3. 架构决策

### 3.1 System Prompt 分层，而不是整段交给后台

最终 Prompt 固定按以下顺序组装：

```text
1. Core Guardrails                 代码内置，不可后台编辑
2. Project Business Prompt        后台覆盖；空值回退到项目默认值
3. Effective Capability Policy    根据本轮实际注册的工具和能力自动生成
4. Selected Skill                 选中时从 R2 加载并放入明确边界
```

图片/视频参数、附件摘要等易变信息不放进 System Prompt，而是作为独立 Turn Context 附加到用户消息。

后台界面可以对用户称为“System Prompt”，但数据库字段实际只控制第 2 层。第 1、3 层永远由代码控制。

Prompt hash 分为两个明确语义，避免把“业务 Prompt 版本”和“本轮模型实际看到的 Prompt”混为一个值：

- `businessPromptHash`：对第 2 层在默认/后台来源解析后、变量替换前的原始模板 UTF-8 字节做 SHA-256，因此不会因为本轮工具集合改变而冒充新的业务 Prompt 版本。
- `effectivePromptHash`：对第 1-4 层完整组装、变量替换后实际传给 SDK 的 UTF-8 字节做 SHA-256。

`promptSource: default | admin` 只描述第 2 层来源。本期不保存 Prompt 正文快照，因此本计划的审计保证是“可追踪”而不是“可恢复历史正文”；真正的完整可复现需要以后增加版本表或快照。

这样可同时满足：

- 运营人员无需部署即可改业务角色、语气和工作流说明。
- 后台误操作、Prompt Injection 或恶意 Skill 不能获得未注册工具。
- 实际工具列表与模型看到的工具政策不会漂移。

### 3.2 不引入通用模板引擎

首版仅支持白名单变量：

- `{{app_name}}`
- `{{agent_name}}`
- `{{available_tools}}`

未知变量保存时返回 HTTP 400；运行时在组装前再校验一次，防止手工改库、旧数据或导入数据绕过后台 API。不支持条件、循环、表达式、文件 include 或脚本执行。实现为纯字符串替换，不增加依赖。

### 3.3 Prompt 配置存 D1，Skill 内容存 R2

| 内容               | 存储                            | 原因                                 |
| ------------------ | ------------------------------- | ------------------------------------ |
| Core Guardrails    | Worker 代码                     | 安全边界必须与部署版本一致           |
| 项目默认 Prompt    | `src/config/agent.ts`           | 模板克隆后有可靠默认行为，可版本控制 |
| 后台 Prompt 覆盖   | D1 `config.agent_system_prompt` | 小文本、需要后台即时修改             |
| Skill 正文和资源   | 私有 R2 release                 | 数量大、按需读取、不占 Worker bundle |
| Prompt hashes/来源 | 消息 metadata/日志              | 可追溯而不复制完整 Prompt            |

不要把完整 System Prompt 也放进 R2：它会把关键运行配置变成对象存储一致性问题，也不利于后台表单、权限和审计。

### 3.4 单 Agent 优先，接口为未来扩展留位

本期只支持每个项目一个 `primary` Agent，不做多 Agent 路由、handoff 或协同。`AgentDefinition.id` 和审计字段保留，以后可以扩展为多定义，不需要推翻消息格式。

### 3.5 图片和视频是模板内建能力

本期不引入 `AgentProjectAdapter`、纯文本 adapter、Video adapter 或项目 UI extension。现有 Agent 的图片/视频设置、工具、计费、任务、Storage、Provider、Stop 和 renderer 是模板标准能力，继续使用现有文件、函数和变量名。

项目定义保持最小：

```ts
interface AgentDefinition {
  id: string;
  name: string;
  defaultSystemPrompt: string;
  maxTurns: number;
}

class AgentRequestError extends Error {
  status: number;
  code: string;
  data?: unknown;
  headers?: HeadersInit;
}
```

- `src/config/agent.ts` 是 server-only 项目定义面，只通过 TanStack Start 的 `createServerOnlyFn` 或等效构建期边界由服务端 Agent 代码读取；客户端不得导入。构建验证必须扫描客户端产物，确认默认业务 Prompt 和 Core Guardrails 的唯一标记不存在；“恢复默认 Prompt”按钮只保存空字符串，不把默认正文送到客户端。
- `src/modules/agent/tools.ts`、`image-tools.ts`、`paywall.ts`、`src/lib/agent-settings.ts`、现有 Composer 和媒体 renderer 原位保留。chat route 继续使用现有 settings normalization、图片/视频积分预检和错误响应，只在外围增加 Turn 准入、审计及通用错误映射。
- Runtime 继续从现有工具创建函数取得本轮 SDK 实际工具对象。创建后必须校验工具名唯一；`longRunningToolNames` 直接由实际启用工具与内建集合 `generate_image`、`generate_video`、`animate_image` 求交得到，去重后必须是实际 `toolNames` 的子集。
- Prompt 构建器只描述本轮实际工具集合，不从后台 Prompt、Skill 或历史消息解析授权。配置错误在用户消息持久化和模型调用前失败。
- `AgentRequestError` 只统一本期新增的 Prompt/Turn/租约错误；现有图片/视频参数错误 400、积分不足 402、Provider/配置不可用 503 的 response body 和 HTTP 行为保持不变，不为统一异常体系重写稳定媒体路径。
- `src/modules/agent/*` 当前对 chats、ai-tasks、config、storage 的既有跨 module 组合依赖登记为受限例外。本期不扩大该集合、不允许反向依赖，也不为消除历史依赖而搬迁稳定媒体代码；未来出现真实的第二种工具生命周期时再重新评估编排层。

### 3.6 每个 Turn 只准备一次执行快照

Runtime 增加 `prepareAgentTurn()`，一次性产生 `PreparedAgentTurn`：

```ts
interface PreparedAgentTurn {
  turnId: string;
  definitionId: string;
  settings: AgentComposerSettings;
  history: NormalizedMessageParam[];
  systemPrompt: string;
  userMessage: string;
  tools: readonly AgentToolDefinition[];
  audit: AgentTurnMetadataV1;
}
```

每次请求在进入准备阶段前生成唯一 `turnId`，并将它传入、保存到 `PreparedAgentTurn`。准备阶段只读取一次 latest Prompt，只创建一次实际工具集合，然后从同一份快照生成 capability policy、hash 和 audit metadata。路由取得数据库 Turn 租约后完成 normalize/preflight/prepare，再写入用户消息，最后执行这份 prepared turn。Phase 1 即打通 user/assistant metadata 持久化，后续阶段不得重新读取 Prompt 或创建工具来重建审计数据。这样可以同时保证：

- 审计 hash/工具列表与实际执行完全一致。
- 当前用户消息不在 history 和 SDK `query()` 中重复。
- 准备失败时请求未被接受，不写入一条无法对应到实际 Runtime 快照的用户 Turn。

### 3.7 同一 Chat 的 Turn 必须由数据库租约串行化

最小可靠模型是新增 `agent_turn_lease` 表，而不是复用 isolate 内存 Map 或把锁塞进难以跨数据库条件更新的 JSON metadata：

```text
chatId            唯一键；同一 chat 同时只能有一条租约
userId            所有者校验
turnId            本次租约 owner token
expiresAt         崩溃恢复边界
cancelRequestedAt 跨请求停止信号，可为空
createdAt/updatedAt
```

为了让尚未创建 `chat` 行的新 session 也能在 prepare 前取得锁，`agent_turn_lease.chatId` 不设 chat 外键；它是带 TTL 的临时协调记录。对已存在 chat 必须先验证 owner，对新 session 必须先通过 session ID 和认证校验；prepare 成功后才 `ensureChat()` 并写入用户消息。

请求顺序固定为：认证和基本输入/owner 校验 -> 生成 `turnId` -> 原子 acquire/reclaim 租约 -> normalize/preflight/prepare -> ensure chat + 持久化用户消息 -> execute/persist assistant rounds -> `finally` 条件释放。未过期租约冲突返回结构化 HTTP 409；同一次请求在 acquire 后的任何失败都进入清理路径。

准入采用保守的最小规则，不在首版自动恢复崩溃 Turn：

- 存在未过期 lease：返回 `AgentRequestError(409, 'turn_in_progress')`。
- lease 已过期或不存在，但主库仍有该 session 的 pending/processing `ai_task`：不启动新 Turn，返回 `AgentRequestError(409, 'stale_run_requires_stop')`，由 UI 提供 Stop 后重试。
- 只有 lease 已过期且主库确认该 session 没有 active `ai_task` 时，才允许 CAS 回收；没有 lease 且没有 active task 时正常 acquire。
- 新图片/视频任务都把 `turnId` 写入现有 `ai_task.options`。为关闭“检查后旧工具才创建任务”的竞态，工具在 durable task 创建后、调用上游 Provider 前必须再次校验 lease ownership；失去所有权时将本地任务终结/退款，不调用 Provider。

租约不是永久布尔锁：

- acquire 依赖 `chatId` 唯一约束；只有不存在租约或原租约确已过期时才允许原子获取/回收。
- acquire/reclaim/renew/cancel/release 必须使用主库上的单条条件写或事务，并检查 affected row；禁止“先无锁读取、再写入”，禁止使用应用缓存或读副本决定租约所有权。过期判断使用数据库时间，避免不同 isolate 时钟漂移。
- 长 Turn 以明显短于 TTL 的间隔续租；renew/release 都必须同时匹配 `chatId + turnId`，旧请求不能续租或删除新请求的租约。
- Runtime 在每个模型轮次、工具调用前、durable task 创建后/Provider 调用前和 assistant 持久化前验证租约所有权；续租或所有权检查失败立即 abort，不再启动新的外部副作用或写消息。
- stop route 先从主库读取当前 lease。存在未过期 lease 时，以 `chatId + userId + turnId` compare-and-set 更新 `cancelRequestedAt`，再调用现有媒体取消函数且只处理该 `turnId` 的图片/视频任务；lease 已更换时不得误取消新 Turn。不存在有效 lease 时，stop 可取消该 owner/session 下仍为 active、且属于已过期 lease、orphan 或没有 `turnId` 的 legacy 任务。取消必须先原子终结本地 task 并保证退款幂等，再 best-effort 取消上游。原执行流观察到信号后终止并条件释放租约；stop 不得无条件删除 lease。
- 首版不自动重放、恢复或接管崩溃 Turn；`stale_run_requires_stop -> Stop -> retry` 是明确产品流程。
- 原有最小间隔 rate limit 只用于防滥用，不能参与“同一 chat 仅一个 active Turn”的正确性证明。

三种 schema template、当前工作 schema 和生产 migration 都要包含该表；Phase 1 按项目规则生成一次并人工审查 migration，Phase 5 只应用同一 artifact。会话 run state 是“有效 lease 或现有媒体 active `ai_task`”的并集；请求准入同时检查 lease 和上述 orphan/legacy active-task guard，不能只看其中一个。

### 3.8 消息关联和历史工具兼容是 Runtime 规则

消息 metadata 使用显式关联，不依赖 `createdAt` 邻接关系：

- 用户消息保存完整 `AgentTurnMetadataV1`，其中包含 `schemaVersion: 1`、`kind: 'user'` 和 `turnId`。
- 该 Turn 的每条 assistant 消息保存轻量 `AgentAssistantMessageMetadataV1`，至少包含 `schemaVersion: 1`、`kind: 'assistant'`、`turnId`、`parentUserMessageId` 和 `roundIndex`。
- assistant/tool 历史通过 `turnId`/`parentUserMessageId` 找到当时用户 Turn 的 `toolNames` 与 `longRunningToolNames`；不得仅按时间顺序猜测归属。

只有能通过关联 metadata 证明当时已授权、并且本轮仍注册的已完成工具，才保持结构化 `tool_use/tool_result` 回放。历史中已经不再注册、无法证明当时授权或关联损坏的 legacy/unknown tool 不得为了回放而重新授权；它们在进入 SDK 历史前转换为有长度上限的普通文本摘要。未完成工具先根据关联 Turn 当时记录的 `toolNames` 和 `longRunningToolNames` 终结为 canceled/interrupted，不将悬空 tool call 发给 Provider。旧消息没有 metadata 时采用保守规则：完成调用降级为有界文本，任何无结果调用终结为 interrupted；不猜测归属或重新授权。

UI 仍保留 unknown tool 通用 fallback，但 UI 能显示旧调用不等于 Runtime 可以再次调用该工具。

### 3.9 最小命名变更和外部兼容

本次模板化遵循“外部契约不变、内部边界渐进演进”的原则。架构调整不授权顺手清理或统一命名；除非旧名称阻碍 `turnId`/租约正确性或与新契约产生真实冲突，否则保留原名称。

- 非必须不修改原代码。优先在现有稳定实现外增加薄包装或调用入口并复用原函数；只有为修复已确认缺陷、满足安全/并发正确性或完成本计划验收所必需时，才修改原实现。
- 每处原代码修改都必须能对应到具体需求或测试；无法说明必要性的改动从当前 Phase 删除或延期。不得借模板化顺手重写 Provider、计费、AI Task、Storage、历史转换或 UI 渲染等已稳定逻辑。
- 保留现有工具名 `generate_image`、`generate_video`、`animate_image`，以及现有 API 路径、request 字段、response envelope、SSE event、任务状态和错误数据结构。
- 保留 `mediaMode`、图片/视频模型字段、Provider、AI Task、Storage、积分、翻译 key 等现有业务名称；不为了“更通用”而改写。
- 不批量重命名局部变量、函数、测试用例或导出符号。只有新增的通用边界使用 `PreparedAgentTurn`、`AgentRequestError`、`turnId` 等新名称。
- 客户端继续使用现有 `video-agent:*` storage key；本期没有通用化收益，不安排 key 迁移，不得让现有用户设置失效。
- 数据库只新增计划明确要求的 `agent_turn_lease`；不重命名现有表、字段或枚举值，也不借本次改造清理历史 schema。
- 如果确实必须改名，需在对应 Phase 中说明原因、影响面和兼容方式，并用测试证明旧外部契约仍可用。兼容导出只在存在真实消费者时增加，避免为内部符号制造永久双命名。
- 必要改名和行为修改应尽量拆成可独立审查的 diff/commit；禁止把无关格式化、变量重命名或风格清理混入功能改造。
- 如果通过新增入口加复用即可满足目标，不为追求目录“整齐”搬迁原文件；兼容包装确认无消费者后再单独清理，不与功能实施同时进行。

## 4. 目标目录和责任边界

```text
src/core/agent/
├── types.ts                 通用 AgentDefinition/Turn/Audit 类型
├── errors.ts                AgentRequestError 与通用 HTTP 错误契约
├── guardrails.ts            不可编辑安全边界
├── prompt-builder.ts        纯函数：分层组装、变量替换、hash
└── prompt-config.ts         长度、变量、空值等校验

src/config/
└── agent.ts                 当前项目唯一的 AgentDefinition

src/modules/agent/
├── service.ts               原位增加 prepare/execute 快照，保留现有媒体执行
├── profile.ts               解析 definition + D1 override
├── turn-lease.ts            数据库 Turn 租约、续租、取消信号和所有权检查
├── tools.ts                 原位保留内建图片/视频工具和生命周期
├── image-tools.ts           原位保留生图实现
├── paywall.ts               原位保留媒体计费预检
├── skills.ts                原位保持 R2 Skill 边界
└── history.ts               原位补充 metadata 关联和 legacy tool 降级

src/components/agent/*       原位保留现有 Composer、媒体设置和 renderer
```

依赖方向必须保持单向：

```text
routes -> modules/agent -> core/agent + config + lib
                      -> 既有 chats/ai-tasks/config/storage 受限依赖
components -> 现有 client-safe agent settings/UI（不得导入 server modules/core db）
```

`src/modules/agent/*` 继续承担内建媒体 Agent 的产品编排。实施时同步更新 `AGENTS.md`，把当前已经存在的 agent -> chats/ai-tasks/config/storage 依赖登记为受限例外：只允许 Agent 单向调用现有公开 service，不允许这些模块反向导入 Agent，也不允许本期新增其他 module 依赖。Core 不得导入 Agent、媒体、计费或 Provider 实现。该例外用于如实记录现状，不授权继续扩大耦合。

## 5. 分阶段实施

### Phase 0：先锁定现有行为

目标：后续抽象不改变当前 Video Agent 的有效行为，并把已经完成的“排除当前持久化用户消息”修复锁成不可回退的兼容要求。本阶段不再复现或重新修复该问题。

1. 给 `src/modules/agent/service.ts` 抽出当前 Prompt 组装的可测试入口。
2. 增加回归测试，锁定：
   - 将旧完整 System Prompt 保存为 migration reference snapshot；重构后以分层顺序、必要规则和工具能力的结构化断言证明语义等价，不强求动态 capability policy 加入后仍字节级相同。
   - 选择 Skill 时的边界和顺序。
   - auto/image/video 三种 `mediaMode` 的图片/视频设置注入用户消息内容，以及图片/视频积分预检的当前语义。
   - 未选 Skill 时，auto/未指定模式实际注册 `generate_image`、`generate_video`、`animate_image`；image 模式只注册 `generate_image`；video 模式只注册 `generate_video`、`animate_image`。选中 Skill 时在对应集合前增加按需 `read_skill_resource`。
   - 现有 API request/response、SSE event、工具名、settings 字段、任务状态和公开导出名；后续 Phase 不得用模板化为由改变这些外部契约。
3. 保留现有 `history.test.ts` 排除 message ID 的单元测试，并增加 route/Runtime 回归测试，证明持久化消息 ID 被传到历史加载器，且本轮用户消息在 SDK 的 history + query 中只出现一次。测试直接锁定当前已修复行为，不要求先让旧 bug 重新出现，也不再安排另一套去重实现。
4. 为历史恢复增加回归测试并做最小修复：没有 active task 时，悬空的 `generate_image` 与两个视频工具一样被终结为 interrupted；不得把当前遗漏锁成兼容行为。
5. 扩展现有 `src/modules/agent/paywall.test.ts`、`tools.test.ts`、`image-tools.test.ts`、`skills.test.ts`，锁定图片/视频预检、扣费、退回、取消和工具结果。

停止条件：未开始通用化重构；当前 message ID 排除链路保持不变，mapper 级与 route/Runtime 级测试都证明本轮消息只进入模型一次；auto/image/video 工具集合与图片/视频计费行为被锁定；`generate_image` 悬空调用恢复遗漏已最小修复；其余新增回归测试全部通过。

### Phase 1：建立通用 Prompt、Turn 身份和并发基础

1. 新建 `src/core/agent/{types,errors,guardrails,prompt-builder,prompt-config}.ts`：
   - `types.ts` 定义带唯一 `turnId` 的 `PreparedAgentTurn`、完整用户 `AgentTurnMetadataV1` 和轻量 assistant `AgentAssistantMessageMetadataV1`。
   - `errors.ts` 定义 `AgentRequestError` 及唯一的通用 HTTP 序列化入口。
2. 新建 `src/config/agent.ts`，把现有 Video Agent 业务身份和默认 Prompt 原样迁入。
   - definition 通过 `createServerOnlyFn` 或等效 server-only 边界读取；客户端不导入该文件。
   - 禁止在客户端 bundle 中导入该 definition；增加带唯一 Prompt 标记的客户端产物扫描回归测试。
3. 新建 `src/modules/agent/profile.ts`：
   - 加载 `AgentDefinition`。
   - 从数据库最新版本读取 `agent_system_prompt`，不经过 1 小时内存缓存。
   - 空白覆盖值回退到项目默认 Prompt。
   - 生成 `promptSource: default | admin`、`businessPromptHash` 和后续组装需要的稳定输入。
   - 读取或运行时校验失败时抛出可观测的通用错误，不静默当成“没有后台覆盖”而回退默认 Prompt。
4. 在三种 schema template 和当前工作 schema 新增 `agent_turn_lease`；在本 Phase 只生成一次、审查并提交对应生产 migration artifact。实现 `src/modules/agent/turn-lease.ts` 的原子 acquire/reclaim、renew、ownership/cancel 检查和按 `chatId + turnId` 条件 release。Phase 5 只能应用这份已审查 artifact，不得再次生成另一份 migration。
5. 在现有 `src/modules/agent/service.ts` 内最小增加 `prepareAgentTurn({ turnId })` 和 prepared turn 执行入口，继续复用原 Agent 创建、事件循环、媒体工具和 Turn Context；`maxTurns` 从 definition 读取，不迁移整个 Runtime。
6. 在 Phase 1 修改 `src/routes/api/agent/chat.ts` 的核心接受顺序：基础输入和已有 chat owner 校验后生成 `turnId` 并 acquire 租约；现有图片/视频 normalize/preflight 通过后执行 `prepareAgentTurn()`，再 `ensureChat()`、写入用户消息并执行 prepared turn；所有退出路径在 `finally` 条件释放。媒体参数、预检和工具调用保留现有代码路径，只在必要位置传递 `turnId`。
7. Phase 1 即扩展 `appendMessage()` 的 metadata 参数和受控 JSON encode/decode：
   - 用户消息保存同一 `PreparedAgentTurn.audit`，包含 `kind: 'user'`、`turnId` 和完整工具/Prompt/模型审计字段。
   - 所有 assistant rounds 保存 `kind: 'assistant'`、同一 `turnId`、`parentUserMessageId` 和递增 `roundIndex`。
   - 用户和 assistant `chat_message.model/provider` 同时写入 prepared turn 的实际 LLM model/provider，不再使用固定默认值；`chat.model/provider` 在接受新 Turn 时更新为本次实际值，仅表示最近一次 Turn。逐 Turn 审计仍以对应用户消息 metadata 为权威来源。
   - metadata 不进入 `parts`、SDK history 或 Provider 请求。
8. 实际工具先创建并验证名称唯一，`longRunningToolNames` 必须是实际 `toolNames` 的子集；capability policy、`{{available_tools}}` 和审计列表再从验证后的同一集合生成，不允许从 Prompt 文本反向解析工具。
9. 为数据库租约增加集成测试：同一 chat 并发请求只有一个成功、另一个真实返回 HTTP 409；不同 chat 可并发；过期 lease + 无 active task 才能原子回收；过期/缺失 lease + active task 返回 `stale_run_requires_stop`；Stop 可清理 orphan/legacy task；旧 `turnId` 不能续租/释放新 lease；失去所有权的 Runtime 在 durable task 创建后不调用 Provider、不继续持久化 assistant 消息。
10. 保持无后台配置时的项目身份、必要规则、auto/image/video 工具集合和 Turn Context 语义与当前版本一致；由于引入动态 capability policy，不把完整 Prompt 字节级相等作为停止条件。

最新读取方案：在 `src/modules/config/service.ts` 增加 `getConfigLatest(name)`，每个新 Turn 对单个 key 发起不经过应用内存缓存的查询。D1 路径在 `src/core/db/d1.ts` 补充最小 `D1DatabaseSession` 类型和非单例 `createD1PrimarySession()`；它返回 `DB.withSession('first-primary')`。`getConfigLatest()` 的 D1 分支直接用 session `prepare(...).bind(name).first()` 读取单 key，不假设 `D1DatabaseSession` 是完整 `D1Database`，也不强行将它塞进当前 Drizzle client 类型。PostgreSQL/MySQL/本地 SQLite 继续使用普通的非应用缓存查询。

Cloudflare 官方把 `first-primary` 定义为从主库最新版本开始的 Session，并保证后续查询顺序一致；这也为以后启用 D1 read replication 留出正确语义。LLM 调用的延迟和成本远高于一次主键查询，首版优先保证正确性。以后如需优化，只能使用数秒 TTL、D1 bookmark 或显式配置版本机制，不能复用 1 小时缓存。参考：[Cloudflare D1 Global read replication](https://developers.cloudflare.com/d1/best-practices/read-replication/) 和 [D1 Database API](https://developers.cloudflare.com/d1/worker-api/d1-database/)。

停止条件：无后台覆盖时所有 Phase 0 语义回归测试仍通过；route 已按 acquire lease -> prepare -> persist -> execute -> conditional release 工作；同 chat 并发得到 409 且不同 chat 不互相阻塞；orphan/legacy active task 会阻止新 Turn，Stop 后可重试；user/assistant metadata 可通过 `turnId` 和 `parentUserMessageId` 可靠关联；prepared turn 中的 Prompt、工具和 hash 来自同一份快照；latest-read 的 missing/error 语义有独立测试；生产 migration artifact 已生成一次并完成审查。

### Phase 2：后台编辑业务 System Prompt

1. 在 `src/modules/config/settings.ts` 的 `agent_llm` 组注册 `agent_system_prompt`：
   - 类型 `textarea`。
   - 空值表示使用项目默认值。
   - 最大 20 KiB（按 UTF-8 字节校验，不只按字符数）。
2. 扩展 `Setting` 结构和 `src/routes/admin/settings.tsx`：
   - 支持 `rows`、`maxLength`、`monospace`。
   - 显示字符/字节计数。
   - `maxLength` 只作为客户端字符数 UX 提示，20 KiB 的真实边界仍以服务端 `TextEncoder` UTF-8 字节数为准。
   - 提供“恢复项目默认值”，实际保存空字符串。
3. 修改后台配置 GET：其他配置可继续使用现有缓存，但响应中的 `agent_system_prompt` 必须用 `getConfigLatest()` 单 key 结果覆盖，确保保存后即使 GET 落到另一个热 isolate 也不会回显旧值。HTTP `no-store` 不能替代这个应用内缓存修复。
4. 保留并明确 `src/routes/api/admin/config.ts` 的最小权限边界，且鉴权必须发生在读取配置或执行写入之前：
   - 未登录 GET/POST 返回真实 HTTP 401。
   - 普通登录用户和缺少对应 permission 的用户返回真实 HTTP 403。
   - 只有 `admin.settings.read` 可以读取 `agent_system_prompt`。
   - 只有 `admin.settings.write` 可以修改或清空 `agent_system_prompt`；写权限不隐含读权限，反之亦然。
   - 所有被拒绝的 POST 都不得调用 `saveConfigs()`，并以数据库前后值断言没有副作用。
5. 在 `src/routes/api/admin/config.ts` 保存前确认 body 是非 null、非数组的普通对象，并且每一个 value 都是字符串；任何非字符串值整个请求返回 HTTP 400，不进入 `saveConfigs()`。然后对 `agent_system_prompt` 调用 `validateAgentPromptOverride()`：
   - 拒绝超过 20 KiB。
   - 拒绝未知模板变量。
   - 允许空白值触发默认回退。
   - 校验错误使用 `respErr(message, { status: 400 })`，测试同时断言 HTTP status、JSON code 和数据库未被写入。
6. `profile.ts`/Prompt Builder 在运行时对 latest-read 结果执行同一份变量和字节上限校验；发现手工写入的非法值时显式终止 Turn，不静默运行。
7. 为 Prompt 正文建立显式防泄露测试：它只能出现在拥有 `admin.settings.read` 的专用后台配置响应中，不得出现在 `/api/config/public`、custom/public 普通配置、聊天响应、模型历史、消息 metadata、日志或 `/api/share/$chatId`；审计只保存 hash/source，不保存 Core Guardrails、业务 Prompt、effective Prompt、Skill 正文或 Turn Context。
8. 补齐 `src/routes/admin/-settings-messages.ts` 和 `messages/{en,zh}.json`。
9. 日志只记录 definition ID、source、两个 hash 和对应 UTF-8 长度；不得记录完整 Prompt、Skill 正文或 Turn Context。

停止条件：管理员保存后，任意 Worker isolate 的后台 GET 立即回显新值，下一次被接受的新 Turn 使用新 Prompt；无需部署。未登录和无权限用户不能读取或修改 Prompt，拒绝写没有数据库副作用；Prompt 正文未进入任何普通/公开/聊天/历史/分享出口；非法 Prompt 返回真实 HTTP 400 且不写库，latest-read 失败可观测且不冒充默认 Prompt 继续执行。

### Phase 3：原位收口内建媒体能力

服务端：

1. 不创建 Video adapter、纯文本 adapter 或新的 orchestration 目录；保留 `src/modules/agent/{service,tools,image-tools,paywall,skills,history}.ts` 及其原导出名。
2. 保留 route 当前的 settings normalization、图片/视频积分预检、Turn Context、三个媒体工具、`mediaMode` 选择、Provider、Storage、任务轮询和退款流程。只把 Phase 1 的 `turnId` 继续传入现有工具上下文，并写入新建 `ai_task.options`。
3. 在现有 `service.ts` 创建实际工具后，校验工具名唯一，从本轮启用的三个内建媒体工具导出 `longRunningToolNames`，再生成 capability policy、`{{available_tools}}` 和 audit 字段；不新增工具 registry 或 adapter 契约。
4. 在现有 stop/history 路径做最小修改：run state 合并 Turn 租约与 active `ai_task`；Stop 按 3.7 使用 `turnId` 过滤任务，orphan/legacy 才按 owner/session 保守清理；terminal result 继续复用现有媒体实现，不建立可插拔 builder。
5. `history.ts` 按 3.8 使用 `turnId`/`parentUserMessageId` 判断当时授权；补齐 `generate_image` 悬空调用终结，metadata 缺失/损坏时有界降级，不为历史追加工具授权。
6. 保持当前媒体错误契约：参数错误 400、结构化积分不足 402、Provider/配置不可用 503 的 HTTP status、code、data、headers 和 response body 不变；新增租约错误使用独立的 409 机器码。
7. 更新 `AGENTS.md`，仅登记当前已经存在的 agent -> chats/ai-tasks/config/storage 受限例外；通过静态搜索确认没有新增其他 module-to-module import，也没有既有模块反向导入 Agent。

客户端：

1. Composer、`AgentComposerSettings`、auto/image/video 模式、图片/视频模型控件、附件/媒体库、Transcript renderer 和 `video-agent:*` storage key 全部原位保留。
2. 只新增 `turn_in_progress` 和 `stale_run_requires_stop` 的错误处理：前者提示等待当前 Turn，后者提供 Stop 后重试入口；两者都不得自动重试或绕过服务端准入。
3. 保留 unknown tool 通用 fallback；不把现有图片/视频 renderer 搬到 registry 或 extension。

停止条件：现有 auto/image/video 生成、settings 序列化、扣费、退回、停止、恢复、预览和 storage 行为不变；`longRunningToolNames` 始终是本轮实际工具子集；Stop 只取消目标 `turnId`，orphan/legacy 清理后可重试；原有工具/API/settings/任务/UI 命名保持不变；没有新增 adapter、extension、orchestration 目录或新的跨 module 依赖。

### Phase 4：审计、可追踪性和模板文档

1. 固化 Phase 1 已投入写路径的版本化 metadata schema，并补齐兼容解码测试。用户 `AgentTurnMetadataV1` 包含：
   - `schemaVersion: 1`
   - `kind: 'user'`
   - `turnId`
   - `agentDefinitionId`
   - `businessPromptHash`
   - `effectivePromptHash`
   - `promptSource`
   - `llmProvider`
   - `llmModel`
   - `skillName`
   - `skillReleaseId`
   - `toolNames`
   - `longRunningToolNames`
2. assistant `AgentAssistantMessageMetadataV1` 只保存关联所需字段：`schemaVersion: 1`、`kind: 'assistant'`、`turnId`、`parentUserMessageId`、`roundIndex`。从任意 assistant/tool 消息都能确定归属 Turn 并找到当时的授权快照；关系缺失、冲突、重复 round 或 `longRunningToolNames` 非 `toolNames` 子集时 fail closed，不按时间邻接猜测。
3. 复用三种 schema template 和现有 migration 中已存在的 nullable `chat_message.metadata`；不得为已存在的字段生成重复 migration。`history.ts` 和 Provider 消息转换必须忽略 metadata，不要把审计信息伪装成模型可见 text part。
4. `getChatWithMessages()` 的内部服务端结构支持解码 metadata，但普通聊天响应不返回审计或 Prompt 正文；只有 owner/admin 授权的专用审计路径可读取允许公开的 hash/source/model/tool 字段。公开 share 始终剥离全部 metadata，admin Prompt 正文也不通过审计接口返回。
5. 增加执行一致性测试：用户审计数据必须直接等于对应 `PreparedAgentTurn.audit`；每条 assistant 消息使用同一 `turnId`/父消息 ID；实际传给 SDK 的模型、Prompt hash 和工具集合与审计完全相同；并发/失败请求不能把 assistant 消息挂到错误 Turn。
6. 新增 `docs/agent-template.md`：
   - 新项目通常只替换 `src/config/agent.ts` 的项目身份和默认 Prompt；图片/视频是模板内建能力。
   - Prompt 分层和安全边界。
   - `src/modules/agent/*` 既有受限编排例外、允许的依赖集合和禁止反向依赖规则。
   - `AgentRequestError`、Turn 租约、409、续租/取消和 metadata 关联契约。
   - Skill/R2 release 发布流程。
   - 如何在保留内建媒体能力的前提下调整项目 Prompt；未来只有出现真实第二种工具生命周期时才评估 adapter。
   - hash 只提供身份追踪；如需恢复历史 Prompt 正文，必须另建版本表/快照，不得声称可从 hash 反推正文。
   - 禁止把任意后台字符串解释为工具授权。
7. 保留 `docs/agent-skills-r2.md`，由新模板文档链接，不复制发布说明。

停止条件：经授权的服务端审计路径能从任意新 user 或 assistant/tool 消息可靠定位同一 Turn，判断它使用的 definition、业务/最终 Prompt hash 及来源、LLM provider/model、Skill release、实际工具集合和其中的 long-running 工具；模型历史、普通聊天响应和公开 share 不包含这些 metadata 或 Prompt 正文。旧消息 metadata 为 null、损坏或无法关联时仍可安全读取并采用保守降级。

### Phase 5：Cloudflare 验证和发布

1. 运行全部单元测试、格式检查、Node build 和 Cloudflare build。
2. 运行 `skills:check-bundle`，确认 44 个 Skill 正文没有重新进入 Worker bundle。
3. 扫描客户端构建产物，确认默认业务 Prompt、Core Guardrails 和专用测试标记均不存在；只允许它们进入服务端 Worker 产物。
4. 记录改造前后 Worker raw/gzip 大小；gzip 增量预算建议不超过 50 KiB。
5. 数据库采用 expand-first 发布，只应用 Phase 1 已生成、审查并提交的唯一 migration artifact：
   - 发布前再次人工确认该 artifact 只新增 `agent_turn_lease` 及必要索引，不包含 DROP/破坏性变更；记录文件 checksum，Phase 5 不再次运行 `pnpm db:generate` 产生新 migration。
   - 先应用 staging migration 并验证表/唯一约束，再部署 staging Worker。
6. 在 staging：
   - 后台保存一个唯一标记 Prompt。
   - 立即重新 GET 后台配置，确认回显唯一标记而不是其他 isolate 的旧缓存。
   - 验证未登录/普通用户无法读写 Prompt，拒绝写不改变数据库；public config、普通聊天和公开 share 均不包含 Prompt 正文或审计 metadata。
   - 从多个客户端/区域并发请求多个新会话/Turn，通过受控的 `effectivePromptHash`/source 日志和审计 metadata 确认无旧 isolate 读到旧值；不在日志中输出 Prompt 正文。
   - 从不同客户端/isolate 对同一 chat 并发发起 Turn，确认只有一个取得租约，另一个返回 HTTP 409；同时对不同 chat 发起 Turn，确认不会全局串行。模拟租约过期/失去所有权，确认旧执行流不再调用工具或写 assistant 消息。
   - 分别测试未选 Skill、选中 Skill、Skill resource、`generate_image`、两个视频工具、orphan/legacy Stop、历史恢复和含 legacy 工具的历史降级。
   - 用可观测的模型请求 mock/测试 provider 确认本轮用户消息只出现一次。
7. staging 验证通过后，应用 checksum 相同的 production migration 并验证表/唯一约束；禁止部署任何依赖新表但目标数据库尚未完成 migration 的 Worker。
8. 第一次从“不写 lease/turnId”的旧 Worker 切到新 Worker 时使用一次性维护/drain 窗口，不为此建设永久兼容状态机：
   - 在边缘或临时维护版本中让新的 chat POST 返回 HTTP 503，停止接收新 Turn；只读历史和现有 Stop 保持可用。
   - 等待一个覆盖当前最长 Turn/Provider 轮询上限并留有缓冲的 drain interval，通过版本日志确认旧 Worker 已无 in-flight Turn，同时确认 active `ai_task` 为零；必要时用旧 Stop 取消仍在运行、尚无 `turnId` 的 legacy 图片/视频任务。未排空前不得部署强制 lease 准入的新 Worker。
   - 排空后部署生产 Worker，再开放 chat POST。后续常规发布已经由所有活跃版本共同遵守 lease 协议，不再需要该首次 drain。R2 Skill release 不变时无需重新上传 44 个 Skill。
9. 发布后以只读方式验证 Worker version、D1 binding、`agent_turn_lease` 表、R2 binding、在线 Skill 数量、一次真实 Agent Turn 及其 `AgentTurnMetadataV1`。

停止条件：唯一 migration artifact 已按顺序应用；首次 cutover 前旧 in-flight Turn 和无 `turnId` active task 已排空；生产版本验证通过，且没有 bundle、计费、Skill 或图片/视频生成回退。

## 6. 验收标准

### Prompt 和后台配置

- D1 中没有 `agent_system_prompt` 或值为空时，使用 `src/config/agent.ts` 默认值。
- 管理员修改后，不部署 Worker，后台下一次 GET 立即回显新值，下一次被接受的新 Turn 使用新值。
- 其他 Worker isolate 不得继续显示或使用最长一小时的旧 Prompt。
- latest-read 失败时 Turn 明确失败并可观测，不静默回退成项目默认 Prompt。
- 超过 20 KiB、包含未知模板变量，或 admin config body 中任何 value 非字符串时，API 返回真实 HTTP 400 和明确错误且不写入数据库。
- 手工 DB 修改/旧导入数据绕过保存 API 时，运行时同样拒绝未知变量和超长值。
- 未登录用户读取/修改 Prompt 返回 HTTP 401；缺少权限的登录用户返回 HTTP 403。只有 `admin.settings.read` 可读，只有 `admin.settings.write` 可写；任何拒绝写都不改变数据库。
- Core Guardrails 不出现在可编辑 textarea 中，也不能被后台配置删除。
- Prompt 日志不包含正文，只包含 `businessPromptHash`、`effectivePromptHash`、来源和长度。
- Prompt 正文只出现在有 `admin.settings.read` 的专用后台响应和实际模型 System Prompt 中，不出现在 public/custom 普通配置、消息 parts/metadata、普通聊天/历史响应或公开 share。
- 默认业务 Prompt 和 Core Guardrails 不进入客户端 JavaScript/CSS/静态资源；客户端项目扩展不导入 server-only definition。
- 同一个 Turn 的实际 System Prompt、tool list 和 audit hashes 来自同一份 `PreparedAgentTurn`。
- 本轮用户消息在 SDK history + query 中只出现一次。

### Skill 和工具安全

- 未选 Skill：不请求 R2 Skill 对象，不注入 Skill Prompt，不暴露资源读取工具。
- 已选 Skill：只加载选中的 release 内容，并在明确边界中注入。
- Skills、图片/视频 project settings 和附件入口是当前模板内建能力；本期不新增 capability 开关或无媒体模式。
- Prompt 或 Skill 即使要求调用不存在工具，也无法使该工具出现在 SDK tool map 中。
- `available_tools` 来自本轮实际工具对象，而不是后台填写的名称。
- 工具名必须唯一，`longRunningToolNames` 必须去重且是本轮实际 `toolNames` 的子集；违反时在消息持久化和模型调用前失败。
- 历史中已停用的工具不会因为回放而重新进入 SDK tool list。
- Skill 正文仍不占 Worker bundle。

### Turn 身份、并发和错误契约

- 每个 `PreparedAgentTurn` 有唯一 `turnId`；用户消息保存完整 Turn audit，所有 assistant rounds 保存同一 `turnId`、`parentUserMessageId` 和稳定 `roundIndex`。
- 同一 chat 的数据库租约只能由一个 Turn 持有；跨客户端/isolate 并发请求返回真实 HTTP 409，不同 chat 仍可并发。
- 过期 lease 只有在主库确认该 session 没有 active `ai_task` 时才可原子回收；存在 orphan/legacy active task 时返回 `stale_run_requires_stop`，不启动新 Turn。
- renew/release 必须匹配 owner `turnId`；失去租约的旧执行流不得调用 Provider、写 assistant 消息或删除新租约；durable task 已创建但 Provider 尚未调用时必须本地终结并幂等退款。
- stop 使用数据库取消信号并调用现有媒体取消函数，不能通过提前删除租约允许新旧 Turn 重叠。
- stop 的取消标记必须匹配读取到的 `chatId + userId + turnId`；lease 已变化时不得取消新 Turn。没有有效 lease 时，Stop 可清理 owner/session 下属于过期 Turn、orphan 或没有 `turnId` 的 legacy active task。
- 首版对崩溃 Turn 的产品流程是 `409 stale_run_requires_stop -> Stop -> retry`，不自动恢复或重放。
- 现有媒体参数、计费和可用性错误继续保持结构化 400、402、503；新增 Prompt/Turn 未知异常按通用 500 处理，不借机重写媒体错误路径。

### 模板复用

- 新项目通常只修改 `src/config/agent.ts` 的身份、默认业务 Prompt 和 `maxTurns`；生图、生视频、Skill、附件和媒体设置继续作为模板标准能力。
- 不创建无媒体/纯文本 adapter、项目 UI extension 或新的 orchestration 目录；未来只有出现真实第二种工具生命周期时才重新设计。
- `src/modules/agent/*` 保留当前对 chats/ai-tasks/config/storage 的受限单向组合依赖，不增加其他 module 依赖，也不允许被这些模块反向导入。
- 未知工具可在 Transcript 中安全显示通用调用/结果，不导致页面崩溃，也不因显示而获得 Runtime 授权。
- 当前 auto/image/video 模式、图片/视频模型校验、积分预检、任务轮询、R2 落盘、预览器、退款和停止流程全部通过回归测试。
- `longRunningToolNames` 始终等于实际启用媒体工具的集合：auto 为 `generate_image`、`generate_video`、`animate_image`，image 仅为 `generate_image`，video 为两个视频工具。
- 模板化前后的现有 API 路径、request/response、SSE event、工具名、settings 字段、任务状态和公开导出保持兼容；实现 diff 不包含与边界迁移无关的批量变量重命名或格式清理。
- 每处原实现改动都能追溯到缺陷修复、安全/并发要求或明确验收项；可原位复用的稳定代码未被重写，原文件未仅为目录整齐而搬迁。

### 审计与兼容

- 新用户 Turn 的 `chat_message.metadata` 是版本化 `AgentTurnMetadataV1`，包含 `turnId`，能追踪 definition、两个 Prompt hash/source、LLM provider/model、Skill release、实际 tool list 和 long-running tool list。
- 新 assistant 消息保存版本化关联 metadata；从任意 assistant/tool 消息都能通过 `turnId`/`parentUserMessageId` 找到当时用户 Turn 和工具授权，不依赖时间排序猜测。
- user/assistant 消息行的 `model/provider` 与该 Turn 的实际 LLM 一致；chat 行只表示最近一次 Turn，逐 Turn 历史以用户 metadata 为权威。
- metadata 不进入模型历史或普通聊天响应，不出现在公开 share API，只由 owner/admin 授权的专用审计路径读取。
- 旧消息 metadata 为 null、损坏或关联失败时仍可读取；工具历史 fail closed，降级为有界文本/终结结果而不重新授权。
- hash 用于追踪，不宣称能恢复已被覆盖的 Prompt 正文。

### 构建和部署

- `pnpm test`
- `pnpm format:check`
- `pnpm build`
- `pnpm cf:build`
- `pnpm skills:check-bundle`
- Cloudflare staging smoke test 和生产只读验证全部通过。

## 7. 测试矩阵

| 层级                    | 用例                                                                                                                                                                                                                                                         |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Prompt unit             | 默认值、后台覆盖、空白回退、分层顺序、Skill 边界、保存+运行时变量校验、20 KiB UTF-8 边界、两个 hash 稳定性                                                                                                                                                   |
| Config unit/integration | latest read 不使用 1h cache；D1 直接使用 `first-primary` Session；missing/error 语义；后台 GET 覆盖旧缓存；真实 HTTP 400/401/403；read/write permission 独立；拒绝写不改库；Prompt 不进入 public/custom/chat/share；加密逻辑不受影响                         |
| Runtime unit            | prepared turn 的 Prompt/hash/tool list 同源；现有 message ID 排除链路和 SDK history+query 只出现一次；auto/image/video 工具集合；createAgent 收到正确 Prompt/maxTurns/实际工具；model/provider 写入实际值；工具名唯一；long-running 子集；Skill 按需加载     |
| Turn lease integration  | 同 chat 并发仅一方成功且另一方 409；不同 chat 可并发；过期 lease 仅在无 active task 时回收；orphan/legacy task 返回 stale 409；Stop 后可重试；cancel CAS 不误伤新 Turn；durable task 后失去 lease 不调用 Provider、幂等退款；旧 owner 不能续租/释放新 lease  |
| Media regression        | auto/image/video settings、图片/视频 paywall、Turn Context、三个媒体工具、active task、取消、退回、canceled/interrupted result 与旧有效行为一致；`turnId` 只增加关联，不改变 Provider/计费/任务结果                                                          |
| History unit            | assistant 通过 turnId/parent 关联用户授权；仅“当时授权且本轮注册”工具结构化回放；`generate_image` 与视频工具悬空调用终结；legacy/unknown/metadata 缺失或损坏时有界降级；metadata 不进入模型                                                                  |
| Route integration       | acquire lease -> prepare -> persist -> execute -> conditional release；现有媒体 settings/preflight/error response 不变；lease + active-task run state；orphan/legacy Stop；SSE/历史/审计正常                                                                 |
| UI                      | Prompt 编辑/重置/字符+字节计数；现有 Skill/附件/媒体入口、auto/image/video settings 序列化、`video-agent:*` storage 和 renderer 不变；`turn_in_progress`/`stale_run_requires_stop` 不自动重试且后者引导 Stop；通用 fallback 保留                             |
| Audit                   | user/assistant 两类 metadata encode/decode；turnId/parent/round 关联；tool/long-running 子集；nullable/损坏旧消息；owner/admin 专用路径可读；Provider/普通聊天/公开 share 不可见；实际执行与 audit 快照一致                                                  |
| Architecture static     | 不新增 adapter/extension/orchestration 目录；agent -> chats/ai-tasks/config/storage 仅保留现有单向依赖且不扩大；其他 modules 不反向导入 Agent；客户端不导入 server definition/modules；客户端产物无 Prompt/Guardrails 标记                                   |
| Cloudflare              | D1 多客户端/多区域 Prompt 新鲜度；唯一 migration artifact 先于 Worker；首次维护/drain 排空无 lease/turnId 旧请求；跨 isolate 同 chat 409 和不同 chat 并发；orphan task/租约过期/所有权丢失；后台 GET/RBAC/防泄露；R2 Skill；bundle；staging/production smoke |

## 8. 风险与缓解

| 风险                                   | 缓解                                                                                                                 |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| 后台 Prompt 覆盖安全规则               | Core Guardrails 与 capability policy 不可编辑；工具仅代码授权                                                        |
| 默认 Prompt 被打进客户端 bundle        | definition 使用 server-only 边界；现有客户端媒体配置不导入 definition；构建后扫描 Prompt/Guardrails 唯一标记         |
| Cloudflare 多 isolate/读副本配置陈旧   | Turn 和后台 GET 都对 Prompt 做单 key latest-read；D1 直接使用 `first-primary` Session；读取错误 fail closed          |
| Prompt 过长导致 token 成本和延迟       | 20 KiB UTF-8 上限、字节计数、保存+运行时双重校验；后续可增加 token 估算                                              |
| 当前用户消息被 history/query 重复      | 保留已完成的 message ID 排除修复；Phase 0 增加 route/Runtime 回归测试，后续由 prepared turn 固化 prior history       |
| 同 chat 并发导致消息/审计交错          | 数据库唯一租约、409、TTL+续租、owner 条件释放；assistant 用 turnId/parent 显式关联，不依赖时间邻接                   |
| lease 过期但外部媒体任务仍在运行       | active-task guard 返回 `stale_run_requires_stop`；Stop 本地终结/幂等退款并 best-effort 取消上游后才允许重试          |
| 旧 stop 请求误取消新 Turn              | cancel 读取目标 turnId 后 compare-and-set；现有媒体取消函数按 turnId 过滤，不按整个 session 无差别取消               |
| 租约过期后旧请求恢复执行               | 每轮/每工具/durable task 后/Provider 前/持久化前校验 owner；失败立即 abort；未启动 Provider 的本地 task 终结并退款   |
| 审计读取与实际执行竞态                 | `prepareAgentTurn()` 只读一次 Prompt/工具/模型并产生同一份执行+审计快照；user/assistant 直接持久化该 Turn 的关联数据 |
| 抽象过度导致实现复杂                   | 图片/视频按真实产品需求保留为模板内建能力；本期不建 adapter、extension、无媒体模式或新 orchestration 目录            |
| 大面积改名放大回归和审查成本           | 保留现有外部契约和媒体业务命名；新名称只用于 Prompt/Turn/审计边界，不搬迁原媒体文件                                  |
| 新错误处理改变媒体响应                 | `AgentRequestError` 只用于新增 Prompt/Turn 错误；现有媒体 400/402/503 body/status 由回归测试锁定                     |
| Agent 既有跨 module 依赖继续扩大       | AGENTS 只登记当前 chats/ai-tasks/config/storage 单向例外；静态检查禁止新增依赖或反向导入                             |
| 图片或视频生成回归                     | Phase 0 按 auto/image/video 锁定工具、计费和恢复行为；原位复用 Provider/计费/任务/UI，只传递必要 turnId              |
| 历史工具被误当成当前授权               | 只有关联 metadata 证明当时授权且本轮仍注册时才结构化回放；其余有界降级，不为历史重新注册工具                         |
| 无 Prompt 正文快照无法完整复现历史     | 明确只承诺可追踪；保存两个 hash、source、Skill release、model 和 tool names；完整复现留待版本表/快照                 |
| 误生成已存在 metadata 字段的 migration | 先核对三种 schema template、当前 schema 和目标 DB；字段已存在时只打通 service encode/decode，不 generate migration   |
| Worker 先于 lease 表发布导致全量失败   | expand-first：staging/production 都先应用并验证 Phase 1 唯一 migration artifact，再部署依赖新表的 Worker             |
| 首次发布中新旧 Worker 混跑             | 一次性关闭 chat POST 并 drain 旧请求/legacy active task；排空后部署新 Worker 再开放，不建设永久双协议                |

## 9. 回滚策略

每个 Phase 保持独立、可回滚：

1. Phase 2 Prompt 覆盖出现问题：删除配置数据库中的 `agent_system_prompt` 或保存空值，立即回退到代码默认 Prompt。
   - 如果问题是 latest-read 实现失败而非 Prompt 值本身，回滚 Worker 到上一个已验证版本；不把静默 fallback 当作回滚方案。
2. `prepareAgentTurn()`、数据库租约和 route 顺序改造保持独立 commit；如需回滚 Worker，必须保留 Phase 0 现有 message ID 排除修复，不得恢复重复上下文缺陷。已经创建的 `agent_turn_lease` 表可由旧 Worker 安全忽略，紧急回滚不执行 `DROP TABLE`。
3. 图片/视频实现不迁移、不重写；媒体路径的改动仅限传递/保存 `turnId`、租约所有权检查和 `generate_image` 历史恢复修复。若需回滚，撤销这些外围接入即可，Provider、计费、任务和 UI 不需要恢复。
4. 审计 metadata 字段已存在且为 nullable；旧 Worker 会忽略新 metadata，旧消息的 null metadata 仍可读取。只有 `agent_turn_lease` 是本计划明确要求的新 schema；使用 Phase 1 已生成并人工审查的唯一 migration artifact，Phase 5 不重新 generate，也不自动 migrate。
5. R2 Skill release 使用不可变 release ID；Worker 可回滚到上一版本而不覆盖 Skill 对象。

## 10. 明确不在本期范围内

- 多 Agent 编排、Agent handoff、动态路由。
- Video/纯文本 adapter、项目 UI extension、无媒体 capability 模式和新的 orchestration 目录；出现真实第二种工具生命周期后再评估。
- 后台上传或执行任意 JavaScript/TypeScript 工具。
- 把 Skill 的脚本直接放到 Worker 或在 Worker 内执行。
- Cloudflare Sandbox 中的可执行 Skill；这是未来独立的受限执行面，不能和 Prompt-only Skill 混为一谈。
- 可编程 Prompt 模板语言、条件/循环/include。
- Prompt A/B 实验和完整版本管理 UI；本期用 hash 和消息 metadata 建立可追溯基础。

## 11. 推荐实施顺序

严格按 `Phase 0 -> 1 -> 2 -> 3 -> 4 -> 5` 执行。

其中 Phase 1+2 是最小可上线版本：先建立可关联、可串行化的 Turn 基础，再安全地完成“后台配置 System Prompt”。Phase 3 只负责把 `turnId`/Stop/历史兼容最小接入现有媒体路径并证明无回归，不做架构搬迁。Phase 4+5 补齐授权审计读取、模板文档、兼容性证明和生产部署验证。
