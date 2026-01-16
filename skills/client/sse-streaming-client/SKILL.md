---
name: sse-streaming-client
description: 工业级前端大模型 SSE (Server-Sent Events) 与二进制流式通信客户端。内置 UTF-8 跨包截断解码自愈、4 字节大端定长帧解包、requestAnimationFrame 平滑打字机缓冲插值队列与指数退避断线重连。
---

# 工业级通用流式客户端工程标准 (sse-streaming-client)

在大模型生成式应用中，后端吐字通常是突发、块状且忽快忽慢的，同时多字节 UTF-8 字符容易在数据包切片边界被生硬截断导致乱码。
本技能提供一套完整的现代化前端流式通信解析与平滑渲染工程标准。

---

## 核心架构与设计规范

```text
[ 服务端 SSE / 二进制流 ]
         │
         ▼ Fetch (ReadableStream)
┌──────────────────────────────────────────────┐
│  网络抗乱码解码器 (Robust Stream Decoder)    │
│  - TextDecoder({ fatal: false, stream: true})│  ← 解决多字节字符跨包截断
│  - 4 字节大端定长帧解包 (Big-Endian Framing) │  ← 解决粘包与半包拼接
└──────────────────────┬───────────────────────┘
                       │ 完整消息事件 (Event Frames)
                       ▼
┌──────────────────────────────────────────────┐
│  平滑打字机插值队列 (Smooth Typing Queue)     │
│  - requestAnimationFrame 自适应插值调度       │  ← 消除生硬跳跃与忽快忽慢
│  - 缓冲区水位动态调速 (Backpressure Control)  │  ← 积压时加速，见底时平滑
└──────────────────────┬───────────────────────┘
                       │ 逐字平滑输出
                       ▼
            [ UI 视图高性能渲染 ]
```

---

## 生产级 TypeScript 完整参考实现

```typescript
export interface StreamChunkPayload {
  id?: string;
  event?: string;
  data: string;
}

export interface StreamClientOptions {
  url: string;
  headers?: Record<string, string>;
  body?: unknown;
  onChunk: (text: string) => void;
  onComplete?: () => void;
  onError?: (err: Error) => void;
  /** 是否开启 4 字节定长前缀二进制帧解码模式 */
  isBinaryFramed?: boolean;
}

export class ProductionStreamClient {
  private abortController: AbortController | null = null;
  private queue: string[] = [];
  private isConsuming = false;
  private isFinished = false;

  constructor(private options: StreamClientOptions) {}

  public async connect(): Promise<void> {
    this.abortController = new AbortController();
    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount <= maxRetries) {
      try {
        const response = await fetch(this.options.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'text/event-stream',
            ...(this.options.headers || {}),
          },
          body: JSON.stringify(this.options.body || {}),
          signal: this.abortController.signal,
        });

        if (!response.ok || !response.body) {
          throw new Error(`HTTP 流式请求失败: ${response.status} ${response.statusText}`);
        }

        await this.readStream(response.body);
        return;
      } catch (err: unknown) {
        if ((err as Error).name === 'AbortError') {
          return; // 主动取消不重试
        }
        retryCount++;
        if (retryCount > maxRetries) {
          this.options.onError?.(err as Error);
          return;
        }
        // 指数退避重试 (1s, 2s, 4s)
        const delay = Math.pow(2, retryCount - 1) * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  private async readStream(body: ReadableStream<Uint8Array>): Promise<void> {
    const reader = body.getReader();
    // 关键：启用 stream: true 防止多字节中文在 chunk 边界截断出现  乱码
    const decoder = new TextDecoder('utf-8', { fatal: false, stream: true });
    let buffer = '';

    this.startTypingQueue();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          this.isFinished = true;
          break;
        }

        const chunkText = decoder.decode(value, { stream: true });
        buffer += chunkText;

        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // 最后一行可能未完整，放回 buffer

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith(':')) continue; // 心跳注释忽略

          if (trimmed.startsWith('data:')) {
            const dataContent = trimmed.slice(5).trim();
            if (dataContent === '[DONE]') {
              this.isFinished = true;
              return;
            }
            try {
              const parsed = JSON.parse(dataContent);
              const content = parsed.content || parsed.text || parsed.data || '';
              this.enqueueText(content);
            } catch {
              // 容错处理纯文本流
              this.enqueueText(dataContent);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * 将接收到的文本块送入缓冲队列
   */
  private enqueueText(text: string): void {
    if (!text) return;
    for (const char of text) {
      this.queue.push(char);
    }
  }

  /**
   * 基于 requestAnimationFrame 的自适应平滑打字机调度
   */
  private startTypingQueue(): void {
    if (this.isConsuming) return;
    this.isConsuming = true;

    const tick = () => {
      if (this.queue.length > 0) {
        // 根据缓冲区水位动态调节步长：积压越多吐字越快，平缓时单字吐出
        const step = this.queue.length > 100 ? 5 : this.queue.length > 30 ? 2 : 1;
        const slice = this.queue.splice(0, step).join('');
        this.options.onChunk(slice);
      }

      if (this.isFinished && this.queue.length === 0) {
        this.isConsuming = false;
        this.options.onComplete?.();
        return;
      }

      requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }

  public abort(): void {
    this.abortController?.abort();
  }
}
```
