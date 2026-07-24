<!-- OutputPanel 组件：Markdown 渲染与导出面板 -->
<template>
  <div class="h-full flex flex-col bg-white rounded-apple border border-apple-border p-5 shadow-sm">
    <!-- 面板顶部工具栏 -->
    <div class="flex items-center justify-between mb-3 pb-3 border-b border-gray-100">
      <div class="flex items-center space-x-2">
        <h2 class="text-sm font-semibold text-apple-text tracking-tight">AI 分镜生成结果</h2>
        <span v-if="store.isGenerating" class="text-xs text-amber-600 animate-pulse">实时生成中...</span>
      </div>

      <!-- 右上角按钮组（已添加蓝色【生成分镜】按钮） -->
      <div class="flex items-center space-x-2">
        <button
          @click="store.generateStoryboard()"
          :disabled="store.isGenerating || !store.novelText.trim()"
          class="text-xs px-3 py-1 rounded-apple-sm bg-blue-600 hover:bg-blue-700 text-white font-medium disabled:opacity-40 transition-colors shadow-sm cursor-pointer"
        >
          {{ store.isGenerating ? '生成中...' : '【生成分镜】' }}
        </button>

        <button
          @click="handleCopy"
          :disabled="!store.outputMarkdown"
          class="text-xs px-2.5 py-1 rounded-apple-sm bg-gray-100 hover:bg-gray-200 text-apple-text disabled:opacity-40 transition-colors"
        >
          {{ copied ? '已复制！' : '复制 Markdown' }}
        </button>
        <button
          @click="handleDownload"
          :disabled="!store.outputMarkdown"
          class="text-xs px-2.5 py-1 rounded-apple-sm bg-gray-100 hover:bg-gray-200 text-apple-text disabled:opacity-40 transition-colors"
        >
          下载 Markdown
        </button>
        <button
          @click="store.clearOutput()"
          :disabled="!store.outputMarkdown"
          class="text-xs px-2.5 py-1 rounded-apple-sm bg-gray-100 hover:bg-red-50 text-red-600 disabled:opacity-40 transition-colors"
        >
          清空
        </button>
      </div>
    </div>

    <!-- 内容展示与 Markdown 渲染区 -->
    <div class="flex-1 overflow-y-auto pr-2 relative" ref="scrollContainer">
      <!-- 错误提示 -->
      <div v-if="store.errorMessage" class="p-4 bg-red-50 border border-red-200 text-red-600 rounded-apple-sm text-sm">
        {{ store.errorMessage }}
      </div>

      <!-- 空状态 -->
      <div v-else-if="!store.outputMarkdown && !store.isGenerating" class="h-full flex flex-col items-center justify-center text-apple-subtext text-sm">
        <div class="w-12 h-12 mb-3 text-gray-300 flex items-center justify-center text-3xl">📝</div>
        <p>暂无分镜生成结果</p>
        <p class="text-xs text-gray-400 mt-1">在左侧输入小说后点击右上角【生成分镜】按钮</p>
      </div>

      <!-- Markdown 内容输出 -->
      <div
        v-else
        class="markdown-body text-sm leading-relaxed text-apple-text prose max-w-none"
        v-html="renderedMarkdown"
      ></div>
    </div>
  </div>
</template>

<script setup>
// 职责：Markdown 文本解析渲染、高亮显示及下载/复制调度
import { ref, computed } from 'vue';
import { marked } from 'marked';
import highlightjs from 'highlight.js';
import 'highlight.js/styles/github.css';
import { useStoryboardStore } from '../stores/storyboardStore.js';
import { copyMarkdown } from '../utils/copy.js';
import { downloadMarkdown } from '../utils/download.js';

const store = useStoryboardStore();
const copied = ref(false);
const scrollContainer = ref(null);

// 配置 marked 解析器
marked.setOptions({
  highlight: function (code, lang) {
    const language = highlightjs.getLanguage(lang) ? lang : 'plaintext';
    return highlightjs.highlight(code, { language }).value;
  },
  breaks: true,
  gfm: true
});

// 计算属性：将 Markdown 转渲染为 HTML
const renderedMarkdown = computed(() => {
  if (!store.outputMarkdown) return '';
  return marked.parse(store.outputMarkdown);
});

// 复制功能
async function handleCopy() {
  const success = await copyMarkdown(store.outputMarkdown);
  if (success) {
    copied.value = true;
    setTimeout(() => {
      copied.value = false;
    }, 2000);
  }
}

// 下载功能
function handleDownload() {
  downloadMarkdown(store.outputMarkdown, `短剧分镜剧本_${Date.now()}.md`);
}
</script>

<style>
/* Markdown 样式扩展 */
.markdown-body h1 {
  font-size: 1.25rem;
  font-weight: 700;
  margin-top: 1.25rem;
  margin-bottom: 0.75rem;
  padding-bottom: 0.25rem;
  border-bottom: 1px solid #E5E5EA;
  color: #1D1D1F;
}

.markdown-body h2 {
  font-size: 1.05rem;
  font-weight: 600;
  margin-top: 1rem;
  margin-bottom: 0.5rem;
  color: #0071E3;
}

.markdown-body ul {
  list-style-type: disc;
  padding-left: 1.25rem;
  margin-bottom: 0.75rem;
}

.markdown-body p {
  margin-bottom: 0.5rem;
}

.markdown-body pre {
  background-color: #F2F2F7;
  padding: 0.75rem;
  border-radius: 8px;
  overflow-x: auto;
  margin-bottom: 0.75rem;
}

.markdown-body code {
  font-family: monospace;
  background-color: #F2F2F7;
  padding: 0.1rem 0.3rem;
  border-radius: 4px;
}
</style>