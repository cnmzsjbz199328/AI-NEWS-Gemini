# AI-NEWS 项目代码审查

根据你的要求，我对项目的核心逻辑进行了审查。以下是关于你提出的几点功能的核实结果。

## 1. 新闻获取配置

- **你的描述**: 系统应只获取1条ABC新闻，0条BBC新闻。
- **核实结果**: ✅ **正确**。
- **详情**: 经过检查 `src/config/index.ts` 文件，确认配置如下，符合你的描述。
  ```typescript
  export const API_CONFIG = {
    // ...
    MAX_NEWS_ITEMS: 1, // 总共1条新闻
    ABC_NEWS_COUNT: 1,  // ABC新闻数量（前1条）
    BBC_NEWS_COUNT: 0   // BBC新闻数量（后0条）
  };
  ```

## 2. 默认辩论轮数和脚本规模

- **你的描述**: 系统默认生成一轮对话（moderator, Tom, Mark, moderator），并因此产生4个音频片段。
- **核实结果**: ❌ **不正确**。
- **详情**: 
  - 在 `src/lib/pipeline-orchestrator.ts` 中，`startPipeline` 方法的 `debateRounds` 参数默认值为 **3**。
  - 在 API 路由 `src/app/api/pipeline/start/route.ts` 中，如果前端请求未提供 `debateRounds`，同样会默认设置为 **3** (`const debateRounds = body.debateRounds || 3`)。
  - **结论**: 系统默认会生成一个包含 **3 轮**对话的脚本，总共会产生 **8 个**音频片段（1个引言 + 3*2个对话 + 1个结语）。这与之前的日志输出相符。

- **建议**: 为了实现你期望的1轮对话（4个音频片段），前端在调用 `POST /api/pipeline/start` 接口时，必须在请求体中明确传递 `{"debateRounds": 1}`。

## 3. 顺序播放逻辑

- **你的描述**: 音频成功生成后，应按顺序播放。
- **核实结果**: ✅ **正确**。
- **详情**: `pipeline-orchestrator.ts` 中的逻辑支持这一功能。
  - 音频批量生成成功后，任务状态会更新为 `READY_TO_PLAY`。
  - `getNextPlayableTask()` 和 `markCurrentTaskAsCompleted()` 方法为前端提供了一套机制，可以获取可播放的任务、播放其内容，然后前进到下一个任务。
  - 后端的核心机制已经具备，可以支持前端实现顺序播放。

## 总结

项目在新闻获取和播放逻辑方面与你的描述一致，但**核心的默认辩论轮数不一致**。为了达到预期的开发测试效果（1轮对话，4个音频），需要确保前端请求中正确设置了 `debateRounds` 参数。
