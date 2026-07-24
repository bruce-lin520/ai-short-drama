export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { prompt } = req.body || {};
  
  // ⚠️ 请把这里的 sk-xxx 替换为你真正的 DeepSeek API Key！
  const apiKey = process.env.DEEPSEEK_API_KEY || 'sk-你的真实DeepSeek密钥';

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
          { role: 'system', content: '你是一位专业导演，请将输入的小说分析并生成分镜列表，以JSON格式返回。' },
          { role: 'user', content: prompt || '生成分镜' }
        ],
        stream: false
      })
    });

    if (!apiResponse.ok) {
      const errText = await apiResponse.text();
      console.error('DeepSeek Error:', errText);
      return res.status(500).json({ error: `DeepSeek 报错: ${apiResponse.status} - ${errText}` });
    }

    const data = await apiResponse.json();
    return res.status(200).json(data);

  } catch (error) {
    console.error('Text generation error:', error);
    return res.status(500).json({ error: error.message });
  }
}