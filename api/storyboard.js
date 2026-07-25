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
            content: `你是一位专业短剧编剧。请分析输入的小说，输出两部分内容：
第一部分是【角色库】，格式如下：
角色1：林深 | 30岁男性，身穿黑色西装，戴黑手套，短发
角色2：快递员 | 25岁男性，身穿黄色工作服

第二部分是【分镜列表】，每个镜头用“镜头X”开头，明确指出出场角色：
镜头1
标题：推门瞬间
出场角色：林深
画面：林深戴着黑色皮手套轻轻推开一扇深色木门...
字幕：开门瞬间
配音：有人吗？闪达快递。
运镜：推镜头
BGM：悬疑` 
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

    // 1. 提取角色库
    const characters = [];
    const charSectionMatch = rawContent.match(/角色[库列表][:：]([\s\S]*?)(?=镜头\s*1|$)/i);
    if (charSectionMatch) {
      const charLines = charSectionMatch[1].split('\n').filter(l => l.includes('：') || l.includes('|'));
      charLines.forEach((line, idx) => {
        const parts = line.split(/[：|]/);
        if (parts.length >= 2) {
          characters.push({
            id: idx + 1,
            name: parts[1].trim(),
            appearance: parts[2] ? parts[2].trim() : '标准短剧造型，服装发型保持一致'
          });
        }
      });
    }

    if (characters.length === 0) {
      characters.push({
        id: 1,
        name: "主角",
        appearance: "精致面容，符合短剧风格，服装发型保持高度一致"
      });
    }

    // 2. 智能切分多个镜头
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
          bgm: getField('BGM') || '悬疑',
          character: getField('出场角色') || characters[0].name
        });
      });
    }

    // 可灵敏感词过滤
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

    // 3. Prompt 工厂：多平台专属提示词生成
    storyboards.forEach((s) => {
      const matchedChar = characters.find(c => c.name === s.character) || characters[0];
      const baseDesc = s.plot || s.title || '';
      const safeDesc = sanitizeForKling(baseDesc);
      const safeAppearance = sanitizeForKling(matchedChar.appearance);

      // 基础中文 Prompt
      s.prompt = `电影感摄影级别, 角色: ${matchedChar.name} (${matchedChar.appearance}), ${baseDesc}, 浅景深, 4K, 竖屏9:16`;

      // 可灵 / 即梦专版 (Kling & Jimeng)
      s.klingPrompt = `Cinematic masterwork, character: ${matchedChar.name} (${safeAppearance}), ${safeDesc}, shallow depth of field, 4K resolution, vertical 9:16, consistent character appearance.`;

      // Runway Gen-3 专版 (强调运镜与动态)
      s.runwayPrompt = `Dynamic motion shot, character: ${matchedChar.name}, ${safeDesc}, smooth ${s.cameraMovement}, cinematic lighting, 4K, photorealistic.`;

      // Google Veo 专版 (强调光影与叙事)
      s.veoPrompt = `Photorealistic vertical video, ${safeDesc}, highly detailed cinematography, dramatic atmosphere, 9:16 aspect ratio.`;

      // 剪映/通用生图版
      s.jianyingPrompt = `竖屏短剧画面：${baseDesc}，角色：${matchedChar.name}，高画质，电影质感。`;

      // 兼容旧字段
      s.englishPrompt = s.klingPrompt;
      s.videoPrompt = `Smooth ${s.cameraMovement}, cinematic atmosphere.`;
    });

    return res.status(200).json({ 
      content: "解析成功",
      v2Data: {
        characters: characters,
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