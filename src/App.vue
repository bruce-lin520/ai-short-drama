<template>
  <div class="main-layout">
    <!-- 左侧：小说文本输入 & 提炼控制区 -->
    <div class="left-panel">
      <div class="panel-header">
        <h2>📖 小说文本输入</h2>
      </div>
      
      <!-- 全局风格模板选择器 -->
      <div class="style-selector-group">
        <label>🎨 视觉风格模板：</label>
        <select v-model="selectedStyle" class="style-select">
          <option value="电影写实风">电影写实风 (Cinematic Realism)</option>
          <option value="赛博朋克">赛博朋克 (Cyberpunk)</option>
          <option value="国风水墨">国风水墨 (Chinese Ink & Wash)</option>
          <option value="动漫二次元">动漫二次元 (Anime / 2D)</option>
          <option value="暗黑奇幻">暗黑奇幻 (Dark Fantasy)</option>
        </select>
      </div>

      <textarea 
        v-model="store.novelText"
        class="novel-input" 
        placeholder="请在此处粘贴需要拆解的小说原文内容..."
      ></textarea>

      <div class="action-bar">
        <button 
          class="btn-generate" 
          :disabled="store.isLoading || !store.novelText.trim()"
          @click="store.generateStoryboard"
        >
          {{ store.isLoading ? '⚡ AI 正在拆解中...' : '🚀 开始生成分镜' }}
        </button>
      </div>

      <div v-if="store.errorMessage" class="error-msg">
        ❌ {{ store.errorMessage }}
      </div>
    </div>

    <!-- 右侧：分镜表格 & 导出预览区 -->
    <div class="right-panel">
      <!-- 将全局选中的风格传递给子组件 -->
      <StoryboardView :currentStyle="selectedStyle" />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useStoryboardStore } from './stores/storyboardStore';
import StoryboardView from './components/StoryboardView.vue';

const store = useStoryboardStore();

// 定义全局默认风格
const selectedStyle = ref('电影写实风');
</script>

<style scoped>
.main-layout {
  display: flex;
  height: 100vh;
  width: 100vw;
  background-color: #121214;
  color: #fff;
  overflow: hidden;
  box-sizing: border-box;
}

.left-panel {
  width: 400px;
  min-width: 320px;
  background: #18181c;
  border-right: 1px solid #2d2d35;
  display: flex;
  flex-direction: column;
  padding: 16px;
  box-sizing: border-box;
}

.panel-header h2 {
  margin: 0 0 12px 0;
  font-size: 16px;
  color: #e2e8f0;
}

.style-selector-group {
  margin-bottom: 12px;
}

.style-selector-group label {
  font-size: 12px;
  color: #a1a1aa;
  margin-bottom: 4px;
  display: block;
}

.style-select {
  width: 100%;
  background: #0f0f11;
  border: 1px solid #33333d;
  color: #e2e8f0;
  padding: 8px;
  border-radius: 6px;
  font-size: 13px;
  outline: none;
  box-sizing: border-box;
}

.novel-input {
  flex: 1;
  width: 100%;
  background: #0f0f11;
  border: 1px solid #33333d;
  border-radius: 8px;
  padding: 12px;
  color: #e2e8f0;
  font-size: 14px;
  resize: none;
  outline: none;
  box-sizing: border-box;
  font-family: inherit;
  line-height: 1.6;
}

.novel-input:focus {
  border-color: #6366f1;
}

.action-bar {
  margin-top: 12px;
}

.btn-generate {
  width: 100%;
  padding: 12px;
  background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 15px;
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

.error-msg {
  margin-top: 8px;
  padding: 8px;
  background: #451a1a;
  color: #fca5a5;
  border-radius: 6px;
  font-size: 12px;
}

.right-panel {
  flex: 1;
  height: 100%;
  padding: 16px;
  box-sizing: border-box;
  overflow: hidden;
}
</style>