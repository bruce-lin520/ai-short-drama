export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).json({ status: 'ok' });
  try {
    let body = req.body;
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
    const userContent = body?.prompt || body?.text || "老有人开门。";
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) return res.status(200).json({ content: "### 镜头 1\n画面描述：未配置 DEEPSEEK_API_KEY\n镜头设计：固定镜头\n氛围情绪：平静\n画面提示词：Error" });
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'deepseek-v4-pro',
        messages: [
          { role: 'system', content: '你是一位专业短剧导演。请严格按照以下 Markdown 格式拆解小说文本，不要包含任何 JSON 代码块标记：\n\n### 镜头 1\n场景地点：客厅\n出场人物：林深，苏晚\n画面描述：林深坐在沙发上看着苏晚。' },
          { role: 'user', content: userContent }
        ],
        stream: false
      })
    });
    const textResult = await response.text();
    let data = JSON.parse(textResult);
    if (!response.ok) throw new Error(data.error?.message || 'API 请求失败');
    const aiContent = data.choices?.[0]?.message?.content?.trim();
    return res.status(200).json({ content: aiContent || '无内容' });
  } catch (error) {
    return res.status(200).json({ content: `### 镜头 1\n画面描述：生成失败 - ${error.message}\n镜头设计：固定镜头\n氛围情绪：悲伤\n画面提示词：Error` });
  }
}