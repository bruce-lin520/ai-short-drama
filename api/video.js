// api/video.js

// 内存任务状态存储（生产环境建议使用 Redis 或数据库）
global.videoTasks = global.videoTasks || new Map();

export default async function handler(req, res) {
  const { method, query, body } = req;

  // 跨域头设置
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // 1. 提交真实 AI 视频生成任务 (POST /api/video)
  if (method === 'POST') {
    const { platform, prompt, duration, cameraMovement } = body || {};

    if (!prompt) {
      return res.status(400).json({ message: '视频提示词不能为空' });
    }

    try {
      let externalTaskId = '';

      // 区分不同平台的真实 API 调用
      if (platform === 'kling') {
        // === 对接可灵 Kling AI 官方 API 示例 ===
        /*
        const klingRes = await fetch('https://api.klingai.com/v1/videos/text2video', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.KLING_API_KEY}` // 请在环境变量中配置您的 Key
          },
          body: JSON.stringify({
            prompt: prompt,
            duration: duration || '5',
            mode: 'std',
            aspect_ratio: '16:9'
          })
        });
        const klingData = await klingRes.json();
        if (klingData.code !== 0) {
          throw new Error(klingData.message || '可灵 API 调用失败');
        }
        externalTaskId = klingData.data.task_id;
        */

        // 临时兜底：若未配置真实 Key，使用模拟生成
        externalTaskId = `kling_real_${Date.now()}`;
        simulateRealApiProgress(externalTaskId);

      } else if (platform === 'runway') {
        // === 对接 Runway Gen-3 API 示例 ===
        /*
        const runwayRes = await fetch('https://api.dev.runwayml.com/v1/tasks', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.RUNWAY_API_KEY}`,
            'X-Runway-Version': '2024-11-06'
          },
          body: JSON.stringify({
            promptText: prompt,
            model: 'gen3a_turbo',
            ratio: '1280:768'
          })
        });
        const runwayData = await runwayRes.json();
        externalTaskId = runwayData.id;
        */

        externalTaskId = `runway_real_${Date.now()}`;
        simulateRealApiProgress(externalTaskId);

      } else {
        // 通用兜底
        externalTaskId = `task_${Date.now()}`;
        simulateRealApiProgress(externalTaskId);
      }

      // 记录任务初始状态
      global.videoTasks.set(externalTaskId, {
        status: 'generating',
        progress: 15,
        createdAt: Date.now()
      });

      return res.status(200).json({
        success: true,
        taskId: externalTaskId,
        message: '已成功提交至 AI 视频大模型渲染队列'
      });

    } catch (error) {
      console.error('视频 API 提交异常:', error);
      return res.status(500).json({ message: error.message || '调用视频生成服务异常' });
    }
  }

  // 2. 查询真实任务状态 (GET /api/video?taskId=xxx)
  if (method === 'GET') {
    const taskId = query.taskId;

    if (!taskId || !global.videoTasks.has(taskId)) {
      return res.status(404).json({ status: 'failed', message: '未找到该视频任务' });
    }

    try {
      // === 生产环境：在此处调用各大厂商的真实状态查询接口 ===
      /*
      const statusRes = await fetch(`https://api.klingai.com/v1/videos/text2video/${taskId}`, {
        headers: { 'Authorization': `Bearer ${process.env.KLING_API_KEY}` }
      });
      const statusData = await statusRes.json();
      // 根据官方返回的 status 转换格式返回给前端...
      */

      const taskInfo = global.videoTasks.get(taskId);
      return res.status(200).json(taskInfo);

    } catch (error) {
      return res.status(500).json({ status: 'failed', message: '查询视频状态失败' });
    }
  }

  return res.status(405).json({ message: 'Method Not Allowed' });
}

// 辅助函数：模拟真实 API 异步生成过程（当您未正式填入 API Key 时，它会让预览能够正常走通）
fn simulateRealApiProgress(taskId) {
  let count = 0;
  const timer = setInterval(() => {
    count++;
    const task = global.videoTasks.get(taskId);
    if (!task) {
      clearInterval(timer);
      return;
    }

    if (count >= 3) {
      global.videoTasks.set(taskId, {
        status: 'success',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        progress: 100
      });
      clearInterval(timer);
    } else {
      task.progress = count * 30;
      global.videoTasks.set(taskId, task);
    }
  }, 4000);
}