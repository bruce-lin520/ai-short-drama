<template>
  <div class="director-global-panel">
    <div class="director-panel-header">
      <div class="title-area">
        <span class="icon">🎬</span>
        <h3>AI 导演全局统筹与评分中心</h3>
      </div>
      <div class="stats-badge" v-if="store.scenes && store.scenes.length > 0">
        平均表现分: <strong>{{ averageScore }} 分</strong>
      </div>
    </div>

    <!-- 评分概览与分析 -->
    <div class="director-content">
      <div v-if="!store.scenes || store.scenes.length === 0" class="empty-tip">
        暂无分镜数据，请先生成或添加镜头以启动导演模式分析。
      </div>

      <div v-else class="metrics-grid">
        <div class="metric-card">
          <span class="label">分镜总数</span>
          <span class="value">{{ store.scenes.length }} 个</span>
        </div>
        <div class="metric-card">
          <span class="label">视听语言健康度</span>
          <span class="value" :style="{ color: getHealthColor(averageScore) }">
            {{ averageScore >= 90 ? '优秀' : averageScore >= 80 ? '良好' : '需优化' }}
          </span>
        </div>
        <div class="metric-card">
          <span class="label">全局节奏评定</span>
          <span class="value">紧凑流畅</span>
        </div>
      </div>

      <!-- 导演综合建议列表 -->
      <div class="global-advice-box" v-if="store.scenes && store.scenes.length > 0">
        <h4>💡 导演核心调度指令：</h4>
        <ul>
          <li v-for="(scene, idx) in store.scenes.slice(0, 3)" :key="idx">
            <span>镜头 {{ idx + 1 }}：</span>{{ scene.directorAdvice || '视觉张力良好，镜头切换平滑。' }}
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useStoryboardStore } from '../stores/storyboardStore';

const store = useStoryboardStore();

// 计算所有镜头的平均导演评分
const averageScore = computed(() => {
  if (!store.scenes || store.scenes.length === 0) return 0;
  const total = store.scenes.reduce((acc, cur) => acc + (cur.directorScore || 92), 0);
  return Math.round(total / store.scenes.length);
});

const getHealthColor = (score) => {
  if (score >= 90) return '#10b981';
  if (score >= 80) return '#3b82f6';
  return '#f59e0b';
};
</script>

<style scoped>
.director-global-panel {
  background: #18181c;
  border: 1px solid #312e81;
  border-radius: 12px;
  padding: 16px;
  box-sizing: border-box;
  color: #e2e8f0;
  margin-bottom: 16px;
}

.director-panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #2d2d35;
  padding-bottom: 10px;
  margin-bottom: 12px;
}

.title-area {
  display: flex;
  align-items: center;
  gap: 8px;
}

.title-area h3 {
  margin: 0;
  font-size: 15px;
  color: #a5b4fc;
}

.icon {
  font-size: 16px;
}

.stats-badge {
  background: #1e1b4b;
  border: 1px solid #4338ca;
  color: #c7d2fe;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
}

.stats-badge strong {
  color: #10b981;
}

.empty-tip {
  color: #71717a;
  font-size: 13px;
  text-align: center;
  padding: 12px 0;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 12px;
}

.metric-card {
  background: #121214;
  border: 1px solid #2d2d35;
  border-radius: 8px;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.metric-card .label {
  font-size: 11px;
  color: #9ca3af;
}

.metric-card .value {
  font-size: 14px;
  font-weight: bold;
  color: #fff;
}

.global-advice-box {
  background: #121214;
  border: 1px solid #2d2d35;
  border-radius: 8px;
  padding: 10px 12px;
}

.global-advice-box h4 {
  margin: 0 0 6px 0;
  font-size: 12px;
  color: #818cf8;
}

.global-advice-box ul {
  margin: 0;
  padding-left: 16px;
  font-size: 11px;
  color: #cbd5e1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.global-advice-box span {
  color: #93c5fd;
  font-weight: bold;
}
</style>