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
        content: `### 镜头 1\n画面描述：未配置 DEEPSEEK_API_KEY 环境变量`
      });
    }

    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat', // 使用性价比更高、速度更快的模型
        messages: [
          { 
            role: 'system', 
            content: `你是一位专业短剧编剧。请分析输入的小说，输出一个纯 JSON 对象（不要包裹在markdown中），包含：
1. "characters": 角色库数组 (id, name, appearance)
2. "storyboards": 镜头列表数组，每个镜头包含：
   - shotNumber: 镜头编号
   - title: 标题
   - duration: 时长(如 "3s")
   - plot: 详细剧情与画面描述
   - subtitle: 内嵌字幕
   - voiceover: 配音旁白
   - coreAction: 核心人物动作与表情（简短精炼）
   - cameraMovement: 镜头运动(推、拉、摇、移、固定)
   - shotType: 景别(特写、近景、中景、远景)
   - bgm: BGM建议` 
          },
          { role: 'user', content: userContent }
        ],
        stream: false,
        temperature: 0.3 // 降低随机性，提升生成速度
      })
    });

    const textResult = await response.text();
    let data;
    try {
      data = JSON.parse(textResult);
    } catch (e) {
      throw new Error(`API 返回非 JSON 数据`);
    }

    let rawContent = data.choices?.[0]?.message?.content?.trim();
    if (!rawContent) throw new Error('返回空内容');

    rawContent = rawContent.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/, '');
    let parsedData = JSON.parse(rawContent);

    // 【本地极速拼接 Prompt，不耗费 AI 生成时间】
    if (parsedData.storyboards && Array.isArray(parsedData.storyboards)) {
      parsedData.storyboards.forEach(s => {
        const baseDesc = s.plot || s.title || '';
        const action = s.coreAction || '';
        // 本地模板拼接，瞬间完成
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
      content: `### 镜头 1\n画面描述：生成失败 - ${error.message}`
    });
  }
}