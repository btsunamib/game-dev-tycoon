<!--
  AI游戏开发商模拟器 - 顶部状态栏
  显示游戏时间、公司资金、员工数、项目状态、声誉
-->
<template>
  <div class="topbar">
    <!-- 左侧：公司名称 -->
    <div class="topbar-left">
      <span class="company-name">{{ companyName }}</span>
    </div>

    <!-- 中间：状态指标 -->
    <div class="topbar-center">
      <!-- 游戏时间 -->
      <div class="status-item">
        <span class="status-icon">📅</span>
        <span class="status-label">{{ formattedTime }}</span>
      </div>

      <!-- 公司资金 -->
      <div class="status-item">
        <span class="status-icon">💰</span>
        <span class="status-value" :style="{ color: fundsColor }">
          ¥{{ formattedFunds }}
        </span>
      </div>

      <!-- 员工数 -->
      <div class="status-item">
        <span class="status-icon">👥</span>
        <span class="status-value">{{ employeeCount }}人</span>
      </div>

      <!-- 当前项目 -->
      <div class="status-item" v-if="currentProjectName">
        <span class="status-icon">🎮</span>
        <span class="status-value">{{ currentProjectName }}</span>
        <div class="mini-progress" v-if="currentProjectProgress > 0">
          <div
            class="mini-progress-fill"
            :style="{ width: currentProjectProgress + '%' }"
          ></div>
        </div>
      </div>

      <!-- 声誉 -->
      <div class="status-item">
        <span class="status-icon">⭐</span>
        <span class="status-value">{{ reputation }}</span>
      </div>
    </div>

    <!-- 右侧：预留空间 -->
    <div class="topbar-right">
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useGameStateStore } from '@/stores/gameStateStore';

const gameState = useGameStateStore();

/** 公司名称 */
const companyName = computed(() => gameState.companyInfo?.名称 ?? '未命名公司');

/** 格式化时间 */
const formattedTime = computed(() => {
  if (!gameState.gameTime) return '----年--月--日';
  const t = gameState.gameTime;
  return `${t.年}年${t.月}月${t.日}日`;
});

/** 格式化资金 */
const formattedFunds = computed(() => {
  const funds = gameState.finance?.资金 ?? 0;
  if (funds >= 100000000) return (funds / 100000000).toFixed(1) + '亿';
  if (funds >= 10000) return (funds / 10000).toFixed(1) + '万';
  return funds.toLocaleString();
});

/** 资金颜色 */
const fundsColor = computed(() => {
  const funds = gameState.finance?.资金 ?? 0;
  if (funds >= 1000000) return 'var(--color-success)';
  if (funds >= 200000) return 'var(--color-warning)';
  return 'var(--color-danger)';
});

/** 员工数 */
const employeeCount = computed(() => {
  return gameState.employees ? Object.keys(gameState.employees).length : 0;
});

/** 当前项目名称 */
const currentProjectName = computed(() => {
  if (!gameState.currentProjects) return '';
  const projects = Object.values(gameState.currentProjects);
  if (projects.length === 0) return '';
  // 显示第一个进行中的项目
  const active = projects.find((p) => p.开发阶段 !== '已完成');
  return active?.名称 ?? '';
});

/** 当前项目进度 */
const currentProjectProgress = computed(() => {
  if (!gameState.currentProjects) return 0;
  const projects = Object.values(gameState.currentProjects);
  const active = projects.find((p) => p.开发阶段 !== '已完成');
  return active?.进度?.总体 ?? 0;
});

/** 声誉 */
const reputation = computed(() => gameState.companyInfo?.声誉 ?? 0);
</script>

<style scoped>
.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: var(--topbar-height);
  padding: 0 16px;
  background: var(--bg-topbar);
  border-bottom: 1px solid var(--border-color);
  gap: 16px;
}

/* 左侧 */
.topbar-left {
  flex-shrink: 0;
}

.company-name {
  font-size: 15px;
  font-weight: 700;
  color: var(--color-primary);
  letter-spacing: 1px;
}

/* 中间状态 */
.topbar-center {
  display: flex;
  align-items: center;
  gap: 20px;
  flex: 1;
  justify-content: center;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  white-space: nowrap;
}

.status-icon {
  font-size: 14px;
}

.status-label {
  color: var(--text-secondary);
}

.status-value {
  color: var(--text-primary);
  font-weight: 500;
}

/* 迷你进度条 */
.mini-progress {
  width: 50px;
  height: 4px;
  background: var(--bg-input);
  border-radius: 2px;
  overflow: hidden;
  margin-left: 4px;
}

.mini-progress-fill {
  height: 100%;
  background: var(--color-primary);
  border-radius: 2px;
  transition: width var(--transition-normal);
}

/* 右侧 */
.topbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.topbar-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 14px;
  transition: all var(--transition-fast);
}

.topbar-btn:hover {
  border-color: var(--color-primary);
  background: rgba(0, 212, 255, 0.05);
}
</style>
