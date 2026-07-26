import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';

export const useStoryboardStore = defineStore('storyboard', () => {
  const loading = ref(false);
  const isLoading = computed(() => loading.value);
  const errorMsg = ref('');
  const errorMessage = computed(() => errorMsg.value);
  
  // 1. 初始化时尝试从 localStorage 读取缓存数据
  const savedNovelText = localStorage.getItem('ai_short_drama_novelText') || '';
  
  let savedV2Data = {
    characters: [
      { id: 1, name: "林深", description: "年轻外卖员，疲惫面容，微青胡茬，眼神坚毅" }
    ],
    storyboards: []
  };
  
  try {
    const localV2 = localStorage.getItem('ai_short_drama_v2Data');
    if (localV2) {
      const parsed = JSON.parse(localV2);
      if (parsed && parsed.storyboards) {
        savedV2Data = parsed;
      }
    }
  } catch (e) {
    console.error("解析本地缓存失败", e);
  }

  const novelText = ref(savedNovelText);
  const v2Data = ref(savedV2Data);

  // 2. 自动同步到 localStorage
  watch(novelText, (newVal) => {
    localStorage.setItem('ai_short_drama_novelText', newVal);
  });

  watch(v2Data, (newVal) => {
    localStorage.setItem('ai_short_drama_v2Data', JSON.stringify(newVal));
  }, { deep: true });

  const scenes = computed({
    get() {
      return (v2Data.value.storyboards || []).map((item, index) => ({
        sceneNumber: item.shotNumber || index + 1,
        title: item.title || '',
        duration: item.duration || '3s',
        description: item.plot || item.description || '',
        subtitle: item.subtitle || '',
        voiceover: item.voiceover || '',
        prompt: item.prompt || '',
        englishPrompt: item.klingPrompt || item.englishPrompt || '',
        videoPrompt: item.runwayPrompt || '',
        cameraMovement: item.cameraMovement || '',
        bgmSuggestion: item.bgm || '',
        directorAdvice: item.directorAdvice || '当前镜头视觉张力良好，建议配合节奏紧凑的剪辑，增强观众代入感。',
        directorScore: item.directorScore || 92,
        _activePlatform: item._activePlatform || 'kling',
        isOptimizing: item.isOptimizing || false,
        isRewriting: item.isRewriting || false,
        videoStatus: item.videoStatus || 'idle',
        videoProgress: item.videoProgress || 0,
        taskId: item.taskId || null,
        videoUrl: item.videoUrl || ''
      }));
    },
    set(newVal) {
      v2Data.value.storyboards = (newVal || []).map((item, index) => ({
        shotNumber: index + 1,
        title: item.title,
        duration: item.duration,
        plot: item.description,
        subtitle: item.subtitle,
        voiceover: item.voiceover,
        prompt: item.prompt,
        klingPrompt: item.englishPrompt,
        runwayPrompt: item.videoPrompt,
        cameraMovement: item.cameraMovement,
        bgm: item.bgmSuggestion,
        directorAdvice: item.directorAdvice,
        directorScore: item.directorScore,
        _activePlatform: item._activePlatform || 'kling',
        isOptimizing: item.isOptimizing,
        isRewriting: item.isRewriting,
        videoStatus: item.videoStatus || 'idle',
        videoProgress: item.videoProgress || 0,
        taskId: item.taskId || null,
        videoUrl: item.videoUrl || ''
      }));
    }
  });

  // 角色管理方法
  const addCharacter = (character) => {
    const chars = v2Data.value.characters || [];
    const newId = chars.length > 0 ? Math.max(...chars.map(c => c.id)) + 1 : 1;
    v2Data.value.characters.push({ id: newId, ...character });
  };

  const removeCharacter = (id) => {
    v2Data.value.characters = (v2Data.value.characters || []).filter(c => c.id !== id);
  };

  // 平台切换方法（100ms 内瞬时响应）
  const setScenePlatform = (index, platform) => {
    if (v2Data.value.storyboards && v2Data.value.storyboards[index]) {
      v2Data.value.storyboards[index]._activePlatform = platform;
    }
  };

  const moveScene = (fromIndex, toIndex) => {
    if (!v2Data.value.storyboards) return;
    if (toIndex < 0 || toIndex >= v2Data.value.storyboards.length) return;
    const target = v2Data.value.storyboards.splice(fromIndex, 1)[0];
    v2Data.value.storyboards.splice(toIndex, 0, target);
  };

  const generateStoryboard = async (promptText) => {
    if (!promptText || !promptText.trim()) {
      errorMsg.value = '请输入需要转换的小说文本！';
      return;
    }

    loading.value = true;
    errorMsg.value = '';

    const characterContext = v2Data.value.characters?.length > 0
      ? `已设定固定角色库：${JSON.stringify(v2Data.value.characters)}。\n`
      : '';

    try {
      const response = await fetch('/api/storyboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: characterContext + promptText })
      });

      const result = await response.json();
      if (result.v2Data) {
        v2Data.value = {
          characters: result.v2Data.characters || v2Data.value.characters,
          storyboards: (result.v2Data.storyboards || []).map(item => ({
            ...item,
            _activePlatform: 'kling',
            videoStatus: 'idle'
          }))
        };
      } else {
        throw new Error(result.content || '解析返回数据格式错误');
      }
    } catch (err) {
      errorMsg.value = err.message || '请求后端服务失败';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  return {
    loading,
    isLoading,
    errorMsg,
    errorMessage,
    v2Data,
    scenes,
    novelText,
    generateStoryboard,
    addCharacter,
    removeCharacter,
    setScenePlatform,
    moveScene
  };
});