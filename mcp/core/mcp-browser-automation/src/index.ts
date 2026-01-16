import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import * as fs from "fs";
import * as path from "path";
import puppeteer, { Browser, Page } from "puppeteer-core";

/**
 * 本地无头浏览器自动化 MCP Server (基于 Puppeteer-Core & 本地 Chrome/Edge)
 */
const server = new Server(
  {
    name: "browser-automation",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

let browserInstance: Browser | null = null;
let activePage: Page | null = null;
const consoleLogs: string[] = [];

/**
 * 自动探测本地可用的 Chromium 核心可执行路径 (Chrome 或 Edge)
 */
function getLocalBrowserExecutable(): string {
  const candidates = [
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    process.env.CHROME_PATH || "",
  ];

  for (const candidate of candidates) {
    if (candidate && fs.existsSync(candidate)) {
      return candidate;
    }
  }
  throw new Error("未找到本地可用的 Google Chrome 或 Microsoft Edge 浏览器，请配置 CHROME_PATH 环境变量");
}

/**
 * 获取或创建浏览器与页面实例
 */
async function getPage(): Promise<Page> {
  if (!browserInstance) {
    const executablePath = getLocalBrowserExecutable();
    browserInstance = await puppeteer.launch({
      executablePath,
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
      ],
      defaultViewport: { width: 1440, height: 900 },
    });
  }

  if (!activePage || activePage.isClosed()) {
    const pages = await browserInstance.pages();
    activePage = pages.length > 0 ? pages[0] : await browserInstance.newPage();

    // 捕获控制台日志
    activePage.on("console", (msg) => {
      consoleLogs.push(`[${msg.type()}] ${msg.text()}`);
      if (consoleLogs.length > 200) {
        consoleLogs.shift();
      }
    });
  }

  return activePage;
}

// 注册工具列表
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "browser_navigate",
        description: "控制无头浏览器导航至指定 URL 并等待网络空闲 (networkidle0)",
        inputSchema: {
          type: "object",
          properties: {
            url: { type: "string", description: "待访问的 HTTP / HTTPS 网页地址" },
          },
          required: ["url"],
        },
      },
      {
        name: "browser_screenshot",
        description: "对当前浏览器页面截取高质量快照 (支持全屏滚动截长图或指定保存路径)",
        inputSchema: {
          type: "object",
          properties: {
            savePath: { type: "string", description: "可选: 截图保存的绝对路径 (如 D:/test.png)" },
            fullPage: { type: "boolean", default: false, description: "是否截取整页滚动长图" },
          },
        },
      },
      {
        name: "browser_click",
        description: "在当前网页中查找并点击指定 CSS 选择器的元素",
        inputSchema: {
          type: "object",
          properties: {
            selector: { type: "string", description: "元素的 CSS 选择器 (例如 button.submit-btn)" },
          },
          required: ["selector"],
        },
      },
      {
        name: "browser_type",
        description: "在指定 CSS 选择器的输入框中模拟键盘输入文本",
        inputSchema: {
          type: "object",
          properties: {
            selector: { type: "string", description: "目标输入框的选择器" },
            text: { type: "string", description: "待输入的文字内容" },
          },
          required: ["selector", "text"],
        },
      },
      {
        name: "browser_get_dom",
        description: "获取当前页面的完整渲染后 HTML DOM 树",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "browser_console_logs",
        description: "获取浏览器页面运行时产生的控制台 Console 日志 (用于诊断前端运行时报错与警告)",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "browser_evaluate",
        description: "在当前网页上下文执行自定义 JavaScript 脚本并返回计算结果",
        inputSchema: {
          type: "object",
          properties: {
            script: { type: "string", description: "待执行的 JavaScript 表达式或函数字符串" },
          },
          required: ["script"],
        },
      },
    ],
  };
});

// 处理工具执行
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    const page = await getPage();

    if (name === "browser_navigate") {
      const url = args?.url as string;
      await page.goto(url, { waitUntil: "networkidle0", timeout: 30000 });
      const title = await page.title();
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                status: "success",
                url,
                pageTitle: title,
                message: "页面导航成功并已完成初次渲染",
              },
              null,
              2
            ),
          },
        ],
      };
    }

    if (name === "browser_screenshot") {
      const fullPage = Boolean(args?.fullPage);
      const savePath = args?.savePath as string | undefined;

      if (savePath) {
        await page.screenshot({ path: savePath, fullPage });
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  status: "success",
                  savedTo: savePath,
                  fullPage,
                },
                null,
                2
              ),
            },
          ],
        };
      } else {
        const buffer = await page.screenshot({ fullPage, encoding: "base64" });
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  status: "success",
                  fullPage,
                  base64Length: (buffer as string).length,
                  message: "截图已成功生成为 Base64 图像数据",
                },
                null,
                2
              ),
            },
          ],
        };
      }
    }

    if (name === "browser_click") {
      const selector = args?.selector as string;
      await page.waitForSelector(selector, { timeout: 5000 });
      await page.click(selector);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                status: "success",
                action: "click",
                selector,
              },
              null,
              2
            ),
          },
        ],
      };
    }

    if (name === "browser_type") {
      const selector = args?.selector as string;
      const text = args?.text as string;
      await page.waitForSelector(selector, { timeout: 5000 });
      await page.type(selector, text);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                status: "success",
                action: "type",
                selector,
                textLength: text.length,
              },
              null,
              2
            ),
          },
        ],
      };
    }

    if (name === "browser_get_dom") {
      const html = await page.content();
      return {
        content: [
          {
            type: "text",
            text: html.slice(0, 100000), // 防止超长字符溢出
          },
        ],
      };
    }

    if (name === "browser_console_logs") {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                status: "success",
                totalLogs: consoleLogs.length,
                logs: consoleLogs,
              },
              null,
              2
            ),
          },
        ],
      };
    }

    if (name === "browser_evaluate") {
      const script = args?.script as string;
      const evalResult = await page.evaluate(script);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                status: "success",
                result: evalResult,
              },
              null,
              2
            ),
          },
        ],
      };
    }

    throw new Error(`未实现的工具: ${name}`);
  } catch (err: any) {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              status: "error",
              tool: name,
              message: err.message,
            },
            null,
            2
          ),
        },
      ],
      isError: true,
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Browser Automation MCP server running on stdio");
}

main().catch(console.error);
