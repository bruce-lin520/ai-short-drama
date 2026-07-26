<template>
  <div class="space-y-4">
    <div>
      <label class="block text-sm font-medium text-gray-300 mb-2">输入小说文本或短剧创意：</label>
      <textarea 
        v-model="inputText" 
        rows="4" 
        class="w-full p-4 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition text-sm"
        placeholder="例如：深夜，林深独自一人坐在办公室里，桌上的台灯忽明忽暗。突然，门外传来了急促的敲门声..."
      ></textarea>
    </div>

    <div class="flex items-center justify-between">
      <span class="text-xs text-gray-400">系统将自动提取角色库、多平台 Prompt 并生成导演建议</span>
      <button 
        @click="handleGenerate" 
        :disabled="store.loading"
        class="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white rounded-xl font-medium text-sm shadow-lg transition disabled:opacity-50 cursor-pointer flex items-center space-x-2"
      >
        <span v-if="store.loading">⏳ 正在解析剧本与生成多平台 Prompt...[cite: 1]</span>
        <span v-else>🚀 一键生成专业分镜[cite: 1]</span>
      </button>
    </div>

    <!-- 错误提示 -->
    <div v-if="store.errorMsg" class="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-lg">
      {{ store.errorMsg }}[cite: 1]
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';[cite: 1]
import { useStoryboardStore } from '@/stores/storyboardStore';[cite: 1]

const store = useStoryboardStore();[cite: 1]
const inputText = ref('');[cite: 1]

const handleGenerate = async () => {
  if (!inputText.value.trim()) {
    store.errorMsg = "请输入需要转换的小说内容或创意！";[cite: 1]
    return;
  }
  store.errorMsg = '';[cite: 1]
  store.novelText = inputText.value;[cite: 1]
  await store.generateStoryboard(inputText.value);[cite: 1]
};
</script>