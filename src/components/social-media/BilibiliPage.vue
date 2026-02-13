<!--
  AI游戏开发商模拟器 - Bilibili 话题页面
  模仿B站粉色主题UI，包含视频卡片和弹幕模拟
-->
<template>
  <div class="bilibili-page">
    <!-- 顶部导航 -->
    <div class="bili-header">
      <button class="back-btn" @click="goBack">← 返回</button>
      <div class="bili-logo">
        <span class="bili-icon">📺</span>
        <span class="bili-text">bilibili</span>
        <span class="bili-topic" v-if="selectedTopic">#{{ selectedTopic }}</span>
      </div>
    </div>

    <!-- 话题选择tabs -->
    <div class="topic-tabs" v-if="topicNames.length > 0">
      <button
        v-for="name in topicNames"
        :key="name"
        :class="['topic-tab', { active: selectedTopic === name }]"
        @click="selectedTopic = name"
      >
        #{{ name }}
      </button>
    </div>

    <!-- 空状态 -->
    <div v-if="!currentTopicData" class="empty-state">
      <div class="empty-icon">📺</div>
      <p>暂无B站相关内容</p>
      <p class="empty-hint">游戏发布后，UP主们的视频将在这里显示</p>
    </div>

    <!-- 话题信息 -->
    <template v-else>
      <!-- 视频详情页 -->
      <template v-if="selectedVideo">
        <div class="video-detail">
          <button class="detail-back-btn" @click="selectedVideo = null">← 返回列表</button>

          <!-- 视频封面大图 -->
          <div class="detail-cover">
            <div class="detail-cover-inner">
              <span class="cover-game-name">{{ selectedTopic }}</span>
              <span class="video-type-badge">{{ selectedVideo.类型 }}</span>
            </div>
            <!-- 弹幕模拟条 -->
            <div class="danmaku-bar detail-danmaku" v-if="selectedVideo.热门弹幕?.length">
              <div class="danmaku-track" v-for="(dm, di) in selectedVideo.热门弹幕.slice(0, 5)" :key="di">
                <span class="danmaku-text" :style="{ animationDelay: (di * 1.5) + 's', animationDuration: (6 + di * 0.8) + 's' }">
                  {{ dm }}
                </span>
              </div>
            </div>
          </div>

          <!-- 视频标题和UP主 -->
          <div class="detail-header">
            <h3 class="detail-title">🎬 {{ selectedVideo.标题 }}</h3>
            <div class="detail-uploader">
              <span class="up-icon">UP</span>
              <span class="up-name">{{ selectedVideo.UP主 }}</span>
            </div>
          </div>

          <!-- 数据统计 -->
          <div class="detail-stats">
            <div class="detail-stat-item">
              <span class="detail-stat-icon">▶</span>
              <span class="detail-stat-num">{{ formatNumber(selectedVideo.播放量) }}</span>
              <span class="detail-stat-label">播放</span>
            </div>
            <div class="detail-stat-item">
              <span class="detail-stat-icon">💬</span>
              <span class="detail-stat-num">{{ formatNumber(selectedVideo.弹幕数) }}</span>
              <span class="detail-stat-label">弹幕</span>
            </div>
            <div class="detail-stat-item">
              <span class="detail-stat-icon">👍</span>
              <span class="detail-stat-num">{{ formatNumber(selectedVideo.点赞数) }}</span>
              <span class="detail-stat-label">点赞</span>
            </div>
            <div class="detail-stat-item">
              <span class="detail-stat-icon">💭</span>
              <span class="detail-stat-num">{{ formatNumber(selectedVideo.评论数) }}</span>
              <span class="detail-stat-label">评论</span>
            </div>
          </div>

          <!-- 完整评论列表 -->
          <div class="detail-comments">
            <div class="detail-comments-title">
              💬 评论区 ({{ selectedVideo.热门评论?.length || 0 }})
            </div>
            <div v-if="selectedVideo.热门评论?.length" class="detail-comments-list">
              <div
                v-for="(comment, ci) in selectedVideo.热门评论"
                :key="ci"
                class="detail-comment-item"
              >
                <div class="detail-comment-avatar">{{ comment.用户名?.charAt(0) || '?' }}</div>
                <div class="detail-comment-body">
                  <div class="detail-comment-user">{{ comment.用户名 }}</div>
                  <div class="detail-comment-text">{{ comment.内容 }}</div>
                  <div class="detail-comment-meta">
                    <span v-if="comment.点赞数 > 0" class="detail-comment-likes">👍 {{ comment.点赞数 }}</span>
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="detail-no-comments">暂无评论</div>
          </div>
        </div>
      </template>

      <!-- 视频列表页 -->
      <template v-else>
        <div class="topic-info">
          <div class="topic-stat">
            <span class="stat-label">话题热度</span>
            <span class="stat-value">{{ formatNumber(currentTopicData.话题热度) }}</span>
          </div>
          <div class="topic-stat">
            <span class="stat-label">话题浏览</span>
            <span class="stat-value">{{ formatNumber(currentTopicData.话题浏览量) }}</span>
          </div>
          <div class="topic-stat">
            <span class="stat-label">二创数量</span>
            <span class="stat-value">{{ formatNumber(currentTopicData.二创数量) }}</span>
          </div>
          <div class="topic-stat">
            <span class="stat-label">视频数</span>
            <span class="stat-value">{{ currentTopicData.视频列表.length }}</span>
          </div>
        </div>

        <!-- 视频列表 -->
        <div class="video-list">
          <div
            v-for="(video, index) in currentTopicData.视频列表"
            :key="index"
            class="video-card"
            @click="selectedVideo = video"
          >
            <!-- 视频封面+弹幕区 -->
            <div class="video-cover-area">
              <div class="video-cover">
                <span class="cover-game-name">{{ selectedTopic }}</span>
                <span class="video-type-badge">{{ video.类型 }}</span>
              </div>
              <!-- 弹幕模拟条 -->
              <div class="danmaku-bar" v-if="video.热门弹幕?.length">
                <div class="danmaku-track" v-for="(dm, di) in video.热门弹幕.slice(0, 5)" :key="di">
                  <span class="danmaku-text" :style="{ animationDelay: (di * 1.5) + 's', animationDuration: (6 + di * 0.8) + 's' }">
                    {{ dm }}
                  </span>
                </div>
              </div>
            </div>

            <!-- 视频信息 -->
            <div class="video-info">
              <h4 class="video-title">🎬 {{ video.标题 }}</h4>
              <div class="video-uploader">
                <span class="up-icon">UP</span>
                <span class="up-name">{{ video.UP主 }}</span>
              </div>

              <!-- 数据统计 -->
              <div class="video-stats">
                <span class="stat-item">▶ {{ formatNumber(video.播放量) }}</span>
                <span class="stat-item">💬 {{ formatNumber(video.弹幕数) }}</span>
                <span class="stat-item">👍 {{ formatNumber(video.点赞数) }}</span>
                <span class="stat-item">💭 {{ formatNumber(video.评论数) }}</span>
              </div>

              <!-- 点击提示 -->
              <div class="video-click-hint">
                点击查看详情和评论 →
              </div>
            </div>
          </div>
        </div>
      </template>
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

// 话题列表
const topicNames = computed(() => {
  if (!store.platformData?.bilibili?.话题) return [];
  return Object.keys(store.platformData.bilibili.话题);
});

const selectedTopic = ref('');

// 当前选中的视频（用于详情页展示）
const selectedVideo = ref<any>(null);

watch(topicNames, (names) => {
  if (names.length > 0 && !selectedTopic.value) {
    selectedTopic.value = names[0];
  }
}, { immediate: true });

// 切换话题时清除选中的视频
watch(selectedTopic, () => {
  selectedVideo.value = null;
});

// 当前话题数据
const currentTopicData = computed(() => {
  if (!store.platformData?.bilibili?.话题 || !selectedTopic.value) return null;
  return store.platformData.bilibili.话题[selectedTopic.value] ?? null;
});

function formatNumber(num: number | undefined): string {
  if (num === undefined || num === null) return '0';
  if (num >= 100000000) return (num / 100000000).toFixed(1) + '亿';
  if (num >= 10000) return (num / 10000).toFixed(1) + '万';
  return num.toLocaleString();
}
</script>

<style scoped>
.bilibili-page {
  background: #1c1c28;
  min-height: 100%;
  color: #e0e0e0;
  font-family: 'Microsoft YaHei', Arial, sans-serif;
  padding-bottom: 40px;
}

/* 顶部导航 */
.bili-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 14px 24px;
  background: linear-gradient(90deg, #1c1c28, #2a1a2e);
  border-bottom: 2px solid #fb7299;
}

.back-btn {
  padding: 6px 16px;
  background: rgba(251, 114, 153, 0.12);
  border: 1px solid rgba(251, 114, 153, 0.35);
  border-radius: 20px;
  color: #fb7299;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}

.back-btn:hover {
  background: rgba(251, 114, 153, 0.25);
  border-color: #fb7299;
}

.bili-logo {
  display: flex;
  align-items: center;
  gap: 8px;
}

.bili-icon {
  font-size: 20px;
}

.bili-text {
  font-size: 18px;
  font-weight: 700;
  color: #fb7299;
}

.bili-topic {
  font-size: 14px;
  color: #fb7299;
  opacity: 0.8;
}

/* 话题选择tabs */
.topic-tabs {
  display: flex;
  gap: 8px;
  padding: 12px 24px;
  background: #18182a;
  border-bottom: 1px solid rgba(251, 114, 153, 0.15);
  overflow-x: auto;
}

.topic-tab {
  padding: 6px 16px;
  background: rgba(251, 114, 153, 0.08);
  border: 1px solid rgba(251, 114, 153, 0.2);
  border-radius: 20px;
  color: #aaa;
  cursor: pointer;
  font-size: 13px;
  white-space: nowrap;
  transition: all 0.2s;
}

.topic-tab:hover {
  color: #fb7299;
  border-color: rgba(251, 114, 153, 0.4);
}

.topic-tab.active {
  color: #fff;
  background: #fb7299;
  border-color: #fb7299;
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

/* 话题信息 */
.topic-info {
  display: flex;
  gap: 24px;
  padding: 16px 24px;
  margin: 16px 24px 0;
  background: rgba(251, 114, 153, 0.06);
  border-radius: 8px;
  border: 1px solid rgba(251, 114, 153, 0.12);
}

.topic-stat {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-label {
  font-size: 12px;
  color: #888;
}

.stat-value {
  font-size: 18px;
  font-weight: 600;
  color: #fb7299;
}

/* 视频列表 */
.video-list {
  padding: 16px 24px;
}

.video-card {
  display: flex;
  gap: 16px;
  padding: 16px;
  margin-bottom: 16px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  transition: all 0.2s;
  cursor: pointer;
}

.video-card:hover {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(251, 114, 153, 0.2);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(251, 114, 153, 0.1);
}

.video-click-hint {
  font-size: 12px;
  color: #fb7299;
  opacity: 0;
  transition: opacity 0.2s;
  margin-top: 4px;
}

.video-card:hover .video-click-hint {
  opacity: 1;
}

/* 视频封面区域 */
.video-cover-area {
  flex-shrink: 0;
  width: 220px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.video-cover {
  width: 100%;
  height: 130px;
  background: linear-gradient(135deg, #2a1a3e, #1c1c28);
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(251, 114, 153, 0.2);
}

.cover-game-name {
  font-size: 16px;
  font-weight: 600;
  color: #fb7299;
  text-align: center;
  padding: 8px;
}

.video-type-badge {
  position: absolute;
  top: 6px;
  right: 6px;
  padding: 2px 8px;
  background: rgba(251, 114, 153, 0.8);
  border-radius: 4px;
  font-size: 11px;
  color: #fff;
}

/* 弹幕模拟条 */
.danmaku-bar {
  width: 100%;
  height: 60px;
  background: rgba(0, 0, 0, 0.4);
  border-radius: 4px;
  overflow: hidden;
  position: relative;
}

.danmaku-track {
  position: absolute;
  width: 100%;
  white-space: nowrap;
}

.danmaku-track:nth-child(1) { top: 4px; }
.danmaku-track:nth-child(2) { top: 18px; }
.danmaku-track:nth-child(3) { top: 32px; }
.danmaku-track:nth-child(4) { top: 46px; }
.danmaku-track:nth-child(5) { top: 10px; }

.danmaku-text {
  display: inline-block;
  padding: 1px 6px;
  font-size: 12px;
  color: #fff;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
  animation: danmaku-scroll linear infinite;
  position: absolute;
  right: -200px;
}

@keyframes danmaku-scroll {
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(calc(-100% - 220px));
  }
}

/* 视频信息 */
.video-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.video-title {
  font-size: 15px;
  font-weight: 600;
  color: #e0e0e0;
  margin: 0;
  line-height: 1.4;
}

.video-title:hover {
  color: #fb7299;
}

.video-uploader {
  display: flex;
  align-items: center;
  gap: 6px;
}

.up-icon {
  padding: 1px 4px;
  background: #fb7299;
  border-radius: 3px;
  font-size: 10px;
  font-weight: 700;
  color: #fff;
}

.up-name {
  font-size: 13px;
  color: #fb7299;
}

/* 数据统计 */
.video-stats {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.stat-item {
  font-size: 12px;
  color: #999;
}

/* ===== 视频详情页 ===== */
.video-detail {
  padding: 16px 24px;
}

.detail-back-btn {
  padding: 8px 20px;
  background: rgba(251, 114, 153, 0.12);
  border: 1px solid rgba(251, 114, 153, 0.35);
  border-radius: 20px;
  color: #fb7299;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
  margin-bottom: 16px;
}

.detail-back-btn:hover {
  background: rgba(251, 114, 153, 0.25);
  border-color: #fb7299;
}

.detail-cover {
  width: 100%;
  margin-bottom: 16px;
}

.detail-cover-inner {
  width: 100%;
  height: 200px;
  background: linear-gradient(135deg, #2a1a3e, #1c1c28);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(251, 114, 153, 0.2);
}

.detail-danmaku {
  height: 80px;
  border-radius: 0 0 8px 8px;
}

.detail-header {
  margin-bottom: 16px;
}

.detail-title {
  font-size: 20px;
  font-weight: 700;
  color: #e0e0e0;
  margin: 0 0 8px 0;
  line-height: 1.4;
}

.detail-uploader {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 详情页数据统计 */
.detail-stats {
  display: flex;
  gap: 24px;
  padding: 16px;
  background: rgba(251, 114, 153, 0.06);
  border-radius: 8px;
  border: 1px solid rgba(251, 114, 153, 0.12);
  margin-bottom: 20px;
}

.detail-stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.detail-stat-icon {
  font-size: 18px;
}

.detail-stat-num {
  font-size: 18px;
  font-weight: 700;
  color: #fb7299;
}

.detail-stat-label {
  font-size: 12px;
  color: #888;
}

/* 详情页评论区 */
.detail-comments {
  background: rgba(255, 255, 255, 0.02);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  overflow: hidden;
}

.detail-comments-title {
  padding: 12px 16px;
  font-size: 15px;
  font-weight: 600;
  color: #e0e0e0;
  background: rgba(251, 114, 153, 0.06);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.detail-comments-list {
  padding: 8px 0;
}

.detail-comment-item {
  display: flex;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  transition: background 0.2s;
}

.detail-comment-item:last-child {
  border-bottom: none;
}

.detail-comment-item:hover {
  background: rgba(251, 114, 153, 0.04);
}

.detail-comment-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #fb7299, #e84f7a);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 700;
  color: #fff;
  flex-shrink: 0;
}

.detail-comment-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-comment-user {
  font-size: 13px;
  font-weight: 600;
  color: #fb7299;
}

.detail-comment-text {
  font-size: 14px;
  color: #ccc;
  line-height: 1.6;
}

.detail-comment-meta {
  display: flex;
  gap: 12px;
  margin-top: 2px;
}

.detail-comment-likes {
  font-size: 12px;
  color: #888;
}

.detail-no-comments {
  padding: 40px 16px;
  text-align: center;
  color: #666;
  font-size: 14px;
}
</style>
