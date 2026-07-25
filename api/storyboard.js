export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const userContent = body?.prompt || "老有人开门。";
    const apiKey = process.env.DEEPSEEK_API_KEY;

    if (!apiKey) {
      return res.status(200).json({
        content: `### 镜头 1\n画面描述：未配置 DEEPSEEK_API_KEY，请在 Vercel 环境变量中设置。\n镜头设计：固定镜头\n氛围情绪：平静\n画面提示词：Error`
      });
    }

    // 调用 DeepSeek API
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
            content: '你是一位专业短剧导演。请严格按照以下 Markdown 格式拆解小说文本，不要包含任何 JSON 代码块标记：\n\n### 镜头 1\n场景地点：客厅\n出场人物：林深，苏晚\n画面描述：林深坐在沙发上看着苏晚。\n镜头设计：中景推近\n氛围情绪：压抑\n画面提示词：A cinematic shot of...' 
          },
          { role: 'user', content: userContent }
        ],
        stream: false,
        temperature: 0.6
      })
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`DeepSeek API 错误: ${response.status} ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    // 提取 AI 返回的纯文本内容
    const aiContent = data.choices?.[0]?.message?.content?.trim();

    // **关键点**：直接返回包装好的 Markdown 文本对象
    if (aiContent) {
        return res.status(200).json({ content: aiContent });
    } else {
        throw new Error('DeepSeek 返回了空内容');
    }

  } catch (error) {
    console.error('生成分镜出错:', error);
    // 发生错误时，也返回一个格式化的错误分镜，避免前端崩溃
    return res.status(200).json({ 
      content: `### 镜头 1\n画面描述：生成失败 - ${error.message.substring(0, 100)}\n镜头设计：固定镜头\n氛围情绪：悲伤\n画面提示词：Error`
    });
  }
}