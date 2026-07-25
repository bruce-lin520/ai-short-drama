export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).json({ status: 'ok' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch (e) { body = {}; }
    }
    const userContent = body?.prompt || body?.text || "老有人开门。";
    const apiKey = process.env.DEEPSEEK_API_KEY;

    if (!apiKey) {
      throw new Error('未配置 DEEPSEEK_API_KEY');
    }

    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-v4-flash', // 【已修正为平台支持的模型名称】
        messages: [
          { 
            role: 'system', 
            content: '你是一个短剧编剧。请直接把用户输入的小说改编为分镜，输出格式：画面描述、字幕、配音。' 
          },
          { role: 'user', content: userContent }
        ],
        stream: false,
        temperature: 0.5
      })
    });

    const textResult = await response.text();
    let data = JSON.parse(textResult);

    if (data.error) {
      throw new Error(data.error.message || JSON.stringify(data.error));
    }

    const rawContent = data.choices?.[0]?.message?.content?.trim();
    if (!rawContent) {
      throw new Error('API 返回空文本');
    }

    const storyboards = [{
      shotNumber: 1,
      title: "镜头 1",
      plot: rawContent,
      subtitle: "开门瞬间",
      voiceover: "有人吗？闪达快递。",
      cameraMovement: "推镜头",
      shotType: "中景",
      bgm: "悬疑"
    }];

    storyboards.forEach((s) => {
      s.prompt = `电影感摄影级别, ${s.plot}, 浅景深, 4K, 竖屏9:16`;
      s.englishPrompt = `Cinematic masterwork, ${s.plot}, shallow depth of field, 4K resolution, vertical 9:16.`;
      s.videoPrompt = `Smooth camera movement, cinematic atmosphere.`;
    });

    return res.status(200).json({ 
      content: "解析成功",
      v2Data: {
        characters: [],
        storyboards: storyboards
      }
    });

  } catch (error) {
    return res.status(200).json({
      content: "错误",
      v2Data: {
        characters: [],
        storyboards: [{
          shotNumber: 1,
          title: "错误",
          plot: `生成失败: ${error.message}`,
          prompt: "固定画面",
          englishPrompt: "Static shot",
          videoPrompt: "Static",
          cameraMovement: "固定",
          shotType: "中景",
          bgm: "平静"
        }]
      }
    });
  }
}