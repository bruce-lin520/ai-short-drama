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
        content: `### 镜头 1\n画面描述：未配置 DEEPSEEK_API_KEY 环境变量\n镜头设计：固定镜头\n氛围情绪：平静\n画面提示词：Error`
      });
    }

    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-v4-pro', // 修正为错误提示中要求的模型名称
        messages: [
          { 
            role: 'system', 
            content: '你是一位专业短剧导演。请严格按照以下 Markdown 格式拆解小说文本，不要包含任何 JSON 代码块标记：\n\n### 镜头 1\n场景地点：客厅\n出场人物：林深，苏晚\n画面描述：林深坐在沙发上看着苏晚。\n镜头设计：中景推近\n氛围情绪：压抑\n画面提示词：A cinematic shot of...' 
          },
          { role: 'user', content: userContent }
        ],
        stream: false
      })
    });

    const textResult = await response.text();
    let data;
    try {
      data = JSON.parse(textResult);
    } catch (e) {
      throw new Error(`API 返回非 JSON 数据: ${textResult.substring(0, 100)}`);
    }

    if (!response.ok) {
      throw new Error(data.error?.message || `API 请求失败，状态码: ${response.status}`);
    }

    const aiContent = data.choices?.[0]?.message?.content?.trim();
    if (aiContent) {
      return res.status(200).json({ content: aiContent });
    } else {
      throw new Error('DeepSeek 返回了空内容');
    }

  } catch (error) {
    console.error('API 异常:', error.message);
    return res.status(200).json({
      content: `### 镜头 1\n画面描述：生成失败 - ${error.message}\n镜头设计：固定镜头\n氛围情绪：悲伤\n画面提示词：Error`
    });
  }
}