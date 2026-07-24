import fetch from 'node-fetch';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { prompt } = req.body || {};
  const apiKey = process.env.DEEPSEEK_API_KEY || 'your-deepseek-api-key';

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

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
        stream: true
      })
    });

    if (!apiResponse.ok) {
      throw new Error(`DeepSeek API error: ${apiResponse.statusText}`);
    }

    apiResponse.body.on('data', (chunk) => {
      res.write(chunk);
    });
    apiResponse.body.on('end', () => {
      res.write('data: [DONE]\n\n');
      res.end();
    });
  } catch (error) {
    console.error('Text generation error:', error);
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    res.end();
  }
}