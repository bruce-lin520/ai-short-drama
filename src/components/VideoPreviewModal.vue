<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col animate-fade-in">
      <!-- 弹窗头部 -->
      <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <h3 class="text-lg font-bold text-gray-800">
          🎬 镜头 {{ sceneIndex + 1 }} 视频生成与预览
        </h3>
        <button 
          @click="$emit('close')"
          class="text-gray-400 hover:text-gray-600 text-xl font-bold w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 transition"
        >
          ✕
        </button>
      </div>

      <!-- 视频播放与生成状态区域 -->
      <div class="p-6 bg-black flex flex-col items-center justify-center relative aspect-video">
        <!-- 如果已有视频，则直接播放 -->
        <video 
          v-if="sceneData?.videoUrl" 
          :src="sceneData.videoUrl" 
          controls 
          autoplay 
          class="max-h-[50vh] w-auto rounded-lg shadow-lg"
        ></video>

        <!-- 如果正在生成，显示加载动画和状态提示 -->
        <div v-else-if="isGenerating" class="flex flex-col items-center justify-center space-y-3">
          <div class="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p class="text-white text-sm font-medium">AI 视频渲染中，预计需要 30-60 秒，请耐心等待...</p>
          <p class="text-gray-400 text-xs">当前提示词：{{ sceneData?.englishPrompt || sceneData?.description }}</p>
        </div>

        <!-- 默认未生成状态 -->
        <div v-else class="flex flex-col items-center justify-center space-y-3">
          <p class="text-white text-sm">当前镜头尚未生成 AI 视频</p>
          <button 
            @click="handleGenerateVideo"
            class="px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-bold text-sm shadow-lg hover:opacity-90 transition"
          >
            🚀 开始一键生成视频
          </button>
        </div>
      </div>

      <!-- 弹窗底部操作区 -->
      <div class="flex items-center justify-between px-6 py-4 bg-gray-50 border-t border-gray-100">
        <div class="text-xs text-gray-500">
          <span v-if="sceneData?.videoUrl" class="text-green-600 font-bold">● 视频已就绪</span>
          <span v-else-if="isGenerating" class="text-indigo-600 font-bold animate-pulse">● 正在生成中...</span>
          <span v-else>● 等待触发</span>
        </div>

        <div class="flex items-center space-x-3">
          <!-- 重新生成按钮 -->
          <button 
            v-if="sceneData?.videoUrl && !isGenerating"
            @click="handleGenerateVideo"
            class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium text-sm"
          >
            🔄 重新生成
          </button>

          <!-- 下载视频按钮 -->
          <a 
            v-if="sceneData?.videoUrl" 
            :href="sceneData.videoUrl" 
            :download="`scene_${sceneIndex + 1}_video.mp4`" 
            target="_blank"
            class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium text-sm shadow-sm flex items-center space-x-1"
          >
            <span>📥 下载该视频</span>
          </a>

          <button 
            @click="$emit('close')"
            class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium text-sm"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  sceneData: {
    type: Object,
    default: null
  },
  sceneIndex: {
    type: Number,
    default: 0
  }
});

const emit = defineEmits(['close', 'update:scene']);

const isGenerating = ref(false);

// 模拟或调用真实的 AI 视频生成接口
const handleGenerateVideo = async () => {
  if (!props.sceneData) return;

  isGenerating.value = true;
  try {
    // 💡 这里可以替换为您真实的后端视频生成 API 请求
    // 例如：const res = await generateVideoApi({ prompt: props.sceneData.englishPrompt });
    
    await new Promise((resolve) => setTimeout(resolve, 3000)); // 模拟 3 秒生成过程

    // 模拟生成成功的视频链接（您后续可换成接口返回的真实 URL）
    const mockVideoUrl = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4';

    // 更新当前镜头数据
    const updatedScene = {
      ...props.sceneData,
      videoUrl: mockVideoUrl,
      videoStatus: 'completed'
    };

    // 通知父组件更新状态
    emit('update:scene', updatedScene);
  } catch (error) {
    console.error('视频生成失败:', error);
    alert('视频生成失败，请检查网络或后端服务');
  } finally {
    isGenerating.value = false;
  }
};
</script>