// 应用程序入口文件：初始化 Vue 应用及 Pinia 状态库
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import './assets/main.css';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.mount('#app');