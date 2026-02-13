/**
 * AI游戏开发商模拟器 - 入口文件
 */
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import './style.css';

async function initializeApp() {
  console.log('【应用启动】开始初始化...');

  const app = createApp(App);
  app.use(createPinia());
  app.use(router);
  app.mount('#app');

  console.log('【应用启动】✅ 应用已成功挂载');
}

initializeApp();
