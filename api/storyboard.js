export default async function handler(req, res) {
  // 设置 CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { prompt } = req.body || {};
  const apiKey = process.env.DEEPSEEK_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ 
      error: '环境变量中未找到 DEEPSEEK_API_KEY，请在 Vercel 后台配置并重新部署。' 
    });
  }

  try {
    const apiResponse = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: '你是一位专业导演，请将小说内容拆分为结构化的分镜列表。' },
          { role: 'user', content: prompt || '请分析分镜' }
        ],
        stream: false
      })
    });

    const data = await apiResponse.json();

    if (!apiResponse.ok) {
      console.error('DeepSeek Returned Error:', data);
      return res.status(apiResponse.status).json({ 
        error: data.error?.message || 'DeepSeek 请求拒绝' 
      });
    }

    return res.status(200).json(data);

  } catch (error) {
    console.error('Server catch error:', error);
    return res.status(500).json({ error: error.message || '内部服务器错误' });
  }
}