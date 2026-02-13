<!--
  AI游戏开发商模拟器 - 根组件
  提供全局路由视图和过渡动画
-->
<template>
  <div id="game-app">
    <router-view v-slot="{ Component, route }">
      <transition name="slide" mode="out-in">
        <component :is="Component" :key="route.path" />
      </transition>
    </router-view>
  </div>
</template>

<script setup lang="ts">
// 根组件无需额外逻辑，路由和状态管理已在 main.ts 中初始化
</script>

<style scoped>
#game-app {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background-color: var(--bg-primary);
}
</style>
