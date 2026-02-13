<!--
  AI游戏开发商模拟器 - 游戏主视图
  包含TopBar、LeftSidebar和主内容区的布局框架
-->
<template>
  <div class="game-view" :class="{ 'sidebar-collapsed': uiStore.sidebarCollapsed }">
    <!-- 顶部状态栏 -->
    <TopBar class="game-topbar" />

    <!-- 主体区域 -->
    <div class="game-body">
      <!-- 左侧导航 -->
      <LeftSidebar class="game-sidebar" />

      <!-- 主内容区 -->
      <main class="game-main">
        <router-view v-slot="{ Component }">
          <keep-alive>
            <component :is="Component" />
          </keep-alive>
        </router-view>
      </main>
    </div>

    <!-- 全局加载遮罩 -->
    <div v-if="uiStore.isLoading" class="loading-overlay">
      <div class="loading-spinner"></div>
      <p class="loading-text">{{ uiStore.loadingText || '加载中...' }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useGameStateStore } from '@/stores/gameStateStore';
import { useUIStore } from '@/stores/uiStore';
import TopBar from '@/components/dashboard/TopBar.vue';
import LeftSidebar from '@/components/dashboard/LeftSidebar.vue';

const gameState = useGameStateStore();
const uiStore = useUIStore();

onMounted(() => {
  // 检查游戏是否已加载
  if (!gameState.isGameLoaded) {
    console.warn('[GameView] 游戏状态未加载，可能需要从存档恢复');
  }
});
</script>

<style scoped>
.game-view {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg-primary);
  overflow: hidden;
}

/* 顶部栏 */
.game-topbar {
  height: var(--topbar-height);
  flex-shrink: 0;
  z-index: 100;
}

/* 主体区域 */
.game-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}

/* 侧边栏 */
.game-sidebar {
  width: var(--sidebar-width);
  flex-shrink: 0;
  transition: width var(--transition-normal);
  z-index: 50;
}

.sidebar-collapsed .game-sidebar {
  width: var(--sidebar-collapsed-width);
}

/* 主内容区 */
.game-main {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  background: var(--bg-secondary);
  border-left: 1px solid var(--border-color);
}

/* 加载遮罩 */
.loading-overlay {
  position: fixed;
  inset: 0;
  background: rgba(10, 10, 15, 0.85);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  gap: 16px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--border-color);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-text {
  color: var(--text-secondary);
  font-size: 14px;
}
</style>
