/**
 * AI API调用服务
 * 支持双模式：酒馆模式（通过SillyTavern的预设和API）和网页模式（直连OpenAI兼容API）
 */
import axios, { AxiosError } from 'axios';
import { tavernBridge } from './tavernBridge';
import type { BridgeStatus } from './tavernBridge';

// ===== 类型定义 =====

/** 运行模式 */
export type AIMode = 'tavern' | 'custom';

/** API配置结构 */
export interface AIConfig {
  /** 运行模式：tavern=使用酒馆API，custom=直连自定义API */
  mode: AIMode;
  apiUrl: string;
  apiKey: string;
  model: string;
  streaming: boolean;
  // 独立总结API配置
  useSeparateSummaryApi: boolean;
  summaryApiUrl: string;
  summaryApiKey: string;
  summaryModel: string;
}

/** 聊天消息角色 */
export type MessageRole = 'system' | 'user' | 'assistant';

/** 聊天消息 */
export interface ChatMessage {
  role: MessageRole;
  content: string;
}

/** 注入提示词配置 */
export interface InjectPrompt {
  content: string;
  role: MessageRole;
  depth: number;       // 从消息列表末尾计算的插入深度
  position: string;    // 标识符，用于日志
}

/** 标准生成配置 */
export interface GenerateConfig {
  user_input: string;
  should_stream: boolean;
  generation_id: string;
  injects?: InjectPrompt[];
  onStreamChunk?: (chunk: string) => void;
}

/** 纯净生成配置 */
export interface GenerateRawConfig {
  ordered_prompts: ChatMessage[];
  should_stream: boolean;
  generation_id?: string;
  onStreamChunk?: (chunk: string) => void;
}

/** OpenAI API响应结构 */
interface OpenAIResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// ===== 常量 =====
const CONFIG_STORAGE_KEY = 'ai_config';
const DEFAULT_CONFIG: AIConfig = {
  mode: 'custom',
  apiUrl: '',
  apiKey: '',
  model: 'gpt-4',
  streaming: true,
  useSeparateSummaryApi: false,
  summaryApiUrl: '',
  summaryApiKey: '',
  summaryModel: '',
};
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

// ===== AI服务类 =====

class AIService {
  private config: AIConfig;
  private activeRequests: Map<string, AbortController> = new Map();
  private tavernInitialized = false;

  constructor() {
    this.config = this.loadConfig();
    // 延迟初始化酒馆桥接（等待 DOM 就绪）
    if (typeof window !== 'undefined') {
      setTimeout(() => this.initTavernBridge(), 100);
    }
  }

  /**
   * 初始化酒馆桥接
   * 自动检测环境并设置默认模式
   */
  private async initTavernBridge(): Promise<void> {
    if (this.tavernInitialized) return;
    this.tavernInitialized = true;

    try {
      const status = await tavernBridge.init();
      if (status.connected) {
        console.log(`[AIService] 🍺 检测到酒馆环境: ${status.message}`);
        // 如果用户没有手动设置过模式，自动切换到酒馆模式
        if (!localStorage.getItem(CONFIG_STORAGE_KEY)) {
          this.config.mode = 'tavern';
          console.log('[AIService] 🔄 自动切换到酒馆模式');
        }
      } else {
        console.log('[AIService] ℹ️ 未检测到酒馆环境，使用网页模式');
        if (this.config.mode === 'tavern') {
          console.warn('[AIService] ⚠️ 配置为酒馆模式但未检测到酒馆环境');
        }
      }
    } catch (e) {
      console.warn('[AIService] 酒馆桥接初始化失败:', e);
    }
  }

  // ===== 配置管理 =====

  /**
   * 从localStorage加载API配置
   */
  private loadConfig(): AIConfig {
    try {
      const stored = localStorage.getItem(CONFIG_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<AIConfig>;
        return { ...DEFAULT_CONFIG, ...parsed };
      }
    } catch (error) {
      console.warn('[AIService] 加载配置失败，使用默认配置:', error);
    }
    return { ...DEFAULT_CONFIG };
  }

  /**
   * 保存API配置到localStorage
   */
  saveConfig(config: Partial<AIConfig>): void {
    this.config = { ...this.config, ...config };
    try {
      localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(this.config));
      console.log('[AIService] ✅ 配置已保存');
    } catch (error) {
      console.error('[AIService] 保存配置失败:', error);
    }
  }

  /**
   * 获取当前配置（只读副本）
   */
  getConfig(): Readonly<AIConfig> {
    return { ...this.config };
  }

  /**
   * 检查API是否可用（配置是否完整）
   */
  async checkAvailability(): Promise<{ available: boolean; message: string }> {
    // 酒馆模式
    if (this.config.mode === 'tavern') {
      if (!tavernBridge.isConnected) {
        // 尝试重新初始化
        const status = await tavernBridge.init();
        if (status.connected) {
          return { available: true, message: `酒馆模式就绪（${status.message}）` };
        }
        return { available: false, message: '酒馆环境不可用，请在SillyTavern中打开或切换到网页模式' };
      }
      const status = await tavernBridge.getStatus();
      return {
        available: true,
        message: `酒馆模式就绪 | 预设: ${status.presetName || '未知'} | 模型: ${status.modelName || '未知'}`,
      };
    }

    // 网页模式（原有逻辑）
    if (!this.config.apiUrl) {
      return { available: false, message: 'API地址未配置' };
    }
    if (!this.config.apiKey) {
      return { available: false, message: 'API密钥未配置' };
    }
    if (!this.config.model) {
      return { available: false, message: '模型名称未配置' };
    }

    // 尝试发送一个简单请求验证连通性
    try {
      const url = this.buildUrl('/v1/models');
      await axios.get(url, {
        headers: this.buildHeaders(),
        timeout: 10000,
      });
      return { available: true, message: 'API连接正常' };
    } catch (error) {
      const axiosErr = error as AxiosError;
      if (axiosErr.response?.status === 401) {
        return { available: false, message: 'API密钥无效' };
      }
      if (axiosErr.code === 'ECONNREFUSED' || axiosErr.code === 'ERR_NETWORK') {
        return { available: false, message: 'API地址无法连接' };
      }
      if (axiosErr.response) {
        return { available: true, message: 'API连接正常（模型列表不可用）' };
      }
      return { available: false, message: `连接失败: ${axiosErr.message}` };
    }
  }

  /**
   * 获取酒馆桥接状态
   */
  async getTavernStatus(): Promise<BridgeStatus> {
    return tavernBridge.getStatus();
  }

  /**
   * 重新初始化酒馆桥接
   */
  async reinitTavern(): Promise<BridgeStatus> {
    this.tavernInitialized = false;
    return tavernBridge.init();
  }

  /**
   * 获取可用模型列表
   * 调用 /v1/models 端点
   */
  async getModelList(): Promise<string[]> {
    const url = this.buildUrl('/v1/models');
    const headers = this.buildHeaders();

    try {
      const response = await axios.get(url, {
        headers,
        timeout: 15000,
      });

      if (response.data?.data && Array.isArray(response.data.data)) {
        return response.data.data.map((m: { id: string }) => m.id).sort();
      }
      return [];
    } catch (error) {
      const axiosErr = error as AxiosError;
      console.error('[AIService] 获取模型列表失败:', axiosErr.message);
      throw new Error(`获取模型列表失败: ${axiosErr.message}`);
    }
  }

  /**
   * 获取总结API配置
   * 如果启用了独立总结API，返回独立配置；否则返回主API配置
   */
  getSummaryConfig(): { apiUrl: string; apiKey: string; model: string } {
    if (this.config.useSeparateSummaryApi && this.config.summaryApiUrl && this.config.summaryApiKey) {
      return {
        apiUrl: this.config.summaryApiUrl,
        apiKey: this.config.summaryApiKey,
        model: this.config.summaryModel || this.config.model,
      };
    }
    return {
      apiUrl: this.config.apiUrl,
      apiKey: this.config.apiKey,
      model: this.config.model,
    };
  }

  // ===== 核心生成方法 =====

  /**
   * 标准生成 - 带注入提示词
   * 将用户输入和注入提示词组装成消息列表后调用API
   */
  async generate(config: GenerateConfig): Promise<string> {
    const { user_input, should_stream, generation_id, injects, onStreamChunk } = config;

    // 构建消息列表
    const messages: ChatMessage[] = [];

    // 用户消息
    const userMessage: ChatMessage = { role: 'user', content: user_input };
    messages.push(userMessage);

    // 注入提示词（按depth排序后插入）
    if (injects && injects.length > 0) {
      const sortedInjects = [...injects].sort((a, b) => b.depth - a.depth);

      for (const inject of sortedInjects) {
        const insertIdx = Math.max(0, messages.length - inject.depth);
        messages.splice(insertIdx, 0, {
          role: inject.role,
          content: inject.content,
        });
      }
    }

    console.log(`[AIService] 📤 生成请求 [${generation_id}]，消息数: ${messages.length}，流式: ${should_stream}`);

    // 酒馆模式：通过酒馆桥接生成
    if (this.config.mode === 'tavern' && tavernBridge.isConnected) {
      return this.generateViaTavern(messages, should_stream, onStreamChunk);
    }

    return this.callAPI(messages, should_stream, generation_id, onStreamChunk);
  }

  /**
   * 纯净生成 - 自定义消息列表
   * 直接使用提供的消息列表调用API，不做任何修改
   */
  async generateRaw(config: GenerateRawConfig): Promise<string> {
    const { ordered_prompts, should_stream, generation_id, onStreamChunk } = config;

    const genId = generation_id || `raw_${Date.now()}`;
    console.log(`[AIService] 📤 纯净生成请求 [${genId}]，消息数: ${ordered_prompts.length}，流式: ${should_stream}，模式: ${this.config.mode}`);

    // 酒馆模式：通过酒馆桥接生成
    if (this.config.mode === 'tavern' && tavernBridge.isConnected) {
      return this.generateViaTavern(ordered_prompts, should_stream, onStreamChunk);
    }

    // 网页模式：直连API
    return this.callAPI(ordered_prompts, should_stream, genId, onStreamChunk);
  }

  /**
   * 通过酒馆桥接生成文本
   * 使用酒馆的预设和API配置
   */
  private async generateViaTavern(
    messages: ChatMessage[],
    stream: boolean,
    onStreamChunk?: (chunk: string) => void,
  ): Promise<string> {
    console.log(`[AIService] 🍺 通过酒馆桥接生成，消息数: ${messages.length}，流式: ${stream}`);

    try {
      return await tavernBridge.generate(messages, {
        stream,
        onStreamChunk,
        timeoutMs: 120000,
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error('[AIService] 酒馆生成失败:', msg);
      throw new Error(`酒馆API生成失败: ${msg}`);
    }
  }

  /**
   * 取消正在进行的请求
   */
  cancelRequest(generationId: string): void {
    const controller = this.activeRequests.get(generationId);
    if (controller) {
      controller.abort();
      this.activeRequests.delete(generationId);
      console.log(`[AIService] ⛔ 已取消请求 [${generationId}]`);
    }
  }

  /**
   * 取消所有正在进行的请求
   */
  cancelAllRequests(): void {
    // 取消直连API请求
    for (const [id, controller] of this.activeRequests) {
      controller.abort();
      console.log(`[AIService] ⛔ 已取消请求 [${id}]`);
    }
    this.activeRequests.clear();

    // 取消酒馆请求
    if (this.config.mode === 'tavern') {
      tavernBridge.cancelAllRequests();
    }
  }

  // ===== 内部方法 =====

  /**
   * 调用OpenAI兼容API（网页模式）
   */
  private async callAPI(
    messages: ChatMessage[],
    stream: boolean,
    generationId: string,
    onStreamChunk?: (chunk: string) => void,
  ): Promise<string> {
    const url = this.buildUrl('/v1/chat/completions');
    const headers = this.buildHeaders();
    const abortController = new AbortController();

    // 注册活跃请求
    this.activeRequests.set(generationId, abortController);

    const requestBody = {
      model: this.config.model,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      stream,
      temperature: 0.8,
      max_tokens: 4096,
    };

    try {
      if (stream && onStreamChunk) {
        return await this.handleStreamRequest(url, headers, requestBody, abortController, onStreamChunk);
      } else {
        return await this.handleNormalRequest(url, headers, { ...requestBody, stream: false }, abortController);
      }
    } finally {
      this.activeRequests.delete(generationId);
    }
  }

  /**
   * 处理普通（非流式）请求，带重试
   */
  private async handleNormalRequest(
    url: string,
    headers: Record<string, string>,
    body: Record<string, unknown>,
    abortController: AbortController,
  ): Promise<string> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const response = await axios.post<OpenAIResponse>(url, body, {
          headers,
          signal: abortController.signal,
          timeout: 120000,
        });

        const content = response.data?.choices?.[0]?.message?.content;
        if (!content) {
          throw new Error('API响应中没有content字段');
        }

        if (response.data.usage) {
          console.log(
            `[AIService] 📊 Token使用: 输入=${response.data.usage.prompt_tokens}, ` +
            `输出=${response.data.usage.completion_tokens}, ` +
            `总计=${response.data.usage.total_tokens}`
          );
        }

        return content;
      } catch (error) {
        if (axios.isCancel(error)) {
          throw new Error('请求已被取消');
        }

        lastError = error as Error;
        const axiosErr = error as AxiosError;

        if (axiosErr.response?.status === 401) {
          throw new Error('API密钥无效，请检查配置');
        }
        if (axiosErr.response?.status === 403) {
          throw new Error('API访问被拒绝');
        }
        if (axiosErr.response?.status === 404) {
          throw new Error(`模型 "${this.config.model}" 不存在或API端点错误`);
        }

        if (attempt < MAX_RETRIES) {
          const delay = RETRY_DELAY_MS * attempt;
          console.warn(`[AIService] ⚠️ 请求失败 (尝试 ${attempt}/${MAX_RETRIES})，${delay}ms后重试:`, axiosErr.message);
          await this.sleep(delay);
        }
      }
    }

    throw new Error(`API请求失败（已重试${MAX_RETRIES}次）: ${lastError?.message || '未知错误'}`);
  }

  /**
   * 处理流式请求（SSE格式）
   */
  private async handleStreamRequest(
    url: string,
    headers: Record<string, string>,
    body: Record<string, unknown>,
    abortController: AbortController,
    onStreamChunk: (chunk: string) => void,
  ): Promise<string> {
    let fullContent = '';

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: abortController.signal,
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(`API请求失败 (${response.status}): ${errorText || response.statusText}`);
      }

      if (!response.body) {
        throw new Error('响应体为空，无法进行流式读取');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmedLine = line.trim();

          if (!trimmedLine || trimmedLine.startsWith(':')) continue;

          if (trimmedLine.startsWith('data: ')) {
            const data = trimmedLine.slice(6).trim();

            if (data === '[DONE]') {
              continue;
            }

            try {
              const parsed = JSON.parse(data);
              const delta = parsed.choices?.[0]?.delta?.content;
              if (delta) {
                fullContent += delta;
                onStreamChunk(delta);
              }
            } catch {
              console.debug('[AIService] 跳过无法解析的SSE数据:', data.substring(0, 100));
            }
          }
        }
      }

      // 处理buffer中剩余的数据
      if (buffer.trim()) {
        const trimmedBuffer = buffer.trim();
        if (trimmedBuffer.startsWith('data: ') && trimmedBuffer.slice(6).trim() !== '[DONE]') {
          try {
            const parsed = JSON.parse(trimmedBuffer.slice(6).trim());
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              fullContent += delta;
              onStreamChunk(delta);
            }
          } catch {
            // 忽略
          }
        }
      }

      if (!fullContent) {
        throw new Error('流式响应未返回任何内容');
      }

      return fullContent;
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        throw new Error('流式请求已被取消');
      }
      throw error;
    }
  }

  /**
   * 构建完整的API URL
   */
  private buildUrl(path: string): string {
    let baseUrl = this.config.apiUrl.trim();
    while (baseUrl.endsWith('/')) {
      baseUrl = baseUrl.slice(0, -1);
    }
    if (path.startsWith('/v1') && baseUrl.endsWith('/v1')) {
      return baseUrl + path.slice(3);
    }
    return baseUrl + path;
  }

  /**
   * 构建请求头
   */
  private buildHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.config.apiKey}`,
    };
  }

  /**
   * 延迟工具函数
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// ===== 单例导出 =====
export const aiService = new AIService();
export default aiService;
