<template>
  <div class="storyboard-container">
    <div class="header-bar">
      <h2>🎬 镜头分镜列表</h2>
      <div class="header-actions">
        <span class="scene-count" v-if="store.scenes?.length > 0">当前风格: {{ currentStyle }} | 共 {{ store.scenes.length }} 个镜头</span>
        
        <!-- 手动添加镜头按钮 -->
        <button 
          class="btn-add-scene"
          @click="handleAddScene"
        >
          ➕ 新增镜头
        </button>

        <!-- 一键批量优化按钮 -->
        <button 
          v-if="store.scenes?.length > 0"
          class="btn-batch-optimize"
          @click="handleBatchOptimize"
          :disabled="isBatchOptimizing"
        >
          {{ isBatchOptimizing ? '⚡ 批量优化中...' : '🚀 一键批量优化所有镜头' }}
        </button>

        <!-- 导出结构化 JSON 按钮 -->
        <button 
          v-if="store.scenes?.length > 0"
          class="btn-export-json"
          @click="handleExportJSON"
        >
          📤 导出结构化 JSON
        </button>
      </div>
    </div>

    <!-- 空状态提示 -->
    <div v-if="!store.scenes || store.scenes.length === 0" class="empty-state">
      <p>暂无分镜数据，请在左侧输入小说文本并点击“开始生成分镜”</p>
    </div>

    <!-- 分镜列表区域 -->
    <div v-else class="scene-list">
      <!-- 优化：利用唯一标识作为 key，避免全量重渲染导致的卡顿 -->
      <div v-for="(scene, index) in store.scenes" :key="scene.sceneNumber || index" class="scene-card">
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
              <label>画面/剧情描述：</label>
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

          <!-- 字幕与配音稿字段 -->
          <div class="av-grid">
            <div class="input-group">
              <label>💬 画面字幕 (Subtitle)：</label>
              <input type="text" v-model="scene.subtitle" class="sub-voice-input" placeholder="请输入内嵌字幕..." />
            </div>
            <div class="input-group">
              <label>🎙️ 配音稿 / 旁白 (Voiceover)：</label>
              <input type="text" v-model="scene.voiceover" class="sub-voice-input" placeholder="请输入 AI 配音旁白稿..." />
            </div>
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

          <!-- 优化后的结构化与多平台 Prompt 展示区域 -->
          <div class="optimized-result-box">
            
            <!-- 👑 导演模式面板 -->
            <div class="director-mode-panel">
              <div class="director-panel-header">
                <span class="director-tag">🎬 AI 导演模式评定</span>
                <div class="score-badge" :style="{ background: getScoreColor(scene.directorScore || 92) }">
                  综合评分: {{ scene.directorScore || 92 }} 分
                </div>
              </div>
              <div class="director-advice-content">
                <p><strong>💡 导演视觉与节奏建议：</strong>{{ scene.directorAdvice || '当前镜头视觉张力良好，建议配合节奏紧凑的剪辑，增强观众代入感。' }}</p>
              </div>
            </div>

            <!-- 平台切换 Tab 标签栏 -->
            <div class="platform-tabs">
              <button 
                type="button"
                :class="['tab-btn', (!scene._activePlatform || scene._activePlatform === 'kling') ? 'active' : '']"
                @click="switchPlatform(index, 'kling')"
              >
                🎬 可灵 (Kling)
              </button>
              <button 
                type="button"
                :class="['tab-btn', scene._activePlatform === 'jimeng' ? 'active' : '']"
                @click="switchPlatform(index, 'jimeng')"
              >
                🎨 即梦 (Jimeng)
              </button>
              <button 
                type="button"
                :class="['tab-btn', scene._activePlatform === 'runway' ? 'active' : '']"
                @click="switchPlatform(index, 'runway')"
              >
                🚀 Runway
              </button>
              <button 
                type="button"
                :class="['tab-btn', scene._activePlatform === 'jianying' ? 'active' : '']"
                @click="switchPlatform(index, 'jianying')"
              >
                ✂️ 剪映 / 通用
              </button>
            </div>

            <!-- 可灵平台视图 -->
            <div v-if="!scene._activePlatform || scene._activePlatform === 'kling'" class="platform-content">
              <div class="result-item">
                <strong>🇬🇧 可灵英文 Prompt (Cinematic)：</strong>
                <p>{{ scene.englishPrompt || scene.description || '暂无提示词，请点击上方 AI 优化 Prompt' }}</p>
              </div>
              <div class="result-item" v-if="scene.videoPrompt">
                <strong>🎥 运动运镜参数：</strong>
                <p>{{ typeof scene.videoPrompt === 'object' ? scene.videoPrompt.english || scene.videoPrompt.chinese : scene.videoPrompt }}</p>
              </div>
            </div>

            <!-- 即梦平台视图 -->
            <div v-else-if="scene._activePlatform === 'jimeng'" class="platform-content">
              <div class="result-item">
                <strong>🇨🇳 即梦中文高品质 Prompt：</strong>
                <p>{{ scene.prompt || scene.description || '暂无描述' }}，电影质感，细节丰富，8k，精致光影</p>
              </div>
            </div>

            <!-- Runway 平台视图 -->
            <div v-else-if="scene._activePlatform === 'runway'" class="platform-content">
              <div class="result-item">
                <strong>🚀 Runway Gen-3 运动指令：</strong>
                <p>{{ scene.englishPrompt || scene.description || '暂无英文提示词' }}, cinematic camera movement, dynamic motion</p>
              </div>
            </div>

            <!-- 剪映/通用平台视图 -->
            <div v-else-if="scene._activePlatform === 'jianying'" class="platform-content">
              <div class="result-item">
                <strong>💬 剪映分镜文案：</strong>
                <p>字幕：{{ scene.subtitle || '无' }} | 旁白：{{ scene.voiceover || '无' }}</p>
              </div>
              <div class="result-item">
                <strong>🎵 BGM 与运镜：</strong>
                <span>{{ scene.cameraMovement || '固定' }} | {{ scene.bgmSuggestion || '平静' }}</span>
              </div>
            </div>

            <!-- 通用基础展示与视频预览触发按钮 -->
            <div class="common-summary-footer flex-between-center">
              <div>
                <span><strong>运镜：</strong>{{ scene.cameraMovement || '固定' }}</span> &nbsp;|&nbsp;
                <span><strong>BGM：</strong>{{ scene.bgmSuggestion || '平静' }}</span>
              </div>
              
              <!-- 🎬 AI 视频预览/生成按钮 -->
              <button 
                class="btn-open-video-modal"
                @click="openVideoModal(scene, index)"
              >
                🎬 {{ scene.videoUrl ? '查看生成的视频' : 'AI 视频生成与预览' }}
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>

    <!-- 📺 引入并挂载视频预览弹窗组件 -->
    <VideoPreviewModal 
      :isOpen="isVideoModalOpen"
      :sceneData="currentSelectedScene"
      :sceneIndex="currentSelectedIndex"
      @close="isVideoModalOpen = false"
      @update:scene="handleSceneVideoUpdated"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useStoryboardStore } from '../stores/storyboardStore';
import { optimizePrompt } from '../services/aiService.js';
import VideoPreviewModal from './VideoPreviewModal.vue'; // 引入视频弹窗组件

const props = defineProps({
  currentStyle: {
    type: String,
    default: '电影写实风'
  }
});

const store = useStoryboardStore();
const isBatchOptimizing = ref(false);

// 🎬 视频弹窗控制状态
const isVideoModalOpen = ref(false);
const currentSelectedScene = ref(null);
const currentSelectedIndex = ref(0);

// 打开视频预览弹窗
const openVideoModal = (scene, index) => {
  currentSelectedScene.value = scene;
  currentSelectedIndex.value = index;
  isVideoModalOpen.value = true;
};

// 监听弹窗内视频生成或更新后的回调
const handleSceneVideoUpdated = (updatedSceneData) => {
  if (store.scenes && store.scenes[currentSelectedIndex.value]) {
    store.scenes[currentSelectedIndex.value].videoUrl = updatedSceneData.videoUrl;
    store.scenes[currentSelectedIndex.value].videoStatus = updatedSceneData.videoStatus;
  }
};

// 平台 Tab 切换：纯本地状态更新，绝不触发任何 API
const switchPlatform = (index, platform) => {
  store.setScenePlatform(index, platform);
};

const getScoreColor = (score) => {
  if (score >= 90) return 'linear-gradient(135deg, #059669 0%, #10b981 100%)';
  if (score >= 80) return 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)';
  return 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)';
};

const handleAddScene = () => {
  if (!store.v2Data.value?.storyboards) {
    if (!store.v2Data.value) store.v2Data.value = {};
    store.v2Data.value.storyboards = [];
  }
  const newScene = {
    shotNumber: store.scenes.length + 1,
    title: `新镜头 ${store.scenes.length + 1}`,
    duration: '3s',
    plot: '',
    subtitle: '',
    voiceover: '',
    prompt: '',
    klingPrompt: '',
    runwayPrompt: '',
    cameraMovement: '固定镜头',
    bgm: '平静',
    directorAdvice: '新镜头视觉元素待补充，建议增加光影对比与角色微表情特写。',
    directorScore: 88,
    _activePlatform: 'kling'
  };
  store.v2Data.storyboards.push(newScene);
};

const handleDeleteScene = (index) => {
  if (confirm(`确定要删除 镜头 ${index + 1} 吗？`)) {
    store.v2Data.storyboards.splice(index, 1);
    store.v2Data.storyboards.forEach((s, idx) => {
      s.shotNumber = idx + 1;
    });
  }
};

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
      scene.directorAdvice = result.directorAdvice;
      scene.directorScore = result.directorScore;
    }
  } catch (error) {
    console.error('优化失败:', error);
    alert('Prompt 优化失败，请检查网络或后端服务');
  } finally {
    scene.isOptimizing = false;
  }
};

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

const handleBatchOptimize = async () => {
  if (!store.scenes || store.scenes.length === 0) return;

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
            scene.directorAdvice = result.directorAdvice;
            scene.directorScore = result.directorScore;
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

const handleExportJSON = () => {
  if (!store.scenes || store.scenes.length === 0) {
    alert('当前没有可导出的分镜数据！');
    return;
  }

  const exportData = {
    version: "2.0",
    style: props.currentStyle,
    totalScenes: store.scenes.length,
    createTime: new Date().toISOString(),
    scenes: store.scenes.map((scene, index) => ({
      sceneNumber: scene.sceneNumber || index + 1,
      title: scene.title || '',
      duration: scene.duration || '3s',
      description: scene.description || '',
      subtitle: scene.subtitle || '',
      voiceover: scene.voiceover || '',
      prompt: {
        chinese: scene.prompt || '',
        english: scene.englishPrompt || ''
      },
      videoPrompt: scene.videoPrompt || '',
      cameraMovement: scene.cameraMovement || '',
      bgmSuggestion: scene.bgmSuggestion || '',
      directorAdvice: scene.directorAdvice || '',
      directorScore: scene.directorScore || 92
    }))
  };

  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `storyboard_v2_${Date.now()}.json`);
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
  margin-bottom: 2px;
}

.av-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.sub-voice-input {
  width: 100%;
  background: #18181c;
  border: 1px solid #33333d;
  color: #e2e8f0;
  border-radius: 6px;
  padding: 6px 8px;
  font-size: 12px;
  outline: none;
  box-sizing: border-box;
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
  margin-top: 4px;
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
  gap: 8px;
  margin-top: 4px;
}

.director-mode-panel {
  background: #1a1a24;
  border: 1px solid #312e81;
  border-radius: 6px;
  padding: 8px 10px;
  margin-bottom: 4px;
}

.director-panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.director-tag {
  font-size: 11px;
  color: #818cf8;
  font-weight: bold;
}

.score-badge {
  color: #fff;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: bold;
}

.director-advice-content p {
  margin: 0;
  font-size: 11px;
  color: #cbd5e1;
  line-height: 1.4;
}

.director-advice-content strong {
  color: #a5b4fc;
}

.platform-tabs {
  display: flex;
  gap: 6px;
  border-bottom: 1px solid #2d2d35;
  padding-bottom: 6px;
}

.tab-btn {
  background: #27272a;
  border: none;
  color: #9ca3af;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s;
}

.tab-btn.active {
  background: #4f46e5;
  color: #fff;
  font-weight: bold;
}

.platform-content {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-height: 40px;
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

.common-summary-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 11px;
  color: #9ca3af;
  border-top: 1px dashed #2d2d35;
  padding-top: 6px;
  margin-top: 2px;
}

.flex-between-center {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.btn-open-video-modal {
  background: linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%);
  color: #fff;
  border: none;
  padding: 3px 10px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: bold;
  cursor: pointer;
  transition: opacity 0.2s;
}

.btn-open-video-modal:hover {
  opacity: 0.9;
}
</style>