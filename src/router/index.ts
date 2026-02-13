/**
 * AI游戏开发商模拟器 - 路由配置
 */
import { createRouter, createMemoryHistory } from 'vue-router';

// 页面组件
import StartPage from '../views/StartPage.vue';
import CompanyCreation from '../views/CompanyCreation.vue';
import GameView from '../views/GameView.vue';

// 游戏面板组件
import MainGamePanel from '../components/dashboard/MainGamePanel.vue';
import EmployeePanel from '../components/dashboard/EmployeePanel.vue';
import FinancePanel from '../components/dashboard/FinancePanel.vue';
import ProjectPanel from '../components/dashboard/ProjectPanel.vue';
import CompetitorPanel from '../components/dashboard/CompetitorPanel.vue';
import SettingsPanel from '../components/dashboard/SettingsPanel.vue';
import SavePanel from '../components/dashboard/SavePanel.vue';
import MemoryCenterPanel from '../components/dashboard/MemoryCenterPanel.vue';

// 社交媒体面板
import SocialMediaHub from '../components/social-media/SocialMediaHub.vue';
import SteamPage from '../components/social-media/SteamPage.vue';
import BilibiliPage from '../components/social-media/BilibiliPage.vue';
import WeiboPage from '../components/social-media/WeiboPage.vue';
import TiebaPage from '../components/social-media/TiebaPage.vue';
import QQGroupPage from '../components/social-media/QQGroupPage.vue';
import DiscordPage from '../components/social-media/DiscordPage.vue';
import TwitterPage from '../components/social-media/TwitterPage.vue';
import WeGamePage from '../components/social-media/WeGamePage.vue';
import BossZhipinPage from '../components/social-media/BossZhipinPage.vue';

const routes = [
  {
    path: '/',
    name: 'Start',
    component: StartPage,
  },
  {
    path: '/creation',
    name: 'CompanyCreation',
    component: CompanyCreation,
  },
  {
    path: '/game',
    name: 'Game',
    component: GameView,
    children: [
      {
        path: '',
        name: 'GameMain',
        component: MainGamePanel,
      },
      {
        path: 'employees',
        name: 'Employees',
        component: EmployeePanel,
      },
      {
        path: 'finance',
        name: 'Finance',
        component: FinancePanel,
      },
      {
        path: 'projects',
        name: 'Projects',
        component: ProjectPanel,
      },
      {
        path: 'competitors',
        name: 'Competitors',
        component: CompetitorPanel,
      },
      {
        path: 'settings',
        name: 'Settings',
        component: SettingsPanel,
      },
      {
        path: 'save',
        name: 'Save',
        component: SavePanel,
      },
      {
        path: 'memory',
        name: 'MemoryCenter',
        component: MemoryCenterPanel,
      },
      {
        path: 'social-media',
        name: 'SocialMedia',
        component: SocialMediaHub,
        children: [
          { path: 'steam', name: 'Steam', component: SteamPage },
          { path: 'wegame', name: 'WeGame', component: WeGamePage },
          { path: 'bilibili', name: 'Bilibili', component: BilibiliPage },
          { path: 'weibo', name: 'Weibo', component: WeiboPage },
          { path: 'tieba', name: 'Tieba', component: TiebaPage },
          { path: 'qq', name: 'QQGroup', component: QQGroupPage },
          { path: 'discord', name: 'Discord', component: DiscordPage },
          { path: 'twitter', name: 'Twitter', component: TwitterPage },
          { path: 'boss', name: 'BossZhipin', component: BossZhipinPage },
        ],
      },
    ],
  },
];

const router = createRouter({
  history: createMemoryHistory(),
  routes,
});

export default router;
