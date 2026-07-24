export default async function handler(req, res) {
  // 设置 CORS 跨域头
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

  try {
    // 兼容解析请求体
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const promptText = body.prompt || body.text || '请分析以下剧情并拆分镜头分镜。';

    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: '未配置 DEEPSEEK_API_KEY 环境变量' });
    }

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
            content: '你是一位顶尖的短剧导演和分镜师。请根据输入的小说内容，将其拆解为适合AI绘图和视频生成的镜头分镜列表。'
          },
          {
            role: 'user',
            content: promptText
          }
        ],
        temperature: 0.7,
        stream: false
      })
    });

    const data = await apiResponse.json();

    if (!apiResponse.ok) {
      console.error('DeepSeek API Error Detail:', data);
      return res.status(apiResponse.status).json({
        error: data.error?.message || 'DeepSeek 请求拒绝'
      });
    }

    // 格式化输出供前端读取
    return res.status(200).json(data);

  } catch (error) {
    console.error('Server execution error:', error);
    return res.status(500).json({ error: error.message || '内部服务器错误' });
  }
}