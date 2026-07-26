<template>
  <div class="space-y-6">
    <!-- 加载状态 -->
    <div v-if="store.loading" class="text-center py-12 text-gray-400">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-500 border-t-transparent mb-2"></div>
      <p class="text-sm">正在深度解析剧本、构建角色与生成多平台 AI 提示词...</p>
    </div>

    <!-- 数据展示区域 -->
    <div v-else-if="store.v2Data.storyboards && store.v2Data.storyboards.length > 0" class="space-y-6">
      
      <!-- 角色库展示 -->
      <div v-if="store.v2Data.characters && store.v2Data.characters.length > 0" class="bg-gray-900/60 border border-gray-700/60 rounded-xl p-4">
        <h4 class="text-sm font-bold text-indigo-400 mb-3 flex items-center">
          👥 提取的角色库（确保多镜头形象一致）
        </h4>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div v-for="char in store.v2Data.characters" :key="char.id" class="p-3 bg-gray-800/80 rounded-lg border border-gray-700/40 text-xs">
            <span class="font-bold text-white text-sm">{{ char.name }}</span>
            <p class="text-gray-300 mt-1">{{ char.appearance }}</p>
          </div>
        </div>
      </div>

      <!-- 分镜列表展示 -->
      <div class="space-y-4">
        <h4 class="text-sm font-bold text-emerald-400 flex items-center">
          🎬 专业分镜与多平台 Prompt 列表
        </h4>

        <div v-for="(shot, index) in store.v2Data.storyboards" :key="index" class="bg-gray-900/80 border border-gray-700/60 rounded-xl p-5 space-y-4">
          
          <!-- 镜头头部信息 -->
          <div class="flex items-center justify-between border-b border-gray-800 pb-3">
            <div class="flex items-center space-x-2">
              <span class="px-2.5 py-1 bg-indigo-600/20 text-indigo-400 text-xs font-bold rounded-md border border-indigo-500/30">
                镜头 {{ shot.shotNumber || (index + 1) }}
              </span>
              <span class="font-bold text-white text-base">{{ shot.title }}</span>
            </div>
            <div class="text-xs text-gray-400 space-x-2">
              <span class="bg-gray-800 px-2 py-1 rounded">运镜: {{ shot.cameraMovement }}</span>
              <span class="bg-gray-800 px-2 py-1 rounded">出场: {{ shot.character || '通用' }}</span>
            </div>
          </div>

          <!-- 画面与剧本详情 -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div class="space-y-2 bg-gray-800/40 p-3 rounded-lg border border-gray-700/30">
              <p><strong class="text-gray-400">画面描述：</strong><span class="text-gray-200">{{ shot.plot }}</span></p>
              <p><strong class="text-gray-400">字幕/旁白：</strong><span class="text-amber-300">{{ shot.subtitle || shot.voiceover || '无' }}</span></p>
              <p><strong class="text-gray-400">背景音乐：</strong><span class="text-purple-300">{{ shot.bgm }}</span></p>
            </div>

            <!-- 导演建议 -->
            <div class="bg-amber-500/10 border border-amber-500/20 p-3 rounded-lg text-amber-200 space-y-1">
              <div class="font-bold text-amber-400 flex items-center space-x-1">
                <span>💡 导演修改建议</span>
              </div>
              <p class="leading-relaxed">{{ shot.directorAdvice || '暂无特殊建议，注意把控前三秒节奏。' }}</p>
            </div>
          </div>

          <!-- 多平台 Prompt 复制区 -->
          <div class="space-y-2 pt-2 border-t border-gray-800">
            <div class="text-xs font-semibold text-gray-400">AI 视频生成提示词（多平台一键适配）：</div>
            
            <div class="space-y-1.5 text-xs font-mono">
              <!-- 可灵/即梦 -->
              <div class="flex items-center justify-between bg-gray-950 p-2 rounded border border-gray-800">
                <span class="text-indigo-400 truncate mr-2"><strong class="text-gray-400 font-sans">可灵/即梦:</strong> {{ shot.klingPrompt || shot.englishPrompt }}</span>
                <button @click="copyText(shot.klingPrompt || shot.englishPrompt)" class="px-2 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded text-[10px] shrink-0">复制</button>
              </div>

              <!-- Runway -->
              <div class="flex items-center justify-between bg-gray-950 p-2 rounded border border-gray-800">
                <span class="text-emerald-400 truncate mr-2"><strong class="text-gray-400 font-sans">Runway:</strong> {{ shot.runwayPrompt }}</span>
                <button @click="copyText(shot.runwayPrompt)" class="px-2 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded text-[10px] shrink-0">复制</button>
              </div>

              <!-- Veo -->
              <div class="flex items-center justify-between bg-gray-950 p-2 rounded border border-gray-800">
                <span class="text-purple-400 truncate mr-2"><strong class="text-gray-400 font-sans">Google Veo:</strong> {{ shot.veoPrompt }}</span>
                <button @click="copyText(shot.veoPrompt)" class="px-2 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded text-[10px] shrink-0">复制</button>
              </div>
            </div>
          </div>

        </div>
      </div>

    </div>

    <!-- 初始空状态 -->
    <div v-else class="text-center py-16 text-gray-500 border border-dashed border-gray-700 rounded-xl">
      <p class="text-sm">暂无分镜数据，请在上方输入小说或创意并点击“一键生成专业分镜”</p>
    </div>
  </div>
</template>

<script setup>
import { useStoryboardStore } from '@/stores/storyboardStore';

const store = useStoryboardStore();

// 复制文本到剪贴板通用函数
const copyText = (text) => {
  if (!text) return;
  navigator.clipboard.writeText(text).then(() => {
    alert("提示词已成功复制到剪贴板！");
  }).catch(err => {
    console.error('复制失败', err);
  });
};
</script>