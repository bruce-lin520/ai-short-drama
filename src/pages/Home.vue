<template>
  <div class="flex items-center justify-between p-4 bg-white border-b border-gray-200 shadow-sm">
    <div class="flex items-center space-x-2">
      <span class="text-lg font-bold text-gray-800">🎬 AI 短剧创作工具栏</span>
    </div>
    
    <div class="flex items-center space-x-3">
      <!-- 导出 Markdown 按钮 -->
      <button 
        @click="exportMarkdown" 
        class="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-medium text-sm shadow-sm"
      >
        📥 导出 Markdown 剧本
      </button>

      <!-- 导出 JSON 按钮 -->
      <button 
        @click="exportJson" 
        class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium text-sm shadow-sm"
      >
        📦 导出 JSON 数据包
      </button>
    </div>
  </div>
</template>

<script setup>
import { useStoryboardStore } from '@/stores/storyboardStore';

const store = useStoryboardStore();

// 导出 Markdown 逻辑
const exportMarkdown = () => {
  const currentV2Data = store.v2Data;
  if (!currentV2Data || !currentV2Data.storyboards || currentV2Data.storyboards.length === 0) {
    alert("请先生成分镜数据后再导出！");
    return;
  }

  let mdContent = `# AI 短剧专业分镜剧本\n\n`;
  
  mdContent += `## 👥 角色库\n`;
  if (currentV2Data.characters) {
    currentV2Data.characters.forEach(c => {
      mdContent += `- **${c.name}**：${c.appearance}\n`;
    });
  }
  mdContent += `\n---\n\n## 🎬 分镜列表\n\n`;

  currentV2Data.storyboards.forEach(s => {
    mdContent += `### ${s.title || ('镜头 ' + s.shotNumber)}\n`;
    mdContent += `- **出场角色**：${s.character || '无'}\n`;
    mdContent += `- **画面描述**：${s.plot}\n`;
    mdContent += `- **画面字幕**：${s.subtitle || '无'}\n`;
    mdContent += `- **配音旁白**：${s.voiceover || '无'}\n`;
    mdContent += `- **运镜方式**：${s.cameraMovement}\n`;
    mdContent += `- **背景音乐**：${s.bgm}\n`;
    mdContent += `- **导演建议**：${s.directorAdvice || '无'}\n`;
    mdContent += `- **可灵 Prompt**：\`${s.klingPrompt || s.englishPrompt}\`\n\n`;
  });

  const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const downloadAnchor = document.createElement('a');
  downloadAnchor.href = url;
  downloadAnchor.download = `AI短剧分镜剧本_${Date.now()}.md`;
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
  URL.revokeObjectURL(url);
};

// 导出 JSON 逻辑
const exportJson = () => {
  const currentV2Data = store.v2Data;
  if (!currentV2Data || !currentV2Data.storyboards || currentV2Data.storyboards.length === 0) {
    alert("请先生成分镜数据后再导出！");
    return;
  }

  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(currentV2Data, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `AI短剧分镜剧本_${Date.now()}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
};
</script>