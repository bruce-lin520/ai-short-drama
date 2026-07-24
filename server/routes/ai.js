// server/routes/ai.js
import express from 'express';

const router = express.Router();

router.post('/storyboard', async (req, res) => {
  const { prompt } = req.body;

  if (!process.env.DEEPSEEK_API_KEY) {
    return res.status(401).json({ error: '未检测到 DEEPSEEK_API_KEY' });
  }

  // 设置 SSE 流式响应头
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: `你是一位专业的 AI 短剧导演和编剧。请根据用户输入的小说，进行以下拆解：

1. 首先输出【核心角色列表】，格式如下：
# 核心角色列表
- **角色名**：[名字] | [性别/年龄] | [外貌特征] | [服装指南] | [SD/Midjourney一致性Prompt]

2. 随后逐幕输出【分镜表】，格式必须包含：
## 第一幕：[幕次标题]
- 剧情：[详细剧情]
- 人物：[出场角色]
- 场景：[地点/时间]
- 情绪：[氛围情绪]
- 镜头建议：[运镜手法]
- Prompt：[Cinematic shot, ...]
`
          },
          { role: 'user', content: prompt }
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('DeepSeek API 报错:', errText);
      res.write(`data: ${JSON.stringify({ error: `DeepSeek API 响应异常: ${response.status}` })}\n\n`);
      return res.end();
    }

    // 处理流式数据
    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const dataStr = line.replace('data: ', '').trim();
          if (dataStr === '[DONE]') {
            res.write('data: [DONE]\n\n');
            res.end();
            return;
          }
          try {
            const parsed = JSON.parse(dataStr);
            const content = parsed.choices[0]?.delta?.content || '';
            if (content) {
              res.write(`data: ${JSON.stringify({ content })}\n\n`);
            }
          } catch (e) {
            // 忽略 JSON 解析失败的片段
          }
        }
      }
    }
  } catch (err) {
    console.error('后端服务内部错误:', err);
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
    res.end();
  }
});

export default router;
// 在 server/routes/ai.js 文件的 export default router; 上方添加：

/**
 * 🎨 一键生成分镜参考图 API
 */
router.post('/generate-image', async (req, res) => {
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt 不能为空' });
  }

  try {
    // 对 Prompt 进行 URL 编码，并使用 Flux 模型生成 16:9 画幅的电影质感参考图
    const cleanPrompt = encodeURIComponent(`${prompt}, cinematic lighting, photorealistic, 8k, film grain`);
    const seed = Math.floor(Math.random() * 1000000);
    const imageUrl = `https://image.pollinations.ai/prompt/${cleanPrompt}?width=1024&height=576&seed=${seed}&model=flux&nologo=true`;

    res.json({ imageUrl });
  } catch (err) {
    console.error('生图接口错误:', err);
    res.status(500).json({ error: '生图失败，请稍后重试' });
  }
});