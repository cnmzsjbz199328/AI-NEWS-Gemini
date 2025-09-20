# Direct Migration Plan to Vercel KV

## 1. 核心策略：就地升级 (In-Place Upgrade)

根据最新决议，本次迁移将采用一次性的、直接的升级策略。我们将彻底移除基于内存和 WebSocket 的旧流程，并直接在现有代码基础上进行改造，以适配 Vercel KV 和无服务器架构。

此策略的安全性来源于：
- **精确的范围定义**: 清晰地识别出需要修改、创建和删除的文件。
- **分步实施与测试**: 将整个重构过程分解为多个逻辑步骤，每一步完成后都进行针对性测试。
- **代码的清晰性**: 您判断当前项目结构清晰，耦合度低，适合进行直接重构。

## 2. 数据流变化分析

### 2.1. 旧数据流 (As-Is: In-Memory & WebSocket)

```
           [后端服务器: 单个长时进程]
           +----------------------------------+
           |      TaskManager (in-memory)     |
           +----------------------------------+
                        ↑ | (读写内存)
                        | ↓
+----------+       +------------------+       +--------------------+
| Frontend | ----> | WebSocket Server | ----> | PipelineOrchestrator |
+----------+       +------------------+       +--------------------+
(实时接收)          (维持长连接)                  (执行任务, 实时推送)
```
- **状态**: 存储在 `TaskManager` 的内存 `Map` 中，随进程结束而丢失。
- **通信**: 后端通过 WebSocket 向前端**主动推送 (Push)** 数据。

### 2.2. 新数据流 (To-Be: Vercel KV & Polling)

```
           [Vercel KV: 外部持久化存储]
           +----------------------------------+
           |   {task:..., audio:..., ...}     |
           +----------------------------------+
                        ↑ | (读写 KV)
                        | ↓
+----------+       +------------------+       +--------------------+
| Frontend | ----> | Next.js API Routes | ----> | PipelineOrchestrator |
+----------+       +------------------+       +--------------------+
(主动轮询)          (无状态, 短时执行)             (执行任务, 更新 KV)
```
- **状态**: 持久化在 Vercel KV 中，与函数生命周期无关。
- **通信**: 前端通过 HTTP 向 API **主动拉取 (Pull)** 数据。

## 3. 组件影响分析 (Action Plan)

以下是本次重构涉及的具体文件和操作：

#### **将被创建 (Created)**
1.  `src/lib/services/KVTaskService.ts`
    *   **职责**: 封装所有与 Vercel KV 的直接交互，如 `createTask`, `getTask`, `updateTask`, `incrementAudioCount`。它将包含所有原子操作、错误处理和重试逻辑，是新的存储层核心。
2.  `src/app/api/pipeline/status/[taskId]/route.ts`
    *   **职责**: 新的 API 端点，供前端轮询任务状态。

#### **将被修改 (Modified)**
1.  `src/lib/managers/TaskManager.ts`
    *   **核心改造对象**: 内部的 `Map` 将被移除。所有方法将被改造为 `async`，并转而调用 `KVTaskService` 的对应方法。它从一个状态管理者变为一个无状态的业务逻辑协调者。
2.  `src/lib/pipeline-orchestrator-simple.ts`
    *   **职责**: 它的所有对 `TaskManager` 的调用都需要加上 `await`，因为它调用的方法现在是异步的。
3.  `src/app/api/pipeline/start/route.ts`
    *   **职责**: 改造为异步执行，立即返回 `taskId`，并通过 `PipelineOrchestrator` 触发后台任务。
4.  **所有前端相关文件**
    *   **职责**: 移除所有 WebSocket 客户端逻辑，替换为基于 `taskId` 的 HTTP 轮询逻辑。

#### **将被删除 (Deleted)**
1.  `src/lib/websocket-server.ts` (或类似文件)
    *   **原因**: WebSocket 模型被完全废弃。
2.  任何与建立和维护 WebSocket 连接相关的旧 API 路由。

## 4. 精确实行计划

### Phase 1: 构建并测试新的存储层 (2天)
- [ ] 安装 `@vercel/kv`。
- [ ] 创建 `src/lib/services/KVTaskService.ts`，并实现所有必需的、与 KV 交互的 `async` 方法。
- [ ] **关键**: 为 `KVTaskService` 编写单元测试，在隔离状态下验证其所有方法（包括原子递增和错误处理）都按预期工作。

### Phase 2: “心脏移植” - 改造核心服务 (2天)
- [ ] **改造 `TaskManager`**: 移除其内部的内存 `Map`，注入 `KVTaskService`，并将其所有方法重写为调用 `KVTaskService` 的异步方法。
- [ ] **改造 `PipelineOrchestrator`**: 审查并修改所有调用 `TaskManager` 的地方，确保使用 `await`。
- [ ] **改造启动入口**: 修改 `/api/pipeline/start` 路由，使其适应新的异步流程。
- **测试**: 在此阶段后，使用 Postman 等工具调用 `start` API，并直接检查 Vercel KV 数据库，验证任务是否被正确创建和更新。这是后端的集成测试。

### Phase 3: 重构面向前端的 API 和 UI (2-3天)
- [ ] 创建并实现 `/api/pipeline/status/[taskId]` 路由。
- [ ] **重构前端**: 彻底移除 WebSocket 相关代码。
- [ ] 在前端实现新的轮询服务，用于调用 `status` API 并更新 UI。
- [ ] 修改前端的播放逻辑，使其在接收到完整的批量数据后开始播放。
- **测试**: 启动整个应用，进行端到端的完整功能测试。

### Phase 4: 清理 (1天)
- [ ] **删除** `websocket-server.ts` 和其他不再使用的旧文件。
- [ ] 审查代码，移除所有与旧流程相关的死代码。
- [ ] 更新项目文档。

## 5. 总结

本方案是一份直接、精确的“手术计划”。它通过清晰的步骤和在每个阶段后的验证点，来确保在进行就地升级时的稳定性和安全性，最终实现一个更健壮、更具扩展性的无服务器架构。