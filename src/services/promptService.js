// Prompt 集中管理服务模块
// 职责：统一构建和维护传给 LLM 的系统级和任务级 Prompt，页面严格禁止直接拼接字符串

class PromptService {
  /**
   * 生成短剧分镜分析提示词
   * @param {string} novel - 小说原文
   * @returns {string} 格式化后的 Prompt
   */
  storyboardPrompt(novel) {
    return `你是一位资深影视编剧、分镜导演及 AI 视频生成专家。请将以下小说内容解析为专业影视短剧的分镜剧本，并严格按照指定 Markdown 格式输出。

【小说原文】
${novel}

--------------------------------------------------
请严格遵守以下输出结构与格式要求，不得随意删减大标题：

# 人物列表
对文中主要人物进行精细化设定，每个人物包含：
- 姓名：
- 年龄：
- 身份：
- 职业：
- 性格：
- 外貌：
- 人物关系：
- 角色定位：

# 场景列表
提取全剧所有核心场景，例如：医院、办公室、出租屋、酒吧、学校、咖啡厅、高铁站、地下车库、别墅、警察局等。

# 剧情拆分
按照影视剧分幕方式拆分（每一幕包含如下字段）：
## 第一幕
剧情：
人物：
场景：
情绪：
冲突：
镜头建议：
旁白：

## 第二幕
...（依此类推拆分完整剧情）

# AI 视频 Prompt
为每一幕分别生成适配主流 AI 视频生成模型（可灵 AI、即梦 AI、Runway、Google Veo、Pika、Luma）的电影级Prompt。
要求：
1. 必须采用专业的电影级视觉描述，包含：镜头语言、摄影机运动、景深、灯光、色彩、人物动作、服装、电影感、构图、环境、氛围、画面比例、真实摄影风格。
2. 绝对不要输出任何解释说明、序言或结语，仅输出标准的电影级视频生成 Prompt 文本。`;
  }

  /**
   * 预留：生成角色一致性 Prompt (后续扩展)
   */
  characterConsistencyPrompt(characterInfo) {
    return `请根据以下角色描述生成一致性角色 Prompt：${JSON.stringify(characterInfo)}`;
  }

  /**
   * 预留：生成视频生成专用 Prompt (后续扩展)
   */
  videoGenerationPrompt(sceneDescription) {
    return `电影级视频 Prompt：${sceneDescription}`;
  }
}

export default new PromptService();