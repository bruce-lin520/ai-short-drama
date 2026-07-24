export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const userContent = String(body.prompt || body.text || body.content || '').trim();

    if (!userContent) {
      return res.status(200).json({ error: '接收到的文本为空，请检查前端传参字段' });
    }

    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      return res.status(200).json({ error: 'Vercel 环境变量 DEEPSEEK_API_KEY 未配置' });
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
    
    // 统一返回 200，确保前端能够拿到完整的 JSON 错误或成功信息，避免浏览器在控制台直接拦截 400
    return res.status(200).json(data);

  } catch (error) {
    return res.status(200).json({ error: error.toString() });
  }
}