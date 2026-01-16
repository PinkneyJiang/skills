# 📐 契约与协议规范中枢 (Specifications Hub)

> 这里存放全局通用、跨项目复用的前后端技术协议与架构标准规范。
> 统一数据格式、通信协议、生命周期与 RESTful 语义，杜绝团队协作歧义。

---

## 📂 核心规范清单

### 1. [🌐 core/universal-api-response (统一 API 响应格式与错误契约)](./core/universal-api-response)
- **核心定位**: 规范前后端顶层信封结构 (`code`, `message`, `data`, `timestamp`, `traceId`)；
- **治理内容**: 全局业务状态码与 HTTP 映射表、标准分页数据结构、NestJS 统一响应拦截器与前端 Axios 自动拆包防错。

### 2. [🌐 core/generative-ui-protocol (生成式 UI 流式传输与渲染协议)](./core/generative-ui-protocol)
- **核心定位**: 大语言模型流式输出动态可交互组件的跨端交互标准；
- **治理内容**: `:::ui-component` 定界符协议、流式混合解析状态机、前端安全组件注册中心白名单与沙箱防注入隔离。

### 3. [🎨 client/frontend-page-lifecycle (前端单页应用生命周期与容错设计)](./client/frontend-page-lifecycle)
- **核心定位**: 现代 SPA / SSR 页面从路由拦截到卸载销毁的全链路标准；
- **治理内容**: 导航鉴权守卫、数据并行预取与多级 SWR 缓存失效矩阵、ErrorBoundary 页面防崩兜底与 AbortController 卸载防内存泄漏。

### 4. [⚙️ server/restful-crud-conventions (RESTful CRUD 接口设计规范)](./server/restful-crud-conventions)
- **核心定位**: 云原生与微服务标准 RESTful 资源建模与动作准则；
- **治理内容**: 严格复数名词 URI、标准 HTTP Method (GET/POST/PUT/PATCH/DELETE) 语义与状态码映射、批量操作设计与版本演进策略。
