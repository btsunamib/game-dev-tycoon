<!--
  AI游戏开发商模拟器 - Discord 服务器界面
  模仿Discord深色主题UI，左侧频道列表+右侧消息
-->
<template>
  <div class="discord-page">
    <!-- 顶部导航（移动端） -->
    <div class="discord-top-bar">
      <button class="back-btn" @click="goBack">← 返回</button>
      <span class="discord-logo">🎧 Discord</span>
      <span class="channel-name" v-if="selectedChannel"># {{ selectedChannel }}</span>
    </div>

    <!-- 空状态 -->
    <div v-if="!currentServer" class="empty-state">
      <div class="empty-icon">🎧</div>
      <p>暂无Discord服务器数据</p>
      <p class="empty-hint">游戏发布后，Discord社区消息将在这里显示</p>
    </div>

    <template v-else>
      <div class="discord-layout">
        <!-- 左侧边栏 -->
        <div class="discord-sidebar">
          <!-- 服务器选择 -->
          <div class="server-selector" v-if="serverEntries.length > 1">
            <div
              v-for="[id, server] in serverEntries"
              :key="id"
              :class="['server-icon', { active: selectedServerId === id }]"
              @click="selectedServerId = id"
              :title="server.名称"
            >
              {{ server.名称.charAt(0) }}
            </div>
          </div>

          <!-- 服务器信息 -->
          <div class="server-header">
            <span class="server-name">{{ currentServer.名称 }}</span>
          </div>

          <!-- 服务器统计 -->
          <div class="server-stats">
            <span class="stat-dot online"></span>
            <span class="stat-text">{{ formatNumber(currentServer.在线人数) }} 在线</span>
            <span class="stat-dot total"></span>
            <span class="stat-text">{{ formatNumber(currentServer.成员数) }} 成员</span>
          </div>

          <!-- 频道列表 -->
          <div class="channel-category">
            <span class="category-name">▾ TEXT CHANNELS</span>
          </div>
          <div class="channel-list">
            <div
              v-for="channelName in channelNames"
              :key="channelName"
              :class="['channel-item', { active: selectedChannel === channelName }]"
              @click="selectedChannel = channelName"
            >
              <span class="channel-hash">#</span>
              <span class="channel-label">{{ channelName }}</span>
              <span class="channel-badge" v-if="getChannelMessageCount(channelName) > 0">
                {{ getChannelMessageCount(channelName) }}
              </span>
            </div>
          </div>
        </div>

        <!-- 右侧消息区域 -->
        <div class="discord-main">
          <!-- 频道标题 -->
          <div class="channel-header">
            <span class="channel-header-hash">#</span>
            <span class="channel-header-name">{{ selectedChannel || 'general' }}</span>
          </div>

          <!-- 消息列表 -->
          <div class="message-list">
            <div v-if="!currentMessages.length" class="no-messages">
              <div class="welcome-icon">👋</div>
              <p>Welcome to #{{ selectedChannel }}!</p>
              <p class="welcome-sub">This is the start of the channel.</p>
            </div>

            <div
              v-for="(msg, index) in currentMessages"
              :key="index"
              class="discord-message"
            >
              <div class="msg-avatar">
                <span class="avatar-circle" :style="{ background: getAvatarColor(msg.用户名) }">
                  {{ msg.用户名.charAt(0).toUpperCase() }}
                </span>
              </div>
              <div class="msg-body">
                <div class="msg-header">
                  <span :class="['msg-username', getUsernameClass(msg.用户名)]">
                    {{ msg.用户名 }}
                  </span>
                  <span class="bot-badge" v-if="isBot(msg.用户名)">BOT</span>
                  <span class="msg-timestamp">{{ msg.时间 }}</span>
                </div>
                <div class="msg-content">{{ msg.内容 }}</div>
              </div>
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

// 服务器列表
const serverEntries = computed(() => {
  if (!store.platformData?.discord?.服务器) return [];
  return Object.entries(store.platformData.discord.服务器);
});

const selectedServerId = ref('');

watch(serverEntries, (entries) => {
  if (entries.length > 0 && !selectedServerId.value) {
    selectedServerId.value = entries[0][0];
  }
}, { immediate: true });

// 当前服务器
const currentServer = computed(() => {
  if (!store.platformData?.discord?.服务器 || !selectedServerId.value) return null;
  return store.platformData.discord.服务器[selectedServerId.value] ?? null;
});

// 频道列表
const channelNames = computed(() => {
  if (!currentServer.value?.频道消息) return [];
  return Object.keys(currentServer.value.频道消息);
});

const selectedChannel = ref('');

watch(channelNames, (names) => {
  if (names.length > 0 && !selectedChannel.value) {
    selectedChannel.value = names[0];
  }
}, { immediate: true });

// 当前频道消息
const currentMessages = computed(() => {
  if (!currentServer.value?.频道消息 || !selectedChannel.value) return [];
  return currentServer.value.频道消息[selectedChannel.value] ?? [];
});

// 获取频道消息数
function getChannelMessageCount(channelName: string): number {
  if (!currentServer.value?.频道消息) return 0;
  return currentServer.value.频道消息[channelName]?.length ?? 0;
}

// 头像颜色
function getAvatarColor(name: string): string {
  const colors = ['#5865f2', '#57f287', '#fee75c', '#eb459e', '#ed4245', '#f47b67', '#e67e22', '#1abc9c'];
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
}

// 用户名颜色类
function getUsernameClass(name: string): string {
  if (isBot(name)) return 'username-bot';
  if (name.includes('Dev') || name.includes('dev') || name.includes('Admin') || name.includes('admin')) return 'username-admin';
  if (name.includes('Mod') || name.includes('mod')) return 'username-mod';
  return 'username-default';
}

// 是否是Bot
function isBot(name: string): boolean {
  return name.includes('BOT') || name.includes('Bot') || name.includes('bot') || name.includes('[BOT]');
}

function formatNumber(num: number | undefined): string {
  if (num === undefined || num === null) return '0';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}
</script>

<style scoped>
.discord-page {
  background: #36393f;
  min-height: 100%;
  color: #dcddde;
  font-family: 'Whitney', 'Helvetica Neue', Helvetica, Arial, sans-serif;
  display: flex;
  flex-direction: column;
}

/* 顶部导航 */
.discord-top-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  background: #2f3136;
  border-bottom: 1px solid #202225;
  flex-shrink: 0;
}

.back-btn {
  padding: 4px 12px;
  background: rgba(88, 101, 242, 0.15);
  border: 1px solid rgba(88, 101, 242, 0.3);
  border-radius: 3px;
  color: #5865f2;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}

.back-btn:hover {
  background: rgba(88, 101, 242, 0.3);
}

.discord-logo {
  font-size: 15px;
  font-weight: 700;
  color: #fff;
}

.channel-name {
  font-size: 13px;
  color: #8e9297;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  text-align: center;
  flex: 1;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.4;
}

.empty-state p {
  color: #8e9297;
  margin: 4px 0;
}

.empty-hint {
  font-size: 13px;
  color: #4f545c !important;
}

/* Discord布局 */
.discord-layout {
  display: flex;
  flex: 1;
  min-height: 0;
}

/* 左侧边栏 */
.discord-sidebar {
  width: 240px;
  background: #2f3136;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  border-right: 1px solid #202225;
}

.server-selector {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 12px 0;
  border-bottom: 1px solid #202225;
}

.server-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #36393f;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 600;
  color: #dcddde;
  cursor: pointer;
  transition: all 0.2s;
}

.server-icon:hover,
.server-icon.active {
  border-radius: 30%;
  background: #5865f2;
  color: #fff;
}

.server-header {
  padding: 12px 16px;
  border-bottom: 1px solid #202225;
}

.server-name {
  font-size: 15px;
  font-weight: 600;
  color: #fff;
}

.server-stats {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  font-size: 12px;
}

.stat-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.stat-dot.online { background: #3ba55d; }
.stat-dot.total { background: #747f8d; margin-left: 8px; }

.stat-text {
  color: #8e9297;
}

.channel-category {
  padding: 16px 16px 4px;
}

.category-name {
  font-size: 11px;
  font-weight: 700;
  color: #8e9297;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.channel-list {
  padding: 0 8px;
  flex: 1;
  overflow-y: auto;
}

.channel-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.1s;
  margin-bottom: 2px;
}

.channel-item:hover {
  background: rgba(79, 84, 92, 0.32);
}

.channel-item.active {
  background: rgba(79, 84, 92, 0.6);
}

.channel-hash {
  font-size: 18px;
  color: #8e9297;
  font-weight: 400;
  opacity: 0.6;
}

.channel-label {
  font-size: 14px;
  color: #8e9297;
}

.channel-item.active .channel-label,
.channel-item:hover .channel-label {
  color: #dcddde;
}

.channel-badge {
  margin-left: auto;
  padding: 0 6px;
  min-width: 16px;
  height: 16px;
  background: #ed4245;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 700;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 右侧消息区域 */
.discord-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.channel-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 12px 16px;
  background: #36393f;
  border-bottom: 1px solid #202225;
  flex-shrink: 0;
}

.channel-header-hash {
  font-size: 20px;
  color: #8e9297;
  opacity: 0.6;
}

.channel-header-name {
  font-size: 15px;
  font-weight: 600;
  color: #fff;
}

.message-list {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
}

.no-messages {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  text-align: center;
}

.welcome-icon {
  font-size: 40px;
  margin-bottom: 8px;
}

.no-messages p {
  color: #dcddde;
  font-size: 16px;
  font-weight: 600;
  margin: 4px 0;
}

.welcome-sub {
  font-size: 14px !important;
  font-weight: 400 !important;
  color: #8e9297 !important;
}

/* Discord消息 */
.discord-message {
  display: flex;
  gap: 16px;
  padding: 4px 0;
  margin-bottom: 8px;
}

.discord-message:hover {
  background: rgba(4, 4, 5, 0.07);
  border-radius: 4px;
}

.msg-avatar {
  flex-shrink: 0;
}

.avatar-circle {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 600;
  color: #fff;
}

.msg-body {
  flex: 1;
  min-width: 0;
}

.msg-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.msg-username {
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.msg-username:hover {
  text-decoration: underline;
}

.username-default { color: #dcddde; }
.username-admin { color: #ed4245; }
.username-mod { color: #57f287; }
.username-bot { color: #5865f2; }

.bot-badge {
  padding: 1px 4px;
  background: #5865f2;
  border-radius: 3px;
  font-size: 10px;
  font-weight: 600;
  color: #fff;
  text-transform: uppercase;
}

.msg-timestamp {
  font-size: 11px;
  color: #72767d;
}

.msg-content {
  font-size: 14px;
  line-height: 1.5;
  color: #dcddde;
  word-break: break-word;
}
</style>
