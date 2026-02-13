<!--
  AI游戏开发商模拟器 - Boss直聘招聘平台
  模仿Boss直聘UI风格，用于招聘员工
-->
<template>
  <div class="boss-page">
    <!-- 顶部导航 -->
    <div class="boss-header">
      <div class="header-left">
        <button class="back-btn" @click="goBack">← 返回</button>
        <span class="boss-logo">💼 BOSS直聘</span>
      </div>
      <div class="header-right">
        <span class="company-tag">{{ companyName }}正在招聘</span>
      </div>
    </div>

    <!-- 发布职位提示 -->
    <div class="publish-section">
      <div class="publish-icon">📢</div>
      <div class="publish-content">
        <div class="publish-title">发布职位</div>
        <div class="publish-hint">在主面板中告诉AI你想招聘什么职位</div>
      </div>
      <button class="publish-btn" @click="goToMainWithMessage('我想发布一个招聘职位：')">
        去发布
      </button>
    </div>

    <!-- 当前招聘中的职位 -->
    <div class="section">
      <div class="section-title">📋 当前招聘中的职位</div>
      <div v-if="recruitmentPositions.length === 0" class="empty-hint">
        暂无招聘职位，去主面板告诉AI你想招聘什么人才
      </div>
      <div v-else class="position-list">
        <div
          v-for="(pos, index) in recruitmentPositions"
          :key="index"
          class="position-card"
        >
          <div class="pos-header">
            <span class="pos-name">{{ pos.职位名 }}</span>
            <span class="pos-dept">{{ pos.部门 }}</span>
          </div>
          <div class="pos-info">
            <span class="pos-salary">{{ pos.薪资范围 }}</span>
            <span class="pos-req">{{ pos.要求 }}</span>
          </div>
          <div class="pos-footer">
            <span class="pos-status" :class="pos.状态 === '招聘中' ? 'active' : 'closed'">
              {{ pos.状态 === '招聘中' ? '🟢' : '🔴' }} {{ pos.状态 }}
            </span>
            <span class="pos-resume">收到简历: {{ pos.收到简历数 ?? 0 }}份</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 候选人列表 -->
    <div class="section">
      <div class="section-title">📄 候选人列表</div>
      <div v-if="candidates.length === 0" class="empty-hint">
        暂无候选人，发布职位后AI会为你推荐候选人
      </div>
      <div v-else class="candidate-list">
        <div
          v-for="(cand, index) in candidates"
          :key="index"
          class="candidate-card"
        >
          <div class="cand-header">
            <span class="cand-avatar">👤</span>
            <div class="cand-basic">
              <span class="cand-name">{{ cand.姓名 }}</span>
              <span class="cand-status-badge" :class="candidateStatusClass(cand.状态)">
                {{ cand.状态 }}
              </span>
            </div>
          </div>
          <div class="cand-info">
            <span>期望薪资: {{ formatSalary(cand.期望薪资) }}</span>
            <span>经验: {{ cand.经验年数 }}年</span>
          </div>
          <div class="cand-skills" v-if="cand.技能预览">
            <span class="skills-label">技能:</span>
            <span
              v-for="(val, skill) in cand.技能预览"
              :key="String(skill)"
              class="skill-tag"
            >
              {{ skill }}{{ val }}
            </span>
          </div>
          <div class="cand-intro" v-if="cand.自我介绍">
            "{{ cand.自我介绍 }}"
          </div>
          <div class="cand-actions">
            <button class="action-btn chat" @click="goToMainWithMessage(`和候选人${cand.姓名}沟通`)">
              💬 沟通
            </button>
            <button class="action-btn hire" @click="goToMainWithMessage(`录用候选人${cand.姓名}`)">
              ✅ 录用
            </button>
            <button class="action-btn reject" @click="goToMainWithMessage(`拒绝候选人${cand.姓名}`)">
              ❌ 拒绝
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 已录用员工 -->
    <div class="section hired-section">
      <div class="section-title">👥 已录用员工</div>
      <div class="hired-stats">
        <span>总员工数: {{ employeeCount }}人</span>
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

// 公司名称
const companyName = computed(() => gameState.companyInfo?.名称 ?? '我的公司');

// 员工数量
const employeeCount = computed(() => gameState.employeeCount);

// 招聘职位（从store.recruitment读取，AI通过tavern_commands写入 公司.招聘）
const recruitmentPositions = computed(() => {
  const data = gameState.recruitment;
  if (data?.招聘职位 && Array.isArray(data.招聘职位)) {
    return data.招聘职位;
  }
  return [];
});

// 候选人列表
const candidates = computed(() => {
  const data = gameState.recruitment;
  if (data?.候选人 && Array.isArray(data.候选人)) {
    return data.候选人;
  }
  return [];
});

// 格式化薪资
function formatSalary(salary: number | undefined): string {
  if (salary === undefined || salary === null) return '面议';
  if (salary >= 10000) return (salary / 1000).toFixed(0) + 'K';
  return '¥' + salary.toLocaleString();
}

// 候选人状态样式
function candidateStatusClass(status: string): string {
  switch (status) {
    case '待沟通': return 'status-pending';
    case '面试中': return 'status-interview';
    case '已录用': return 'status-hired';
    case '已拒绝': return 'status-rejected';
    default: return 'status-pending';
  }
}

// 返回
function goBack() {
  router.push('/game/social-media');
}

// 跳转到主面板并预填消息
function goToMainWithMessage(message: string) {
  uiStore.pendingMessage = message;
  uiStore.setCurrentPanel('GameMain');
  router.push('/game');
}
</script>

<style scoped>
.boss-page {
  height: 100%;
  overflow-y: auto;
  background: #171723;
}

/* 顶部导航 */
.boss-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  background: #00bebc;
  color: #fff;
  position: sticky;
  top: 0;
  z-index: 10;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.back-btn {
  background: none;
  border: 1px solid rgba(255, 255, 255, 0.4);
  color: #fff;
  padding: 4px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-family: var(--font-family);
  font-size: 13px;
  transition: all 0.2s;
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: #fff;
}

.boss-logo {
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 1px;
}

.company-tag {
  font-size: 13px;
  background: rgba(255, 255, 255, 0.2);
  padding: 4px 12px;
  border-radius: 12px;
}

/* 发布职位 */
.publish-section {
  display: flex;
  align-items: center;
  gap: 14px;
  margin: 16px 20px;
  padding: 16px 20px;
  background: linear-gradient(135deg, rgba(0, 190, 188, 0.15), rgba(0, 190, 188, 0.05));
  border: 1px solid rgba(0, 190, 188, 0.3);
  border-radius: 12px;
}

.publish-icon {
  font-size: 32px;
}

.publish-content {
  flex: 1;
}

.publish-title {
  font-size: 16px;
  font-weight: 600;
  color: #e0e0e0;
  margin-bottom: 4px;
}

.publish-hint {
  font-size: 13px;
  color: #888;
}

.publish-btn {
  padding: 8px 20px;
  background: #00bebc;
  border: none;
  border-radius: 8px;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  font-family: var(--font-family);
  transition: all 0.2s;
}

.publish-btn:hover {
  background: #00d4d2;
  box-shadow: 0 2px 12px rgba(0, 190, 188, 0.3);
}

/* 区块 */
.section {
  margin: 0 20px 20px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #e0e0e0;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.empty-hint {
  text-align: center;
  padding: 32px 16px;
  color: #666;
  font-size: 14px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  border: 1px dashed rgba(255, 255, 255, 0.1);
}

/* 职位卡片 */
.position-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.position-card {
  padding: 16px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  transition: all 0.2s;
}

.position-card:hover {
  border-color: rgba(0, 190, 188, 0.3);
  background: rgba(255, 255, 255, 0.06);
}

.pos-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.pos-name {
  font-size: 16px;
  font-weight: 600;
  color: #e0e0e0;
}

.pos-dept {
  font-size: 12px;
  color: #888;
  background: rgba(255, 255, 255, 0.06);
  padding: 2px 8px;
  border-radius: 4px;
}

.pos-info {
  display: flex;
  gap: 16px;
  margin-bottom: 8px;
  font-size: 13px;
}

.pos-salary {
  color: #00bebc;
  font-weight: 600;
}

.pos-req {
  color: #999;
}

.pos-footer {
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 12px;
  color: #888;
}

.pos-status.active {
  color: #00cc6a;
}

.pos-status.closed {
  color: #ff4444;
}

/* 候选人卡片 */
.candidate-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.candidate-card {
  padding: 16px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  transition: all 0.2s;
}

.candidate-card:hover {
  border-color: rgba(0, 190, 188, 0.3);
}

.cand-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.cand-avatar {
  font-size: 28px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 190, 188, 0.1);
  border-radius: 50%;
}

.cand-basic {
  display: flex;
  align-items: center;
  gap: 8px;
}

.cand-name {
  font-size: 16px;
  font-weight: 600;
  color: #e0e0e0;
}

.cand-status-badge {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
}

.status-pending {
  background: rgba(255, 170, 0, 0.15);
  color: #ffaa00;
}

.status-interview {
  background: rgba(0, 190, 188, 0.15);
  color: #00bebc;
}

.status-hired {
  background: rgba(0, 204, 106, 0.15);
  color: #00cc6a;
}

.status-rejected {
  background: rgba(255, 68, 68, 0.15);
  color: #ff4444;
}

.cand-info {
  display: flex;
  gap: 16px;
  margin-bottom: 8px;
  font-size: 13px;
  color: #aaa;
}

.cand-skills {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 8px;
}

.skills-label {
  font-size: 12px;
  color: #888;
}

.skill-tag {
  font-size: 11px;
  padding: 2px 8px;
  background: rgba(0, 190, 188, 0.1);
  border: 1px solid rgba(0, 190, 188, 0.2);
  border-radius: 4px;
  color: #00bebc;
}

.cand-intro {
  font-size: 13px;
  color: #999;
  font-style: italic;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 6px;
  margin-bottom: 10px;
  line-height: 1.5;
}

.cand-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  background: transparent;
  color: #ccc;
  font-size: 13px;
  cursor: pointer;
  font-family: var(--font-family);
  transition: all 0.2s;
  text-align: center;
}

.action-btn.chat:hover {
  border-color: #00bebc;
  color: #00bebc;
  background: rgba(0, 190, 188, 0.08);
}

.action-btn.hire:hover {
  border-color: #00cc6a;
  color: #00cc6a;
  background: rgba(0, 204, 106, 0.08);
}

.action-btn.reject:hover {
  border-color: #ff4444;
  color: #ff4444;
  background: rgba(255, 68, 68, 0.08);
}

/* 已录用 */
.hired-section {
  padding-bottom: 20px;
}

.hired-stats {
  display: flex;
  gap: 20px;
  font-size: 14px;
  color: #aaa;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
}

/* 响应式 */
@media (max-width: 768px) {
  .boss-header {
    padding: 10px 14px;
  }

  .section {
    margin: 0 14px 16px;
  }

  .publish-section {
    margin: 12px 14px;
  }

  .cand-actions {
    flex-direction: column;
  }
}
</style>
