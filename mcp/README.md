# 🔌 MCP 协议与连接器中枢 (Model Context Protocol Hub)

> 这里汇聚了 3 个真实可独立运行、无外部 monorepo 绑定的工业级 MCP Server 源码工程。
> 赋予智能体直接与本地物理数据库、真实 Chrome 无头浏览器以及 TypeScript 组件 AST 语法树交互的强大能力。

---

## 📂 核心 MCP 服务器列表

### 1. [🌐 core/mcp-browser-automation (无头浏览器自动化与视觉探测)](./core/mcp-browser-automation)
- **底层引擎**: 原生 `puppeteer-core` 驱动本地 Google Chrome / Microsoft Edge；
- **核心能力**:
  - `browser_navigate`: 访问指定 URL 并等待网络空闲 (`networkidle0`)；
  - `browser_screenshot`: 截取高质量视口或全页面滚动长图；
  - `browser_click` & `browser_type`: 模拟真实用户交互与表单输入；
  - `browser_get_dom`: 提取渲染后的真实 HTML DOM 树；
  - `browser_console_logs`: 实时收集控制台日志诊断前端运行时报错；
  - `browser_evaluate`: 在网页上下文中执行自定义 JavaScript 脚本。

### 2. [🎨 client/mcp-component-inspector (前端组件树与 Props AST 探测)](./client/mcp-component-inspector)
- **底层引擎**: 原生 TypeScript 编译器抽象语法树 (TS Compiler AST API)；
- **核心能力**:
  - `scan_components`: 递归遍历前端目录，识别所有 React 组件导出形态（默认导出/具名导出）；
  - `inspect_component_props`: 深度解析组件 Props 接口字段、类型约束、是否必填以及 JSDoc 业务注释；
  - `validate_component_reuse`: 基于 AST 深度检测 JSX 片段，拦截违规使用的原生 HTML 标签（如 `<button>`），输出团队规范替换建议。

### 3. [⚙️ server/mcp-database-inspector (数据库与 Prisma Schema 只读探测)](./server/mcp-database-inspector)
- **底层引擎**: `mysql2`、`pg` 双驱动直连，并内置 `schema.prisma` 静态语义解析器；
- **核心能力**:
  - `list_tables`: 列出活动数据库中的物理数据表或本地 Prisma 数据实体模型；
  - `describe_table`: 获取指定数据表的完整列定义（数据类型、主键、可空性、默认值与注释）；
  - `validate_prisma_query`: 静态校验模型查询字段是否存在，彻底杜绝 AI 代码生成中的"字段幻觉"。

---

## 🛠️ 在 IDE / 客户端中一键配置

在您的 IDE 配置文件（如 Antigravity / Claude Desktop / Cursor 的 `mcp_config.json`）中配置：

```json
{
  "mcpServers": {
    "component-inspector": {
      "command": "node",
      "args": ["d:/Work/pinkney-agent-hub/mcp/client/mcp-component-inspector/dist/index.js"]
    },
    "database-inspector": {
      "command": "node",
      "args": ["d:/Work/pinkney-agent-hub/mcp/server/mcp-database-inspector/dist/index.js"],
      "env": {
        "DATABASE_URL": "mysql://user:password@localhost:3306/my_database"
      }
    },
    "browser-automation": {
      "command": "node",
      "args": ["d:/Work/pinkney-agent-hub/mcp/core/mcp-browser-automation/dist/index.js"]
    }
  }
}
```
