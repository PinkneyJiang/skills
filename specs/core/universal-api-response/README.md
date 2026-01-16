# 📜 企业级通用 HTTP 响应与分页契约规范 (Universal API Response Spec)
> **适用范围**: 全语言全框架通用 (NestJS, React, Vue, Next.js, Nuxt.js)
> **设计目标**: 统一全系统前后端交互契约，杜绝各接口出参格式杂乱无章。

---

## 1. 标准单实体响应契约
所有 RESTful 接口的成功响应必须统一包装为如下强类型结构：

```typescript
export interface ApiResponse<T = unknown> {
  /** 业务状态码: 200 代表成功，其余均为特定业务错误码 */
  code: number;
  /** 友好的用户提示信息 (简体中文) */
  message: string;
  /** 核心业务数据载荷 */
  data: T;
  /** 全链路追踪 ID，方便线上排查分布式调用链 */
  traceId?: string;
  /** 响应返回的毫秒级时间戳 */
  timestamp: number;
}
```

---

## 2. 标准分页列表响应契约
针对数据大盘、列表查询接口，出参中的 `data` 必须统一遵循如下分页结构：

```typescript
export interface PageResult<T = unknown> {
  /** 当前页的数据实体集合 */
  list: T[];
  /** 满足查询条件的总记录条数 */
  total: number;
  /** 当前页码 (从 1 开始计) */
  page: number;
  /** 每页展示记录数 */
  pageSize: number;
  /** 计算出的总页数 */
  totalPages: number;
}
```
