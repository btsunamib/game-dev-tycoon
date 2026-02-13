<!--
  AI游戏开发商模拟器 - Steam 商店页面
  模仿Steam深蓝色主题UI，展示游戏评测
-->
<template>
  <div class="steam-page">
    <!-- 顶部导航 -->
    <div class="steam-header">
      <button class="back-btn" @click="goBack">← 返回</button>
      <div class="steam-logo">🎮 STEAM 商店页面</div>
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
      <div class="empty-icon">🎮</div>
      <p>暂无Steam平台数据</p>
      <p class="empty-hint">游戏发布到Steam后，玩家评测将在这里显示</p>
    </div>

    <!-- 游戏信息区域 -->
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

          <!-- 标签 -->
          <div class="tag-list" v-if="currentGameData.标签?.length">
            <span class="tag" v-for="tag in currentGameData.标签" :key="tag">{{ tag }}</span>
          </div>

          <!-- 价格 -->
          <div class="price-section">
            <span class="discount-badge" v-if="currentGameData.折扣 > 0">
              -{{ currentGameData.折扣 }}%
            </span>
            <span class="price-original" v-if="currentGameData.折扣 > 0">
              ¥{{ currentGameData.价格 }}
            </span>
            <span class="price-final">
              ¥{{ discountedPrice }}
            </span>
          </div>

          <!-- 好评率 -->
          <div class="rating-section">
            <div class="rating-label">
              <span class="rating-icon">{{ ratingIcon }}</span>
              <span :class="['rating-text', ratingClass]">{{ ratingLabel }}</span>
            </div>
            <div class="rating-bar">
              <div class="rating-fill" :style="{ width: currentGameData.好评率 + '%' }"></div>
            </div>
            <div class="rating-detail">
              {{ currentGameData.好评率 }}% 好评 · {{ formatNumber(currentGameData.评测数量) }} 篇评测
            </div>
          </div>

          <!-- 在线人数 -->
          <div class="online-section">
            <div class="online-item">
              <span class="online-label">当前在线</span>
              <span class="online-value">{{ formatNumber(currentGameData.同时在线) }}</span>
            </div>
            <div class="online-item">
              <span class="online-label">历史峰值</span>
              <span class="online-value">{{ formatNumber(currentGameData.历史最高在线) }}</span>
            </div>
            <div class="online-item" v-if="currentGameData.愿望单数">
              <span class="online-label">愿望单</span>
              <span class="online-value">{{ formatNumber(currentGameData.愿望单数) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 评测区域 -->
      <div class="reviews-section">
        <h3 class="section-title">📊 最近评测</h3>

        <div v-if="!currentGameData.最近评测?.length" class="no-reviews">
          暂无评测
        </div>

        <div
          v-for="(review, index) in currentGameData.最近评测"
          :key="index"
          :class="['review-card', review.推荐 ? 'positive' : 'negative']"
        >
          <div class="review-header">
            <div class="review-recommendation">
              <span class="rec-icon">{{ review.推荐 ? '👍' : '👎' }}</span>
              <span :class="['rec-text', review.推荐 ? 'rec-positive' : 'rec-negative']">
                {{ review.推荐 ? '推荐' : '不推荐' }}
              </span>
            </div>
            <div class="review-user">
              <span class="user-avatar">👤</span>
              <span class="user-name">{{ review.用户名 }}</span>
            </div>
          </div>

          <div class="review-playtime">
            游戏时长：{{ review.游戏时长 }}
          </div>

          <div class="review-content">
            "{{ review.内容 }}"
          </div>

          <div class="review-footer">
            <span class="review-helpful" v-if="review.点赞数 > 0">
              {{ review.点赞数 }} 人觉得这篇评测有用
            </span>
            <span class="review-time" v-if="review.发布时间">
              {{ review.发布时间 }}
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

// 返回Hub
function goBack() {
  router.push('/game/social-media');
}

// 游戏列表
const gameNames = computed(() => {
  if (!store.platformData?.steam?.游戏页面) return [];
  return Object.keys(store.platformData.steam.游戏页面);
});

// 当前选中的游戏
const selectedGame = ref('');

watch(gameNames, (names) => {
  if (names.length > 0 && !selectedGame.value) {
    selectedGame.value = names[0];
  }
}, { immediate: true });

// 当前游戏数据
const currentGameData = computed(() => {
  if (!store.platformData?.steam?.游戏页面 || !selectedGame.value) return null;
  return store.platformData.steam.游戏页面[selectedGame.value] ?? null;
});

// 折扣后价格
const discountedPrice = computed(() => {
  if (!currentGameData.value) return 0;
  const price = currentGameData.value.价格;
  const discount = currentGameData.value.折扣;
  return (price * (1 - discount / 100)).toFixed(0);
});

// 好评率标签
const ratingLabel = computed(() => {
  if (!currentGameData.value) return '';
  const rate = currentGameData.value.好评率;
  if (rate >= 95) return '好评如潮';
  if (rate >= 80) return '特别好评';
  if (rate >= 70) return '多半好评';
  if (rate >= 40) return '褒贬不一';
  if (rate >= 20) return '多半差评';
  return '差评如潮';
});

const ratingIcon = computed(() => {
  if (!currentGameData.value) return '';
  return currentGameData.value.好评率 >= 70 ? '😊' : currentGameData.value.好评率 >= 40 ? '😐' : '😞';
});

const ratingClass = computed(() => {
  if (!currentGameData.value) return '';
  const rate = currentGameData.value.好评率;
  if (rate >= 70) return 'rating-positive';
  if (rate >= 40) return 'rating-mixed';
  return 'rating-negative';
});

// 数字格式化
function formatNumber(num: number | undefined): string {
  if (num === undefined || num === null) return '0';
  if (num >= 100000000) return (num / 100000000).toFixed(1) + '亿';
  if (num >= 10000) return (num / 10000).toFixed(1) + '万';
  return num.toLocaleString();
}
</script>

<style scoped>
.steam-page {
  background: #1b2838;
  min-height: 100%;
  color: #c7d5e0;
  font-family: Arial, Helvetica, sans-serif;
  padding-bottom: 40px;
}

/* 顶部导航 */
.steam-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 24px;
  background: #171a21;
  border-bottom: 1px solid #0e1419;
}

.back-btn {
  padding: 6px 16px;
  background: rgba(103, 193, 245, 0.1);
  border: 1px solid rgba(103, 193, 245, 0.3);
  border-radius: 4px;
  color: #67c1f5;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}

.back-btn:hover {
  background: rgba(103, 193, 245, 0.2);
  border-color: #67c1f5;
}

.steam-logo {
  font-size: 18px;
  font-weight: 700;
  color: #fff;
}

/* 游戏选择tabs */
.game-tabs {
  display: flex;
  gap: 4px;
  padding: 12px 24px;
  background: #1e2c3a;
  border-bottom: 1px solid #0e1419;
  overflow-x: auto;
}

.game-tab {
  padding: 8px 20px;
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  color: #8f98a0;
  cursor: pointer;
  font-size: 13px;
  white-space: nowrap;
  transition: all 0.2s;
}

.game-tab:hover {
  color: #c7d5e0;
}

.game-tab.active {
  color: #fff;
  border-bottom-color: #66c0f4;
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
  color: #8f98a0;
  margin: 4px 0;
}

.empty-hint {
  font-size: 13px;
  color: #556772 !important;
}

/* 游戏信息区域 */
.game-info-section {
  display: flex;
  gap: 24px;
  padding: 24px;
  margin: 0 24px;
  margin-top: 20px;
  background: #16202d;
  border-radius: 4px;
}

.game-cover {
  flex-shrink: 0;
  width: 280px;
  height: 160px;
}

.cover-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #2a475e, #1b2838);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #2a475e;
}

.cover-text {
  font-size: 20px;
  font-weight: 700;
  color: #66c0f4;
  text-align: center;
  padding: 12px;
}

.game-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.game-title {
  font-size: 22px;
  font-weight: 700;
  color: #fff;
  margin: 0;
}

/* 标签 */
.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tag {
  padding: 3px 8px;
  background: rgba(103, 193, 245, 0.15);
  border-radius: 3px;
  font-size: 11px;
  color: #67c1f5;
}

/* 价格 */
.price-section {
  display: flex;
  align-items: center;
  gap: 8px;
}

.discount-badge {
  padding: 4px 8px;
  background: #4c6b22;
  color: #a4d007;
  font-size: 16px;
  font-weight: 700;
  border-radius: 2px;
}

.price-original {
  text-decoration: line-through;
  color: #8f98a0;
  font-size: 13px;
}

.price-final {
  font-size: 18px;
  font-weight: 700;
  color: #acdbf5;
}

/* 好评率 */
.rating-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.rating-label {
  display: flex;
  align-items: center;
  gap: 6px;
}

.rating-icon {
  font-size: 18px;
}

.rating-text {
  font-size: 14px;
  font-weight: 600;
}

.rating-positive { color: #66c0f4; }
.rating-mixed { color: #b9a074; }
.rating-negative { color: #c35c2c; }

.rating-bar {
  width: 200px;
  height: 8px;
  background: #c35c2c;
  border-radius: 4px;
  overflow: hidden;
}

.rating-fill {
  height: 100%;
  background: #66c0f4;
  border-radius: 4px;
  transition: width 0.5s ease;
}

.rating-detail {
  font-size: 12px;
  color: #8f98a0;
}

/* 在线人数 */
.online-section {
  display: flex;
  gap: 24px;
}

.online-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.online-label {
  font-size: 11px;
  color: #8f98a0;
}

.online-value {
  font-size: 16px;
  font-weight: 600;
  color: #66c0f4;
}

/* 评测区域 */
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
  border-bottom: 1px solid #2a475e;
}

.no-reviews {
  text-align: center;
  padding: 40px;
  color: #8f98a0;
  font-size: 14px;
}

.review-card {
  background: #1a2634;
  border-radius: 4px;
  padding: 16px;
  margin-bottom: 12px;
  border-left: 3px solid transparent;
  transition: background 0.2s;
}

.review-card:hover {
  background: #1e2e3e;
}

.review-card.positive {
  border-left-color: #66c0f4;
}

.review-card.negative {
  border-left-color: #c35c2c;
}

.review-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.review-recommendation {
  display: flex;
  align-items: center;
  gap: 6px;
}

.rec-icon {
  font-size: 20px;
}

.rec-text {
  font-size: 14px;
  font-weight: 600;
}

.rec-positive { color: #66c0f4; }
.rec-negative { color: #c35c2c; }

.review-user {
  display: flex;
  align-items: center;
  gap: 6px;
}

.user-avatar {
  font-size: 16px;
}

.user-name {
  font-size: 13px;
  color: #67c1f5;
}

.review-playtime {
  font-size: 12px;
  color: #8f98a0;
  margin-bottom: 10px;
}

.review-content {
  font-size: 14px;
  line-height: 1.6;
  color: #acb2b8;
  padding: 8px 0;
  font-style: italic;
}

.review-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.review-helpful {
  font-size: 12px;
  color: #8f98a0;
}

.review-time {
  font-size: 12px;
  color: #556772;
}
</style>
