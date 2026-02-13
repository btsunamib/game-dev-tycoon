/**
 * AI游戏开发商模拟器 - UI状态Store
 * 管理界面相关的状态，包括AI聊天状态
 */
import { defineStore } from 'pinia';
import type { StateChangeLog } from '@/types/game.d';

// ===== AI聊天消息接口 =====
export interface ChatLocalMessage {
  type: 'gm' | 'player';
  content: string;
  time: string;
  actionOptions?: string[];
  stateChanges?: StateChangeLog;
  /** 触发该AI回复的玩家输入（仅GM消息有） */
  playerInput?: string;
}

interface UIState {
  /** 当前激活的面板 */
  currentPanel: string;
  /** 侧边栏是否折叠 */
  sidebarCollapsed: boolean;
  /** 主题 */
  theme: 'dark' | 'light';
  /** 是否正在加载 */
  isLoading: boolean;
  /** 加载提示文字 */
  loadingText: string;
  /** 通知消息队列 */
  notifications: UINotification[];
  /** 预填消息（用于从其他面板跳转到主面板时预填AI对话） */
  pendingMessage: string;

  // ===== AI聊天相关状态 =====
  /** 聊天消息列表 */
  chatMessages: ChatLocalMessage[];
  /** 当前行动选项 */
  chatCurrentOptions: string[];
  /** AI是否正在生成 */
  chatIsGenerating: boolean;
  /** 流��输出的当前文本 */
  chatStreamText: string;
  /** 生成错误信息 */
  chatError: string;
  /** 聊天是否已初始化（防止重复生成开局消息） */
  chatInitialized: boolean;
}

export interface UINotification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  duration: number;
}

export const useUIStore = defineStore('ui', {
  state: (): UIState => ({
    currentPanel: 'GameMain',
    sidebarCollapsed: false,
    theme: 'dark',
    isLoading: false,
    loadingText: '',
    notifications: [],
    pendingMessage: '',

    // AI聊天状态
    chatMessages: [],
    chatCurrentOptions: [],
    chatIsGenerating: false,
    chatStreamText: '',
    chatError: '',
    chatInitialized: false,
  }),

  actions: {
    /** 设置当前面板 */
    setCurrentPanel(panel: string) {
      this.currentPanel = panel;
    },

    /** 切换侧边栏折叠状态 */
    toggleSidebar() {
      this.sidebarCollapsed = !this.sidebarCollapsed;
    },

    /** 设置侧边栏折叠状态 */
    setSidebarCollapsed(collapsed: boolean) {
      this.sidebarCollapsed = collapsed;
    },

    /** 设置主题 */
    setTheme(theme: 'dark' | 'light') {
      this.theme = theme;
    },

    /** 显示加载状态 */
    showLoading(text: string = '加载中...') {
      this.isLoading = true;
      this.loadingText = text;
    },

    /** 隐藏加载状态 */
    hideLoading() {
      this.isLoading = false;
      this.loadingText = '';
    },

    /** 添加通知 */
    addNotification(notification: Omit<UINotification, 'id'>) {
      const id = `notif_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      this.notifications.push({ ...notification, id });

      // 自动移除
      if (notification.duration > 0) {
        setTimeout(() => {
          this.removeNotification(id);
        }, notification.duration);
      }
    },

    /** 移除通知 */
    removeNotification(id: string) {
      const index = this.notifications.findIndex((n) => n.id === id);
      if (index !== -1) {
        this.notifications.splice(index, 1);
      }
    },

    /** 快捷通知方法 */
    notify(message: string, type: UINotification['type'] = 'info', duration: number = 3000) {
      this.addNotification({ type, message, duration });
    },

    // ===== AI聊天相关Actions =====

    /** 添加聊天消息 */
    addChatMessage(msg: ChatLocalMessage) {
      this.chatMessages.push(msg);
    },

    /** 设置AI生成状态 */
    setChatGenerating(val: boolean) {
      this.chatIsGenerating = val;
    },

    /** 设置流式文本 */
    setChatStreamText(text: string) {
      this.chatStreamText = text;
    },

    /** 追加流式文本 */
    appendChatStreamText(chunk: string) {
      this.chatStreamText += chunk;
    },

    /** 设置行动选项 */
    setChatOptions(options: string[]) {
      this.chatCurrentOptions = options;
    },

    /** 设置错误信息 */
    setChatError(err: string) {
      this.chatError = err;
    },

    /** 清除流式状态 */
    clearChatStream() {
      this.chatStreamText = '';
      this.chatError = '';
    },

    /** 标记聊天已初始化 */
    setChatInitialized(val: boolean) {
      this.chatInitialized = val;
    },

    /** 删除最后一条GM消息及其之后的所有消息 */
    removeLastGmMessage(): ChatLocalMessage | null {
      for (let i = this.chatMessages.length - 1; i >= 0; i--) {
        if (this.chatMessages[i].type === 'gm') {
          const removed = this.chatMessages[i];
          this.chatMessages.splice(i);
          return removed;
        }
      }
      return null;
    },

    /** 从指定索引处截断消息（删除该索引及之后的所有消息） */
    truncateMessagesFrom(index: number) {
      this.chatMessages.splice(index);
    },

    /** 从历史消息恢复聊天（加载存档时使用） */
    restoreChatMessages(msgs: ChatLocalMessage[]) {
      this.chatMessages = msgs;
      this.chatInitialized = true;
    },

    /** 重置聊天状态（新游戏时使用） */
    resetChat() {
      this.chatMessages = [];
      this.chatCurrentOptions = [];
      this.chatIsGenerating = false;
      this.chatStreamText = '';
      this.chatError = '';
      this.chatInitialized = false;
    },
  },
});
