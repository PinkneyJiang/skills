#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const HUB_DIR = path.resolve(__dirname, '..');
const REGISTRY_PATH = path.join(HUB_DIR, 'registry.json');

function loadRegistry() {
  if (!fs.existsSync(REGISTRY_PATH)) {
    console.error('❌ Registry not found at:', REGISTRY_PATH);
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf8'));
}

function copyRecursiveSync(src, dest) {
  if (!fs.existsSync(src)) return;
  const stats = fs.statSync(src);
  if (stats.isDirectory()) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    fs.readdirSync(src).forEach((child) => copyRecursiveSync(path.join(src, child), path.join(dest, child)));
  } else {
    fs.copyFileSync(src, dest);
  }
}

function listAll() {
  const reg = loadRegistry();
  console.log('\n🚀 Pinkney Agent Hub 全量资产一览 (v' + reg.version + '):');
  console.log('═'.repeat(72));

  console.log('\n【1. 🧠 SKILLS 技能库】');
  for (const cat of ['core', 'client', 'server']) {
    const items = Object.keys(reg.pillars.skills[cat]);
    console.log('  📂 [' + cat.toUpperCase() + '] (' + items.length + ' 个):');
    items.forEach(name => {
      console.log('    • @' + cat + '/' + name + ' : ' + reg.pillars.skills[cat][name].description.slice(0, 48));
    });
  }

  console.log('\n【2. 🔌 MCP 协议库】');
  for (const cat of ['core', 'client', 'server']) {
    const items = Object.keys(reg.pillars.mcp[cat]);
    if (items.length > 0) {
      console.log('  📂 [' + cat.toUpperCase() + '] (' + items.length + ' 个): ' + items.join(', '));
    }
  }

  console.log('\n【3. 📜 SPECS 规范库】');
  for (const cat of ['core', 'client', 'server']) {
    const items = Object.keys(reg.pillars.specs[cat]);
    if (items.length > 0) {
      console.log('  📂 [' + cat.toUpperCase() + '] (' + items.length + ' 个): ' + items.join(', '));
    }
  }
  console.log('\n' + '═'.repeat(72));
}

function syncProject(targetProjectDir) {
  const projectDir = path.resolve(targetProjectDir || process.cwd());
  const agentsMdPath = path.join(projectDir, 'AGENTS.md');
  const targetSkillsDir = path.join(projectDir, '.agents', 'skills');

  console.log('\n🔍 正在根据 AGENTS.md 校验并同步中台资产: ' + projectDir);
  if (!fs.existsSync(agentsMdPath)) {
    console.error('⚠️ 未在当前项目找到 AGENTS.md');
    return;
  }

  const content = fs.readFileSync(agentsMdPath, 'utf8');
  const reg = loadRegistry();

  const matches = [...content.matchAll(/@([a-zA-Z0-9_-]+)\/([a-zA-Z0-9_-]+)/g)];
  const requiredSkills = new Map();
  matches.forEach(m => {
    let cat = m[1].toLowerCase();
    if (cat === 'common') cat = 'core';
    if (cat === 'frontend') cat = 'client';
    if (cat === 'backend') cat = 'server';
    requiredSkills.set(cat + '/' + m[2], { cat, name: m[2], full: '@' + cat + '/' + m[2] });
  });

  if (requiredSkills.size === 0) {
    console.log('ℹ️ 自动扫描全局技能...');
    for (const cat of ['core', 'client', 'server']) {
      for (const name of Object.keys(reg.pillars.skills[cat])) {
        if (content.includes('`' + name + '`') || content.includes('**' + name + '**')) {
          requiredSkills.set(cat + '/' + name, { cat, name, full: '@' + cat + '/' + name });
        }
      }
    }
  }

  if (!fs.existsSync(targetSkillsDir)) {
    fs.mkdirSync(targetSkillsDir, { recursive: true });
  }

  let installedCount = 0;
  for (const req of requiredSkills.values()) {
    const srcDir = path.join(HUB_DIR, 'skills', req.cat, req.name);
    const destDir = path.join(targetSkillsDir, req.name);

    if (fs.existsSync(srcDir)) {
      copyRecursiveSync(srcDir, destDir);
      console.log('  ✅ [已挂载] ' + req.full + ' -> .agents/skills/' + req.name);
      installedCount++;
    }
  }

  console.log('\n🎉 同步完成！已成功就绪 ' + installedCount + ' 个中台核心技能！\n');
}

const args = process.argv.slice(2);
const cmd = args[0] || 'sync';

if (cmd === 'list' || cmd === '--list' || cmd === '-l') {
  listAll();
} else if (cmd === 'sync') {
  syncProject(args[1]);
} else {
  syncProject(args[0]);
}
