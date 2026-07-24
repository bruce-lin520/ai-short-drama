<!-- HeaderBar 组件：顶部栏 -->
<template>
  <header class="h-16 bg-white/80 backdrop-blur-md border-b border-apple-border px-6 flex items-center justify-between sticky top-0 z-50">
    <div class="flex items-center space-x-3">
      <div class="w-8 h-8 rounded-lg bg-apple-accent flex items-center justify-center text-white font-bold text-lg shadow-sm">
        🎬
      </div>
      <h1 class="text-lg font-semibold text-apple-text tracking-tight">AI Short Drama Studio</h1>
      <span class="text-xs bg-gray-100 text-apple-subtext px-2 py-0.5 rounded-full font-medium">MVP v1.0</span>
    </div>
    
    <div class="flex items-center space-x-4">
      <a href="#" class="text-sm text-apple-subtext hover:text-apple-text transition-colors">工作流</a>
      <a href="#" class="text-sm text-apple-subtext hover:text-apple-text transition-colors">模型设置</a>
      <div class="w-8 h-8 rounded-full bg-gray-200 border border-apple-border flex items-center justify-center text-xs font-semibold text-apple-text">
        Pro
      </div>
    </div>
  </header>
</template>

<script setup>
// 职责：展示系统 Brand Logo 及全局导航状态
</script>