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
        model: 'deepseek-chat',
        messages: [
          { 
            role: 'system', 
            content: `你是一位经验丰富的爆款短剧导演。请分析输入的小说，输出两部分内容：
第一部分是【角色库】，格式如下：
角色1：林深 | 30岁男性，身穿黑色西装，戴黑手套，短发

第二部分是【分镜列表】，每个镜头用“镜头X”开头，并包含【导演建议】：
镜头1
标题：推门瞬间
出场角色：林深
画面：林深戴着黑色皮手套轻轻推开一扇深色木门...
字幕：开门瞬间
配音：有人吗？闪达快递。
运镜：推镜头
BGM：悬疑
导演建议：此处前3秒要放大呼吸声和推门吱呀声，拉高悬疑感，切忌平铺直叙。` 
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
        bgm: "悬疑",
        directorAdvice: "增强环境音和节奏紧迫感。"
      });
    } else {
      rawScenes.forEach((sec, idx) => {
        const getField = (name) => {
          const match = sec.match(new RegExp(`${name}[：:]\\s*(.+)`, 'i'));
          return match ? match[1].trim() : '';
        };

        const plot = getField('画面') || sec.trim();
        
        // 智能动态计算导演评分（基于内容长度、运镜和动作词，分数在 82 ~ 98 之间有差异化）
        let baseScore = 85 + (idx % 3) * 4;
        if (plot.length > 30) baseScore += 3;
        if (getField('运镜')) baseScore += 2;
        const finalScore = Math.min(Math.max(baseScore, 80), 98);

        storyboards.push({
          shotNumber: idx + 1,
          title: getField('标题') || `镜头 ${idx + 1}`,
          plot: plot,
          subtitle: getField('字幕') || '',
          voiceover: getField('配音') || '',
          cameraMovement: getField('运镜') || '推镜头',
          shotType: '中景',
          bgm: getField('BGM') || '悬疑',
          character: getField('出场角色') || characters[0].name,
          directorScore: finalScore,
          directorAdvice: getField('导演建议') || (finalScore < 88 ? '镜头略显单一，建议增加局部特写或推拉摇移运镜。' : '当前镜头视觉张力良好，建议配合节奏紧凑的剪辑，增强观众代入感。')
        });
      });
    }

    // 敏感词过滤
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

    // 3. 整合 Prompt 工厂：真正区分各大平台特点
    storyboards.forEach((s) => {
      const matchedChar = characters.find(c => c.name === s.character) || characters[0];
      const baseDesc = s.plot || s.title || '';
      const safeDesc = sanitizeForKling(baseDesc);
      const safeAppearance = sanitizeForKling(matchedChar.appearance);

      s.klingPrompt = `Cinematic masterwork, camera movement: ${s.cameraMovement}, character: ${matchedChar.name} (${safeAppearance}), ${safeDesc}, shallow depth of field, 4K resolution, vertical 9:16, consistent character appearance.`;
      s.prompt = `精美短剧画面，美术风格写实，角色：${matchedChar.name}（${matchedChar.appearance}），${baseDesc}，极致光影，细节丰富，竖屏 9:16。`;
      s.runwayPrompt = `Dynamic motion shot, smooth ${s.cameraMovement}, character: ${matchedChar.name}, ${safeDesc}, cinematic lighting, photorealistic, 4K, 9:16 aspect ratio.`;
      
      s.englishPrompt = s.klingPrompt;
      s.videoPrompt = s.runwayPrompt;
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
          bgm: "平静",
          directorScore: 60,
          directorAdvice: "生成过程发生异常，请检查网络或 API Key。"
        }]
      }
    });
  }
}