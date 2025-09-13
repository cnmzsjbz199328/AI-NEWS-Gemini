# 音色参考文件说明

这个目录用于存放 IndexTTS-2-Demo 的音色参考文件。

## 文件要求

每个角色需要一个高质量的音频文件作为音色参考：

- **moderator_reference.wav** - 主持人音色参考
- **tom_reference.wav** - Tom 角色音色参考  
- **mark_reference.wav** - Mark 角色音色参考

## 音频文件规格

- **格式**: WAV 或 MP3
- **时长**: 3-10秒
- **质量**: 清晰、无背景噪音
- **内容**: 包含目标声音特征的短句或单词
- **采样率**: 16kHz 或更高

## 示例内容

- **主持人**: "Welcome to today's news debate discussion."
- **Tom**: "I believe this policy will bring positive changes."
- **Mark**: "We need to consider the potential risks carefully."

## 使用方法

1. 将音频文件放入此目录
2. 确保文件名与上述要求匹配
3. 重启应用以加载新的音色配置

## 注意事项

- 音频文件会被 IndexTTS-2-Demo 用于音色克隆
- 文件质量直接影响生成语音的效果
- 建议使用专业录音设备录制
- 避免使用有版权问题的音频内容