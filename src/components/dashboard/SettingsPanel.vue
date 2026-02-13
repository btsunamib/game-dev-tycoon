<!--
  AI游戏开发商模拟器 - 设置面板
  运行模式切换（酒馆/网页）、API配置、模型选择、总结API独立配置、游戏设置管理
-->
<template>
  <div class="panel-container settings-panel">
    <h2 class="panel-title">⚙️ 设置</h2>

    <!-- 运行模式切换区 -->
    <div class="settings-section">
      <div class="section-header">
        <h3 class="section-title">🔌 运行模式</h3>
        <span class="section-badge" :class="modeBadgeClass">{{ modeBadgeText }}</span>
      </div>

      <div class="settings-card">
        <div class="mode-selector">
          <button
            class="mode-btn"
            :class="{ active: apiConfig.mode === 'tavern' }"
            @click="switchMode('tavern')"
          >
            <span class="mode-icon">🍺</span>
            <span class="mode-label">酒馆模式</span>
            <span class="mode-desc">使用SillyTavern的预设和API</span>
          </button>
          <button
            class="mode-btn"
            :class="{ active: apiConfig.mode === 'custom' }"
            @click="switchMode('custom')"
          >
            <span class="mode-icon">🌐</span>
            <span class="mode-label">网页模式</span>
            <span class="mode-desc">直连OpenAI兼容API</span>
          </button>
        </div>

        <!-- 酒馆模式状态 -->
        <div v-if="apiConfig.mode === 'tavern'" class="tavern-status-area">
          <div class="divider"></div>
          <div class="tavern-status" :class="tavernStatusClass">
            <span class="status-dot" :class="tavernStatusClass"></span>
            <span class="status-text">{{ tavernStatusMessage }}</span>
          </div>

          <div v-if="tavernStatus" class="tavern-info">
            <div v-if="tavernStatus.connectionType" class="info-row">
              <span class="info-label">连接方式</span>
              <span class="info-value">{{ connectionTypeLabel }}</span>
            </div>
            <div v-if="tavernStatus.presetName" class="info-row">
              <span class="info-label">当前预设</span>
              <span class="info-value">{{ tavernStatus.presetName }}</span>
            </div>
            <div v-if="tavernStatus.modelName" class="info-row">
              <span class="info-label">当前模型</span>
              <span class="info-value">{{ tavernStatus.modelName }}</span>
            </div>
          </div>

          <button
            class="btn btn-sm btn-ghost"
            :disabled="isCheckingTavern"
            @click="recheckTavern"
            style="margin-top: 12px;"
          >
            <template v-if="isCheckingTavern">
              <span class="btn-loading"></span> 检测中...
            </template>
            <template v-else>
              🔄 重新检测
            </template>
          </button>

          <div class="form-hint" style="margin-top: 8px;">
            酒馆模式下，AI生成将使用SillyTavern的预设参数和API配置。
            请确���在SillyTavern中已正确配置API和预设。
          </div>
        </div>
      </div>
    </div>

    <!-- API配置区（仅网页模式显示） -->
    <div v-if="apiConfig.mode === 'custom'" class="settings-section">
      <div class="section-header">
        <h3 class="section-title">🔑 API 配置</h3>
        <span class="section-badge" :class="apiStatusClass">{{ apiStatusText }}</span>
      </div>

      <div class="settings-card">
        <!-- API地址 -->
        <div class="form-group">
          <label class="form-label">API 地址</label>
          <input
            v-model="apiConfig.apiUrl"
            type="text"
            class="input"
            placeholder="https://api.openai.com/v1"
          />
          <div class="form-hint">OpenAI兼容格式的API端点地址</div>
        </div>

        <!-- API密钥 -->
        <div class="form-group">
          <label class="form-label">API 密钥</label>
          <div class="password-input-wrapper">
            <input
              v-model="apiConfig.apiKey"
              :type="showApiKey ? 'text' : 'password'"
              class="input"
              placeholder="sk-..."
            />
            <button
              class="toggle-visibility-btn"
              @click="showApiKey = !showApiKey"
              :title="showApiKey ? '隐藏密钥' : '显示密钥'"
            >
              {{ showApiKey ? '🙈' : '👁️' }}
            </button>
          </div>
          <div class="form-hint">你的API密钥，将安全存储在本地浏览器中</div>
        </div>

        <!-- 模型名称 + 获取模型列表 -->
        <div class="form-group">
          <label class="form-label">模型名称</label>
          <div class="model-input-row">
            <input
              v-if="!showModelSelect"
              v-model="apiConfig.model"
              type="text"
              class="input"
              placeholder="gpt-4o"
            />
            <select
              v-else
              v-model="apiConfig.model"
              class="select"
            >
              <option v-for="m in modelList" :key="m" :value="m">{{ m }}</option>
            </select>
            <button
              class="btn btn-sm btn-ghost fetch-models-btn"
              :disabled="isFetchingModels || !apiConfig.apiUrl || !apiConfig.apiKey"
              @click="fetchModelList"
            >
              <template v-if="isFetchingModels">
                <span class="btn-loading"></span>
              </template>
              <template v-else>
                📋 获取模型
              </template>
            </button>
          </div>
          <div v-if="modelListError" class="form-hint text-danger">{{ modelListError }}</div>
          <div v-else-if="showModelSelect" class="form-hint">
            已获取 {{ modelList.length }} 个模型，可从下拉列表选择
            <button class="link-btn" @click="showModelSelect = false">切换为手动输入</button>
          </div>
          <div v-else class="form-hint">
            使用的AI模型，如 gpt-4o、gpt-4、claude-3-opus 等
          </div>
        </div>

        <!-- 流式传输 -->
        <div class="form-group">
          <div class="switch-row">
            <div class="switch-info">
              <label class="form-label" style="margin-bottom: 0;">流式传输</label>
              <div class="form-hint" style="margin-top: 2px;">启用后AI回复将逐字显示，体验更流畅</div>
            </div>
            <label class="switch">
              <input type="checkbox" v-model="apiConfig.streaming" />
              <span class="switch-slider"></span>
            </label>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="form-actions">
          <button
            class="btn btn-ghost"
            :disabled="isTesting"
            @click="testConnection"
          >
            <template v-if="isTesting">
              <span class="btn-loading"></span> 测试中...
            </template>
            <template v-else>
              🔗 测试连接
            </template>
          </button>
          <button
            class="btn btn-primary"
            @click="saveApiConfig"
          >
            💾 保存配置
          </button>
        </div>

        <!-- 测试结果 -->
        <div v-if="testResult" class="test-result" :class="testResult.success ? 'result-success' : 'result-error'">
          <span class="result-icon">{{ testResult.success ? '✅' : '❌' }}</span>
          <span>{{ testResult.message }}</span>
        </div>
      </div>
    </div>

    <!-- 独立总结API配置区 -->
    <div class="settings-section">
      <div class="section-header">
        <h3 class="section-title">📝 总结 API 配置</h3>
        <span class="section-badge" :class="apiConfig.useSeparateSummaryApi ? 'badge-success' : 'badge-muted'">
          {{ apiConfig.useSeparateSummaryApi ? '独立配置' : '使用主API' }}
        </span>
      </div>

      <div class="settings-card">
        <!-- 独立总结API开关 -->
        <div class="form-group">
          <div class="switch-row">
            <div class="switch-info">
              <label class="form-label" style="margin-bottom: 0;">总结使用独立API</label>
              <div class="form-hint" style="margin-top: 2px;">
                开启后，总结��能将使用独立的API配置（可使用更便宜的模型）
              </div>
            </div>
            <label class="switch">
              <input type="checkbox" v-model="apiConfig.useSeparateSummaryApi" />
              <span class="switch-slider"></span>
            </label>
          </div>
        </div>

        <!-- 独立配置表单（仅在开启时显示） -->
        <template v-if="apiConfig.useSeparateSummaryApi">
          <div class="divider"></div>

          <!-- 总结API地址 -->
          <div class="form-group">
            <label class="form-label">总结 API 地址</label>
            <input
              v-model="apiConfig.summaryApiUrl"
              type="text"
              class="input"
              placeholder="留空则使用主API地址"
            />
          </div>

          <!-- 总结API密钥 -->
          <div class="form-group">
            <label class="form-label">总结 API 密钥</label>
            <div class="password-input-wrapper">
              <input
                v-model="apiConfig.summaryApiKey"
                :type="showSummaryApiKey ? 'text' : 'password'"
                class="input"
                placeholder="留空则使用主API密钥"
              />
              <button
                class="toggle-visibility-btn"
                @click="showSummaryApiKey = !showSummaryApiKey"
              >
                {{ showSummaryApiKey ? '🙈' : '👁️' }}
              </button>
            </div>
          </div>

          <!-- 总结模型名称 -->
          <div class="form-group">
            <label class="form-label">总结模型名称</label>
            <input
              v-model="apiConfig.summaryModel"
              type="text"
              class="input"
              placeholder="留空则使用主模型"
            />
            <div class="form-hint">建议使用较便宜的模型，如 gpt-4o-mini</div>
          </div>
        </template>

        <!-- 总结API保存按钮 -->
        <div class="form-actions">
          <button class="btn btn-primary" @click="saveApiConfig">
            💾 保存配置
          </button>
        </div>
      </div>
    </div>

    <!-- 游戏设置区 -->
    <div class="settings-section">
      <div class="section-header">
        <h3 class="section-title">🎮 游戏设置</h3>
      </div>

      <div class="settings-card">
        <!-- 自动保存 -->
        <div class="form-group">
          <div class="switch-row">
            <div class="switch-info">
              <label class="form-label" style="margin-bottom: 0;">自动保存</label>
              <div class="form-hint" style="margin-top: 2px;">每次AI回复后自动保存游戏进度</div>
            </div>
            <label class="switch">
              <input type="checkbox" v-model="gameSettings.autoSave" />
              <span class="switch-slider"></span>
            </label>
          </div>
        </div>

        <!-- 消息历史保留数量 -->
        <div class="form-group">
          <label class="form-label">
            消息历史保留数量：<span class="text-primary">{{ gameSettings.historyLimit }}</span> 条
          </label>
          <div class="slider-wrapper">
            <span class="slider-min">5</span>
            <input
              type="range"
              v-model.number="gameSettings.historyLimit"
              min="5"
              max="50"
              step="5"
              class="slider"
            />
            <span class="slider-max">50</span>
          </div>
          <div class="form-hint">发送给AI的历史消息数量，越多上下文越丰富但消耗更多Token</div>
        </div>

        <!-- 主题切换 -->
        <div class="form-group">
          <div class="switch-row">
            <div class="switch-info">
              <label class="form-label" style="margin-bottom: 0;">主题</label>
              <div class="form-hint" style="margin-top: 2px;">切换界面主题风格（暂仅支持暗色）</div>
            </div>
            <div class="theme-selector">
              <button
                class="theme-btn"
                :class="{ active: gameSettings.theme === 'dark' }"
                @click="gameSettings.theme = 'dark'"
              >
                🌙 暗色
              </button>
              <button
                class="theme-btn"
                :class="{ active: gameSettings.theme === 'light' }"
                @click="gameSettings.theme = 'light'"
                disabled
                title="亮色主题开发中"
              >
                ☀️ 亮色
              </button>
            </div>
          </div>
        </div>

        <!-- 保存游戏设置 -->
        <div class="form-actions">
          <button class="btn btn-primary" @click="saveGameSettings">
            💾 保存游戏设置
          </button>
        </div>
      </div>
    </div>

    <!-- 关于信息 -->
    <div class="settings-section">
      <div class="section-header">
        <h3 class="section-title">ℹ️ 关于</h3>
      </div>

      <div class="settings-card about-card">
        <div class="about-item">
          <span class="about-label">项目名称</span>
          <span class="about-value">AI游戏开发商模拟器</span>
        </div>
        <div class="about-item">
          <span class="about-label">版本</span>
          <span class="about-value">v0.1.0-alpha</span>
        </div>
        <div class="about-item">
          <span class="about-label">存档版本</span>
          <span class="about-value">V1</span>
        </div>
        <div class="about-item">
          <span class="about-label">技术栈</span>
          <span class="about-value">Vue 3 + TypeScript + Pinia</span>
        </div>
        <div class="about-item">
          <span class="about-label">灵感来源</span>
          <span class="about-value">XianTu (仙途)</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { aiService } from '@/services/aiService';
import type { AIConfig, AIMode } from '@/services/aiService';
import type { BridgeStatus } from '@/services/tavernBridge';
import { useUIStore } from '@/stores/uiStore';

// ===== Store =====
const uiStore = useUIStore();

// ===== 游戏设置存储键 =====
const GAME_SETTINGS_KEY = 'game_settings';

// ===== API配置 =====
const apiConfig = reactive<AIConfig>({
  mode: 'custom',
  apiUrl: '',
  apiKey: '',
  model: 'gpt-4o',
  streaming: true,
  useSeparateSummaryApi: false,
  summaryApiUrl: '',
  summaryApiKey: '',
  summaryModel: '',
});

const showApiKey = ref(false);
const showSummaryApiKey = ref(false);
const isTesting = ref(false);
const testResult = ref<{ success: boolean; message: string } | null>(null);

// ===== 模型列表 =====
const modelList = ref<string[]>([]);
const showModelSelect = ref(false);
const isFetchingModels = ref(false);
const modelListError = ref('');

// ===== 酒馆状态 =====
const tavernStatus = ref<BridgeStatus | null>(null);
const isCheckingTavern = ref(false);
const tavernStatusMessage = ref('未检测');

// ===== 游戏设置 =====
interface GameSettings {
  autoSave: boolean;
  historyLimit: number;
  theme: 'dark' | 'light';
}

const gameSettings = reactive<GameSettings>({
  autoSave: true,
  historyLimit: 20,
  theme: 'dark',
});

// ===== 计算属性 =====

/** 模式徽章样式 */
const modeBadgeClass = computed(() => {
  if (apiConfig.mode === 'tavern') {
    return tavernStatus.value?.connected ? 'badge-success' : 'badge-warning';
  }
  if (!apiConfig.apiUrl || !apiConfig.apiKey) return 'badge-warning';
  return 'badge-success';
});

/** 模式徽章文本 */
const modeBadgeText = computed(() => {
  if (apiConfig.mode === 'tavern') {
    return tavernStatus.value?.connected ? '酒馆已连接' : '酒馆未连接';
  }
  if (!apiConfig.apiUrl) return '未配置';
  if (!apiConfig.apiKey) return '缺少密钥';
  return '已配置';
});

/** 酒馆状态样式 */
const tavernStatusClass = computed(() => {
  if (!tavernStatus.value) return 'status-unknown';
  return tavernStatus.value.connected ? 'status-connected' : 'status-disconnected';
});

/** 连接方式标签 */
const connectionTypeLabel = computed(() => {
  if (!tavernStatus.value?.connectionType) return '';
  const labels: Record<string, string> = {
    st_api: 'ST_API (扩展)',
    tavern_helper: 'TavernHelper (仙途)',
    postmessage: 'PostMessage (跨域)',
  };
  return labels[tavernStatus.value.connectionType] || tavernStatus.value.connectionType;
});

/** API状态样式（网页模式） */
const apiStatusClass = computed(() => {
  if (!apiConfig.apiUrl || !apiConfig.apiKey) return 'badge-warning';
  return 'badge-success';
});

/** API状态文本（网页模式） */
const apiStatusText = computed(() => {
  if (!apiConfig.apiUrl) return '未配置';
  if (!apiConfig.apiKey) return '缺少密钥';
  return '已配置';
});

// ===== 方法 =====

/** 切换运行模式 */
function switchMode(mode: AIMode) {
  apiConfig.mode = mode;
  testResult.value = null;

  if (mode === 'tavern' && !tavernStatus.value) {
    recheckTavern();
  }

  // 立即保存模式切换
  saveApiConfig();
}

/** 重新检测酒馆连接 */
async function recheckTavern() {
  isCheckingTavern.value = true;
  tavernStatusMessage.value = '正在检测...';

  try {
    const status = await aiService.reinitTavern();
    tavernStatus.value = status;

    if (status.connected) {
      tavernStatusMessage.value = `已连接 - ${status.message}`;
    } else {
      tavernStatusMessage.value = status.message || '未检测到酒馆环境';
    }
  } catch (error) {
    tavernStatusMessage.value = `检测失败: ${(error as Error).message}`;
    tavernStatus.value = null;
  } finally {
    isCheckingTavern.value = false;
  }
}

/** 获取模型列表 */
async function fetchModelList() {
  isFetchingModels.value = true;
  modelListError.value = '';

  // 先临时保存配置以便获取
  saveConfigToService();

  try {
    const models = await aiService.getModelList();
    if (models.length === 0) {
      modelListError.value = '未获取到任何模型';
    } else {
      modelList.value = models;
      showModelSelect.value = true;
    }
  } catch (error) {
    modelListError.value = (error as Error).message;
  } finally {
    isFetchingModels.value = false;
  }
}

/** 测试API连接 */
async function testConnection() {
  isTesting.value = true;
  testResult.value = null;

  // 先临时保存配置以便测试
  saveConfigToService();

  try {
    const result = await aiService.checkAvailability();
    testResult.value = {
      success: result.available,
      message: result.message,
    };
  } catch (error) {
    testResult.value = {
      success: false,
      message: `测试失败: ${(error as Error).message}`,
    };
  } finally {
    isTesting.value = false;
  }
}

/** 将当前配置保存到aiService */
function saveConfigToService() {
  aiService.saveConfig({
    mode: apiConfig.mode,
    apiUrl: apiConfig.apiUrl,
    apiKey: apiConfig.apiKey,
    model: apiConfig.model,
    streaming: apiConfig.streaming,
    useSeparateSummaryApi: apiConfig.useSeparateSummaryApi,
    summaryApiUrl: apiConfig.summaryApiUrl,
    summaryApiKey: apiConfig.summaryApiKey,
    summaryModel: apiConfig.summaryModel,
  });
}

/** ���存API配置 */
function saveApiConfig() {
  saveConfigToService();
  uiStore.notify('配置已保存', 'success');
}

/** 保存游戏设置 */
function saveGameSettings() {
  try {
    localStorage.setItem(GAME_SETTINGS_KEY, JSON.stringify({
      autoSave: gameSettings.autoSave,
      historyLimit: gameSettings.historyLimit,
      theme: gameSettings.theme,
    }));
    uiStore.notify('游戏设置已保存', 'success');
  } catch (error) {
    uiStore.notify('保存设置失败', 'error');
    console.error('[SettingsPanel] 保存游戏设置失败:', error);
  }
}

/** 加载游戏设置 */
function loadGameSettings() {
  try {
    const stored = localStorage.getItem(GAME_SETTINGS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as Partial<GameSettings>;
      if (parsed.autoSave !== undefined) gameSettings.autoSave = parsed.autoSave;
      if (parsed.historyLimit !== undefined) gameSettings.historyLimit = parsed.historyLimit;
      if (parsed.theme !== undefined) gameSettings.theme = parsed.theme;
    }
  } catch (error) {
    console.warn('[SettingsPanel] 加载游戏设置失败:', error);
  }
}

// ===== 生命周期 =====
onMounted(async () => {
  // 加载API配置
  const config = aiService.getConfig();
  apiConfig.mode = config.mode;
  apiConfig.apiUrl = config.apiUrl;
  apiConfig.apiKey = config.apiKey;
  apiConfig.model = config.model;
  apiConfig.streaming = config.streaming;
  apiConfig.useSeparateSummaryApi = config.useSeparateSummaryApi;
  apiConfig.summaryApiUrl = config.summaryApiUrl;
  apiConfig.summaryApiKey = config.summaryApiKey;
  apiConfig.summaryModel = config.summaryModel;

  // 加载游戏设置
  loadGameSettings();

  // 如果是酒馆模式，自动检测状态
  if (apiConfig.mode === 'tavern') {
    recheckTavern();
  }
});
</script>

<style scoped>
/* ===== 设置面板 ===== */
.settings-panel {
  max-width: 720px;
  margin: 0 auto;
}

/* ===== 分区 ===== */
.settings-section {
  margin-bottom: 28px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-badge {
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 500;
}

.badge-success {
  background: rgba(0, 255, 136, 0.15);
  color: var(--color-success);
  border: 1px solid rgba(0, 255, 136, 0.3);
}

.badge-warning {
  background: rgba(255, 170, 0, 0.15);
  color: var(--color-warning);
  border: 1px solid rgba(255, 170, 0, 0.3);
}

.badge-muted {
  background: rgba(102, 102, 128, 0.15);
  color: var(--text-muted);
  border: 1px solid rgba(102, 102, 128, 0.3);
}

/* ===== 设置卡片 ===== */
.settings-card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 20px;
}

/* ===== 模式选择器 ===== */
.mode-selector {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.mode-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 16px 12px;
  background: var(--bg-input);
  border: 2px solid var(--border-color);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all var(--transition-normal);
  font-family: var(--font-family);
}

.mode-btn:hover {
  border-color: var(--color-primary);
  background: rgba(0, 212, 255, 0.05);
}

.mode-btn.active {
  border-color: var(--color-primary);
  background: rgba(0, 212, 255, 0.12);
  box-shadow: 0 0 12px rgba(0, 212, 255, 0.15);
}

.mode-icon {
  font-size: 28px;
}

.mode-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.mode-desc {
  font-size: 11px;
  color: var(--text-muted);
  text-align: center;
}

/* ===== 酒馆状态 ===== */
.tavern-status-area {
  margin-top: 4px;
}

.tavern-status {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-radius: var(--radius-md);
  font-size: 13px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.status-connected {
  background: rgba(0, 255, 136, 0.1);
  border: 1px solid rgba(0, 255, 136, 0.3);
  color: var(--color-success);
}

.status-connected .status-dot,
.status-dot.status-connected {
  background: var(--color-success);
  box-shadow: 0 0 6px rgba(0, 255, 136, 0.5);
}

.status-disconnected {
  background: rgba(255, 170, 0, 0.1);
  border: 1px solid rgba(255, 170, 0, 0.3);
  color: var(--color-warning);
}

.status-disconnected .status-dot,
.status-dot.status-disconnected {
  background: var(--color-warning);
  box-shadow: 0 0 6px rgba(255, 170, 0, 0.5);
}

.status-unknown {
  background: rgba(102, 102, 128, 0.1);
  border: 1px solid rgba(102, 102, 128, 0.3);
  color: var(--text-muted);
}

.status-dot.status-unknown {
  background: var(--text-muted);
}

.tavern-info {
  margin-top: 10px;
  padding: 10px 14px;
  background: rgba(0, 0, 0, 0.15);
  border-radius: var(--radius-md);
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
}

.info-row + .info-row {
  border-top: 1px solid rgba(42, 42, 64, 0.5);
}

.info-label {
  font-size: 12px;
  color: var(--text-muted);
}

.info-value {
  font-size: 12px;
  color: var(--text-primary);
  font-weight: 500;
}

/* ===== 密码输入框 ===== */
.password-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.password-input-wrapper .input {
  padding-right: 44px;
}

.toggle-visibility-btn {
  position: absolute;
  right: 8px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 18px;
  padding: 4px;
  opacity: 0.7;
  transition: opacity var(--transition-fast);
}

.toggle-visibility-btn:hover {
  opacity: 1;
}

/* ===== 模型输入行 ===== */
.model-input-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.model-input-row .input,
.model-input-row .select {
  flex: 1;
}

.fetch-models-btn {
  white-space: nowrap;
  flex-shrink: 0;
  height: 40px;
}

.link-btn {
  background: none;
  border: none;
  color: var(--color-primary);
  cursor: pointer;
  font-size: 12px;
  padding: 0;
  margin-left: 4px;
  text-decoration: underline;
  font-family: var(--font-family);
}

.link-btn:hover {
  color: var(--color-primary-light);
}

/* ===== 开关 ===== */
.switch-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.switch-info {
  flex: 1;
}

.switch {
  position: relative;
  display: inline-block;
  width: 48px;
  height: 26px;
  flex-shrink: 0;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.switch-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--bg-input);
  border: 1px solid var(--border-color);
  border-radius: 26px;
  transition: all var(--transition-normal);
}

.switch-slider::before {
  content: '';
  position: absolute;
  height: 20px;
  width: 20px;
  left: 2px;
  bottom: 2px;
  background: var(--text-muted);
  border-radius: 50%;
  transition: all var(--transition-normal);
}

.switch input:checked + .switch-slider {
  background: rgba(0, 212, 255, 0.2);
  border-color: var(--color-primary);
}

.switch input:checked + .switch-slider::before {
  transform: translateX(22px);
  background: var(--color-primary);
}

/* ===== 分割线 ===== */
.divider {
  height: 1px;
  background: var(--border-color);
  margin: 16px 0;
}

/* ===== 滑块 ===== */
.slider-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
}

.slider-min,
.slider-max {
  font-size: 12px;
  color: var(--text-muted);
  min-width: 20px;
  text-align: center;
}

.slider {
  flex: 1;
  -webkit-appearance: none;
  appearance: none;
  height: 6px;
  background: var(--bg-input);
  border-radius: 3px;
  outline: none;
  cursor: pointer;
}

.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--color-primary);
  cursor: pointer;
  border: 2px solid var(--bg-primary);
  box-shadow: 0 0 6px rgba(0, 212, 255, 0.3);
  transition: all var(--transition-fast);
}

.slider::-webkit-slider-thumb:hover {
  transform: scale(1.2);
  box-shadow: 0 0 10px rgba(0, 212, 255, 0.5);
}

.slider::-moz-range-thumb {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--color-primary);
  cursor: pointer;
  border: 2px solid var(--bg-primary);
}

/* ===== 主题选择器 ===== */
.theme-selector {
  display: flex;
  gap: 8px;
}

.theme-btn {
  padding: 6px 14px;
  background: var(--bg-input);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  font-size: 13px;
  font-family: var(--font-family);
  cursor: pointer;
  transition: all var(--transition-normal);
}

.theme-btn.active {
  background: rgba(0, 212, 255, 0.15);
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.theme-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* ===== 操作按钮 ===== */
.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid var(--border-color);
}

.btn-loading {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid var(--border-color);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ===== 测试结果 ===== */
.test-result {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  padding: 10px 14px;
  border-radius: var(--radius-md);
  font-size: 13px;
  animation: fadeIn 0.3s ease;
}

.result-success {
  background: rgba(0, 255, 136, 0.1);
  border: 1px solid rgba(0, 255, 136, 0.3);
  color: var(--color-success);
}

.result-error {
  background: rgba(255, 68, 68, 0.1);
  border: 1px solid rgba(255, 68, 68, 0.3);
  color: var(--color-danger);
}

.result-icon {
  font-size: 16px;
}

/* ===== 关于卡片 ===== */
.about-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.about-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 0;
  border-bottom: 1px solid rgba(42, 42, 64, 0.5);
}

.about-item:last-child {
  border-bottom: none;
}

.about-label {
  font-size: 13px;
  color: var(--text-muted);
}

.about-value {
  font-size: 13px;
  color: var(--text-primary);
  font-weight: 500;
}
</style>
