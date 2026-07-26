<template>
  <div class="app-container">
    <header class="app-header">
      <h1>🎬 AI 智能小说分镜与视频提示词工厂</h1>
      <p class="subtitle">支持多平台（可灵、即梦、Runway、剪映）一键生成与 AI 导演全局统筹（建议单次输入 1000-2000 字）</p>
    </header>

    <div class="main-content-layout">
      <!-- 左侧输入与控制区 -->
      <div class="left-panel">
        <div class="input-card">
          <div class="input-header-row">
            <h3>📖 输入小说或剧本正文</h3>
            <div class="input-tools">
              <span class="word-count" :style="{ color: store.novelText.length > 2000 ? '#ef4444' : '#9ca3af' }">
                {{ store.novelText.length }} / 2000 字
              </span>
              <button class="btn-clear-text" @click="store.novelText = ''; errorMessage = ''" title="清空输入框">
                🗑️ 清空
              </button>
            </div>
          </div>

          <textarea 
            v-model="store.novelText" 
            placeholder="在此粘贴或输入您的小说文本内容（建议控制在 1000-2000 字以内，避免 Token 过载）..." 
            rows="8"
            maxlength="2000"
            @input="errorMessage = ''"
          ></textarea>
          
          <div class="action-row">
            <button 
              class="btn-generate" 
              @click="handleGenerateClick" 
              :disabled="store.isLoading"
            >
              {{ store.isLoading ? '⏳ 正在生成分镜中 (约需几十秒)...' : '🚀 开始生成全套分镜' }}
            </button>
          </div>
          <!-- 动态错误提示（使用本地状态控制） -->
          <div class="error-tip" v-if="errorMessage">
            {{ errorMessage }}
          </div>
        </div>

        <!-- 角色库管理区 -->
        <div class="character-card">
          <h3>👥 固定角色设定库</h3>
          <div class="character-list">
            <div v-for="char in store.v2Data.characters" :key="char.id" class="character-item">
              <input type="text" v-model="char.name" placeholder="角色名" class="char-name-input" />
              <input type="text" v-model="char.description" placeholder="外貌及服装特征..." class="char-desc-input" />
              <button class="btn-del-char" @click="store.removeCharacter(char.id)">❌</button>
            </div>
          </div>
          <button class="btn-add-char" @click="store.addCharacter({ name: '新角色', description: '' })">
            ➕ 添加新角色
          </button>
        </div>
      </div>

      <!-- 右侧展示与导演模式统筹区 -->
      <div class="right-panel">
        <!-- 全局导演统筹面板 -->
        <DirectorPanel />

        <!-- 核心分镜列表组件 -->
        <div class="storyboard-view-wrapper">
          <StoryboardView :currentStyle="currentStyle" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useStoryboardStore } from './stores/storyboardStore';
import StoryboardView from './components/StoryboardView.vue';
import DirectorPanel from './components/DirectorPanel.vue';

const store = useStoryboardStore();
const currentStyle = ref('电影写实风');

// 使用本地 ref 管理错误提示信息
const errorMessage = ref('');

// 修复后的点击生成按钮逻辑：必须将 store.novelText 作为参数传给 store.generateStoryboard
const handleGenerateClick = async () => {
  if (!store.novelText || !store.novelText.trim()) {
    errorMessage.value = "请输入需要转换的小说文本！";
    return;
  }
  if (store.novelText.length > 2000) {
    errorMessage.value = "输入内容超过 2000 字限制，请精简后重试！";
    return;
  }
  errorMessage.value = '';
  
  try {
    console.log("🚀 正在触发生成分镜，提交文本：", store.novelText);
    // 关键修复：把文本传进去，而不是空的
    await store.generateStoryboard(store.novelText);
  } catch (err) {
    console.error("生成分镜出错：", err);
    errorMessage.value = "生成失败，请检查控制台错误";
  }
};
</script>

<style>
body {
  margin: 0;
  background: #0f0f11;
  color: #e2e8f0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

.app-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 16px;
  box-sizing: border-box;
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  margin-bottom: 12px;
}

.app-header h1 {
  margin: 0 0 4px 0;
  font-size: 20px;
  color: #fff;
}

.subtitle {
  margin: 0;
  font-size: 12px;
  color: #9ca3af;
}

.main-content-layout {
  display: grid;
  grid-template-columns: 380px 1fr;
  gap: 16px;
  flex: 1;
  overflow: hidden;
}

.left-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow-y: auto;
}

.right-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow: hidden;
}

.input-card, .character-card {
  background: #18181c;
  border: 1px solid #2d2d35;
  border-radius: 12px;
  padding: 14px;
}

.input-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.input-card h3, .character-card h3 {
  margin: 0;
  font-size: 14px;
  color: #cbd5e1;
}

.input-tools {
  display: flex;
  align-items: center;
  gap: 8px;
}

.word-count {
  font-size: 11px;
}

.btn-clear-text {
  background: #27272a;
  border: 1px solid #3f3f46;
  color: #a1a1aa;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-clear-text:hover {
  background: #3f3f46;
  color: #fff;
}

.input-card textarea {
  width: 100%;
  background: #121214;
  border: 1px solid #33333d;
  color: #fff;
  border-radius: 8px;
  padding: 10px;
  font-size: 13px;
  box-sizing: border-box;
  resize: vertical;
  outline: none;
}

.action-row {
  margin-top: 10px;
}

.btn-generate {
  width: 100%;
  background: linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%);
  color: #fff;
  border: none;
  padding: 10px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  transition: opacity 0.2s;
}

.btn-generate:hover:not(:disabled) {
  opacity: 0.9;
}

.btn-generate:disabled {
  background: #373740;
  color: #71717a;
  cursor: not-allowed;
}

.error-tip {
  margin-top: 8px;
  font-size: 12px;
  color: #ef4444;
}

.character-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 10px;
}

.character-item {
  display: flex;
  gap: 6px;
  align-items: center;
}

.char-name-input {
  width: 90px;
  background: #121214;
  border: 1px solid #33333d;
  color: #fff;
  padding: 4px 6px;
  border-radius: 6px;
  font-size: 12px;
  outline: none;
}

.char-desc-input {
  flex: 1;
  background: #121214;
  border: 1px solid #33333d;
  color: #fff;
  padding: 4px 6px;
  border-radius: 6px;
  font-size: 12px;
  outline: none;
}

.btn-del-char {
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 12px;
}

.btn-add-char {
  width: 100%;
  background: #27272a;
  color: #cbd5e1;
  border: 1px dashed #3f3f46;
  padding: 6px;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
}

.btn-add-char:hover {
  background: #323238;
}

.storyboard-view-wrapper {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
</style>