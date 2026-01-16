---
name: web-artifacts-builder
description: 构建现代化复杂 Web HTML 单文件自包含制品的完整工具箱。基于 React 18、Tailwind CSS、shadcn/ui 与内联打包器，打造兼具极致视觉与完整状态的独立交互制品。
---

# 复杂 Web 交互制品构建指南 (web-artifacts-builder)

本技能专用于快速搭建高度交互、自包含、单文件分发的 Web Artifact 制品。
制品融合了现代前端工业栈：**React 18 + TypeScript + Tailwind CSS + shadcn/ui + Parcel 内联打包**。

---

## 防廉价感与视觉质量红线 (Anti-Slop Guidelines)

为了避免生成物呈现出典型的"AI 廉价感 (AI Slop)"，必须坚决杜绝：
- 过度滥用毫无意义的居中对称卡片排版；
- 滥用高饱和度的紫色渐变底色；
- 全局使用单一不变的圆角（缺乏层次）；
- 默认无脑采用 Inter 字体，忽视排版个性。

---

## 标准开发与打包四步法

### 步骤 1：初始化现代组件工程
```bash
# 包含 React + TypeScript + Tailwind CSS + 40+ shadcn/ui 组件
npm init -y
npm i react react-dom @radix-ui/react-slot clsx tailwind-merge lucide-react
```

### 步骤 2：针对业务场景进行高水准开发
- 组件层级解耦，采用复合组件模式（Compound Components）；
- 严格遵循语义化 HTML 规范；
- 状态提升至顶级 Context 或轻量状态机。

### 步骤 3：打包为自包含单文件 HTML (Single-File Inlining)
利用内联打包技术将所有 JavaScript、CSS 样式与 SVG 图标全部压缩内嵌至单一 `index.html` 中：
- 消除任何外部第三方 CDN 网络请求阻碍；
- 确保即便在断网或内网离线沙箱环境中，该 HTML 制品亦能 100% 独立稳定渲染。

### 步骤 4：交付与交互体验验证
- 在标准视口（Desktop 1440px / Mobile 375px）中验证自适应响应式能力；
- 验证键盘 Tab 键可访问性导航与焦点指示环。
