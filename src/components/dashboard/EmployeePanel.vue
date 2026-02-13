<!--
  AI游戏开发商模拟器 - 员工管理面板
  招募、管理、提拔员工
-->
<template>
  <div class="panel-container">
    <!-- 顶部统计概览 -->
    <div class="panel-header">
      <h2 class="panel-title">👥 员工管理</h2>
      <div class="stats-bar" v-if="employeeList.length > 0">
        <div class="stat-item">
          <span class="stat-label">总人数</span>
          <span class="stat-value text-primary">{{ employeeList.length }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">月薪总支出</span>
          <span class="stat-value text-warning">¥{{ formatMoney(totalSalary) }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">平均满意度</span>
          <span class="stat-value" :class="avgSatisfactionColor">{{ avgSatisfaction }}%</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">管理层</span>
          <span class="stat-value text-gold">{{ managementCount }}人</span>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-if="employeeList.length === 0" class="empty-state">
      <div class="empty-icon">👥</div>
      <div class="empty-text">暂无员工</div>
      <p class="empty-hint">在主游戏面板中通过AI对话招聘第一位员工</p>
      <button class="btn btn-primary" @click="navigateToMainWithMessage('我想招聘一名员工')">
        前往招聘
      </button>
    </div>

    <!-- 有员工时的内容 -->
    <template v-else>
      <!-- 部门筛选tabs -->
      <div class="filter-tabs">
        <button
          v-for="tab in filterTabs"
          :key="tab.key"
          class="filter-tab"
          :class="{ active: activeFilter === tab.key }"
          @click="activeFilter = tab.key"
        >
          {{ tab.label }}
          <span class="tab-count" v-if="tab.count > 0">{{ tab.count }}</span>
        </button>
      </div>

      <!-- 员工列表 -->
      <div class="employee-list">
        <div
          v-for="emp in filteredEmployees"
          :key="emp.ID"
          class="employee-card card"
        >
          <!-- 员工头部信息 -->
          <div class="emp-header">
            <div class="emp-avatar">👤</div>
            <div class="emp-basic">
              <div class="emp-name-row">
                <span class="emp-name">{{ emp.姓名 }}</span>
                <span v-if="emp.是管理层" class="badge badge-warning">⭐ 管理层</span>
                <span v-if="emp.关系" class="relationship-tag" :class="'rel-' + emp.关系.与老板关系">
                  {{ relationshipIcon(emp.关系?.与老板关系) }} {{ emp.关系?.与老板关系 || '陌生' }}
                </span>
                <span class="emp-status" :class="statusClass(emp.状态)">
                  {{ statusIcon(emp.状态) }} {{ emp.状态 }}
                </span>
                <span v-if="getUnhandledEventCount(emp) > 0" class="event-badge" title="未处理事件">
                  {{ getUnhandledEventCount(emp) }}
                </span>
              </div>
              <div class="emp-position">
                {{ emp.部门 }} - {{ emp.职位 }}
              </div>
            </div>
          </div>

          <!-- 技能柱状图 -->
          <div class="emp-skills">
            <div class="skills-title">技能</div>
            <div class="skills-grid">
              <div v-for="(value, skillName) in emp.技能" :key="skillName" class="skill-item">
                <span class="skill-name">{{ skillName }}</span>
                <div class="skill-bar-bg">
                  <div
                    class="skill-bar-fill"
                    :style="{ width: (value ?? 0) + '%', background: skillColor((value as number) ?? 0) }"
                  ></div>
                </div>
                <span class="skill-value">{{ value ?? 0 }}</span>
              </div>
            </div>
          </div>

          <!-- 满意度和忠诚度 -->
          <div class="emp-meters">
            <div class="meter-row">
              <span class="meter-label">满意度</span>
              <div class="progress-bar">
                <div
                  class="progress-bar-fill"
                  :class="meterClass(emp.满意度 ?? 0)"
                  :style="{ width: (emp.满意度 ?? 0) + '%' }"
                ></div>
              </div>
              <span class="meter-value">{{ emp.满意度 ?? 0 }}%</span>
            </div>
            <div class="meter-row">
              <span class="meter-label">忠诚度</span>
              <div class="progress-bar">
                <div
                  class="progress-bar-fill"
                  :class="meterClass(emp.忠诚度 ?? 0)"
                  :style="{ width: (emp.忠诚度 ?? 0) + '%' }"
                ></div>
              </div>
              <span class="meter-value">{{ emp.忠诚度 ?? 0 }}%</span>
            </div>
          </div>

          <!-- 关系系统 -->
          <div class="emp-relationship" v-if="emp.关系">
            <div class="section-title">💕 与老板关系</div>
            <div class="meter-row">
              <span class="meter-label">好感度</span>
              <div class="progress-bar">
                <div
                  class="progress-bar-fill relationship-bar"
                  :style="{ width: (emp.关系.好感度 ?? 0) + '%' }"
                ></div>
              </div>
              <span class="meter-value">{{ emp.关系.好感度 ?? 0 }}</span>
            </div>
            <div class="meter-row">
              <span class="meter-label">信任度</span>
              <div class="progress-bar">
                <div
                  class="progress-bar-fill trust-bar"
                  :style="{ width: (emp.关系.信任度 ?? 0) + '%' }"
                ></div>
              </div>
              <span class="meter-value">{{ emp.关系.信任度 ?? 0 }}</span>
            </div>
          </div>

          <!-- 情绪与压力 -->
          <div class="emp-emotion" v-if="emp.私密">
            <div class="emotion-row">
              <span class="emotion-item">
                {{ emotionIcon(emp.私密.情绪) }} {{ emp.私密.情绪 || '平静' }}
              </span>
              <span class="stress-item" :class="stressClass(emp.私密.压力值 ?? 0)">
                🧠 压力: {{ emp.私密.压力值 ?? 0 }}%
              </span>
              <span class="ambition-item" v-if="emp.私密.野心等级 != null">
                🔥 野心: {{ emp.私密.野心等级 }}
              </span>
            </div>
          </div>

          <!-- 详细信息 -->
          <div class="emp-details">
            <div class="detail-row">
              <span class="detail-label">💰 薪资</span>
              <span class="detail-value">¥{{ formatNumber(emp.薪资) }}/月</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">📋 当前任务</span>
              <span class="detail-value">{{ emp.当前任务 || '暂无任务' }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">🧠 性格</span>
              <span class="detail-value">{{ emp.性格 || '未知' }}</span>
            </div>
            <div class="detail-row" v-if="emp.特长 && emp.特长.length > 0">
              <span class="detail-label">⭐ 特长</span>
              <span class="detail-value">{{ emp.特长.join('、') }}</span>
            </div>
            <div class="detail-row" v-if="emp.弱点 && emp.弱点.length > 0">
              <span class="detail-label">⚠️ 弱点</span>
              <span class="detail-value">{{ emp.弱点.join('、') }}</span>
            </div>
            <div class="detail-row" v-if="emp.经验值">
              <span class="detail-label">📊 经验值</span>
              <span class="detail-value">{{ emp.经验值 }}</span>
            </div>
          </div>

          <!-- 私密信息（好感度解锁） -->
          <div class="emp-private" v-if="emp.私密 && canViewPrivate(emp)">
            <div class="private-header" @click="togglePrivate(emp.ID)">
              <span>🔓 私密信息</span>
              <span class="toggle-icon">{{ expandedCards.has(emp.ID) ? '▼' : '▶' }}</span>
            </div>
            <div class="private-content" v-if="expandedCards.has(emp.ID)">
              <div class="private-row" v-if="emp.私密.真实性格?.length">
                <span class="private-label">真实性格</span>
                <span class="private-value">{{ emp.私密.真实性格.join('、') }}</span>
              </div>
              <div class="private-row" v-if="emp.私密.隐藏目标">
                <span class="private-label">隐藏目标</span>
                <span class="private-value">{{ emp.私密.隐藏目标 }}</span>
              </div>
              <div class="private-row" v-if="emp.私密.秘密">
                <span class="private-label">秘密</span>
                <span class="private-value secret-text">{{ emp.私密.秘密 }}</span>
              </div>
              <div class="private-row" v-if="emp.私密.忠诚动机">
                <span class="private-label">忠诚动机</span>
                <span class="private-value">{{ emp.私密.忠诚动机 }}</span>
              </div>
              <div class="private-row" v-if="emp.私密.近期生活事件">
                <span class="private-label">近期事件</span>
                <span class="private-value">{{ emp.私密.近期生活事件 }}</span>
              </div>
            </div>
          </div>
          <div class="emp-private locked" v-else-if="emp.私密">
            <div class="private-header locked">
              <span>🔒 私密信息（好感度不足，需要 ≥60）</span>
            </div>
          </div>

          <!-- 事件历史 -->
          <div class="emp-events" v-if="emp.事件历史?.length">
            <div class="section-title">📋 近期事件</div>
            <div class="event-list">
              <div
                v-for="event in emp.事件历史.slice(-3)"
                :key="event.id"
                class="event-item"
                :class="{ unhandled: !event.是否已处理 }"
              >
                <span class="event-type">{{ eventTypeIcon(event.类型) }}</span>
                <span class="event-desc">{{ event.描述 }}</span>
                <span class="event-time">{{ event.时间 }}</span>
                <button
                  v-if="!event.是否已处理"
                  class="btn btn-xs btn-primary"
                  @click="navigateToMainWithMessage(`处理${emp.姓名}的事件：${event.描述}`)"
                >
                  处理
                </button>
              </div>
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="emp-actions">
            <button class="btn btn-sm btn-ghost" @click="navigateToMainWithMessage(`给${emp.姓名}分配任务：`)">
              📋 分配任务
            </button>
            <button class="btn btn-sm btn-ghost" @click="navigateToMainWithMessage(`将${emp.姓名}的薪资调整为`)">
              💰 调整薪资
            </button>
            <button
              v-if="!emp.是管理层"
              class="btn btn-sm btn-ghost"
              @click="navigateToMainWithMessage(`提拔${emp.姓名}为管理层`)"
            >
              ⬆️ 提拔管理层
            </button>
            <button class="btn btn-sm btn-ghost" @click="navigateToMainWithMessage(`安排${emp.姓名}进行培训`)">
              📚 安排培训
            </button>
            <button class="btn btn-sm btn-ghost" @click="navigateToMainWithMessage(`让${emp.姓名}休息几天`)">
              🏖️ 安排休息
            </button>
            <!-- 互动按钮 -->
            <button class="btn btn-sm btn-ghost interaction-btn" @click="navigateToMainWithMessage(`和${emp.姓名}聊天`)">
              💬 聊天
            </button>
            <button class="btn btn-sm btn-ghost interaction-btn" @click="navigateToMainWithMessage(`送${emp.姓名}一份礼物`)">
              🎁 送礼
            </button>
            <button class="btn btn-sm btn-ghost interaction-btn" @click="navigateToMainWithMessage(`约${emp.姓名}一起吃饭`)">
              🍽️ 约饭
            </button>
            <button
              v-if="emp.关系?.与老板关系 === '暧昧'"
              class="btn btn-sm btn-ghost interaction-btn confession"
              @click="navigateToMainWithMessage(`向${emp.姓名}表白`)"
            >
              💕 表白
            </button>
            <button
              v-if="emp.关系?.与老板关系 === '恋人'"
              class="btn btn-sm btn-ghost interaction-btn proposal"
              @click="navigateToMainWithMessage(`向${emp.姓名}求婚`)"
            >
              💍 求婚
            </button>
            <button class="btn btn-sm btn-danger" @click="navigateToMainWithMessage(`解雇${emp.姓名}`)">
              🚪 解雇
            </button>
          </div>
        </div>
      </div>

      <!-- 招聘提示 -->
      <div class="recruit-section card">
        <div class="recruit-header">📢 招聘市场</div>
        <p class="recruit-hint">在主游戏面板中通过AI对话进行招聘</p>
        <p class="recruit-tip">提示：对AI说"我想招聘一名高级程序员"</p>
        <button class="btn btn-primary btn-sm" @click="navigateToMainWithMessage('我想招聘一名')">
          前往招聘
        </button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useGameStateStore } from '@/stores/gameStateStore';
import { useUIStore } from '@/stores/uiStore';
import type { Employee } from '@/types/game';

const router = useRouter();
const gameState = useGameStateStore();
const uiStore = useUIStore();

// 当前筛选
const activeFilter = ref<string>('全部');

// 展开的私密信息卡片
const expandedCards = ref<Set<string>>(new Set());

// 员工列表
const employeeList = computed<Employee[]>(() => {
  if (!gameState.employees) return [];
  return Object.values(gameState.employees);
});

// 部门列表（动态生成）
const departments = computed(() => {
  const depts = new Set<string>();
  employeeList.value.forEach(emp => {
    if (emp.部门) depts.add(emp.部门);
  });
  return Array.from(depts);
});

// 筛选tabs
const filterTabs = computed(() => {
  const tabs = [
    { key: '全部', label: '全部', count: employeeList.value.length },
  ];
  departments.value.forEach(dept => {
    const count = employeeList.value.filter(e => e.部门 === dept).length;
    tabs.push({ key: dept, label: dept.replace('部', ''), count });
  });
  // 管理层tab
  const mgmtCount = employeeList.value.filter(e => e.是管理层).length;
  if (mgmtCount > 0) {
    tabs.push({ key: '管理层', label: '管理层', count: mgmtCount });
  }
  return tabs;
});

// 筛选后的员工
const filteredEmployees = computed(() => {
  if (activeFilter.value === '全部') return employeeList.value;
  if (activeFilter.value === '管理层') return employeeList.value.filter(e => e.是管理层);
  return employeeList.value.filter(e => e.部门 === activeFilter.value);
});

// 统计数据
const totalSalary = computed(() => {
  return employeeList.value.reduce((sum, emp) => sum + (emp.薪资 || 0), 0);
});

const avgSatisfaction = computed(() => {
  if (employeeList.value.length === 0) return 0;
  const total = employeeList.value.reduce((sum, emp) => sum + (emp.满意度 || 0), 0);
  return Math.round(total / employeeList.value.length);
});

const avgSatisfactionColor = computed(() => {
  if (avgSatisfaction.value >= 70) return 'text-success';
  if (avgSatisfaction.value >= 40) return 'text-warning';
  return 'text-danger';
});

const managementCount = computed(() => {
  return employeeList.value.filter(e => e.是管理层).length;
});

// 格式化金额
function formatMoney(amount: number | undefined): string {
  if (amount === undefined || amount === null) return '0';
  if (amount >= 100000000) return (amount / 100000000).toFixed(1) + '亿';
  if (amount >= 10000) return (amount / 10000).toFixed(1) + '万';
  return formatNumber(amount);
}

function formatNumber(num: number | undefined): string {
  if (num === undefined || num === null) return '0';
  return num.toLocaleString('zh-CN');
}

// 状态相关
function statusClass(status: string): string {
  switch (status) {
    case '正常': return 'status-normal';
    case '加班': return 'status-overtime';
    case '请假': return 'status-leave';
    case '离职中': return 'status-leaving';
    case '已离职': return 'status-left';
    default: return 'status-normal';
  }
}

function statusIcon(status: string): string {
  switch (status) {
    case '正常': return '🟢';
    case '加班': return '🔴';
    case '请假': return '🟡';
    case '离职中': return '🟠';
    case '已离职': return '⚫';
    default: return '🟢';
  }
}

// 技能颜色
function skillColor(value: number | undefined): string {
  if (value === undefined || value === null) value = 0;
  if (value >= 80) return 'linear-gradient(90deg, #00cc6a, #00ff88)';
  if (value >= 60) return 'linear-gradient(90deg, #0099cc, #00d4ff)';
  if (value >= 40) return 'linear-gradient(90deg, #cc8800, #ffaa00)';
  return 'linear-gradient(90deg, #666680, #a0a0b0)';
}

// 进度条颜色
function meterClass(value: number | undefined): string {
  if (value === undefined || value === null) value = 0;
  if (value >= 70) return 'success';
  if (value >= 40) return 'warning';
  return 'danger';
}

// 跳转到主面板并预填消息
function navigateToMainWithMessage(message: string) {
  uiStore.pendingMessage = message;
  uiStore.setCurrentPanel('GameMain');
  router.push('/game');
}

// 关系图标
function relationshipIcon(rel: string | undefined): string {
  switch (rel) {
    case '配偶': return '❤️';
    case '恋人': return '💕';
    case '暧昧': return '💗';
    case '亲密': return '💛';
    case '信任': return '🤝';
    case '普通同事': return '👤';
    case '陌生': return '👻';
    default: return '👤';
  }
}

// 情绪图标
function emotionIcon(emotion: string | undefined): string {
  switch (emotion) {
    case '开心': return '😊';
    case '平静': return '😐';
    case '焦虑': return '😰';
    case '愤怒': return '😡';
    case '沮丧': return '😢';
    case '兴奋': return '🤩';
    default: return '😐';
  }
}

// 压力等级样式
function stressClass(value: number): string {
  if (value >= 80) return 'stress-critical';
  if (value >= 60) return 'stress-high';
  if (value >= 40) return 'stress-medium';
  return 'stress-low';
}

// 事件类型图标
function eventTypeIcon(type: string): string {
  switch (type) {
    case '工作': return '💼';
    case '社交': return '🤝';
    case '冲突': return '⚡';
    case '八卦': return '🗣️';
    case '算计': return '🎭';
    case '感情': return '💕';
    case '离职': return '🚪';
    case '晋升': return '⬆️';
    default: return '📌';
  }
}

// 是否可以查看私密信息（好感度 >= 60）
function canViewPrivate(emp: Employee): boolean {
  return (emp.关系?.好感度 ?? 0) >= 60;
}

// 获取未处理事件数量
function getUnhandledEventCount(emp: Employee): number {
  if (!emp.事件历史) return 0;
  return emp.事件历史.filter(e => !e.是否已处理).length;
}

// 切换私密信息展开
function togglePrivate(empId: string) {
  if (expandedCards.value.has(empId)) {
    expandedCards.value.delete(empId);
  } else {
    expandedCards.value.add(empId);
  }
}
</script>

<style scoped>
/* 头部统计 */
.panel-header {
  margin-bottom: 16px;
}

.stats-bar {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  margin-top: 12px;
  padding: 12px 16px;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stat-label {
  font-size: 11px;
  color: var(--text-muted);
}

.stat-value {
  font-size: 16px;
  font-weight: 700;
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
  margin-bottom: 8px;
}

/* 筛选tabs */
.filter-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border-color);
}

.filter-tab {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 14px;
  border: 1px solid var(--border-color);
  border-radius: 20px;
  background: transparent;
  color: var(--text-secondary);
  font-size: 13px;
  cursor: pointer;
  transition: all var(--transition-fast);
  font-family: var(--font-family);
}

.filter-tab:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.filter-tab.active {
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

/* 员工列表 */
.employee-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 20px;
}

/* 员工卡片 */
.employee-card {
  padding: 16px;
}

.emp-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
}

.emp-avatar {
  font-size: 32px;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-tertiary);
  border-radius: 50%;
  flex-shrink: 0;
}

.emp-basic {
  flex: 1;
  min-width: 0;
}

.emp-name-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.emp-name {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
}

.emp-status {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 10px;
}

.status-normal {
  background: rgba(0, 255, 136, 0.1);
  color: var(--color-success);
}

.status-overtime {
  background: rgba(255, 68, 68, 0.1);
  color: var(--color-danger);
}

.status-leave {
  background: rgba(255, 170, 0, 0.1);
  color: var(--color-warning);
}

.status-leaving {
  background: rgba(255, 140, 0, 0.1);
  color: #ff8c00;
}

.status-left {
  background: rgba(102, 102, 128, 0.1);
  color: var(--text-muted);
}

.emp-position {
  font-size: 13px;
  color: var(--text-secondary);
  margin-top: 2px;
}

/* 技能 */
.emp-skills {
  margin-bottom: 12px;
  padding: 10px;
  background: var(--bg-tertiary);
  border-radius: var(--radius-md);
}

.skills-title {
  font-size: 12px;
  color: var(--text-muted);
  margin-bottom: 8px;
  font-weight: 600;
}

.skills-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 6px;
}

.skill-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.skill-name {
  font-size: 12px;
  color: var(--text-secondary);
  width: 28px;
  flex-shrink: 0;
}

.skill-bar-bg {
  flex: 1;
  height: 6px;
  background: var(--bg-input);
  border-radius: 3px;
  overflow: hidden;
}

.skill-bar-fill {
  height: 100%;
  border-radius: 3px;
  transition: width var(--transition-normal);
}

.skill-value {
  font-size: 11px;
  color: var(--text-muted);
  width: 24px;
  text-align: right;
  flex-shrink: 0;
}

/* 满意度/忠诚度 */
.emp-meters {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 12px;
}

.meter-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.meter-label {
  font-size: 12px;
  color: var(--text-secondary);
  width: 48px;
  flex-shrink: 0;
}

.meter-value {
  font-size: 12px;
  color: var(--text-muted);
  width: 36px;
  text-align: right;
  flex-shrink: 0;
}

/* 详细信息 */
.emp-details {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 6px;
  margin-bottom: 12px;
  padding: 10px;
  background: var(--bg-tertiary);
  border-radius: var(--radius-md);
}

.detail-row {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  font-size: 13px;
}

.detail-label {
  color: var(--text-muted);
  flex-shrink: 0;
  white-space: nowrap;
}

.detail-value {
  color: var(--text-secondary);
  word-break: break-all;
}

/* 操作按钮 */
.emp-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding-top: 10px;
  border-top: 1px solid var(--border-color);
}

/* 招聘区域 */
.recruit-section {
  padding: 16px;
  text-align: center;
}

.recruit-header {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.recruit-hint {
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 4px;
}

.recruit-tip {
  font-size: 12px;
  color: var(--text-muted);
  margin-bottom: 12px;
}

/* 关系标签 */
.relationship-tag {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
  background: rgba(255, 105, 180, 0.1);
  color: #ff69b4;
}

.rel-配偶 { background: rgba(255, 0, 0, 0.12); color: #ff4444; }
.rel-恋人 { background: rgba(255, 105, 180, 0.12); color: #ff69b4; }
.rel-暧昧 { background: rgba(255, 182, 193, 0.12); color: #ffb6c1; }
.rel-亲密 { background: rgba(255, 215, 0, 0.12); color: #ffd700; }
.rel-信任 { background: rgba(0, 212, 255, 0.12); color: #00d4ff; }
.rel-普通同事 { background: rgba(160, 160, 176, 0.12); color: #a0a0b0; }
.rel-陌生 { background: rgba(102, 102, 128, 0.08); color: #666680; }

/* 事件badge */
.event-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 9px;
  background: var(--color-danger);
  color: #fff;
  font-size: 11px;
  font-weight: 700;
}

/* 关系进度条 */
.emp-relationship {
  margin-bottom: 12px;
  padding: 10px;
  background: var(--bg-tertiary);
  border-radius: var(--radius-md);
}

.section-title {
  font-size: 12px;
  color: var(--text-muted);
  margin-bottom: 8px;
  font-weight: 600;
}

.relationship-bar {
  background: linear-gradient(90deg, #ff69b4, #ff1493) !important;
}

.trust-bar {
  background: linear-gradient(90deg, #00bcd4, #00e5ff) !important;
}

/* 情绪与压力 */
.emp-emotion {
  margin-bottom: 12px;
  padding: 8px 10px;
  background: var(--bg-tertiary);
  border-radius: var(--radius-md);
}

.emotion-row {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  font-size: 13px;
}

.emotion-item {
  color: var(--text-secondary);
}

.stress-item {
  font-weight: 600;
}

.stress-low { color: var(--color-success); }
.stress-medium { color: var(--color-warning); }
.stress-high { color: #ff8c00; }
.stress-critical { color: var(--color-danger); }

.ambition-item {
  color: #ff6b35;
}

/* 私密信息 */
.emp-private {
  margin-bottom: 12px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.emp-private.locked {
  opacity: 0.5;
}

.private-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: var(--bg-tertiary);
  cursor: pointer;
  font-size: 13px;
  color: var(--text-secondary);
  user-select: none;
}

.private-header.locked {
  cursor: default;
  font-size: 12px;
  color: var(--text-muted);
}

.toggle-icon {
  font-size: 10px;
  color: var(--text-muted);
}

.private-content {
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.private-row {
  display: flex;
  gap: 8px;
  font-size: 13px;
}

.private-label {
  color: var(--text-muted);
  flex-shrink: 0;
  min-width: 64px;
}

.private-value {
  color: var(--text-secondary);
}

.secret-text {
  color: #ff6b6b;
  font-style: italic;
}

/* 事件历史 */
.emp-events {
  margin-bottom: 12px;
  padding: 10px;
  background: var(--bg-tertiary);
  border-radius: var(--radius-md);
}

.event-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.event-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: var(--radius-sm);
  font-size: 12px;
  background: var(--bg-card);
}

.event-item.unhandled {
  border-left: 3px solid var(--color-warning);
  background: rgba(255, 170, 0, 0.05);
}

.event-type {
  flex-shrink: 0;
}

.event-desc {
  flex: 1;
  color: var(--text-secondary);
}

.event-time {
  font-size: 11px;
  color: var(--text-muted);
  flex-shrink: 0;
}

.btn-xs {
  padding: 2px 8px;
  font-size: 11px;
}

/* 互动按钮 */
.interaction-btn {
  color: #ff69b4 !important;
  border-color: rgba(255, 105, 180, 0.3) !important;
}

.interaction-btn:hover {
  background: rgba(255, 105, 180, 0.1) !important;
}

.interaction-btn.confession {
  color: #ff1493 !important;
  border-color: rgba(255, 20, 147, 0.3) !important;
}

.interaction-btn.proposal {
  color: #ff4444 !important;
  border-color: rgba(255, 68, 68, 0.3) !important;
}
</style>
