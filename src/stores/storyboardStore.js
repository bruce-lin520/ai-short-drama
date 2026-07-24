// src/stores/storyboardStore.js
import { defineStore } from 'pinia';
import * as XLSX from 'xlsx';

export const useStoryboardStore = defineStore('storyboard', {
  state: () => ({
    novelText: '',
    generatedContent: '',
    isLoading: false,
    errorMessage: '',
    scenes: [],
    characterList: [],
  }),

  actions: {
    parseMarkdownToStructure(markdownText) {
      if (!markdownText) {
        this.scenes = [];
        this.characterList = [];
        return;
      }

      const scenesArr = [];
      const rawSections = markdownText.split(/(?=^#{1,3}\s+)/m);
      let sceneIndex = 1;

      for (const section of rawSections) {
        const trimmed = section.trim();
        if (!trimmed || trimmed.includes('核心角色列表')) continue;

        const titleMatch = trimmed.match(/^#{1,3}\s+(.*)/m);
        const rawTitle = titleMatch ? titleMatch[1].replace(/\*\*/g, '').trim() : `镜头 ${sceneIndex}`;

        const getValueByKeys = (keys) => {
          for (const key of keys) {
            const reg = new RegExp(`(?:[-*#>]|\\*\\*)*\\s*${key}[：:]\\s*(.*)`, 'i');
            const match = trimmed.match(reg);
            if (match && match[1].trim()) {
              return match[1].replace(/\*\*/g, '').trim();
            }
          }
          return '';
        };

        const location = getValueByKeys(['场景地点', '场景环境', '场景', '地点']);
        const charactersInScene = getValueByKeys(['出场人物', '角色列表', '主要人物', '人物', '角色']);
        const emotion = getValueByKeys(['氛围情绪', '场景氛围', '情绪', '氛围']);
        const camera = getValueByKeys(['镜头设计', '运镜建议', '镜头']);

        let plot = getValueByKeys(['画面描述', '剧情描述', '剧情摘要', '剧情', '内容', '字幕']);
        if (!plot) {
          const lines = trimmed
            .split('\n')
            .map(l => l.trim())
            .filter(l => l && !l.startsWith('#'));
          
          const textLines = lines.filter(l => !l.match(/^(场景|地点|人物|角色|情绪|氛围|镜头|Prompt|提示词|Cinematic)[：:]/i));
          plot = textLines.join(' ') || rawTitle;
        }

        let prompt = '';
        const promptMatch = trimmed.match(/(?:Prompt|提示词|画面Prompt)[：:]\s*([\s\S]*?)(?=\n\n|\n[#-]|^\s*$|$)/i);
        if (promptMatch) {
          prompt = promptMatch[1].replace(/\*\*/g, '').trim();
        } else {
          prompt = plot;
        }

        const existingScene = this.scenes.find(s => s.id === sceneIndex);

        scenesArr.push({
          id: sceneIndex,
          sceneNumber: sceneIndex,
          title: rawTitle,
          description: plot,
          prompt: prompt,
          englishPrompt: prompt,
          videoPrompt: camera || '中景推近',
          cameraMovement: camera || '固定镜头',
          bgmSuggestion: emotion || '平静',
          imageUrl: existingScene ? existingScene.imageUrl : '',
          isGeneratingImage: existingScene ? existingScene.isGeneratingImage : false,
          imageError: existingScene ? existingScene.imageError : '',
        });

        sceneIndex++;
      }

      if (scenesArr.length === 0 && markdownText.trim()) {
        scenesArr.push({
          id: 1,
          sceneNumber: 1,
          title: '镜头 1',
          description: markdownText,
          prompt: markdownText,
          englishPrompt: markdownText,
          videoPrompt: '中景推近',
          cameraMovement: '固定镜头',
          bgmSuggestion: '平静',
          imageUrl: '',
          isGeneratingImage: false,
          imageError: '',
        });
      }

      this.scenes = scenesArr;
    },

    async generateStoryboard() {
      if (!this.novelText.trim()) {
        this.errorMessage = '请输入小说内容';
        return;
      }

      this.isLoading = true;
      this.errorMessage = '';
      this.generatedContent = '';
      this.scenes = [];
      this.characterList = [];

      try {
        const response = await fetch('/api/storyboard', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ prompt: `请将以下小说内容拆解为短剧分镜表：\n\n小说原文：${this.novelText}` }),
        });

        if (!response.ok) {
          throw new Error(`请求失败: ${response.statusText}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const dataStr = line.replace('data: ', '').trim();
              if (dataStr === '[DONE]') {
                this.isLoading = false;
                this.parseMarkdownToStructure(this.generatedContent);
                return;
              }
              try {
                const parsed = JSON.parse(dataStr);
                if (parsed.content) {
                  this.generatedContent += parsed.content;
                  this.parseMarkdownToStructure(this.generatedContent);
                }
              } catch (e) {
                // 忽略流解析中间过程的 JSON 碎片
              }
            }
          }
        }
      } catch (err) {
        this.errorMessage = err.message || '生成失败，请检查网络';
      } finally {
        this.isLoading = false;
      }
    },

    exportToExcel() {
      if (this.scenes.length === 0) {
        alert('暂无分镜数据可导出！');
        return;
      }

      const excelData = this.scenes.map((item) => ({
        镜号: `SC-${String(item.id).padStart(2, '0')}`,
        幕次标题: item.title,
        画面描述: item.description,
        镜头设计: item.cameraMovement,
        氛围情绪: item.bgmSuggestion,
        画面提示词_Prompt: item.prompt,
      }));

      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, '短剧分镜表');

      XLSX.writeFile(workbook, `AI短剧分镜脚本_${new Date().toISOString().slice(0, 10)}.xlsx`);
    },

    exportToJSON() {
      if (this.scenes.length === 0) {
        alert('暂无数据导出！');
        return;
      }

      const exportData = {
        characters: this.characterList,
        scenes: this.scenes
      };

      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `storyboard_data_${new Date().getTime()}.json`);
      downloadAnchor.click();
      downloadAnchor.remove();
    }
  }
});