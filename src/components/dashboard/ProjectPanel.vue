<!--
  AI游戏开发商模拟器 - 项目管理面板
  开发中项目和已发布游戏管理
-->
<template>
  <div class="panel-container">
    <h2 class="panel-title">🎮 项目管理</h2>

    <!-- Tab切换 -->
    <div class="tab-bar">
      <button
        class="tab-btn"
        :class="{ active: activeTab === 'developing' }"
        @click="activeTab = 'developing'"
      >
        🔧 开发中项目
        <span class="tab-count" v-if="developingProjects.length > 0">{{ developingProjects.length }}</span>
      </button>
      <button
        class="tab-btn"
        :class="{ active: activeTab === 'published' }"
        @click="activeTab = 'published'"
      >
        🏆 已发布游戏
        <span class="tab-count" v-if="publishedGames.length > 0">{{ publishedGames.length }}</span>
      </button>
    </div>

    <!-- 开发中项目 -->
    <div v-if="activeTab === 'developing'">
      <!-- 空状态 -->
      <div v-if="developingProjects.length === 0" class="empty-state">
        <div class="empty-icon">🎯</div>
        <div class="empty-text">暂无开发中的项目</div>
        <p class="empty-hint">在主游戏面板中通过AI对话立项新游戏</p>
        <button class="btn btn-primary" @click="navigateToMainWithMessage('我想立项一个新游戏')">
          前往立项
        </button>
      </div>

      <!-- 项目列表 -->
      <div v-else class="project-list">
        <div
          v-for="project in developingProjects"
          :key="project.ID"
          class="project-card card"
          :class="{ 'is-focus': gameState.focusProject === project.ID }"
        >
          <!-- 项目头部 -->
          <div class="proj-header">
            <div class="proj-title-row">
              <span class="proj-icon">🎯</span>
              <span class="proj-name">{{ project.名称 }}</span>
              <span v-if="gameState.focusProject === project.ID" class="badge badge-warning">⭐ 重点关注</span>
            </div>
            <div class="proj-meta">
              <span>类型: {{ project.类型 }}</span>
              <span v-if="project.子类型?.length">· {{ project.子类型.join(', ') }}</span>
              <span>| 平台: {{ project.平台?.join(', ') || '未定' }}</span>
            </div>
          </div>

          <!-- 开发阶段步骤指示器 -->
          <div class="stage-indicator">
            <div
              v-for="(stage, idx) in devStages"
              :key="stage"
              class="stage-step"
              :class="{
                completed: stageIndex(project.开发阶段) > idx,
                current: stageIndex(project.开发阶段) === idx,
              }"
            >
              <div class="stage-dot"></div>
              <span class="stage-label">{{ stage }}</span>
            </div>
          </div>

          <!-- 开发进度 -->
          <div class="proj-progress">
            <div class="progress-title">📊 开发进度</div>
            <div class="progress-grid">
              <div v-for="(value, key) in project.进度" :key="key" class="progress-item">
                <div class="progress-header">
                  <span class="progress-name">{{ key }}</span>
                  <span class="progress-pct">{{ value }}%</span>
                </div>
                <div class="progress-bar">
                  <div
                    class="progress-bar-fill"
                    :class="progressClass(value as number)"
                    :style="{ width: (value as number) + '%' }"
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <!-- 质量评估 -->
          <div class="proj-quality">
            <div class="quality-title">⭐ 质量评估</div>
            <div class="quality-grid">
              <div v-for="(value, key) in project.质量" :key="key" class="quality-item">
                <span class="quality-name">{{ key }}</span>
                <span class="quality-value" :class="qualityClass(value as number)">{{ value }}</span>
              </div>
            </div>
          </div>

          <!-- 预算和团队 -->
          <div class="proj-info">
            <div class="info-row">
              <span class="info-label">💰 预算</span>
              <span class="info-value">
                ¥{{ formatMoney(project.预算) }} / 已花费: ¥{{ formatMoney(project.已花费) }}
                <span class="budget-pct" :class="budgetClass(project)">
                  ({{ budgetPercent(project) }}%)
                </span>
              </span>
            </div>
            <div class="info-row" v-if="project.预计发布日期">
              <span class="info-label">📅 预计发布</span>
              <span class="info-value">{{ formatGameTime(project.预计发布日期) }}</span>
            </div>
            <div class="info-row" v-if="project.参与人员?.length">
              <span class="info-label">👥 团队</span>
              <span class="info-value">
                {{ project.参与人员.join('、') }} ({{ project.参与人员.length }}人)
              </span>
            </div>
            <div class="info-row" v-if="project.目标受众">
              <span class="info-label">🎯 目标受众</span>
              <span class="info-value">{{ project.目标受众 }}</span>
            </div>
            <div class="info-row" v-if="project.核心玩法描述">
              <span class="info-label">🎮 核心玩法</span>
              <span class="info-value">{{ project.核心玩法描述 }}</span>
            </div>
          </div>

          <!-- 开发日志 -->
          <div class="proj-logs" v-if="project.开发日志?.length">
            <details class="logs-details">
              <summary class="logs-summary">📝 开发日志 ({{ project.开发日志.length }}条)</summary>
              <div class="logs-list">
                <div v-for="(log, idx) in project.开发日志.slice(-5)" :key="idx" class="log-item">
                  {{ log }}
                </div>
              </div>
            </details>
          </div>

          <!-- 操作按钮 -->
          <div class="proj-actions">
            <button
              v-if="gameState.focusProject !== project.ID"
              class="btn btn-sm btn-gold"
              @click="setFocusProject(project.ID)"
            >
              ⭐ 设为重点关注
            </button>
            <button
              v-else
              class="btn btn-sm btn-ghost"
              @click="setFocusProject(null)"
            >
              取消重点关注
            </button>
            <button class="btn btn-sm btn-ghost" @click="navigateToMainWithMessage('关于项目【' + project.名称 + '】的进展如何？')">
              📋 查看进展
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 已发布游戏 -->
    <div v-if="activeTab === 'published'">
      <!-- 空状态 -->
      <div v-if="publishedGames.length === 0" class="empty-state">
        <div class="empty-icon">🏆</div>
        <div class="empty-text">暂无已发布的游戏</div>
        <p class="empty-hint">完成开发中的项目后，游戏将出现在这里</p>
      </div>

      <!-- 已发布游戏列表 -->
      <div v-else class="project-list">
        <div
          v-for="game in publishedGames"
          :key="game.ID"
          class="published-card card"
        >
          <!-- 游戏头部 -->
          <div class="pub-header">
            <div class="pub-title-row">
              <span class="pub-icon">🏆</span>
              <span class="pub-name">{{ game.名称 }}</span>
              <span class="pub-status" :class="opStatusClass(game.运营状态)">
                {{ opStatusIcon(game.运营状态) }} {{ game.运营状态 }}
              </span>
            </div>
            <div class="pub-meta">
              <span>类型: {{ game.类型 }}</span>
              <span>| 发布: {{ formatGameTime(game.发布日期) }}</span>
              <span v-if="game.发布平台?.length">| 平台: {{ game.发布平台.join(', ') }}</span>
            </div>
          </div>

          <!-- 核心数据 -->
          <div class="pub-stats">
            <div class="pub-stat">
              <span class="pub-stat-label">评分</span>
              <span class="pub-stat-value text-gold">
                {{ formatRating(game.评分) }}
              </span>
            </div>
            <div class="pub-stat">
              <span class="pub-stat-label">销量</span>
              <span class="pub-stat-value text-primary">{{ formatCount(game.销量) }}</span>
            </div>
            <div class="pub-stat">
              <span class="pub-stat-label">总收入</span>
              <span class="pub-stat-value text-success">¥{{ formatMoney(game.总收入) }}</span>
            </div>
            <div class="pub-stat">
              <span class="pub-stat-label">在线人数</span>
              <span class="pub-stat-value text-primary">{{ formatCount(game.当前在线人数) }}</span>
            </div>
          </div>

          <!-- 热度 -->
          <div class="pub-heat">
            <span class="heat-label">热度</span>
            <div class="progress-bar">
              <div
                class="progress-bar-fill"
                :class="heatClass(game.热度 ?? 0)"
                :style="{ width: (game.热度 ?? 0) + '%' }"
              ></div>
            </div>
            <span class="heat-value">{{ game.热度 ?? 0 }}%</span>
            <span class="heat-trend" v-if="game.口碑趋势">
              {{ trendIcon(game.口碑趋势) }}
            </span>
          </div>

          <!-- DLC列表 -->
          <div class="pub-dlc" v-if="game.DLC列表?.length">
            <div class="dlc-title">📦 DLC</div>
            <div class="dlc-list">
              <div v-for="dlc in game.DLC列表" :key="dlc.ID" class="dlc-item">
                <span class="dlc-name">{{ dlc.名称 }}</span>
                <span class="dlc-price">¥{{ dlc.定价 }}</span>
                <span class="dlc-sales">销量: {{ formatCount(dlc.销量) }}</span>
              </div>
            </div>
          </div>

          <!-- 更新历史 -->
          <div class="pub-updates" v-if="game.更新历史?.length">
            <details class="updates-details">
              <summary class="updates-summary">📝 更新历史 ({{ game.更新历史.length }}条)</summary>
              <div class="updates-list">
                <div v-for="update in game.更新历史.slice(-5).reverse()" :key="update.版本号" class="update-item">
                  <span class="update-version">{{ update.版本号 }}</span>
                  <span class="update-content">{{ update.更新内容 }}</span>
                  <span class="update-date">{{ formatGameTime(update.发布日期) }}</span>
                </div>
              </div>
            </details>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部提示 -->
    <div class="bottom-hint card">
      <span>💡 提示：在主游戏面板中通过AI对话立项新游戏</span>
      <button class="btn btn-sm btn-primary" @click="navigateToMainWithMessage('我想立项一个新游戏')">
        前往立项
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useGameStateStore } from '@/stores/gameStateStore';
import { useUIStore } from '@/stores/uiStore';
import type { GameProject, PublishedGame, GameTime, GameRating } from '@/types/game';

const router = useRouter();
const gameState = useGameStateStore();
const uiStore = useUIStore();

const activeTab = ref<'developing' | 'published'>('developing');

// 开发阶段列表
const devStages = ['立项', '预制作', '制作', 'Alpha', 'Beta', '打磨', '已完成'] as const;

// 开发中项目列表
const developingProjects = computed<GameProject[]>(() => {
  if (!gameState.currentProjects) return [];
  return Object.values(gameState.currentProjects);
});

// 已发布游戏列表
const publishedGames = computed<PublishedGame[]>(() => {
  if (!gameState.publishedGames) return [];
  return Object.values(gameState.publishedGames);
});

// 阶段索引
function stageIndex(stage: string): number {
  return devStages.indexOf(stage as typeof devStages[number]);
}

// 进度条颜色
function progressClass(value: number): string {
  if (value >= 80) return 'success';
  if (value >= 40) return '';
  return 'warning';
}

// 质量颜色
function qualityClass(value: number): string {
  if (value >= 80) return 'text-success';
  if (value >= 60) return 'text-primary';
  if (value >= 40) return 'text-warning';
  return 'text-danger';
}

// 预算百分比
function budgetPercent(project: GameProject): number {
  if (!project.预算) return 0;
  return Math.round(((project.已花费 ?? 0) / project.预算) * 100);
}

function budgetClass(project: GameProject): string {
  const pct = budgetPercent(project);
  if (pct >= 90) return 'text-danger';
  if (pct >= 70) return 'text-warning';
  return 'text-success';
}

// 运营状态
function opStatusClass(status: string): string {
  switch (status) {
    case '活跃运营': return 'op-active';
    case '维护模式': return 'op-maintain';
    case '停运': return 'op-stopped';
    default: return '';
  }
}

function opStatusIcon(status: string): string {
  switch (status) {
    case '活跃运营': return '🟢';
    case '维护模式': return '🟡';
    case '停运': return '🔴';
    default: return '⚪';
  }
}

// 热度颜色
function heatClass(heat: number): string {
  if (heat >= 70) return 'danger';
  if (heat >= 40) return 'warning';
  return '';
}

// 口碑趋势图标
function trendIcon(trend: string): string {
  switch (trend) {
    case '上升': return '📈';
    case '稳定': return '➡️';
    case '下降': return '📉';
    default: return '';
  }
}

// 格式化评分
function formatRating(rating: GameRating): string {
  if (!rating) return 'N/A';
  // 取各评分的平均值
  const values = [rating.steam好评率, rating.wegame评分, rating.媒体评分, rating.玩家口碑].filter(v => v > 0);
  if (values.length === 0) return 'N/A';
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  return avg.toFixed(1);
}

// 格式化数量
function formatCount(num: number | undefined | null): string {
  if (num === undefined || num === null || isNaN(num)) return '0';
  if (num >= 100000000) return (num / 100000000).toFixed(1) + '亿';
  if (num >= 10000) return (num / 10000).toFixed(1) + '万';
  return num.toLocaleString('zh-CN');
}

// 格式化金额
function formatMoney(amount: number | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) return '0';
  const abs = Math.abs(amount);
  if (abs >= 100000000) return (amount / 100000000).toFixed(1) + '亿';
  if (abs >= 10000) return (amount / 10000).toFixed(1) + '万';
  return amount.toLocaleString('zh-CN');
}

// 格式化游戏时间
function formatGameTime(time: GameTime | null | undefined): string {
  if (!time) return '未定';
  return `${time.年}年${time.月}月${time.日}日`;
}

// 设置重点关注项目
function setFocusProject(projectId: string | null) {
  gameState.updateState('focusProject', projectId);
}

// 跳转到主面板并预填消息
function navigateToMainWithMessage(message: string) {
  uiStore.pendingMessage = message;
  uiStore.setCurrentPanel('GameMain');
  router.push('/game');
}
</script>

<style scoped>
/* Tab栏 */
.tab-bar {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border-color);
}

.tab-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 18px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--text-secondary);
  font-size: 14px;
  cursor: pointer;
  transition: all var(--transition-fast);
  font-family: var(--font-family);
}

.tab-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.tab-btn.active {
  background: rgba(0, 212, 255, 0.12);
  border-color: var(--color-primary);
  color: var(--color-primary);
  font-weight: 600;
}

.tab-count {
  font-size: 11px;
  background: rgba(0, 212, 255, 0.15);
  padding: 1px 6px;
  border-radius: 10px;
  color: var(--color-primary);
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  gap: 12px;
}

.empty-icon {
  font-size: 64px;
  opacity: 0.4;
}

.empty-text {
  font-size: 18px;
  color: var(--text-secondary);
  font-weight: 600;
}

.empty-hint {
  font-size: 13px;
  color: var(--text-muted);
  margin-bottom: 8px;
}

/* 项目列表 */
.project-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 20px;
}

/* 开发中项目卡片 */
.project-card {
  padding: 16px;
}

.project-card.is-focus {
  border-color: rgba(255, 170, 0, 0.4);
  box-shadow: 0 0 12px rgba(255, 170, 0, 0.1);
}

.proj-header {
  margin-bottom: 14px;
}

.proj-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 4px;
}

.proj-icon {
  font-size: 20px;
}

.proj-name {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
}

.proj-meta {
  font-size: 13px;
  color: var(--text-secondary);
}

/* 阶段指示器 */
.stage-indicator {
  display: flex;
  align-items: center;
  gap: 0;
  margin-bottom: 16px;
  padding: 10px;
  background: var(--bg-tertiary);
  border-radius: var(--radius-md);
  overflow-x: auto;
}

.stage-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  flex: 1;
  position: relative;
  min-width: 60px;
}

.stage-step::after {
  content: '';
  position: absolute;
  top: 8px;
  left: 50%;
  width: 100%;
  height: 2px;
  background: var(--border-color);
  z-index: 0;
}

.stage-step:last-child::after {
  display: none;
}

.stage-step.completed::after {
  background: var(--color-success);
}

.stage-step.current::after {
  background: linear-gradient(90deg, var(--color-primary), var(--border-color));
}

.stage-dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--bg-input);
  border: 2px solid var(--border-color);
  z-index: 1;
  transition: all var(--transition-fast);
}

.stage-step.completed .stage-dot {
  background: var(--color-success);
  border-color: var(--color-success);
}

.stage-step.current .stage-dot {
  background: var(--color-primary);
  border-color: var(--color-primary);
  box-shadow: 0 0 8px rgba(0, 212, 255, 0.4);
}

.stage-label {
  font-size: 11px;
  color: var(--text-muted);
  white-space: nowrap;
}

.stage-step.completed .stage-label {
  color: var(--color-success);
}

.stage-step.current .stage-label {
  color: var(--color-primary);
  font-weight: 600;
}

/* 开发进度 */
.proj-progress {
  margin-bottom: 12px;
}

.progress-title,
.quality-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-muted);
  margin-bottom: 8px;
}

.progress-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 8px;
}

.progress-item {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.progress-name {
  font-size: 12px;
  color: var(--text-secondary);
}

.progress-pct {
  font-size: 11px;
  color: var(--text-muted);
}

/* 质量评估 */
.proj-quality {
  margin-bottom: 12px;
  padding: 10px;
  background: var(--bg-tertiary);
  border-radius: var(--radius-md);
}

.quality-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.quality-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.quality-name {
  font-size: 12px;
  color: var(--text-secondary);
}

.quality-value {
  font-size: 14px;
  font-weight: 700;
}

/* 项目信息 */
.proj-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 12px;
  padding: 10px;
  background: var(--bg-tertiary);
  border-radius: var(--radius-md);
}

.info-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 13px;
}

.info-label {
  color: var(--text-muted);
  flex-shrink: 0;
  white-space: nowrap;
}

.info-value {
  color: var(--text-secondary);
}

.budget-pct {
  font-size: 12px;
  font-weight: 600;
}

/* 开发日志 */
.proj-logs {
  margin-bottom: 12px;
}

.logs-details,
.updates-details {
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.logs-summary,
.updates-summary {
  padding: 8px 12px;
  font-size: 13px;
  color: var(--text-secondary);
  cursor: pointer;
  background: var(--bg-tertiary);
  user-select: none;
}

.logs-summary:hover,
.updates-summary:hover {
  color: var(--color-primary);
}

.logs-list,
.updates-list {
  padding: 8px 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.log-item {
  font-size: 12px;
  color: var(--text-muted);
  padding: 4px 0;
  border-bottom: 1px solid var(--border-color);
}

.log-item:last-child {
  border-bottom: none;
}

/* 操作按钮 */
.proj-actions {
  display: flex;
  gap: 8px;
  padding-top: 10px;
  border-top: 1px solid var(--border-color);
}

/* 已发布游戏卡片 */
.published-card {
  padding: 16px;
}

.pub-header {
  margin-bottom: 14px;
}

.pub-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 4px;
}

.pub-icon {
  font-size: 20px;
}

.pub-name {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
}

.pub-status {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 10px;
}

.op-active {
  background: rgba(0, 255, 136, 0.1);
  color: var(--color-success);
}

.op-maintain {
  background: rgba(255, 170, 0, 0.1);
  color: var(--color-warning);
}

.op-stopped {
  background: rgba(255, 68, 68, 0.1);
  color: var(--color-danger);
}

.pub-meta {
  font-size: 13px;
  color: var(--text-secondary);
}

/* 核心数据 */
.pub-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 10px;
  margin-bottom: 12px;
  padding: 10px;
  background: var(--bg-tertiary);
  border-radius: var(--radius-md);
}

.pub-stat {
  text-align: center;
}

.pub-stat-label {
  display: block;
  font-size: 11px;
  color: var(--text-muted);
  margin-bottom: 2px;
}

.pub-stat-value {
  font-size: 18px;
  font-weight: 700;
}

/* 热度 */
.pub-heat {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.heat-label {
  font-size: 12px;
  color: var(--text-secondary);
  width: 32px;
  flex-shrink: 0;
}

.heat-value {
  font-size: 12px;
  color: var(--text-muted);
  width: 36px;
  text-align: right;
  flex-shrink: 0;
}

.heat-trend {
  font-size: 14px;
  flex-shrink: 0;
}

/* DLC */
.pub-dlc {
  margin-bottom: 12px;
}

.dlc-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-muted);
  margin-bottom: 6px;
}

.dlc-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.dlc-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 10px;
  background: var(--bg-tertiary);
  border-radius: var(--radius-sm);
  font-size: 13px;
}

.dlc-name {
  color: var(--text-primary);
  flex: 1;
}

.dlc-price {
  color: var(--color-warning);
}

.dlc-sales {
  color: var(--text-muted);
  font-size: 12px;
}

/* 更新历史 */
.pub-updates {
  margin-bottom: 12px;
}

.update-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 0;
  border-bottom: 1px solid var(--border-color);
  font-size: 12px;
}

.update-item:last-child {
  border-bottom: none;
}

.update-version {
  color: var(--color-primary);
  font-weight: 600;
  flex-shrink: 0;
}

.update-content {
  color: var(--text-secondary);
  flex: 1;
}

.update-date {
  color: var(--text-muted);
  flex-shrink: 0;
}

/* 底部提示 */
.bottom-hint {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  font-size: 13px;
  color: var(--text-muted);
}
</style>
