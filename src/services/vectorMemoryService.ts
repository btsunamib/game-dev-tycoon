/**
 * 向量记忆服务
 * 移植自XianTu的vectorMemoryService，适配游戏开发商模拟器
 *
 * 核心功能：
 * - 三层记忆架构：短期 → 中期 → 长期
 * - AI驱动的记忆总结（中期→长期，使用总结API配置）
 * - 本地TF-IDF向量化 + 可选远程Embedding
 * - IndexedDB持久化存储
 * - 标签提取 + 向量相似度混合检索
 */

import { openDB, type IDBPDatabase } from 'idb';
import axios from 'axios';
import { aiService } from '@/services/aiService';
import {
  createEmbeddings,
  normalizeBaseUrl,
  normalizeToUnitVector,
} from '@/services/embeddingService';
import type {
  VectorMemoryEntry,
  MemorySearchResult,
  VectorMemoryConfig,
  MemoryCategory,
  MemoryStats,
  MemorySummaryConfig,
  EmbeddingRequestConfig,
} from '@/types/memory';

// ============ 默认配置 ============

const DEFAULT_CONFIG: VectorMemoryConfig = {
  enabled: true,
  maxRetrieveCount: 10,
  minSimilarity: 0.3,
  tagWeight: 0.4,
  vectorWeight: 0.6,
};

const DEFAULT_SUMMARY_CONFIG: MemorySummaryConfig = {
  midTermThreshold: 15,
  batchSize: 8,
  autoSummarize: true,
};

// ============ 游戏开发商关键词词典 ============

/** 游戏开发相关关键词 */
const GAMEDEV_KEYWORDS = new Set([
  // 开发阶段
  '立项', '预制作', '制作', '打磨', '发布', '上线', '更新', '维护',
  'Alpha', 'Beta', 'EA', '正式版', '补丁', 'DLC', '热修复',
  // 开发活动
  '开发', '编程', '美术', '策划', '测试', '优化', 'Bug', '修复',
  '设计', '原型', '迭代', '重构', '联调', '集成', '部署',
  // 游戏类型
  'RPG', 'FPS', 'MOBA', '策略', '模拟', '冒险', '动作', '解谜',
  '沙盒', '生存', '恐怖', '竞速', '格斗', '音游', '卡牌',
  // 公司管理
  '招聘', '离职', '加班', '薪资', '晋升', '培训', '团建',
  '管理', '决策', '会议', '汇报', '考核', '激励',
  // 财务
  '资金', '预算', '收入', '支出', '利润', '亏损', '融资',
  '投资', '贷款', '成本', '营收', '分红', '估值',
  // 市场
  '宣发', '营销', '推广', '广告', '预告', '试玩', '展会',
  '媒体', '评测', '口碑', '销量', '热度', '下载量',
  // 社区
  '玩家', '社区', '反馈', '评论', '差评', '好评', '退款',
  '直播', '二创', 'UP主', '主播', '粉丝', '水军',
  // 平台
  'Steam', 'WeGame', 'Epic', 'PS', 'Xbox', 'Switch', '手游',
  // 竞品
  '竞品', '对手', '同行', '合作', '收购', '并购',
  // 事件
  '危机', '舆论', '���号', '审核', '政策', '趋势', '风口',
]);

/** 停用词 */
const STOP_WORDS = new Set([
  '的', '了', '是', '在', '有', '和', '与', '或', '也', '都', '就', '着', '被', '让',
  '把', '给', '从', '到', '向', '往', '对', '于', '为', '而', '但', '却', '因', '所',
  '这', '那', '它', '他', '她', '我', '你', '们', '自', '其', '此', '彼',
  '一', '个', '些', '很', '更', '最', '非', '不', '无', '没', '未',
]);

// ============ 文本处理工具 ============

/**
 * 简单中文分词（基于词典 + 模式匹配）
 */
function tokenize(text: string): string[] {
  const tokens: string[] = [];

  // 提取词典中的关键词
  for (const keyword of GAMEDEV_KEYWORDS) {
    if (text.includes(keyword)) tokens.push(keyword);
  }

  // 提取2-4字的中文词组（可能是人名、公司名、游戏名等）
  const wordPattern = /[\u4e00-\u9fa5]{2,4}/g;
  let match;
  while ((match = wordPattern.exec(text)) !== null) {
    const word = match[0];
    if (!STOP_WORDS.has(word) && !GAMEDEV_KEYWORDS.has(word)) {
      tokens.push(word);
    }
  }

  // 提取英文词组（可能是游戏名、技术术语等）
  const engPattern = /[A-Za-z][A-Za-z0-9]{2,}/g;
  while ((match = engPattern.exec(text)) !== null) {
    const word = match[0];
    if (!GAMEDEV_KEYWORDS.has(word)) {
      tokens.push(word);
    }
  }

  return [...new Set(tokens)];
}

/**
 * 从记忆内容中提取标签
 */
export function extractTags(content: string): string[] {
  const tags: string[] = [];
  const tokens = tokenize(content);

  // 优先添加游戏开发关键词
  for (const token of tokens) {
    if (GAMEDEV_KEYWORDS.has(token)) {
      tags.push(token);
    }
  }

  // 添加可能的专有名词（人名、公司名、游戏名等）
  const namePattern = /[\u4e00-\u9fa5]{2,4}/g;
  let match;
  while ((match = namePattern.exec(content)) !== null) {
    const word = match[0];
    if (!STOP_WORDS.has(word) && !GAMEDEV_KEYWORDS.has(word)) {
      if (tags.length < 15) {
        tags.push(word);
      }
    }
  }

  return [...new Set(tags)].slice(0, 20);
}

/**
 * 推断记忆分类
 */
export function inferCategory(content: string, tags: string[]): MemoryCategory {
  const devKeywords = ['开发', '编程', '美术', '策划', '测试', '优化', 'Bug', '修复', '立项', '制作', 'Alpha', 'Beta'];
  const financeKeywords = ['资金', '预算', '收入', '支出', '利润', '亏损', '融资', '投资', '贷款', '成本'];
  const hrKeywords = ['招聘', '离职', '加班', '薪资', '晋升', '培训', '团建', '员工', '满意度'];
  const marketKeywords = ['宣发', '营销', '推广', '广告', '销量', '热度', '评测', '口碑', '媒体'];
  const competitionKeywords = ['竞品', '对手', '同行', '合作', '收购', '并购'];
  const communityKeywords = ['玩家', '社区', '反馈', '评论', '差评', '好评', '退款', '直播', '二创'];
  const eventKeywords = ['危机', '舆论', '版号', '审核', '政策', '趋势', '事件'];

  const check = (keywords: string[]) =>
    keywords.some(k => content.includes(k) || tags.includes(k));

  if (check(devKeywords)) return 'development';
  if (check(financeKeywords)) return 'finance';
  if (check(hrKeywords)) return 'hr';
  if (check(marketKeywords)) return 'marketing';
  if (check(competitionKeywords)) return 'competition';
  if (check(communityKeywords)) return 'community';
  if (check(eventKeywords)) return 'event';
  return 'other';
}

// ============ 向量化 ============

/**
 * 简单的TF-IDF向量化器
 * 使用预定义词汇表，无需全局IDF统计
 */
class SimpleVectorizer {
  private vocabulary: string[];
  private wordToIndex: Map<string, number>;

  constructor() {
    this.vocabulary = Array.from(GAMEDEV_KEYWORDS);
    this.wordToIndex = new Map();
    this.vocabulary.forEach((word, index) => {
      this.wordToIndex.set(word, index);
    });
  }

  /**
   * 将文本转换为向��
   */
  vectorize(text: string): number[] {
    const tokens = tokenize(text);
    const vector = new Array(this.vocabulary.length).fill(0);

    const wordCount = new Map<string, number>();
    for (const token of tokens) {
      wordCount.set(token, (wordCount.get(token) || 0) + 1);
    }

    for (const [word, count] of wordCount) {
      const index = this.wordToIndex.get(word);
      if (index !== undefined) {
        vector[index] = count;
      }
    }

    // L2归一化
    const norm = Math.sqrt(vector.reduce((sum: number, val: number) => sum + val * val, 0));
    if (norm > 0) {
      for (let i = 0; i < vector.length; i++) {
        vector[i] /= norm;
      }
    }

    return vector;
  }

  /**
   * 计算余弦相似度（已归一化向量，点积即余弦相似度）
   */
  cosineSimilarity(vec1: number[], vec2: number[]): number {
    if (vec1.length !== vec2.length) return 0;
    let dotProduct = 0;
    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
    }
    return dotProduct;
  }
}

// ============ 哈希工具 ============

function fnv1a32(input: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

function stableMemoryId(content: string): string {
  const normalized = (content || '').trim().replace(/\s+/g, ' ');
  return `mem_${fnv1a32(normalized)}`;
}

// ============ 向量记忆服务类 ============

class VectorMemoryService {
  private db: IDBPDatabase | null = null;
  private vectorizer: SimpleVectorizer;
  private config: VectorMemoryConfig;
  private summaryConfig: MemorySummaryConfig;
  private saveSlot: string = '';
  private isSummarizing = false;

  constructor() {
    this.vectorizer = new SimpleVectorizer();
    this.config = { ...DEFAULT_CONFIG };
    this.summaryConfig = { ...DEFAULT_SUMMARY_CONFIG };
    this.loadConfig();
  }

  // ============ 初始化 ============

  /**
   * 初始化IndexedDB数据库
   */
  async init(saveSlot: string): Promise<void> {
    this.saveSlot = saveSlot;
    const dbName = `gamedev-memory-${saveSlot}`;

    this.db = await openDB(dbName, 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('memories')) {
          const store = db.createObjectStore('memories', { keyPath: 'id' });
          store.createIndex('tags', 'tags', { multiEntry: true });
          store.createIndex('category', 'category');
          store.createIndex('timestamp', 'timestamp');
        }
      },
    });

    console.log(`[向量记忆] 初始化完成: ${dbName}`);
  }

  // ============ 配置管理 ============

  private loadConfig(): void {
    try {
      const saved = localStorage.getItem('gamedev_vectorMemoryConfig');
      if (saved) {
        this.config = { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
      }
      const summSaved = localStorage.getItem('gamedev_memorySummaryConfig');
      if (summSaved) {
        this.summaryConfig = { ...DEFAULT_SUMMARY_CONFIG, ...JSON.parse(summSaved) };
      }
    } catch (e) {
      console.warn('[向量记忆] 加载配置失败，使用默认配置');
    }
  }

  saveConfig(config: Partial<VectorMemoryConfig>): void {
    this.config = { ...this.config, ...config };
    localStorage.setItem('gamedev_vectorMemoryConfig', JSON.stringify(this.config));
  }

  saveSummaryConfig(config: Partial<MemorySummaryConfig>): void {
    this.summaryConfig = { ...this.summaryConfig, ...config };
    localStorage.setItem('gamedev_memorySummaryConfig', JSON.stringify(this.summaryConfig));
  }

  getConfig(): VectorMemoryConfig {
    return { ...this.config };
  }

  getSummaryConfig(): MemorySummaryConfig {
    return { ...this.summaryConfig };
  }

  isEnabled(): boolean {
    return this.config.enabled;
  }

  /** 是否允许自动写入向量�� */
  canAutoIndex(): boolean {
    return !!this.db && this.config.enabled;
  }

  // ============ Embedding配置 ============

  /**
   * 获取Embedding API配置
   * 使用aiService的总结API配置作为Embedding配置
   */
  private getEmbeddingRequestConfig(): EmbeddingRequestConfig | null {
    try {
      const summaryConfig = aiService.getSummaryConfig();
      if (!summaryConfig.apiUrl || !summaryConfig.apiKey) return null;

      // 检查是否有专门的embedding配置
      const embeddingConfig = localStorage.getItem('gamedev_embeddingConfig');
      if (embeddingConfig) {
        const parsed = JSON.parse(embeddingConfig);
        if (parsed.url && parsed.apiKey && parsed.model) {
          return {
            url: normalizeBaseUrl(parsed.url),
            apiKey: parsed.apiKey,
            model: parsed.model,
          };
        }
      }

      return null; // 默认不使用Embedding，使用本地TF-IDF
    } catch {
      return null;
    }
  }

  /**
   * 获取Embedding状态
   */
  getEmbeddingStatus(): { available: boolean; model?: string; reason?: string } {
    const cfg = this.getEmbeddingRequestConfig();
    if (cfg) return { available: true, model: cfg.model };
    return {
      available: false,
      reason: '未配置Embedding API，使用本地TF-IDF向量化（功能���常，精度略低）',
    };
  }

  /**
   * 保存Embedding配置
   */
  saveEmbeddingConfig(config: { url: string; apiKey: string; model: string } | null): void {
    if (config) {
      localStorage.setItem('gamedev_embeddingConfig', JSON.stringify(config));
    } else {
      localStorage.removeItem('gamedev_embeddingConfig');
    }
  }

  private async embedText(text: string): Promise<{ vector: number[]; model: string } | null> {
    const cfg = this.getEmbeddingRequestConfig();
    if (!cfg) return null;
    try {
      const [vec] = await createEmbeddings(cfg, [text]);
      return { vector: normalizeToUnitVector(vec), model: cfg.model };
    } catch (e) {
      console.warn('[向量记忆] Embedding生成失败，回退到本地向量:', e);
      return null;
    }
  }

  private async embedBatch(texts: string[]): Promise<{ vectors: number[][]; model: string } | null> {
    const cfg = this.getEmbeddingRequestConfig();
    if (!cfg) return null;
    try {
      const vecs = await createEmbeddings(cfg, texts);
      return { vectors: vecs.map(v => normalizeToUnitVector(v)), model: cfg.model };
    } catch (e) {
      console.warn('[向量记忆] Embedding批量生成失败，回退到本地向量:', e);
      return null;
    }
  }

  // ============ 记忆写入 ============

  /**
   * 添加记忆到向量库
   */
  async addMemory(content: string, importance: number = 5): Promise<VectorMemoryEntry | null> {
    if (!this.db) {
      console.warn('[向量记忆] 数据库未初始化');
      return null;
    }

    const trimmed = (content || '').trim();
    if (!trimmed) return null;

    const tags = extractTags(content);
    const category = inferCategory(content, tags);
    const embedded = await this.embedText(trimmed);
    const vector = embedded ? embedded.vector : this.vectorizer.vectorize(trimmed);

    const entry: VectorMemoryEntry = {
      id: stableMemoryId(trimmed),
      content: trimmed,
      tags,
      vector,
      vectorType: embedded ? 'embedding' : 'tfidf',
      embeddingModel: embedded?.model,
      timestamp: Date.now(),
      importance,
      category,
      metadata: {
        people: tags.filter(t => !GAMEDEV_KEYWORDS.has(t)).slice(0, 5),
      },
    };

    await this.db.put('memories', entry);
    console.log(`[向量记忆] 添加记忆: ${content.substring(0, 50)}... 标签: ${tags.join(', ')}`);
    return entry;
  }

  /**
   * 批量导入长期记忆
   */
  async importLongTermMemories(memories: string[]): Promise<number> {
    let count = 0;
    for (const memory of memories) {
      if (memory && memory.trim()) {
        await this.addMemory(memory, 7);
        count++;
      }
    }
    console.log(`[向量记忆] 导入 ${count} 条长期记忆`);
    return count;
  }

  /**
   * 重建向量库
   */
  async rebuildFromLongTermMemories(
    memories: string[],
    options?: {
      importance?: number;
      batchSize?: number;
      onProgress?: (done: number, total: number) => void;
    },
  ): Promise<{ imported: number; vectorType: 'embedding' | 'tfidf'; embeddingModel?: string }> {
    if (!this.db) throw new Error('向量库未初始化');
    const list = (memories || []).map(m => (m || '').trim()).filter(Boolean);
    const total = list.length;
    const importance = options?.importance ?? 7;
    const batchSize = Math.max(1, Math.min(64, options?.batchSize ?? 24));

    await this.clear();

    let imported = 0;
    let usedEmbeddingModel: string | undefined;
    let vectorType: 'embedding' | 'tfidf' = 'tfidf';

    for (let i = 0; i < list.length; i += batchSize) {
      const chunk = list.slice(i, i + batchSize);
      const embedded = await this.embedBatch(chunk);

      if (embedded && embedded.vectors.length === chunk.length) {
        vectorType = 'embedding';
        usedEmbeddingModel = embedded.model;
        for (let j = 0; j < chunk.length; j++) {
          const content = chunk[j];
          const tags = extractTags(content);
          const category = inferCategory(content, tags);
          const entry: VectorMemoryEntry = {
            id: stableMemoryId(content),
            content,
            tags,
            vector: embedded.vectors[j],
            vectorType: 'embedding',
            embeddingModel: embedded.model,
            timestamp: Date.now(),
            importance,
            category,
            metadata: { people: tags.filter(t => !GAMEDEV_KEYWORDS.has(t)).slice(0, 5) },
          };
          await this.db.put('memories', entry);
          imported++;
        }
      } else {
        for (const content of chunk) {
          const tags = extractTags(content);
          const category = inferCategory(content, tags);
          const entry: VectorMemoryEntry = {
            id: stableMemoryId(content),
            content,
            tags,
            vector: this.vectorizer.vectorize(content),
            vectorType: 'tfidf',
            timestamp: Date.now(),
            importance,
            category,
            metadata: { people: tags.filter(t => !GAMEDEV_KEYWORDS.has(t)).slice(0, 5) },
          };
          await this.db.put('memories', entry);
          imported++;
        }
      }

      options?.onProgress?.(Math.min(i + chunk.length, total), total);
    }

    console.log(`[向量记忆] 重建完成：${imported}/${total} 条，模式=${vectorType}${usedEmbeddingModel ? `(${usedEmbeddingModel})` : ''}`);
    return { imported, vectorType, embeddingModel: usedEmbeddingModel };
  }

  // ============ 记忆检索 ============

  /**
   * 检索相关记忆
   */
  async searchMemories(query: string, context?: {
    recentEvents?: string[];
  }): Promise<MemorySearchResult[]> {
    if (!this.db || !this.config.enabled) {
      return [];
    }

    const queryTags = extractTags(query);

    // 添加上下文标签
    if (context?.recentEvents) {
      for (const event of context.recentEvents.slice(0, 3)) {
        queryTags.push(...extractTags(event));
      }
    }

    const allMemories = await this.db.getAll('memories') as VectorMemoryEntry[];

    const queryTextForEmbedding = [
      query,
      ...(context?.recentEvents || []).slice(0, 3).map(e => `事件: ${e}`),
    ].filter(Boolean).join('\n');

    const embeddedQuery = await this.embedText(queryTextForEmbedding);
    const embeddingModel = embeddedQuery?.model;
    const embeddingQueryVector = embeddedQuery?.vector;

    const hasMatchingEmbeddingEntries =
      !!embeddingQueryVector &&
      allMemories.some(e =>
        (e.vectorType || 'tfidf') === 'embedding' &&
        (!!embeddingModel ? e.embeddingModel === embeddingModel : true) &&
        Array.isArray(e.vector) &&
        e.vector.length === embeddingQueryVector.length,
      );

    const queryVectorType: 'embedding' | 'tfidf' = hasMatchingEmbeddingEntries ? 'embedding' : 'tfidf';
    const queryVector = queryVectorType === 'embedding' && embeddingQueryVector
      ? embeddingQueryVector
      : this.vectorizer.vectorize(query);

    const scored: MemorySearchResult[] = [];

    for (const entry of allMemories) {
      const entryVectorType = (entry.vectorType || 'tfidf') as 'embedding' | 'tfidf';
      if (entryVectorType !== queryVectorType) continue;
      if (entryVectorType === 'embedding') {
        if (embeddingModel && entry.embeddingModel && entry.embeddingModel !== embeddingModel) continue;
        if (entry.vector.length !== queryVector.length) continue;
      }

      // 标签匹配分数
      const matchedTags = entry.tags.filter(t => queryTags.includes(t));
      const tagScore = matchedTags.length / Math.max(queryTags.length, 1);

      // 向量相似度
      const vectorScore =
        entryVectorType === 'tfidf'
          ? this.vectorizer.cosineSimilarity(queryVector, entry.vector)
          : (() => {
            let dot = 0;
            for (let i = 0; i < queryVector.length; i++) dot += queryVector[i] * entry.vector[i];
            return dot;
          })();

      // 综合分数
      const score = tagScore * this.config.tagWeight + vectorScore * this.config.vectorWeight;

      scored.push({ entry, score, matchedTags });
    }

    scored.sort((a, b) => b.score - a.score);

    const filtered = scored.filter(r => r.score >= this.config.minSimilarity);
    const picked = (filtered.length > 0 ? filtered : scored).slice(0, this.config.maxRetrieveCount);
    return picked;
  }

  // ============ 记忆总结（中期→长期） ============

  /**
   * AI驱动的记忆总结
   * 将多条中期记忆合并总结为1-2条长期记忆
   *
   * @param midTermMemories 要总结的中期记忆列表
   * @returns 总结后的长期记忆文本列表
   */
  async summarizeMemories(midTermMemories: string[]): Promise<string[]> {
    if (this.isSummarizing) {
      console.warn('[向量记忆] 正在总结中，跳过');
      return [];
    }

    if (midTermMemories.length === 0) return [];

    this.isSummarizing = true;

    try {
      const summaryApiConfig = aiService.getSummaryConfig();

      if (!summaryApiConfig.apiUrl || !summaryApiConfig.apiKey) {
        console.warn('[向量记忆] 总结API未配置，跳过AI总结');
        // 回退：直接将中期记忆合并为一条长期记忆
        const combined = midTermMemories.join('\n');
        return [`【综合摘要】${combined.substring(0, 200)}`];
      }

      const prompt = `你是一个游戏开发公司经营模拟器的记忆总结助手。
请将以下多条游戏事件记忆总结为1-2条精炼的长期记忆。

要求：
1. 保留关键决策和结果
2. 保留重要的人名、公司名、游戏名
3. 保留关键数据（资金变化、销量等）
4. 每条总结控制在100-150字
5. 使用【时间段】开头标注时间范围
6. 直接输出总结内容，每条一行，不要编号

待总结的记忆：
${midTermMemories.map((m, i) => `${i + 1}. ${m}`).join('\n')}`;

      const url = summaryApiConfig.apiUrl.replace(/\/+$/, '');
      const apiUrl = url.endsWith('/v1') ? `${url}/chat/completions` : `${url}/v1/chat/completions`;

      const response = await axios.post(
        apiUrl,
        {
          model: summaryApiConfig.model,
          messages: [
            { role: 'system', content: '你是记忆总结助手，负责将多条事件记忆精炼为长期记忆摘要。' },
            { role: 'user', content: prompt },
          ],
          temperature: 0.3,
          max_tokens: 500,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${summaryApiConfig.apiKey}`,
          },
          timeout: 30000,
        },
      );

      const content = response.data?.choices?.[0]?.message?.content;
      if (!content) {
        console.warn('[向量记忆] AI总结返回空内容');
        return [`【综合摘要】${midTermMemories.join('；').substring(0, 200)}`];
      }

      // 按行分割，过滤空行
      const summaries = content
        .split('\n')
        .map((line: string) => line.trim())
        .filter((line: string) => line.length > 10);

      console.log(`[向量记忆] AI总结完成：${midTermMemories.length}条 → ${summaries.length}条`);
      return summaries;
    } catch (error) {
      console.error('[向量记忆] AI总结失败:', error);
      // 回退处理
      return [`【综合摘要】${midTermMemories.join('；').substring(0, 200)}`];
    } finally {
      this.isSummarizing = false;
    }
  }

  /**
   * 检查并触发自动总结
   * 当中期记忆数量超过阈值时，自动总结为长期记忆
   *
   * @param midTermMemories 当前中期记忆列表
   * @returns 总结结果（如果触发了总结）
   */
  async checkAndSummarize(midTermMemories: string[]): Promise<{
    triggered: boolean;
    summaries?: string[];
    consumedCount?: number;
  }> {
    if (!this.summaryConfig.autoSummarize) {
      return { triggered: false };
    }

    if (midTermMemories.length < this.summaryConfig.midTermThreshold) {
      return { triggered: false };
    }

    // 取前batchSize条进行总结
    const toSummarize = midTermMemories.slice(0, this.summaryConfig.batchSize);
    const summaries = await this.summarizeMemories(toSummarize);

    if (summaries.length > 0) {
      // 将总结结果写入向量库
      for (const summary of summaries) {
        await this.addMemory(summary, 8); // 长期记忆重要性较高
      }
    }

    return {
      triggered: true,
      summaries,
      consumedCount: toSummarize.length,
    };
  }

  // ============ 数据查询 ============

  /**
   * 获取所有记忆
   */
  async getAllMemories(): Promise<VectorMemoryEntry[]> {
    if (!this.db) return [];
    return await this.db.getAll('memories') as VectorMemoryEntry[];
  }

  /**
   * 获取记忆统计
   */
  async getStats(): Promise<MemoryStats> {
    if (!this.db) {
      return { total: 0, byCategory: {}, topTags: [], byVectorType: {}, byEmbeddingModel: {} };
    }

    const memories = await this.db.getAll('memories') as VectorMemoryEntry[];
    const byCategory: Record<string, number> = {};
    const tagCounts: Record<string, number> = {};
    const byVectorType: Record<string, number> = {};
    const byEmbeddingModel: Record<string, number> = {};

    for (const mem of memories) {
      byCategory[mem.category] = (byCategory[mem.category] || 0) + 1;
      const vt = mem.vectorType || 'tfidf';
      byVectorType[vt] = (byVectorType[vt] || 0) + 1;
      if (vt === 'embedding' && mem.embeddingModel) {
        byEmbeddingModel[mem.embeddingModel] = (byEmbeddingModel[mem.embeddingModel] || 0) + 1;
      }
      for (const tag of mem.tags) {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      }
    }

    const topTags = Object.entries(tagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);

    return {
      total: memories.length,
      byCategory,
      topTags,
      byVectorType,
      byEmbeddingModel,
    };
  }

  /**
   * 清空向量库
   */
  async clear(): Promise<void> {
    if (!this.db) return;
    await this.db.clear('memories');
    console.log('[向量记忆] 已清空向量库');
  }

  /**
   * 删除单条记忆
   */
  async deleteMemory(id: string): Promise<void> {
    if (!this.db) return;
    await this.db.delete('memories', id);
    console.log(`[向量记忆] 已删除记忆: ${id}`);
  }

  // ============ 格式化输出 ============

  /**
   * 格式化检索结果为AI可读文本
   */
  formatForAI(results: MemorySearchResult[]): string {
    if (results.length === 0) {
      return '';
    }

    const lines = ['【相关长期记忆】'];
    for (const { entry, matchedTags } of results) {
      const tagStr = matchedTags.length > 0 ? `[${matchedTags.join(',')}]` : '';
      lines.push(`- ${tagStr} ${entry.content}`);
    }
    return lines.join('\n');
  }
}

// 导出单例
export const vectorMemoryService = new VectorMemoryService();
