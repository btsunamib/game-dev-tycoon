<!--
  AI游戏开发商模拟器 - 财务管理面板
  收支概览、部门预算、贷款、投资人
-->
<template>
  <div class="panel-container">
    <h2 class="panel-title">💰 财务管理</h2>

    <!-- 资金概览卡片 -->
    <div class="overview-cards">
      <div class="overview-card card">
        <div class="ov-label">当前资金</div>
        <div class="ov-value" :style="{ color: gameState.fundsColor }">
          ¥{{ formatMoney(finance?.资金 ?? 0) }}
        </div>
        <div class="ov-indicator" :class="fundsIndicatorClass">
          {{ fundsIndicatorText }}
        </div>
      </div>
      <div class="overview-card card">
        <div class="ov-label">月收入</div>
        <div class="ov-value text-success">¥{{ formatMoney(finance?.月收入 ?? 0) }}</div>
        <div class="ov-indicator text-success" v-if="incomeChange !== null">
          {{ incomeChange >= 0 ? '↑' : '↓' }}{{ Math.abs(incomeChange) }}%
        </div>
      </div>
      <div class="overview-card card">
        <div class="ov-label">月支出</div>
        <div class="ov-value text-danger">¥{{ formatMoney(finance?.月支出 ?? 0) }}</div>
        <div class="ov-indicator text-danger" v-if="expenseChange !== null">
          {{ expenseChange >= 0 ? '↑' : '↓' }}{{ Math.abs(expenseChange) }}%
        </div>
      </div>
      <div class="overview-card card">
        <div class="ov-label">月净利润</div>
        <div class="ov-value" :class="netProfit >= 0 ? 'text-success' : 'text-danger'">
          {{ netProfit >= 0 ? '+' : '' }}¥{{ formatMoney(netProfit) }}
        </div>
      </div>
    </div>

    <!-- 收支趋势图（纯CSS柱状图） -->
    <div class="chart-section card" v-if="financeHistory.length > 0">
      <div class="section-title">📊 收支趋势（最近{{ financeHistory.length }}个月）</div>
      <div class="bar-chart">
        <div class="chart-bars">
          <div v-for="(record, idx) in financeHistory" :key="idx" class="chart-column">
            <div class="bar-group">
              <div class="bar-wrapper">
                <div
                  class="bar bar-income"
                  :style="{ height: barHeight(record.收入) + '%' }"
                  :title="`收入: ¥${formatMoney(record.收入)}`"
                ></div>
              </div>
              <div class="bar-wrapper">
                <div
                  class="bar bar-expense"
                  :style="{ height: barHeight(record.支出) + '%' }"
                  :title="`支出: ¥${formatMoney(record.支出)}`"
                ></div>
              </div>
            </div>
            <div class="bar-label">{{ record.月份 }}</div>
          </div>
        </div>
        <div class="chart-legend">
          <span class="legend-item"><span class="legend-dot income"></span> 收入</span>
          <span class="legend-item"><span class="legend-dot expense"></span> 支出</span>
        </div>
      </div>
    </div>

    <!-- 部门预算分配 -->
    <div class="budget-section card" v-if="finance?.部门预算">
      <div class="section-title">📋 部门预算分配</div>
      <div class="budget-list">
        <div v-for="(amount, dept) in finance.部门预算" :key="dept" class="budget-item">
          <div class="budget-header">
            <span class="budget-dept">{{ dept }}</span>
            <span class="budget-amount">¥{{ formatMoney(amount as number) }}</span>
            <span class="budget-percent">{{ budgetPercent(amount as number) }}%</span>
          </div>
          <div class="progress-bar">
            <div
              class="progress-bar-fill"
              :style="{ width: budgetPercent(amount as number) + '%' }"
            ></div>
          </div>
        </div>
      </div>
      <div class="budget-hint">
        <button class="btn btn-sm btn-ghost" @click="navigateToMainWithMessage('调整部门预算分配')">
          💡 通过AI对话调整预算
        </button>
      </div>
    </div>

    <!-- 贷款信息 -->
    <div class="loan-section card" v-if="loans.length > 0">
      <div class="section-title">🏦 贷款信息</div>
      <div class="loan-list">
        <div v-for="loan in loans" :key="loan.ID" class="loan-item">
          <div class="loan-header">
            <span class="loan-source">{{ loan.来源 }}</span>
            <span class="loan-amount text-danger">¥{{ formatMoney(loan.金额) }}</span>
          </div>
          <div class="loan-details">
            <span>利率: {{ (loan.利率 * 100).toFixed(1) }}%</span>
            <span>剩余: ¥{{ formatMoney(loan.剩余) }}</span>
            <span>月还款: ¥{{ formatMoney(loan.月还款) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 投资人 -->
    <div class="investor-section card" v-if="investors.length > 0">
      <div class="section-title">💼 投资人</div>
      <div class="investor-list">
        <div v-for="inv in investors" :key="inv.ID" class="investor-item">
          <div class="investor-header">
            <span class="investor-name">{{ inv.名称 }}</span>
            <span class="investor-amount text-success">¥{{ formatMoney(inv.投资金额) }}</span>
          </div>
          <div class="investor-details">
            <span>占股: {{ (inv.占股比例 * 100).toFixed(1) }}%</span>
            <span>满意度: {{ inv.满意度 }}%</span>
            <span>关系: {{ inv.关系 }}</span>
          </div>
          <div class="investor-req" v-if="inv.要求">
            <span class="req-label">要求:</span> {{ inv.要求 }}
          </div>
        </div>
      </div>
    </div>

    <!-- 最近收支记录 -->
    <div class="records-section card">
      <div class="section-title">📜 最近收支记录</div>
      <div v-if="recentRecords.length === 0" class="records-empty">
        暂无收支记录
      </div>
      <div v-else class="records-list">
        <div
          v-for="(record, idx) in recentRecords"
          :key="idx"
          class="record-item"
          :class="record.type"
        >
          <span class="record-tag" :class="record.type">
            {{ record.type === 'income' ? '收入' : '支出' }}
          </span>
          <span class="record-desc">{{ record.desc }}</span>
          <span class="record-amount" :class="record.type">
            {{ record.type === 'income' ? '+' : '-' }}¥{{ formatMoney(record.amount) }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useGameStateStore } from '@/stores/gameStateStore';
import { useUIStore } from '@/stores/uiStore';

const router = useRouter();
const gameState = useGameStateStore();
const uiStore = useUIStore();

// 财务数据
const finance = computed(() => gameState.finance);

// 净利润
const netProfit = computed(() => {
  return (finance.value?.月收入 ?? 0) - (finance.value?.月支出 ?? 0);
});

// 财务历史（最近6个月）
const financeHistory = computed(() => {
  if (!finance.value?.财务历史) return [];
  return finance.value.财务历史.slice(-6);
});

// 收入变化百分比
const incomeChange = computed<number | null>(() => {
  const history = financeHistory.value;
  if (history.length < 2) return null;
  const prev = history[history.length - 2].收入;
  const curr = history[history.length - 1].收入;
  if (prev === 0) return null;
  return Math.round(((curr - prev) / prev) * 100);
});

// 支出变化百分比
const expenseChange = computed<number | null>(() => {
  const history = financeHistory.value;
  if (history.length < 2) return null;
  const prev = history[history.length - 2].支出;
  const curr = history[history.length - 1].支出;
  if (prev === 0) return null;
  return Math.round(((curr - prev) / prev) * 100);
});

// 资金状态指示
const fundsIndicatorClass = computed(() => {
  const funds = finance.value?.资金 ?? 0;
  if (funds >= 1000000) return 'text-success';
  if (funds >= 200000) return 'text-warning';
  return 'text-danger';
});

const fundsIndicatorText = computed(() => {
  const funds = finance.value?.资金 ?? 0;
  if (funds >= 1000000) return '🟢 充裕';
  if (funds >= 200000) return '🟡 一般';
  return '🔴 紧张';
});

// 贷款列表
const loans = computed(() => finance.value?.贷款 ?? []);

// 投资人列表
const investors = computed(() => finance.value?.投资人 ?? []);

// 部门预算总额
const totalBudget = computed(() => {
  if (!finance.value?.部门预算) return 0;
  const budget = finance.value.部门预算;
  return Object.values(budget).reduce((sum, v) => sum + (v as number), 0);
});

// 部门预算占比
function budgetPercent(amount: number): number {
  if (totalBudget.value === 0) return 0;
  return Math.round((amount / totalBudget.value) * 100);
}

// 柱状图最大值
const chartMax = computed(() => {
  if (financeHistory.value.length === 0) return 1;
  let max = 0;
  financeHistory.value.forEach(r => {
    max = Math.max(max, r.收入, r.支出);
  });
  return max || 1;
});

function barHeight(value: number): number {
  return Math.max(2, (value / chartMax.value) * 100);
}

// 最近收支记录（合并收入和支出明细，按时间排序，取最近10条）
const recentRecords = computed(() => {
  const records: Array<{ type: 'income' | 'expense'; desc: string; amount: number; time: string }> = [];

  if (finance.value?.收入明细) {
    finance.value.收入明细.forEach(item => {
      records.push({
        type: 'income',
        desc: `${item.来源} (${item.类型})`,
        amount: item.金额,
        time: item.日期 ? `${item.日期.年}-${item.日期.月}-${item.日期.日}` : '',
      });
    });
  }

  if (finance.value?.支出明细) {
    finance.value.支出明细.forEach(item => {
      records.push({
        type: 'expense',
        desc: `${item.项目} (${item.类型})`,
        amount: item.金额,
        time: item.日期 ? `${item.日期.年}-${item.日期.月}-${item.日期.日}` : '',
      });
    });
  }

  // 按时间倒序，取最近10条
  records.sort((a, b) => b.time.localeCompare(a.time));
  return records.slice(0, 10);
});

// 格式化金额
function formatMoney(amount: number): string {
  const abs = Math.abs(amount);
  if (abs >= 100000000) return (amount / 100000000).toFixed(1) + '亿';
  if (abs >= 10000) return (amount / 10000).toFixed(1) + '万';
  return amount.toLocaleString('zh-CN');
}

// 跳转到主面板并预填消息
function navigateToMainWithMessage(message: string) {
  uiStore.pendingMessage = message;
  uiStore.setCurrentPanel('GameMain');
  router.push('/game');
}
</script>

<style scoped>
/* 资金概览卡片 */
.overview-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 12px;
  margin-bottom: 20px;
}

.overview-card {
  padding: 14px 16px;
  text-align: center;
}

.ov-label {
  font-size: 12px;
  color: var(--text-muted);
  margin-bottom: 6px;
}

.ov-value {
  font-size: 22px;
  font-weight: 700;
  margin-bottom: 4px;
}

.ov-indicator {
  font-size: 12px;
}

/* 通用section标题 */
.section-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 14px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border-color);
}

/* 柱状图 */
.chart-section {
  margin-bottom: 20px;
  padding: 16px;
}

.bar-chart {
  padding: 8px 0;
}

.chart-bars {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  height: 160px;
  padding: 0 8px;
}

.chart-column {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
}

.bar-group {
  flex: 1;
  display: flex;
  align-items: flex-end;
  gap: 4px;
  width: 100%;
}

.bar-wrapper {
  flex: 1;
  display: flex;
  align-items: flex-end;
  height: 100%;
}

.bar {
  width: 100%;
  border-radius: 3px 3px 0 0;
  transition: height var(--transition-normal);
  min-height: 2px;
  cursor: pointer;
}

.bar-income {
  background: linear-gradient(180deg, var(--color-success), var(--color-success-dark));
}

.bar-expense {
  background: linear-gradient(180deg, var(--color-danger), var(--color-danger-dark));
}

.bar:hover {
  opacity: 0.8;
}

.bar-label {
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 6px;
  white-space: nowrap;
}

.chart-legend {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 12px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--text-secondary);
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 2px;
}

.legend-dot.income {
  background: var(--color-success);
}

.legend-dot.expense {
  background: var(--color-danger);
}

/* 部门预算 */
.budget-section {
  margin-bottom: 20px;
  padding: 16px;
}

.budget-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.budget-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.budget-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.budget-dept {
  font-size: 13px;
  color: var(--text-secondary);
  width: 40px;
  flex-shrink: 0;
}

.budget-amount {
  font-size: 13px;
  color: var(--text-primary);
  font-weight: 600;
  margin-left: auto;
}

.budget-percent {
  font-size: 12px;
  color: var(--text-muted);
  width: 36px;
  text-align: right;
}

.budget-hint {
  margin-top: 12px;
  text-align: center;
}

/* 贷款 */
.loan-section {
  margin-bottom: 20px;
  padding: 16px;
}

.loan-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.loan-item {
  padding: 10px;
  background: var(--bg-tertiary);
  border-radius: var(--radius-md);
}

.loan-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.loan-source {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.loan-amount {
  font-size: 14px;
  font-weight: 700;
}

.loan-details {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: var(--text-secondary);
}

/* 投资人 */
.investor-section {
  margin-bottom: 20px;
  padding: 16px;
}

.investor-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.investor-item {
  padding: 10px;
  background: var(--bg-tertiary);
  border-radius: var(--radius-md);
}

.investor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.investor-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.investor-amount {
  font-size: 14px;
  font-weight: 700;
}

.investor-details {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 4px;
}

.investor-req {
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 4px;
}

.req-label {
  color: var(--color-warning);
}

/* 收支记录 */
.records-section {
  margin-bottom: 20px;
  padding: 16px;
}

.records-empty {
  text-align: center;
  padding: 24px;
  color: var(--text-muted);
  font-size: 13px;
}

.records-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.record-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  background: var(--bg-tertiary);
  border-radius: var(--radius-sm);
  font-size: 13px;
}

.record-tag {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 600;
  flex-shrink: 0;
}

.record-tag.income {
  background: rgba(0, 255, 136, 0.12);
  color: var(--color-success);
}

.record-tag.expense {
  background: rgba(255, 68, 68, 0.12);
  color: var(--color-danger);
}

.record-desc {
  flex: 1;
  color: var(--text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.record-amount {
  font-weight: 600;
  flex-shrink: 0;
}

.record-amount.income {
  color: var(--color-success);
}

.record-amount.expense {
  color: var(--color-danger);
}
</style>
