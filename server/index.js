// Node.js Express 服务端入口
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import aiRouter from './routes/ai.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件配置
app.use(cors());
app.use(express.json({ limit: '50mb' })); // 支持大文本小说传输
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 路由挂载
app.use('/api', aiRouter);

// 启动服务
app.listen(PORT, () => {
  console.log(`[AI Short Drama Server] 运行于: http://localhost:${PORT}`);
});