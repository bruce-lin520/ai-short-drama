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
      throw new Error('未配置 DEEPSEEK_API_KEY 环境变量');
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
            content: `你是一位专业短剧编剧。请将输入的内容拆解为短剧分镜。每个镜头请按以下格式输出，不要输出多余的Markdown标记：
镜头1
标题：xxx
画面：xxx
字幕：xxx
配音：xxx
运镜：中景推近
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

    let rawContent = data.choices?.[0]?.message?.content?.trim();
    if (!rawContent) throw new Error('DeepSeek 返回内容为空');

    // 极其健壮的文本解析，按“镜头”切分
    const sections = rawContent.split(/镜头\s*\d+/).filter(s => s.trim());
    const storyboards = [];

    if (sections.length === 0) {
      storyboards.push({
        shotNumber: 1,
        title: "镜头 1",
        plot: rawContent,
        subtitle: "",
        voiceover: "",
        cameraMovement: "固定",
        shotType: "中景",
        bgm: "平静"
      });
    } else {
      sections.forEach((sec, idx) => {
        const getField = (name) => {
          const match = sec.match(new RegExp(`${name}[：:]\\s*(.+)`, 'i'));
          return match ? match[1].trim() : '';
        };

        const plot = getField('画面') || sec.trim();
        storyboards.push({
          shotNumber: idx + 1,
          title: getField('标题') || `镜头 ${idx + 1}`,
          plot: plot,
          subtitle: getField('字幕'),
          voiceover: getField('配音'),
          cameraMovement: getField('运镜') || '固定',
          shotType: '中景',
          bgm: getField('BGM') || '平静'
        });
      });
    }

    // 本地极速拼接 Prompt
    storyboards.forEach((s) => {
      const baseDesc = s.plot || s.title || '';
      s.prompt = `电影感摄影级别, ${baseDesc}, 浅景深, 4K, 竖屏9:16`;
      s.englishPrompt = `Cinematic masterwork, ${baseDesc}, shallow depth of field, 4K resolution, vertical 9:16.`;
      s.videoPrompt = `Smooth ${s.cameraMovement}, cinematic atmosphere.`;
    });

    const parsedData = {
      characters: [],
      storyboards: storyboards
    };

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