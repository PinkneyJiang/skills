# 🚀 Pinkney Agent Hub (PAH) v3.1

> **企业级纯净开源通用 AI 技能 (Skills)、工具协议 (MCP) 与架构规范 (Specs) 公共资产中台**
> 面向全网开源，遵循纯粹的通用工程范式，无任何特定业务污染。任何 React、Vue、NestJS、.NET 或跨端全栈工程均可一键拉取即用！
>
> 🌟 **核心指标**: **23 个工业级通用技能** (Core 12 + Client 8 + Server 3) ｜ **3 大真实独立 MCP 服务器** ｜ **4 套深度全栈架构规范** ｜ **100% 纯中文**

---

## 🏛️ 全景架构（三大中枢 × 三大维度）

```text
/ (仓库根目录)
├── 🧠 skills/                     # 【AI 技能中枢】高阶工程师的标准 SOP、自愈反馈与决策流
│   ├── core/                     # 🌐 全局通用基石 (12项: to-spec, diagnosing-bugs, improve-architecture...)
│   ├── client/                   # 🎨 端侧与前端规范 (8项: frontend-design, apple-design, sse-streaming...)
│   └── server/                   # ⚙️ 服务端微服务标准 (3项: clean-architecture, dto-validation, prisma-tx...)
│
├── 🔌 mcp/                        # 【MCP 协议中枢】直连物理数据库、真实无头浏览器与 AST 的连接层
│   ├── core/                     # 🌐 mcp-browser-automation (基于 Puppeteer-Core 直驱 Chrome/Edge)
│   ├── client/                   # 🎨 mcp-component-inspector (基于 TypeScript AST 解析组件树与 Props)
│   └── server/                   # ⚙️ mcp-database-inspector (直连 MySQL/PG，解析 Prisma Schema 防字段幻觉)
│
├── 📜 specs/                      # 【规范契约中枢】跨端跨语言的唯一真值源 (Single Source of Truth)
│   ├── core/                     # 🌐 universal-api-response, generative-ui-protocol
│   ├── client/                   # 🎨 frontend-page-lifecycle (生命周期、SWR 缓存失效与防崩兜底)
│   └── server/                   # ⚙️ restful-crud-conventions (RESTful 语义、状态码与版本控制)
│
├── 📦 registry.json               # 全量中台资产元数据索引字典 (v3.1.0)
└── ⚡ bin/agy-hub.cjs              # 专属 Agent 包管理器 (类似私有 npx skills)
```

---

## 📖 资产全景清单 (每个资产均配有完整专属说明与规范)

### 1. 🧠 SKILLS 技能中枢 (共 23 项)

#### 🌐 全局通用基石 (core/ - 12 项)
- **[`@core/to-spec`](./skills/core/to-spec)** *(来源: Matt Pocock)*: 将业务讨论与共识快速升华为标准技术规格书（Spec），保留完整规范模板与测试接缝原则。
- **[`@core/diagnosing-bugs`](./skills/core/diagnosing-bugs)** *(来源: Matt Pocock)*: 严谨科学排错纪律（10 种反馈回路构建法、敏感数据脱敏、最小化复现、假设证伪与防退化单测）。
- **[`@core/improve-architecture`](./skills/core/improve-architecture)** *(来源: Matt Pocock)*: 识别浅模块并挖掘深模块机会，生成独立交互式 HTML 诊断报告，指导高杠杆重构。
- **[`@core/domain-modeling`](./skills/core/domain-modeling)** *(来源: Matt Pocock)*: 领域建模与统一语言模型维护，主动消除歧义，审慎沉淀 ADR 架构决策。
- **[`@core/grill-me`](./skills/core/grill-me)**: 方案落地前高强度五部曲追问（意图穿透、极端状态、接缝定位、不可逆决策锁死与可观测性卡点）。
- **[`@core/skill-creator`](./skills/core/skill-creator)** *(来源: Anthropic 官方)*: 遵循三层渐进式披露原则的标准技能构建指南，涵盖描述触发词工程与迭代基准评测。
- **[`@core/mcp-builder`](./skills/core/mcp-builder)** *(来源: Anthropic 官方)*: 工业级 Model Context Protocol 服务研发指南（涵盖 stdio / SSE 传输、Zod 强类型校验与可行动错误诊断）。
- **[`@core/code-review`](./skills/core/code-review)** *(来源: Matt Pocock)*: 规范轴 (Standards) 与契约轴 (Spec) 解耦的双轴代码审查，内置 Martin Fowler 12 大代码坏味道基线。
- **[`@core/tdd`](./skills/core/tdd)** *(来源: Matt Pocock)*: 测试驱动开发（红-绿-重构循环），聚焦公共接缝，坚决杜绝实现耦合、同义反复与水平切片三大反模式。
- **[`@core/implement`](./skills/core/implement)** *(来源: Matt Pocock)*: 从 Spec 规范或工单落地实现的闭环流水线（垂直切片分解、TDD 步进、防御性编译校验与审查交付）。
- **[`@core/research`](./skills/core/research)** *(来源: Matt Pocock)*: 严肃技术调研与评估 SOP，坚守一手权威信源（官方文档、源码实现、RFC 规约、沙箱实测），输出结构化决策报告。
- **[`@core/codebase-design`](./skills/core/codebase-design)** *(来源: Matt Pocock)*: 深模块 (Deep Modules) 现代设计统一词汇表与核心架构原则（模块、接口、深度、接缝、适配器、杠杆率、局部性与删除测试）。

#### 🎨 端侧与前端通用规范 (client/ - 8 项)
- **[`@client/frontend-design-excellence`](./skills/client/frontend-design-excellence)** *(来源: Anthropic 官方)*: 先锋级视觉与界面设计指南，精准识别并消灭 AI 廉价生成感 5 大套路，建立严苛排版阶梯与结构化设计。
- **[`@client/webapp-e2e-testing`](./skills/client/webapp-e2e-testing)** *(来源: Anthropic 官方)*: 基于 Playwright 的端到端自动化测试套件，执行"先侦察、后行动"标准范式，全流程把控 networkidle 与状态断言。
- **[`@client/apple-design-philosophy`](./skills/client/apple-design-philosophy)** *(来源: Emil Kowalski & Apple WWDC)*: 苹果流体物理界面设计哲学在 Web 平台的完整投射（消灭延迟、直接操控 1:1 抓取、可随时打断性神圣原则与弹簧物理学）。
- **[`@client/interactive-animation-engine`](./skills/client/interactive-animation-engine)** *(来源: Emil Kowalski)*: 专业交互动效构建引擎，遵循五步严苛门禁（是否动、动效目的、工具选型、仅限 transform/opacity 硬件加速与缓动矩阵）。
- **[`@client/sse-streaming-client`](./skills/client/sse-streaming-client)**: 工业级大模型流式 SSE 客户端，内置 TextDecoder 跨包截断解码防乱码、4 字节大端定长帧解析、requestAnimationFrame 平滑打字机缓冲队列与指数退避重连。
- **[`@client/web-artifacts-builder`](./skills/client/web-artifacts-builder)** *(来源: Anthropic 官方)*: 复杂单文件自包含 HTML 交互制品构建套件（React 18 + Tailwind + shadcn/ui + Parcel 内联打包）。
- **[`@client/theme-factory`](./skills/client/theme-factory)** *(来源: Anthropic 官方)*: 10 大精选专业色彩与排版主题库（深海秘境、日落大道、林冠漫步、现代灰调等），满足 WCAG 2.1 AA 级无障碍对比度。
- **[`@client/canvas-design`](./skills/client/canvas-design)** *(来源: Anthropic 官方)*: 画布视觉艺术与设计哲学，以纯粹空间与形式传达深层思想，极简文字点缀，彰显大师级工艺水准。

#### ⚙️ 服务端与微服务通用规范 (server/ - 3 项)
- **[`@server/clean-architecture-module`](./skills/server/clean-architecture-module)**: 整洁架构后端微服务模块分层解耦规范（Controller -> Service -> Repository -> DTO/VO），遵循单向依赖，保障 100% 隔离单测接缝。
- **[`@server/dto-runtime-validation`](./skills/server/dto-runtime-validation)**: 强类型运行时参数校验与契约设计，深度整合 class-validator、class-transformer，提供嵌套对象校验、白名单过滤与 OpenAPI Swagger 自动化文档。
- **[`@server/prisma-transaction-lifecycle`](./skills/server/prisma-transaction-lifecycle)**: 现代数据库高并发事务与生命周期控制标准，包含交互式事务 ($transaction) 超时防死锁、乐观并发控制与随机抖动重试机制。

---

### 2. 🔌 MCP 协议中枢 (全部独立编译运行)

- **[`@core/mcp-browser-automation`](./mcp/core/mcp-browser-automation)**: 基于原生 `puppeteer-core` 驱动本地 Chrome / Edge，提供无头浏览器导航、全屏长图快照、元素点击填充、真实 DOM 获取与控制台日志探测。
- **[`@client/mcp-component-inspector`](./mcp/client/mcp-component-inspector)**: 基于 TypeScript 编译器 AST 语法树，递归扫描 React 组件库，深度解析 Props 契约与 JSDoc 注释，检测非标原生 HTML 标签复用问题。
- **[`@server/mcp-database-inspector`](./mcp/server/mcp-database-inspector)**: 直连 MySQL / PostgreSQL 数据库或本地解析 `schema.prisma`，提供物理数据表只读自省、列定义探测以及模型字段静态校验（防 AI 字段幻觉）。

---

### 3. 📜 SPECS 规范中枢 (深度全栈契约)

- **[`@core/universal-api-response`](./specs/core/universal-api-response)**: 工业级统一 HTTP 顶层响应信封、全局业务状态码与 HTTP 映射表、标准分页数据结构、NestJS 全局拦截器与前端 Axios 自动拆包处理。
- **[`@core/generative-ui-protocol`](./specs/core/generative-ui-protocol)**: 大语言模型流式输出动态可交互组件的跨端协议（`:::ui-component` 定界符语法、流式状态机分流器、前端安全组件注册中心与沙箱防注入隔离）。
- **[`@client/frontend-page-lifecycle`](./specs/client/frontend-page-lifecycle)**: 现代前端 SPA / SSR 页面全生命周期标准（路由守卫、数据并行预取、多级 SWR 缓存失效矩阵、ErrorBoundary 兜底与 AbortController 卸载清理）。
- **[`@server/restful-crud-conventions`](./specs/server/restful-crud-conventions)**: 云原生与微服务标准 RESTful 资源建模（严格复数名词 URI、HTTP Method 语义、标准状态码表、批量操作设计与版本控制策略）。

---

## ⚡ 新项目如何直接声明并一键下载使用？

在任何新项目的 `AGENTS.md` 中声明依赖：

```markdown
## 依赖技能中枢 (Agent Skill Dependencies)
- **Required Skills**:
  - `@core/to-spec`
  - `@core/diagnosing-bugs`
  - `@client/frontend-design-excellence`
  - `@server/clean-architecture-module`
```

随后在终端执行：
```bash
node <hub-path>/bin/agy-hub.cjs sync [目标工程目录]
```
即可自动比对，秒级从 Hub 下载并挂载到目标工程的 `.agents/skills/` 目录！
