---
name: clean-architecture-module
description: 规范化构建符合整洁架构与分层解耦原则的后端业务模块 (Controller -> Service -> Repository -> DTO/VO)。杜绝胖 Controller、循环依赖与贫血持久化混杂。
---

# 整洁架构后端微服务模块规范 (clean-architecture-module)

本技能旨在为现代后端工程（NestJS / Spring Boot / ASP.NET Core 等）建立统一的**整洁架构分层规范**。
核心目标是确保系统在经历长期高速业务迭代、团队规模膨胀时，依然保持**极高的可维护性、单向清晰的依赖流向与 100% 隔离的单元测试接缝**。

---

## 四层核心架构模型与单向依赖铁律

```text
[ 外部 HTTP / RPC / 消息队列请求 ]
                 │
                 ▼
┌────────────────────────────────────────────────────────┐
│ 1. 接入控制器层 (Controller / Handler)                  │
│    - 绑定路由路径与 HTTP Method (GET/POST/PUT/DELETE)  │
│    - 挂载输入 DTO 并触发运行时管道参数强校验            │
│    - 鉴权守卫 (Guards) 与权限拦截                      │
│    - 严禁编写任何业务逻辑与数据库 SQL                   │
└────────────────────────┬───────────────────────────────┘
                         │ 强类型 DTO
                         ▼
┌────────────────────────────────────────────────────────┐
│ 2. 领域服务层 (Domain Service / Business Layer)         │
│    - 业务逻辑与状态机跃迁的唯一核心枢纽                 │
│    - 编排跨实体协同与复杂规则计算                      │
│    - 划定数据库交互事务的生命周期边界                   │
│    - 独立于具体 HTTP 传输层 (可被定时任务/MQ无缝复用)   │
└────────────────────────┬───────────────────────────────┘
                         │ 领域实体 / 强类型查询条件
                         ▼
┌────────────────────────────────────────────────────────┐
│ 3. 数据访问与仓储层 (Repository / Data Access Layer)    │
│    - 封装数据库 ORM (Prisma / TypeORM / EF Core) 读写  │
│    - 封装 Redis 缓存穿透与分布式锁读写                 │
│    - 严格使用强类型条件，禁止裸拼字符串 SQL            │
└────────────────────────────────────────────────────────┘
```

> 🛑 **单向依赖红线 (Dependency Inversion Rule)**：
> 依赖关系必须**自顶向下单向流动**（Controller → Service → Repository）。
> 绝对严禁底层反向依赖上层，严禁任何形式的跨层循环引用。

---

## 标准 NestJS 模块代码骨架参考

### 1. 控制器层 (orders.controller.ts) - 保持极简与纯粹
```typescript
import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderDetailVo } from './vo/order-detail.vo';

@ApiTags('订单结算模块')
@Controller('api/v1/orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '创建并锁定结算订单' })
  @ApiResponse({ status: 201, type: OrderDetailVo })
  public async createOrder(@Body() dto: CreateOrderDto): Promise<OrderDetailVo> {
    // Controller 仅负责参数透传与响应包装，0 业务逻辑
    return this.ordersService.createAndLockOrder(dto);
  }
}
```

### 2. 领域服务层 (orders.service.ts) - 掌控业务主权与事务边界
```typescript
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderDetailVo } from './vo/order-detail.vo';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  public async createAndLockOrder(dto: CreateOrderDto): Promise<OrderDetailVo> {
    // 1. 前置业务不变量校验
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
    });

    if (!product) {
      throw new NotFoundException(`商品不存在: ID ${dto.productId}`);
    }

    if (product.stockQuantity < dto.quantity) {
      throw new BadRequestException('商品当前库存不足，下单已终止');
    }

    // 2. 划定原子事务边界
    return this.prisma.$transaction(async (tx) => {
      // 扣减库存
      await tx.product.update({
        where: { id: product.id },
        data: { stockQuantity: { decrement: dto.quantity } },
      });

      // 生成订单主记录
      const order = await tx.order.create({
        data: {
          orderNo: this.generateOrderNo(),
          userId: dto.userId,
          productId: dto.productId,
          quantity: dto.quantity,
          totalAmount: product.unitPrice * dto.quantity,
          status: 'PENDING_PAYMENT',
        },
      });

      return OrderDetailVo.fromEntity(order);
    });
  }

  private generateOrderNo(): string {
    return `ORD_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  }
}
```

### 3. 模块装配中心 (orders.module.ts)
```typescript
import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { PrismaModule } from '@/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService], // 若需要被其他模块协同，显式导出 Service
})
export class OrdersModule {}
```

---

## 核心质量检验门禁

- [ ] Controller 中没有任何 `this.prisma` 或原生 SQL 调用；
- [ ] 所有业务判断（库存充足性、状态机跃迁许可、权限有效性）全部封装在 Service 层；
- [ ] 入参使用独立的 `CreateXxxDto`，绝不直接将数据库 ORM 实体暴露给前端；
- [ ] 出参使用清晰的 `XxxVo` 进行字段精简与脱敏；
- [ ] Service 的公共方法能轻易编写单测，通过 Mock 数据仓储实现 100% 业务隔离测试。
