# 🌐 无头浏览器端到端自动化与视觉探测 MCP (BrowserMCP)
> **类型**: 通用客户端/端侧无头浏览器控制 MCP Server
> **开源工程**: 基于 BrowserMCP 官方完整源码打造

---

## 📌 解决的核心痛点
传统 AI 编码助手被局限在纯文本代码补全中，无法亲眼看到前端页面渲染后的真实样子。
本 MCP Server 让大模型拥有了真正的“眼睛”和“手”：
1. **自动化页面交互**：模拟人类执行点击、文本输入、下拉选择与表单提交；
2. **DOM 树状态快照**：深入探测页面可访问性树（ARIA Tree）与 DOM 真实结构；
3. **视觉审查与回归验证**：在页面修改后自动截取高分辨率长图，进行像素级布局对比。

---

## 🛠️ 如何配置运行？
在您的 IDE (如 Claude Desktop / Cursor / Antigravity) 的 `mcp_config.json` 中声明：

```json
{
  "mcpServers": {
    "browser-automation": {
      "command": "node",
      "args": ["<path>/mcp/core/mcp-browser-automation/dist/index.js"]
    }
  }
}
```
