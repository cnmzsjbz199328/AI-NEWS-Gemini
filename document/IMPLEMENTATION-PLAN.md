# AI新闻辩论系统前后端分离优化实施计划

> **⚠️ 文档状态更新 (2024年12月)**  
> 本文档描述的流水线监控功能已被移除，以简化系统架构。当前系统专注于核心的新闻辩论功能，不再包含复杂的任务监控界面。相关的 PipelineMonitor 组件、pipeline-store 状态管理和监控 API 端点已被清理。

## 📋 项目概览

基于现有架构评估（分离度70%），本计划将完成前后端彻底分离，实现完整的并发流水线系统。

**当前状态**：
- ✅ 核心流水线调度器已实现 (PipelineOrchestrator)
- ✅ AI工作池基础架构已完成
- ✅ TTS批处理服务已集成
- ✅ 前端组件已解耦，业务逻辑提取到自定义 hooks
- ✅ 流水线监控功能已移除，简化系统架构
- ❌ 缺少WebSocket实时状态同步
- ❌ API端点不完整

**优化目标**：
- ✅ 完成前后端彻底分离（目标：95%+）
- 补充缺失的API端点和WebSocket
- ✅ 将前端业务逻辑迁移至后端
- 简化实时状态监控（仅保留核心功能）

## 🎯 Phase 1: API端点补充与优化 (Day 1-2)

### 1.1 补充缺失的API端点

**新建文件**: 
- `src/app/api/pipeline/next/route.ts` - 手动触发下一个任务
- `src/app/api/pipeline/stop/route.ts` - 停止流水线
- `src/app/api/voices/route.ts` - 获取可用音色列表
- `src/app/api/pipeline/retry/route.ts` - 重试失败任务

```typescript
// POST /api/pipeline/next - 手动触发下一个任务
export async function POST(request: NextRequest) {
  const { taskId } = await request.json()
  const orchestrator = pipelineOrchestrator
  
  const success = orchestrator.markCurrentTaskAsCompleted()
  if (success) {
    return NextResponse.json({ success: true, message: 'Moved to next task' })
  } else {
    return NextResponse.json({ error: 'No task to complete' }, { status: 400 })
  }
}

// GET /api/voices - 获取可用音色
export async function GET() {
  const { cosyVoiceTTSService } = await import('@/lib/cosyvoice-tts-service')
  const languages = cosyVoiceTTSService.getSupportedLanguages()
  return NextResponse.json({ languages })
}
```

**预计工时**: 1天
**依赖**: 现有PipelineOrchestrator
**输出**: 完整的RESTful API端点

### 1.2 AI工作池重构

**文件**: `src/lib/ai-worker-pool.ts`
```typescript
// 替换现有的逐角色AI调用
class AIWorkerPool {
  private workers: Map<AIProvider, AIWorker> = new Map();
  private taskQueue: PendingTask[] = [];
  
  async assignTask(theaterId: number, newsTopic: string): Promise<AIProvider>;
  async handleWorkerCompletion(provider: AIProvider, result: ScriptResult): Promise<void>;
  async handleWorkerFailure(provider: AIProvider, error: Error): Promise<void>;
}

// 统一剧本生成提示词
const UNIFIED_SCRIPT_PROMPT = `
Generate a complete debate script for the news topic: "${newsTopic}"
Include ${debateRounds} rounds of discussion between Tom and Mark, moderated by Host.
Return structured JSON with speaker order and dialogue content.
`;
```

**改动范围**:
- 修改 `src/lib/ai-providers.ts` 支持统一剧本生成
- 更新 `src/lib/debate-manager.ts` 使用新的AI工作池
- 删除 `generateForRole()` 相关逻辑

**预计工时**: 3天
**依赖**: 1.1 数据结构
**输出**: 并发AI工作池，支持动态分配与故障转移

### 1.3 流水线调度器核心

**文件**: `src/lib/pipeline-orchestrator.ts`
```typescript
class PipelineOrchestrator {
  private theaters: Map<number, NewsTheater> = new Map();
  private aiWorkerPool: AIWorkerPool;
  private ttsService: IndexTTSService;
  private currentPlayingId: number | null = null;
  
  async startPipeline(config: PipelineConfig): Promise<void> {
    // 创建5个有序剧场
    // 分配前3个剧场给AI工作池
    // 启动状态监控循环
  }
  
  async checkBidirectionalTriggers(): Promise<void> {
    // 检查是否有剧场就绪且前序剧场已完成
    // 触发播放或等待条件满足
  }
  
  async onScriptGenerated(theaterId: number, script: string): Promise<void> {
    // 剧本完成回调，启动TTS流程
    // 释放AI工作者，分配下一任务
  }
  
  async onTTSCompleted(theaterId: number): Promise<void> {
    // TTS完成回调，更新剧场状态
    // 触发双向检查机制
  }
  
  async onPlaybackCompleted(theaterId: number): Promise<void> {
    // 播放完成回调，触发下一剧场
    // 更新播放指针
  }
}
```

**预计工时**: 4天
**依赖**: 1.1, 1.2
**输出**: 完整的流水线调度逻辑

## 🔊 Phase 2: TTS并发配音系统 (Week 2-3)

### 2.1 剧本解析与角色分配

**文件**: `src/lib/script-parser.ts`
```typescript
interface ScriptSegment {
  speaker: 'tom' | 'mark' | 'host';
  text: string;
  order: number;
}

class ScriptParser {
  parse(scriptContent: string): ScriptSegment[] {
    // 解析AI生成的结构化剧本
    // 提取角色对话和顺序信息
    // 返回有序的配音任务列表
  }
}
```

**预计工时**: 2天
**依赖**: AI工作池生成的剧本格式
**输出**: 结构化剧本解析器

### 2.2 并发TTS配音管理

**文件**: `src/services/tts-batch-service.ts`
```typescript
class TTSBatchService {
  async generateTheaterAudio(theaterId: number, segments: ScriptSegment[], voiceConfig: VoiceConfig): Promise<TTSProgress[]> {
    // 并发为所有角色台词生成音频
    // 使用Promise.allSettled处理部分失败
    // 返回音频URL和生成状态
  }
  
  async retryFailedSegments(theaterId: number, failedSegments: TTSProgress[]): Promise<void> {
    // 重试失败的音频生成
    // 支持降级到其他TTS服务
  }
}
```

**改动范围**:
- 增强 `src/services/tts-service.ts` 支持批量处理
- 更新 `src/lib/indexTTS-service.ts` 处理24参数数组格式
- 集成 `src/lib/voice-config-manager.ts` 动态音色选择

**预计工时**: 3天
**依赖**: 2.1, 现有TTS服务
**输出**: 高并发TTS批处理系统

## 🎮 Phase 3: API端点与前端集成 (Week 3-4)

### 3.1 流水线控制API

**新建文件**: 
- `src/app/api/pipeline/start/route.ts`
- `src/app/api/pipeline/status/route.ts`
- `src/app/api/pipeline/next/route.ts`
- `src/app/api/voices/route.ts`

```typescript
// POST /api/pipeline/start
export async function POST(request: Request) {
  const { newsTopics, debateRounds, voiceConfig } = await request.json();
  const orchestrator = PipelineOrchestrator.getInstance();
  await orchestrator.startPipeline({ newsTopics, debateRounds, voiceConfig });
  return Response.json({ success: true, theaterId: 0 });
}

// GET /api/pipeline/status
export async function GET() {
  const orchestrator = PipelineOrchestrator.getInstance();
  const status = await orchestrator.getStatus();
  return Response.json(status);
}
```

**预计工时**: 2天
**依赖**: Phase 1, Phase 2
**输出**: RESTful API端点

### 3.2 实时状态同步

**文件**: `src/app/api/pipeline/ws/route.ts`
```typescript
// WebSocket端点用于实时状态推送
export async function GET(request: Request) {
  const { socket, response } = Deno.upgradeWebSocket(request);
  
  socket.onopen = () => {
    PipelineOrchestrator.getInstance().addStatusListener(socket);
  };
  
  return response;
}
```

**改动范围**:
- 在PipelineOrchestrator中集成WebSocket广播
- 前端添加WebSocket连接管理

**预计工时**: 2天
**依赖**: 3.1
**输出**: 实时状态推送机制

### 3.3 前端状态管理重构

**文件**: `src/stores/pipeline-store.ts`
```typescript
interface PipelineState {
  theaters: Map<number, NewsTheater>;
  currentPlayingId: number | null;
  overallProgress: number;
  isPlaying: boolean;
  audioPlayer: HTMLAudioElement | null;
}

const usePipelineStore = create<PipelineState>((set, get) => ({
  theaters: new Map(),
  
  startPipeline: async (config: PipelineConfig) => {
    const response = await fetch('/api/pipeline/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
    // 启动WebSocket监听
    const ws = new WebSocket('/api/pipeline/ws');
    ws.onmessage = (event) => {
      const update = JSON.parse(event.data);
      set(state => ({ 
        theaters: state.theaters.set(update.theaterId, update.theater)
      }));
    };
  },
  
  playNext: async () => {
    const { currentPlayingId } = get();
    if (currentPlayingId !== null) {
      await fetch('/api/pipeline/next', {
        method: 'POST',
        body: JSON.stringify({ theaterId: currentPlayingId + 1 })
      });
    }
  }
}));
```

**改动范围**:
- 替换 `src/components/NewsDebateComponent.tsx` 中的状态管理逻辑
- 更新 `src/components/NewsPhoneInterface.tsx` 使用流水线状态
- 集成现有的音频播放器组件

**预计工时**: 3天
**依赖**: 3.1, 3.2
**输出**: 完整的前端状态管理系统

## 🔧 Phase 4: 监控与优化 (Week 4-5)

### 4.1 流水线监控面板

**文件**: `src/components/PipelineMonitor.tsx`
```typescript
const PipelineMonitor = () => {
  const { theaters, currentPlayingId } = usePipelineStore();
  
  return (
    <div className="pipeline-monitor">
      <div className="theater-grid grid grid-cols-5 gap-2">
        {Array.from(theaters.values()).map(theater => (
          <TheaterCard 
            key={theater.theaterId}
            theater={theater}
            isPlaying={theater.theaterId === currentPlayingId}
            onForceNext={() => forceNextTheater(theater.theaterId)}
            onRetryGeneration={() => retryTheaterGeneration(theater.theaterId)}
            onViewScript={() => openScriptModal(theater.scriptContent)}
          />
        ))}
      </div>
      
      <PipelineMetrics 
        overallProgress={overallProgress}
        aiWorkerUtilization={aiWorkerUtilization}
        ttsLatency={ttsLatency}
        playbackContinuity={playbackContinuity}
      />
    </div>
  );
};
```

**预计工时**: 2天
**依赖**: Phase 3
**输出**: 可视化监控界面

### 4.2 性能优化与错误处理

**优化项目**:
1. **音频预缓存**: 剧场状态变为`READY_TO_PLAY`时预加载音频
2. **内存管理**: 播放完成后释放音频资源
3. **AI调用重试**: 失败时自动重试或转移到其他AI
4. **TTS降级**: IndexTTS失败时回退到备用TTS

**文件**: `src/lib/performance-optimizer.ts`
```typescript
class PerformanceOptimizer {
  private audioCache: Map<number, HTMLAudioElement[]> = new Map();
  
  async preloadTheaterAudio(theaterId: number): Promise<void> {
    // 预加载剧场音频文件
    // 实施LRU缓存策略
  }
  
  cleanup(theaterId: number): void {
    // 释放已播放剧场的资源
    // 清理内存和缓存
  }
}
```

**预计工时**: 3天
**依赖**: Phase 1-3 完整系统
**输出**: 性能优化的生产就绪系统

## 📦 Phase 5: 集成测试与部署 (Week 5)

### 5.1 端到端测试

**测试场景**:
1. 5条新闻完整流水线处理
2. AI工作池故障转移机制
3. TTS并发生成与错误恢复  
4. 双向触发播放顺序验证
5. WebSocket实时状态同步

**文件**: `__tests__/pipeline-integration.test.ts`
```typescript
describe('Pipeline Integration Tests', () => {
  test('should process 5 news items with correct ordering', async () => {
    const config = {
      newsTopics: ['Topic 1', 'Topic 2', 'Topic 3', 'Topic 4', 'Topic 5'],
      debateRounds: 3,
      voiceConfig: { tom: 'male-1', mark: 'female-1', host: 'neutral-1' }
    };
    
    const orchestrator = new PipelineOrchestrator();
    await orchestrator.startPipeline(config);
    
    // 验证剧场创建
    // 验证AI分配
    // 验证TTS并发
    // 验证播放顺序
  });
});
```

**预计工时**: 2天
**依赖**: 完整系统
**输出**: 全面的测试覆盖

### 5.2 文档与部署

**文档更新**:
- `README.md`: 更新项目架构说明
- `DEPLOYMENT.md`: 新增部署指南
- `API.md`: API端点文档
- 代码注释完善

**部署检查清单**:
- [ ] 环境变量配置 (HF_TOKEN, API密钥)
- [ ] 生产优化 (`next.config.js`)
- [ ] 错误监控集成 (Sentry)
- [ ] 性能监控 (Vercel Analytics)

**预计工时**: 1天
**输出**: 生产就绪的部署包

## 📊 项目里程碑与交付物

| 里程碑 | 时间 | 主要交付物 | 验收标准 |
|--------|------|------------|----------|
| M1: 架构重构 | Week 2 | 流水线调度器、AI工作池 | 3条新闻并发处理 |
| M2: TTS集成 | Week 3 | 并发配音系统 | 批量音频生成 |
| M3: API开发 | Week 4 | RESTful API + WebSocket | 前端状态同步 |
| M4: 前端集成 | Week 4 | 流水线状态管理 | 完整用户界面 |
| M5: 优化部署 | Week 5 | 性能优化、监控 | 生产环境就绪 |

## ⚠️ 风险评估与缓解策略

### 高风险项目
1. **AI API稳定性**: Mistral API限流问题
   - **缓解**: 实施智能重试和降级机制
   
2. **IndexTTS私有Space**: HuggingFace可用性
   - **缓解**: 预备备用TTS服务
   
3. **并发复杂度**: 竞态条件和状态同步
   - **缓解**: 详细的单元测试和集成测试

### 中风险项目
1. **前端状态管理**: 复杂的异步状态更新
   - **缓解**: 使用成熟的状态管理模式
   
2. **音频播放顺序**: 客户端播放器同步
   - **缓解**: 服务端严格控制播放触发

## 🔄 迭代计划

**v1.0 (MVP)**: 基础流水线功能
- 5条新闻处理
- 3个AI工作者并发
- 基本的顺序播放

**v1.1 (增强版)**: 用户体验优化
- 可视化监控面板
- 自定义辩论轮次
- 音色选择界面

**v1.2 (生产版)**: 稳定性与性能
- 完整错误处理
- 性能优化
- 监控与日志

---

**总预计工时**: 25天 (5周)
**团队配置**: 1名全栈开发者
**技术栈**: Next.js 14, TypeScript, Zustand, IndexTTS, Gemini/Mistral/Reka APIs
