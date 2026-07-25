export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch (e) { body = {}; }
    }
    body = body || {};

    const userContent = body.prompt || body.text || body.content || "老有人开门。";
    const apiKey = process.env.DEEPSEEK_API_KEY;

    if (!apiKey) {
      return res.status(200).json({
        choices: [{ message: { content: "### 镜头 1\n画面描述：未配置 DEEPSEEK_API_KEY\n镜头设计：固定镜头\n氛围情绪：平静\n画面提示词：Error" } }]
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
            content: '你是一位专业短剧导演。请将输入的小说内容拆分为多个分镜。每一个分镜必须严格按照以下格式输出，不要使用纯 JSON：\n\n### 镜头 1\n场景地点：客厅\n出场人物：林深，苏晚\n画面描述：林深坐在沙发上看着苏晚。\n镜头设计：中景推近\n氛围情绪：压抑\n画面提示词：A cinematic shot of...' 
          },
          { role: 'user', content: userContent }
        ],
        stream: false
      })
    });

    const data = await response.json();
    return res.status(200).json(data);

  } catch (error) {
    return res.status(200).json({
      choices: [{ message: { content: `### 镜头 1\n画面描述：服务器异常: ${error.message}\n镜头设计：固定镜头\n氛围情绪：平静\n画面提示词：Error` } }]
    });
  }
}