/**
 * SillyTavern 酒馆桥接层
 *
 * 负责检测酒馆环境、封装 ST_API / TavernHelper 调用，
 * 提供与 aiService 兼容的生成接口。
 *
 * 支持三种连接方式（按优先级）：
 * 1. 直接访问 window.ST_API（同源，st-api-wrapper 扩展）
 * 2. 直接访问 window.TavernHelper（仙途兼容模式）
 * 3. postMessage 代理（跨域 iframe 场景）
 */

// ===== 类型定义 =====

/** ST_API 的聊天消息格式 */
export interface STChatMessage {
  role: 'system' | 'user' | 'model';
  parts: Array<{ text: string }>;
}

/** ST_API prompt.generate 的输入 */
export interface STGenerateInput {
  writeToChat?: boolean;
  timeoutMs?: number;
  stream?: boolean;
  onToken?: (delta: string, full: string) => void;
  includeRequest?: boolean;
  preset?: { mode?: 'current' | 'disable'; inject?: unknown; replace?: unknown };
  worldBook?: { mode?: 'current' | 'disable'; inject?: unknown; replace?: unknown };
  chatHistory?: {
    replace?: STChatMessage[];
    inject?: Array<{
      depth: number;
      order: number;
      message: STChatMessage;
    }>;
  };
  extraBlocks?: Array<{
    role: string;
    content: string;
    name?: string;
    index?: number;
  }>;
}

/** ST_API prompt.generate 的输出 */
export interface STGenerateOutput {
  timestamp: number;
  characterId?: number;
  text: string;
  from: 'inChat' | 'background';
}

/** ST_API preset.get 的输出 */
export interface STPresetInfo {
  name: string;
  prompts: Array<{
    identifier: string;
    name: string;
    enabled: boolean;
    role: string;
    content: string;
    depth: number;
    order: number;
  }>;
  utilityPrompts: Record<string, unknown>;
  other: Record<string, unknown>;
}

/** 桥接连接类型 */
export type BridgeConnectionType = 'st_api' | 'tavern_helper' | 'postmessage' | 'none';

/** 桥接状态 */
export interface BridgeStatus {
  connected: boolean;
  connectionType: BridgeConnectionType;
  presetName?: string;
  modelName?: string;
  message: string;
}

/** 标准聊天消息（游戏内部格式） */
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/** 生成选项 */
export interface TavernGenerateOptions {
  stream?: boolean;
  onStreamChunk?: (chunk: string) => void;
  timeoutMs?: number;
}

// ===== postMessage 代理类型 =====

interface STApiCallRequest {
  type: 'ST_API_CALL';
  id: string;
  endpoint: string;
  params?: unknown;
}

interface STApiCallResponse<T = unknown> {
  id: string;
  data?: T;
  error?: string;
}

// ===== 酒馆桥接类 =====

class TavernBridgeClass {
  private stApi: any = null;
  private tavernHelper: any = null;
  private connectionType: BridgeConnectionType = 'none';
  private initialized = false;
  private postMessageTarget: Window | null = null;
  private postMessageOrigin = '*';
  private defaultTimeoutMs = 120000;

  constructor() {
    // 延迟初始化，等待 DOM 和酒馆环境就绪
  }

  // ===== 初始化与检测 =====

  /**
   * 初始化桥接连接
   * 检测酒馆环境并建立连接
   */
  async init(): Promise<BridgeStatus> {
    console.log('[TavernBridge] 🔍 开始检测酒馆环境...');

    // 1. 检测 ST_API（st-api-wrapper 扩展）
    const stApi = this.findSTApi();
    if (stApi) {
      this.stApi = stApi;
      this.connectionType = 'st_api';
      this.initialized = true;
      console.log('[TavernBridge] ✅ 检测到 ST_API（st-api-wrapper 扩展）');
      return this.getStatus();
    }

    // 2. 检测 TavernHelper（仙途兼容模式）
    const tavernHelper = this.findTavernHelper();
    if (tavernHelper) {
      this.tavernHelper = tavernHelper;
      this.connectionType = 'tavern_helper';
      this.initialized = true;
      console.log('[TavernBridge] ✅ 检测到 TavernHelper（仙途兼容模式）');
      return this.getStatus();
    }

    // 3. 检测 postMessage 代理（跨域 iframe）
    if (this.isInIframe()) {
      this.postMessageTarget = window.parent;
      this.connectionType = 'postmessage';
      this.initialized = true;
      console.log('[TavernBridge] ⚠️ 在 iframe 中运行，尝试 postMessage 代理模式');

      // 尝试 ping 测试连通性
      try {
        await this.postMessageCall('preset.get', {}, 5000);
        console.log('[TavernBridge] ✅ postMessage 代理连接成功');
        return this.getStatus();
      } catch {
        console.warn('[TavernBridge] ❌ postMessage 代理连接失败，可能未配置桥接页面');
        this.connectionType = 'none';
        this.initialized = false;
      }
    }

    // 4. 无酒馆环境
    this.connectionType = 'none';
    this.initialized = false;
    console.log('[TavernBridge] ℹ️ 未检测到酒馆环境，将使用网页模式');
    return this.getStatus();
  }

  /**
   * 获取当前桥接状态
   */
  async getStatus(): Promise<BridgeStatus> {
    if (!this.initialized || this.connectionType === 'none') {
      return {
        connected: false,
        connectionType: 'none',
        message: '未连接到酒馆环境',
      };
    }

    const status: BridgeStatus = {
      connected: true,
      connectionType: this.connectionType,
      message: `已连接（${this.getConnectionTypeLabel()}）`,
    };

    // 尝试获取预设信息
    try {
      const preset = await this.getPreset();
      if (preset) {
        status.presetName = preset.name;
        // 尝试从 other 中提取模型名
        const other = preset.other as Record<string, unknown>;
        status.modelName = (other?.custom_model as string)
          || (other?.openai_model as string)
          || (other?.claude_model as string)
          || (other?.google_model as string)
          || '未知';
      }
    } catch (e) {
      console.warn('[TavernBridge] 获取预设信息失败:', e);
    }

    return status;
  }

  /**
   * 是否已连接到酒馆
   */
  get isConnected(): boolean {
    return this.initialized && this.connectionType !== 'none';
  }

  /**
   * 获取连接类型标签
   */
  private getConnectionTypeLabel(): string {
    switch (this.connectionType) {
      case 'st_api': return 'ST_API 直连';
      case 'tavern_helper': return 'TavernHelper';
      case 'postmessage': return 'postMessage 代理';
      default: return '未连接';
    }
  }

  // ===== 核心生成方法 =====

  /**
   * 使用酒馆 API 生成文本
   *
   * 将游戏的 messages 通过 chatHistory.replace 发送给酒馆，
   * 酒馆会应用当前预设的采样参数后调用 AI。
   *
   * @param messages 游戏内部格式的消息列表
   * @param options 生成选项
   * @returns AI 生成的文本
   */
  async generate(
    messages: ChatMessage[],
    options: TavernGenerateOptions = {},
  ): Promise<string> {
    if (!this.isConnected) {
      throw new Error('未连接到酒馆环境，请先调用 init()');
    }

    const timeoutMs = options.timeoutMs || this.defaultTimeoutMs;

    // 根据连接类型分发
    switch (this.connectionType) {
      case 'st_api':
        return this.generateViaSTApi(messages, options, timeoutMs);
      case 'tavern_helper':
        return this.generateViaTavernHelper(messages, options);
      case 'postmessage':
        return this.generateViaPostMessage(messages, options, timeoutMs);
      default:
        throw new Error('无可用的酒馆连接');
    }
  }

  /**
   * 获取当前预设信息
   */
  async getPreset(): Promise<STPresetInfo | null> {
    if (!this.isConnected) return null;

    try {
      switch (this.connectionType) {
        case 'st_api': {
          const result = await this.stApi.preset.get();
          return result?.preset || null;
        }
        case 'tavern_helper': {
          // TavernHelper 可能不支持获取预设
          return null;
        }
        case 'postmessage': {
          const result = await this.postMessageCall<{ preset: STPresetInfo }>('preset.get', {});
          return result?.preset || null;
        }
        default:
          return null;
      }
    } catch (e) {
      console.warn('[TavernBridge] 获取预设失败:', e);
      return null;
    }
  }

  // ===== ST_API 直连实现 =====

  private async generateViaSTApi(
    messages: ChatMessage[],
    options: TavernGenerateOptions,
    timeoutMs: number,
  ): Promise<string> {
    const stMessages = this.toSTMessages(messages);

    const generateInput: STGenerateInput = {
      writeToChat: false,
      timeoutMs,
      stream: options.stream ?? false,
      chatHistory: {
        replace: stMessages,
      },
      // 使用当前预设（采样参数）
      preset: { mode: 'current' },
      // 禁用世界书（游戏有自己的状态注入）
      worldBook: { mode: 'disable' },
    };

    // 流式回调
    if (options.stream && options.onStreamChunk) {
      let lastFull = '';
      generateInput.onToken = (delta: string, full: string) => {
        // ST_API ��� onToken 提供 delta 和 full
        // 我们只需要 delta 传给上层
        if (delta) {
          options.onStreamChunk!(delta);
        } else if (full && full.length > lastFull.length) {
          // 某些情况下 delta 可能为空，从 full 计算
          const newContent = full.slice(lastFull.length);
          if (newContent) {
            options.onStreamChunk!(newContent);
          }
        }
        lastFull = full;
      };
    }

    console.log(`[TavernBridge] 📤 ST_API 生成请求，消息数: ${stMessages.length}，流式: ${options.stream}`);

    try {
      const result: STGenerateOutput = await this.stApi.prompt.generate(generateInput);
      console.log(`[TavernBridge] 📥 ST_API 生成完成，文本长度: ${result.text?.length || 0}`);
      return result.text || '';
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error('[TavernBridge] ❌ ST_API 生成失败:', msg);
      throw new Error(`酒馆 API 生成失败: ${msg}`);
    }
  }

  // ===== TavernHelper 实现 =====

  private async generateViaTavernHelper(
    messages: ChatMessage[],
    options: TavernGenerateOptions,
  ): Promise<string> {
    // TavernHelper 使用 generateRaw 方法
    // 参考仙途的调用方式
    const generateOptions = {
      ordered_prompts: messages.map(m => ({
        role: m.role,
        content: m.content,
      })),
      should_stream: options.stream ?? false,
      onStreamChunk: options.onStreamChunk,
    };

    console.log(`[TavernBridge] 📤 TavernHelper 生成请求，消息数: ${messages.length}`);

    try {
      const result = await this.tavernHelper.generateRaw(generateOptions);
      const text = typeof result === 'string' ? result : String(result);
      console.log(`[TavernBridge] 📥 TavernHelper 生成完成，文本长度: ${text.length}`);
      return text;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error('[TavernBridge] ❌ TavernHelper 生成失败:', msg);
      throw new Error(`酒馆 TavernHelper 生成失败: ${msg}`);
    }
  }

  // ===== postMessage 代理实现 =====

  private async generateViaPostMessage(
    messages: ChatMessage[],
    options: TavernGenerateOptions,
    timeoutMs: number,
  ): Promise<string> {
    const stMessages = this.toSTMessages(messages);

    // 注意：postMessage 模式不支持流式回调（onToken 无法序列化）
    // 只能等待完整结果
    if (options.stream) {
      console.warn('[TavernBridge] ⚠️ postMessage 模式不支持流式传输，将使用非流式���式');
    }

    const params: STGenerateInput = {
      writeToChat: false,
      timeoutMs,
      stream: false, // postMessage 不支持流式
      chatHistory: {
        replace: stMessages,
      },
      preset: { mode: 'current' },
      worldBook: { mode: 'disable' },
    };

    console.log(`[TavernBridge] 📤 postMessage 生成请求，消息数: ${stMessages.length}`);

    try {
      const result = await this.postMessageCall<STGenerateOutput>(
        'prompt.generate',
        params,
        timeoutMs,
      );
      const text = result?.text || '';
      console.log(`[TavernBridge] 📥 postMessage 生成完成，文本长度: ${text.length}`);
      return text;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error('[TavernBridge] ❌ postMessage 生成失败:', msg);
      throw new Error(`酒馆 postMessage 生成失败: ${msg}`);
    }
  }

  // ===== 工具方法 =====

  /**
   * 将游戏内部消息格式转换为 ST_API 消息格式
   */
  private toSTMessages(messages: ChatMessage[]): STChatMessage[] {
    return messages.map(msg => ({
      role: msg.role === 'assistant' ? 'model' as const : msg.role,
      parts: [{ text: msg.content }],
    }));
  }

  /**
   * 查找 ST_API 对象
   * 在当前窗��和父窗口中查找
   */
  private findSTApi(): any {
    // 当前窗口
    if (typeof window !== 'undefined' && (window as any).ST_API) {
      return (window as any).ST_API;
    }

    // 尝试 top 窗口
    try {
      if (window.top && window.top !== window && (window.top as any).ST_API) {
        return (window.top as any).ST_API;
      }
    } catch {
      // 跨域访问失败
    }

    // 逐层向上查找（最多5层）
    let currentWindow: Window = window;
    for (let i = 0; i < 5; i++) {
      try {
        if (currentWindow.parent && currentWindow.parent !== currentWindow) {
          if ((currentWindow.parent as any).ST_API) {
            return (currentWindow.parent as any).ST_API;
          }
          currentWindow = currentWindow.parent;
        } else {
          break;
        }
      } catch {
        break;
      }
    }

    return null;
  }

  /**
   * 查找 TavernHelper 对象
   * 仙途兼容模式
   */
  private findTavernHelper(): any {
    if (typeof window === 'undefined') return null;

    // 当前窗口
    if ((window as any).TavernHelper) {
      return (window as any).TavernHelper;
    }

    // 尝试 top 窗口
    try {
      if (window.top && window.top !== window && (window.top as any).TavernHelper) {
        return (window.top as any).TavernHelper;
      }
    } catch {
      // 跨域
    }

    // 逐层向上查找
    let currentWindow: Window = window;
    for (let i = 0; i < 5; i++) {
      try {
        if (currentWindow.parent && currentWindow.parent !== currentWindow) {
          if ((currentWindow.parent as any).TavernHelper) {
            return (currentWindow.parent as any).TavernHelper;
          }
          currentWindow = currentWindow.parent;
        } else {
          break;
        }
      } catch {
        break;
      }
    }

    return null;
  }

  /**
   * 检测是否在 iframe 中运行
   */
  private isInIframe(): boolean {
    try {
      return window.self !== window.top;
    } catch {
      // 跨域时 window.top 访问会抛异常，说明确实在 iframe 中
      return true;
    }
  }

  /**
   * 通过 postMessage 调用 ST_API
   */
  private async postMessageCall<T = unknown>(
    endpoint: string,
    params: unknown,
    timeoutMs?: number,
  ): Promise<T> {
    if (!this.postMessageTarget) {
      throw new Error('postMessage 目标窗口未设置');
    }

    const id = `st_api_${endpoint}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const request: STApiCallRequest = {
      type: 'ST_API_CALL',
      id,
      endpoint,
      params,
    };

    return new Promise<T>((resolve, reject) => {
      const timeout = timeoutMs || this.defaultTimeoutMs;
      const timer = window.setTimeout(() => {
        window.removeEventListener('message', onMessage);
        reject(new Error(`ST_API_CALL 超时: ${endpoint} (${timeout}ms)`));
      }, timeout);

      function onMessage(event: MessageEvent) {
        const data = event.data as STApiCallResponse<T> | undefined;
        if (!data || data.id !== id) return;

        window.clearTimeout(timer);
        window.removeEventListener('message', onMessage);

        if (data.error) {
          reject(new Error(data.error));
        } else {
          resolve(data.data as T);
        }
      }

      window.addEventListener('message', onMessage);
      this.postMessageTarget!.postMessage(request, this.postMessageOrigin);
    });
  }

  /**
   * 取消所有正在进行的请求
   */
  cancelAllRequests(): void {
    console.log('[TavernBridge] ⛔ 取消所有请求');

    // ST_API 模式：目前 ST_API 没有直接的取消方法
    // TavernHelper 模式：尝试调用取消方法
    if (this.tavernHelper) {
      try {
        if (typeof this.tavernHelper.abortGeneration === 'function') {
          this.tavernHelper.abortGeneration();
        }
        if (typeof this.tavernHelper.stopGeneration === 'function') {
          this.tavernHelper.stopGeneration();
        }
      } catch (e) {
        console.warn('[TavernBridge] 取消请求失败:', e);
      }
    }
  }
}

// ===== 单例导出 =====
export const tavernBridge = new TavernBridgeClass();
export default tavernBridge;
