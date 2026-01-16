---
name: webapp-e2e-testing
description: 基于 Playwright 的本地 Web 应用自动化交互、测试、截屏与调试工具箱。支持全流程生命周期管理、网络空闲判定与端到端功能验证。
---

# Web 应用端到端自动化测试技能 (webapp-e2e-testing)

本技能用于为本地 Web 应用程序编写并执行原生 Python / Node.js Playwright 自动化测试脚本，
实现界面功能验证、交互流程复现、页面全景截图捕获与控制台运行时日志审计。

---

## 核心决策树：选择最稳健的测试路径

```text
待测目标应用
   │
   ├─ 属于纯静态 HTML 文件？
   │    ├─ 是 ──► 直接读取 HTML 分析选择器 ──► 编写轻量 Playwright 验证
   │    └─ 否 ──► 属于动态现代 Web 应用 (React / Vue / Vite / Next.js)
   │               │
   │               ├─ 本地开发服务器尚未启动？
   │               │    └──► 启动服务器并等待端口就绪 (如 localhost:5173)
   │               │
   │               └─ 服务器已就绪 ──► 执行"先侦察、后行动"标准范式：
   │                    1. 访问目标 URL 并严格等待 networkidle 状态；
   │                    2. 截取视口/全页快照以捕获渲染后的 DOM 现状；
   │                    3. 从真实渲染节点中提取强健的选择器；
   │                    4. 执行点击、填充、键盘输入与状态断言。
```

---

## 侦察-动作标准范式 (Reconnaissance-Then-Action)

在动态 Web 应用中，**严禁在页面加载未完成时盲目触发选择器交互**。必须严格遵循：

```python
from playwright.sync_api import sync_playwright

def run_e2e_test():
    with sync_playwright() as p:
        # 始终以无头模式启动 Chromium，确保环境兼容性
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1440, 'height': 900})
        page = context.new_page()

        # 1. 导航并等待网络与 JS 完全执行
        page.goto('http://localhost:5173')
        page.wait_for_load_state('networkidle') # 关键：等待所有异步请求与渲染完毕

        # 2. 侦察现场与快照存档
        page.screenshot(path='test-results/inspect-loaded.png', full_page=True)

        # 3. 基于语义与角色执行操作
        # 优先使用基于 Role 与文本的可访问性选择器，杜绝脆弱的深层绝对 XPath
        submit_btn = page.get_by_role('button', name='确认提交')
        submit_btn.wait_for(state='visible')
        submit_btn.click()

        # 4. 状态断言验证
        toast = page.locator('.notification-toast')
        toast.wait_for(state='visible', timeout=5000)
        assert '操作成功' in toast.inner_text()

        browser.close()

if __name__ == '__main__':
    run_e2e_test()
```

---

## 核心规约与防踩坑指南

### 1. 选择器优先级金字塔
1. **语义角色与文本**（推荐）：`page.get_by_role('button', name='登录')`、`page.get_by_label('手机号')`；
2. **专属测试标识符**（稳健）：`page.locator('[data-testid="user-avatar"]')`；
3. **语义 CSS 类名**：`.login-submit-btn`；
4. ❌ **严禁使用**：依赖 DOM 结构的深层路径（如 `div > div:nth-child(3) > span > button`），界面微调时极易失效。

### 2. 严厉避坑：网络等待纪律
- ❌ **绝对不要**在页面刚 `goto()` 之后立即抓取 DOM；
- ✅ **必须**显式调用 `wait_for_load_state('networkidle')` 或 `wait_for_selector()`。
