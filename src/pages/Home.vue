<!-- Home 页面组件：主界面排版与容器 -->
<template>
  <div class="flex flex-col h-screen overflow-hidden bg-apple-bg">
    <!-- 顶部 HeaderBar -->
    <HeaderBar />

    <!-- 中间左右分栏主工作区 (左 40% / 右 60%) -->
    <main class="flex-1 flex overflow-hidden p-4 gap-4">
      <!-- 左侧：小说输入区域 (40%) -->
      <section class="w-[40%] h-full">
        <NovelInput />
      </section>

      <!-- 右侧：分镜输出区域 (60%) -->
      <section class="w-[60%] h-full">
        <OutputPanel />
      </section>
    </main>

    <!-- 底部状态与操作 Toolbar -->
    <Toolbar />
  </div>
</template>

<script setup>
// 职责：仅负责页面布局排版、组件聚合与状态调用，禁止在 Home.vue 中编写 AI 调用或 Prompt 逻辑
import HeaderBar from '../components/HeaderBar.vue';
import NovelInput from '../components/NovelInput.vue';
import OutputPanel from '../components/OutputPanel.vue';
import Toolbar from '../components/Toolbar.vue';
</script>