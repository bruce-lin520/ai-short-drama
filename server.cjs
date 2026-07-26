/**
 * server.cjs - AI短剧项目后端代理服务器
 */

const express = require('express');
const cors = require('cors');
const app = express();

app.use(express.json());
app.use(cors());

const AI_CONFIG = {
  deepseekApiKey: process.env.DEEPSEEK_API_KEY || 'sk-0dea88b140bf4cada7d5a15ff56ea94b',
  imageApiKey: process.env.IMAGE_API_KEY || 'your-image-api-key',
  videoApiKey: process.env.VIDEO_API_KEY || 'your-video-api-key',
};

app.post('/api/storyboard', async (req, res) => {
  const { prompt } = req.body;

  try {
    const systemPrompt = `你是一位顶尖的 AI 短剧导演。请将用户输入的小说/剧本原文拆解为多个分镜镜头。
你必须严格以合法的 JSON 格式返回，不包含多余的 markdown 标记，结构如下：
{
  "v2Data": {
    "characters": [],
    "storyboards": [
      {
        "shotNumber": 1,
        "title": "镜头标题",
        "duration": "3s",
        "plot": "详细的画面剧情描述",
        "subtitle": "内嵌字幕",
        "voiceover": "旁白配音稿",
        "prompt": "中文生图 Prompt",
        "klingPrompt": "英文生图 Prompt (Cinematic, high quality)",
        "runwayPrompt": "视频运镜动态描述",
        "cameraMovement": "推镜头",
        "bgm": "悬疑紧张的背景音乐"
      }
    ]
  }
}`;

    const apiResponse = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AI_CONFIG.deepseekApiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-v4-pro',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `请将以下内容拆解为分镜：${prompt}` }
        ],
        stream: false,
        response_format: { type: "json_object" }
      })
    });

    if (!apiResponse.ok) {
      const errBody = await apiResponse.text();
      throw new Error(`DeepSeek API error: ${apiResponse.status} - ${errBody}`);
    }

    const data = await apiResponse.json();
    const resultJson = JSON.parse(data.choices[0].message.content);
    
    res.json(resultJson);

  } catch (error) {
    console.error('Storyboard generation error:', error);
    res.status(500).json({ 
      v2Data: {
        characters: [],
        storyboards: [{
          shotNumber: 1,
          title: "错误",
          plot: `生成失败: ${error.message}`,
          prompt: "固定画面",
          klingPrompt: "Static shot",
          cameraMovement: "固定",
          bgm: "平静"
        }]
      }
    });
  }
});

app.post('/api/optimize-prompt', async (req, res) => {
  const { rawText, style } = req.body;

  try {
    const systemPrompt = `你是一位顶尖的 AI 短剧导演和 Prompt 专家。请根据用户提供的原始画面描述和风格模板（当前风格：${style || '写实电影风'}），输出高质量 Prompt，并提供专业导演建议与质量评分。
你必须严格以合法的 JSON 格式返回，不包含多余的 markdown 标记，结构如下：
{
  "chinese": "优化后的中文画面描述",
  "english": "Optimized English prompt for AI generation",
  "videoPrompt": {
    "chinese": "符合AI视频生成的中文动态描述",
    "english": "English video motion prompt"
  },
  "cameraMovement": "推荐的运镜方式",
  "bgmSuggestion": "推荐的 BGM 氛围",
  "directorAdvice": "专业的导演视觉与节奏建议（例如：建议采用特写、慢推进、情绪压抑、持续5秒等）",
  "directorScore": 92
}`;

    const apiResponse = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AI_CONFIG.deepseekApiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-v4-pro',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `请优化这段描述并给出导演点评：${rawText}` }
        ],
        stream: false,
        response_format: { type: "json_object" }
      })
    });

    if (!apiResponse.ok) {
      const errBody = await apiResponse.text();
      throw new Error(`DeepSeek API error: ${apiResponse.status} - ${errBody}`);
    }

    const data = await apiResponse.json();
    const resultJson = JSON.parse(data.choices[0].message.content);
    
    res.json({ success: true, data: resultJson });

  } catch (error) {
    console.error('Prompt optimization error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`AI Drama Backend Server running on port ${PORT}`);
});