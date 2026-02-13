<!--
  AI游戏开发商模拟器 - 主游戏面板（AI对话界面）
  核心交互界面：状态栏 + 消息区域 + 行动选项 + 自定义输入
-->
<template>
  <div class="main-game-panel">
    <!-- 📊 状态栏 -->
    <div class="status-bar">
      <div class="status-item">
        <span class="status-icon">🕐</span>
        <span class="status-label">时间</span>
        <span class="status-value">{{ gameState.formattedTime }}</span>
      </div>
      <div class="status-divider"></div>
      <div class="status-item">
        <span class="status-icon">💰</span>
        <span class="status-label">资金</span>
        <span class="status-value" :style="{ color: gameState.fundsColor }">
          ¥{{ formatMoney(gameState.currentFunds) }}
        </span>
      </div>
      <div class="status-divider"></div>
      <div class="status-item">
        <span class="status-icon">🎮</span>
        <span class="status-label">项目</span>
        <span class="status-value">
          <template v-if="focusProjectInfo">
            {{ focusProjectInfo.名称 }}
            <span class="project-progress">({{ focusProjectInfo.进度.总体 }}%)</span>
          </template>
          <template v-else>
            <span class="text-muted">无</span>
          </template>
        </span>
      </div>
      <div class="status-item status-employees">
        <span class="status-icon">👥</span>
        <span class="status-value">{{ gameState.employeeCount }}人</span>
      </div>
    </div>

    <!-- 💬 消息区域 -->
    <div class="messages-area" ref="messagesContainer">
      <!-- 空状态 -->
      <div v-if="messages.length === 0 && !isGenerating" class="empty-state">
        <div class="empty-icon">🎮</div>
        <div class="empty-text">欢迎来到游戏开发商模拟器</div>
        <div class="empty-hint">正在生成开局叙事...</div>
      </div>

      <!-- 消息列表 -->
      <div
        v-for="(msg, index) in messages"
        :key="index"
        class="message-item"
        :class="[`message-${msg.type}`]"
      >
        <!-- 时间戳 -->
        <div class="message-time">{{ msg.time }}</div>

        <!-- 消息内容 -->
        <div class="message-bubble" :class="[`bubble-${msg.type}`]">
          <!-- 角色标识 -->
          <div class="message-role">
            <span v-if="msg.type === 'gm'" class="role-badge role-gm">🤖 GM</span>
            <span v-else class="role-badge role-player">👤 你</span>
          </div>

          <!-- 文本内容（支持简单Markdown） -->
          <div class="message-content" v-html="renderMarkdown(msg.content)"></div>

          <!-- 状态变更折叠卡片 -->
          <div
            v-if="msg.stateChanges && msg.stateChanges.changes.length > 0"
            class="state-changes-card"
          >
            <div
              class="state-changes-header"
              @click="toggleStateChanges(index)"
            >
              <span>📋 状态变更 ({{ msg.stateChanges.changes.length }}项)</span>
              <span class="toggle-icon">{{ expandedChanges.has(index) ? '▼' : '▶' }}</span>
            </div>
            <div v-if="expandedChanges.has(index)" class="state-changes-body">
              <div
                v-for="(change, ci) in msg.stateChanges.changes"
                :key="ci"
                class="change-item"
              >
                <span class="change-action" :class="`action-${change.action}`">
                  {{ getActionLabel(change.action) }}
                </span>
                <span class="change-key">{{ change.key }}</span>
                <span class="change-arrow">→</span>
                <span class="change-value">{{ formatChangeValue(change.newValue) }}</span>
              </div>
            </div>
          </div>

          <!-- 重说按钮（最后一条GM消息时显示） -->
          <div
            v-if="msg.type === 'gm' && isLastGmMessage(index) && !isGenerating"
            class="reroll-bar"
          >
            <button class="reroll-btn" @click="rerollLastMessage">
              🔄 重说
            </button>
          </div>

          <!-- 编辑按钮（玩家消息，非生成中时显示） -->
          <button
            v-if="msg.type === 'player' && !isGenerating"
            class="edit-msg-btn"
            title="编辑此消息并重新发送"
            @click="editMessage(index)"
          >
            ✏️
          </button>
        </div>
      </div>

      <!-- 流式输出区域 -->
      <div v-if="isGenerating" class="message-item message-gm">
        <div class="message-time">{{ gameState.formattedTime }}</div>
        <div class="message-bubble bubble-gm">
          <div class="message-role">
            <span class="role-badge role-gm">🤖 GM</span>
          </div>
          <div class="message-content streaming-content">
            <span v-if="currentStreamText" v-html="renderMarkdown(currentStreamText)"></span>
            <span v-else class="thinking-text">思考中</span>
            <span class="typing-cursor">▌</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 🎯 行动选项按钮区 -->
    <div v-if="currentOptions.length > 0 && !isGenerating" class="action-options">
      <div class="options-label">选择行动：</div>
      <div class="options-grid">
        <button
          v-for="(option, index) in currentOptions"
          :key="index"
          class="option-btn"
          :disabled="isGenerating"
          @click="fillInput(option)"
        >
          {{ option }}
        </button>
      </div>
    </div>

    <!-- ✏️ 自定义输入区 -->
    <div class="input-area">
      <div class="input-wrapper">
        <textarea
          ref="inputRef"
          v-model="userInput"
          class="message-input"
          placeholder="输入你的行动或决策..."
          :disabled="isGenerating"
          rows="1"
          @keydown="handleKeydown"
          @input="autoResize"
        ></textarea>
        <button
          class="send-btn"
          :disabled="isGenerating || !userInput.trim()"
          @click="sendMessage(userInput.trim())"
        >
          <template v-if="isGenerating">
            <span class="loading-dot"></span>
          </template>
          <template v-else>
            发送
          </template>
        </button>
      </div>
      <div class="input-hints">
        <span>Enter 发送 · Shift+Enter 换行</span>
        <span class="input-actions">
          <button
            v-if="canReroll"
            class="reroll-btn input-reroll-btn"
            @click="rerollLastMessage"
            :disabled="isGenerating"
          >
            🔄 重说
          </button>
          <span v-if="isGenerating" class="generating-hint">
            ⏳ AI正在生成回复...
            <button class="cancel-btn" @click="cancelGeneration">取消</button>
          </span>
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onActivated, nextTick, watch } from 'vue';
import { useGameStateStore } from '@/stores/gameStateStore';
import { useUIStore } from '@/stores/uiStore';
import { AIBidirectionalSystem } from '@/utils/AIBidirectionalSystem';
import type { GameMessage, GameProject } from '@/types/game.d';

// ===== Store & 系统 =====
const gameState = useGameStateStore();
const uiStore = useUIStore();
const aiSystem = AIBidirectionalSystem;

// ===== 从Store读取的响应式状态（核心：状态在store中，切换面板不丢失） =====
const messages = computed(() => uiStore.chatMessages);
const currentOptions = computed(() => uiStore.chatCurrentOptions);
const isGenerating = computed(() => uiStore.chatIsGenerating);
const currentStreamText = computed(() => uiStore.chatStreamText);

// ===== 仅UI本地状态 =====
const userInput = ref('');
const expandedChanges = reactive(new Set<number>());

// ===== DOM引用 =====
const messagesContainer = ref<HTMLDivElement | null>(null);
const inputRef = ref<HTMLTextAreaElement | null>(null);

// ===== 计算属性 =====
/** 重点关注项目信息 */
const focusProjectInfo = computed((): GameProject | null => {
  if (!gameState.focusProject || !gameState.currentProjects) return null;
  return gameState.currentProjects[gameState.focusProject] ?? null;
});

/** 是否可以重说（有至少一条GM消息且不在生成中） */
const canReroll = computed((): boolean => {
  if (isGenerating.value || messages.value.length === 0) return false;
  return messages.value.some(m => m.type === 'gm');
});

// ===== 核心方法 =====

/**
 * 将行动选项文本填入输入框（不直接发送）
 * @param text 选项文本
 */
function fillInput(text: string) {
  userInput.value = text;
  nextTick(() => {
    autoResize();
    inputRef.value?.focus();
  });
}

/**
 * 发送消息给AI
 * @param text 消息文本
 */
async function sendMessage(text: string) {
  if (!text.trim() || isGenerating.value) return;

  // 清空输入
  userInput.value = '';
  resetTextareaHeight();

  // 添加玩家消息到store
  uiStore.addChatMessage({
    type: 'player',
    content: text,
    time: gameState.formattedTime,
  });

  // 清空当前选项
  uiStore.setChatOptions([]);

  // 滚动到底部
  await scrollToBottom();

  // 开始生成
  uiStore.setChatGenerating(true);
  uiStore.clearChatStream();

  try {
    const result = await aiSystem.processPlayerAction(text, {
      onStreamChunk: (chunk: string) => {
        uiStore.appendChatStreamText(chunk);
        // 流式输出时持续滚动
        scrollToBottom();
      },
    });

    if (result.success && result.response) {
      // 添加GM消息到store（记录触发该回复的玩家输入）
      uiStore.addChatMessage({
        type: 'gm',
        content: result.response.text,
        time: gameState.formattedTime,
        actionOptions: result.response.action_options,
        stateChanges: result.stateChanges,
        playerInput: text,
      });

      // 更新当前选项
      uiStore.setChatOptions(result.response.action_options || []);
    } else {
      // 错误消息
      uiStore.addChatMessage({
        type: 'gm',
        content: `⚠️ **系统提示**: ${result.error || '未知错误，请重试'}`,
        time: gameState.formattedTime,
        actionOptions: ['重试上一个操作', '查看公司状态', '自由输入'],
        playerInput: text,
      });
      uiStore.setChatOptions(['重试上一个操作', '查看公司状态', '自由输入']);
    }
  } catch (error) {
    uiStore.addChatMessage({
      type: 'gm',
      content: `⚠️ **系统错误**: ${(error as Error).message}`,
      time: gameState.formattedTime,
    });
  } finally {
    uiStore.setChatGenerating(false);
    uiStore.clearChatStream();
    await scrollToBottom();
    autoSave();
  }
}

/**
 * 生成开局消息
 */
async function generateOpeningMessage() {
  if (!gameState.companyInfo || !gameState.gameTime) return;

  uiStore.setChatGenerating(true);
  uiStore.clearChatStream();

  try {
    const result = await aiSystem.generateInitialMessage(
      gameState.companyInfo.名称,
      gameState.companyInfo.创始人,
      gameState.currentFunds,
      gameState.gameTime.年,
      '普通', // 默认难度
      {
        onStreamChunk: (chunk: string) => {
          uiStore.appendChatStreamText(chunk);
          scrollToBottom();
        },
      },
    );

    if (result.success && result.response) {
      uiStore.addChatMessage({
        type: 'gm',
        content: result.response.text,
        time: gameState.formattedTime,
        actionOptions: result.response.action_options,
        stateChanges: result.stateChanges,
      });
      uiStore.setChatOptions(result.response.action_options || []);
    } else {
      uiStore.addChatMessage({
        type: 'gm',
        content: `欢迎来到 **${gameState.companyInfo.名称}**！\n\n你是创始人 **${gameState.companyInfo.创始人}**，带着 ¥${formatMoney(gameState.currentFunds)} 的启动资金，开始了你的游戏开发��旅。\n\n> ⚠️ AI连接失败: ${result.error}\n\n请先在设置面板中配置API密钥，然后重新开始。`,
        time: gameState.formattedTime,
        actionOptions: ['查看办公室', '制定第一个游戏计划', '招聘员工', '了解市场行情'],
      });
      uiStore.setChatOptions(['查看办公室', '制定第一个游戏计划', '招聘员工', '了解市场行情']);
    }
  } catch (error) {
    uiStore.addChatMessage({
      type: 'gm',
      content: `⚠️ 开局消息生成失败: ${(error as Error).message}`,
      time: gameState.formattedTime,
    });
  } finally {
    uiStore.setChatGenerating(false);
    uiStore.clearChatStream();
    uiStore.setChatInitialized(true);
    await scrollToBottom();
    autoSave();
  }
}

/**
 * 取消当前生成
 */
function cancelGeneration() {
  aiSystem.cancelCurrentRequest();
  uiStore.setChatGenerating(false);

  if (uiStore.chatStreamText) {
    // 保留已生成的部分内容
    uiStore.addChatMessage({
      type: 'gm',
      content: uiStore.chatStreamText + '\n\n*（生成已取消）*',
      time: gameState.formattedTime,
      actionOptions: ['继续', '重试', '自由输入'],
    });
    uiStore.setChatOptions(['继续', '重试', '自由输入']);
  }
  uiStore.clearChatStream();
}

/**
 * 自动存档 - AI每次回复完自动保存
 */
function autoSave() {
  try {
    const saveData = gameState.toSaveData();
    if (saveData) {
      saveData.元数据.更新时间 = new Date().toISOString();
      localStorage.setItem('game_auto_save', JSON.stringify(saveData));
      console.log('[AutoSave] ✅ 自动存档完成');
    }
  } catch (error) {
    console.warn('[AutoSave] ⚠️ 自动存档失败:', error);
  }
}

/**
 * 判断是否是最后一条GM消息
 */
function isLastGmMessage(index: number): boolean {
  // 从后往前找最后一条GM消息
  for (let i = messages.value.length - 1; i >= 0; i--) {
    if (messages.value[i].type === 'gm') {
      return i === index;
    }
  }
  return false;
}

/**
 * 重说 - 删除最后一条AI消息并重新生成
 */
async function rerollLastMessage() {
  if (isGenerating.value) return;

  // 通过store删除最后一条GM消息，获取被删除的消息
  const removedMsg = uiStore.removeLastGmMessage();
  if (!removedMsg) return;

  const playerInput = removedMsg.playerInput || '继续';

  // 清空当前选项
  uiStore.setChatOptions([]);

  // 滚动到底部
  await scrollToBottom();

  // 重新生成
  uiStore.setChatGenerating(true);
  uiStore.clearChatStream();

  try {
    const result = await aiSystem.processPlayerAction(playerInput, {
      onStreamChunk: (chunk: string) => {
        uiStore.appendChatStreamText(chunk);
        scrollToBottom();
      },
    });

    if (result.success && result.response) {
      uiStore.addChatMessage({
        type: 'gm',
        content: result.response.text,
        time: gameState.formattedTime,
        actionOptions: result.response.action_options,
        stateChanges: result.stateChanges,
        playerInput,
      });
      uiStore.setChatOptions(result.response.action_options || []);
    } else {
      uiStore.addChatMessage({
        type: 'gm',
        content: `⚠️ **系统提示**: ${result.error || '重说失败，请重试'}`,
        time: gameState.formattedTime,
        actionOptions: ['重试', '自由输入'],
        playerInput,
      });
      uiStore.setChatOptions(['重试', '自由输入']);
    }
  } catch (error) {
    uiStore.addChatMessage({
      type: 'gm',
      content: `⚠️ **系统错误**: ${(error as Error).message}`,
      time: gameState.formattedTime,
      playerInput,
    });
  } finally {
    uiStore.setChatGenerating(false);
    uiStore.clearChatStream();
    await scrollToBottom();
    autoSave();
  }
}

/**
 * 编辑玩家消息 - 将消息文本填入输入框，删除该消息及之后的所有消息
 * @param index 消息在列表中的索引
 */
function editMessage(index: number) {
  const msg = uiStore.chatMessages[index];
  if (msg.type !== 'player' || isGenerating.value) return;

  // 将消息文本填入输入框
  userInput.value = msg.content;

  // 删除该消息及之后的所有消息（包括AI的回复）
  uiStore.truncateMessagesFrom(index);

  // 清空当前选项（因为对应的GM回复已被删除）
  uiStore.setChatOptions([]);

  // 聚焦输入框并自动调整高度
  nextTick(() => {
    autoResize();
    inputRef.value?.focus();
  });
}

// ===== 辅助方法 =====

/** 格式化金额 */
function formatMoney(amount: number | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) return '0';
  if (amount >= 100000000) return (amount / 100000000).toFixed(2) + '亿';
  if (amount >= 10000) return (amount / 10000).toFixed(1) + '万';
  return amount.toLocaleString('zh-CN');
}

/** 简单Markdown渲染 */
function renderMarkdown(text: string): string {
  if (!text) return '';
  let html = text
    // 转义HTML
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // 加粗
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // 斜体
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // 行内代码
    .replace(/`(.+?)`/g, '<code>$1</code>')
    // 引用块
    .replace(/^&gt;\s*(.+)$/gm, '<blockquote>$1</blockquote>')
    // 无序列表
    .replace(/^[-*]\s+(.+)$/gm, '<li>$1</li>')
    // 有序列表
    .replace(/^\d+\.\s+(.+)$/gm, '<li>$1</li>')
    // 标题
    .replace(/^###\s+(.+)$/gm, '<h4>$1</h4>')
    .replace(/^##\s+(.+)$/gm, '<h3>$1</h3>')
    .replace(/^#\s+(.+)$/gm, '<h2>$1</h2>')
    // 分割线
    .replace(/^---$/gm, '<hr/>')
    // 换行
    .replace(/\n/g, '<br/>');

  // 合并连续的 <li> 为 <ul>
  html = html.replace(/(<li>.*?<\/li>)(<br\/>)?/g, '$1');
  html = html.replace(/((?:<li>.*?<\/li>)+)/g, '<ul>$1</ul>');

  // 合并连续的 <blockquote>
  html = html.replace(/<\/blockquote><br\/><blockquote>/g, '<br/>');

  return html;
}

/** 获取操作标签 */
function getActionLabel(action: string): string {
  const labels: Record<string, string> = {
    set: '设置',
    add: '增减',
    push: '添加',
    delete: '删除',
    pull: '移除',
  };
  return labels[action] || action;
}

/** 格式化变更值 */
function formatChangeValue(value: unknown): string {
  if (value === null || value === undefined) return '(空)';
  if (typeof value === 'object') {
    try {
      const str = JSON.stringify(value);
      return str.length > 60 ? str.substring(0, 57) + '...' : str;
    } catch {
      return String(value);
    }
  }
  return String(value);
}

/** 切换状态变更展开/折叠 */
function toggleStateChanges(index: number) {
  if (expandedChanges.has(index)) {
    expandedChanges.delete(index);
  } else {
    expandedChanges.add(index);
  }
}

/** 滚动到底部 */
async function scrollToBottom() {
  await nextTick();
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
}

/** 处理键盘事件 */
function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    if (userInput.value.trim() && !isGenerating.value) {
      sendMessage(userInput.value.trim());
    }
  }
}

/** 自动调整输入框高度 */
function autoResize() {
  if (inputRef.value) {
    inputRef.value.style.height = 'auto';
    const newHeight = Math.min(inputRef.value.scrollHeight, 120);
    inputRef.value.style.height = newHeight + 'px';
  }
}

/** 重置输入框高度 */
function resetTextareaHeight() {
  if (inputRef.value) {
    inputRef.value.style.height = 'auto';
  }
}

// ===== 生命周期 =====

onMounted(async () => {
  // 如果store中已有聊天消息（说明之前已初始化过），直接使用
  if (uiStore.chatInitialized && uiStore.chatMessages.length > 0) {
    // 恢复最后一条GM消息的选项（如果store中没有）
    if (uiStore.chatCurrentOptions.length === 0) {
      const lastGmMsg = [...uiStore.chatMessages].reverse().find(m => m.type === 'gm');
      if (lastGmMsg?.actionOptions) {
        uiStore.setChatOptions(lastGmMsg.actionOptions);
      }
    }
    await scrollToBottom();
  } else if (!uiStore.chatInitialized) {
    // 首次初始化：从gameState恢复历史消息或生成开局消息
    if (gameState.narrativeHistory.length > 0) {
      const restored = gameState.narrativeHistory.map((msg: GameMessage) => ({
        type: msg.type === 'gm' ? 'gm' as const : 'player' as const,
        content: msg.content,
        time: msg.time,
        actionOptions: msg.actionOptions,
        stateChanges: msg.stateChanges,
        playerInput: msg.playerInput,
      }));
      uiStore.restoreChatMessages(restored);

      // 恢复最后一条GM消息的选项
      const lastGmMsg = [...restored].reverse().find(m => m.type === 'gm');
      if (lastGmMsg?.actionOptions) {
        uiStore.setChatOptions(lastGmMsg.actionOptions);
      }

      await scrollToBottom();
    } else {
      // 新游戏，生成开局消息
      await generateOpeningMessage();
    }
  }

  // 处理从其他面板跳转过来的预填消息
  if (uiStore.pendingMessage) {
    userInput.value = uiStore.pendingMessage;
    uiStore.pendingMessage = '';
    await nextTick();
    autoResize();
    inputRef.value?.focus();
  }
});

// keep-alive激活时滚动到底部并处理预填消息
onActivated(async () => {
  await scrollToBottom();

  // 处理从其他面板跳转过来的预填消息
  if (uiStore.pendingMessage) {
    userInput.value = uiStore.pendingMessage;
    uiStore.pendingMessage = '';
    await nextTick();
    autoResize();
    inputRef.value?.focus();
  }
});

// 监听消息变化，自动滚动
watch(() => uiStore.chatMessages.length, () => {
  scrollToBottom();
});

// 监听流式文本变化，自动滚动
watch(() => uiStore.chatStreamText, () => {
  scrollToBottom();
});
</script>

<style scoped>
/* ===== 面板容器 ===== */
.main-game-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  background: var(--bg-secondary);
}

/* ===== 状态栏 ===== */
.status-bar {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 10px 20px;
  background: var(--bg-topbar);
  border-bottom: 1px solid var(--border-color);
  flex-shrink: 0;
  overflow-x: auto;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
}

.status-employees {
  margin-left: auto;
}

.status-icon {
  font-size: 16px;
}

.status-label {
  font-size: 12px;
  color: var(--text-muted);
}

.status-value {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.project-progress {
  font-size: 12px;
  color: var(--color-primary);
  margin-left: 4px;
}

.status-divider {
  width: 1px;
  height: 20px;
  background: var(--border-color);
}

/* ===== 消息区域 ===== */
.messages-area {
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  gap: 12px;
  color: var(--text-muted);
}

.empty-icon {
  font-size: 64px;
  opacity: 0.5;
}

.empty-text {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-secondary);
}

.empty-hint {
  font-size: 14px;
  animation: pulse 2s infinite;
}

/* ===== 消息项 ===== */
.message-item {
  display: flex;
  flex-direction: column;
  animation: slideUp 0.3s ease;
}

.message-gm {
  align-items: flex-start;
}

.message-player {
  align-items: flex-end;
}

.message-time {
  font-size: 11px;
  color: var(--text-muted);
  margin-bottom: 4px;
  padding: 0 8px;
}

/* ===== 消息气泡 ===== */
.message-bubble {
  max-width: 85%;
  padding: 12px 16px;
  border-radius: var(--radius-lg);
  position: relative;
}

.bubble-gm {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-top-left-radius: 4px;
}

.bubble-player {
  background: linear-gradient(135deg, rgba(0, 153, 204, 0.3), rgba(0, 212, 255, 0.15));
  border: 1px solid rgba(0, 212, 255, 0.3);
  border-top-right-radius: 4px;
}

/* 角色标识 */
.message-role {
  margin-bottom: 8px;
}

.role-badge {
  font-size: 12px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 10px;
}

.role-gm {
  background: rgba(0, 212, 255, 0.1);
  color: var(--color-primary);
  border: 1px solid rgba(0, 212, 255, 0.2);
}

.role-player {
  background: rgba(0, 255, 136, 0.1);
  color: var(--color-success);
  border: 1px solid rgba(0, 255, 136, 0.2);
}

/* 消息内容 */
.message-content {
  font-size: 14px;
  line-height: 1.7;
  color: var(--text-primary);
  word-break: break-word;
}

.message-content :deep(strong) {
  color: var(--color-primary);
  font-weight: 600;
}

.message-content :deep(em) {
  color: var(--text-secondary);
  font-style: italic;
}

.message-content :deep(code) {
  background: rgba(0, 212, 255, 0.1);
  padding: 1px 6px;
  border-radius: 4px;
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--color-primary-light);
}

.message-content :deep(blockquote) {
  border-left: 3px solid var(--color-primary);
  padding: 8px 12px;
  margin: 8px 0;
  background: rgba(0, 212, 255, 0.05);
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
  color: var(--text-secondary);
}

.message-content :deep(ul) {
  padding-left: 20px;
  margin: 8px 0;
}

.message-content :deep(li) {
  margin: 4px 0;
  color: var(--text-secondary);
}

.message-content :deep(h2),
.message-content :deep(h3),
.message-content :deep(h4) {
  margin: 12px 0 8px;
  color: var(--text-primary);
}

.message-content :deep(hr) {
  border: none;
  border-top: 1px solid var(--border-color);
  margin: 12px 0;
}

/* 流式输出 */
.streaming-content {
  min-height: 20px;
}

.thinking-text {
  color: var(--text-muted);
  animation: pulse 1.5s infinite;
}

.typing-cursor {
  color: var(--color-primary);
  animation: blink 0.8s infinite;
  font-weight: bold;
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}

/* ===== 状态变更卡片 ===== */
.state-changes-card {
  margin-top: 10px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  overflow: hidden;
  background: rgba(0, 0, 0, 0.2);
}

.state-changes-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  cursor: pointer;
  font-size: 12px;
  color: var(--text-secondary);
  background: rgba(0, 212, 255, 0.05);
  transition: background var(--transition-fast);
}

.state-changes-header:hover {
  background: rgba(0, 212, 255, 0.1);
}

.toggle-icon {
  font-size: 10px;
  color: var(--text-muted);
}

.state-changes-body {
  padding: 8px 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.change-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  padding: 3px 0;
  flex-wrap: wrap;
}

.change-action {
  padding: 1px 6px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  flex-shrink: 0;
}

.action-set {
  background: rgba(0, 212, 255, 0.15);
  color: var(--color-primary);
}

.action-add {
  background: rgba(0, 255, 136, 0.15);
  color: var(--color-success);
}

.action-push {
  background: rgba(255, 170, 0, 0.15);
  color: var(--color-warning);
}

.action-delete {
  background: rgba(255, 68, 68, 0.15);
  color: var(--color-danger);
}

.action-pull {
  background: rgba(255, 68, 68, 0.1);
  color: var(--color-danger);
}

.change-key {
  color: var(--text-secondary);
  font-family: var(--font-mono);
  font-size: 11px;
}

.change-arrow {
  color: var(--text-muted);
}

.change-value {
  color: var(--color-primary-light);
  font-family: var(--font-mono);
  font-size: 11px;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ===== 行动选项 ===== */
.action-options {
  padding: 12px 20px;
  border-top: 1px solid var(--border-color);
  background: var(--bg-card);
  flex-shrink: 0;
}

.options-label {
  font-size: 12px;
  color: var(--text-muted);
  margin-bottom: 8px;
}

.options-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.option-btn {
  flex: 1 1 auto;
  min-width: 120px;
  padding: 10px 16px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: 13px;
  font-family: var(--font-family);
  cursor: pointer;
  transition: all var(--transition-normal);
  text-align: center;
}

.option-btn:hover:not(:disabled) {
  background: var(--bg-card-hover);
  border-color: var(--color-primary);
  color: var(--color-primary);
  transform: translateY(-1px);
  box-shadow: 0 0 10px rgba(0, 212, 255, 0.1);
}

.option-btn:active:not(:disabled) {
  transform: translateY(0);
}

.option-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ===== 输入区域 ===== */
.input-area {
  padding: 12px 20px 16px;
  border-top: 1px solid var(--border-color);
  background: var(--bg-primary);
  flex-shrink: 0;
}

.input-wrapper {
  display: flex;
  gap: 10px;
  align-items: flex-end;
}

.message-input {
  flex: 1;
  padding: 10px 14px;
  background: var(--bg-input);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: 14px;
  font-family: var(--font-family);
  resize: none;
  outline: none;
  transition: border-color var(--transition-normal);
  max-height: 120px;
  line-height: 1.5;
}

.message-input:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px rgba(0, 212, 255, 0.1);
}

.message-input::placeholder {
  color: var(--text-muted);
}

.message-input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.send-btn {
  padding: 10px 24px;
  background: linear-gradient(135deg, var(--color-primary-dark), var(--color-primary));
  border: 1px solid var(--color-primary);
  border-radius: var(--radius-md);
  color: #0a0a0f;
  font-size: 14px;
  font-weight: 600;
  font-family: var(--font-family);
  cursor: pointer;
  transition: all var(--transition-normal);
  white-space: nowrap;
  min-width: 72px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.send-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-light));
  box-shadow: var(--shadow-glow);
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 加载动画 */
.loading-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #0a0a0f;
  animation: loadingPulse 1s infinite;
}

@keyframes loadingPulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.5); opacity: 0.5; }
}

/* 输入提示 */
.input-hints {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 6px;
  font-size: 11px;
  color: var(--text-muted);
}

.input-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.input-reroll-btn {
  padding: 2px 10px;
  font-size: 12px;
}

.generating-hint {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--color-warning);
}

.cancel-btn {
  padding: 2px 8px;
  background: transparent;
  border: 1px solid var(--color-danger);
  border-radius: var(--radius-sm);
  color: var(--color-danger);
  font-size: 11px;
  font-family: var(--font-family);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.cancel-btn:hover {
  background: rgba(255, 68, 68, 0.15);
}

/* ===== 重说按钮 ===== */
.reroll-bar {
  display: flex;
  justify-content: flex-end;
  margin-top: 8px;
  padding-top: 6px;
  border-top: 1px dashed var(--border-color);
}

.reroll-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 12px;
  background: transparent;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  color: var(--text-muted);
  font-size: 12px;
  font-family: var(--font-family);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.reroll-btn:hover {
  border-color: var(--color-warning);
  color: var(--color-warning);
  background: rgba(255, 170, 0, 0.08);
}

.reroll-btn:active {
  transform: scale(0.97);
}

/* ===== 编辑消息按钮 ===== */
.edit-msg-btn {
  position: absolute;
  top: 6px;
  left: -32px;
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  color: var(--text-muted);
  font-size: 13px;
  cursor: pointer;
  opacity: 0;
  transition: all var(--transition-fast);
  padding: 0;
  line-height: 1;
}

.message-bubble:hover .edit-msg-btn {
  opacity: 0.7;
}

.edit-msg-btn:hover {
  opacity: 1 !important;
  border-color: var(--color-primary);
  color: var(--color-primary);
  background: rgba(0, 212, 255, 0.1);
}

.edit-msg-btn:active {
  transform: scale(0.92);
}

/* ===== 响应式 ===== */
@media (max-width: 768px) {
  .status-bar {
    padding: 8px 12px;
    gap: 10px;
  }

  .status-label {
    display: none;
  }

  .messages-area {
    padding: 12px;
  }

  .message-bubble {
    max-width: 95%;
  }

  .action-options {
    padding: 10px 12px;
  }

  .option-btn {
    min-width: 80px;
    padding: 8px 12px;
    font-size: 12px;
  }

  .input-area {
    padding: 10px 12px 14px;
  }
}
</style>
