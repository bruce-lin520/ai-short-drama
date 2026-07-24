// aiService.js
class AIService {
  // 【重点】改成你自己的key，provider选 deepseek / kimi
  #API_KEY = "sk-替换成你的API密钥";
  #provider = "deepseek";

  getBaseUrl() {
    if(this.#provider === "deepseek") {
      return "https://api.deepseek.com/v1/chat/completions";
    }
    if(this.#provider === "kimi") {
      return "https://api.moonshot.cn/v1/chat/completions";
    }
  }
  getModelName() {
    if(this.#provider === "deepseek") return "deepseek-chat";
    if(this.#provider === "kimi") return "moonshot-v1-8k";
  }

  async generateShotScript(novelText) {
    const systemPrompt = `
你是专业短剧编剧，将用户提供的小说片段，转换成【短视频短剧拍摄分镜脚本】
严格遵守规则：
1. 输出格式清晰，按分镜序号排列
2. 每一条分镜包含：镜号｜画面描述｜台词｜镜头运镜｜时长
3. 适合竖屏短剧拍摄，节奏紧凑，冲突突出
4. 不要多余闲聊，直接输出分镜，不要前言后语
5. 如果原文篇幅长，自动拆分为连续剧情分镜
    `.trim();

    const messages = [
      {role: "system", content: systemPrompt},
      {role: "user", content: `小说原文：\n${novelText}`}
    ]

    const res = await fetch(this.getBaseUrl(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.#API_KEY}`
      },
      body: JSON.stringify({
        model: this.getModelName(),
        messages,
        temperature: 0.7
      })
    })

    if(!res.ok) {
      const errData = await res.json().catch(()=>{});
      throw new Error(`接口请求失败：${res.status}, ${errData?.error?.message || "未知错误"}`)
    }

    const data = await res.json();
    return data.choices[0].message.content.trim();
  }
}

window.aiService = new AIService();
/**
 * 调用后端接口优化 Prompt
 * @param {string} rawText 原始的画面或场景描述
 * @param {string} style 风格模板（如：写实电影风、赛博朋克等）
 */
export async function optimizePrompt(rawText, style) {
  try {
    const response = await fetch('/api/optimize-prompt', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ rawText, style }),
    });

    const result = await response.json();
    if (result.success) {
      return result.data; // 返回包含中英文 Prompt、运镜、BGM 建议的完整 JSON 对象
    } else {
      throw new Error(result.message || '优化失败');
    }
  } catch (error) {
    console.error('Prompt 优化请求出错:', error);
    return null;
  }
}