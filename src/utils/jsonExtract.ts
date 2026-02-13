/**
 * JSON智能解析工具
 * 从AI响应中智能提取并解析JSON，支持多种容错策略
 */

/**
 * 修复常见的JSON格式错误
 * @param text 待修复的JSON字符串
 * @returns 修复后的字符串
 */
function fixCommonJsonErrors(text: string): string {
  let fixed = text;

  // 1. 移除尾逗号（对象和数组末尾的逗号）
  fixed = fixed.replace(/,\s*([\]}])/g, '$1');

  // 2. 中文标点替换为英文标点
  fixed = fixed.replace(/：/g, ':');
  fixed = fixed.replace(/，/g, ',');
  fixed = fixed.replace(/"/g, '"').replace(/"/g, '"');
  fixed = fixed.replace(/'/g, "'").replace(/'/g, "'");
  fixed = fixed.replace(/【/g, '[').replace(/】/g, ']');
  fixed = fixed.replace(/｛/g, '{').replace(/｝/g, '}');

  // 3. 修复未转义的换行符（在字符串值内部）
  // 这个比较复杂，简单处理：替换字符串值中的实际换行为 \n
  fixed = fixed.replace(/"([^"]*?)"/g, (match) => {
    return match.replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t');
  });

  // 4. 修复单引号包裹的键名
  fixed = fixed.replace(/(\{|,)\s*'([^']+)'\s*:/g, '$1"$2":');

  // 5. 修复没有引号的键名（简单场景）
  fixed = fixed.replace(/(\{|,)\s*([a-zA-Z_\u4e00-\u9fa5][a-zA-Z0-9_\u4e00-\u9fa5]*)\s*:/g, '$1"$2":');

  return fixed;
}

/**
 * 从文本中提取 ```json 代码块内容
 * @param text 原始文本
 * @returns 提取的JSON字符串，未找到则返回null
 */
function extractJsonCodeBlock(text: string): string | null {
  // 匹配 ```json ... ``` 代码块
  const jsonBlockRegex = /```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/;
  const match = text.match(jsonBlockRegex);
  if (match && match[1]) {
    return match[1].trim();
  }
  return null;
}

/**
 * 从文本中查找最外层的 {...} JSON对象
 * @param text 原始文本
 * @returns 提取的JSON字符串，未找到则返回null
 */
function extractJsonObject(text: string): string | null {
  // 找到第一个 { 的位置
  const startIdx = text.indexOf('{');
  if (startIdx === -1) return null;

  // 从第一个 { 开始，匹配到对应的 }
  let depth = 0;
  let inString = false;
  let escapeNext = false;

  for (let i = startIdx; i < text.length; i++) {
    const char = text[i];

    if (escapeNext) {
      escapeNext = false;
      continue;
    }

    if (char === '\\') {
      escapeNext = true;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      continue;
    }

    if (inString) continue;

    if (char === '{') {
      depth++;
    } else if (char === '}') {
      depth--;
      if (depth === 0) {
        return text.substring(startIdx, i + 1);
      }
    }
  }

  // 如果没有找到匹配的闭合括号，返回从 { 到末尾的内容
  // 尝试补全缺失的 }
  const partial = text.substring(startIdx);
  const missingBraces = depth;
  if (missingBraces > 0) {
    return partial + '}'.repeat(missingBraces);
  }

  return null;
}

/**
 * 移除 <thinking> 标签及其内容
 * @param text 原始文本
 * @returns 清理后的文本
 */
function removeThinkingTags(text: string): string {
  return text.replace(/<thinking>[\s\S]*?<\/thinking>/gi, '').trim();
}

/**
 * 智能解析JSON - 从AI响应中提取并解析JSON对象
 * 
 * 解析策略（按优先级）：
 * 1. 直接 JSON.parse
 * 2. 提取 ```json 代码块后解析
 * 3. 查找 {...} 包裹的JSON后解析
 * 4. 移除 <thinking> 标签后重试以上步骤
 * 5. 修复常见JSON错误后重试
 * 
 * @param rawText AI的原始响应文本
 * @returns 解析后的对象
 * @throws Error 所有策略都失败时抛出错误
 */
export function parseJsonSmart<T = Record<string, unknown>>(rawText: string): T {
  if (!rawText || typeof rawText !== 'string') {
    throw new Error('[JSON解析] 输入为空或非字符串');
  }

  const trimmed = rawText.trim();

  // 策略1：直接解析
  try {
    return JSON.parse(trimmed) as T;
  } catch {
    // 继续尝试其他策略
  }

  // 策略2：提取 ```json 代码块
  const codeBlock = extractJsonCodeBlock(trimmed);
  if (codeBlock) {
    try {
      return JSON.parse(codeBlock) as T;
    } catch {
      // 代码块内容解析失败，尝试修复
      try {
        const fixed = fixCommonJsonErrors(codeBlock);
        return JSON.parse(fixed) as T;
      } catch {
        // 继续
      }
    }
  }

  // 策略3：查找 {...} JSON对象
  const jsonObj = extractJsonObject(trimmed);
  if (jsonObj) {
    try {
      return JSON.parse(jsonObj) as T;
    } catch {
      // 尝试修复后解析
      try {
        const fixed = fixCommonJsonErrors(jsonObj);
        return JSON.parse(fixed) as T;
      } catch {
        // 继续
      }
    }
  }

  // 策略4：移除 <thinking> 标签后重试
  const cleaned = removeThinkingTags(trimmed);
  if (cleaned !== trimmed) {
    // 对清理后的文本重新执行策略1-3
    try {
      return JSON.parse(cleaned) as T;
    } catch {
      // 继续
    }

    const cleanedCodeBlock = extractJsonCodeBlock(cleaned);
    if (cleanedCodeBlock) {
      try {
        return JSON.parse(cleanedCodeBlock) as T;
      } catch {
        try {
          return JSON.parse(fixCommonJsonErrors(cleanedCodeBlock)) as T;
        } catch {
          // 继续
        }
      }
    }

    const cleanedJsonObj = extractJsonObject(cleaned);
    if (cleanedJsonObj) {
      try {
        return JSON.parse(cleanedJsonObj) as T;
      } catch {
        try {
          return JSON.parse(fixCommonJsonErrors(cleanedJsonObj)) as T;
        } catch {
          // 继续
        }
      }
    }
  }

  // 策略5：全文修复后重试
  try {
    const fullyFixed = fixCommonJsonErrors(trimmed);
    return JSON.parse(fullyFixed) as T;
  } catch {
    // 继续
  }

  // 最后尝试：全文修复 + 提取对象
  try {
    const fullyFixed = fixCommonJsonErrors(trimmed);
    const lastAttempt = extractJsonObject(fullyFixed);
    if (lastAttempt) {
      return JSON.parse(lastAttempt) as T;
    }
  } catch {
    // 所有策略都失败
  }

  // 所有策略都失败，抛出详细错误
  const preview = trimmed.length > 200 ? trimmed.substring(0, 200) + '...' : trimmed;
  throw new Error(
    `[JSON解析] 无法从AI响应中提取有效JSON。\n` +
    `原始文本预览: ${preview}`
  );
}

/**
 * 安全解析JSON，失败时返回默认值而非抛出错误
 * @param rawText AI的原始响应文本
 * @param defaultValue 解析失败时的默认值
 * @returns 解析结果或默认值
 */
export function parseJsonSafe<T = Record<string, unknown>>(
  rawText: string,
  defaultValue: T
): T {
  try {
    return parseJsonSmart<T>(rawText);
  } catch (error) {
    console.warn('[JSON解析] 解析失败，使用默认值:', error);
    return defaultValue;
  }
}
