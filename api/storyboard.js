export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).json({ status: 'ok' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch (e) { body = {}; }
    }
    const userContent = body?.prompt || body?.text || "老有人开门。";
    const apiKey = process.env.DEEPSEEK_API_KEY;

    if (!apiKey) {
      return res.status(200).json({
        content: `### 镜头 1\n画面描述：未配置 DEEPSEEK_API_KEY 环境变量\n镜头设计：固定镜头\n氛围情绪：平静\n画面提示词：Error`
      });
    }

    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-v4-pro',
        messages: [
          { 
            role: 'system', 
            content: `你是一位殿堂级AI短剧导演兼视觉架构师。请深入分析输入的小说文本，输出一个标准的 JSON 对象（直接输出纯JSON字符串，不要包裹在markdown代码块中），包含：
1. "characters": 角色库数组（提取或识别登场人物，确保包含 id, name, age, gender, appearance, hair, clothing, personality, fixedPrompt）。
2. "storyboards": 镜头列表数组，每个镜头必须具备极高质量的专业字段：
   - shotNumber: 镜头编号(数字)
   - title: 镜头核心标题
   - duration: 时长(如 "3s", "5s")
   - plot: 详细剧情描述
   - characterId: 关联的角色ID或姓名
   - subtitle: 影视画面内嵌字幕
   - voiceover: 旁白/配音稿
   - imagePrompt: 专业生图Prompt（必须严格包含：摄影风格、环境、时间、人物年龄、外貌特征、服装、核心动作、情绪表情、灯光、摄影机位、浅景深、4K、竖屏9:16，并显式加入保持该角色外貌、服装和脸部特征一致的设定，防止AI人物漂移）
   - videoPrompt: 专业的视频运动Prompt（必须包含：镜头运动方式如缓慢推进/拉远/侧移、人物微动作、环境动态变化、氛围情绪营造、节奏控制）
   - cameraMovement: 镜头运动(推、拉、摇、移、跟拍、固定)
   - shotType: 景别(特写、近景、中景、远景)
   - bgm: BGM氛围建议
   - status: "pending"` 
          },
          { role: 'user', content: userContent }
        ],
        stream: false
      })
    });

    const textResult = await response.text();
    let data;
    try {
      data = JSON.parse(textResult);
    } catch (e) {
      throw new Error(`API 返回非 JSON 数据: ${textResult.substring(0, 100)}`);
    }

    if (!response.ok) {
      throw new Error(data.error?.message || `API 请求失败，状态码: ${response.status}`);
    }

    let rawContent = data.choices?.[0]?.message?.content?.trim();
    if (!rawContent) {
      throw new Error('DeepSeek 返回了空内容');
    }

    // 清洗可能存在的 markdown 标记
    rawContent = rawContent.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/, '');

    let parsedData;
    try {
      parsedData = JSON.parse(rawContent);
    } catch (err) {
      return res.status(200).json({ content: rawContent });
    }

    if (parsedData.storyboards && Array.isArray(parsedData.storyboards)) {
      let markdownOutput = parsedData.storyboards.map(s => {
        return `### 镜头 ${s.shotNumber}：${s.title || ''}\n` +
               `场景地点：室内客厅\n` +
               `出场人物：${s.characterId || '主角色'}\n` +
               `画面描述：${s.plot || ''}\n` +
               `字幕：${s.subtitle || ''}\n` +
               `配音稿：${s.voiceover || ''}\n` +
               `镜头设计：${s.shotType || '中景'} | ${s.cameraMovement || '固定镜头'}\n` +
               `氛围情绪：${s.bgm || '悬疑/平静'}\n` +
               `画面提示词：${s.imagePrompt || ''}\n` +
               `视频提示词：${s.videoPrompt || ''}`;
      }).join('\n\n---\n\n');

      return res.status(200).json({ 
        content: markdownOutput,
        v2Data: parsedData 
      });
    }

    return res.status(200).json({ content: rawContent });

  } catch (error) {
    console.error('API 异常:', error.message);
    return res.status(200).json({
      content: `### 镜头 1\n画面描述：生成失败 - ${error.message}\n镜头设计：固定镜头\n氛围情绪：悲伤\n画面提示词：Error`
    });
  }
}