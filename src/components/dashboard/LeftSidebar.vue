<!--
  AI游戏开发商模拟器 - 左侧导航栏
  可折叠的导航菜单，带emoji图标
-->
<template>
  <nav class="sidebar" :class="{ collapsed: uiStore.sidebarCollapsed }">
    <!-- 折叠按钮 -->
    <div class="sidebar-toggle" @click="uiStore.toggleSidebar()">
      <span>{{ uiStore.sidebarCollapsed ? '»' : '«' }}</span>
    </div>

    <!-- 导航菜单 -->
    <ul class="nav-list">
      <li
        v-for="item in navItems"
        :key="item.path"
        class="nav-item"
        :class="{ active: isActive(item.path) }"
        @click="navigateTo(item.path, item.name)"
      >
        <span class="nav-icon">{{ item.icon }}</span>
        <span class="nav-label" v-show="!uiStore.sidebarCollapsed">{{ item.label }}</span>
      </li>
    </ul>

    <!-- 底部信息 -->
    <div class="sidebar-footer" v-show="!uiStore.sidebarCollapsed">
      <div class="sidebar-footer-text">AI游戏开发商 v1.0</div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router';
import { useUIStore } from '@/stores/uiStore';

const router = useRouter();
const route = useRoute();
const uiStore = useUIStore();

// 导航菜单项
const navItems = [
  { icon: '🎮', label: '主面板', path: '/game', name: 'GameMain' },
  { icon: '👥', label: '员工管理', path: '/game/employees', name: 'Employees' },
  { icon: '💰', label: '财务', path: '/game/finance', name: 'Finance' },
  { icon: '📁', label: '项目管理', path: '/game/projects', name: 'Projects' },
  { icon: '📱', label: '社交媒体', path: '/game/social-media', name: 'SocialMedia' },
  { icon: '💼', label: '招聘', path: '/game/social-media/boss', name: 'BossZhipin' },
  { icon: '🏢', label: '竞品情报', path: '/game/competitors', name: 'Competitors' },
  { icon: '🧠', label: '记忆中心', path: '/game/memory', name: 'MemoryCenter' },
  { icon: '⚙️', label: '设置', path: '/game/settings', name: 'Settings' },
  { icon: '💾', label: '存档', path: '/game/save', name: 'Save' },
];

/** 判断当前路由是否激活 */
function isActive(path: string): boolean {
  if (path === '/game') {
    return route.path === '/game' || route.path === '/game/';
  }
  return route.path.startsWith(path);
}

/** 导航到指定路径 */
function navigateTo(path: string, name: string) {
  router.push(path);
  uiStore.setCurrentPanel(name);
}
</script>

<style scoped>
.sidebar {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--bg-sidebar);
  border-right: 1px solid var(--border-color);
  transition: width var(--transition-normal);
  overflow: hidden;
}

/* 折叠按钮 */
.sidebar-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 36px;
  cursor: pointer;
  color: var(--text-muted);
  font-size: 16px;
  border-bottom: 1px solid var(--border-color);
  transition: all var(--transition-fast);
  flex-shrink: 0;
}

.sidebar-toggle:hover {
  color: var(--color-primary);
  background: rgba(0, 212, 255, 0.05);
}

/* 导航列表 */
.nav-list {
  list-style: none;
  padding: 8px 0;
  flex: 1;
  overflow-y: auto;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  cursor: pointer;
  transition: all var(--transition-fast);
  color: var(--text-secondary);
  border-left: 3px solid transparent;
  white-space: nowrap;
}

.nav-item:hover {
  background: rgba(0, 212, 255, 0.04);
  color: var(--text-primary);
}

.nav-item.active {
  background: rgba(0, 212, 255, 0.08);
  color: var(--color-primary);
  border-left-color: var(--color-primary);
}

.nav-icon {
  font-size: 18px;
  flex-shrink: 0;
  width: 24px;
  text-align: center;
}

.nav-label {
  font-size: 14px;
  font-weight: 500;
}

/* 折叠状态 */
.collapsed .nav-item {
  justify-content: center;
  padding: 12px 0;
}

.collapsed .nav-icon {
  width: auto;
}

/* 底部 */
.sidebar-footer {
  padding: 12px 16px;
  border-top: 1px solid var(--border-color);
  flex-shrink: 0;
}

.sidebar-footer-text {
  font-size: 11px;
  color: var(--text-muted);
  text-align: center;
  opacity: 0.5;
}
</style>
