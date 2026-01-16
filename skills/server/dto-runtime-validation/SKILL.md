---
name: dto-runtime-validation
description: 现代后端强类型运行时入参校验 (Request DTO) 与响应契约 (Response VO) 设计规范。深度整合 class-validator、class-transformer 与 OpenAPI Swagger 文档。
---

# 强类型运行时参数校验与契约设计 (dto-runtime-validation)

在现代全栈与微服务开发中，前端发送的 JSON 数据在进入网络传输后就失去了编译期类型约束。
**仅仅依靠 TypeScript 静态接口 (interface) 无法防御运行时的脏数据、注入攻击或缺少必填字段**。

本技能指导开发者基于 `class-validator` 与 `class-transformer` 建立**绝对安全的运行时参数防御系统**，并自动生成标准的 OpenAPI / Swagger 契约。

---

## 核心架构原则

1. **请求入参必须是 Class 而非 Interface**：TypeScript 编译为 JavaScript 后 Interface 会被彻底抹除，只有 Class 才能携带反射元数据（Metadata）供校验器在运行时提取；
2. **白名单防御与未知字段剔除 (Whitelist Sanitization)**：全局开启 `whitelist: true`，自动剥离恶意注入的多余字段；开启 `forbidNonWhitelisted: true` 拦截非法属性；
3. **入参 DTO 与出参 VO 严格分离**：
   - **DTO (Data Transfer Object)**：负责外部输入约束、格式强转与业务边界拦截；
   - **VO (View Object)**：负责对客户端输出的数据裁剪、敏感脱敏（如隐藏密码、加盐 Hash）与格式归一化。

---

## 生产级 DTO / VO 编码参考示例

### 1. 复杂嵌套请求 DTO (create-user.dto.ts)
```typescript
import {
  IsString,
  IsEmail,
  IsNotEmpty,
  IsInt,
  Min,
  Max,
  IsOptional,
  ValidateNested,
  IsArray,
  Length,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AddressDto {
  @ApiProperty({ description: '所在城市', example: '上海市' })
  @IsString({ message: '城市名称必须是字符串' })
  @IsNotEmpty({ message: '城市名称不能为空' })
  public city!: string;

  @ApiProperty({ description: '详细街道地址', example: '浦东新区张江高科园区' })
  @IsString({ message: '详细地址必须是字符串' })
  @IsNotEmpty({ message: '详细地址不能为空' })
  public street!: string;
}

export class CreateUserDto {
  @ApiProperty({ description: '用户登录名', example: 'pinkney_jiang', minLength: 4, maxLength: 30 })
  @IsString({ message: '用户名必须是字符串' })
  @Length(4, 30, { message: '用户名长度必须在 4 到 30 个字符之间' })
  @IsNotEmpty({ message: '用户名不能为空' })
  public username!: string;

  @ApiProperty({ description: '用户电子邮箱', example: 'pinkney@example.com' })
  @IsEmail({}, { message: '电子邮箱格式不合规' })
  @IsNotEmpty({ message: '电子邮箱不能为空' })
  public email!: string;

  @ApiProperty({ description: '年龄', example: 28, minimum: 18, maximum: 120 })
  @Type(() => Number) // 关键：自动将 query/form 中的字符串转化为数字类型
  @IsInt({ message: '年龄必须是整数' })
  @Min(18, { message: '年龄不得低于 18 周岁' })
  @Max(120, { message: '年龄不得超过 120 周岁' })
  public age!: number;

  @ApiPropertyOptional({ description: '用户的收获地址清单', type: [AddressDto] })
  @IsOptional()
  @IsArray({ message: '地址清单必须是数组' })
  @ValidateNested({ each: true }) // 关键：对数组内每个嵌套对象执行深度校验
  @Type(() => AddressDto)          // 关键：指明嵌套子对象的 Class 类型
  public addresses?: AddressDto[];
}
```

### 2. 标准出参响应 VO (user-profile.vo.ts)
```typescript
import { ApiProperty } from '@nestjs/swagger';

export class UserProfileVo {
  @ApiProperty({ description: '用户唯一主键 ID', example: 10086 })
  public id!: number;

  @ApiProperty({ description: '用户登录名', example: 'pinkney_jiang' })
  public username!: string;

  @ApiProperty({ description: '脱敏后的电子邮箱', example: 'p***@example.com' })
  public maskedEmail!: string;

  @ApiProperty({ description: '账号注册创建时间', example: '2026-09-07T12:00:00.000Z' })
  public createdAt!: string;

  /**
   * 将数据库实体安全映射为出参 VO，严格剔除 passwordHash, salt 等敏感字段
   */
  public static fromEntity(entity: {
    id: number;
    username: string;
    email: string;
    createdAt: Date;
  }): UserProfileVo {
    const vo = new UserProfileVo();
    vo.id = entity.id;
    vo.username = entity.username;
    // 自动对邮箱执行掩码脱敏
    const [name, domain] = entity.email.split('@');
    vo.maskedEmail = `${name.slice(0, 1)}***@${domain}`;
    vo.createdAt = entity.createdAt.toISOString();
    return vo;
  }
}
```

---

## 全局 ValidationPipe 最佳配置实践

在入口模块 (`main.ts`) 中注册全局管道：
```typescript
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,            // 自动过滤 DTO 中未声明的任何多余非法字段
      forbidNonWhitelisted: true, // 若存在未声明属性则直接抛错 400 Bad Request
      transform: true,            // 依据 @Type 自动转换基础类型 (string -> number/boolean)
      transformOptions: {
        enableImplicitConversion: false, // 严禁隐式转换，强制依赖显式 @Type 装饰器
      },
    }),
  );

  await app.listen(3000);
}
bootstrap();
```
