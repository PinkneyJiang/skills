---
name: generative-ui-protocol
description: 大模型驱动的生成式 UI (Generative UI) 流式交互协议标准。定义组件动态声明语法、流式解析状态机、前端挂载容器与安全沙箱执行规约。
---

# 生成式 UI 流式传输与渲染协议 (generative-ui-protocol)

生成式 UI（Generative UI）允许大模型在输出纯 Markdown 文本流的同时，**实时动态下发结构化的可交互前端组件**（例如图表、审批卡片、确认弹窗、动态表单等）。
本协议规范了组件从服务端流式下发、客户端增量解析到沙箱隔离渲染的全流程。

---

## 1. 协议文本帧语法规范 (Text Framing)

大语言模型在流式输出中通过专门的定界标签包裹组件数据：

```markdown
这里是分析结果正文，请查看以下生成的财务对比图表：

:::ui-component
{
  "id": "comp_a8f921",
  "name": "FinancialBarChart",
  "version": "1.0.0",
  "props": {
    "title": "2026 Q3 营收与利润分布",
    "categories": ["7月", "8月", "9月"],
    "series": [
      { "name": "营业收入", "data": [120, 150, 180] },
      { "name": "净利润", "data": [45, 60, 75] }
    ]
  }
}
:::

以上图表显示净利润持续保持高速稳步增长。
```

---

## 2. 核心架构与安全沙箱模型

```text
[ LLM 流式输出 (Token Stream) ]
               │
               ▼
┌────────────────────────────────────────────────────────┐
│ 1. 混合流式状态机分流器 (Hybrid Stream Parser)         │
│    - 识别 :::ui-component 定界符                      │
│    - 文本片段 ──► 送入普通 Markdown 渲染管道           │
│    - JSON 片段 ──► 送入组件流式校验管道                 │
└──────────────────────┬─────────────────────────────────┘
                       │ 完整合法 Component Payload
                       ▼
┌────────────────────────────────────────────────────────┐
│ 2. 前端安全组件注册中心 (Component Registry)           │
│    - 严格白名单机制 (仅渲染本地预注册组件，禁止执行 eval) │
│    - Zod Schema 运行时校验 Props 完整性                 │
│    - ErrorBoundary 兜底异常防崩溃                      │
└──────────────────────┬─────────────────────────────────┘
                       │ 实例化渲染
                       ▼
          [ 动态交互式 UI 卡片呈现 ]
```

---

## 3. 前端组件注册中心实现标准

```typescript
import React from 'react';
import { z } from 'zod';

export interface UIComponentDescriptor<P = any> {
  name: string;
  component: React.ComponentType<P>;
  schema: z.ZodSchema<P>;
}

class UIComponentRegistry {
  private registry = new Map<string, UIComponentDescriptor>();

  public register<P>(descriptor: UIComponentDescriptor<P>): void {
    this.registry.set(descriptor.name, descriptor);
  }

  public get(name: string): UIComponentDescriptor | undefined {
    return this.registry.get(name);
  }
}

export const uiRegistry = new UIComponentRegistry();

// 注册示例组件
const FinancialBarChartSchema = z.object({
  title: z.string(),
  categories: z.array(z.string()),
  series: z.array(z.object({
    name: z.string(),
    data: z.array(z.number()),
  })),
});

uiRegistry.register({
  name: 'FinancialBarChart',
  component: ({ title, categories, series }) => (
    <div className="p-4 border rounded-lg bg-card shadow-sm">
      <h4 className="font-semibold text-base mb-2">{title}</h4>
      {/* 渲染真实图表 */}
    </div>
  ),
  schema: FinancialBarChartSchema,
});
```

---

## 4. 客户端动态流式解析器伪代码

```typescript
export function parseGenerativeUIStream(fullText: string): {
  type: 'markdown' | 'component';
  content?: string;
  componentData?: any;
}[] {
  const chunks: any[] = [];
  const regex = /:::ui-component\s*([\s\S]*?):::/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(fullText)) !== null) {
    // 提取组件前的普通 Markdown 文本
    if (match.index > lastIndex) {
      chunks.push({
        type: 'markdown',
        content: fullText.slice(lastIndex, match.index),
      });
    }

    try {
      const parsedJson = JSON.parse(match[1].trim());
      chunks.push({
        type: 'component',
        componentData: parsedJson,
      });
    } catch {
      // 若 JSON 尚未生成完整（流传输中），渲染骨架占位
      chunks.push({
        type: 'markdown',
        content: '*[组件加载中...]*',
      });
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < fullText.length) {
    chunks.push({
      type: 'markdown',
      content: fullText.slice(lastIndex),
    });
  }

  return chunks;
}
```

---

## 5. 安全沙箱与防护红线 (Security Guardrails)

- ❌ **绝对严禁在客户端 `eval()` 执行模型下发的裸 JavaScript 代码**；
- ❌ **严禁模型直接注入 `<script>` 或原生 `iframe` 标签**；
- ✅ **白名单强制约束**：若模型下发了未注册的组件名称，系统必须优雅降级为友好提示卡片，绝不白屏崩溃；
- ✅ **组件事件隔离**：组件内部发起的交互行为（如点击"确认授权"按钮）必须通过安全的 Callback 协议回传给 Agent 会话。
