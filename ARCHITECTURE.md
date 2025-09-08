# 项目架构说明

## 📂 文件结构

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # 后端 API 路由
│   │   ├── ai/generate/   # AI 文本生成 API
│   │   ├── news/          # 新闻获取 API  
│   │   └── speech/        # 语音生成 API
│   ├── globals.css        # 全局样式
│   ├── layout.tsx         # 根布局
│   └── page.tsx           # 主页面（前端）
├── components/            # React 组件（前端）
├── config/               # 配置文件（前端可见）
├── lib/                  # 服务器端库文件（后端专用）
│   └── ai-providers.ts   # AI 提供商服务（包含 API 密钥）
├── services/             # 前端服务文件（客户端专用）
│   ├── ai-client.ts      # AI 客户端服务（封装 API 调用）
│   └── news.ts           # 新闻服务
├── types/                # TypeScript 类型定义
└── utils/                # 工具函数
```

## 🔐 前后端职责分离

### 后端（服务器端）
- **位置**: `src/lib/` 和 `src/app/api/`
- **职责**: 
  - 管理 API 密钥和敏感配置
  - 直接调用第三方 AI 服务
  - 处理业务逻辑
- **文件**:
  - `src/lib/ai-providers.ts` - AI 提供商管理
  - `src/app/api/ai/generate/route.ts` - AI 生成 API
  - `src/app/api/speech/generate/route.ts` - 语音生成 API

### 前端（客户端）
- **位置**: `src/app/page.tsx`, `src/components/`, `src/services/`
- **职责**:
  - UI 渲染和用户交互
  - 调用后端 API
  - 状态管理
- **文件**:
  - `src/services/ai-client.ts` - 封装 AI API 调用
  - `src/app/page.tsx` - 主要 UI 组件
  - `src/components/` - 可复用组件

## 🏗️ AI 服务架构

### 后端 AI 提供商（`src/lib/ai-providers.ts`）
```typescript
// 服务器端专用 - 包含 API 密钥
export const createGeminiProvider = (): AIProvider => { ... }  // 主持人
export const createMistralProvider = (): AIProvider => { ... } // Tom
export const createRekaProvider = (): AIProvider => { ... }    // Mark
```

### 前端 AI 客户端（`src/services/ai-client.ts`）
```typescript
// 客户端专用 - 只调用 API
export async function generateAIResponse(speaker: Speaker, prompt: string): Promise<string>
export async function generateSpeech(text: string, speaker: Speaker): Promise<Blob | null>
```

## 🔒 安全考虑

1. **API 密钥隔离**: 所有 API 密钥只存在于服务器端（`src/lib/`）
2. **模型配置隐藏**: 前端不知道使用的具体 AI 模型
3. **职责分离**: 前端只负责 UI，后端处理所有 AI 逻辑

## 🎯 最佳实践遵循

1. **Next.js 13+ App Router**: 使用推荐的文件结构
2. **服务器端库**: `src/lib/` 用于服务器端工具和服务  
3. **API 路由隔离**: 敏感逻辑只在 `src/app/api/` 中
4. **客户端服务**: `src/services/` 只包含前端 API 调用封装

这种架构确保了安全性、可维护性和清晰的职责分离。
