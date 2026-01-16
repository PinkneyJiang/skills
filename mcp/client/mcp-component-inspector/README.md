# 🎨 前端组件树与 Props 契约静态探测 MCP Server
> **类型**: 前端端侧组件库与 TypeScript 契约探测服务
> **协议**: Model Context Protocol (MCP)

---

## 📌 解决的核心痛点
在大型前端项目中，开发者经常遗漏现存的高阶封装组件，误用原生标签重复造轮子；或者 AI 盲目猜测组件的 Props 参数。
本 MCP 赋予大模型静态探测能力：
1. **自动扫描组件库** (`scan_components`)：动态获取项目内全部封装好的高阶业务组件；
2. **精准提取 Props 签名** (`inspect_component_props`)：利用 AST 获取参数类型、默认值与中文说明；
3. **组件规范审查** (`validate_component_reuse`)：检测代码中是否有违背团队复用规范的非标写法。

---

## 🛠️ 如何配置运行？
在 IDE 的 `mcp_config.json` 中声明：

```json
{
  "mcpServers": {
    "component-inspector": {
      "command": "node",
      "args": ["<path>/mcp/client/mcp-component-inspector/dist/index.js"]
    }
  }
}
```
