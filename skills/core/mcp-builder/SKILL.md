---
name: mcp-builder
description: 开发高品质 MCP (Model Context Protocol) 服务的全流程指南。用于基于 FastMCP (Python) 或官方 MCP TypeScript SDK 创建连接外部系统与工具的服务器。
---

# MCP 服务器工程化开发指南 (mcp-builder)

本指南旨在指导开发者构建工业级高品质的 MCP（Model Context Protocol）服务器，使大语言模型能够通过结构化、高鲁棒性的工具安全、高效地操作外部系统。

---

## 四阶段标准研发流水线

### 阶段 1：深度调研与架构规划

#### 1.1 全面覆盖 vs 组合工作流工具
- **原子 API 全覆盖**：赋予 Agent 自由组合操作的最高灵活性（如 `github_get_issue`, `github_update_issue`）；
- **高阶工作流工具**：针对多步骤复杂场景封装一键式动作（如 `git_create_branch_and_pr`）；
- *规划策略*：在不确定时，优先保障核心底层 API 的完备性，再逐步抽象高阶工作流。

#### 1.2 命名规范与可发现性
- 工具命名必须采用**动宾结构**，并带有清晰的模块前缀；
  - ✅ 推荐：`db_query_tables`, `db_describe_schema`, `git_checkout_branch`
  - ❌ 严禁：`tables`, `query`, `do_action`
- 工具描述（Description）必须详尽阐述：该工具的适用场景、副作用、入参约束及返回结构。

#### 1.3 传输协议选型
- **本地服务 (Local Servers)**：标准输入输出（`stdio`）传输，轻量极速，适合 CLI 与 IDE 插件嵌入；
- **远程服务 (Remote Servers)**：基于 HTTP 的 Server-Sent Events (SSE) 或 Streamable HTTP，采用无状态 JSON 通信，便于水平扩容。

---

### 阶段 2：规范化代码实现

#### 2.1 依赖与工程骨架 (TypeScript SDK 范式)
推荐基于官方 `@modelcontextprotocol/sdk` 与 `zod` 构建：
```typescript
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

const server = new Server(
  {
    name: "mcp-database-inspector",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);
```

#### 2.2 严格输入契约强校验
所有工具入参必须通过 Zod Schema 进行强制类型声明与运行时拦截校验：
```typescript
const QueryTableSchema = z.object({
  tableName: z.string().describe("待查询的完整数据库表名"),
  limit: z.number().int().min(1).max(500).default(50).describe("返回的最大记录数，默认50条"),
});
```

#### 2.3 具备可行动力的错误反馈机制 (Actionable Errors)
错误消息决不能仅仅返回空洞的 `Error: Failed`，必须包含**清晰的根本原因与下一步行动建议**：
```typescript
// ✅ 优秀范例
throw new Error(
  `表 '${tableName}' 在当前数据库中不存在。当前可用表列表：[${availableTables.join(', ')}]。请检查表名拼写。`,
);
```

---

### 阶段 3：自动化测试与基准验收

1. **Schema 自省测试**：验证 `tools/list` 是否能完整输出各工具的 JSON Schema；
2. **入参非法边界测试**：传入脏数据、超限数值、缺少必填字段，验证服务是否能体面拦截并返回清晰报错；
3. **真实端到端集成测试**：在隔离测试环境中实际触发工具并断言外部系统的状态跃迁。

---

### 阶段 4：文档与部署分发

- 提供详尽的 `README.md`，明确标注运行环境变量（如 `DATABASE_URL`、`API_TOKEN`）；
- 提供直接可用的客户端配置 JSON 片段（如 Antigravity / Claude Desktop 配置格式）。
