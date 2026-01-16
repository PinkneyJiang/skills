# 📜 生成式 UI 动态组件交互协议契约 (Generative UI Protocol Spec)
> **适用范围**: 大模型端侧通信、动态组件挂载 (React / Vue)
> **设计目标**: 摆脱死板的纯 Markdown 文本回复，让 AI 直接流式驱动前端挂载真实可交互的高阶组件。

---

## 1. 结构化通信 Payload
当大模型识别到需要向用户展示可视化数据、时序图、表单或多维卡片时，统一返回结构化载荷：

```typescript
export interface GenerativeUIPayload<P = Record<string, unknown>> {
  /** 必须严格匹配前端组件注册中心中的唯一键名 */
  component: string;
  /** 传递给该组件的强类型 Props 参数 */
  props: P;
  /** 卡片外层可折叠面板的中文标题 */
  title?: string;
  /** 推荐的呈现布局形态 */
  layout?: 'inline' | 'modal' | 'fullscreen';
}
```
