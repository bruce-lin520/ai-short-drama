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

    const userContent = body.prompt || body.text || body.content || "默认测试文本：老有人开门。";
    const apiKey = process.env.DEEPSEEK_API_KEY;

    if (!apiKey) {
      return res.status(200).json({
        choices: [{ message: { content: "分镜1：\n画面：未配置环境变量\n台词：请在Vercel后台配置DEEPSEEK_API_KEY" } }]
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
          { role: 'system', content: '你是一位专业导演，请将输入的小说内容拆分为具体的镜头分镜列表。' },
          { role: 'user', content: userContent }
        ],
        stream: false
      })
    });

    const data = await response.json();
    return res.status(200).json(data);

  } catch (error) {
    return res.status(200).json({
      choices: [{ message: { content: `生成出错: ${error.message}` } }]
    });
  }
}