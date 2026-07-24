// src/services/aiService.js
import promptService from './promptService.js';

class AIService {
  /**
   * 生成短剧分镜（流式打字输出）
   * @param {string} novelText - 小说原文
   * @param {function} onChunk - 收到流式数据块的回调
   */
  async generateStoryboard(novelText, onChunk) {
    if (!novelText || !novelText.trim()) {
      throw new Error('小说输入内容不能为空');
    }

    const prompt = promptService.storyboardPrompt(novelText);

    const response = await fetch('/api/storyboard', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    });

    if (!response.ok) {
      throw new Error(`请求失败: ${response.statusText}`);
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
          if (dataStr === '[DONE]') return;

          try {
            const parsed = JSON.parse(dataStr);
            if (parsed.error) throw new Error(parsed.error);
            if (parsed.content && onChunk) {
              onChunk(parsed.content);
            }
          } catch (e) {
            // 忽略中间非完整 JSON 行
          }
        }
      }
    }
  }

  // 后续预留接口占位（符合 Class 声明语法）
  async generateCharacter() {}
  async generateImage() {}
  async generateVideoPrompt() {}
  async generateCharacterConsistency() {}
  async generateStoryboardImages() {}
  async generateVoice() {}
  async generateSubtitle() {}
  async generateJSON() {}
  async generateExcel() {}
  async generateKlingTask() {}
  async generateJimengTask() {}
  async generateRunwayTask() {}
  async generateVeoTask() {}
}

export default new AIService();
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