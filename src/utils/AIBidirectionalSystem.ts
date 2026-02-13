/**
 * AI双向系统
 * 核心游戏引擎 - 处理玩家行动、调用AI生成响应、解析并执行状态更新指令
 * 参考XianTu的AIBidirectionalSystem架构，为游戏开发商模拟器定制
 *
 * 集成记忆系统：
 * - 在processPlayerAction中检索相关长期记忆
 * - 在AI响应处理后更新记忆（短期→中期→长期）
 * - 定期触发记忆总结（中期→长期）
 */
import { set, get, unset, cloneDeep } from 'lodash';
import { aiService } from '@/services/aiService';
import type { ChatMessage } from '@/services/aiService';
import {
  assemblePrompt,
  assembleOpeningPrompt,
  assembleMemoryInject,
  assembleStateInject,
  PROMPT_IDS,
} from '@/services/defaultPrompts';
import { useGameStateStore } from '@/stores/gameStateStore';
import { parseJsonSmart } from '@/utils/jsonExtract';
import { vectorMemoryService } from '@/services/vectorMemoryService';
import type {
  SaveData,
  GMResponse,
  TavernCommand,
  GameMessage,
  StateChange,
  StateChangeLog,
} from '@/types/game.d';

// ===== 类型定义 =====

/** 处理玩家行动的选项 */
export interface ProcessActionOptions {
  /** 是否使用流式传输 */
  stream?: boolean;
  /** 流式传输回调 */
  onStreamChunk?: (chunk: string) => void;
  /** 生成ID（用于取消请求） */
  generationId?: string;
  /** 额外的系统提示词 */
  extraSystemPrompt?: string;
}

/** 处理结果 */
export interface ProcessResult {
  /** 是否成功 */
  success: boolean;
  /** GM响应数据 */
  response?: GMResponse;
  /** 状态变更日志 */
  stateChanges?: StateChangeLog;
  /** 错误信息 */
  error?: string;
  /** 原始AI响应文本 */
  rawResponse?: string;
}

// ===== 合法的key前缀 =====
const VALID_KEY_PREFIXES = ['元数据', '公司', '项目', '市场', '系统'];

// ===== SaveData路径到Store属性的映射 =====
const SAVE_TO_STORE_MAP: Record<string, string> = {
  '元数据': 'saveMeta',
  '元数据.时间': 'gameTime',
  '公司.基本信息': 'companyInfo',
  '公司.财务': 'finance',
  '公司.部门': 'departments',
  '公司.员工列表': 'employees',
  '公司.办公环境': 'officeEnvironment',
  '项目.当前项目': 'currentProjects',
  '项目.已发布游戏': 'publishedGames',
  '项目.重点关注': 'focusProject',
  '市场.平台数据': 'platformData',
  '市场.竞品公司': 'competitors',
  '市场.行业趋势': 'industryTrends',
  '市场.世界事件': 'worldEvents',
  '系统.配置': 'systemConfig',
  '系统.记忆': 'memory',
};

// ===== AI双向系统类 =====

class AIBidirectionalSystemClass {
  private static instance: AIBidirectionalSystemClass;
  private isProcessing = false;

  private memoryInitialized = false;

  private constructor() {
    console.log('[AIBidirectionalSystem] 🚀 系统初始化');
  }

  /**
   * 确保向量记忆服务已初始化
   */
  private async ensureMemoryInit(): Promise<void> {
    if (this.memoryInitialized) return;
    try {
      const store = useGameStateStore();
      const saveId = store.saveMeta?.存档ID || 'default';
      await vectorMemoryService.init(saveId);
      this.memoryInitialized = true;
      console.log('[AIBidirectionalSystem] 🧠 向量记忆服务已初始化');
    } catch (e) {
      console.warn('[AIBidirectionalSystem] ⚠️ 向量记忆初始化失败:', e);
    }
  }

  /**
   * 获取单例实例
   */
  static getInstance(): AIBidirectionalSystemClass {
    if (!AIBidirectionalSystemClass.instance) {
      AIBidirectionalSystemClass.instance = new AIBidirectionalSystemClass();
    }
    return AIBidirectionalSystemClass.instance;
  }

  /**
   * 是否正在处理中
   */
  get processing(): boolean {
    return this.isProcessing;
  }

  // ===== 核心方法 =====

  /**
   * 处理玩家行动
   * 完整流程：获取状态 → 组装提示词 → 调用AI → 解析响应 → 执行指令 → 更新Store
   * 
   * @param userMessage 玩家输入的行动文本
   * @param options 处理选项
   * @returns 处理结果
   */
  async processPlayerAction(
    userMessage: string,
    options: ProcessActionOptions = {},
  ): Promise<ProcessResult> {
    if (this.isProcessing) {
      return { success: false, error: '正在处理上一个请求，请稍候' };
    }

    this.isProcessing = true;
    const generationId = options.generationId || `action_${Date.now()}`;

    try {
      const store = useGameStateStore();

      // 0. 确保向量记忆服务已初始化
      await this.ensureMemoryInit();

      // 1. 获取当前存档数据
      const saveData = store.toSaveData();
      if (!saveData) {
        return { success: false, error: '游戏状态不完整，无法生成存档数据' };
      }

      // 2. 组装提示词
      const systemPrompt = this.buildSystemPrompt(saveData, options.extraSystemPrompt);
      const memoryInject = this.buildMemoryInject(store);

      // 2.5 向量记忆检索 - 根据玩家输入检索相关长期记忆
      let vectorMemoryInject = '';
      if (vectorMemoryService.isEnabled()) {
        try {
          const recentEvents = store.memory?.短期记忆?.slice(-3) || [];
          const searchResults = await vectorMemoryService.searchMemories(userMessage, {
            recentEvents,
          });
          vectorMemoryInject = vectorMemoryService.formatForAI(searchResults);
          if (vectorMemoryInject) {
            console.log(`[AIBidirectionalSystem] 🧠 检索到 ${searchResults.length} 条相关记忆`);
          }
        } catch (e) {
          console.warn('[AIBidirectionalSystem] ⚠️ 向量记忆检索失败:', e);
        }
      }

      // 3. 构建消息列表
      const messages: ChatMessage[] = [
        { role: 'system', content: systemPrompt },
      ];

      // 注入三层记忆
      if (memoryInject) {
        messages.push({ role: 'system', content: memoryInject });
      }

      // 注入向量检索到的相关长期记忆
      if (vectorMemoryInject) {
        messages.push({ role: 'system', content: vectorMemoryInject });
      }

      // 注入最近的对话历史（最多5条）
      const recentHistory = store.narrativeHistory.slice(-5);
      for (const msg of recentHistory) {
        messages.push({
          role: msg.role,
          content: msg.content,
        });
      }

      // 添加用户消息
      messages.push({ role: 'user', content: userMessage });

      // 4. 调用AI生成
      const shouldStream = options.stream ?? aiService.getConfig().streaming;
      let rawResponse: string;

      try {
        rawResponse = await aiService.generateRaw({
          ordered_prompts: messages,
          should_stream: shouldStream,
          generation_id: generationId,
          onStreamChunk: options.onStreamChunk,
        });
      } catch (apiError) {
        return {
          success: false,
          error: `AI生成失败: ${(apiError as Error).message}`,
        };
      }

      // 5. 解析AI响应
      let gmResponse: GMResponse;
      try {
        gmResponse = this.parseAIResponse(rawResponse);
      } catch (parseError) {
        console.error('[AIBidirectionalSystem] JSON解析失败:', parseError);
        // 解析失败时，将原始文本作为叙事内容
        gmResponse = {
          text: rawResponse,
          mid_term_memory: '',
          tavern_commands: [],
          action_options: ['继续', '查看公司状态', '查看市场动态', '管理员工', '自由输入'],
        };
      }

      // 6. 执行tavern_commands并更新状态
      const stateChanges = this.processGmResponse(gmResponse, saveData);

      // 7. 记录玩家消息到历史
      store.addNarrativeMessage({
        type: 'player',
        role: 'user',
        content: userMessage,
        time: store.formattedTime,
      });

      // 8. 记录GM响应到历史
      store.addNarrativeMessage({
        type: 'gm',
        role: 'assistant',
        content: gmResponse.text,
        time: store.formattedTime,
        actionOptions: gmResponse.action_options,
        stateChanges,
      });

      // 9. 更新记忆
      if (gmResponse.mid_term_memory) {
        store.addToShortTermMemory(gmResponse.mid_term_memory);

        // 9.1 同步写入向量记忆库
        if (vectorMemoryService.canAutoIndex()) {
          try {
            await vectorMemoryService.addMemory(gmResponse.mid_term_memory, 5);
          } catch (e) {
            console.warn('[AIBidirectionalSystem] ⚠️ 向量记忆写入失败:', e);
          }
        }
      }

      // 10. 检查并触发自动总结（中期→长期）
      if (store.memory) {
        try {
          const summaryResult = await vectorMemoryService.checkAndSummarize(store.memory.中期记忆);
          if (summaryResult.triggered && summaryResult.summaries && summaryResult.consumedCount) {
            // 将总结结果添加到长期记忆
            for (const summary of summaryResult.summaries) {
              store.memory.长期记忆.push(summary);
            }
            // 移除已总结的中期记忆
            store.memory.中期记忆 = store.memory.中期记忆.slice(summaryResult.consumedCount);
            console.log(
              `[AIBidirectionalSystem] 🧠 自动总结完成：${summaryResult.consumedCount}条中期 → ${summaryResult.summaries.length}条长期`,
            );
          }
        } catch (e) {
          console.warn('[AIBidirectionalSystem] ⚠️ 自动总结失败:', e);
        }
      }

      console.log('[AIBidirectionalSystem] ✅ 玩家行动处理完成');

      return {
        success: true,
        response: gmResponse,
        stateChanges,
        rawResponse,
      };
    } catch (error) {
      console.error('[AIBidirectionalSystem] ❌ 处理玩家行动失败:', error);
      return {
        success: false,
        error: `处理失败: ${(error as Error).message}`,
      };
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * 生成开局消息
   * 用于新游戏开始时生成第一条GM叙事
   * 
   * @param companyName 公司名称
   * @param founderName 创始人姓名
   * @param startingFund 启动资金
   * @param startYear 起始年份
   * @param difficulty 难度
   * @param options 处理选项
   * @returns 处理结果
   */
  async generateInitialMessage(
    companyName: string,
    founderName: string,
    startingFund: number,
    startYear: number,
    difficulty: string,
    options: ProcessActionOptions = {},
  ): Promise<ProcessResult> {
    if (this.isProcessing) {
      return { success: false, error: '正在处理上一个请求，请稍候' };
    }

    this.isProcessing = true;
    const generationId = options.generationId || `opening_${Date.now()}`;

    try {
      const store = useGameStateStore();

      // 初始化向量记忆服务
      await this.ensureMemoryInit();

      // 组装开局提示词
      const characterData = store.saveMeta?.角色数据;
      const { systemPrompt, userPrompt } = assembleOpeningPrompt(
        companyName,
        founderName,
        startingFund,
        startYear,
        difficulty,
        characterData ? { 属性: characterData.属性, 天赋: characterData.天赋 } : undefined,
      );

      // 构建消息列表
      const messages: ChatMessage[] = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ];

      // 调用AI
      const shouldStream = options.stream ?? aiService.getConfig().streaming;
      let rawResponse: string;

      try {
        rawResponse = await aiService.generateRaw({
          ordered_prompts: messages,
          should_stream: shouldStream,
          generation_id: generationId,
          onStreamChunk: options.onStreamChunk,
        });
      } catch (apiError) {
        return {
          success: false,
          error: `AI生成失败: ${(apiError as Error).message}`,
        };
      }

      // 解析响应
      let gmResponse: GMResponse;
      try {
        gmResponse = this.parseAIResponse(rawResponse);
      } catch {
        gmResponse = {
          text: rawResponse,
          mid_term_memory: '公司成立第一天',
          tavern_commands: [],
          action_options: ['查看办公室', '制定第一个游戏计划', '招聘员工', '了解市场行情', '自由输入'],
        };
      }

      // 获取存档数据用于执行指令
      const saveData = store.toSaveData();
      if (!saveData) {
        return { success: false, error: '游戏状态不完整' };
      }

      // 执行指令
      const stateChanges = this.processGmResponse(gmResponse, saveData);

      // 记录到历史
      store.addNarrativeMessage({
        type: 'gm',
        role: 'assistant',
        content: gmResponse.text,
        time: store.formattedTime,
        actionOptions: gmResponse.action_options,
        stateChanges,
      });

      // 更新记忆
      if (gmResponse.mid_term_memory) {
        store.addToShortTermMemory(gmResponse.mid_term_memory);

        // 同步写入向量记忆库
        if (vectorMemoryService.canAutoIndex()) {
          try {
            await vectorMemoryService.addMemory(gmResponse.mid_term_memory, 6);
          } catch (e) {
            console.warn('[AIBidirectionalSystem] ⚠️ 开局记忆向量写入失败:', e);
          }
        }
      }

      console.log('[AIBidirectionalSystem] ✅ 开局消息生成完成');

      return {
        success: true,
        response: gmResponse,
        stateChanges,
        rawResponse,
      };
    } catch (error) {
      console.error('[AIBidirectionalSystem] ❌ 生成开局消息失败:', error);
      return {
        success: false,
        error: `生成失败: ${(error as Error).message}`,
      };
    } finally {
      this.isProcessing = false;
    }
  }

  // ===== 响应处理 =====

  /**
   * 处理GM响应 - 执行tavern_commands并更新Pinia Store
   * 
   * @param response GM响应对象
   * @param saveData 当前存档数据（用于读取旧值）
   * @returns 状态变更日志
   */
  processGmResponse(response: GMResponse, saveData: SaveData): StateChangeLog {
    const changes: StateChange[] = [];
    const store = useGameStateStore();

    if (!response.tavern_commands || response.tavern_commands.length === 0) {
      return { changes, timestamp: new Date().toISOString() };
    }

    // 在存档数据的副本上执行指令
    const workingData = cloneDeep(saveData);

    for (const command of response.tavern_commands) {
      try {
        // 验证key前缀
        if (!this.isValidKey(command.key)) {
          console.warn(`[AIBidirectionalSystem] ⚠️ 无效的key前缀: ${command.key}`);
          continue;
        }

        // 记录旧值
        const oldValue = get(workingData, command.key);

        // 执行指令
        this.executeCommand(command, workingData);

        // 记录新值
        const newValue = get(workingData, command.key);

        changes.push({
          key: command.key,
          action: command.action,
          oldValue: oldValue !== undefined ? cloneDeep(oldValue) : undefined,
          newValue: newValue !== undefined ? cloneDeep(newValue) : undefined,
        });

        console.log(
          `[AIBidirectionalSystem] 📝 ${command.action}: ${command.key}`,
          `| 旧值:`, oldValue,
          `| 新值:`, newValue,
        );
      } catch (cmdError) {
        console.error(
          `[AIBidirectionalSystem] ❌ 执行指令失败:`,
          command,
          cmdError,
        );
      }
    }

    // 将更新后的数据同步到Store
    this.syncToStore(workingData, store);

    return {
      changes,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 解析AI的JSON响应
   * 支持多种格式的容错解析
   * 
   * @param rawResponse AI的原始响应文本
   * @returns 解析后的GMResponse
   */
  parseAIResponse(rawResponse: string): GMResponse {
    // 使用智能JSON解析
    const parsed = parseJsonSmart<Partial<GMResponse>>(rawResponse);

    // 验证和补全必要字段
    const response: GMResponse = {
      text: parsed.text || '（AI未返回叙事文本）',
      mid_term_memory: parsed.mid_term_memory || '',
      tavern_commands: Array.isArray(parsed.tavern_commands)
        ? this.validateCommands(parsed.tavern_commands)
        : [],
      action_options: Array.isArray(parsed.action_options) && parsed.action_options.length > 0
        ? parsed.action_options
        : ['继续', '查看公司状态', '查看市场动态', '管理员工', '自由输入'],
    };

    // 可选字段
    if (parsed.status_bar) {
      response.status_bar = parsed.status_bar;
    }

    return response;
  }

  // ===== 指令执行 =====

  /**
   * 执行单条tavern_command指令
   * 
   * @param command 指令对象
   * @param data 要操作的数据对象（会被直接修改）
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  executeCommand(command: TavernCommand, data: any): void {
    const { action, key, value } = command;

    switch (action) {
      case 'set': {
        // 设置值（覆盖）
        set(data, key, cloneDeep(value));
        break;
      }

      case 'add': {
        // 数值加减
        const currentVal = get(data, key);
        const numValue = typeof value === 'number' ? value : Number(value);
        if (isNaN(numValue)) {
          console.warn(`[executeCommand] add操作的value不是数字: ${value}`);
          break;
        }
        const currentNum = typeof currentVal === 'number' ? currentVal : 0;
        set(data, key, currentNum + numValue);
        break;
      }

      case 'push': {
        // 数组追加
        const arr = get(data, key);
        if (Array.isArray(arr)) {
          arr.push(cloneDeep(value));
        } else {
          // 如果目标不是数组，创建新数组
          set(data, key, [cloneDeep(value)]);
        }
        break;
      }

      case 'delete': {
        // 删除指定路径
        unset(data, key);
        break;
      }

      case 'pull': {
        // 从数组中移除匹配项
        const targetArr = get(data, key);
        if (Array.isArray(targetArr)) {
          const filtered = targetArr.filter((item: unknown) => {
            if (typeof item === 'string' && typeof value === 'string') {
              return item !== value;
            }
            if (typeof item === 'object' && typeof value === 'object' && item !== null && value !== null) {
              return JSON.stringify(item) !== JSON.stringify(value);
            }
            return item !== value;
          });
          set(data, key, filtered);
        }
        break;
      }

      default:
        console.warn(`[executeCommand] 未知的action类型: ${action}`);
    }
  }

  // ===== 内部辅助方法 =====

  /**
   * 构建系统提示词
   */
  private buildSystemPrompt(saveData: SaveData, extraPrompt?: string): string {
    // 精简存档数据（移除过长的历史记录）
    const compactSave = cloneDeep(saveData);
    if (compactSave.系统?.历史?.叙事) {
      // 只保留最近3条叙事
      compactSave.系统.历史.叙事 = compactSave.系统.历史.叙事.slice(-3);
    }

    const stateJson = JSON.stringify(compactSave, null, 2);
    let prompt = assemblePrompt(stateJson);

    if (extraPrompt) {
      prompt += `\n\n---\n\n# 额外指令\n${extraPrompt}`;
    }

    return prompt;
  }

  /**
   * 构建记忆注入内容
   */
  private buildMemoryInject(store: ReturnType<typeof useGameStateStore>): string | null {
    if (!store.memory) return null;

    const { 短期记忆, 中期记忆, 长期记忆 } = store.memory;

    // 如果所有记忆都为空，不注入
    if (短期记忆.length === 0 && 中期记忆.length === 0 && 长期记忆.length === 0) {
      return null;
    }

    return assembleMemoryInject(短期记忆, 中期记忆, 长期记忆);
  }

  /**
   * 验证key是否以合法前缀开头
   */
  private isValidKey(key: string): boolean {
    return VALID_KEY_PREFIXES.some((prefix) => key.startsWith(prefix));
  }

  /**
   * 验证和过滤tavern_commands
   */
  private validateCommands(commands: unknown[]): TavernCommand[] {
    return commands
      .filter((cmd): cmd is TavernCommand => {
        if (!cmd || typeof cmd !== 'object') return false;
        const c = cmd as Record<string, unknown>;
        if (!c.action || !c.key) return false;
        if (!['set', 'add', 'push', 'delete', 'pull'].includes(c.action as string)) return false;
        if (typeof c.key !== 'string') return false;
        return true;
      })
      .map((cmd) => ({
        action: cmd.action,
        key: cmd.key,
        value: cmd.value,
      }));
  }

  /**
   * 将更新后的SaveData同步到Pinia Store
   * 通过映射关系，将SaveData的各个部分更新到Store的对应属性
   */
  private syncToStore(
    data: SaveData,
    store: ReturnType<typeof useGameStateStore>,
  ): void {
    try {
      // 元数据和时间
      if (data.元数据) {
        store.saveMeta = cloneDeep(data.元数据);
        if (data.元数据.时间) {
          store.gameTime = cloneDeep(data.元数据.时间);
        }
      }

      // 公司模块
      if (data.公司) {
        if (data.公司.基本信息) store.companyInfo = cloneDeep(data.公司.基本信息);
        if (data.公司.财务) store.finance = cloneDeep(data.公司.财务);
        if (data.公司.部门) store.departments = cloneDeep(data.公司.部门);
        if (data.公司.员工列表) store.employees = cloneDeep(data.公司.员工列表);
        if (data.公司.办公环境) store.officeEnvironment = cloneDeep(data.公司.办公环境);
        if (data.公司.招聘) store.recruitment = cloneDeep(data.公司.招聘);
      }

      // 项目模块
      if (data.项目) {
        if (data.项目.当前项目) store.currentProjects = cloneDeep(data.项目.当前项目);
        if (data.项目.已发布游戏) store.publishedGames = cloneDeep(data.项目.已发布游戏);
        store.focusProject = data.项目.重点关注 ?? null;
      }

      // 市场模块
      if (data.市场) {
        if (data.市场.平台数据) store.platformData = cloneDeep(data.市场.平台数据);
        if (data.市场.竞品公司) store.competitors = cloneDeep(data.市场.竞品公司);
        if (data.市场.行业趋势) store.industryTrends = cloneDeep(data.市场.行业趋势);
        if (data.市场.世界事件) store.worldEvents = cloneDeep(data.市场.世界事件);
      }

      // 系统模块
      if (data.系统) {
        if (data.系统.配置) store.systemConfig = cloneDeep(data.系统.配置);
        if (data.系统.记忆) store.memory = cloneDeep(data.系统.记忆);
      }

      console.log('[AIBidirectionalSystem] ✅ Store同步完成');
    } catch (error) {
      console.error('[AIBidirectionalSystem] ❌ Store同步失败:', error);
    }
  }

  /**
   * 取消当前正在进行的AI请求
   */
  cancelCurrentRequest(): void {
    aiService.cancelAllRequests();
    this.isProcessing = false;
    console.log('[AIBidirectionalSystem] ⛔ 已取消当前请求');
  }
}

// ===== 单例导出 =====
export const AIBidirectionalSystem = AIBidirectionalSystemClass.getInstance();
export default AIBidirectionalSystem;
