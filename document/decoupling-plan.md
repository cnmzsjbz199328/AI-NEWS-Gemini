# `PipelineOrchestrator` 解耦计划

本文档旨在为 `src/lib/pipeline-orchestrator.ts` 的重构提供一个清晰、可执行的计划。

## 1. 问题分析

当前 `PipelineOrchestrator` 是一个“上帝对象”，承担了过多的职责，包括：
-   **状态管理**：维护任务、工作者和流水线的全局状态。
-   **核心调度**：通过轮询循环驱动任务处理。
-   **业务执行**：包含文本和音频生成的完整业务逻辑。
-   **外部通信**：直接与 WebSocket 通知功能耦合。

这种高耦合、低内聚的设计导致代码难以理解、测试和扩展。

## 2. 提议的架构与文件结构

为了解决上述问题，我们建议将 `PipelineOrchestrator` 拆分为多个遵循单一职责原则的、功能专注的模块。

### 2.1 模块职责

| 模块名 | 职责 |
| :--- | :--- |
| `TaskManager` | **任务管理器**：作为任务状态的唯一真实来源，负责任务的增、删、改、查。 |
| `WorkerManager` | **工作者管理器**：负责AI工作者的状态管理（空闲、忙碌）和分配策略。 |
| `TextGenerationService` | **文本生成服务**：封装文本生成的完整逻辑，包括调用AI、处理结果和重试。 |
| `AudioGenerationService`| **音频生成服务**：封装音频生成的完整逻辑，包括调用TTS、处理超时和重试。 |
| `NotificationService` | **通知服务**：使用发布/订阅模式处理WebSocket等外部通知，与核心逻辑解耦。 |
| `PipelineScheduler` | **流水线调度器**：作为新的协调者，驱动整个流程，但将具体实现委托给其他模块。 |

### 2.2 文件存放位置

根据当前项目结构，新文件和重构后的文件建议存放在以下位置：

```
src/
└── lib/
    ├── PipelineScheduler.ts        # 新的调度器，取代旧的 orchestrator
    ├── ai-worker-pool.ts           # (保持不变)
    ├── indexTTS-integrated-service.ts # (保持不变)
    ├── managers/
    │   ├── TaskManager.ts            # [新增] 任务状态管理器
    │   └── WorkerManager.ts          # [新增] 工作者状态管理器
    └── services/                     # [新增] 服务目录
        ├── TextGenerationService.ts  # [新增] 文本生成执行服务
        ├── AudioGenerationService.ts # [新增] 音频生成执行服务
        └── NotificationService.ts    # [新增] 事件驱动的通知服务
```
旧的 `pipeline-orchestrator.ts` 文件将在重构完成后被 `PipelineScheduler.ts` 替代并删除。

## 3. 重构步骤

### 第1步：创建状态管理器

1.  **创建 `src/lib/managers/TaskManager.ts`**:
    -   将 `PipelineOrchestrator` 中所有直接操作 `this.tasks` 数组的逻辑（如增、删、改、查）迁移至此。
    -   提供 `getTasksByStatus`, `updateTask`, `getTaskById` 等接口。
2.  **创建 `src/lib/managers/WorkerManager.ts`**:
    -   将 `PipelineOrchestrator` 中所有与 `this.workers` 相关的逻辑（如 `getIdleWorker`, `assignWorker`, `releaseWorker`）迁移至此。

### 第2步：提取执行服务

1.  **创建 `src/lib/services/TextGenerationService.ts`**:
    -   将 `executeAITask` 方法的全部内容迁移至此，并改造为一个 `execute(task)` 方法。
    -   该方法应是无状态的，不直接修改外部状态，而是返回一个包含成功/失败信息和结果的对象。
2.  **创建 `src/lib/services/AudioGenerationService.ts`**:
    -   将 `executeTTSTask` 方法的全部内容迁移至此，同样改造为 `execute(task)` 方法。
    -   封装所有与TTS调用、超时处理和结果解析相关的逻辑。

### 第3步：实现事件驱动的通知服务

1.  **创建 `src/lib/services/NotificationService.ts`**:
    -   内部可以实现一个简单的 `EventEmitter` 或使用现有的库。
    -   它将订阅由 `TaskManager` 在任务状态更新时发布的事件（如 `task:updated`）。
    -   当接收到事件时，该服务负责调用 WebSocket 广播函数。
    -   在 `TaskManager` 的 `updateTask` 方法中，移除直接的 `broadcastTaskUpdate` 调用，改为发布事件。

### 第4步：重构调度器

1.  **创建 `src/lib/PipelineScheduler.ts`**:
    -   该类将作为新的主类，它会实例化 `TaskManager`, `WorkerManager` 和各种生成服务。
    -   保留 `startPipeline`, `stopPipeline`, `getState` 等公共接口。
    -   重写 `processTasks` 方法。新的方法将非常简洁，只负责协调：
        ```typescript
        private async processTasks(): Promise<void> {
          // 1. 从 TaskManager 获取待处理任务
          const pendingTextTasks = this.taskManager.getTasksByStatus('PENDING_TEXT');

          for (const task of pendingTextTasks) {
            // 2. 从 WorkerManager 获取空闲工作者
            const workerType = this.workerManager.getIdleWorker();
            if (workerType) {
              // 3. 更新状态
              this.workerManager.assignWorker(task.id, workerType);
              this.taskManager.updateTask(task.id, { status: 'GENERATING_TEXT' });

              // 4. 异步调用执行服务
              this.textGenerationService.execute(task).then(result => {
                // 5. 根据结果再次更新状态
                // ...
              });
            }
          }
          // ... 对音频任务执行类似逻辑 ...
        }
        ```

### 第5步：整合与清理

1.  **更新API路由**: 修改 `src/app/api/pipeline/start/route.ts`，使其调用新的 `PipelineScheduler.getInstance()`。
2.  **验证**: 运行测试和应用，确保所有功能正常。
3.  **删除**: 确认新架构稳定后，删除旧的 `pipeline-orchestrator.ts` 文件。

## 4. 预期收益

-   **高内聚，低耦合**：每个模块职责清晰，代码更易于理解和维护。
-   **可测试性强**：可以对每个管理器和服务进行独立的单元测试。
-   **可扩展性好**：未来更换TTS服务或增加新的AI模型，只需修改或增加对应的服务/管理器，而无需触及核心调度逻辑。
