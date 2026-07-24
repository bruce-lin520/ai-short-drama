/**
 * server.js - AI短剧项目后端代理服务器示例 (Node.js / Express)
 * 负责安全管理 API Key，并将前端请求转发至大模型、AI生图及视频生成服务（如可灵、Midjourney、Runway等）
 */

const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch'); // 若 Node 版本较高，可直接使用内置 fetch
const app = express();

app.use(express.json());
app.use(cors());

// 配置你的大模型与第三方 AI 渲染 API Key（建议在实际部署时通过环境变量读取）
const AI_CONFIG = {
  deepseekApiKey: process.env.DEEPSEEK_API_KEY || 'your-deepseek-api-key',
  imageApiKey: process.env.IMAGE_API_KEY || 'your-image-api-key',
  videoApiKey: process.env.VIDEO_API_KEY || 'your-video-api-key',
};

/**
 * 1. 文本与分镜流式生成接口 (/api)
 */
app.post('/api', async (req, res) => {
  const { prompt } = req.body;
  
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    const apiResponse = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AI_CONFIG.deepseekApiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: prompt }],
        stream: true
      })
    });

    if (!apiResponse.ok) {
      throw new Error(`DeepSeek API error: ${apiResponse.statusText}`);
    }

    const reader = apiResponse.body;
    reader.on('data', (chunk) => {
      res.write(chunk);
    });
    reader.on('end', () => {
      res.write('data: [DONE]\n\n');
      res.end();
    });
  } catch (error) {
    console.error('Text generation error:', error);
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    res.end();
  }
});

/**
 * 2. AI 绘画生成接口 (/api/generate-image)
 */
app.post('/api/generate-image', async (req, res) => {
  const { prompt, style, sceneNumber } = req.body;
  
  try {
    // 示例：对接第三方 AI 生图 API（如 Midjourney / Stable Diffusion /  LiblibAI 等）
    /*
    const response = await fetch('https://api.example.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AI_CONFIG.imageApiKey}`
      },
      body: JSON.stringify({ prompt: `${prompt}, style: ${style}`, width: 1024, height: 576 })
    });
    const data = await response.json();
    res.json({ imageUrl: data.url });
    */

    // 开发/测试阶段：模拟返回一个高质量的占位或图床链接
    setTimeout(() => {
      res.json({
        imageUrl: `https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1280&q=80`
      });
    }, 1500);

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * 3. AI 动态视频生成接口 (/api/generate-video)
 */
app.post('/api/generate-video', async (req, res) => {
  const { prompt, imageUrl, duration, sceneNumber } = req.body;

  try {
    // 示例：对接可灵 (Kling) 或 Runway 视频大模型 API
    /*
    const response = await fetch('https://api.klingai.com/v1/videos/text2video', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AI_CONFIG.videoApiKey}`
      },
      body: JSON.stringify({ prompt, image_url: imageUrl, duration })
    });
    const data = await response.json();
    res.json({ videoUrl: data.video_url });
    */

    // 开发/测试阶段：模拟返回一个测试视频链接
    setTimeout(() => {
      res.json({
        videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4'
      });
    }, 2000);

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * 4. AI 语音配音合成接口 (/api/generate-tts)
 */
app.post('/api/generate-tts', async (req, res) => {
  const { text, sceneNumber } = req.body;
  // 可以在此对接 Edge-TTS、OpenAI TTS 或 ElevenLabs
  res.json({ audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`AI Drama Backend Server running on port ${PORT}`);
});
/**
 * 5. Prompt 智能优化与规范化接口 (/api/optimize-prompt)
 * 利用 DeepSeek 将用户输入的粗糙描述转化为符合可灵/即梦规范的中英文生图与视频 Prompt
 */
app.post('/api/optimize-prompt', async (req, res) => {
  const { rawText, style } = req.body;

  try {
    const systemPrompt = `你是一位顶尖的 AI 短剧导演和 Prompt 专家。请根据用户提供的原始画面描述和风格模板（当前风格：${style || '写实电影风'}），输出符合可灵 (Kling) 和即梦规范的高质量 Prompt。
你必须严格以合法的 JSON 格式返回，不包含多余的 markdown 标记（如不要有 \`\`\`json ），结构如下：
{
  "chinese": "优化后的中文画面描述（画面主体、光影、氛围、构图）",
  "english": "Optimized English prompt for AI generation (high quality, descriptive, cinematic)",
  "videoPrompt": {
    "chinese": "符合AI视频生成的中文动态描述（运动轨迹、镜头调度、主体动作）",
    "english": "English video motion prompt specifying camera movement and subject action"
  },
  "cameraMovement": "推荐的运镜方式（如：推镜头、环绕运镜等）",
  "bgmSuggestion": "推荐的 BGM 氛围及音乐风格"
}`;

    const apiResponse = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AI_CONFIG.deepseekApiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `请优化这段描述：${rawText}` }
        ],
        stream: false,
        response_format: { type: "json_object" } // 强制输出 JSON
      })
    });

    if (!apiResponse.ok) {
      throw new Error(`DeepSeek API error: ${apiResponse.statusText}`);
    }

    const data = await apiResponse.json();
    const resultJson = JSON.parse(data.choices[0].message.content);
    
    res.json({ success: true, data: resultJson });

  } catch (error) {
    console.error('Prompt optimization error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});