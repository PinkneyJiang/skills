"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const index_js_1 = require("@modelcontextprotocol/sdk/server/index.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const types_js_1 = require("@modelcontextprotocol/sdk/types.js");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const ts = __importStar(require("typescript"));
/**
 * 工业级前端组件树与 TypeScript AST 契约探测 MCP Server
 */
const server = new index_js_1.Server({
    name: "component-inspector",
    version: "1.0.0",
}, {
    capabilities: {
        tools: {},
    },
});
/**
 * 递归扫描目录提取组件
 */
function scanDirForComponents(dir, baseDir) {
    const results = [];
    if (!fs.existsSync(dir))
        return results;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            if (entry.name !== "node_modules" && entry.name !== ".git" && entry.name !== "dist") {
                results.push(...scanDirForComponents(fullPath, baseDir));
            }
        }
        else if (entry.isFile() && (entry.name.endsWith(".tsx") || entry.name.endsWith(".jsx"))) {
            try {
                const fileContent = fs.readFileSync(fullPath, "utf-8");
                const sourceFile = ts.createSourceFile(fullPath, fileContent, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
                let detectedName = path.basename(entry.name, path.extname(entry.name));
                if (detectedName === "index") {
                    detectedName = path.basename(path.dirname(fullPath));
                }
                let exportType = "named";
                let hasPropsInterface = false;
                let propsInterfaceName;
                ts.forEachChild(sourceFile, (node) => {
                    if (ts.isInterfaceDeclaration(node) || ts.isTypeAliasDeclaration(node)) {
                        const name = node.name.text;
                        if (name.endsWith("Props") || name.endsWith("Prop")) {
                            hasPropsInterface = true;
                            propsInterfaceName = name;
                        }
                    }
                    if (ts.isExportAssignment(node)) {
                        exportType = "default";
                    }
                });
                results.push({
                    name: detectedName,
                    filePath: path.relative(baseDir, fullPath).replace(/\\/g, "/"),
                    exportType,
                    hasPropsInterface,
                    propsInterfaceName,
                });
            }
            catch (err) {
                // 容错单个文件解析失败
            }
        }
    }
    return results;
}
/**
 * 深度解析组件 Props 声明与 JSDoc 注释
 */
function parseComponentProps(filePath) {
    if (!fs.existsSync(filePath)) {
        throw new Error(`组件文件不存在: ${filePath}`);
    }
    const fileContent = fs.readFileSync(filePath, "utf-8");
    const sourceFile = ts.createSourceFile(filePath, fileContent, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    const componentName = path.basename(filePath, path.extname(filePath));
    const props = [];
    function extractMembers(members) {
        for (const member of members) {
            if (ts.isPropertySignature(member) && member.name) {
                const propName = member.name.getText(sourceFile);
                const propType = member.type ? member.type.getText(sourceFile) : "any";
                const required = !member.questionToken;
                // 提取 JSDoc 注释
                let description = "";
                const jsDoc = member.jsDoc;
                if (jsDoc && jsDoc.length > 0 && jsDoc[0].comment) {
                    description = typeof jsDoc[0].comment === "string" ? jsDoc[0].comment : "";
                }
                props.push({
                    name: propName,
                    type: propType,
                    required,
                    description,
                });
            }
        }
    }
    ts.forEachChild(sourceFile, (node) => {
        if (ts.isInterfaceDeclaration(node)) {
            if (node.name.text.endsWith("Props") || node.name.text.includes(componentName)) {
                extractMembers(node.members);
            }
        }
        else if (ts.isTypeAliasDeclaration(node) && ts.isTypeLiteralNode(node.type)) {
            if (node.name.text.endsWith("Props") || node.name.text.includes(componentName)) {
                extractMembers(node.type.members);
            }
        }
    });
    return {
        component: componentName,
        props,
    };
}
/**
 * 基于 AST 检测 JSX 中的原生非标标签
 */
function validateJsxTokens(jsxSnippet) {
    // 包装为合法 TSX 函数体以构建 AST
    const wrappedCode = `const __Component = () => (<>\n${jsxSnippet}\n</>);`;
    const sourceFile = ts.createSourceFile("temp.tsx", wrappedCode, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    const nativeTagMap = {
        button: "建议复用团队封装组件 (如 <FButton> / <Button> / <FAsyncButton>)",
        input: "建议复用团队输入框组件 (如 <Input> / <FInput> / <FSearchInput>)",
        select: "建议复用团队高阶下拉选择器 (如 <Select> / <FRemoteSelect>)",
        table: "建议复用核心数据表格组件 (如 <FDataView> / <ProTable>)",
        img: "建议复用带防盗链与鉴权的高阶图片组件 (如 <FImage> / <Image>)",
    };
    const issues = [];
    function visit(node) {
        if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
            const tagName = node.tagName.getText(sourceFile);
            if (nativeTagMap[tagName]) {
                const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
                issues.push({
                    tag: tagName,
                    line: Math.max(1, line - 1), // 扣除包装外层的偏移
                    recommendation: nativeTagMap[tagName],
                });
            }
        }
        ts.forEachChild(node, visit);
    }
    visit(sourceFile);
    return {
        passed: issues.length === 0,
        issues,
    };
}
// 注册工具清单
server.setRequestHandler(types_js_1.ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: "scan_components",
                description: "基于 TypeScript AST 递归扫描指定前端项目组件目录，识别所有 React 业务高阶组件及其 Props 契约状态",
                inputSchema: {
                    type: "object",
                    properties: {
                        componentsDir: {
                            type: "string",
                            description: "组件库相对或绝对路径 (例如 ./src/components)",
                        },
                    },
                },
            },
            {
                name: "inspect_component_props",
                description: "基于真实 TypeScript 抽象语法树 (AST) 静态解析组件的 Props 接口定义、属性类型、必填项与 JSDoc 业务注释",
                inputSchema: {
                    type: "object",
                    properties: {
                        componentPath: {
                            type: "string",
                            description: "组件主文件路径 (例如 src/components/Button/index.tsx)",
                        },
                    },
                    required: ["componentPath"],
                },
            },
            {
                name: "validate_component_reuse",
                description: "基于 AST 语法树深度检测 JSX 代码片段是否违规使用了原生 HTML 标签（如 <button>、<input> 等），并给出规范重构建议",
                inputSchema: {
                    type: "object",
                    properties: {
                        jsxSnippet: {
                            type: "string",
                            description: "待检测的 JSX / TSX 代码片段",
                        },
                    },
                    required: ["jsxSnippet"],
                },
            },
        ],
    };
});
// 处理工具执行
server.setRequestHandler(types_js_1.CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    if (name === "scan_components") {
        const dir = args?.componentsDir || "./src/components";
        const resolvedDir = path.resolve(process.cwd(), dir);
        const components = scanDirForComponents(resolvedDir, resolvedDir);
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({
                        status: "success",
                        targetDir: dir,
                        resolvedPath: resolvedDir,
                        totalComponents: components.length,
                        components,
                    }, null, 2),
                },
            ],
        };
    }
    if (name === "inspect_component_props") {
        const compPath = args?.componentPath;
        const resolvedPath = path.resolve(process.cwd(), compPath);
        try {
            const result = parseComponentProps(resolvedPath);
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify({
                            status: "success",
                            filePath: compPath,
                            ...result,
                        }, null, 2),
                    },
                ],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify({
                            status: "error",
                            message: error.message,
                            filePath: compPath,
                        }, null, 2),
                    },
                ],
                isError: true,
            };
        }
    }
    if (name === "validate_component_reuse") {
        const snippet = args?.jsxSnippet;
        const report = validateJsxTokens(snippet);
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({
                        status: "success",
                        ...report,
                    }, null, 2),
                },
            ],
        };
    }
    throw new Error(`未实现的工具: ${name}`);
});
async function main() {
    const transport = new stdio_js_1.StdioServerTransport();
    await server.connect(transport);
    console.error("Component Inspector MCP server running on stdio");
}
main().catch(console.error);
