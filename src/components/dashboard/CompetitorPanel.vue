<!--
  AI游戏开发商模拟器 - 竞品分析面板
  行业趋势、世界事件、竞品公司
-->
<template>
  <div class="panel-container">
    <h2 class="panel-title">🏢 竞品分析</h2>

    <!-- 行业趋势 -->
    <div class="trends-section card" v-if="trends.length > 0">
      <div class="section-title">📊 行业趋势</div>
      <div class="trends-list">
        <div v-for="trend in trends" :key="trend.趋势名称" class="trend-item">
          <div class="trend-header">
            <span class="trend-name">{{ trend.趋势名称 }}</span>
            <span class="trend-heat">
              🔥 热度: {{ trend.热度 }}
            </span>
          </div>
          <div class="trend-desc">{{ trend.描述 }}</div>
          <div class="trend-meta">
            <span v-if="trend.预计持续">持续: {{ trend.预计持续 }}</span>
            <span v-if="trend.影响类型?.length">影响: {{ safeJoin(trend.影响类型, '、') }}</span>
          </div>
          <div class="trend-heat-bar">
            <div class="progress-bar">
              <div
                class="progress-bar-fill"
                :class="heatBarClass(trend.热度)"
                :style="{ width: Math.min(trend.热度, 100) + '%' }"
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 世界事件 -->
    <div class="events-section card" v-if="worldEvents.length > 0">
      <div class="section-title">🌍 世界事件</div>
      <div class="events-list">
        <div
          v-for="event in worldEvents"
          :key="event.ID"
          class="event-item"
          :class="'event-' + eventSeverityClass(event.影响等级)"
        >
          <div class="event-header">
            <span class="event-icon">{{ eventTypeIcon(event.类型) }}</span>
            <span class="event-name">{{ event.事件名称 }}</span>
            <span class="event-level badge" :class="eventLevelBadge(event.影响等级)">
              {{ event.影响等级 }}
            </span>
          </div>
          <div class="event-desc">{{ event.事件描述 }}</div>
          <div class="event-meta">
            <span v-if="event.影响">影响: {{ event.影响 }}</span>
            <span v-if="event.持续时间">持续: {{ event.持续时间 }}</span>
            <span class="event-type badge badge-primary">{{ event.类型 }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 竞品公司列表 -->
    <div class="competitors-section card" v-if="competitors.length > 0">
      <div class="section-title">🏢 竞品公司列表</div>
      <div class="competitors-list">
        <div
          v-for="comp in competitors"
          :key="comp.ID"
          class="competitor-card"
        >
          <div class="comp-header">
            <div class="comp-title-row">
              <span class="comp-icon">🏢</span>
              <span class="comp-name">{{ comp.名称 }}</span>
              <span class="comp-scale badge" :class="scaleBadge(comp.规模)">
                {{ comp.规模 }}
              </span>
              <span class="comp-rating badge" :class="ratingBadge(comp.实力评级)">
                {{ comp.实力评级 }}级
              </span>
            </div>
            <div class="comp-meta">
              <span v-if="comp.代表作?.length">代表作: {{ safeJoin(comp.代表作, '、') }}</span>
              <span>知名度: {{ comp.知名度 ?? 0 }}</span>
              <span>关系: {{ relationIcon(comp.与玩家公司关系) }} {{ comp.与玩家公司关系 || '中立' }}</span>
            </div>
          </div>

          <!-- 当前项目 -->
          <div class="comp-current" v-if="comp.当前项目">
            <span class="current-label">🔧 当前项目:</span>
            <span class="current-value">{{ comp.当前项目 }}</span>
          </div>

          <!-- 最近动态 -->
          <div class="comp-dynamics" v-if="comp.最近动态?.length">
            <div class="dynamics-title">最近动态:</div>
            <div class="dynamics-list">
              <div v-for="(dynamic, idx) in comp.最近动态.slice(-3)" :key="idx" class="dynamic-item">
                📌 {{ dynamic }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-if="competitors.length === 0 && trends.length === 0 && worldEvents.length === 0" class="empty-state">
      <div class="empty-icon">🏢</div>
      <div class="empty-text">暂无竞品数据</div>
      <p class="empty-hint">竞品信息将在游戏进行中由AI动态生成</p>
    </div>

    <!-- 底部提示 -->
    <div class="bottom-hint card">
      <span>💡 竞品信息由AI根据游戏进程动态生成</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useGameStateStore } from '@/stores/gameStateStore';
import type { CompetitorCompany, IndustryTrend, WorldEvent } from '@/types/game';

const gameState = useGameStateStore();

/** 安全的数组join，兼容AI返回字符串的情况 */
function safeJoin(val: unknown, sep = ', '): string {
  if (Array.isArray(val)) return val.join(sep);
  if (typeof val === 'string') return val;
  return '';
}

// 行业趋势
const trends = computed<IndustryTrend[]>(() => {
  return gameState.industryTrends ?? [];
});

// 世界事件
const worldEvents = computed<WorldEvent[]>(() => {
  return gameState.worldEvents ?? [];
});

// 竞品公司（将Record的key作为名称回填，防止AI未在value中包含名称字段）
const competitors = computed<CompetitorCompany[]>(() => {
  if (!gameState.competitors) return [];
  return Object.entries(gameState.competitors).map(([key, comp]) => ({
    ...comp,
    名称: comp.名称 || key,
    ID: comp.ID || key,
  }));
});

// 热度条颜色
function heatBarClass(heat: number): string {
  if (heat >= 80) return 'danger';
  if (heat >= 50) return 'warning';
  return '';
}

// 事件类型图标
function eventTypeIcon(type: string): string {
  switch (type) {
    case '行业': return '🏭';
    case '技术': return '💻';
    case '政策': return '📜';
    case '社会': return '👥';
    case '经济': return '💹';
    default: return '⚡';
  }
}

// 事件严重程度样式
function eventSeverityClass(level: string): string {
  switch (level) {
    case '历史性': return 'critical';
    case '重大': return 'major';
    case '中等': return 'moderate';
    case '轻微': return 'minor';
    default: return 'minor';
  }
}

// 事件等级badge
function eventLevelBadge(level: string): string {
  switch (level) {
    case '历史性': return 'badge-danger';
    case '重大': return 'badge-warning';
    case '中等': return 'badge-primary';
    case '轻微': return 'badge-success';
    default: return 'badge-primary';
  }
}

// 公司规模badge
function scaleBadge(scale: string): string {
  switch (scale) {
    case '巨头': return 'scale-giant';
    case '大型': return 'scale-large';
    case '中型': return 'scale-medium';
    case '小型': return 'scale-small';
    default: return 'scale-small';
  }
}

// 实力评级badge
function ratingBadge(rating: string): string {
  switch (rating) {
    case 'S': return 'rating-s';
    case 'A': return 'rating-a';
    case 'B': return 'rating-b';
    case 'C': return 'rating-c';
    case 'D': return 'rating-d';
    default: return 'rating-c';
  }
}

// 关系图标
function relationIcon(relation: string): string {
  switch (relation) {
    case '友好': return '😊';
    case '中立': return '😐';
    case '竞争': return '⚔️';
    case '敌对': return '😠';
    default: return '😐';
  }
}
</script>

<style scoped>
/* 通用section标题 */
.section-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 14px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border-color);
}

/* 行业趋势 */
.trends-section {
  margin-bottom: 20px;
  padding: 16px;
}

.trends-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.trend-item {
  padding: 10px;
  background: var(--bg-tertiary);
  border-radius: var(--radius-md);
}

.trend-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.trend-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.trend-heat {
  font-size: 12px;
  color: var(--color-warning);
}

.trend-desc {
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 6px;
}

.trend-meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: var(--text-muted);
  margin-bottom: 6px;
}

.trend-heat-bar {
  margin-top: 4px;
}

/* 世界事件 */
.events-section {
  margin-bottom: 20px;
  padding: 16px;
}

.events-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.event-item {
  padding: 10px;
  border-radius: var(--radius-md);
  border-left: 3px solid var(--border-color);
}

.event-minor {
  background: rgba(0, 212, 255, 0.04);
  border-left-color: var(--color-primary);
}

.event-moderate {
  background: rgba(255, 170, 0, 0.04);
  border-left-color: var(--color-warning);
}

.event-major {
  background: rgba(255, 68, 68, 0.04);
  border-left-color: var(--color-danger);
}

.event-critical {
  background: rgba(255, 68, 68, 0.08);
  border-left-color: var(--color-danger);
  border-left-width: 4px;
}

.event-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.event-icon {
  font-size: 16px;
}

.event-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  flex: 1;
}

.event-level {
  flex-shrink: 0;
}

.event-desc {
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 6px;
  padding-left: 24px;
}

.event-meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: var(--text-muted);
  padding-left: 24px;
  flex-wrap: wrap;
}

.event-type {
  margin-left: auto;
}

/* 竞品公司 */
.competitors-section {
  margin-bottom: 20px;
  padding: 16px;
}

.competitors-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.competitor-card {
  padding: 12px;
  background: var(--bg-tertiary);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-color);
  transition: all var(--transition-fast);
}

.competitor-card:hover {
  border-color: var(--border-color-light);
}

.comp-header {
  margin-bottom: 10px;
}

.comp-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 4px;
}

.comp-icon {
  font-size: 18px;
}

.comp-name {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
}

.comp-scale {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
}

.scale-giant {
  background: rgba(255, 68, 68, 0.15);
  color: var(--color-danger);
  border: 1px solid rgba(255, 68, 68, 0.3);
}

.scale-large {
  background: rgba(255, 170, 0, 0.15);
  color: var(--color-warning);
  border: 1px solid rgba(255, 170, 0, 0.3);
}

.scale-medium {
  background: rgba(0, 212, 255, 0.15);
  color: var(--color-primary);
  border: 1px solid rgba(0, 212, 255, 0.3);
}

.scale-small {
  background: rgba(0, 255, 136, 0.15);
  color: var(--color-success);
  border: 1px solid rgba(0, 255, 136, 0.3);
}

.comp-rating {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 700;
}

.rating-s {
  background: rgba(255, 68, 68, 0.15);
  color: #ff4444;
  border: 1px solid rgba(255, 68, 68, 0.3);
}

.rating-a {
  background: rgba(255, 170, 0, 0.15);
  color: #ffaa00;
  border: 1px solid rgba(255, 170, 0, 0.3);
}

.rating-b {
  background: rgba(0, 212, 255, 0.15);
  color: #00d4ff;
  border: 1px solid rgba(0, 212, 255, 0.3);
}

.rating-c {
  background: rgba(0, 255, 136, 0.15);
  color: #00ff88;
  border: 1px solid rgba(0, 255, 136, 0.3);
}

.rating-d {
  background: rgba(160, 160, 176, 0.15);
  color: #a0a0b0;
  border: 1px solid rgba(160, 160, 176, 0.3);
}

.comp-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 14px;
  font-size: 13px;
  color: var(--text-secondary);
}

/* 当前项目 */
.comp-current {
  padding: 6px 10px;
  background: rgba(0, 212, 255, 0.05);
  border-radius: var(--radius-sm);
  margin-bottom: 8px;
  font-size: 13px;
}

.current-label {
  color: var(--text-muted);
}

.current-value {
  color: var(--color-primary);
  font-weight: 600;
}

/* 最近动态 */
.comp-dynamics {
  margin-top: 8px;
}

.dynamics-title {
  font-size: 12px;
  color: var(--text-muted);
  margin-bottom: 4px;
}

.dynamics-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.dynamic-item {
  font-size: 13px;
  color: var(--text-secondary);
  padding: 4px 0;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
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
}

/* 底部提示 */
.bottom-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px 16px;
  font-size: 13px;
  color: var(--text-muted);
}
</style>
