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
      return res.status(200).json({
        content: "未配置 DEEPSEEK_API_KEY",
        v2Data: {
          characters: [],
          storyboards: [{ shotNumber: 1, title: "错误", plot: "未配置 DEEPSEEK_API_KEY 环境变量" }]
        }
      });
    }

    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { 
            role: 'system', 
            content: `你是一位专业短剧编剧。请分析输入的小说，输出一个纯 JSON 对象（不要包裹在markdown中，不要有任何多余字符），格式如下：
{
  "characters": [{"id": "1", "name": "角色", "appearance": "外貌"}],
  "storyboards": [
    {
      "shotNumber": 1,
      "title": "推门瞬间",
      "duration": "3s",
      "plot": "画面描述文字",
      "subtitle": "字幕文字",
      "voiceover": "旁白",
      "coreAction": "核心动作",
      "cameraMovement": "固定",
      "shotType": "中景",
      "bgm": "紧张"
    }
  ]
}` 
          },
          { role: 'user', content: userContent }
        ],
        stream: false,
        temperature: 0.3
      })
    });

    const textResult = await response.text();
    let data = JSON.parse(textResult);
    let rawContent = data.choices?.[0]?.message?.content?.trim();
    
    if (!rawContent) throw new Error('DeepSeek 返回空内容');

    // 清理 markdown 标签
    rawContent = rawContent.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/, '');
    
    let parsedData;
    try {
      parsedData = JSON.parse(rawContent);
    } catch (parseErr) {
      // 如果大模型返回的不是标准 JSON，启动安全降级包装
      parsedData = {
        characters: [],
        storyboards: [
          {
            shotNumber: 1,
            title: "镜头 1",
            duration: "3s",
            plot: rawContent,
            subtitle: "",
            voiceover: "",
            coreAction: "正常表现",
            cameraMovement: "固定",
            shotType: "中景",
            bgm: "平静"
          }
        ]
      };
    }

    // 本地极速拼接 Prompt
    if (parsedData.storyboards && Array.isArray(parsedData.storyboards)) {
      parsedData.storyboards.forEach((s, idx) => {
        if (!s.shotNumber) s.shotNumber = idx + 1;
        const baseDesc = s.plot || s.title || '';
        const action = s.coreAction || '';
        s.prompt = `电影感摄影级别, ${baseDesc}, 核心动作: ${action}, 浅景深, 4K, 竖屏9:16, 保持角色外貌与服装一致`;
        s.englishPrompt = `Cinematic masterwork, ${baseDesc}, action: ${action}, shallow depth of field, 4K resolution, vertical 9:16, consistent character appearance.`;
        s.videoPrompt = `Smooth ${s.cameraMovement || 'static'} shot, ${action}, cinematic atmosphere.`;
      });
    }

    return res.status(200).json({ 
      content: "解析成功",
      v2Data: parsedData 
    });

  } catch (error) {
    console.error('API 异常:', error.message);
    return res.status(200).json({
      content: `生成失败`,
      v2Data: {
        characters: [],
        storyboards: [{
          shotNumber: 1,
          title: "生成异常",
          plot: `错误信息: ${error.message}`,
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