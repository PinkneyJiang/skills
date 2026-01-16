---
name: apple-design-philosophy
description: 苹果流体物理界面设计哲学 (WWDC 2018 Fluid Interfaces) 在现代 Web 的完整落地指南。深入弹簧物理学、直接操控、可随时打断性与动量交接。
---

# 苹果流体物理交互与设计哲学 (apple-design-philosophy)

> *"当我们使数字界面的运动规律完全对齐人类思考与肢体运动的本能时，奇迹便发生了——它不再像一台冷冰冰的计算机，而成为我们肢体与感官的自然延伸。"*

本技能将苹果 WWDC 经典人机交互理念（源自 *Designing Fluid Interfaces*）完整投射于现代 Web 标准（CSS, Pointer Events, `requestAnimationFrame`, Motion/Framer Motion 物理引擎）。

---

## 核心四大基石准则

### 准则 1：极致响应——消灭一切输入延迟 (Response - Kill Latency)
一旦出现感知延迟，界面的"直接操控感"便瞬间崩塌。
- **在 `pointerdown` 瞬间响应，绝不等待 `click` 释放**：用户按压按钮的一刹那必须立即呈现微缩放或高光反馈；
- **全面排查人工延时**：严防防抖（Debounce）误用、无意义的延迟定时器与移动端 300ms 点击延迟；
- **拖拽过程中的 1:1 连续反馈**：在抽屉、滑块、卡片拖拽中，每一像素的移动都必须实时映射，绝不能在松手后才做动画。

```css
/* 瞬间按压反馈，100ms 极速收缩 */
.fluid-button:active {
  transform: scale(0.97);
  transition: transform 100ms cubic-bezier(0.2, 0, 0, 1);
}
```

---

### 准则 2：直接操作与 1:1 绝对抓取 (Direct Manipulation)
- 遵循"触摸点与内容同频共振"原则；
- 当用户抓住卡片某一点开始拖拽时，**必须保留抓取点相对于卡片顶点的原始偏移量**。若抓取的瞬间卡片中心突然吸附到手指，物理幻象会瞬间破裂；
- 采用现代 `Pointer Events` 并调用 `setPointerCapture`，防止指针滑出元素边界导致断连。

---

### 准则 3：可随时打断性——最高神圣准则 (Interruptibility)
> **"人类的念头与手势是并行的。"**
用户完全有可能在动画播放到一半时突然反悔或改变主意。**界面中的任何动画，都必须在任意毫秒被允许重新抓住并逆向推回。**

- **绝对禁止在动画过渡期间锁死用户输入**；
- **必须从元素的当前呈现值 (Presentation Value) 起步动画**：动画被打断重新定向时，必须读取元素屏幕当前的实时 Transform 矩阵作为新动画起点，严禁重置回初始或目标逻辑值（否则会发生剧烈跳变）；
- **放弃静态 CSS @keyframes 做手势交互**：帧动画无法感知手势速度，弹簧系统（Springs）是唯一能平滑承接速度的物理模型；
- **在 2D 运动中拆分独立的 X/Y 轴弹簧**：当水平与垂直方向存在不同初速度时，单弹簧会导致轨迹失真。

---

### 准则 4：行为优于动画——拥抱弹簧物理系统 (Use Springs)
固定时长的传统贝塞尔曲线（Duration-based Easing）是僵死的剧本，无法响应外界扰动。
弹簧不是动画，它是一个随物理受力实时演进的连续状态系统。

苹果舍弃了传统物理三元组（质量/刚度/阻尼），重构为两个符合直觉的参数：
1. **阻尼比 (Damping Ratio)**：控制过冲弹跳。
   - `1.0`：**临界阻尼 (Critically Damped)**，无回弹，平滑驻留，绝大多数企业与高频界面的首选；
   - `< 1.0`：产生回弹（如 `0.8`），**仅当交互手势本身携带速度惯性（滑动释放、轻甩 Flick）时才允许启用**。
2. **响应周期 (Response)**：达到目标的速度（以秒为单位），越小越灵敏清脆。

#### 苹果官方推荐标准参数速查表
| 交互场景 | 阻尼比 (Damping) | 响应时间 (Response) | 视觉特性 |
| :--- | :---: | :---: | :--- |
| 窗口位移 / 画中画 (PiP) | **1.0** | **0.4s** | 绝对平稳无回弹 |
| 界面旋转与翻转 | **0.8** | **0.4s** | 携带极轻微物理弹性 |
| 底部浮层抽屉 (Action Sheet) | **0.8** | **0.3s** | 快速响应与自然吸附 |

```typescript
import { animate } from 'motion';

// 1. 默认临界阻尼弹簧（优雅、从容、零回弹）
animate(element, { y: 0 }, { type: 'spring', bounce: 0, duration: 0.4 });

// 2. 带惯性的甩动手势释放（根据手势初速度承接惯性）
animate(element, { y: targetY }, { type: 'spring', bounce: 0.2, duration: 0.35, velocity: gestureVelocity });
```
