<!--
  AI游戏开发商模拟器 - 开始页面
  游戏入口，提供新游戏、继续游戏、设置选项
-->
<template>
  <div class="start-page">
    <!-- 背景装饰 -->
    <div class="bg-grid"></div>
    <div class="bg-glow"></div>

    <!-- 主内容 -->
    <div class="start-content">
      <!-- 标题区域 -->
      <div class="title-section">
        <div class="title-icon">🎮</div>
        <h1 class="game-title">AI游戏开发商</h1>
        <p class="game-subtitle">用AI的力量，打造属于你的游戏帝国</p>
        <div class="title-divider"></div>
        <p class="game-desc">
          从一间小小的居民楼开始，招募员工、开发游戏、运营社区，<br />
          最终成为业界传奇的游戏开发商。
        </p>
      </div>

      <!-- 按钮区域 -->
      <div class="button-section">
        <button class="start-btn primary" @click="startNewGame">
          <span class="btn-icon">🚀</span>
          <span class="btn-text">新游戏</span>
          <span class="btn-hint">创建你的游戏公司</span>
        </button>

        <button
          class="start-btn secondary"
          :class="{ disabled: !hasSaveData }"
          :disabled="!hasSaveData"
          @click="continueGame"
        >
          <span class="btn-icon">📂</span>
          <div>
            <span class="btn-text">继续游戏</span>
            <span class="btn-hint" v-if="autoSaveInfo">
              {{ autoSaveInfo.companyName }} · {{ autoSaveInfo.gameTime }} · {{ autoSaveInfo.funds }}
              <br />保存于 {{ autoSaveInfo.lastSaveTime }}
            </span>
            <span class="btn-hint" v-else>{{ hasSaveData ? '加载上次存档' : '暂无存档' }}</span>
          </div>
        </button>

        <button class="start-btn ghost" @click="openSettings">
          <span class="btn-icon">⚙️</span>
          <span class="btn-text">设置</span>
          <span class="btn-hint">API配置与偏好</span>
        </button>
      </div>

      <!-- 底部信息 -->
      <div class="footer-info">
        <span>v1.0.0</span>
        <span>·</span>
        <span>Powered by AI</span>
      </div>
    </div>

    <!-- 设置弹窗 -->
    <transition name="modal">
      <div v-if="showSettingsModal" class="modal-overlay" @click.self="closeSettings">
        <div class="modal-content">
          <div class="modal-header">
            <h3>⚙️ 设置</h3>
            <button class="modal-close" @click="closeSettings">✕</button>
          </div>
          <div class="modal-body">
            <!-- 运行模式选择 -->
            <div class="form-group">
              <label class="form-label">运行模式</label>
              <div class="mode-selector">
                <button
                  class="mode-btn"
                  :class="{ active: settingsForm.mode === 'tavern' }"
                  @click="settingsForm.mode = 'tavern'"
                >
                  <span class="mode-icon">🍺</span>
                  <span class="mode-text">酒馆模式</span>
                </button>
                <button
                  class="mode-btn"
                  :class="{ active: settingsForm.mode === 'custom' }"
                  @click="settingsForm.mode = 'custom'"
                >
                  <span class="mode-icon">🌐</span>
                  <span class="mode-text">网页模式</span>
                </button>
              </div>
            </div>

            <!-- 酒馆模式提示 -->
            <template v-if="settingsForm.mode === 'tavern'">
              <div class="tavern-hint">
                <div class="tavern-hint-icon">ℹ️</div>
                <div class="tavern-hint-text">
                  酒馆模式将使用SillyTavern的预设和API配置进行AI生成。
                  请确保在SillyTavern中已正确配置API和预设。
                  <br /><br />
                  进入游戏后可在设置面板中查看详细连接状态。
                </div>
              </div>
            </template>

            <!-- 网页模式API配置 -->
            <template v-if="settingsForm.mode === 'custom'">
              <!-- API地址 -->
              <div class="form-group">
                <label class="form-label">API 地址</label>
                <input
                  v-model="settingsForm.apiUrl"
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
                    v-model="settingsForm.apiKey"
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
                <div class="form-hint">密钥安全存储在本地浏览器中</div>
              </div>

              <!-- 模型名称 -->
              <div class="form-group">
                <label class="form-label">模型名称</label>
                <input
                  v-model="settingsForm.model"
                  type="text"
                  class="input"
                  placeholder="gpt-4o"
                />
                <div class="form-hint">如 gpt-4o、claude-3-opus 等</div>
              </div>

              <!-- 流式传输 -->
              <div class="form-group">
                <div class="switch-row">
                  <div class="switch-info">
                    <label class="form-label" style="margin-bottom: 0;">流式传输</label>
                    <div class="form-hint" style="margin-top: 2px;">启用后AI回复将逐字显示</div>
                  </div>
                  <label class="switch">
                    <input type="checkbox" v-model="settingsForm.streaming" />
                    <span class="switch-slider"></span>
                  </label>
                </div>
              </div>
            </template>
          </div>
          <div class="modal-footer">
            <button class="btn btn-ghost" @click="closeSettings">取消</button>
            <button class="btn btn-primary" @click="saveSettings">💾 保存配置</button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { aiService } from '@/services/aiService';
import type { AIMode } from '@/services/aiService';
import { useGameStateStore } from '@/stores/gameStateStore';
import type { SaveData } from '@/types/game.d';

const router = useRouter();
const gameState = useGameStateStore();

// 检查是否有存档数据（后续从localStorage或IndexedDB读取）
const hasSaveData = ref(false);
const autoSaveInfo = ref<{
  companyName: string;
  gameTime: string;
  funds: string;
  lastSaveTime: string;
} | null>(null);

// 设置弹窗状态
const showSettingsModal = ref(false);
const showApiKey = ref(false);
const settingsForm = reactive<{
  mode: AIMode;
  apiUrl: string;
  apiKey: string;
  model: string;
  streaming: boolean;
}>({
  mode: 'custom',
  apiUrl: '',
  apiKey: '',
  model: 'gpt-4o',
  streaming: true,
});

/** 开始新游戏 */
function startNewGame() {
  router.push('/creation');
}

/** 继续游戏 */
function continueGame() {
  if (!hasSaveData.value) return;
  try {
    const savedStr = localStorage.getItem('game_auto_save');
    if (savedStr) {
      const saveData: SaveData = JSON.parse(savedStr);
      gameState.loadFromSaveData(saveData);
      router.push('/game');
    }
  } catch (error) {
    console.error('[StartPage] 加载存档失败:', error);
  }
}

/** 打开设置弹窗 */
function openSettings() {
  // 加载当前配置
  const config = aiService.getConfig();
  settingsForm.mode = config.mode;
  settingsForm.apiUrl = config.apiUrl;
  settingsForm.apiKey = config.apiKey;
  settingsForm.model = config.model;
  settingsForm.streaming = config.streaming;
  showSettingsModal.value = true;
}

/** 关闭设置弹窗 */
function closeSettings() {
  showSettingsModal.value = false;
}

/** 保存设置 */
function saveSettings() {
  aiService.saveConfig({
    mode: settingsForm.mode,
    apiUrl: settingsForm.apiUrl,
    apiKey: settingsForm.apiKey,
    model: settingsForm.model,
    streaming: settingsForm.streaming,
  });
  showSettingsModal.value = false;
}

// 检查本地存档
function checkSaveData() {
  try {
    // 优先检查自动存档
    const autoSaved = localStorage.getItem('game_auto_save');
    if (autoSaved) {
      const data: SaveData = JSON.parse(autoSaved);
      hasSaveData.value = true;
      const t = data.元数据?.时间;
      const funds = data.公司?.财务?.资金 ?? 0;
      const fundsStr = funds >= 10000 ? (funds / 10000).toFixed(1) + '万' : funds.toLocaleString();
      autoSaveInfo.value = {
        companyName: data.公司?.基本信息?.名称 ?? '未知公司',
        gameTime: t ? `${t.年}年${t.月}月${t.日}日` : '未知',
        funds: '¥' + fundsStr,
        lastSaveTime: data.元数据?.更新时间
          ? new Date(data.元数据.更新时间).toLocaleString('zh-CN')
          : '未知',
      };
      return;
    }
    // 兼容旧存档key
    const saved = localStorage.getItem('game-dev-tycoon-save');
    hasSaveData.value = !!saved;
  } catch {
    hasSaveData.value = false;
  }
}

checkSaveData();
</script>

<style scoped>
.start-page {
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-primary);
  position: relative;
  overflow: hidden;
}

/* 背景网格 */
.bg-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(0, 212, 255, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 212, 255, 0.03) 1px, transparent 1px);
  background-size: 40px 40px;
  pointer-events: none;
}

/* 背景发光 */
.bg-glow {
  position: absolute;
  top: 30%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 600px;
  height: 600px;
  background: radial-gradient(circle, rgba(0, 212, 255, 0.08) 0%, transparent 70%);
  pointer-events: none;
}

/* 主内容 */
.start-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 40px;
  z-index: 1;
  animation: slideUp 0.6s ease;
}

/* 标题区域 */
.title-section {
  text-align: center;
}

.title-icon {
  font-size: 64px;
  margin-bottom: 16px;
  animation: pulse 3s infinite;
}

.game-title {
  font-size: 48px;
  font-weight: 800;
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-light), #fff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: 4px;
  margin-bottom: 12px;
}

.game-subtitle {
  font-size: 18px;
  color: var(--text-secondary);
  letter-spacing: 2px;
}

.title-divider {
  width: 80px;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--color-primary), transparent);
  margin: 20px auto;
}

.game-desc {
  font-size: 14px;
  color: var(--text-muted);
  line-height: 1.8;
}

/* 按钮区域 */
.button-section {
  display: flex;
  flex-direction: column;
  gap: 14px;
  width: 320px;
}

.start-btn {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 24px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  background: var(--bg-card);
  cursor: pointer;
  transition: all var(--transition-normal);
  text-align: left;
  font-family: var(--font-family);
}

.start-btn:hover:not(.disabled) {
  transform: translateX(4px);
  border-color: var(--border-color-light);
  box-shadow: var(--shadow-md);
}

.start-btn.primary {
  border-color: rgba(0, 212, 255, 0.3);
  background: linear-gradient(135deg, rgba(0, 212, 255, 0.08), rgba(0, 212, 255, 0.02));
}

.start-btn.primary:hover {
  border-color: var(--color-primary);
  box-shadow: var(--shadow-glow);
}

.start-btn.disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.btn-icon {
  font-size: 28px;
  flex-shrink: 0;
}

.btn-text {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  display: block;
}

.btn-hint {
  font-size: 12px;
  color: var(--text-muted);
  display: block;
  margin-top: 2px;
}

/* 底部信息 */
.footer-info {
  display: flex;
  gap: 8px;
  font-size: 12px;
  color: var(--text-muted);
  opacity: 0.5;
}

/* ===== 设置弹窗 ===== */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.modal-content {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-xl);
  width: 480px;
  max-width: 90vw;
  max-height: 85vh;
  overflow-y: auto;
  box-shadow: var(--shadow-lg), var(--shadow-glow);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 24px;
  border-bottom: 1px solid var(--border-color);
}

.modal-header h3 {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
}

.modal-close {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  color: var(--text-muted);
  font-size: 16px;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.modal-close:hover {
  border-color: var(--color-danger);
  color: var(--color-danger);
  background: rgba(255, 68, 68, 0.1);
}

.modal-body {
  padding: 20px 24px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid var(--border-color);
}

/* ===== 模式选择器 ===== */
.mode-selector {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.mode-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 14px;
  background: var(--bg-input);
  border: 2px solid var(--border-color);
  border-radius: var(--radius-md);
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
  box-shadow: 0 0 8px rgba(0, 212, 255, 0.15);
}

.mode-icon {
  font-size: 22px;
}

.mode-text {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}

/* ===== 酒馆提示 ===== */
.tavern-hint {
  display: flex;
  gap: 10px;
  padding: 14px;
  background: rgba(0, 212, 255, 0.06);
  border: 1px solid rgba(0, 212, 255, 0.2);
  border-radius: var(--radius-md);
  margin-top: 4px;
}

.tavern-hint-icon {
  font-size: 18px;
  flex-shrink: 0;
  margin-top: 1px;
}

.tavern-hint-text {
  font-size: 12px;
  color: var(--text-secondary);
  line-height: 1.6;
}

/* 密码输入框 */
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

/* 开关 */
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

/* 弹窗过渡动画 */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}
.modal-enter-active .modal-content,
.modal-leave-active .modal-content {
  transition: transform 0.2s ease, opacity 0.2s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
.modal-enter-from .modal-content,
.modal-leave-to .modal-content {
  transform: scale(0.95) translateY(10px);
  opacity: 0;
}

/* 响应式 */
@media (max-width: 768px) {
  .game-title {
    font-size: 32px;
  }

  .button-section {
    width: 280px;
  }
}
</style>
