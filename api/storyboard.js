export default async function handler(req, res) {
  // 设置 CORS 跨域头
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { prompt } = req.body || {};
  // 请确保这里的 sk-xxx 替换成了你在 DeepSeek 后台创建的真实 API Key
  const apiKey = process.env.DEEPSEEK_API_KEY || 'sk-你的真实DeepSeekKey';

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
          {
            role: 'system',
            content: '你是一位专业导演，请将小说内容拆分为结构化的分镜列表。'
          },
          { role: 'user', content: prompt }
        ],
        stream: false
      })
    });

    const data = await apiResponse.json();

    if (!apiResponse.ok) {
      console.error('DeepSeek Error Details:', data);
      return res.status(apiResponse.status).json({ 
        error: data.error?.message || 'DeepSeek 请求失败' 
      });
    }

    // 成功返回 JSON 结果
    return res.status(200).json(data);

  } catch (error) {
    console.error('Server Catch Error:', error);
    return res.status(500).json({ error: error.message || '服务器内部错误' });
  }
}