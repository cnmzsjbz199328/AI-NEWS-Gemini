# AITV - AI News Commentary Platform

基于 Next.js 14 的全栈 AI 新闻评论平台，采用现代化分层架构设计。

## 🏗️ 项目架构

### 前后端分离设计
```
src/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # 根布局
│   ├── page.tsx           # 主页面
│   ├── globals.css        # 全局样式
│   └── api/               # API 路由 (后端)
│       ├── news/          # 新闻获取 API
│       ├── ai/generate/   # AI 文本生成 API
│       └── speech/generate/ # 语音生成 API
├── components/            # React 组件
├── services/             # 业务服务层
├── utils/                # 工具函数层
├── types/                # TypeScript 类型定义
└── config/               # 配置文件
```

### 安全架构特点
- ✅ **API 密钥安全**: 所有 AI API 密钥仅在服务器端存储，不暴露给前端
- ✅ **分层设计**: 清晰的业务层、服务层、工具层分离
- ✅ **类型安全**: 完整的 TypeScript 类型定义
- ✅ **模块化**: 高内聚低耦合的组件设计

## 🚀 快速开始

### 1. 安装依赖
```bash
# 替换现有 package.json
cp package-nextjs.json package.json
cp tsconfig-nextjs.json tsconfig.json

# 安装依赖
npm install
```

### 2. 环境配置
```bash
# 复制环境变量模板
cp .env.example .env.local

# 编辑 .env.local 添加你的 API 密钥
GEMINI_API_KEY=your_gemini_api_key_here
MISTRAL_API_KEY=your_mistral_api_key_here
REKA_API_KEY=your_reka_api_key_here
```

### 3. 启动开发服务器
```bash
npm run dev
```

访问 http://localhost:3000

## 📡 API 路由说明

### GET /api/news
获取 BBC 新闻数据
- 返回: `NewsItem[]`
- 无需认证

### POST /api/ai/generate
生成 AI 文本回应
- 请求体: `{ speaker: string, prompt: string, conversation?: ConversationEntry[] }`
- 返回: `{ text: string }`
- 服务器端使用 GEMINI_API_KEY

### POST /api/speech/generate
生成语音音频
- 请求体: `{ text: string, speaker: string }`
- 返回: 音频流 (audio/mpeg)
- 服务器端使用 GEMINI_API_KEY

## 🔧 技术栈

- **前端**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **后端**: Next.js API Routes, Node.js
- **AI 服务**: Google Gemini API
- **部署**: Vercel (一键部署)
- **数据获取**: BBC RSS Feed

## 📦 部署到 Vercel

### 1. 连接 GitHub
1. 将代码推送到 GitHub 仓库
2. 在 Vercel 控制台连接该仓库

### 2. 配置环境变量
在 Vercel 项目设置中添加:
- `GEMINI_API_KEY`
- `MISTRAL_API_KEY` 
- `REKA_API_KEY`

### 3. 自动部署
推送代码到 main 分支即可自动部署

## 🔒 安全特性

### API 密钥保护
- 密钥仅存储在服务器环境变量中
- 前端通过 API 路由间接调用 AI 服务
- 支持 Vercel 环境变量加密存储

### 类型安全
- 完整的 TypeScript 接口定义
- API 请求/响应类型检查
- 编译时错误检测

## 📁 与原版对比

| 特性 | 原版 (Vite) | 新版 (Next.js) |
|------|-------------|----------------|
| 架构 | 前端单体应用 | 全栈分层架构 |
| API 密钥 | 前端暴露 | 后端安全存储 |
| 部署 | 需要额外后端 | 一键全栈部署 |
| 类型安全 | 部分 | 完整覆盖 |
| 扩展性 | 有限 | 高度可扩展 |

## 🎯 核心功能

- 🤖 **AI 三人辩论**: 主持人 + Tom + Mark 的动态讨论
- 🗞️ **实时新闻**: BBC RSS 自动获取最新新闻
- 🔊 **语音合成**: Gemini 多模态生成语音播放
- 💬 **对话历史**: 完整的辩论记录与回放
- 🎨 **响应式UI**: 现代化的用户界面设计

## 🔄 迁移指南

从原 Vite 版本迁移:
1. 备份 `.env` 文件中的 API 密钥
2. 替换 package.json 和 tsconfig.json
3. 将 API 密钥添加到 `.env.local`
4. 删除原有 `index.html`, `index.tsx` 等文件
5. 运行新的 Next.js 应用

现在你的 AI 新闻评论平台具备了生产级的安全性和可扩展性！
