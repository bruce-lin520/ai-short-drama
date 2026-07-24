<template>
  <div class="toolbar-container">
    <div class="stat-item">
      <span class="label">当前字数：</span>
      <!-- 加上 || 0 防护，彻底避免 undefined 报错 -->
      <span class="value">{{ (store?.novelText?.length || 0).toLocaleString() }} 字</span>
    </div>
    
    <div class="stat-item">
      <span class="label">分镜场景数：</span>
      <span class="value">{{ (store?.parsedScenes?.length || 0).toLocaleString() }} 幕</span>
    </div>
  </div>
</template>

<script setup>
import { useStoryboardStore } from '../stores/storyboardStore';

const store = useStoryboardStore();
</script>

<style scoped>
.toolbar-container {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 8px 16px;
  background: #25252b;
  border-bottom: 1px solid #333;
  color: #aaa;
  font-size: 13px;
}

.stat-item .value {
  color: #38bdf8;
  font-weight: bold;
}
</style>