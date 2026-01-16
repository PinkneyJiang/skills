# ⚙️ 数据库表结构与 Prisma 元数据安全只读探测 MCP Server
> **类型**: 服务端数据库安全只读探测服务
> **协议**: Model Context Protocol (MCP)

---

## 📌 解决的核心痛点
在编写后端接口与 Prisma 数据查询时，字段名拼写错误（例如将 `createdAt` 误写为 `created_at`）是极易引发生产崩溃的隐患。
本 MCP 允许大模型在受限的安全只读沙箱中探测物理数据库结构：
1. **列出数据库实体** (`list_tables`)：获取当前所有数据表与模型；
2. **探测列与外键约束** (`describe_table`)：获取精准字段名、物理类型、主键与外键依赖；
3. **静态预校验** (`validate_prisma_query`)：写业务逻辑前提前验证字段合法性。

---

## 🛠️ 如何配置运行？
在 IDE 的 `mcp_config.json` 中声明：

```json
{
  "mcpServers": {
    "database-inspector": {
      "command": "node",
      "args": ["<path>/mcp/server/mcp-database-inspector/dist/index.js"],
      "env": {
        "DATABASE_URL": "mysql://root:password@localhost:3306/mydb"
      }
    }
  }
}
```
