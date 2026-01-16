---
name: prisma-transaction-lifecycle
description: 现代数据库高并发事务与生命周期管理标准。涵盖 Prisma 交互式事务 ($transaction)、防长事务挂起超时配置、乐观并发控制与死锁自动重试。
---

# 数据库事务生命周期与高并发控制 (prisma-transaction-lifecycle)

在涉及资金结算、库存调拨、积分流转等核心业务时，数据库事务（ACID）是保障数据强一致性的生死线。
然而，**错误的事务使用方式会导致数据库连接池枯竭、行级锁级联争抢甚至死锁崩溃**。

本技能指导开发者基于 Prisma 7.x 建立健壮的高并发事务控制体系。

---

## 核心架构原则

### 1. 事务极速生命周期原则 (Short-Lived Transactions)
- **事务内仅执行纯粹的数据库读写**；
- ❌ **绝对禁止在事务内部执行外部网络 HTTP 调用、RPC 远程请求或长耗时文件加密**；
- 若外部请求耗时 2 秒，数据库连接与行级锁将被硬生生冻结 2 秒，瞬间打满连接池导致整站宕机。

### 2. 批量事务 (Batch) vs 交互式事务 (Interactive)
- **批量事务 (Batch)**：多条无前后逻辑依赖的写入，优先使用数组批处理，网络吞吐极高：
  ```typescript
  await prisma.$transaction([
    prisma.log.create({ data: logData }),
    prisma.stat.update({ where: { id: 1 }, data: { count: { increment: 1 } } })
  ]);
  ```
- **交互式事务 (Interactive)**：后续操作强依赖前置查询结果，使用回调闭包：
  ```typescript
  await prisma.$transaction(async (tx) => { ... }, { maxWait: 5000, timeout: 10000 });
  ```

---

## 生产级交互式事务完整实践

```typescript
import { Injectable, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class AccountTransferService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 跨账户原子资金划转（带超时防御与死锁重试机制）
   */
  public async transferFunds(
    fromAccountId: number,
    toAccountId: number,
    amount: number,
  ): Promise<void> {
    const maxRetries = 3;
    let attempt = 0;

    while (attempt < maxRetries) {
      attempt++;
      try {
        await this.prisma.$transaction(
          async (tx) => {
            // 1. 扣减源账户（使用乐观更新与数量校验）
            const source = await tx.account.update({
              where: {
                id: fromAccountId,
                balance: { gte: amount }, // 关键：数据库级别直接校验余额充足，防超卖
              },
              data: {
                balance: { decrement: amount },
              },
            });

            if (!source) {
              throw new ConflictException('源账户余额不足，划转已被安全拒绝');
            }

            // 2. 增加目标账户
            await tx.account.update({
              where: { id: toAccountId },
              data: {
                balance: { increment: amount },
              },
            });

            // 3. 记录对账交易流水
            await tx.transactionAudit.create({
              data: {
                fromAccountId,
                toAccountId,
                amount,
                status: 'SUCCESS',
                executedAt: new Date(),
              },
            });
          },
          {
            maxWait: 3000, // 从连接池等待可用连接的最长时间：3秒
            timeout: 5000, // 事务内执行全量操作的最大生命周期：5秒（防止锁死）
            isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted, // 标准隔离级别
          },
        );

        return; // 事务成功，顺利返回
      } catch (error: unknown) {
        const prismaError = error as Prisma.PrismaClientKnownRequestError;
        // P2034: 并发冲突 / 死锁回滚错误代码
        if (prismaError?.code === 'P2034' && attempt < maxRetries) {
          // 随机抖动退避重试 (50ms ~ 150ms)
          const backoff = Math.floor(Math.random() * 100) + 50;
          await new Promise((res) => setTimeout(res, backoff));
          continue;
        }

        // 遇到确定性业务错误立即抛出，不重试
        if (error instanceof ConflictException) {
          throw error;
        }

        throw new InternalServerErrorException(`资金转账事务失败: ${(error as Error).message}`);
      }
    }
  }
}
```

---

## 乐观并发控制规范 (Optimistic Concurrency Control)

针对高并发场景（如商品秒杀、多人协作编辑），使用版本号或时间戳实现乐观锁：
```prisma
model Product {
  id            Int      @id @default(autoincrement())
  name          String
  stock         Int
  version       Int      @default(0) // 核心：版本戳字段
  updatedAt     DateTime @updatedAt
}
```

更新时必须同时将 `version` 作为查询条件，并递增版本：
```typescript
const result = await prisma.product.updateMany({
  where: {
    id: productId,
    version: currentVersion, // 仅当版本与读取时完全一致才允许更新
  },
  data: {
    stock: newStock,
    version: { increment: 1 },
  },
});

if (result.count === 0) {
  throw new ConflictException('数据已被其他并发请求修改，请刷新后重试');
}
```
