<template>
  <div class="storyboard-container">
    <div class="header-bar">
      <h2>🎬 镜头分镜列表</h2>
      <div class="header-actions">
        <span class="scene-count" v-if="store.scenes.length > 0">当前风格: {{ currentStyle }} | 共 {{ store.scenes.length }} 个镜头</span>
        
        <!-- 手动添加镜头按钮 -->
        <button 
          class="btn-add-scene"
          @click="handleAddScene"
        >
          ➕ 新增镜头
        </button>

        <!-- 一键批量优化按钮 -->
        <button 
          v-if="store.scenes.length > 0"
          class="btn-batch-optimize"
          @click="handleBatchOptimize"
          :disabled="isBatchOptimizing"
        >
          {{ isBatchOptimizing ? '⚡ 批量优化中...' : '🚀 一键批量优化所有镜头' }}
        </button>

        <!-- 导出结构化 JSON 按钮 -->
        <button 
          v-if="store.scenes.length > 0"
          class="btn-export-json"
          @click="handleExportJSON"
        >
          📤 导出结构化 JSON
        </button>
      </div>
    </div>

    <!-- 空状态提示 -->
    <div v-if="store.scenes.length === 0" class="empty-state">
      <p>暂无分镜数据，请在左侧输入小说文本并点击“开始生成分镜”</p>
    </div>

    <!-- 分镜列表区域 -->
    <div v-else class="scene-list">
      <div v-for="(scene, index) in store.scenes" :key="index" class="scene-card">
        <div class="scene-header">
          <span class="scene-badge">镜头 {{ scene.sceneNumber || index + 1 }}</span>
          <input type="text" v-model="scene.title" class="scene-title-input" placeholder="镜头标题..." />
          <span class="scene-duration">时长: {{ scene.duration || '3s' }}</span>
          
          <!-- 删除当前镜头按钮 -->
          <button class="btn-delete-scene" @click="handleDeleteScene(index)" title="删除此镜头">
            🗑️
          </button>
        </div>

        <!-- 画面与文案描述 -->
        <div class="scene-body">
          <div class="input-group">
            <div class="label-row">
              <label>画面/字幕描述：</label>
              <button 
                class="btn-rewrite-single" 
                @click="handleRewriteScene(scene)"
                :disabled="scene.isRewriting"
              >
                {{ scene.isRewriting ? '🔄 重写中...' : '✍️ AI 洗稿重写' }}
              </button>
            </div>
            <textarea v-model="scene.description" placeholder="输入镜头画面描述..." rows="2"></textarea>
          </div>

          <!-- Prompt 优化操作栏 -->
          <div class="optimize-bar">
            <button 
              class="btn-optimize" 
              @click="handleSceneOptimize(scene)"
              :disabled="scene.isOptimizing || isBatchOptimizing"
            >
              {{ scene.isOptimizing ? '✨ 优化中...' : `✨ AI 优化 Prompt (${currentStyle})` }}
            </button>
          </div>

          <!-- 优化后的结构化展示区域 -->
          <div v-if="scene.prompt || scene.englishPrompt" class="optimized-result-box">
            <div class="result-item">
              <strong>🇨🇳 中文生图 Prompt：</strong>
              <p>{{ scene.prompt }}</p>
            </div>
            <div class="result-item">
              <strong>🇬🇧 英文生图 Prompt：</strong>
              <p>{{ scene.englishPrompt }}</p>
            </div>
            <div class="result-item" v-if="scene.videoPrompt">
              <strong>🎬 视频运镜 Prompt：</strong>
              <p>{{ typeof scene.videoPrompt === 'object' ? scene.videoPrompt.chinese : scene.videoPrompt }}</p>
            </div>
            <div class="result-item" v-if="scene.cameraMovement">
              <strong>🎥 运镜方式：</strong>
              <span>{{ scene.cameraMovement }}</span>
            </div>
            <div class="result-item" v-if="scene.bgmSuggestion">
              <strong>🎵 BGM 建议：</strong>
              <span>{{ scene.bgmSuggestion }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useStoryboardStore } from '../stores/storyboardStore';
import { optimizePrompt } from '../services/aiService.js';

// 接收来自 App.vue 传入的当前全局风格
const props = defineProps({
  currentStyle: {
    type: String,
    default: '电影写实风'
  }
});

const store = useStoryboardStore();

// 批量优化加载状态
const isBatchOptimizing = ref(false);

/**
 * 手动添加一个空镜头
 */
const handleAddScene = () => {
  const newScene = {
    sceneNumber: store.scenes.length + 1,
    title: `新镜头 ${store.scenes.length + 1}`,
    duration: '3s',
    description: '',
    prompt: '',
    englishPrompt: '',
    videoPrompt: '',
    cameraMovement: '',
    bgmSuggestion: ''
  };
  store.scenes.push(newScene);
};

/**
 * 删除指定索引的镜头
 */
const handleDeleteScene = (index) => {
  if (confirm(`确定要删除 镜头 ${index + 1} 吗？`)) {
    store.scenes.splice(index, 1);
    store.scenes.forEach((s, idx) => {
      s.sceneNumber = idx + 1;
    });
  }
};

/**
 * 针对单个镜头的 AI 优化方法
 */
const handleSceneOptimize = async (scene) => {
  const textToOptimize = scene.description || scene.title;
  if (!textToOptimize) {
    alert('当前镜头没有可用于优化的描述内容！');
    return;
  }

  scene.isOptimizing = true;
  try {
    const result = await optimizePrompt(textToOptimize, props.currentStyle);
    if (result) {
      scene.prompt = result.chinese;           
      scene.englishPrompt = result.english;     
      scene.videoPrompt = result.videoPrompt;   
      scene.cameraMovement = result.cameraMovement; 
      scene.bgmSuggestion = result.bgmSuggestion;   
    }
  } catch (error) {
    console.error('优化失败:', error);
    alert('Prompt 优化失败，请检查网络或后端服务');
  } finally {
    scene.isOptimizing = false;
  }
};

/**
 * 单个镜头一键洗稿/重写描述
 */
const handleRewriteScene = async (scene) => {
  const currentText = scene.description || scene.title;
  if (!currentText) {
    alert('当前镜头内容为空，无法进行重写！');
    return;
  }

  scene.isRewriting = true;
  try {
    const result = await optimizePrompt(`请把以下镜头画面描述进行更有吸引力的文学洗稿与润色，使其更具视觉张力：${currentText}`, props.currentStyle);
    if (result && result.chinese) {
      scene.description = result.chinese; 
      alert('✍️ 镜头文案已成功重写洗稿！');
    }
  } catch (error) {
    console.error('重写失败:', error);
    alert('镜头重写失败，请检查网络');
  } finally {
    scene.isRewriting = false;
  }
};

/**
 * 一键批量优化所有镜头
 */
const handleBatchOptimize = async () => {
  if (store.scenes.length === 0) return;

  isBatchOptimizing.value = true;
  try {
    for (let i = 0; i < store.scenes.length; i++) {
      const scene = store.scenes[i];
      const textToOptimize = scene.description || scene.title;
      
      if (textToOptimize) {
        scene.isOptimizing = true;
        try {
          const result = await optimizePrompt(textToOptimize, props.currentStyle);
          if (result) {
            scene.prompt = result.chinese;
            scene.englishPrompt = result.english;
            scene.videoPrompt = result.videoPrompt;
            scene.cameraMovement = result.cameraMovement;
            scene.bgmSuggestion = result.bgmSuggestion;
          }
        } catch (err) {
          console.error(`第 ${i + 1} 个镜头优化出错:`, err);
        } finally {
          scene.isOptimizing = false;
        }
      }
    }
    alert('🎉 所有镜头已批量优化完成！');
  } catch (error) {
    console.error('批量优化失败:', error);
    alert('批量优化过程中发生异常');
  } finally {
    isBatchOptimizing.value = false;
  }
};

/**
 * 一键导出结构化 JSON
 */
const handleExportJSON = () => {
  if (store.scenes.length === 0) {
    alert('当前没有可导出的分镜数据！');
    return;
  }

  const exportData = {
    version: "1.0",
    style: props.currentStyle,
    totalScenes: store.scenes.length,
    createTime: new Date().toISOString(),
    scenes: store.scenes.map((scene, index) => ({
      sceneNumber: scene.sceneNumber || index + 1,
      title: scene.title || '',
      duration: scene.duration || '3s',
      description: scene.description || '',
      prompt: {
        chinese: scene.prompt || '',
        english: scene.englishPrompt || ''
      },
      videoPrompt: scene.videoPrompt || '',
      cameraMovement: scene.cameraMovement || '',
      bgmSuggestion: scene.bgmSuggestion || ''
    }))
  };

  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `storyboard_${Date.now()}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
};
</script>

<style scoped>
.storyboard-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #18181c;
  border-radius: 12px;
  border: 1px solid #2d2d35;
  padding: 16px;
  box-sizing: border-box;
  overflow: hidden;
}

.header-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.header-bar h2 {
  margin: 0;
  font-size: 16px;
  color: #e2e8f0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.scene-count {
  font-size: 12px;
  color: #a1a1aa;
}

.btn-add-scene {
  background: #4f46e5;
  color: #fff;
  border: none;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: bold;
  cursor: pointer;
  transition: opacity 0.2s;
}

.btn-add-scene:hover {
  opacity: 0.9;
}

.btn-batch-optimize {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: #fff;
  border: none;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: bold;
  cursor: pointer;
  transition: opacity 0.2s;
}

.btn-batch-optimize:hover:not(:disabled) {
  opacity: 0.9;
}

.btn-batch-optimize:disabled {
  background: #373740;
  color: #71717a;
  cursor: not-allowed;
}

.btn-export-json {
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: #fff;
  border: none;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: bold;
  cursor: pointer;
  transition: opacity 0.2s;
}

.btn-export-json:hover {
  opacity: 0.9;
}

.empty-state {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  color: #71717a;
  font-size: 14px;
}

.scene-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-right: 4px;
}

.scene-card {
  background: #121214;
  border: 1px solid #2d2d35;
  border-radius: 8px;
  padding: 12px;
}

.scene-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.scene-badge {
  background: #27272a;
  color: #a1a1aa;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
}

.scene-title-input {
  flex: 1;
  background: #18181c;
  border: 1px solid #33333d;
  color: #fff;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 14px;
  outline: none;
}

.scene-duration {
  font-size: 12px;
  color: #71717a;
}

.btn-delete-scene {
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 14px;
  padding: 2px;
  opacity: 0.7;
  transition: opacity 0.2s;
}

.btn-delete-scene:hover {
  opacity: 1;
}

.scene-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.label-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.input-group label {
  font-size: 12px;
  color: #a1a1aa;
  display: block;
}

.btn-rewrite-single {
  background: #374151;
  color: #e5e7eb;
  border: none;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-rewrite-single:hover:not(:disabled) {
  background: #4b5563;
}

.btn-rewrite-single:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.scene-body textarea {
  width: 100%;
  background: #18181c;
  border: 1px solid #33333d;
  color: #e2e8f0;
  border-radius: 6px;
  padding: 8px;
  font-size: 13px;
  resize: vertical;
  box-sizing: border-box;
  outline: none;
}

.optimize-bar {
  display: flex;
  justify-content: flex-end;
}

.btn-optimize {
  background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%);
  color: #fff;
  border: none;
  padding: 6px 14px;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: opacity 0.2s;
}

.btn-optimize:hover:not(:disabled) {
  opacity: 0.9;
}

.btn-optimize:disabled {
  background: #373740;
  color: #71717a;
  cursor: not-allowed;
}

.optimized-result-box {
  background: #18181c;
  border: 1px solid #2d2d35;
  border-radius: 6px;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 4px;
}

.result-item {
  font-size: 12px;
  color: #d1d5db;
}

.result-item strong {
  color: #93c5fd;
}

.result-item p {
  margin: 2px 0 0 0;
  color: #e5e7eb;
  word-break: break-all;
}
</style>