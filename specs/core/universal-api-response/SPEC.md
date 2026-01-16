---
name: universal-api-response
description: 企业级统一前后端 RESTful / RPC API 响应格式与错误处理契约规范。包含统一封装信封结构、全局业务状态码字典、NestJS 统一响应拦截器与前端 Axios 自动解包实现。
---

# 统一 API 响应格式与错误治理契约 (universal-api-response)

在现代全栈微服务架构中，建立前后端统一的**信封式响应协议 (Envelope Response Pattern)** 是消除对接歧义、统一全局异常捕获与保障客户端稳健消费的基石。

---

## 1. 统一响应顶层信封结构 (JSON Envelope)

所有 HTTP 接口（无论业务成功还是失败）统一返回以下顶层 JSON 契约：

```typescript
export interface ApiResponse<T = any> {
  /**
   * 业务状态码：0 表示绝对成功，非 0 表示各类业务受控异常
   */
  code: number;

  /**
   * 面向最终用户的提示信息 (简体中文，严禁向前端暴露未处理的底层 SQL 错误或敏感堆栈)
   */
  message: string;

  /**
   * 业务数据载荷 (在分页、详情或列表接口中返回具体实体；当发生错误时为 null)
   */
  data: T | null;

  /**
   * 服务器响应时的时间戳 (UTC 毫秒数)
   */
  timestamp: number;

  /**
   * 全局分布式链路追踪唯一 ID (TraceId)，便于前后端协同定位排错
   */
  traceId: string;
}
```

---

## 2. 全局业务状态码与 HTTP 状态码映射字典

| HTTP 状态码 | 业务 code 码段 | 含义说明 | 适用场景范例 | 客户端处理指引 |
| :--- | :--- | :--- | :--- | :--- |
| **200 OK** | `0` | 成功 (SUCCESS) | 查询成功、数据更新成功 | 正常解包消费 `data` 字段 |
| **201 Created** | `0` | 资源创建成功 | 新建订单、新建用户 | 获取 `data.id` 并刷新列表 |
| **400 Bad Request** | `40001` ~ `40099` | 参数校验失败 | 缺少必填项、邮箱格式错误、超限 | 在输入表单项下方标红提示 |
| **401 Unauthorized** | `40101` | 未登录 / Token 过期 | 缺失 Bearer Token、JWT 过期 | 清空本地缓存并跳转至登录页 |
| **403 Forbidden** | `40301` | 权限不足 | 普通用户尝试访问超级管理员接口 | 弹出气泡提示"无权访问" |
| **404 Not Found** | `40401` | 目标资源不存在 | 订单不存在、用户已被注销 | 渲染 404 空状态插画 |
| **409 Conflict** | `40901` | 状态冲突 / 并发超卖 | 库存不足、手机号已存在、版本冲突 | 提示用户刷新重试 |
| **429 Too Many Req** | `42901` | 触发限流保护 | 短时间内高频刷接口 | 触发前端防抖等待倒计时 |
| **500 Server Error** | `50000` | 服务端内部未知异常 | 未捕获空指针、数据库宕机 | 提示"系统繁忙，请稍后重试"并上报 traceId |

---

## 3. 分页列表响应契约规范 (Pagination Structure)

对于所有列表与搜索接口，`data` 字段必须统一封装为标准分页容器对象：

```typescript
export interface PaginatedData<T> {
  /** 数据项列表 */
  items: T[];
  /** 符合条件的记录总数 */
  total: number;
  /** 当前页码 (从 1 开始计数) */
  page: number;
  /** 每页条数 */
  pageSize: number;
  /** 是否存在下一页 */
  hasNext: boolean;
}
```

---

## 4. 服务端 NestJS 全局拦截器实现参考

```typescript
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    const request = context.switchToHttp().getRequest();
    const traceId = (request.headers['x-trace-id'] as string) || uuidv4();

    return next.handle().pipe(
      map((data) => ({
        code: 0,
        message: '操作成功',
        data: data ?? null,
        timestamp: Date.now(),
        traceId,
      })),
    );
  }
}
```

---

## 5. 前端 Axios 拦截器与自动拆包参考

```typescript
import axios, { AxiosResponse } from 'axios';
import { message } from 'antd';

export const apiClient = axios.create({
  baseURL: '/api/v1',
  timeout: 10000,
});

apiClient.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    const res = response.data;
    // 1. 业务 code 为 0，视为成功，直接透传 data 给业务代码
    if (res.code === 0) {
      return res.data;
    }

    // 2. 识别特定业务状态码（如 40101 登录过期）
    if (res.code === 40101) {
      localStorage.removeItem('access_token');
      window.location.href = '/login';
      return Promise.reject(new Error(res.message));
    }

    // 3. 通用业务异常统一 Toast 告警
    message.error(res.message || '请求处理失败');
    return Promise.reject(new Error(res.message));
  },
  (error) => {
    // 处理网络离线、超时或 500 崩溃
    message.error('网络连接异常或服务暂时不可用');
    return Promise.reject(error);
  }
);
```
