// src/utils/download.js

export function handleExport(format, currentV2Data) {
  if (!currentV2Data || !currentV2Data.storyboards) {
    alert("请先生成分镜数据后再导出！");
    return;
  }

  if (format === 'json') {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(currentV2Data, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `AI短剧分镜剧本_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  } 
  else if (format === 'markdown') {
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
  }
}