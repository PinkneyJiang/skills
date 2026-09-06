#!/usr/bin/env node
/**
 * ═════════════════════════════════════════════════════════════════════════════
 * 🛠️ Antigravity 历史记录管道自愈与超大会话自动归档工具
 * ═════════════════════════════════════════════════════════════════════════════
 * 解决痛点：
 * 某些长对话单文件突破 30MB 后，Antigravity 后端语言服务在序列化 trajectorySummaries
 * 时会触发 Token/内存超限中断，进而卡死整个历史记录同步队列，导致后续所有新会话
 * 无法在“Search all convos...”弹窗中显示。
 *
 * 核心逻辑：
 * 1. 扫描 conversations 目录；
 * 2. 将超过阈值（默认 30MB）的阻塞性会话安全移入 archive/ 目录（数据 100% 保留）；
 * 3. 统计并输出当前健康会话列表。
 */

const fs = require('fs');
const path = require('path');

const CONV_DIR = 'C:\\Users\\Pinkney Jiang\\.gemini\\antigravity-ide\\conversations';
const ARCHIVE_DIR = path.join(CONV_DIR, 'archive');
const THRESHOLD_MB = 30;

if (!fs.existsSync(CONV_DIR)) {
  console.error(`[Error] 找不到会话目录: ${CONV_DIR}`);
  process.exit(1);
}

if (!fs.existsSync(ARCHIVE_DIR)) {
  fs.mkdirSync(ARCHIVE_DIR, { recursive: true });
}

const files = fs.readdirSync(CONV_DIR).filter(f => f.endsWith('.db'));
console.log(`[HealHistory] 正在扫描会话目录: ${CONV_DIR}`);
console.log(`[HealHistory] 当前根目录会话总数: ${files.length} 个\n`);

let archivedCount = 0;
const healthyList = [];

files.forEach(file => {
  const fullPath = path.join(CONV_DIR, file);
  try {
    const stat = fs.statSync(fullPath);
    const sizeMB = stat.size / 1024 / 1024;
    
    if (sizeMB > THRESHOLD_MB) {
      const destPath = path.join(ARCHIVE_DIR, file);
      fs.renameSync(fullPath, destPath);
      console.log(`⚠️  [归档超大会话] ${file} (${sizeMB.toFixed(2)} MB) -> archive/`);
      archivedCount++;
    } else {
      healthyList.push({ file, sizeMB, mtime: stat.mtime });
    }
  } catch (err) {
    console.warn(`[Warn] 读取文件异常: ${file}`, err.message);
  }
});

healthyList.sort((a, b) => b.mtime - a.mtime);

console.log(`\n✅ [自愈完成] 归档超标会话: ${archivedCount} 个 | 保留活跃会话: ${healthyList.length} 个`);
console.log('\n--- 🌟 最近 10 个健康活跃会话 ---');
healthyList.slice(0, 10).forEach((item, idx) => {
  console.log(`  [${idx + 1}] ${item.file} (${item.sizeMB.toFixed(2)} MB) - ${item.mtime.toLocaleString()}`);
});

console.log('\n💡 提示：若需彻底重载 IDE 视图缓存，可在 IDE 中按 Ctrl+Shift+P 执行 "Reload Window" 或重启 IDE。');
