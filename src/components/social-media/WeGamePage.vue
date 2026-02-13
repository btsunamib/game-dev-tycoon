<!--
  AI游戏开发商模拟器 - WeGame 页面
  模仿WeGame橙色主题UI，展示游戏评分和评价
-->
<template>
  <div class="wegame-page">
    <!-- 顶部导航 -->
    <div class="wegame-header">
      <button class="back-btn" @click="goBack">← 返回</button>
      <div class="wegame-logo">🎯 WeGame</div>
    </div>

    <!-- 游戏选择tabs -->
    <div class="game-tabs" v-if="gameNames.length > 0">
      <button
        v-for="name in gameNames"
        :key="name"
        :class="['game-tab', { active: selectedGame === name }]"
        @click="selectedGame = name"
      >
        {{ name }}
      </button>
    </div>

    <!-- 空状态 -->
    <div v-if="!currentGameData" class="empty-state">
      <div class="empty-icon">🎯</div>
      <p>暂无WeGame平台数据</p>
      <p class="empty-hint">游戏发布到WeGame后，玩家评价将在这里显示</p>
    </div>

    <!-- 游戏��息区域 -->
    <template v-else>
      <div class="game-info-section">
        <!-- 左侧封面 -->
        <div class="game-cover">
          <div class="cover-placeholder">
            <span class="cover-text">{{ selectedGame }}</span>
          </div>
        </div>

        <!-- 右侧信息 -->
        <div class="game-details">
          <h2 class="game-title">{{ selectedGame }}</h2>

          <!-- 评分 -->
          <div class="score-section">
            <div class="score-circle">
              <span class="score-value">{{ currentGameData.评分.toFixed(1) }}</span>
              <span class="score-max">/10</span>
            </div>
            <div class="score-info">
              <span :class="['score-label', scoreClass]">{{ scoreLabel }}</span>
              <span class="score-count">{{ formatNumber(currentGameData.评价数量) }} 人评价</span>
            </div>
          </div>

          <!-- 下载量 -->
          <div class="download-section" v-if="currentGameData.下载量">
            <span class="download-icon">📥</span>
            <span class="download-text">下载量：{{ formatNumber(currentGameData.下载量) }}</span>
          </div>

          <!-- 评分条 -->
          <div class="score-bar-section">
            <div class="score-bar-bg">
              <div class="score-bar-fill" :style="{ width: (currentGameData.评分 / 10 * 100) + '%' }"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- 评价区域 -->
      <div class="reviews-section">
        <h3 class="section-title">💬 玩家评价</h3>

        <div v-if="!currentGameData.最近评价?.length" class="no-reviews">
          暂无评价
        </div>

        <div
          v-for="(review, index) in currentGameData.最近评价"
          :key="index"
          class="review-card"
        >
          <div class="review-header">
            <div class="review-user">
              <span class="user-avatar">👤</span>
              <span class="user-name">{{ review.用户名 }}</span>
            </div>
            <div class="review-score">
              <span class="review-score-value">{{ review.评分.toFixed(1) }}</span>
              <span class="review-score-max">/10</span>
            </div>
          </div>

          <div class="review-content">
            {{ review.内容 }}
          </div>

          <div class="review-footer">
            <span class="review-helpful" v-if="review.点赞数 > 0">
              👍 {{ review.点赞数 }}
            </span>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useGameStateStore } from '@/stores/gameStateStore';

const store = useGameStateStore();
const router = useRouter();

function goBack() {
  router.push('/game/social-media');
}

// 游戏列表
const gameNames = computed(() => {
  if (!store.platformData?.wegame?.游戏页面) return [];
  return Object.keys(store.platformData.wegame.游戏页面);
});

const selectedGame = ref('');

watch(gameNames, (names) => {
  if (names.length > 0 && !selectedGame.value) {
    selectedGame.value = names[0];
  }
}, { immediate: true });

// 当前游戏数据
const currentGameData = computed(() => {
  if (!store.platformData?.wegame?.游戏页面 || !selectedGame.value) return null;
  return store.platformData.wegame.游戏页面[selectedGame.value] ?? null;
});

// 评分标签
const scoreLabel = computed(() => {
  if (!currentGameData.value) return '';
  const score = currentGameData.value.评分;
  if (score >= 9) return '神作';
  if (score >= 8) return '佳作';
  if (score >= 7) return '良好';
  if (score >= 6) return '一般';
  if (score >= 5) return '平庸';
  return '较差';
});

const scoreClass = computed(() => {
  if (!currentGameData.value) return '';
  const score = currentGameData.value.评分;
  if (score >= 8) return 'score-high';
  if (score >= 6) return 'score-mid';
  return 'score-low';
});

function formatNumber(num: number | undefined): string {
  if (num === undefined || num === null) return '0';
  if (num >= 100000000) return (num / 100000000).toFixed(1) + '亿';
  if (num >= 10000) return (num / 10000).toFixed(1) + '万';
  return num.toLocaleString();
}
</script>

<style scoped>
.wegame-page {
  background: #1a1a2e;
  min-height: 100%;
  color: #e0e0e0;
  font-family: 'Microsoft YaHei', Arial, sans-serif;
  padding-bottom: 40px;
}

/* 顶部导航 */
.wegame-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 24px;
  background: linear-gradient(90deg, #1a1a2e, #2d1a4e);
  border-bottom: 2px solid #ff6600;
}

.back-btn {
  padding: 6px 16px;
  background: rgba(255, 102, 0, 0.15);
  border: 1px solid rgba(255, 102, 0, 0.4);
  border-radius: 4px;
  color: #ff6600;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}

.back-btn:hover {
  background: rgba(255, 102, 0, 0.3);
  border-color: #ff6600;
}

.wegame-logo {
  font-size: 18px;
  font-weight: 700;
  color: #ff6600;
}

/* 游戏选择tabs */
.game-tabs {
  display: flex;
  gap: 4px;
  padding: 12px 24px;
  background: #16162b;
  border-bottom: 1px solid rgba(255, 102, 0, 0.2);
  overflow-x: auto;
}

.game-tab {
  padding: 8px 20px;
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  color: #888;
  cursor: pointer;
  font-size: 13px;
  white-space: nowrap;
  transition: all 0.2s;
}

.game-tab:hover {
  color: #ccc;
}

.game-tab.active {
  color: #ff6600;
  border-bottom-color: #ff6600;
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
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.4;
}

.empty-state p {
  color: #888;
  margin: 4px 0;
}

.empty-hint {
  font-size: 13px;
  color: #555 !important;
}

/* 游戏信息区域 */
.game-info-section {
  display: flex;
  gap: 24px;
  padding: 24px;
  margin: 20px 24px 0;
  background: rgba(255, 102, 0, 0.05);
  border-radius: 8px;
  border: 1px solid rgba(255, 102, 0, 0.15);
}

.game-cover {
  flex-shrink: 0;
  width: 260px;
  height: 150px;
}

.cover-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #2d1a4e, #1a1a2e);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255, 102, 0, 0.3);
}

.cover-text {
  font-size: 20px;
  font-weight: 700;
  color: #ff6600;
  text-align: center;
  padding: 12px;
}

.game-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.game-title {
  font-size: 22px;
  font-weight: 700;
  color: #fff;
  margin: 0;
}

/* 评分 */
.score-section {
  display: flex;
  align-items: center;
  gap: 16px;
}

.score-circle {
  display: flex;
  align-items: baseline;
  padding: 8px 16px;
  background: rgba(255, 102, 0, 0.15);
  border-radius: 8px;
  border: 1px solid rgba(255, 102, 0, 0.3);
}

.score-value {
  font-size: 32px;
  font-weight: 700;
  color: #ff6600;
}

.score-max {
  font-size: 14px;
  color: #888;
  margin-left: 2px;
}

.score-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.score-label {
  font-size: 16px;
  font-weight: 600;
}

.score-high { color: #ff6600; }
.score-mid { color: #e6a817; }
.score-low { color: #c35c2c; }

.score-count {
  font-size: 13px;
  color: #888;
}

/* 下载量 */
.download-section {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #aaa;
}

/* 评分条 */
.score-bar-section {
  max-width: 300px;
}

.score-bar-bg {
  width: 100%;
  height: 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  overflow: hidden;
}

.score-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #ff6600, #ff8833);
  border-radius: 3px;
  transition: width 0.5s ease;
}

/* 评价区域 */
.reviews-section {
  padding: 0 24px;
  margin-top: 24px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #fff;
  margin: 0 0 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(255, 102, 0, 0.2);
}

.no-reviews {
  text-align: center;
  padding: 40px;
  color: #888;
  font-size: 14px;
}

.review-card {
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  transition: background 0.2s;
}

.review-card:hover {
  background: rgba(255, 255, 255, 0.06);
}

.review-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.review-user {
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-avatar {
  font-size: 18px;
}

.user-name {
  font-size: 14px;
  color: #ff6600;
  font-weight: 500;
}

.review-score {
  display: flex;
  align-items: baseline;
  padding: 4px 10px;
  background: rgba(255, 102, 0, 0.1);
  border-radius: 4px;
}

.review-score-value {
  font-size: 18px;
  font-weight: 700;
  color: #ff6600;
}

.review-score-max {
  font-size: 12px;
  color: #888;
  margin-left: 2px;
}

.review-content {
  font-size: 14px;
  line-height: 1.6;
  color: #ccc;
  padding: 4px 0;
}

.review-footer {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.review-helpful {
  font-size: 12px;
  color: #888;
}
</style>
