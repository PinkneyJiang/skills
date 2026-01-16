---
name: frontend-page-lifecycle
description: 现代前端单页应用 (SPA / SSR) 页面生命周期与容错设计标准。包含路由导航守卫流程、数据并行预取策略、多级缓存失效矩阵与错误边界兜底体系。
---

# 前端应用页面生命周期与容错工程规范 (frontend-page-lifecycle)

本规范系统化定义前端页面在从用户触发导航、鉴权判定、数据并发预取、骨架屏渲染、组件挂载到页面卸载销毁的完整生命周期标准，
保障系统具备**秒开级加载性能、零闪烁路由切换以及全景级错误自愈能力**。

---

## 1. 页面标准生命周期流程图

```text
[ 用户触发路由跳转 (Link / navigate) ]
                 │
                 ▼
┌────────────────────────────────────────────────────────┐
│ 1. 路由解析与导航守卫 (Navigation Guard)               │
│    - 检查用户 Token 是否有效与未过期                    │
│    - 校验用户角色/权限是否包含该页面权限标识            │
│    - [未通过] ──► 重定向至登录页或 403 缺省页           │
└────────────────────────┬───────────────────────────────┘
                         │ [验证通过]
                         ▼
┌────────────────────────────────────────────────────────┐
│ 2. 数据并行预取与缓存嗅探 (Prefetch & Cache Check)      │
│    - 检查 SWR / React Query 缓存命中状态                │
│    - 若缓存新鲜：立即渲染，后台静默 Revalidate          │
│    - 若无缓存：渲染微细骨架屏 (Skeleton)，并行发起请求  │
└────────────────────────┬───────────────────────────────┘
                         │
                         ▼
┌────────────────────────────────────────────────────────┐
│ 3. 视图挂载与平滑过渡 (Mount & Smooth Transition)       │
│    - 挂载 React 根节点并注入上下文                      │
│    - 建立 WebSocket / SSE 实时通信连接 (如需要)         │
│    - 上报页面 PV/UV 埋点与首屏加载耗时性能指标          │
└────────────────────────┬───────────────────────────────┘
                         │ 路由切换离开
                         ▼
┌────────────────────────────────────────────────────────┐
│ 4. 彻底清理与资源释放 (Unmount & Cleanup)              │
│    - 销毁所有未完成的 Fetch (AbortController.abort())   │
│    - 注销所有全局事件监听器 (resize, scroll, keydown)   │
│    - 清理定时器并关闭 WebSocket 连接，防内存泄漏        │
└────────────────────────────────────────────────────────┘
```

---

## 2. 缓存失效与更新策略矩阵 (Cache Invalidation Matrix)

| 数据属性 | 推荐缓存模式 | Stale Time | Cache Time | 重新验证触发时机 |
| :--- | :--- | :--- | :--- | :--- |
| **高频静态字典** (数据字典、省市区) | 永久缓存 (Cache-First) | 24 小时 | 7 天 | 手动刷新或版本更新 |
| **核心数据列表** (订单、客户、房源) | SWR 读时更新 | 30 秒 | 5 分钟 | 窗口重新聚焦、路由切入 |
| **强一致性详情** (账户余额、库存量) | 网络优先 (Network-Only) | 0 秒 | 0 秒 | 每次进入强制请求最新状态 |
| **用户专属权限** (菜单树、权限标识) | 会话级缓存 (Session-Store) | 30 分钟 | 登录生命周期 | 重新登录或切换租户时重置 |

---

## 3. 防崩兜底：通用 React 错误边界实现 (ErrorBoundary)

```typescript
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button, Result } from 'antd';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class SafePageErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[PageCrash] 捕获页面未处理异常:', error, errorInfo);
    // 上报异常至前端监控平台 (如 Sentry)
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-[400px] p-6">
          <Result
            status="error"
            title={this.props.fallbackTitle || '页面加载发生异常'}
            subTitle={this.state.error?.message || '组件内部渲染出错，请尝试刷新页面恢复。'}
            extra={[
              <Button type="primary" key="reload" onClick={this.handleReset}>
                重新加载页面
              </Button>,
              <Button key="back" onClick={() => window.history.back()}>
                返回上一页
              </Button>,
            ]}
          />
        </div>
      );
    }

    return this.props.children;
  }
}
```

---

## 4. 页面资源卸载与防内存泄漏标准实践

```typescript
import { useEffect } from 'react';

export function usePageLifecycle(pageName: string) {
  useEffect(() => {
    const abortController = new AbortController();
    console.log(`[Lifecycle] ${pageName} 挂载就绪`);

    // 监听窗口大小
    const handleResize = () => { /* ... */ };
    window.addEventListener('resize', handleResize);

    return () => {
      console.log(`[Lifecycle] ${pageName} 即将卸载，启动资源清理`);
      // 1. 取消所有未完成的异步请求
      abortController.abort();
      // 2. 移除全局事件监听
      window.removeEventListener('resize', handleResize);
    };
  }, [pageName]);
}
```
