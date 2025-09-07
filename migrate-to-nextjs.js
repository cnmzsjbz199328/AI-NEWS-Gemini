#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

console.log('🚀 开始迁移到 Next.js 架构...\n');

const steps = [
  {
    name: '备份现有配置',
    action: () => {
      if (fs.existsSync('package.json')) {
        fs.copyFileSync('package.json', 'package-vite-backup.json');
        console.log('✅ 已备份 package.json → package-vite-backup.json');
      }
      if (fs.existsSync('tsconfig.json')) {
        fs.copyFileSync('tsconfig.json', 'tsconfig-vite-backup.json');
        console.log('✅ 已备份 tsconfig.json → tsconfig-vite-backup.json');
      }
    }
  },
  {
    name: '应用 Next.js 配置',
    action: () => {
      fs.copyFileSync('package-nextjs.json', 'package.json');
      fs.copyFileSync('tsconfig-nextjs.json', 'tsconfig.json');
      console.log('✅ 已应用 Next.js package.json 和 tsconfig.json');
    }
  },
  {
    name: '复制环境变量模板',
    action: () => {
      if (!fs.existsSync('.env.local')) {
        fs.copyFileSync('.env.example', '.env.local');
        console.log('✅ 已创建 .env.local 模板');
      } else {
        console.log('⚠️  .env.local 已存在，请手动检查环境变量');
      }
    }
  },
  {
    name: '创建 .gitignore',
    action: () => {
      const gitignoreContent = `# Dependencies
node_modules/
.pnp
.pnp.js

# Production
/build
/.next/
/out/

# Environment variables
.env*.local
.env

# Debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# IDE
.vscode/
.idea/

# OS
.DS_Store
*.tsbuildinfo

# Vercel
.vercel

# Backup files
*-backup.*
`;
      
      fs.writeFileSync('.gitignore', gitignoreContent);
      console.log('✅ 已创建 .gitignore');
    }
  }
];

// 执行迁移步骤
steps.forEach((step, index) => {
  try {
    console.log(`${index + 1}. ${step.name}`);
    step.action();
    console.log('');
  } catch (error) {
    console.error(`❌ 错误: ${error.message}\n`);
  }
});

console.log('🎉 迁移完成！\n');
console.log('📋 后续步骤:');
console.log('1. 编辑 .env.local 添加你的 API 密钥');
console.log('2. 运行 "npm install" 安装依赖');
console.log('3. 运行 "npm run dev" 启动开发服务器');
console.log('4. 访问 http://localhost:3000\n');

console.log('🔧 环境变量需要配置:');
console.log('- GEMINI_API_KEY');
console.log('- MISTRAL_API_KEY');
console.log('- REKA_API_KEY\n');

console.log('🚀 部署到 Vercel:');
console.log('- 将代码推送到 GitHub');
console.log('- 在 Vercel 控制台连接仓库');
console.log('- 在项目设置中添加环境变量');
console.log('- 自动部署完成！');
