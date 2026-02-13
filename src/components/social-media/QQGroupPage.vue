<!--
  AI游戏开发商模拟器 - QQ群聊天界面
  模仿QQ群聊天风格，展示群消息记录
-->
<template>
  <div class="qq-page">
    <!-- 顶部导航 -->
    <div class="qq-header">
      <button class="back-btn" @click="goBack">← 返回</button>
      <div class="qq-title">
        <span class="qq-icon">🐧</span>
        <span class="qq-name" v-if="currentGroup">{{ currentGroup.群名 }}</span>
        <span class="qq-name" v-else>QQ群</span>
      </div>
      <div class="qq-member-count" v-if="currentGroup">
        群人数：{{ formatNumber(currentGroup.成员数) }}
      </div>
    </div>

    <!-- 群选择tabs -->
    <div class="group-tabs" v-if="groupEntries.length > 1">
      <button
        v-for="[id, group] in groupEntries"
        :key="id"
        :class="['group-tab', { active: selectedGroupId === id }]"
        @click="selectedGroupId = id"
      >
        {{ group.群名 }}
      </button>
    </div>

    <!-- 空状态 -->
    <div v-if="!currentGroup" class="empty-state">
      <div class="empty-icon">🐧</div>
      <p>暂无QQ群数据</p>
      <p class="empty-hint">游戏发布后，QQ群聊天记录将在这里显示</p>
    </div>

    <template v-else>
      <!-- 群公告 -->
      <div class="group-notice" v-if="currentGroup.群公告">
        <span class="notice-icon">📢</span>
        <span class="notice-text">群公告：{{ currentGroup.群公告 }}</span>
      </div>

      <!-- 聊天区域 -->
      <div class="chat-area">
        <div v-if="!currentGroup.消息记录?.length" class="no-messages">
          暂无消息记录
        </div>

        <div
          v-for="(msg, index) in currentGroup.消息记录"
          :key="index"
          :class="['message-item', getMessageClass(msg)]"
        >
          <!-- 系统消息 -->
          <template v-if="msg.类型 === '图片' || isSystemMessage(msg.内容)">
            <div class="system-message">
              {{ msg.内容 }}
            </div>
          </template>

          <!-- 普通消息 -->
          <template v-else>
            <div class="msg-header">
              <span :class="['msg-sender', getSenderClass(msg.用户名)]">{{ msg.用户名 }}</span>
              <span class="msg-time">{{ msg.时间 }}</span>
            </div>
            <div class="msg-bubble">
              <span class="msg-content">{{ msg.内容 }}</span>
            </div>
          </template>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useGameStateStore } from '@/stores/gameStateStore';
import type { ChatMessage } from '@/types/game.d';

const store = useGameStateStore();
const router = useRouter();

function goBack() {
  router.push('/game/social-media');
}

// 群列表
const groupEntries = computed(() => {
  if (!store.platformData?.qq群?.群列表) return [];
  return Object.entries(store.platformData.qq群.群列表);
});

const selectedGroupId = ref('');

watch(groupEntries, (entries) => {
  if (entries.length > 0 && !selectedGroupId.value) {
    selectedGroupId.value = entries[0][0];
  }
}, { immediate: true });

// 当前群数据
const currentGroup = computed(() => {
  if (!store.platformData?.qq群?.群列表 || !selectedGroupId.value) return null;
  return store.platformData.qq群.群列表[selectedGroupId.value] ?? null;
});

// 判断是否系统消息
function isSystemMessage(content: string): boolean {
  return content.includes('加入') || content.includes('退出') ||
         content.includes('欢迎') || content.includes('系统') ||
         content.includes('撤回') || content.includes('禁言');
}

// 消息样式类
function getMessageClass(msg: ChatMessage): string {
  if (msg.类型 === '图片' || isSystemMessage(msg.内容)) return 'system';
  return 'normal';
}

// 发送者颜色类
function getSenderClass(name: string): string {
  if (name.includes('管理') || name.includes('群主') || name.includes('admin')) return 'sender-admin';
  if (name.includes('官方') || name.includes('客服')) return 'sender-official';
  // 根据名字hash分配颜色
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const colors = ['sender-blue', 'sender-green', 'sender-purple', 'sender-orange', 'sender-cyan'];
  return colors[hash % colors.length];
}

function formatNumber(num: number | undefined): string {
  if (num === undefined || num === null) return '0';
  if (num >= 100000000) return (num / 100000000).toFixed(1) + '亿';
  if (num >= 10000) return (num / 10000).toFixed(1) + '万';
  return num.toLocaleString();
}
</script>

<style scoped>
.qq-page {
  background: #f0f0f0;
  min-height: 100%;
  color: #333;
  font-family: 'Microsoft YaHei', Arial, sans-serif;
  display: flex;
  flex-direction: column;
}

/* 顶部导航 */
.qq-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  background: linear-gradient(135deg, #12b7f5, #0d8ecf);
  color: #fff;
  flex-shrink: 0;
}

.back-btn {
  padding: 5px 14px;
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 4px;
  color: #fff;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.25);
}

.qq-title {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.qq-icon {
  font-size: 20px;
}

.qq-name {
  font-size: 16px;
  font-weight: 600;
}

.qq-member-count {
  font-size: 12px;
  opacity: 0.85;
}

/* 群选择tabs */
.group-tabs {
  display: flex;
  gap: 4px;
  padding: 8px 20px;
  background: #e8e8e8;
  border-bottom: 1px solid #ddd;
  overflow-x: auto;
  flex-shrink: 0;
}

.group-tab {
  padding: 6px 14px;
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 4px;
  color: #666;
  cursor: pointer;
  font-size: 12px;
  white-space: nowrap;
  transition: all 0.2s;
}

.group-tab:hover {
  color: #12b7f5;
  border-color: #12b7f5;
}

.group-tab.active {
  color: #fff;
  background: #12b7f5;
  border-color: #12b7f5;
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
  color: #999;
  margin: 4px 0;
}

.empty-hint {
  font-size: 13px;
  color: #bbb !important;
}

/* 群公告 */
.group-notice {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 10px 20px;
  background: #fff9e6;
  border-bottom: 1px solid #f0e6cc;
  flex-shrink: 0;
}

.notice-icon {
  font-size: 14px;
  flex-shrink: 0;
}

.notice-text {
  font-size: 12px;
  color: #8a6d3b;
  line-height: 1.5;
}

/* 聊天区域 */
.chat-area {
  flex: 1;
  padding: 16px 20px;
  overflow-y: auto;
  background: #f5f5f5;
}

.no-messages {
  text-align: center;
  padding: 40px;
  color: #999;
  font-size: 14px;
}

.message-item {
  margin-bottom: 12px;
}

/* 系统消息 */
.system-message {
  text-align: center;
  padding: 4px 12px;
  font-size: 12px;
  color: #999;
}

/* 普通消息 */
.msg-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
  padding-left: 4px;
}

.msg-sender {
  font-size: 12px;
  font-weight: 500;
}

.msg-time {
  font-size: 11px;
  color: #bbb;
}

/* 发送者颜色 */
.sender-admin { color: #e74c3c; }
.sender-official { color: #e67e22; }
.sender-blue { color: #3498db; }
.sender-green { color: #27ae60; }
.sender-purple { color: #9b59b6; }
.sender-orange { color: #e67e22; }
.sender-cyan { color: #1abc9c; }

.msg-bubble {
  display: inline-block;
  max-width: 80%;
  padding: 8px 12px;
  background: #fff;
  border-radius: 0 8px 8px 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
}

.msg-content {
  font-size: 14px;
  line-height: 1.6;
  color: #333;
  word-break: break-word;
}
</style>
