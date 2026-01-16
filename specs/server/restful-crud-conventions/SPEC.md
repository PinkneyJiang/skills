---
name: restful-crud-conventions
description: 现代微服务与云原生 RESTful CRUD API 深度设计规范。统一资源路径命名、HTTP 动词语义、标准状态码对照、批量操作与版本演进策略。
---

# 现代 RESTful CRUD 接口设计规范 (restful-crud-conventions)

本规范为工程团队制定统一、清晰且符合 RFC 9110 标准的 RESTful API 设计标准。
杜绝在 URL 中滥用动词、随意混用 HTTP Method 以及混乱的状态码返回。

---

## 1. 资源 URI 命名核心准则

1. **资源路径必须使用复数名词**，严禁出现操作动词：
   - ✅ 规范：`/api/v1/orders`、`/api/v1/users`、`/api/v1/housing-units`
   - ❌ 违规：`/api/v1/getOrders`、`/api/v1/createUser`、`/api/v1/delete_user`
2. **多词连接统一使用中划线 (kebab-case)**：
   - ✅ 规范：`/api/v1/video-mix-tasks`
   - ❌ 违规：`/api/v1/video_mix_tasks`、`/api/v1/videoMixTasks`
3. **层级从属关系表达 (Sub-Resources)**：
   - 获取某用户的订单列表：`/api/v1/users/:userId/orders`
   - 关联层级严禁超过 2 层，超过时应提升为顶级资源并通过 Query 参数过滤。

---

## 2. 标准 CRUD 动词与 HTTP 状态码对照表

| 操作意图 | HTTP Method | 资源路径规范 | 成功状态码 | 幂等性 | 安全性 | 说明与返回格式 |
| :--- | :---: | :--- | :---: | :---: | :---: | :--- |
| **分页列表** | `GET` | `/api/v1/orders` | **200 OK** | 是 | 是 | 返回标准分页数据包裹对象 |
| **单条详情** | `GET` | `/api/v1/orders/:id` | **200 OK** | 是 | 是 | 返回单个实体详情，不存在返 404 |
| **新建资源** | `POST` | `/api/v1/orders` | **201 Created** | 否 | 否 | 返回新创建实体的完整视图对象 |
| **全量替换** | `PUT` | `/api/v1/orders/:id` | **200 OK** | 是 | 否 | 需提交实体的全量字段，整体覆盖 |
| **局部更新** | `PATCH` | `/api/v1/orders/:id` | **200 OK** | 否 | 否 | 仅提交需要修改的字段（推荐方式） |
| **删除资源** | `DELETE` | `/api/v1/orders/:id` | **204 No Content** | 是 | 否 | 物理或逻辑软删除，返回空体 |

---

## 3. 批量操作设计规范 (Batch Operations)

当需要对多个资源执行批量操作时，必须采用专门的批量动作资源：

```text
1. 批量删除:
   DELETE /api/v1/orders
   Body: { "ids": [101, 102, 103] }

2. 批量状态变更 (批量审批):
   POST /api/v1/orders/batch-approval
   Body: {
     "ids": [101, 102, 103],
     "action": "APPROVE",
     "remark": "批量合规通过"
   }
```

---

## 4. 查询参数设计标准 (Filtering, Sorting, Pagination)

| 查询需求 | Query 参数命名规范 | 示例 |
| :--- | :--- | :--- |
| **基础分页** | `page` (从 1 起), `pageSize` (默认 20, 最大 200) | `?page=1&pageSize=20` |
| **精准过滤** | 字段全名匹配 | `?status=COMPLETED&userId=10086` |
| **模糊检索** | `keyword` | `?keyword=张三` |
| **时间范围** | `startTime` & `endTime` (ISO 8601 或时间戳) | `?startTime=2026-09-01&endTime=2026-09-07` |
| **排序规则** | `sortBy` 与 `sortOrder` (asc / desc) | `?sortBy=createdAt&sortOrder=desc` |

---

## 5. API 版本控制策略 (Versioning)

- **推荐采用 URL 路径前缀版本化**：`/api/v1/...`；
- 当发生**破坏性变更 (Breaking Changes)**（如删除必填字段、重命名端点、修改返回数据类型）时，升级至 `/api/v2/...`；
- 向后兼容的非破坏性变更（如增加非必填可选入参、在返回中增加新字段），保持当前版本不变。
