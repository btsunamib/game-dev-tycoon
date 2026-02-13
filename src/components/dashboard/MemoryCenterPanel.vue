<!--
  AI游戏开发商模拟器 - 记忆中心面板
  移植自XianTu的MemoryCenterPanel，适配游戏开发商场景
  
  功能：
  - 查看三层记忆（短期/中期/长期）
  - 手动触发记忆总结
  - 向量记忆库统计
  - 记忆检索测试
  - 配置管理
-->
<template>
  <div class="memory-center">
    <!-- 标题栏 -->
    <div class="panel-header">
      <h2>🧠 记忆中心</h2>
      <div class="header-actions">
        <button class="btn btn-sm" @click="refreshAll" :disabled="loading">
          🔄 刷新
        </button>
      </div>
    </div>

    <!-- 标签页导航 -->
    <div class="tab-nav">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        class="tab-btn"
        :class="{ active: activeTab === tab.id }"
        @click="activeTab = tab.id"
      >
        {{ tab.icon }} {{ tab.label }}
      </button>
    </div>

    <!-- 标签页内容 -->
    <div class="tab-content">
      <!-- ===== 记忆概览 ===== -->
      <div v-if="activeTab === 'overview'" class="tab-pane">
        <!-- 三层记忆统计 -->
        <div class="memory-stats-grid">
          <div class="stat-card">
            <div class="stat-icon">⚡</div>
            <div class="stat-info">
              <div class="stat-value">{{ shortTermCount }}</div>
              <div class="stat-label">短期记忆</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">📋</div>
            <div class="stat-info">
              <div class="stat-value">{{ midTermCount }}</div>
              <div class="stat-label">中期记忆</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">💎</div>
            <div class="stat-info">
              <div class="stat-value">{{ longTermCount }}</div>
              <div class="stat-label">长期记忆</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">🗄️</div>
            <div class="stat-info">
              <div class="stat-value">{{ vectorStats?.total ?? 0 }}</div>
              <div class="stat-label">向量库</div>
            </div>
          </div>
        </div>

        <!-- 向量库分类统计 -->
        <div class="section" v-if="vectorStats && vectorStats.total > 0">
          <h3>📊 向量库分类</h3>
          <div class="category-bars">
            <div
              v-for="(count, cat) in vectorStats.byCategory"
              :key="cat"
              class="category-bar"
            >
              <span class="cat-label">{{ getCategoryLabel(cat as string) }}</span>
              <div class="bar-track">
                <div
                  class="bar-fill"
                  :style="{ width: `${(count / vectorStats.total) * 100}%` }"
                ></div>
              </div>
              <span class="cat-count">{{ count }}</span>
            </div>
          </div>
        </div>

        <!-- 热门标签 -->
        <div class="section" v-if="vectorStats && vectorStats.topTags.length > 0">
          <h3>🏷️ 热门标签</h3>
          <div class="tag-cloud">
            <span
              v-for="tag in vectorStats.topTags.slice(0, 15)"
              :key="tag.tag"
              class="tag-item"
              :style="{ fontSize: `${Math.min(16, 11 + tag.count)}px` }"
            >
              {{ tag.tag }}
              <sup>{{ tag.count }}</sup>
            </span>
          </div>
        </div>

        <!-- Embedding状态 -->
        <div class="section">
          <h3>🔗 Embedding状态</h3>
          <div class="embedding-status" :class="embeddingStatus.available ? 'available' : 'unavailable'">
            <span class="status-dot"></span>
            <span v-if="embeddingStatus.available">
              已启用 - 模型: {{ embeddingStatus.model }}
            </span>
            <span v-else>{{ embeddingStatus.reason }}</span>
          </div>
        </div>
      </div>

      <!-- ===== 短期记忆 ===== -->
      <div v-if="activeTab === 'short'" class="tab-pane">
        <div class="memory-list-header">
          <h3>⚡ 短期记忆 ({{ shortTermCount }}条)</h3>
          <p class="hint">最近几回合的事件，容量上限10条，溢出自动转入中期记忆</p>
        </div>
        <div class="memory-list" v-if="shortTermMemories.length > 0">
          <div
            v-for="(mem, idx) in shortTermMemories"
            :key="idx"
            class="memory-item short"
          >
            <div class="memory-index">#{{ idx + 1 }}</div>
            <div class="memory-content">{{ mem }}</div>
          </div>
        </div>
        <div class="empty-state" v-else>
          <p>暂无短期记忆</p>
        </div>
      </div>

      <!-- ===== 中期记忆 ===== -->
      <div v-if="activeTab === 'mid'" class="tab-pane">
        <div class="memory-list-header">
          <h3>📋 中期记忆 ({{ midTermCount }}条)</h3>
          <p class="hint">
            经过初步整理的事件摘要。
            达到{{ summaryConfig.midTermThreshold }}条时自动触发AI总结。
          </p>
          <div class="header-actions">
            <button
              class="btn btn-primary btn-sm"
              @click="triggerSummarize"
              :disabled="summarizing || midTermCount < 3"
            >
              {{ summarizing ? '总结中...' : '🤖 手动总结' }}
            </button>
          </div>
        </div>
        <div class="memory-list" v-if="midTermMemories.length > 0">
          <div
            v-for="(mem, idx) in midTermMemories"
            :key="idx"
            class="memory-item mid"
          >
            <div class="memory-index">#{{ idx + 1 }}</div>
            <div class="memory-content">{{ mem }}</div>
          </div>
        </div>
        <div class="empty-state" v-else>
          <p>暂无中期记忆</p>
        </div>
      </div>

      <!-- ===== 长期记忆 ===== -->
      <div v-if="activeTab === 'long'" class="tab-pane">
        <div class="memory-list-header">
          <h3>💎 长期记忆 ({{ longTermCount }}条)</h3>
          <p class="hint">AI总结后的核心事件和决策，永久保留</p>
        </div>
        <div class="memory-list" v-if="longTermMemories.length > 0">
          <div
            v-for="(mem, idx) in longTermMemories"
            :key="idx"
            class="memory-item long"
          >
            <div class="memory-index">#{{ idx + 1 }}</div>
            <div class="memory-content">{{ mem }}</div>
          </div>
        </div>
        <div class="empty-state" v-else>
          <p>暂无长期记忆</p>
        </div>
      </div>

      <!-- ===== 向量库 ===== -->
      <div v-if="activeTab === 'vector'" class="tab-pane">
        <div class="memory-list-header">
          <h3>🗄️ 向量记忆库 ({{ vectorMemories.length }}条)</h3>
          <p class="hint">所有记忆的向量化存储，支持语义检索</p>
          <div class="header-actions">
            <button class="btn btn-sm" @click="rebuildVectorDB" :disabled="rebuilding">
              {{ rebuilding ? '重建中...' : '🔨 重建向量库' }}
            </button>
            <button class="btn btn-danger btn-sm" @click="clearVectorDB" :disabled="loading">
              🗑️ 清空
            </button>
          </div>
        </div>

        <!-- 检索测试 -->
        <div class="search-box">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="输入关键词测试记忆检索..."
            @keyup.enter="testSearch"
          />
          <button class="btn btn-sm" @click="testSearch" :disabled="!searchQuery.trim()">
            🔍 检索
          </button>
        </div>

        <!-- 检索结果 -->
        <div v-if="searchResults.length > 0" class="search-results">
          <h4>检索结果 ({{ searchResults.length }}条)</h4>
          <div
            v-for="(result, idx) in searchResults"
            :key="idx"
            class="memory-item search-result"
          >
            <div class="result-score">{{ (result.score * 100).toFixed(1) }}%</div>
            <div class="memory-content">
              <div class="result-tags" v-if="result.matchedTags.length > 0">
                <span class="tag-match" v-for="tag in result.matchedTags" :key="tag">{{ tag }}</span>
              </div>
              {{ result.entry.content }}
            </div>
            <div class="result-meta">
              <span class="meta-cat">{{ getCategoryLabel(result.entry.category) }}</span>
              <span class="meta-type">{{ result.entry.vectorType || 'tfidf' }}</span>
            </div>
          </div>
        </div>

        <!-- 全部向量记忆列表 -->
        <div class="memory-list" v-if="vectorMemories.length > 0 && searchResults.length === 0">
          <div
            v-for="mem in vectorMemories.slice(0, 50)"
            :key="mem.id"
            class="memory-item vector"
          >
            <div class="vector-meta">
              <span class="meta-cat">{{ getCategoryLabel(mem.category) }}</span>
              <span class="meta-importance">⭐{{ mem.importance }}</span>
              <span class="meta-type">{{ mem.vectorType || 'tfidf' }}</span>
            </div>
            <div class="memory-content">{{ mem.content }}</div>
            <div class="memory-tags">
              <span class="tag-item small" v-for="tag in mem.tags.slice(0, 8)" :key="tag">{{ tag }}</span>
            </div>
          </div>
          <div class="more-hint" v-if="vectorMemories.length > 50">
            还有 {{ vectorMemories.length - 50 }} 条记忆未显示
          </div>
        </div>
        <div class="empty-state" v-else-if="searchResults.length === 0">
          <p>向量库为空</p>
        </div>
      </div>

      <!-- ===== 设置 ===== -->
      <div v-if="activeTab === 'settings'" class="tab-pane">
        <div class="settings-section">
          <h3>⚙️ 向量检索配置</h3>
          <div class="setting-row">
            <label>启用向量检索</label>
            <input type="checkbox" v-model="configForm.enabled" @change="saveConfigForm" />
          </div>
          <div class="setting-row">
            <label>最大检索条数</label>
            <input type="number" v-model.number="configForm.maxRetrieveCount" min="1" max="50" @change="saveConfigForm" />
          </div>
          <div class="setting-row">
            <label>最低相似度阈值</label>
            <input type="number" v-model.number="configForm.minSimilarity" min="0" max="1" step="0.05" @change="saveConfigForm" />
          </div>
          <div class="setting-row">
            <label>标签权重</label>
            <input type="number" v-model.number="configForm.tagWeight" min="0" max="1" step="0.1" @change="saveConfigForm" />
          </div>
          <div class="setting-row">
            <label>向量权重</label>
            <input type="number" v-model.number="configForm.vectorWeight" min="0" max="1" step="0.1" @change="saveConfigForm" />
          </div>
        </div>

        <div class="settings-section">
          <h3>🤖 自动总结配置</h3>
          <div class="setting-row">
            <label>启用自动总结</label>
            <input type="checkbox" v-model="summaryForm.autoSummarize" @change="saveSummaryForm" />
          </div>
          <div class="setting-row">
            <label>中期记忆触发阈值</label>
            <input type="number" v-model.number="summaryForm.midTermThreshold" min="5" max="50" @change="saveSummaryForm" />
          </div>
          <div class="setting-row">
            <label>每次总结批量大小</label>
            <input type="number" v-model.number="summaryForm.batchSize" min="3" max="20" @change="saveSummaryForm" />
          </div>
        </div>

        <div class="settings-section">
          <h3>🔗 Embedding API配置（可选）</h3>
          <p class="hint">配置后可使用远程Embedding模型提升检索精度，不配置则使用本地TF-IDF</p>
          <div class="setting-row">
            <label>API地址</label>
            <input type="text" v-model="embeddingForm.url" placeholder="https://api.example.com" />
          </div>
          <div class="setting-row">
            <label>API密钥</label>
            <input type="password" v-model="embeddingForm.apiKey" placeholder="sk-..." />
          </div>
          <div class="setting-row">
            <label>模型名称</label>
            <input type="text" v-model="embeddingForm.model" placeholder="text-embedding-3-small" />
          </div>
          <div class="setting-actions">
            <button class="btn btn-primary btn-sm" @click="saveEmbeddingForm">保存Embedding配置</button>
            <button class="btn btn-sm" @click="clearEmbeddingForm">清除配置</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 操作反馈 -->
    <div v-if="message" class="feedback-message" :class="messageType">
      {{ message }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue';
import { useGameStateStore } from '@/stores/gameStateStore';
import { vectorMemoryService } from '@/services/vectorMemoryService';
import type { VectorMemoryEntry, MemorySearchResult, MemoryStats } from '@/types/memory';

// ===== Store =====
const store = useGameStateStore();

// ===== 状态 =====
const activeTab = ref('overview');
const loading = ref(false);
const summarizing = ref(false);
const rebuilding = ref(false);
const message = ref('');
const messageType = ref<'success' | 'error' | 'info'>('info');
const searchQuery = ref('');
const searchResults = ref<MemorySearchResult[]>([]);
const vectorMemories = ref<VectorMemoryEntry[]>([]);
const vectorStats = ref<MemoryStats | null>(null);

// ===== 标签页 =====
const tabs = [
  { id: 'overview', icon: '📊', label: '概览' },
  { id: 'short', icon: '⚡', label: '短期' },
  { id: 'mid', icon: '📋', label: '中期' },
  { id: 'long', icon: '💎', label: '长期' },
  { id: 'vector', icon: '🗄️', label: '向量库' },
  { id: 'settings', icon: '⚙️', label: '设置' },
];

// ===== 计算属性 =====
const shortTermMemories = computed(() => store.memory?.短期记忆 ?? []);
const midTermMemories = computed(() => store.memory?.中期记忆 ?? []);
const longTermMemories = computed(() => store.memory?.长期记忆 ?? []);
const shortTermCount = computed(() => shortTermMemories.value.length);
const midTermCount = computed(() => midTermMemories.value.length);
const longTermCount = computed(() => longTermMemories.value.length);

const embeddingStatus = computed(() => vectorMemoryService.getEmbeddingStatus());
const summaryConfig = computed(() => vectorMemoryService.getSummaryConfig());

// ===== 配置表单 =====
const configForm = reactive({ ...vectorMemoryService.getConfig() });
const summaryForm = reactive({ ...vectorMemoryService.getSummaryConfig() });
const embeddingForm = reactive({ url: '', apiKey: '', model: '' });

// ===== 分类标签映射 =====
function getCategoryLabel(cat: string): string {
  const map: Record<string, string> = {
    development: '🎮 开发',
    finance: '💰 财务',
    hr: '👥 人事',
    marketing: '📢 市场',
    competition: '🏢 竞品',
    community: '💬 社区',
    event: '📰 事件',
    other: '📌 其他',
  };
  return map[cat] || cat;
}

// ===== 操作方法 =====

function showMessage(msg: string, type: 'success' | 'error' | 'info' = 'info') {
  message.value = msg;
  messageType.value = type;
  setTimeout(() => { message.value = ''; }, 3000);
}

async function refreshAll() {
  loading.value = true;
  try {
    // 初始化向量库（如果未初始化）
    const saveId = store.saveMeta?.存档ID || 'default';
    await vectorMemoryService.init(saveId);

    vectorMemories.value = await vectorMemoryService.getAllMemories();
    vectorStats.value = await vectorMemoryService.getStats();

    // 加载Embedding配置
    try {
      const saved = localStorage.getItem('gamedev_embeddingConfig');
      if (saved) {
        const parsed = JSON.parse(saved);
        embeddingForm.url = parsed.url || '';
        embeddingForm.apiKey = parsed.apiKey || '';
        embeddingForm.model = parsed.model || '';
      }
    } catch { /* ignore */ }

    showMessage('刷新完成', 'success');
  } catch (e) {
    showMessage(`刷新失败: ${(e as Error).message}`, 'error');
  } finally {
    loading.value = false;
  }
}

async function triggerSummarize() {
  if (midTermCount.value < 3) {
    showMessage('中期记忆不足3条，无法总结', 'error');
    return;
  }

  summarizing.value = true;
  try {
    const summaries = await vectorMemoryService.summarizeMemories(midTermMemories.value);

    if (summaries.length > 0 && store.memory) {
      // 将总结结果添加到长期记忆
      for (const summary of summaries) {
        store.memory.长期记忆.push(summary);
      }
      // 清空已总结的中期记忆
      store.memory.中期记忆 = [];

      // 同步到向量库
      for (const summary of summaries) {
        await vectorMemoryService.addMemory(summary, 8);
      }

      await refreshAll();
      showMessage(`总结完成：${midTermCount.value}条中期记忆 → ${summaries.length}条长期记忆`, 'success');
    } else {
      showMessage('总结未产生结果', 'error');
    }
  } catch (e) {
    showMessage(`总结失败: ${(e as Error).message}`, 'error');
  } finally {
    summarizing.value = false;
  }
}

async function testSearch() {
  if (!searchQuery.value.trim()) return;

  loading.value = true;
  try {
    searchResults.value = await vectorMemoryService.searchMemories(searchQuery.value);
    if (searchResults.value.length === 0) {
      showMessage('未找到相关记忆', 'info');
    }
  } catch (e) {
    showMessage(`检索失败: ${(e as Error).message}`, 'error');
  } finally {
    loading.value = false;
  }
}

async function rebuildVectorDB() {
  if (!store.memory) {
    showMessage('游戏记忆数据不存在', 'error');
    return;
  }

  rebuilding.value = true;
  try {
    const allMemories = [
      ...store.memory.长期记忆,
      ...store.memory.中期记忆,
    ];

    const result = await vectorMemoryService.rebuildFromLongTermMemories(allMemories, {
      onProgress: (done, total) => {
        showMessage(`重建进度: ${done}/${total}`, 'info');
      },
    });

    await refreshAll();
    showMessage(
      `重建完成：导入${result.imported}条，模式=${result.vectorType}${result.embeddingModel ? `(${result.embeddingModel})` : ''}`,
      'success',
    );
  } catch (e) {
    showMessage(`重建失败: ${(e as Error).message}`, 'error');
  } finally {
    rebuilding.value = false;
  }
}

async function clearVectorDB() {
  if (!confirm('确定要清空向量库吗？此操作不可撤销。')) return;

  try {
    await vectorMemoryService.clear();
    await refreshAll();
    showMessage('向量库已清空', 'success');
  } catch (e) {
    showMessage(`清空失败: ${(e as Error).message}`, 'error');
  }
}

function saveConfigForm() {
  vectorMemoryService.saveConfig(configForm);
  showMessage('向量检索配置已保存', 'success');
}

function saveSummaryForm() {
  vectorMemoryService.saveSummaryConfig(summaryForm);
  showMessage('总结配置已保存', 'success');
}

function saveEmbeddingForm() {
  if (embeddingForm.url && embeddingForm.apiKey && embeddingForm.model) {
    vectorMemoryService.saveEmbeddingConfig({
      url: embeddingForm.url,
      apiKey: embeddingForm.apiKey,
      model: embeddingForm.model,
    });
    showMessage('Embedding配置已保存', 'success');
  } else {
    showMessage('请填写完整的Embedding配置', 'error');
  }
}

function clearEmbeddingForm() {
  embeddingForm.url = '';
  embeddingForm.apiKey = '';
  embeddingForm.model = '';
  vectorMemoryService.saveEmbeddingConfig(null);
  showMessage('Embedding配置已清除', 'success');
}

// ===== 生命周期 =====
onMounted(() => {
  refreshAll();
});
</script>

<style scoped>
.memory-center {
  padding: 20px;
  max-width: 900px;
  margin: 0 auto;
  color: var(--text-primary);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.panel-header h2 {
  margin: 0;
  font-size: 22px;
}

/* 标签页导航 */
.tab-nav {
  display: flex;
  gap: 4px;
  border-bottom: 1px solid var(--border-color);
  margin-bottom: 20px;
  overflow-x: auto;
}

.tab-btn {
  padding: 8px 16px;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 13px;
  white-space: nowrap;
  transition: all 0.2s;
}

.tab-btn:hover {
  color: var(--text-primary);
  background: rgba(0, 212, 255, 0.04);
}

.tab-btn.active {
  color: var(--color-primary);
  border-bottom-color: var(--color-primary);
}

/* 统计卡片 */
.memory-stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 24px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 8px;
}

.stat-icon {
  font-size: 28px;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: var(--color-primary);
}

.stat-label {
  font-size: 12px;
  color: var(--text-muted);
}

/* 分类统计条 */
.section {
  margin-bottom: 24px;
}

.section h3 {
  font-size: 15px;
  margin-bottom: 12px;
}

.category-bars {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.category-bar {
  display: flex;
  align-items: center;
  gap: 8px;
}

.cat-label {
  width: 80px;
  font-size: 12px;
  text-align: right;
  flex-shrink: 0;
}

.bar-track {
  flex: 1;
  height: 8px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  background: var(--color-primary);
  border-radius: 4px;
  transition: width 0.3s;
  min-width: 4px;
}

.cat-count {
  width: 30px;
  font-size: 12px;
  color: var(--text-muted);
}

/* 标签云 */
.tag-cloud {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag-item {
  display: inline-block;
  padding: 4px 10px;
  background: rgba(0, 212, 255, 0.08);
  border: 1px solid rgba(0, 212, 255, 0.15);
  border-radius: 12px;
  color: var(--text-secondary);
  font-size: 12px;
}

.tag-item.small {
  padding: 2px 6px;
  font-size: 11px;
}

.tag-item sup {
  color: var(--color-primary);
  margin-left: 2px;
}

/* Embedding状态 */
.embedding-status {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-radius: 6px;
  font-size: 13px;
}

.embedding-status.available {
  background: rgba(0, 200, 83, 0.08);
  border: 1px solid rgba(0, 200, 83, 0.2);
}

.embedding-status.unavailable {
  background: rgba(255, 193, 7, 0.08);
  border: 1px solid rgba(255, 193, 7, 0.2);
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.available .status-dot {
  background: #00c853;
}

.unavailable .status-dot {
  background: #ffc107;
}

/* 记忆列表 */
.memory-list-header {
  margin-bottom: 16px;
}

.memory-list-header h3 {
  margin-bottom: 4px;
}

.memory-list-header .header-actions {
  margin-top: 8px;
}

.hint {
  font-size: 12px;
  color: var(--text-muted);
  margin: 0;
}

.memory-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.memory-item {
  display: flex;
  gap: 10px;
  padding: 12px;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 13px;
  line-height: 1.5;
}

.memory-item.short {
  border-left: 3px solid #ffc107;
}

.memory-item.mid {
  border-left: 3px solid #2196f3;
}

.memory-item.long {
  border-left: 3px solid #00c853;
}

.memory-item.vector {
  flex-direction: column;
  gap: 6px;
}

.memory-index {
  color: var(--text-muted);
  font-size: 11px;
  flex-shrink: 0;
  width: 30px;
}

.memory-content {
  flex: 1;
  word-break: break-all;
}

.memory-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.vector-meta {
  display: flex;
  gap: 8px;
  font-size: 11px;
}

.meta-cat, .meta-importance, .meta-type {
  padding: 2px 6px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-muted);
}

/* 检索 */
.search-box {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.search-box input {
  flex: 1;
  padding: 8px 12px;
  background: var(--bg-input);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  color: var(--text-primary);
  font-size: 13px;
}

.search-box input:focus {
  outline: none;
  border-color: var(--color-primary);
}

.search-results {
  margin-bottom: 20px;
}

.search-results h4 {
  margin-bottom: 8px;
  font-size: 14px;
}

.search-result {
  border-left: 3px solid var(--color-primary) !important;
}

.result-score {
  font-weight: 700;
  color: var(--color-primary);
  font-size: 12px;
  flex-shrink: 0;
  width: 50px;
}

.result-tags {
  display: flex;
  gap: 4px;
  margin-bottom: 4px;
}

.tag-match {
  padding: 1px 6px;
  background: rgba(0, 212, 255, 0.15);
  border-radius: 4px;
  font-size: 11px;
  color: var(--color-primary);
}

.result-meta {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}

/* 设置 */
.settings-section {
  margin-bottom: 24px;
  padding: 16px;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 8px;
}

.settings-section h3 {
  margin-bottom: 12px;
  font-size: 15px;
}

.setting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.03);
}

.setting-row label {
  font-size: 13px;
  color: var(--text-secondary);
}

.setting-row input[type="number"],
.setting-row input[type="text"],
.setting-row input[type="password"] {
  width: 200px;
  padding: 6px 10px;
  background: var(--bg-input);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  color: var(--text-primary);
  font-size: 13px;
}

.setting-row input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.setting-row input:focus {
  outline: none;
  border-color: var(--color-primary);
}

.setting-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

/* 按钮 */
.btn {
  padding: 6px 14px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background: var(--bg-card);
  color: var(--text-primary);
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}

.btn:hover:not(:disabled) {
  background: rgba(0, 212, 255, 0.08);
  border-color: var(--color-primary);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: var(--color-primary);
  color: #000;
  border-color: var(--color-primary);
}

.btn-primary:hover:not(:disabled) {
  background: rgba(0, 212, 255, 0.8);
}

.btn-danger {
  border-color: #f44336;
  color: #f44336;
}

.btn-danger:hover:not(:disabled) {
  background: rgba(244, 67, 54, 0.1);
}

.btn-sm {
  padding: 4px 10px;
  font-size: 11px;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: var(--text-muted);
}

.more-hint {
  text-align: center;
  padding: 12px;
  color: var(--text-muted);
  font-size: 12px;
}

/* 反馈消息 */
.feedback-message {
  position: fixed;
  bottom: 20px;
  right: 20px;
  padding: 10px 20px;
  border-radius: 6px;
  font-size: 13px;
  z-index: 1000;
  animation: fadeIn 0.3s;
}

.feedback-message.success {
  background: rgba(0, 200, 83, 0.15);
  border: 1px solid rgba(0, 200, 83, 0.3);
  color: #00c853;
}

.feedback-message.error {
  background: rgba(244, 67, 54, 0.15);
  border: 1px solid rgba(244, 67, 54, 0.3);
  color: #f44336;
}

.feedback-message.info {
  background: rgba(33, 150, 243, 0.15);
  border: 1px solid rgba(33, 150, 243, 0.3);
  color: #2196f3;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* 响应式 */
@media (max-width: 768px) {
  .memory-stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .setting-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
  }

  .setting-row input[type="number"],
  .setting-row input[type="text"],
  .setting-row input[type="password"] {
    width: 100%;
  }
}
</style>
