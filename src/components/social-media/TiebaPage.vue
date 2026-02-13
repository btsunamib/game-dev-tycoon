<!--
  AI游戏开发商模拟器 - 百度贴吧页面
  模仿贴吧蓝色主题UI，展示帖子列表和楼层回复
-->
<template>
  <div class="tieba-page">
    <!-- 顶部导航 -->
    <div class="tieba-header">
      <button class="back-btn" @click="goBack">← 返回</button>
      <div class="tieba-logo">
        <span class="tieba-icon">📋</span>
        <span class="tieba-text">百度贴吧</span>
        <span class="tieba-name" v-if="selectedBar">{{ selectedBar }} 吧</span>
      </div>
    </div>

    <!-- 贴吧选择tabs -->
    <div class="bar-tabs" v-if="barNames.length > 0">
      <button
        v-for="name in barNames"
        :key="name"
        :class="['bar-tab', { active: selectedBar === name }]"
        @click="selectedBar = name"
      >
        {{ name }}吧
      </button>
    </div>

    <!-- 空状态 -->
    <div v-if="!currentBarData" class="empty-state">
      <div class="empty-icon">📋</div>
      <p>暂无贴吧数据</p>
      <p class="empty-hint">游戏发布后，贴吧讨论将在这里显示</p>
    </div>

    <template v-else>
      <!-- 贴吧信息 -->
      <div class="bar-info">
        <div class="bar-stat">
          <span class="stat-value">{{ formatNumber(currentBarData.吧友数量) }}</span>
          <span class="stat-label">关注</span>
        </div>
        <div class="bar-stat">
          <span class="stat-value">{{ formatNumber(currentBarData.日活跃) }}</span>
          <span class="stat-label">日活跃</span>
        </div>
        <div class="bar-stat">
          <span class="stat-value">{{ currentBarData.帖子列表.length }}</span>
          <span class="stat-label">帖子</span>
        </div>
      </div>

      <!-- 吧规 -->
      <div class="bar-rules" v-if="currentBarData.吧规">
        <span class="rules-icon">📌</span>
        <span class="rules-text">{{ currentBarData.吧规 }}</span>
      </div>

      <!-- 帖子列表 -->
      <div class="post-list">
        <div
          v-for="(post, index) in sortedPosts"
          :key="index"
          :class="['post-item', { 'post-pinned': post.是否置顶 }]"
          @click="togglePost(index)"
        >
          <!-- 帖子标题行 -->
          <div class="post-title-row">
            <span class="pin-badge" v-if="post.是否置顶">置顶</span>
            <span class="post-title">{{ post.标题 }}</span>
          </div>

          <!-- 帖子元信息 -->
          <div class="post-meta">
            <span class="post-author">{{ post.楼主 }}</span>
            <span class="post-replies">回复({{ post.回复数 }})</span>
            <span class="post-views" v-if="post.浏览数">浏览({{ formatNumber(post.浏览数) }})</span>
          </div>

          <!-- 展开的帖子详情 -->
          <div class="post-detail" v-if="expandedPost === index">
            <!-- 1楼（楼主） -->
            <div class="floor-item floor-op">
              <div class="floor-header">
                <span class="floor-num">1楼</span>
                <span class="floor-author op-badge">楼主 · {{ post.楼主 }}</span>
              </div>
              <div class="floor-content">{{ post.内容 }}</div>
            </div>

            <!-- 回复楼层 -->
            <div
              v-for="(reply, ri) in post.回复列表"
              :key="ri"
              class="floor-item"
            >
              <div class="floor-header">
                <span class="floor-num">{{ reply.楼层 }}楼</span>
                <span class="floor-author">{{ reply.用户名 }}</span>
                <span class="floor-likes" v-if="reply.点赞 > 0">👍 {{ reply.点赞 }}</span>
              </div>
              <div class="floor-content">{{ reply.内容 }}</div>
            </div>
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

// 贴吧列表
const barNames = computed(() => {
  if (!store.platformData?.tieba?.贴吧) return [];
  return Object.keys(store.platformData.tieba.贴吧);
});

const selectedBar = ref('');

watch(barNames, (names) => {
  if (names.length > 0 && !selectedBar.value) {
    selectedBar.value = names[0];
  }
}, { immediate: true });

// 当前贴吧数据
const currentBarData = computed(() => {
  if (!store.platformData?.tieba?.贴吧 || !selectedBar.value) return null;
  return store.platformData.tieba.贴吧[selectedBar.value] ?? null;
});

// 排序帖子（置顶在前）
const sortedPosts = computed(() => {
  if (!currentBarData.value?.帖子列表) return [];
  return [...currentBarData.value.帖子列表].sort((a, b) => {
    if (a.是否置顶 && !b.是否置顶) return -1;
    if (!a.是否置顶 && b.是否置顶) return 1;
    return 0;
  });
});

// 展开的帖子
const expandedPost = ref<number | null>(null);

function togglePost(index: number) {
  expandedPost.value = expandedPost.value === index ? null : index;
}

function formatNumber(num: number | undefined): string {
  if (num === undefined || num === null) return '0';
  if (num >= 100000000) return (num / 100000000).toFixed(1) + '亿';
  if (num >= 10000) return (num / 10000).toFixed(1) + '万';
  return num.toLocaleString();
}
</script>

<style scoped>
.tieba-page {
  background: #1a1e2e;
  min-height: 100%;
  color: #e0e0e0;
  font-family: 'Microsoft YaHei', Arial, sans-serif;
  padding-bottom: 40px;
}

/* 顶部导航 */
.tieba-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 14px 24px;
  background: linear-gradient(90deg, #1a1e2e, #1a2a4e);
  border-bottom: 2px solid #4879bd;
}

.back-btn {
  padding: 6px 16px;
  background: rgba(72, 121, 189, 0.12);
  border: 1px solid rgba(72, 121, 189, 0.35);
  border-radius: 4px;
  color: #4879bd;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}

.back-btn:hover {
  background: rgba(72, 121, 189, 0.25);
  border-color: #4879bd;
}

.tieba-logo {
  display: flex;
  align-items: center;
  gap: 8px;
}

.tieba-icon {
  font-size: 20px;
}

.tieba-text {
  font-size: 18px;
  font-weight: 700;
  color: #4879bd;
}

.tieba-name {
  font-size: 16px;
  color: #fff;
  font-weight: 600;
  margin-left: 4px;
}

/* 贴吧选择tabs */
.bar-tabs {
  display: flex;
  gap: 8px;
  padding: 12px 24px;
  background: #161a2a;
  border-bottom: 1px solid rgba(72, 121, 189, 0.15);
  overflow-x: auto;
}

.bar-tab {
  padding: 6px 16px;
  background: rgba(72, 121, 189, 0.08);
  border: 1px solid rgba(72, 121, 189, 0.2);
  border-radius: 4px;
  color: #aaa;
  cursor: pointer;
  font-size: 13px;
  white-space: nowrap;
  transition: all 0.2s;
}

.bar-tab:hover {
  color: #4879bd;
  border-color: rgba(72, 121, 189, 0.4);
}

.bar-tab.active {
  color: #fff;
  background: #4879bd;
  border-color: #4879bd;
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

/* 贴吧信息 */
.bar-info {
  display: flex;
  gap: 32px;
  padding: 16px 24px;
  margin: 16px 24px 0;
  background: rgba(72, 121, 189, 0.06);
  border-radius: 8px;
  border: 1px solid rgba(72, 121, 189, 0.12);
}

.bar-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.stat-value {
  font-size: 20px;
  font-weight: 700;
  color: #4879bd;
}

.stat-label {
  font-size: 12px;
  color: #888;
}

/* 吧规 */
.bar-rules {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 10px 16px;
  margin: 12px 24px 0;
  background: rgba(72, 121, 189, 0.04);
  border-radius: 4px;
  border: 1px solid rgba(72, 121, 189, 0.08);
}

.rules-icon {
  font-size: 14px;
  flex-shrink: 0;
}

.rules-text {
  font-size: 12px;
  color: #999;
  line-height: 1.5;
}

/* 帖子列表 */
.post-list {
  padding: 16px 24px;
}

.post-item {
  padding: 12px 16px;
  margin-bottom: 2px;
  background: rgba(255, 255, 255, 0.03);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  cursor: pointer;
  transition: background 0.2s;
}

.post-item:hover {
  background: rgba(255, 255, 255, 0.06);
}

.post-pinned {
  background: rgba(72, 121, 189, 0.06);
  border-left: 3px solid #4879bd;
}

.post-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.pin-badge {
  padding: 1px 6px;
  background: #4879bd;
  border-radius: 3px;
  font-size: 11px;
  color: #fff;
  font-weight: 600;
  flex-shrink: 0;
}

.post-title {
  font-size: 15px;
  color: #e0e0e0;
  font-weight: 500;
}

.post-item:hover .post-title {
  color: #4879bd;
}

.post-meta {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #888;
}

.post-author {
  color: #4879bd;
}

/* 帖子详情 */
.post-detail {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(72, 121, 189, 0.15);
}

.floor-item {
  padding: 12px;
  margin-bottom: 8px;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.04);
}

.floor-op {
  background: rgba(72, 121, 189, 0.06);
  border-color: rgba(72, 121, 189, 0.15);
}

.floor-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.floor-num {
  font-size: 12px;
  color: #4879bd;
  font-weight: 600;
  min-width: 30px;
}

.floor-author {
  font-size: 13px;
  color: #aaa;
}

.op-badge {
  color: #4879bd;
  font-weight: 500;
}

.floor-likes {
  font-size: 12px;
  color: #888;
  margin-left: auto;
}

.floor-content {
  font-size: 14px;
  line-height: 1.7;
  color: #ddd;
  padding-left: 40px;
}
</style>
