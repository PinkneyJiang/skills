# 🧠 通用技能中枢 (Skills Hub)

> 这里汇聚了来自国际顶级工程师与实验室（Anthropic、Matt Pocock、Emil Kowalski 及云原生企业最佳实践）沉淀的 **23 个高价值通用标准技能 (SOP)**。
> 所有技能均采用 100% 纯中文编写，结构严密，包含完整规范流程、正反面案例、代码模板与自动化门禁。

---

## 📂 领域分类导航 (共 23 项)

### 1. [🌐 core/ (全局通用基石 - 12 项)](./core)
无论前后端、任何开发语言或业务领域均可通用的底层工程方法论与质量守护：
- **[`to-spec`](./core/to-spec)**: 将对话与已知事实提炼为规范详尽的特性技术规格书（Spec），杜绝无意义重复面试。
- **[`diagnosing-bugs`](./core/diagnosing-bugs)**: 科学排错与性能退化深度诊断（10 大紧致反馈回路构建、最小化复现、假设证伪与防退化单测）。
- **[`improve-architecture`](./core/improve-architecture)**: 探测架构摩擦与浅模块，自动化生成可视化交互式 HTML 诊断报告，指导深模块演进。
- **[`domain-modeling`](./core/domain-modeling)**: 建立并锐化领域统一语言模型（Glossary），消灭多义模糊词，极简审慎沉淀 ADR 架构决策。
- **[`grill-me`](./core/grill-me)**: 方案落地前的高强度五部曲追问（意图穿透、极端状态、接缝定位、不可逆决策锁死与可观测性卡点）。
- **[`skill-creator`](./core/skill-creator)**: 遵循三层渐进式披露原则的标准技能构建指南，涵盖描述触发词工程与迭代基准评测。
- **[`mcp-builder`](./core/mcp-builder)**: 工业级 Model Context Protocol (MCP) 服务研发指南（涵盖 stdio / SSE 传输、Zod 强类型校验与可行动错误诊断）。
- **[`code-review`](./core/code-review)**: 规范轴 (Standards) 与契约轴 (Spec) 解耦的双轴代码审查，内置 Martin Fowler 12 大代码坏味道基线。
- **[`tdd`](./core/tdd)**: 测试驱动开发（红-绿-重构循环），聚焦公共接缝，坚决杜绝实现耦合、同义反复与水平切片三大反模式。
- **[`implement`](./core/implement)**: 从 Spec 规范或工单落地实现的闭环流水线（垂直切片分解、TDD 步进、防御性编译校验与审查交付）。
- **[`research`](./core/research)**: 严肃技术调研与评估 SOP，坚守一手权威信源（官方文档、源码实现、RFC 规约、沙箱实测），输出结构化决策报告。
- **[`codebase-design`](./core/codebase-design)**: 深模块 (Deep Modules) 现代设计统一词汇表与核心架构原则（模块、接口、深度、接缝、适配器、杠杆率、局部性与删除测试）。

---

### 2. [🎨 client/ (端侧与前端 - 8 项)](./client)
面向现代 Web、端侧交互、视觉工程与自动化测试的精益实践：
- **[`frontend-design-excellence`](./client/frontend-design-excellence)**: 先锋级视觉与界面设计指南，精准识别并消灭 AI 廉价生成感 5 大套路，建立严苛排版阶梯与结构化设计。
- **[`webapp-e2e-testing`](./client/webapp-e2e-testing)**: 基于 Playwright 的端到端自动化测试套件，执行"先侦察、后行动"标准范式，全流程把控 networkidle 与状态断言。
- **[`apple-design-philosophy`](./client/apple-design-philosophy)**: 苹果 WWDC 流体物理界面设计哲学在 Web 平台的完整投射（消灭延迟、直接操控 1:1 抓取、可随时打断性神圣原则与弹簧物理学）。
- **[`interactive-animation-engine`](./client/interactive-animation-engine)**: 专业交互动效构建引擎，遵循五步严苛门禁（是否动、动效目的、工具选型、仅限 transform/opacity 硬件加速与缓动矩阵）。
- **[`sse-streaming-client`](./client/sse-streaming-client)**: 工业级大模型流式 SSE 客户端，内置 TextDecoder 跨包截断解码防乱码、4 字节大端定长帧解析、requestAnimationFrame 平滑打字机缓冲队列与指数退避重连。
- **[`web-artifacts-builder`](./client/web-artifacts-builder)**: 复杂单文件自包含 HTML 交互制品构建套件（React 18 + Tailwind + shadcn/ui + Parcel 内联打包）。
- **[`theme-factory`](./client/theme-factory)**: 10 大精选专业色彩与排版主题库（深海秘境、日落大道、林冠漫步、现代灰调等），满足 WCAG 2.1 AA 级无障碍对比度。
- **[`canvas-design`](./client/canvas-design)**: 画布视觉艺术与设计哲学，以纯粹空间与形式传达深层思想，极简文字点缀，彰显大师级工艺水准。

---

### 3. [⚙️ server/ (服务端与后端 - 3 项)](./server)
面向 Node.js / NestJS / 微服务与数据库持久化的高性能架构标准：
- **[`clean-architecture-module`](./server/clean-architecture-module)**: 整洁架构后端微服务模块分层解耦规范（Controller -> Service -> Repository -> DTO/VO），遵循单向依赖，保障 100% 隔离单测接缝。
- **[`dto-runtime-validation`](./server/dto-runtime-validation)**: 强类型运行时参数校验与契约设计，深度整合 class-validator、class-transformer，提供嵌套对象校验、白名单过滤与 OpenAPI Swagger 自动化文档。
- **[`prisma-transaction-lifecycle`](./server/prisma-transaction-lifecycle)**: 现代数据库高并发事务与生命周期控制标准，包含交互式事务 ($transaction) 超时防死锁、乐观并发控制与随机抖动重试机制。

---

## 🚀 跨工程引用指南
本仓库所有技能均支持按需拷贝或通过 Agent 技能体系自动挂载至任意工作区：
```markdown
# 在目标项目的 AGENTS.md 或系统提示词中引用：
- 核心排错规范参考：[diagnosing-bugs](file:///d:/Work/pinkney-agent-hub/skills/core/diagnosing-bugs/SKILL.md)
- 界面美学规范参考：[frontend-design-excellence](file:///d:/Work/pinkney-agent-hub/skills/client/frontend-design-excellence/SKILL.md)
- 后端架构规范参考：[clean-architecture-module](file:///d:/Work/pinkney-agent-hub/skills/server/clean-architecture-module/SKILL.md)
```
