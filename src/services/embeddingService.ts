/**
 * Embedding嵌入服务
 * 移植自XianTu的embeddingService，简化为使用游戏开发商的总结API配置
 *
 * 支持：
 * - OpenAI兼容API（/v1/embeddings）
 * - 阿里云DashScope原生API
 * - 硅基流动SiliconFlow API
 */
import axios from 'axios';
import type { EmbeddingRequestConfig } from '@/types/memory';

// ===== URL处理工具 =====

/**
 * 规范化API基础URL，移除尾部的 /v1 和多余斜杠
 */
export function normalizeBaseUrl(url: string): string {
  return (url || '').toString().trim().replace(/\/v1\/?$/, '').replace(/\/+$/, '');
}

/**
 * 检测是否为阿里云DashScope域名
 */
function isDashScopeHost(url: string): boolean {
  try {
    const u = new URL(url);
    return u.hostname === 'dashscope.aliyuncs.com' || u.hostname === 'dashscope-intl.aliyuncs.com';
  } catch {
    const lower = (url || '').toString().toLowerCase();
    return lower.includes('dashscope.aliyuncs.com') || lower.includes('dashscope-intl.aliyuncs.com');
  }
}

/**
 * 检测是否为硅基流动域名
 */
function isSiliconFlowHost(url: string): boolean {
  try {
    const u = new URL(url);
    return u.hostname === 'api.siliconflow.cn' || u.hostname.endsWith('.siliconflow.cn');
  } catch {
    const lower = (url || '').toString().toLowerCase();
    return lower.includes('siliconflow.cn');
  }
}

/**
 * 构建DashScope Embedding端点
 */
function buildDashScopeEmbeddingsEndpoint(urlOrBase: string): string {
  const trimmed = (urlOrBase || '').trim().replace(/\/+$/, '');
  const fullPath = '/api/v1/services/embeddings/text-embedding/text-embedding';

  if (trimmed.includes(fullPath)) return trimmed;

  try {
    const u = new URL(trimmed);
    return `${u.origin}${fullPath}`;
  } catch {
    if (trimmed.endsWith('/api')) return `${trimmed}/v1/services/embeddings/text-embedding/text-embedding`;
    return `${trimmed}${fullPath}`;
  }
}

// ===== 向量工具 =====

/**
 * 将向量归一化为单位向量
 */
export function normalizeToUnitVector(vec: number[]): number[] {
  const norm = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0));
  if (!norm) return vec;
  return vec.map(v => v / norm);
}

// ===== 核心Embedding函数 =====

/**
 * 调用Embedding API生成文本向量
 *
 * @param config Embedding API配置
 * @param inputs 要向量化的文本列表
 * @returns 每个文本对应的向量数组
 */
export async function createEmbeddings(
  config: EmbeddingRequestConfig,
  inputs: string[],
): Promise<number[][]> {
  const baseUrl = normalizeBaseUrl(config.url);
  const apiKey = (config.apiKey || '').trim();
  const model = (config.model || '').trim();

  if (!baseUrl) throw new Error('Embedding API 地址未配置');
  if (!apiKey) throw new Error('Embedding API Key 未配置');
  if (!model) throw new Error('Embedding 模型未配置');

  // 阿里云DashScope：使用原生API
  if (isDashScopeHost(baseUrl)) {
    const endpoint = buildDashScopeEmbeddingsEndpoint(baseUrl);
    const resp = await axios.post(
      endpoint,
      {
        model,
        input: { texts: inputs },
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      },
    );

    const embeddings = resp.data?.output?.embeddings;
    if (!Array.isArray(embeddings) || embeddings.length !== inputs.length) {
      throw new Error('Embedding 响应格式异常（DashScope）');
    }

    const ordered = embeddings
      .map((e: any) => ({ index: Number(e?.text_index), embedding: e?.embedding }))
      .sort((a: any, b: any) => a.index - b.index);

    return ordered.map((e: any) => {
      if (!Array.isArray(e?.embedding)) throw new Error('Embedding 响应缺少 embedding（DashScope）');
      return e.embedding as number[];
    });
  }

  // 硅基流动 / OpenAI��容格式
  if (isSiliconFlowHost(baseUrl)) {
    const resp = await axios.post(
      `${baseUrl}/v1/embeddings`,
      {
        model,
        input: inputs,
        encoding_format: 'float',
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      },
    );

    const data = resp.data?.data;
    if (!Array.isArray(data) || data.length !== inputs.length) {
      throw new Error('Embedding 响应格式异常（SiliconFlow）');
    }

    const sorted = [...data].sort((a: any, b: any) => (a.index ?? 0) - (b.index ?? 0));
    return sorted.map((d: any) => {
      const embedding = d?.embedding;
      if (!Array.isArray(embedding)) throw new Error('Embedding 响应缺少 embedding（SiliconFlow）');
      return embedding as number[];
    });
  }

  // 通用OpenAI兼容格式
  const resp = await axios.post(
    `${baseUrl}/v1/embeddings`,
    {
      model,
      input: inputs,
      encoding_format: 'float',
    },
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    },
  );

  const data = resp.data?.data;
  if (!Array.isArray(data) || data.length !== inputs.length) {
    throw new Error('Embedding 响应格式异常');
  }

  return data.map((d: any) => {
    const embedding = d?.embedding;
    if (!Array.isArray(embedding)) throw new Error('Embedding 响应缺少 embedding');
    return embedding as number[];
  });
}
