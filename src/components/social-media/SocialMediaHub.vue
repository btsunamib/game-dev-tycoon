<!--
  AI游戏开发商模拟器 - 社交媒体监控中心
  作为所有平台的入口，展示各平台关键指标
-->
<template>
  <div class="social-media-hub">
    <!-- 子路由内容（平台详情页） -->
    <router-view v-if="!isHubRoot" />

    <!-- Hub 主页内容 -->
    <div v-else class="hub-content">
      <div class="hub-header">
        <h2 class="hub-title">📱 社交媒体监控中心</h2>
      </div>

      <!-- 无已发布游戏时的提示（不阻止浏览） -->
      <div v-if="gameList.length === 0" class="empty-hint-bar">
        <span class="empty-hint-icon">💡</span>
        <span>暂无已发布游戏，发布游戏后各平台将显示社交媒体反馈数据</span>
      </div>

      <!-- 游戏选择器（有游戏时显示） -->
      <div v-if="gameList.length > 0" class="game-selector">
        <label class="selector-label">选择关注的游戏：</label>
        <select v-model="selectedGameId" class="selector-dropdown">
          <option v-for="game in gameList" :key="game.id" :value="game.id">
            {{ game.name }}
          </option>
        </select>
      </div>

      <!-- 平台卡片网格（始终显示） -->
        <div class="platform-grid">
          <!-- Steam -->
          <div class="platform-card steam-card" @click="navigateTo('steam')">
            <div class="card-icon">🎮</div>
            <div class="card-name">Steam</div>
            <div class="card-metric">
              <template v-if="steamData">
                好评 {{ steamData.好评率 }}%
              </template>
              <template v-else>暂无数据</template>
            </div>
            <div class="card-sub" v-if="steamData">
              {{ formatNumber(steamData.同时在线) }} 在线
            </div>
          </div>

          <!-- WeGame -->
          <div class="platform-card wegame-card" @click="navigateTo('wegame')">
            <div class="card-icon">🎯</div>
            <div class="card-name">WeGame</div>
            <div class="card-metric">
              <template v-if="wegameData">
                评分 {{ wegameData.评分.toFixed(1) }}
              </template>
              <template v-else>暂无数据</template>
            </div>
            <div class="card-sub" v-if="wegameData">
              {{ formatNumber(wegameData.评价数量) }} 评价
            </div>
          </div>

          <!-- Bilibili -->
          <div class="platform-card bilibili-card" @click="navigateTo('bilibili')">
            <div class="card-icon">📺</div>
            <div class="card-name">B站</div>
            <div class="card-metric">
              <template v-if="bilibiliData">
                热度 {{ formatNumber(bilibiliData.话题热度) }}
              </template>
              <template v-else>暂无数据</template>
            </div>
            <div class="card-sub" v-if="bilibiliData">
              {{ bilibiliData.视频列表.length }} 个视频
            </div>
          </div>

          <!-- 微博 -->
          <div class="platform-card weibo-card" @click="navigateTo('weibo')">
            <div class="card-icon">📢</div>
            <div class="card-name">微博</div>
            <div class="card-metric">
              <template v-if="weiboHotSearch">
                热搜 #{{ weiboHotSearch.排名 }}
              </template>
              <template v-else>暂无数据</template>
            </div>
            <div class="card-sub" v-if="store.platformData?.weibo">
              {{ store.platformData.weibo.相关微博.length }} 条微博
            </div>
          </div>

          <!-- 贴吧 -->
          <div class="platform-card tieba-card" @click="navigateTo('tieba')">
            <div class="card-icon">📋</div>
            <div class="card-name">贴吧</div>
            <div class="card-metric">
              <template v-if="tiebaData">
                {{ tiebaData.帖子列表.length }} 帖子
              </template>
              <template v-else>暂无��据</template>
            </div>
            <div class="card-sub" v-if="tiebaData">
              {{ formatNumber(tiebaData.吧友数量) }} 关注
            </div>
          </div>

          <!-- QQ群 -->
          <div class="platform-card qq-card" @click="navigateTo('qq')">
            <div class="card-icon">🐧</div>
            <div class="card-name">QQ群</div>
            <div class="card-metric">
              <template v-if="qqFirstGroup">
                {{ formatNumber(qqFirstGroup.成员数) }} 成员
              </template>
              <template v-else>暂无数据</template>
            </div>
            <div class="card-sub" v-if="qqGroupCount > 0">
              {{ qqGroupCount }} 个群
            </div>
          </div>

          <!-- Discord -->
          <div class="platform-card discord-card" @click="navigateTo('discord')">
            <div class="card-icon">🎧</div>
            <div class="card-name">Discord</div>
            <div class="card-metric">
              <template v-if="discordFirstServer">
                {{ formatNumber(discordFirstServer.成员数) }} 成员
              </template>
              <template v-else>暂无数据</template>
            </div>
            <div class="card-sub" v-if="discordFirstServer">
              {{ formatNumber(discordFirstServer.在线人数) }} 在线
            </div>
          </div>

          <!-- Twitter -->
          <div class="platform-card twitter-card" @click="navigateTo('twitter')">
            <div class="card-icon">𝕏</div>
            <div class="card-name">Twitter</div>
            <div class="card-metric">
              <template v-if="store.platformData?.twitter">
                热度 {{ formatNumber(store.platformData.twitter.话题热度) }}
              </template>
              <template v-else>暂无数据</template>
            </div>
            <div class="card-sub" v-if="store.platformData?.twitter">
              {{ store.platformData.twitter.推文.length }} 推文
            </div>
          </div>
        </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useGameStateStore } from '@/stores/gameStateStore';

const store = useGameStateStore();
const route = useRoute();
const router = useRouter();

// 是否在社交媒体根路由
const isHubRoot = computed(() => {
  return route.path === '/game/social-media' || route.path === '/game/social-media/';
});

// 已发布游戏列表
const gameList = computed(() => {
  if (!store.publishedGames) return [];
  return Object.entries(store.publishedGames).map(([id, game]) => ({
    id,
    name: game.名称,
  }));
});

// 当前选中的游戏ID
const selectedGameId = ref('');

// 自动选中第一个游戏
watch(gameList, (list) => {
  if (list.length > 0 && !selectedGameId.value) {
    selectedGameId.value = list[0].id;
  }
}, { immediate: true });

// 当前选中游戏名称
const selectedGameName = computed(() => {
  if (!store.publishedGames || !selectedGameId.value) return '';
  return store.publishedGames[selectedGameId.value]?.名称 ?? '';
});

// ===== 各平台数据 =====

// Steam数据
const steamData = computed(() => {
  if (!store.platformData?.steam?.游戏页面) return null;
  const name = selectedGameName.value;
  if (!name) return null;
  return store.platformData.steam.游戏页面[name] ?? null;
});

// WeGame数据
const wegameData = computed(() => {
  if (!store.platformData?.wegame?.游戏页面) return null;
  const name = selectedGameName.value;
  if (!name) return null;
  return store.platformData.wegame.游戏页面[name] ?? null;
});

// Bilibili数据
const bilibiliData = computed(() => {
  if (!store.platformData?.bilibili?.话题) return null;
  const name = selectedGameName.value;
  if (!name) return null;
  return store.platformData.bilibili.话题[name] ?? null;
});

// 微博热搜
const weiboHotSearch = computed(() => {
  if (!store.platformData?.weibo?.热搜) return null;
  return store.platformData.weibo.热搜[0] ?? null;
});

// 贴吧数据
const tiebaData = computed(() => {
  if (!store.platformData?.tieba?.贴吧) return null;
  const name = selectedGameName.value;
  if (!name) return null;
  return store.platformData.tieba.贴吧[name] ?? null;
});

// QQ群数据
const qqFirstGroup = computed(() => {
  if (!store.platformData?.qq群?.群列表) return null;
  const groups = Object.values(store.platformData.qq群.群列表);
  return groups[0] ?? null;
});

const qqGroupCount = computed(() => {
  if (!store.platformData?.qq群?.群列表) return 0;
  return Object.keys(store.platformData.qq群.群列表).length;
});

// Discord数据
const discordFirstServer = computed(() => {
  if (!store.platformData?.discord?.服务器) return null;
  const servers = Object.values(store.platformData.discord.服务器);
  return servers[0] ?? null;
});

// 数字格式化
function formatNumber(num: number | undefined): string {
  if (num === undefined || num === null) return '0';
  if (num >= 100000000) return (num / 100000000).toFixed(1) + '亿';
  if (num >= 10000) return (num / 10000).toFixed(1) + '万';
  return num.toLocaleString();
}

// 导航到平台页面
function navigateTo(platform: string) {
  router.push(`/game/social-media/${platform}`);
}
</script>

<style scoped>
.social-media-hub {
  width: 100%;
  height: 100%;
}

.hub-content {
  padding: 20px;
}

.hub-header {
  margin-bottom: 24px;
}

.hub-title {
  font-size: 22px;
  font-weight: 700;
  color: #e0e0e0;
  margin: 0;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  text-align: center;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-text {
  font-size: 18px;
  color: #999;
  margin: 0 0 8px;
}

.empty-hint {
  font-size: 14px;
  color: #666;
  margin: 0;
}

/* 空状态提示条 */
.empty-hint-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  margin-bottom: 20px;
  background: rgba(255, 170, 0, 0.08);
  border: 1px solid rgba(255, 170, 0, 0.2);
  border-radius: 8px;
  font-size: 14px;
  color: #ccc;
}

.empty-hint-icon {
  font-size: 18px;
}

/* 游戏选择器 */
.game-selector {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.selector-label {
  font-size: 14px;
  color: #aaa;
  white-space: nowrap;
}

.selector-dropdown {
  flex: 1;
  max-width: 300px;
  padding: 8px 12px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 6px;
  color: #e0e0e0;
  font-size: 14px;
  cursor: pointer;
  outline: none;
}

.selector-dropdown:focus {
  border-color: #00d4ff;
}

.selector-dropdown option {
  background: #1a1a2e;
  color: #e0e0e0;
}

/* 平台卡片网格 */
.platform-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

@media (max-width: 900px) {
  .platform-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.platform-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 16px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.25s ease;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.04);
}

.platform-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
}

.card-icon {
  font-size: 36px;
  margin-bottom: 8px;
}

.card-name {
  font-size: 16px;
  font-weight: 600;
  color: #e0e0e0;
  margin-bottom: 8px;
}

.card-metric {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 4px;
}

.card-sub {
  font-size: 12px;
  color: #888;
}

/* 各平台卡片主题色 */
.steam-card {
  border-color: rgba(27, 40, 56, 0.6);
  background: linear-gradient(135deg, rgba(27, 40, 56, 0.4), rgba(27, 40, 56, 0.15));
}
.steam-card:hover {
  border-color: #1b2838;
  background: linear-gradient(135deg, rgba(27, 40, 56, 0.6), rgba(27, 40, 56, 0.3));
}
.steam-card .card-metric { color: #66c0f4; }

.wegame-card {
  border-color: rgba(255, 102, 0, 0.3);
  background: linear-gradient(135deg, rgba(255, 102, 0, 0.15), rgba(255, 102, 0, 0.05));
}
.wegame-card:hover {
  border-color: rgba(255, 102, 0, 0.5);
  background: linear-gradient(135deg, rgba(255, 102, 0, 0.25), rgba(255, 102, 0, 0.1));
}
.wegame-card .card-metric { color: #ff6600; }

.bilibili-card {
  border-color: rgba(251, 114, 153, 0.3);
  background: linear-gradient(135deg, rgba(251, 114, 153, 0.15), rgba(251, 114, 153, 0.05));
}
.bilibili-card:hover {
  border-color: rgba(251, 114, 153, 0.5);
  background: linear-gradient(135deg, rgba(251, 114, 153, 0.25), rgba(251, 114, 153, 0.1));
}
.bilibili-card .card-metric { color: #fb7299; }

.weibo-card {
  border-color: rgba(255, 130, 0, 0.3);
  background: linear-gradient(135deg, rgba(255, 130, 0, 0.15), rgba(255, 130, 0, 0.05));
}
.weibo-card:hover {
  border-color: rgba(255, 130, 0, 0.5);
  background: linear-gradient(135deg, rgba(255, 130, 0, 0.25), rgba(255, 130, 0, 0.1));
}
.weibo-card .card-metric { color: #ff8200; }

.tieba-card {
  border-color: rgba(72, 121, 189, 0.3);
  background: linear-gradient(135deg, rgba(72, 121, 189, 0.15), rgba(72, 121, 189, 0.05));
}
.tieba-card:hover {
  border-color: rgba(72, 121, 189, 0.5);
  background: linear-gradient(135deg, rgba(72, 121, 189, 0.25), rgba(72, 121, 189, 0.1));
}
.tieba-card .card-metric { color: #4879bd; }

.qq-card {
  border-color: rgba(18, 183, 245, 0.3);
  background: linear-gradient(135deg, rgba(18, 183, 245, 0.15), rgba(18, 183, 245, 0.05));
}
.qq-card:hover {
  border-color: rgba(18, 183, 245, 0.5);
  background: linear-gradient(135deg, rgba(18, 183, 245, 0.25), rgba(18, 183, 245, 0.1));
}
.qq-card .card-metric { color: #12b7f5; }

.discord-card {
  border-color: rgba(88, 101, 242, 0.3);
  background: linear-gradient(135deg, rgba(88, 101, 242, 0.15), rgba(88, 101, 242, 0.05));
}
.discord-card:hover {
  border-color: rgba(88, 101, 242, 0.5);
  background: linear-gradient(135deg, rgba(88, 101, 242, 0.25), rgba(88, 101, 242, 0.1));
}
.discord-card .card-metric { color: #5865f2; }

.twitter-card {
  border-color: rgba(29, 161, 242, 0.3);
  background: linear-gradient(135deg, rgba(29, 161, 242, 0.15), rgba(29, 161, 242, 0.05));
}
.twitter-card:hover {
  border-color: rgba(29, 161, 242, 0.5);
  background: linear-gradient(135deg, rgba(29, 161, 242, 0.25), rgba(29, 161, 242, 0.1));
}
.twitter-card .card-metric { color: #1da1f2; }
</style>
