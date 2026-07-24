export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { prompt } = req.body || {};
  // 请确保这里或 Vercel 后台填上了正确的 DeepSeek Key
  const apiKey = process.env.DEEPSEEK_API_KEY || 'sk-your-deepseek-key-here';

  try {
    const apiResponse = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: prompt }],
        stream: false
      })
    });

    if (!apiResponse.ok) {
      const errText = await apiResponse.text();
      return res.status(500).json({ error: `DeepSeek 报错: ${apiResponse.status} - ${errText}` });
    }

    const data = await apiResponse.json();
    return res.status(200).json(data);

  } catch (error) {
    console.error('Text generation error:', error);
    return res.status(500).json({ error: error.message });
  }
}