<!--
  AI游戏开发商模拟器 - 存档管理面板
  保存/加载/导入/导出/重置游戏存档
-->
<template>
  <div class="panel-container save-panel">
    <h2 class="panel-title">💾 存档管理</h2>

    <!-- 当前存档信息 -->
    <div class="save-section">
      <div class="section-header">
        <h3 class="section-title">📊 当前游戏状态</h3>
      </div>

      <div class="current-save-card">
        <div class="save-info-grid">
          <div class="save-info-item">
            <span class="info-icon">🏢</span>
            <div class="info-content">
              <span class="info-label">公司名称</span>
              <span class="info-value">{{ gameState.companyInfo?.名称 || '未创建' }}</span>
            </div>
          </div>
          <div class="save-info-item">
            <span class="info-icon">🕐</span>
            <div class="info-content">
              <span class="info-label">游戏时间</span>
              <span class="info-value">{{ gameState.formattedTime }}</span>
            </div>
          </div>
          <div class="save-info-item">
            <span class="info-icon">💰</span>
            <div class="info-content">
              <span class="info-label">当前资金</span>
              <span class="info-value" :style="{ color: gameState.fundsColor }">
                ¥{{ formatMoney(gameState.currentFunds) }}
              </span>
            </div>
          </div>
          <div class="save-info-item">
            <span class="info-icon">👥</span>
            <div class="info-content">
              <span class="info-label">员工数量</span>
              <span class="info-value">{{ gameState.employeeCount }} 人</span>
            </div>
          </div>
          <div class="save-info-item">
            <span class="info-icon">🎮</span>
            <div class="info-content">
              <span class="info-label">开发中项目</span>
              <span class="info-value">{{ activeProjectCount }} 个</span>
            </div>
          </div>
          <div class="save-info-item">
            <span class="info-icon">📦</span>
            <div class="info-content">
              <span class="info-label">已发布游戏</span>
              <span class="info-value">{{ publishedGameCount }} 款</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 存档槽位 -->
    <div class="save-section">
      <div class="section-header">
        <h3 class="section-title">📁 存档槽位</h3>
      </div>

      <div class="save-slots">
        <div
          v-for="slot in saveSlots"
          :key="slot.index"
          class="save-slot"
          :class="{ 'slot-empty': !slot.data, 'slot-active': slot.data }"
        >
          <div class="slot-header">
            <span class="slot-name">存档 {{ slot.index }}</span>
            <span v-if="slot.data" class="slot-time">{{ formatSaveTime(slot.data.updateTime) }}</span>
          </div>

          <div v-if="slot.data" class="slot-info">
            <div class="slot-detail">
              <span>🏢 {{ slot.data.companyName }}</span>
              <span>🕐 {{ slot.data.gameTime }}</span>
            </div>
            <div class="slot-detail">
              <span>💰 ¥{{ formatMoney(slot.data.funds) }}</span>
              <span>👥 {{ slot.data.employees }}人</span>
            </div>
          </div>
          <div v-else class="slot-empty-text">
            空存档位
          </div>

          <div class="slot-actions">
            <button
              class="btn btn-sm btn-primary"
              @click="saveToSlot(slot.index)"
              :disabled="!gameState.isGameLoaded"
            >
              💾 保存
            </button>
            <button
              v-if="slot.data"
              class="btn btn-sm btn-ghost"
              @click="loadFromSlot(slot.index)"
            >
              📂 加载
            </button>
            <button
              v-if="slot.data"
              class="btn btn-sm btn-danger"
              @click="deleteSlot(slot.index)"
            >
              🗑️
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 导入/导出 -->
    <div class="save-section">
      <div class="section-header">
        <h3 class="section-title">📤 导入 / 导出</h3>
      </div>

      <div class="export-import-card">
        <div class="export-import-row">
          <div class="ei-info">
            <h4>导出存档</h4>
            <p>将当前游戏进度导出为JSON文件，可用于备份或分享</p>
          </div>
          <button
            class="btn btn-gold"
            :disabled="!gameState.isGameLoaded"
            @click="exportSave"
          >
            📤 导出JSON
          </button>
        </div>

        <div class="divider"></div>

        <div class="export-import-row">
          <div class="ei-info">
            <h4>导入存档</h4>
            <p>从JSON文件导入游戏存档，将覆盖当前进度</p>
          </div>
          <button class="btn btn-ghost" @click="triggerImport">
            📥 导入JSON
          </button>
          <input
            ref="fileInputRef"
            type="file"
            accept=".json"
            style="display: none;"
            @change="handleImport"
          />
        </div>
      </div>
    </div>

    <!-- 危险操作 -->
    <div class="save-section">
      <div class="section-header">
        <h3 class="section-title danger-title">⚠️ 危险操作</h3>
      </div>

      <div class="danger-card">
        <div class="export-import-row">
          <div class="ei-info">
            <h4>重置游戏</h4>
            <p>清除所有游戏数据并返回主菜单，此操作不可撤销</p>
          </div>
          <button class="btn btn-danger" @click="confirmReset">
            🔄 重置游戏
          </button>
        </div>
      </div>
    </div>

    <!-- 重置确认对话框 -->
    <Teleport to="body">
      <div v-if="showResetDialog" class="dialog-overlay" @click.self="showResetDialog = false">
        <div class="dialog-box">
          <div class="dialog-header">
            <h3>⚠️ 确认重置游戏</h3>
          </div>
          <div class="dialog-body">
            <p>你确定要重置游戏吗？</p>
            <p class="text-danger">此操作将清除所有游戏数据，包括：</p>
            <ul class="reset-list">
              <li>公司信息和财务数据</li>
              <li>所有员工和项目</li>
              <li>对话历史和记忆</li>
              <li>市场和竞品数据</li>
            </ul>
            <p class="text-muted" style="margin-top: 12px; font-size: 13px;">
              建议在重置前先导出存档进行备份。
            </p>
          </div>
          <div class="dialog-footer">
            <button class="btn btn-ghost" @click="showResetDialog = false">取消</button>
            <button class="btn btn-danger" @click="executeReset">确认重置</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useGameStateStore } from '@/stores/gameStateStore';
import { useUIStore } from '@/stores/uiStore';
import type { SaveData } from '@/types/game.d';

// ===== Store & Router =====
const gameState = useGameStateStore();
const uiStore = useUIStore();
const router = useRouter();

// ===== 常量 =====
const SAVE_SLOT_PREFIX = 'game_save_slot_';

// ===== 存档槽位接口 =====
interface SaveSlotInfo {
  companyName: string;
  gameTime: string;
  funds: number;
  employees: number;
  updateTime: string;
}

interface SaveSlot {
  index: number;
  data: SaveSlotInfo | null;
}

// ===== 响应式状态 =====
const saveSlots = ref<SaveSlot[]>([
  { index: 1, data: null },
  { index: 2, data: null },
  { index: 3, data: null },
]);
const showResetDialog = ref(false);
const fileInputRef = ref<HTMLInputElement | null>(null);

// ===== 计算属性 =====
const activeProjectCount = computed(() => {
  return gameState.activeProjects.length;
});

const publishedGameCount = computed(() => {
  return gameState.publishedGames ? Object.keys(gameState.publishedGames).length : 0;
});

// ===== 方法 =====

/** 格式化金额 */
function formatMoney(amount: number): string {
  if (amount >= 100000000) return (amount / 100000000).toFixed(2) + '亿';
  if (amount >= 10000) return (amount / 10000).toFixed(1) + '万';
  return amount.toLocaleString('zh-CN');
}

/** 格式化存档时间 */
function formatSaveTime(isoTime: string): string {
  try {
    const date = new Date(isoTime);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${month}-${day} ${hours}:${minutes}`;
  } catch {
    return '未知时间';
  }
}

/** 从SaveData提取槽位摘要信息 */
function extractSlotInfo(saveData: SaveData): SaveSlotInfo {
  const time = saveData.元数据?.时间;
  const gameTimeStr = time
    ? `${time.年}年${time.月}月${time.日}日`
    : '未知';

  return {
    companyName: saveData.公司?.基本信息?.名称 || '未知公司',
    gameTime: gameTimeStr,
    funds: saveData.公司?.财务?.资金 ?? 0,
    employees: saveData.公司?.员工列表
      ? Object.keys(saveData.公司.员工列表).length
      : 0,
    updateTime: saveData.元数据?.更新时间 || new Date().toISOString(),
  };
}

/** 加载所有存档槽位信息 */
function loadSlotInfos() {
  for (let i = 0; i < saveSlots.value.length; i++) {
    const slotIndex = saveSlots.value[i].index;
    try {
      const stored = localStorage.getItem(`${SAVE_SLOT_PREFIX}${slotIndex}`);
      if (stored) {
        const saveData = JSON.parse(stored) as SaveData;
        saveSlots.value[i].data = extractSlotInfo(saveData);
      } else {
        saveSlots.value[i].data = null;
      }
    } catch (error) {
      console.warn(`[SavePanel] 加载存档槽位 ${slotIndex} 失败:`, error);
      saveSlots.value[i].data = null;
    }
  }
}

/** 保存到指定槽位 */
function saveToSlot(slotIndex: number) {
  const saveData = gameState.toSaveData();
  if (!saveData) {
    uiStore.notify('游戏数据不完整，无法保存', 'error');
    return;
  }

  // 更新存档名
  saveData.元数据.存档名 = `存档 ${slotIndex}`;
  saveData.元数据.更新时间 = new Date().toISOString();

  try {
    const jsonStr = JSON.stringify(saveData);
    localStorage.setItem(`${SAVE_SLOT_PREFIX}${slotIndex}`, jsonStr);

    // 更新槽位显示
    const slot = saveSlots.value.find(s => s.index === slotIndex);
    if (slot) {
      slot.data = extractSlotInfo(saveData);
    }

    uiStore.notify(`已保存到存档 ${slotIndex}`, 'success');
    console.log(`[SavePanel] ✅ 已保存到存档槽位 ${slotIndex}`);
  } catch (error) {
    if ((error as Error).name === 'QuotaExceededError') {
      uiStore.notify('存储空间不足，请清理旧存档', 'error');
    } else {
      uiStore.notify('保存失败: ' + (error as Error).message, 'error');
    }
    console.error('[SavePanel] 保存失败:', error);
  }
}

/** 从指定槽位加载 */
function loadFromSlot(slotIndex: number) {
  try {
    const stored = localStorage.getItem(`${SAVE_SLOT_PREFIX}${slotIndex}`);
    if (!stored) {
      uiStore.notify('该存档位为空', 'warning');
      return;
    }

    const saveData = JSON.parse(stored) as SaveData;
    gameState.loadFromSaveData(saveData);
    uiStore.notify(`已加载存档 ${slotIndex}`, 'success');
    console.log(`[SavePanel] ✅ 已加载存档槽位 ${slotIndex}`);

    // 跳转到主游戏面板
    router.push('/game');
  } catch (error) {
    uiStore.notify('加载存档失败: ' + (error as Error).message, 'error');
    console.error('[SavePanel] 加载失败:', error);
  }
}

/** 删除指定槽位 */
function deleteSlot(slotIndex: number) {
  try {
    localStorage.removeItem(`${SAVE_SLOT_PREFIX}${slotIndex}`);
    const slot = saveSlots.value.find(s => s.index === slotIndex);
    if (slot) {
      slot.data = null;
    }
    uiStore.notify(`存档 ${slotIndex} 已删除`, 'info');
  } catch (error) {
    uiStore.notify('删除存档失败', 'error');
    console.error('[SavePanel] 删除失败:', error);
  }
}

/** 导出存档为JSON文件 */
function exportSave() {
  const saveData = gameState.toSaveData();
  if (!saveData) {
    uiStore.notify('游戏数据不完整，无法导出', 'error');
    return;
  }

  try {
    const jsonStr = JSON.stringify(saveData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const companyName = saveData.公司?.基本信息?.名称 || '游戏存档';
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `${companyName}_${timestamp}.json`;

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    uiStore.notify('存档已导出', 'success');
    console.log(`[SavePanel] ✅ 存档已导出: ${filename}`);
  } catch (error) {
    uiStore.notify('导出失败: ' + (error as Error).message, 'error');
    console.error('[SavePanel] 导出失败:', error);
  }
}

/** 触发文件选择 */
function triggerImport() {
  fileInputRef.value?.click();
}

/** 处理文件导入 */
function handleImport(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const content = e.target?.result as string;
      const saveData = JSON.parse(content) as SaveData;

      // 基本验证
      if (!saveData.元数据 || !saveData.公司 || !saveData.项目) {
        throw new Error('存档格式无效：缺少必要字段');
      }

      gameState.loadFromSaveData(saveData);
      uiStore.notify('存档导入成功', 'success');
      console.log('[SavePanel] ✅ 存档导入成功');

      // 跳转到主游戏面板
      router.push('/game');
    } catch (error) {
      uiStore.notify('导入失败: ' + (error as Error).message, 'error');
      console.error('[SavePanel] 导入失败:', error);
    }
  };

  reader.onerror = () => {
    uiStore.notify('文件读取失败', 'error');
  };

  reader.readAsText(file);

  // 重置input以允许重复选择同一文件
  input.value = '';
}

/** 显示重置确认 */
function confirmReset() {
  showResetDialog.value = true;
}

/** 执行重置 */
function executeReset() {
  showResetDialog.value = false;
  gameState.resetState();
  uiStore.notify('游戏已重置', 'info');
  console.log('[SavePanel] 🔄 游戏已重置');
  router.push('/');
}

// ===== 生命周期 =====
onMounted(() => {
  loadSlotInfos();
});
</script>

<style scoped>
/* ===== 存档面板 ===== */
.save-panel {
  max-width: 800px;
  margin: 0 auto;
}

/* ===== 分区 ===== */
.save-section {
  margin-bottom: 28px;
}

.section-header {
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

.danger-title {
  color: var(--color-danger);
}

/* ===== 当前存档信息卡片 ===== */
.current-save-card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 20px;
}

.save-info-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.save-info-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: var(--bg-tertiary);
  border-radius: var(--radius-md);
  border: 1px solid rgba(42, 42, 64, 0.5);
}

.info-icon {
  font-size: 24px;
  flex-shrink: 0;
}

.info-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.info-label {
  font-size: 11px;
  color: var(--text-muted);
}

.info-value {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ===== 存档槽位 ===== */
.save-slots {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.save-slot {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 16px 20px;
  transition: all var(--transition-normal);
}

.save-slot:hover {
  border-color: var(--border-color-light);
  box-shadow: var(--shadow-sm);
}

.slot-active {
  border-left: 3px solid var(--color-primary);
}

.slot-empty {
  border-left: 3px solid var(--border-color);
  opacity: 0.7;
}

.slot-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.slot-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
}

.slot-time {
  font-size: 12px;
  color: var(--text-muted);
}

.slot-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 12px;
}

.slot-detail {
  display: flex;
  gap: 20px;
  font-size: 13px;
  color: var(--text-secondary);
}

.slot-empty-text {
  font-size: 13px;
  color: var(--text-muted);
  margin-bottom: 12px;
  font-style: italic;
}

.slot-actions {
  display: flex;
  gap: 8px;
}

/* ===== 导入/导出卡片 ===== */
.export-import-card,
.danger-card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 20px;
}

.danger-card {
  border-color: rgba(255, 68, 68, 0.3);
  background: rgba(255, 68, 68, 0.03);
}

.export-import-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}

.ei-info {
  flex: 1;
}

.ei-info h4 {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.ei-info p {
  font-size: 13px;
  color: var(--text-muted);
}

/* ===== 重置确认对话框 ===== */
.dialog-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  animation: fadeIn 0.2s ease;
}

.dialog-box {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-xl);
  width: 420px;
  max-width: 90vw;
  box-shadow: var(--shadow-lg);
  animation: slideUp 0.3s ease;
}

.dialog-header {
  padding: 20px 24px 12px;
}

.dialog-header h3 {
  font-size: 18px;
  font-weight: 700;
  color: var(--color-danger);
}

.dialog-body {
  padding: 0 24px 20px;
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.6;
}

.dialog-body p {
  margin-bottom: 8px;
}

.reset-list {
  padding-left: 20px;
  margin: 8px 0;
}

.reset-list li {
  margin: 4px 0;
  color: var(--text-muted);
  font-size: 13px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid var(--border-color);
}

/* ===== 响应式 ===== */
@media (max-width: 768px) {
  .save-info-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .export-import-row {
    flex-direction: column;
    align-items: flex-start;
  }

  .slot-detail {
    flex-direction: column;
    gap: 4px;
  }
}

@media (max-width: 480px) {
  .save-info-grid {
    grid-template-columns: 1fr;
  }
}
</style>
