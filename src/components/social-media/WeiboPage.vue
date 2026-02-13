<!--
  AI游戏开发商模拟器 - 微博页面
  模仿微博红橙色主题UI，展示热搜和微博内容
-->
<template>
  <div class="weibo-page">
    <!-- 顶部导航 -->
    <div class="weibo-header">
      <button class="back-btn" @click="goBack">← 返回</button>
      <div class="weibo-logo">
        <span class="weibo-icon">🔥</span>
        <span class="weibo-text">微博</span>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-if="!hasData" class="empty-state">
      <div class="empty-icon">📢</div>
      <p>暂无微博相关内容</p>
      <p class="empty-hint">游戏发布后，微博上的讨论将在这里显示</p>
    </div>

    <template v-else>
      <!-- 热搜信息 -->
      <div class="hot-search-section" v-if="hotSearchList.length > 0">
        <h3 class="section-title">🔥 热搜榜</h3>
        <div class="hot-search-list">
          <div
            v-for="(hs, index) in hotSearchList"
            :key="index"
            class="hot-search-item"
          >
            <span :class="['hs-rank', { 'top3': hs.排名 <= 3 }]">#{{ hs.排名 }}</span>
            <span class="hs-topic">{{ hs.话题 }}</span>
            <span class="hs-heat">{{ formatNumber(hs.热度) }}</span>
            <span :class="['hs-tag', 'tag-' + hs.标签]" v-if="hs.标签">{{ hs.标签 }}</span>
          </div>
        </div>
      </div>

      <!-- 节奏事件 -->
      <div class="controversy-section" v-if="controversyEvents.length > 0">
        <h3 class="section-title">⚠️ 舆情事件</h3>
        <div
          v-for="(event, index) in controversyEvents"
          :key="index"
          :class="['controversy-card', 'severity-' + event.严重程度]"
        >
          <div class="controversy-header">
            <span class="controversy-topic">{{ event.话题 }}</span>
            <span :class="['severity-badge', 'severity-' + event.严重程度]">{{ event.严重程度 }}</span>
          </div>
          <p class="controversy-desc">{{ event.描述 }}</p>
          <p class="controversy-impact">影响：{{ event.影响 }}</p>
        </div>
      </div>

      <!-- 微博列表 -->
      <div class="weibo-list-section">
        <h3 class="section-title">📝 相关微博</h3>

        <div v-if="weiboList.length === 0" class="no-content">
          暂无相关微博
        </div>

        <div
          v-for="(post, index) in weiboList"
          :key="index"
          class="weibo-card"
        >
          <!-- 用户信息 -->
          <div class="weibo-user">
            <span class="user-avatar">👤</span>
            <div class="user-info">
              <div class="user-name-row">
                <span class="user-name">{{ post.用户名 }}</span>
                <span :class="['verify-badge', getVerifyClass(post.认证)]" v-if="post.认证">
                  {{ getVerifyIcon(post.认证) }}
                </span>
                <span class="verify-text" v-if="post.认证">{{ post.认证 }}</span>
              </div>
              <span class="post-time">{{ post.发布时间 }}</span>
            </div>
          </div>

          <!-- 微博内容 -->
          <div class="weibo-content">
            {{ post.内容 }}
          </div>

          <!-- 互动数据 -->
          <div class="weibo-actions">
            <span class="action-item">
              <span class="action-icon">🔄</span>
              <span class="action-count">{{ formatNumber(post.转发) }}</span>
            </span>
            <span class="action-item">
              <span class="action-icon">💬</span>
              <span class="action-count">{{ formatNumber(post.评论) }}</span>
            </span>
            <span class="action-item">
              <span class="action-icon">❤️</span>
              <span class="action-count">{{ formatNumber(post.点赞) }}</span>
            </span>
          </div>

          <!-- 热门评论 -->
          <div class="weibo-comments" v-if="post.热门评论?.length">
            <div class="comments-toggle" @click="toggleComments(index)">
              <span>热门评论 ({{ post.热门评论.length }})</span>
              <span class="toggle-arrow">{{ expandedPosts.has(index) ? '▼' : '▶' }}</span>
            </div>
            <div class="comments-list" v-if="expandedPosts.has(index)">
              <div
                v-for="(comment, ci) in post.热门评论"
                :key="ci"
                class="comment-item"
              >
                <span class="comment-user">{{ comment.用户名 }}：</span>
                <span class="comment-text">{{ comment.内容 }}</span>
                <span class="comment-likes" v-if="comment.点赞 > 0">
                  ❤️ {{ formatNumber(comment.点赞) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useGameStateStore } from '@/stores/gameStateStore';

const store = useGameStateStore();
const router = useRouter();

function goBack() {
  router.push('/game/social-media');
}

// 是否有数据
const hasData = computed(() => {
  const weibo = store.platformData?.weibo;
  if (!weibo) return false;
  return (weibo.热搜?.length > 0) || (weibo.相关微博?.length > 0) || (weibo.节奏事件?.length > 0);
});

// 热搜列表
const hotSearchList = computed(() => {
  return store.platformData?.weibo?.热搜 ?? [];
});

// 节奏事件
const controversyEvents = computed(() => {
  return store.platformData?.weibo?.节奏事件 ?? [];
});

// 微博列表
const weiboList = computed(() => {
  return store.platformData?.weibo?.相关微博 ?? [];
});

// 展开的评论
const expandedPosts = reactive(new Set<number>());

function toggleComments(index: number) {
  if (expandedPosts.has(index)) {
    expandedPosts.delete(index);
  } else {
    expandedPosts.add(index);
  }
}

// 认证样式
function getVerifyClass(cert: string): string {
  if (cert.includes('官方') || cert.includes('蓝V')) return 'verify-blue';
  if (cert.includes('企业') || cert.includes('红V')) return 'verify-red';
  return 'verify-yellow';
}

function getVerifyIcon(cert: string): string {
  if (cert.includes('官方') || cert.includes('蓝V')) return 'V';
  if (cert.includes('企业') || cert.includes('红V')) return 'V';
  return 'V';
}

function formatNumber(num: number | undefined): string {
  if (num === undefined || num === null) return '0';
  if (num >= 100000000) return (num / 100000000).toFixed(1) + '亿';
  if (num >= 10000) return (num / 10000).toFixed(1) + '万';
  return num.toLocaleString();
}
</script>

<style scoped>
.weibo-page {
  background: #1a1a24;
  min-height: 100%;
  color: #e0e0e0;
  font-family: 'Microsoft YaHei', Arial, sans-serif;
  padding-bottom: 40px;
}

/* 顶部导航 */
.weibo-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 14px 24px;
  background: linear-gradient(90deg, #1a1a24, #2e1a1a);
  border-bottom: 2px solid #ff8200;
}

.back-btn {
  padding: 6px 16px;
  background: rgba(255, 130, 0, 0.12);
  border: 1px solid rgba(255, 130, 0, 0.35);
  border-radius: 20px;
  color: #ff8200;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}

.back-btn:hover {
  background: rgba(255, 130, 0, 0.25);
  border-color: #ff8200;
}

.weibo-logo {
  display: flex;
  align-items: center;
  gap: 8px;
}

.weibo-icon {
  font-size: 20px;
}

.weibo-text {
  font-size: 18px;
  font-weight: 700;
  color: #ff8200;
}

/* 通用 */
.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #fff;
  margin: 0 0 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(255, 130, 0, 0.2);
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

/* 热搜区域 */
.hot-search-section {
  padding: 16px 24px;
  margin: 16px 24px 0;
  background: rgba(255, 130, 0, 0.04);
  border-radius: 8px;
  border: 1px solid rgba(255, 130, 0, 0.1);
}

.hot-search-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.hot-search-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  border-radius: 4px;
  transition: background 0.2s;
}

.hot-search-item:hover {
  background: rgba(255, 130, 0, 0.08);
}

.hs-rank {
  font-size: 14px;
  font-weight: 700;
  color: #888;
  min-width: 30px;
}

.hs-rank.top3 {
  color: #ff8200;
}

.hs-topic {
  flex: 1;
  font-size: 14px;
  color: #e0e0e0;
}

.hs-heat {
  font-size: 12px;
  color: #888;
}

.hs-tag {
  padding: 1px 6px;
  border-radius: 3px;
  font-size: 11px;
  font-weight: 600;
}

.tag-热 { background: #ff8200; color: #fff; }
.tag-新 { background: #ff4d4f; color: #fff; }
.tag-沸 { background: #ff1744; color: #fff; }
.tag-爆 { background: #d50000; color: #fff; }

/* 节奏事件 */
.controversy-section {
  padding: 16px 24px;
  margin: 16px 24px 0;
}

.controversy-card {
  padding: 14px 16px;
  margin-bottom: 10px;
  border-radius: 8px;
  border-left: 3px solid;
  background: rgba(255, 255, 255, 0.03);
}

.controversy-card.severity-轻微 { border-left-color: #52c41a; }
.controversy-card.severity-中等 { border-left-color: #faad14; }
.controversy-card.severity-严重 { border-left-color: #ff4d4f; }
.controversy-card.severity-危机 { border-left-color: #d50000; }

.controversy-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.controversy-topic {
  font-size: 15px;
  font-weight: 600;
  color: #fff;
}

.severity-badge {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
}

.severity-badge.severity-轻微 { background: rgba(82, 196, 26, 0.2); color: #52c41a; }
.severity-badge.severity-中等 { background: rgba(250, 173, 20, 0.2); color: #faad14; }
.severity-badge.severity-严重 { background: rgba(255, 77, 79, 0.2); color: #ff4d4f; }
.severity-badge.severity-危机 { background: rgba(213, 0, 0, 0.2); color: #ff1744; }

.controversy-desc {
  font-size: 13px;
  color: #ccc;
  margin: 4px 0;
  line-height: 1.5;
}

.controversy-impact {
  font-size: 12px;
  color: #999;
  margin: 4px 0 0;
}

/* 微博列表 */
.weibo-list-section {
  padding: 16px 24px;
  margin-top: 8px;
}

.no-content {
  text-align: center;
  padding: 40px;
  color: #888;
  font-size: 14px;
}

.weibo-card {
  padding: 16px;
  margin-bottom: 1px;
  background: rgba(255, 255, 255, 0.03);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  transition: background 0.2s;
}

.weibo-card:hover {
  background: rgba(255, 255, 255, 0.05);
}

.weibo-card:first-child {
  border-radius: 8px 8px 0 0;
}

.weibo-card:last-child {
  border-radius: 0 0 8px 8px;
  border-bottom: none;
}

/* 用户信息 */
.weibo-user {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.user-avatar {
  font-size: 28px;
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.user-name-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.user-name {
  font-size: 15px;
  font-weight: 600;
  color: #e0e0e0;
}

.verify-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  font-size: 10px;
  font-weight: 700;
  color: #fff;
}

.verify-blue { background: #1890ff; }
.verify-yellow { background: #faad14; }
.verify-red { background: #ff4d4f; }

.verify-text {
  font-size: 12px;
  color: #888;
}

.post-time {
  font-size: 12px;
  color: #666;
}

/* 微博内容 */
.weibo-content {
  font-size: 14px;
  line-height: 1.7;
  color: #ddd;
  margin-bottom: 12px;
  padding-left: 38px;
}

/* 互动数据 */
.weibo-actions {
  display: flex;
  gap: 32px;
  padding-left: 38px;
}

.action-item {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
}

.action-icon {
  font-size: 14px;
}

.action-count {
  font-size: 13px;
  color: #888;
}

/* 评论区 */
.weibo-comments {
  margin-top: 12px;
  padding-left: 38px;
}

.comments-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: rgba(255, 130, 0, 0.06);
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  color: #aaa;
  transition: background 0.2s;
}

.comments-toggle:hover {
  background: rgba(255, 130, 0, 0.12);
}

.toggle-arrow {
  font-size: 10px;
  color: #ff8200;
}

.comments-list {
  padding: 8px 0 0 12px;
  border-left: 2px solid rgba(255, 130, 0, 0.2);
  margin-left: 12px;
}

.comment-item {
  padding: 6px 0;
  font-size: 13px;
  line-height: 1.5;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
}

.comment-item:last-child {
  border-bottom: none;
}

.comment-user {
  color: #ff8200;
  font-weight: 500;
}

.comment-text {
  color: #ccc;
}

.comment-likes {
  margin-left: 8px;
  font-size: 11px;
  color: #888;
}
</style>
