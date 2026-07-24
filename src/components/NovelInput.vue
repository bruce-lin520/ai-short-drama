<!-- NovelInput 组件：小说输入面板 -->
<template>
  <div class="h-full flex flex-col bg-white rounded-apple border border-apple-border p-5 shadow-sm">
    <!-- 面板顶部操作栏 -->
    <div class="flex items-center justify-between mb-3 pb-3 border-b border-gray-100">
      <div class="flex items-center space-x-2">
        <h2 class="text-sm font-semibold text-apple-text tracking-tight">小说文本输入</h2>
        <span class="text-xs text-apple-subtext">(支持数万字文本)</span>
      </div>
      
      <div class="flex items-center space-x-2">
        <button
          @click="store.loadSampleText()"
          class="text-xs px-2.5 py-1 rounded-apple-sm bg-gray-100 hover:bg-gray-200 text-apple-text transition-colors"
        >
          导入示例
        </button>
        <button
          @click="handlePaste"
          class="text-xs px-2.5 py-1 rounded-apple-sm bg-gray-100 hover:bg-gray-200 text-apple-text transition-colors"
        >
          粘贴
        </button>
        <button
          @click="store.clearNovelText()"
          class="text-xs px-2.5 py-1 rounded-apple-sm bg-gray-100 hover:bg-red-50 text-red-600 transition-colors"
        >
          清空
        </button>
      </div>
    </div>

    <!-- 超大文本框 -->
    <div class="flex-1 relative">
      <textarea
        v-model="novelText"
        placeholder="请在此粘贴或输入小说原文（支持几万字长文本，系统将自动进行分镜与 Prompt 提取）..."
        class="w-full h-full p-4 text-sm text-apple-text bg-gray-50/50 border border-transparent rounded-apple-sm resize-none focus:outline-none focus:bg-white focus:border-apple-accent/30 transition-all leading-relaxed"
      ></textarea>
    </div>
  </div>
</template>

<script setup>
// 职责：提供小说输入、粘贴、清空、示例加载等功能，并与 Store 双向绑定
import { computed } from 'vue';
import { useStoryboardStore } from '../stores/storyboardStore.js';

const store = useStoryboardStore();

// 计算属性实现 v-model 绑定 Pinia store
const novelText = computed({
  get: () => store.novelText,
  set: (val) => store.setNovelText(val)
});

// 处理粘贴逻辑
async function handlePaste() {
  try {
    const text = await navigator.clipboard.readText();
    if (text) {
      store.setNovelText(store.novelText + text);
    }
  } catch (err) {
    console.error('剪贴板读取失败:', err);
  }
}
</script>