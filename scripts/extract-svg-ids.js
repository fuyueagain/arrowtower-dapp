#!/usr/bin/env node

/**
 * SVG ID 提取工具
 * 
 * 用法：
 *   node scripts/extract-svg-ids.js public/map.svg
 * 
 * 功能：
 *   - 从 SVG 文件中提取所有带 ID 的元素
 *   - 显示元素类型和 ID
 *   - 帮助配置路线数据
 */

const fs = require('fs');
const path = require('path');

// 获取命令行参数
const args = process.argv.slice(2);

if (args.length === 0) {
  console.log('❌ 请提供 SVG 文件路径');
  console.log('');
  console.log('用法:');
  console.log('  node scripts/extract-svg-ids.js public/map.svg');
  console.log('');
  process.exit(1);
}

const svgPath = args[0];

// 检查文件是否存在
if (!fs.existsSync(svgPath)) {
  console.log(`❌ 文件不存在: ${svgPath}`);
  process.exit(1);
}

// 读取 SVG 文件
const svgContent = fs.readFileSync(svgPath, 'utf-8');

// 使用正则表达式提取所有带 ID 的元素
const idPattern = /<(\w+)[^>]*\sid="([^"]+)"[^>]*>/g;
const elements = [];

let match;
while ((match = idPattern.exec(svgContent)) !== null) {
  elements.push({
    type: match[1],
    id: match[2],
  });
}

// 显示结果
console.log('');
console.log('🎨 SVG 元素 ID 列表');
console.log('='.repeat(50));
console.log('');

if (elements.length === 0) {
  console.log('⚠️  未找到任何带 ID 的元素');
  console.log('');
  console.log('提示：');
  console.log('  1. 在 Inkscape 中选中元素');
  console.log('  2. 按 Shift+Ctrl+O 打开对象属性');
  console.log('  3. 设置元素的 ID');
  console.log('');
} else {
  console.log(`找到 ${elements.length} 个元素:\n`);
  
  // 按类型分组
  const grouped = {};
  elements.forEach(el => {
    if (!grouped[el.type]) {
      grouped[el.type] = [];
    }
    grouped[el.type].push(el.id);
  });

  // 显示分组结果
  Object.keys(grouped).forEach(type => {
    console.log(`📌 ${type.toUpperCase()} 元素 (${grouped[type].length}个):`);
    grouped[type].forEach(id => {
      console.log(`   - ${id}`);
    });
    console.log('');
  });

  // 生成配置模板
  console.log('='.repeat(50));
  console.log('');
  console.log('📝 配置模板 (复制到你的代码中):');
  console.log('');
  console.log('```typescript');
  console.log('const routes: MapRoute[] = [');
  console.log('  {');
  console.log('    id: \'route1\',');
  console.log('    name: \'路线名称\',');
  console.log('    baseColor: \'#3b82f6\',');
  console.log('    hoverColor: \'#60a5fa\',');
  console.log('    completedGradient: {');
  console.log('      from: \'#60a5fa\',');
  console.log('      to: \'#3b82f6\',');
  console.log('    },');
  console.log('    points: [');
  
  // 为前几个元素生成示例
  const sampleIds = elements.slice(0, 3);
  sampleIds.forEach((el, idx) => {
    console.log('      {');
    console.log(`        id: 'r1-p${idx + 1}',`);
    console.log(`        name: '点位${idx + 1}',`);
    console.log(`        description: '点位描述',`);
    console.log(`        svgElementId: '${el.id}',  // ${el.type} 元素`);
    console.log(`        routeId: 'route1',`);
    console.log(`        order: ${idx + 1},`);
    console.log(`        status: 'available',`);
    console.log('      },');
  });
  
  console.log('      // 添加更多点位...');
  console.log('    ],');
  console.log('  },');
  console.log('];');
  console.log('```');
  console.log('');
}

console.log('='.repeat(50));
console.log('');
console.log('💡 提示：');
console.log('  - 使用有意义的 ID 名称（如 temple, garden, tower）');
console.log('  - 避免使用自动生成的 ID（如 path1234）');
console.log('  - 可以在 Inkscape 中批量重命名元素 ID');
console.log('');

