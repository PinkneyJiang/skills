import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import * as fs from "fs";
import * as path from "path";
import * as mysql from "mysql2/promise";
import { Client as PgClient } from "pg";

/**
 * 工业级只读数据库与 Prisma Schema 静态探测 MCP Server
 */
const server = new Server(
  {
    name: "database-inspector",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

interface ColumnMeta {
  name: string;
  type: string;
  isPrimary: boolean;
  nullable: boolean;
  defaultValue?: string;
  comment?: string;
}

/**
 * 尝试在工程中寻找 schema.prisma 文件
 */
function findPrismaSchemaFile(customPath?: string): string | null {
  if (customPath && fs.existsSync(customPath)) {
    return customPath;
  }
  const searchCandidates = [
    path.resolve(process.cwd(), "prisma/schema.prisma"),
    path.resolve(process.cwd(), "../prisma/schema.prisma"),
    path.resolve(process.cwd(), "../../prisma/schema.prisma"),
    path.resolve(process.cwd(), "src/prisma/schema.prisma"),
  ];
  for (const candidate of searchCandidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return null;
}

/**
 * 解析 Prisma Schema 提取模型列表与字段
 */
function parsePrismaSchema(schemaContent: string): Map<string, ColumnMeta[]> {
  const models = new Map<string, ColumnMeta[]>();
  const modelRegex = /model\s+(\w+)\s+\{([^}]+)\}/g;
  let match;

  while ((match = modelRegex.exec(schemaContent)) !== null) {
    const modelName = match[1];
    const body = match[2];
    const columns: ColumnMeta[] = [];

    const lines = body.split("\n");
    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line || line.startsWith("//") || line.startsWith("@@")) continue;

      const parts = line.split(/\s+/);
      if (parts.length >= 2) {
        const fieldName = parts[0];
        let fieldType = parts[1];
        const isOptional = fieldType.endsWith("?");
        if (isOptional) fieldType = fieldType.slice(0, -1);

        const isPrimary = line.includes("@id");
        let defaultValue: string | undefined;
        const defaultMatch = /@default\(([^)]+)\)/.exec(line);
        if (defaultMatch) {
          defaultValue = defaultMatch[1];
        }

        columns.push({
          name: fieldName,
          type: fieldType,
          isPrimary,
          nullable: isOptional,
          defaultValue,
        });
      }
    }
    models.set(modelName, columns);
  }

  return models;
}

// 注册工具列表
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "list_tables",
        description: "获取当前数据库中的所有物理数据表或 Prisma Schema 实体模型列表",
        inputSchema: {
          type: "object",
          properties: {
            schemaPath: { type: "string", description: "可选: Prisma schema.prisma 文件路径" },
            schema: { type: "string", description: "指定 PostgreSQL Schema 名称 (默认 public)" },
          },
        },
      },
      {
        name: "describe_table",
        description: "获取指定数据表或 Prisma 模型的完整列结构（字段名、数据类型、主键约束、可空性与默认值）",
        inputSchema: {
          type: "object",
          properties: {
            tableName: { type: "string", description: "需要探测的数据库表名或 Prisma 模型名" },
            schemaPath: { type: "string", description: "可选: Prisma schema.prisma 文件路径" },
          },
          required: ["tableName"],
        },
      },
      {
        name: "validate_prisma_query",
        description: "基于工程真实 schema.prisma，静态校验待查询字段是否在指定模型中真实存在，防止代码生成出现字段幻觉",
        inputSchema: {
          type: "object",
          properties: {
            modelName: { type: "string", description: "Prisma 模型名称 (如 User, Order)" },
            fields: { type: "array", items: { type: "string" }, description: "待验证的字段名列表" },
            schemaPath: { type: "string", description: "可选: 指定 schema.prisma 路径" },
          },
          required: ["modelName", "fields"],
        },
      },
    ],
  };
});

// 处理工具调用
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const dbUrl = process.env.DATABASE_URL;

  if (name === "list_tables") {
    // 1. 如果有活跃的 DATABASE_URL，执行真实只读 SQL
    if (dbUrl) {
      if (dbUrl.startsWith("mysql://") || dbUrl.startsWith("mariadb://")) {
        try {
          const conn = await mysql.createConnection(dbUrl);
          const [rows] = await conn.query("SHOW TABLES;");
          await conn.end();
          const tables = (rows as any[]).map((r) => Object.values(r)[0] as string);
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    status: "success",
                    source: "MySQL / MariaDB Live Connection",
                    totalTables: tables.length,
                    tables,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        } catch (err: any) {
          // 降级到本地 Prisma Schema
        }
      } else if (dbUrl.startsWith("postgres://") || dbUrl.startsWith("postgresql://")) {
        try {
          const client = new PgClient({ connectionString: dbUrl });
          await client.connect();
          const targetSchema = (args?.schema as string) || "public";
          const res = await client.query(
            "SELECT table_name FROM information_schema.tables WHERE table_schema = $1 ORDER BY table_name;",
            [targetSchema]
          );
          await client.end();
          const tables = res.rows.map((r) => r.table_name as string);
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    status: "success",
                    source: "PostgreSQL Live Connection",
                    schema: targetSchema,
                    totalTables: tables.length,
                    tables,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        } catch (err: any) {
          // 降级
        }
      }
    }

    // 2. 本地 Prisma Schema 解析
    const schemaFile = findPrismaSchemaFile(args?.schemaPath as string);
    if (schemaFile) {
      const content = fs.readFileSync(schemaFile, "utf-8");
      const models = parsePrismaSchema(content);
      const modelNames = Array.from(models.keys());
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                status: "success",
                source: `Local Prisma Schema: ${schemaFile}`,
                totalModels: modelNames.length,
                models: modelNames,
              },
              null,
              2
            ),
          },
        ],
      };
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              status: "warning",
              message: "未检测到活跃的 DATABASE_URL 且未发现本地 schema.prisma 文件",
              suggestion: "请配置环境变量 DATABASE_URL 或将 schema.prisma 置于工程目录中",
            },
            null,
            2
          ),
        },
      ],
    };
  }

  if (name === "describe_table") {
    const tableName = args?.tableName as string;

    // 1. 如果有 DATABASE_URL，优先查数据库真实结构
    if (dbUrl && (dbUrl.startsWith("mysql://") || dbUrl.startsWith("mariadb://"))) {
      try {
        const conn = await mysql.createConnection(dbUrl);
        const [rows] = await conn.query(`SHOW FULL COLUMNS FROM \`${tableName}\`;`);
        await conn.end();
        const columns: ColumnMeta[] = (rows as any[]).map((r) => ({
          name: r.Field,
          type: r.Type,
          isPrimary: r.Key === "PRI",
          nullable: r.Null === "YES",
          defaultValue: r.Default,
          comment: r.Comment || undefined,
        }));
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  status: "success",
                  source: "MySQL Live DB",
                  table: tableName,
                  totalColumns: columns.length,
                  columns,
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (err: any) {
        // 降级
      }
    }

    // 2. Prisma Schema 静态解析
    const schemaFile = findPrismaSchemaFile(args?.schemaPath as string);
    if (schemaFile) {
      const content = fs.readFileSync(schemaFile, "utf-8");
      const models = parsePrismaSchema(content);
      const matched = models.get(tableName);
      if (matched) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  status: "success",
                  source: `Local Prisma Schema (${schemaFile})`,
                  model: tableName,
                  totalFields: matched.length,
                  columns: matched,
                },
                null,
                2
              ),
            },
          ],
        };
      }
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              status: "error",
              message: `未找到表/模型 '${tableName}' 的元数据定义`,
            },
            null,
            2
          ),
        },
      ],
      isError: true,
    };
  }

  if (name === "validate_prisma_query") {
    const modelName = args?.modelName as string;
    const requestedFields = (args?.fields as string[]) || [];

    const schemaFile = findPrismaSchemaFile(args?.schemaPath as string);
    if (!schemaFile) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                status: "error",
                message: "未找到 schema.prisma 文件，无法执行静态字段校验",
              },
              null,
              2
            ),
          },
        ],
        isError: true,
      };
    }

    const content = fs.readFileSync(schemaFile, "utf-8");
    const models = parsePrismaSchema(content);
    const modelColumns = models.get(modelName);

    if (!modelColumns) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                status: "error",
                message: `Prisma 模型 '${modelName}' 在 ${schemaFile} 中不存在`,
                availableModels: Array.from(models.keys()),
              },
              null,
              2
            ),
          },
        ],
        isError: true,
      };
    }

    const existingFieldSet = new Set(modelColumns.map((c) => c.name));
    const validFields: string[] = [];
    const invalidFields: string[] = [];

    for (const f of requestedFields) {
      if (existingFieldSet.has(f)) {
        validFields.push(f);
      } else {
        invalidFields.push(f);
      }
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              status: invalidFields.length === 0 ? "success" : "warning",
              modelName,
              passed: invalidFields.length === 0,
              validFields,
              invalidFields,
              message:
                invalidFields.length === 0
                  ? "所有待查询字段校验通过，符合 Prisma 模型定义"
                  : `检测到 ${invalidFields.length} 个字段在模型中不存在，请核实拼写`,
            },
            null,
            2
          ),
        },
      ],
    };
  }

  throw new Error(`未实现的工具: ${name}`);
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Database Inspector MCP server running on stdio");
}

main().catch(console.error);
