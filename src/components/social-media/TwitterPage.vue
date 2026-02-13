<!--
  AI游戏开发商模拟器 - Twitter/X 页面
  模仿Twitter深色模式UI，展示推文和话题热度
-->
<template>
  <div class="twitter-page">
    <!-- 顶部导航 -->
    <div class="twitter-header">
      <button class="back-btn" @click="goBack">← 返回</button>
      <div class="twitter-logo">
        <span class="x-icon">𝕏</span>
        <span class="twitter-text">Twitter</span>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-if="!hasData" class="empty-state">
      <div class="empty-icon">𝕏</div>
      <p>No tweets yet</p>
      <p class="empty-hint">Tweets about your game will appear here after release</p>
    </div>

    <template v-else>
      <!-- 话题热度 -->
      <div class="trending-section">
        <div class="trending-header">
          <span class="trending-label">Trending</span>
        </div>
        <div class="trending-info">
          <span class="trending-topic" v-if="twitterData.话题热度 > 0">
            🔥 {{ formatNumberK(twitterData.话题热度) }} tweets
          </span>
          <span class="trending-overseas" v-if="twitterData.海外关注度 > 0">
            🌍 Overseas Interest: {{ twitterData.海外关注度 }}%
          </span>
        </div>
      </div>

      <!-- 推文列表 -->
      <div class="tweet-list">
        <div v-if="!twitterData.推文?.length" class="no-tweets">
          No tweets to display
        </div>

        <div
          v-for="(tweet, index) in twitterData.推文"
          :key="index"
          class="tweet-card"
        >
          <!-- 用户信息 -->
          <div class="tweet-avatar">
            <span class="avatar-circle" :style="{ background: getAvatarColor(tweet.用户名) }">
              {{ (tweet.显示名 || tweet.用户名).charAt(0).toUpperCase() }}
            </span>
          </div>

          <div class="tweet-body">
            <div class="tweet-user-row">
              <span class="tweet-display-name">{{ tweet.显示名 || tweet.用户名 }}</span>
              <span class="tweet-username">@{{ tweet.用户名 }}</span>
              <span class="tweet-dot">·</span>
              <span class="tweet-time">{{ tweet.发布时间 }}</span>
              <span class="tweet-lang" v-if="tweet.语言 && tweet.语言 !== 'en'">
                {{ getLangLabel(tweet.语言) }}
              </span>
            </div>

            <div class="tweet-content">
              {{ tweet.内容 }}
            </div>

            <!-- 互动数据 -->
            <div class="tweet-actions">
              <span class="action-item reply">
                <span class="action-icon">💬</span>
                <span class="action-count">{{ formatNumberK(tweet.评论) }}</span>
              </span>
              <span class="action-item retweet">
                <span class="action-icon">🔄</span>
                <span class="action-count">{{ formatNumberK(tweet.转推) }}</span>
              </span>
              <span class="action-item like">
                <span class="action-icon">❤️</span>
                <span class="action-count">{{ formatNumberK(tweet.点赞) }}</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useGameStateStore } from '@/stores/gameStateStore';

const store = useGameStateStore();
const router = useRouter();

function goBack() {
  router.push('/game/social-media');
}

// Twitter数据
const twitterData = computed(() => {
  return store.platformData?.twitter ?? { 推文: [], 话题热度: 0, 海外关注度: 0 };
});

// 是否有数据
const hasData = computed(() => {
  const data = store.platformData?.twitter;
  if (!data) return false;
  return (data.推文?.length > 0) || data.话题热度 > 0;
});

// 头像颜色
function getAvatarColor(name: string): string {
  const colors = ['#1da1f2', '#17bf63', '#ffad1f', '#e0245e', '#794bc4', '#f45d22'];
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
}

// 语言标签
function getLangLabel(lang: string): string {
  const labels: Record<string, string> = {
    'en': 'EN',
    'ja': '日本語',
    'zh': '中文',
    'ko': '한국어',
  };
  return labels[lang] || lang.toUpperCase();
}

// K/M格式化
function formatNumberK(num: number | undefined): string {
  if (num === undefined || num === null || num === 0) return '0';
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}
</script>

<style scoped>
.twitter-page {
  background: #15202b;
  min-height: 100%;
  color: #d9d9d9;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  padding-bottom: 40px;
}

/* 顶部导航 */
.twitter-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 20px;
  background: rgba(21, 32, 43, 0.95);
  border-bottom: 1px solid #38444d;
  backdrop-filter: blur(12px);
  position: sticky;
  top: 0;
  z-index: 10;
}

.back-btn {
  padding: 6px 14px;
  background: transparent;
  border: 1px solid #536471;
  border-radius: 20px;
  color: #1da1f2;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}

.back-btn:hover {
  background: rgba(29, 161, 242, 0.1);
  border-color: #1da1f2;
}

.twitter-logo {
  display: flex;
  align-items: center;
  gap: 8px;
}

.x-icon {
  font-size: 22px;
  font-weight: 700;
  color: #d9d9d9;
}

.twitter-text {
  font-size: 18px;
  font-weight: 700;
  color: #d9d9d9;
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
  opacity: 0.3;
  color: #d9d9d9;
}

.empty-state p {
  color: #8899a6;
  margin: 4px 0;
  font-size: 15px;
}

.empty-hint {
  font-size: 13px !important;
  color: #536471 !important;
}

/* 话题热度 */
.trending-section {
  padding: 16px 20px;
  border-bottom: 1px solid #38444d;
}

.trending-header {
  margin-bottom: 8px;
}

.trending-label {
  font-size: 18px;
  font-weight: 800;
  color: #d9d9d9;
}

.trending-info {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.trending-topic {
  font-size: 14px;
  color: #1da1f2;
  font-weight: 500;
}

.trending-overseas {
  font-size: 14px;
  color: #8899a6;
}

/* 推文列表 */
.tweet-list {
  padding: 0;
}

.no-tweets {
  text-align: center;
  padding: 40px;
  color: #8899a6;
  font-size: 15px;
}

.tweet-card {
  display: flex;
  gap: 12px;
  padding: 12px 20px;
  border-bottom: 1px solid #38444d;
  transition: background 0.15s;
  cursor: pointer;
}

.tweet-card:hover {
  background: rgba(255, 255, 255, 0.03);
}

/* 头像 */
.tweet-avatar {
  flex-shrink: 0;
}

.avatar-circle {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 700;
  color: #fff;
}

/* 推文主体 */
.tweet-body {
  flex: 1;
  min-width: 0;
}

.tweet-user-row {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 4px;
  flex-wrap: wrap;
}

.tweet-display-name {
  font-size: 15px;
  font-weight: 700;
  color: #d9d9d9;
}

.tweet-username {
  font-size: 15px;
  color: #8899a6;
}

.tweet-dot {
  color: #8899a6;
  font-size: 15px;
}

.tweet-time {
  font-size: 15px;
  color: #8899a6;
}

.tweet-lang {
  padding: 1px 6px;
  background: rgba(29, 161, 242, 0.15);
  border-radius: 4px;
  font-size: 11px;
  color: #1da1f2;
  margin-left: 4px;
}

/* 推文内容 */
.tweet-content {
  font-size: 15px;
  line-height: 1.5;
  color: #d9d9d9;
  margin-bottom: 12px;
  word-break: break-word;
}

/* 互动数据 */
.tweet-actions {
  display: flex;
  gap: 48px;
  max-width: 400px;
}

.action-item {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  transition: color 0.2s;
}

.action-icon {
  font-size: 14px;
}

.action-count {
  font-size: 13px;
  color: #8899a6;
}

.action-item.reply:hover .action-count { color: #1da1f2; }
.action-item.retweet:hover .action-count { color: #17bf63; }
.action-item.like:hover .action-count { color: #e0245e; }
</style>
