/**
 * 记忆系统类型定义
 * 移植自XianTu记忆系统，适配游戏开发商模拟器场景
 *
 * 三层记忆架构：
 * - 短期记忆（short）：最近几回合的事件，容量有限，溢出自动转入中期
 * - 中期记忆（medium）：经过初步整理的事件摘要，定期总结为长期记忆
 * - 长期记忆（long）：AI总结后的核心事件和决策，永久保留
 * - 隐式记忆（implicit）：系统自动记录的隐含信息
 */

// ===== 基础记忆条目 =====

/** 记忆类型 */
export type MemoryType = 'short' | 'medium' | 'long' | 'implicit';

/** 记忆条目（对应XianTu的Memory接口） */
export interface MemoryEntry {
  /** 记忆类型 */
  type: MemoryType;
  /** 记忆内容文本 */
  content: string;
  /** 记忆产生的游戏时间 */
  time: string;
  /** 解析后的结构化内容 */
  parsedContent?: {
    title?: string;
    sections: { [key: string]: string[] };
  };
  /** 在原始列表中的索引（用于UI展示） */
  originalIndex?: number;
  /** 是否已从短期/中期转换而来 */
  isConverted?: boolean;
  /** 重要性评分 (1-10) */
  importance?: number;
}

// ===== 向量记忆条目 =====

/** 向量记忆条目（用于IndexedDB存储和语义检索） */
export interface VectorMemoryEntry {
  /** 唯一ID（基于内容哈希） */
  id: string;
  /** 记忆内容 */
  content: string;
  /** 标签列表 */
  tags: string[];
  /** 向量表示 */
  vector: number[];
  /** 向量类型：本地TF-IDF 或 远程Embedding */
  vectorType?: 'tfidf' | 'embedding';
  /** 使用的Embedding模型名 */
  embeddingModel?: string;
  /** 创建时间戳 */
  timestamp: number;
  /** 重要性评分 (1-10) */
  importance: number;
  /** 记忆分类 */
  category: MemoryCategory;
  /** 元数据 */
  metadata?: {
    /** 涉及的人物（员工、竞品公司等） */
    people?: string[];
    /** 涉及的项目 */
    projects?: string[];
    /** 涉及的事件类型 */
    eventTypes?: string[];
    /** 游戏内时间 */
    gameTime?: string;
  };
}

/** 记忆分类（适配游戏开发商场景） */
export type MemoryCategory =
  | 'development'   // 游戏开发相关
  | 'finance'       // 财务相关
  | 'hr'            // 人事相关
  | 'marketing'     // 市场营销相关
  | 'competition'   // 竞品动态
  | 'community'     // 社区反馈
  | 'event'         // 世界事件
  | 'other';        // 其他

// ===== 检索结果 =====

/** 记忆检索结果 */
export interface MemorySearchResult {
  /** 匹配的记忆条目 */
  entry: VectorMemoryEntry;
  /** 综合匹配分数 (0-1) */
  score: number;
  /** 匹配的标签 */
  matchedTags: string[];
}

// ===== 向量记忆配置 =====

/** 向量记忆服务配置 */
export interface VectorMemoryConfig {
  /** 是否启用向量检索 */
  enabled: boolean;
  /** 最多检索条数 */
  maxRetrieveCount: number;
  /** 最低相似度阈值 */
  minSimilarity: number;
  /** 标签匹配权重 (0-1) */
  tagWeight: number;
  /** 向量相似度权重 (0-1) */
  vectorWeight: number;
}

// ===== Embedding API 配置 =====

/** Embedding请求配置 */
export interface EmbeddingRequestConfig {
  /** API地址 */
  url: string;
  /** API密钥 */
  apiKey: string;
  /** 模型名称 */
  model: string;
}

// ===== 记忆总结配置 =====

/** 记忆总结触发条件 */
export interface MemorySummaryConfig {
  /** 中期记忆达到多少条时触发总结 */
  midTermThreshold: number;
  /** 每次总结合并多少条中期记忆 */
  batchSize: number;
  /** 是否自动触发总结 */
  autoSummarize: boolean;
}

// ===== 记忆统计 =====

/** 记忆库统计信息 */
export interface MemoryStats {
  /** 总条数 */
  total: number;
  /** 按分类统计 */
  byCategory: Record<string, number>;
  /** 热门标签 */
  topTags: { tag: string; count: number }[];
  /** 按向量类型统计 */
  byVectorType: Record<string, number>;
  /** 按Embedding模型统计 */
  byEmbeddingModel: Record<string, number>;
}
