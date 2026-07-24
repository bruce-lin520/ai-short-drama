// server/services/modelService.js
// 真实 AI 接口调用逻辑：读取前端发来的真实 Prompt 并生成对应分镜

class ModelService {
  /**
   * SSE 流式 Chat 接口
   */
  async chatStream(prompt, res) {
    // 1. 从环境变量获取 API Key，或者填入你的真实 Key
    const apiKey = process.env.DEEPSEEK_API_KEY || ''; 

    // 如果配置了 API Key，直接调用 DeepSeek 真实模型 API
    if (apiKey) {
      try {
        const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: 'deepseek-chat',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7,
            stream: true // 开启真实流式传输
          })
        });

        if (!response.ok) {
          throw new Error(`API 响应错误: ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const dataStr = line.replace('data: ', '').trim();
              if (dataStr === '[DONE]') {
                res.write('data: [DONE]\n\n');
                res.end();
                return;
              }
              try {
                const parsed = JSON.parse(dataStr);
                const content = parsed.choices[0]?.delta?.content || '';
                if (content) {
                  res.write(`data: ${JSON.stringify({ content })}\n\n`);
                }
              } catch (e) {
                // 忽略解析中间块
              }
            }
          }
        }
        res.write('data: [DONE]\n\n');
        res.end();
        return;
      } catch (err) {
        console.error('❌ 调用真实 API 失败，请检查 API Key 或网络环境:', err.message);
      }
    }

    // 2. 如果没有配置 API Key，将根据用户输入的小说内容进行智能动态拟合输出（不写死陆云州）
    console.warn('⚠️ 未检测到有效的 DEEPSEEK_API_KEY，进入动态分析模式...');
    return this.dynamicMockStream(prompt, res);
  }

  /**
   * 动态无 Key 模式：提取用户输入的小说关键词，动态生成不重样的分镜演示
   */
  async dynamicMockStream(prompt, res) {
    // 从 prompt 文本里粗略提取小说输入内容
    const rawTextMatch = prompt.match(/小说原文：([\s\S]*)/);
    const novelText = rawTextMatch ? rawTextMatch[1].trim() : prompt;
    
    // 提取第一行或前几个词作为角色/剧情暗示
    const firstLine = novelText.split('\n')[0] || '主角';
    const mainCharMatch = novelText.match(/[\u4e00-\u9fa5]{2,4}(?=[：:，,说道看着])/);
    const mainChar = mainCharMatch ? mainCharMatch[0] : '文中主角';

    const dynamicContent = `# 人物列表

## ${mainChar}
- 姓名：${mainChar}
- 身份：根据文本提取的核心人物
- 角色定位：主角
- 分析状态：根据输入文本分析生成

---

# 场景列表
1. 小说开场主要场景
2. 剧情转折核心场景

---

# 剧情拆分

## 第一幕
剧情：${novelText.slice(0, 100)}...
人物：${mainChar}
场景：主场景
镜头建议：中景推近，表现人物表情变化。

---

> 💡 **提示**：目前处于“无 API Key 动态模式”。若想体验 100% 真实的大模型深度剧情拆解，请在后端 \`.env\` 文件中配置你的 \`DEEPSEEK_API_KEY\`。`;

    const chunkSize = 12;
    for (let i = 0; i < dynamicContent.length; i += chunkSize) {
      const chunk = dynamicContent.slice(i, i + chunkSize);
      res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
      await new Promise((resolve) => setTimeout(resolve, 25));
    }
    res.write('data: [DONE]\n\n');
    res.end();
  }
}

export default new ModelService();