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
        model: 'deepseek-v4-flash',
        messages: [
          { 
            role: 'system', 
            content: `你是一位专业短剧编剧。请将输入的小说拆解为多个分镜。必须严格按照以下文本格式输出，每个镜头用“镜头X”开头：

镜头1
标题：推门瞬间
画面：一只戴着黑色皮手套的手轻轻推开一扇深色木门...
字幕：开门瞬间
配音：有人吗？闪达快递。
运镜：推镜头
BGM：悬疑

镜头2
标题：客厅狼藉
画面：波斯地毯被掀翻，茶几上的水晶碎了一地...
字幕：一片狼藉
配音：(环境音) 滴答声
运镜：固定
BGM：紧张` 
          },
          { role: 'user', content: userContent }
        ],
        stream: false,
        temperature: 0.3
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

    // 智能切分多个镜头
    const rawScenes = rawContent.split(/镜头\s*\d+/).filter(s => s.trim());
    const storyboards = [];

    if (rawScenes.length === 0) {
      storyboards.push({
        shotNumber: 1,
        title: "镜头 1",
        plot: rawContent,
        subtitle: "开门瞬间",
        voiceover: "有人吗？",
        cameraMovement: "推镜头",
        shotType: "中景",
        bgm: "悬疑"
      });
    } else {
      rawScenes.forEach((sec, idx) => {
        const getField = (name) => {
          const match = sec.match(new RegExp(`${name}[：:]\\s*(.+)`, 'i'));
          return match ? match[1].trim() : '';
        };

        const plot = getField('画面') || sec.trim();
        storyboards.push({
          shotNumber: idx + 1,
          title: getField('标题') || `镜头 ${idx + 1}`,
          plot: plot,
          subtitle: getField('字幕') || '',
          voiceover: getField('配音') || '',
          cameraMovement: getField('运镜') || '推镜头',
          shotType: '中景',
          bgm: getField('BGM') || '悬疑'
        });
      });
    }

    // 可灵 AI 敏感词自动过滤与合规替换函数
    const sanitizeForKling = (text) => {
      if (!text) return '';
      let cleanText = text;
      const sensitiveMap = {
        'blood': 'red liquid',
        'bloody': 'vibrant red',
        'corpse': 'lifeless figure',
        'death': 'dramatic scene',
        'kill': 'defeat',
        'murder': 'conflict',
        'weapon': 'prop',
        'knife': 'silver prop',
        'gun': 'prop'
      };
      
      for (const [badWord, safeWord] of Object.entries(sensitiveMap)) {
        const regex = new RegExp(`\\b${badWord}\\b`, 'gi');
        cleanText = cleanText.replace(regex, safeWord);
      }
      return cleanText;
    };

    storyboards.forEach((s) => {
      const baseDesc = s.plot || s.title || '';
      s.prompt = `电影感摄影级别, ${baseDesc}, 浅景深, 4K, 竖屏9:16`;
      const safeEnglishDesc = sanitizeForKling(baseDesc);
      s.englishPrompt = `Cinematic masterwork, ${safeEnglishDesc}, shallow depth of field, 4K resolution, vertical 9:16.`;
      s.videoPrompt = `Smooth ${s.cameraMovement}, cinematic atmosphere.`;
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