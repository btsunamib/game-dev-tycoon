<!--
  AI游戏开发商模拟器 - 角色创建页面
  多步骤RPG式角色创建：难度→基础信息→属性加点→天赋选择→预览确认
-->
<template>
  <div class="creation-page">
    <div class="bg-grid"></div>
    <div class="creation-container">
      <!-- 头部 -->
      <div class="creation-header">
        <button class="back-btn" @click="goBack">← 返回</button>
        <h1 class="creation-title">🎮 创建你的角色</h1>
        <p class="creation-subtitle">{{ stepTitles[currentStep - 1] }}</p>
      </div>

      <!-- 步骤指示器 -->
      <div class="step-indicator">
        <div v-for="s in 5" :key="s" class="step-dot"
          :class="{ active: s === currentStep, done: s < currentStep }"
          @click="s < currentStep && (currentStep = s)">
          <span class="step-num">{{ s }}</span>
          <span class="step-label">{{ stepLabels[s - 1] }}</span>
        </div>
        <div class="step-line"></div>
      </div>

      <!-- ========== 第一步：难度选择 ========== -->
      <div v-if="currentStep === 1" class="step-content" key="step1">
        <div class="option-grid four-col">
          <div v-for="diff in difficultyOptions" :key="diff.value"
            class="option-card" :class="{ active: difficulty === diff.value, [diff.color]: true }"
            @click="selectDifficulty(diff.value, diff.points)">
            <div class="option-icon">{{ diff.icon }}</div>
            <div class="option-label">{{ diff.label }}</div>
            <div class="option-desc">{{ diff.desc }}</div>
            <div class="talent-points">{{ diff.points }} 天赋点</div>
          </div>
        </div>
      </div>

      <!-- ========== 第二步：基础信息 ========== -->
      <div v-if="currentStep === 2" class="step-content" key="step2">
        <div class="form-group">
          <label class="form-label">公司名称 <span class="required">*</span></label>
          <input v-model="companyName" class="input" type="text" placeholder="输入你的公司名称" maxlength="20" />
        </div>
        <div class="form-group">
          <label class="form-label">CEO名称</label>
          <input v-model="ceoName" class="input" type="text" placeholder="默认：你" maxlength="10" />
        </div>
        <div class="form-group">
          <label class="form-label">起始年份</label>
          <input v-model.number="startYear" class="input" type="number" min="1980" max="2100" />
        </div>
        <div class="form-group">
          <label class="form-label">公司口号 <span class="optional">(可选)</span></label>
          <input v-model="companySlogan" class="input" type="text" placeholder="例如：用心做好游戏" maxlength="30" />
        </div>
      </div>

      <!-- ========== 第三步：属性加点 ========== -->
      <div v-if="currentStep === 3" class="step-content" key="step3">
        <div class="points-header">
          <span>剩余天赋点：<strong :class="{ 'text-danger': remainingPoints === 0 }">{{ remainingPoints }}</strong></span>
          <span>启动资金：<strong class="text-gold">¥{{ calculatedFund.toLocaleString() }}</strong></span>
        </div>
        <div class="attr-list">
          <div v-for="attr in attrList" :key="attr.key" class="attr-row">
            <div class="attr-info">
              <span class="attr-icon">{{ attr.icon }}</span>
              <span class="attr-name">{{ attr.key }}</span>
              <span class="attr-desc">{{ attr.desc }}</span>
            </div>
            <div class="attr-controls">
              <button class="attr-btn" @click="changeAttr(attr.key, -1)" :disabled="attributes[attr.key] <= 0">−</button>
              <span class="attr-value">{{ attributes[attr.key] }}</span>
              <button class="attr-btn" @click="changeAttr(attr.key, 1)" :disabled="remainingPoints <= 0 || attributes[attr.key] >= 10">+</button>
            </div>
          </div>
        </div>
      </div>

      <!-- ========== 第四步：天赋选择 ========== -->
      <div v-if="currentStep === 4" class="step-content" key="step4">
        <div class="points-header">
          <span>剩余天赋点：<strong :class="{ 'text-danger': remainingPoints === 0 }">{{ remainingPoints }}</strong></span>
        </div>
        <div v-for="group in talentGroups" :key="group.cost" class="talent-group">
          <h3 class="talent-group-title">{{ group.cost }}点天赋</h3>
          <div class="talent-grid">
            <div v-for="t in group.talents" :key="t.名称"
              class="talent-card" :class="{ selected: isTalentSelected(t.名称), disabled: !isTalentSelected(t.名称) && remainingPoints < t.消耗点数 }"
              @click="toggleTalent(t)">
              <div class="talent-icon">{{ t.icon }}</div>
              <div class="talent-name">{{ t.名称 }}</div>
              <div class="talent-desc">{{ t.描述 }}</div>
              <div class="talent-cost">{{ t.消耗点数 }}点</div>
            </div>
          </div>
        </div>
        <!-- 自定义天赋 -->
        <div class="custom-talent-section">
          <button class="btn btn-outline" @click="showCustomTalent = true" :disabled="remainingPoints < 1">✏️ 自定义天赋 (1点起)</button>
        </div>
        <!-- 自定义天赋弹窗 -->
        <div v-if="showCustomTalent" class="modal-overlay" @click.self="showCustomTalent = false">
          <div class="modal-box">
            <h3>自定义天赋</h3>
            <div class="form-group">
              <label class="form-label">天赋名称</label>
              <input v-model="customTalentName" class="input" placeholder="输入天赋名称" maxlength="10" />
            </div>
            <div class="form-group">
              <label class="form-label">天赋描述</label>
              <input v-model="customTalentDesc" class="input" placeholder="描述天赋效果" maxlength="50" />
            </div>
            <div class="form-group">
              <label class="form-label">消耗点数</label>
              <input v-model.number="customTalentCost" class="input" type="number" min="1" :max="remainingPoints" />
            </div>
            <div class="modal-actions">
              <button class="btn btn-primary" @click="addCustomTalent" :disabled="!customTalentName.trim() || !customTalentDesc.trim() || customTalentCost < 1 || customTalentCost > remainingPoints">确认添加</button>
              <button class="btn btn-outline" @click="showCustomTalent = false">取消</button>
            </div>
          </div>
        </div>
      </div>

      <!-- ========== 第五步：预览确认 ========== -->
      <div v-if="currentStep === 5" class="step-content" key="step5">
        <div class="preview-section">
          <div class="preview-row"><span class="preview-label">难度</span><span class="preview-value">{{ difficultyLabel }}</span></div>
          <div class="preview-row"><span class="preview-label">公司名称</span><span class="preview-value">{{ companyName }}</span></div>
          <div class="preview-row"><span class="preview-label">CEO</span><span class="preview-value">{{ ceoName || '你' }}</span></div>
          <div class="preview-row"><span class="preview-label">起始年份</span><span class="preview-value">{{ startYear }}年</span></div>
          <div class="preview-row"><span class="preview-label">启动资金</span><span class="preview-value text-gold">¥{{ calculatedFund.toLocaleString() }}</span></div>
        </div>
        <div class="preview-section">
          <h3 class="preview-title">📊 属性分配</h3>
          <div class="preview-attrs">
            <div v-for="attr in attrList" :key="attr.key" class="preview-attr">
              <span>{{ attr.icon }} {{ attr.key }}</span>
              <div class="preview-bar-wrap">
                <div class="preview-bar" :style="{ width: attributes[attr.key] * 10 + '%' }"></div>
              </div>
              <span class="preview-attr-val">{{ attributes[attr.key] }}</span>
            </div>
          </div>
        </div>
        <div class="preview-section" v-if="selectedTalents.length > 0">
          <h3 class="preview-title">🌟 已选天赋</h3>
          <div class="preview-talents">
            <div v-for="t in selectedTalents" :key="t.名称" class="preview-talent-tag">
              {{ t.名称 }} <span class="tag-cost">({{ t.消耗点数 }}点)</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 底部按钮 -->
      <div class="step-actions">
        <button v-if="currentStep > 1" class="btn btn-outline" @click="currentStep--">← 上一步</button>
        <div v-else></div>
        <button v-if="currentStep < 5" class="btn btn-primary" :disabled="!canProceed" @click="currentStep++">下一步 →</button>
        <button v-else class="btn btn-primary btn-lg start-game-btn" :disabled="!canProceed" @click="startGame">🚀 开始游戏</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useGameStateStore } from '@/stores/gameStateStore';
import type { Talent, CharacterAttributes } from '@/types/game.d';

const router = useRouter();
const gameState = useGameStateStore();

// ===== 步骤 =====
const currentStep = ref(1);
const stepLabels = ['难度', '信息', '属性', '天赋', '确认'];
const stepTitles = [
  '选择游戏难度，决定你的天赋点数量',
  '设定公司的基本信息',
  '分配天赋点到各项属性',
  '用剩余天赋点选择特殊天赋',
  '确认所有选择，准备开始',
];

// ===== 第一步：难度 =====
const difficulty = ref<'简单' | '普通' | '困难' | '地狱'>('普通');
const totalTalentPoints = ref(14);

const difficultyOptions = [
  { value: '简单' as const, label: '简单模式', icon: '🟢', desc: '适合休闲玩家，资源充裕', points: 20, color: 'green' },
  { value: '普通' as const, label: '普通模式', icon: '🟡', desc: '标准体验，需要合理规划', points: 14, color: 'yellow' },
  { value: '困难' as const, label: '困难模式', icon: '🔴', desc: '资源紧张，每个决策都很重要', points: 8, color: 'red' },
  { value: '地狱' as const, label: '地狱模式', icon: '💀', desc: '极限挑战，一步错步步错', points: 3, color: 'skull' },
];

function selectDifficulty(val: typeof difficulty.value, points: number) {
  difficulty.value = val;
  totalTalentPoints.value = points;
  // 重置属性和天赋
  Object.keys(attributes).forEach(k => { (attributes as any)[k] = 0; });
  selectedTalents.value = [];
}

const difficultyLabel = computed(() => difficultyOptions.find(d => d.value === difficulty.value)?.label || '');

// ===== 第二步：基础信息 =====
const companyName = ref('');
const ceoName = ref('');
const startYear = ref(2025);
const companySlogan = ref('');

// ===== 第三步：属性 =====
const attributes = reactive<CharacterAttributes>({
  技术: 0, 创意: 0, 营销: 0, 人脉: 0, 管理: 0, 运气: 0,
});

const attrList = [
  { key: '技术' as const, icon: '🔧', desc: '影响游戏开发质量和速度' },
  { key: '创意' as const, icon: '🎨', desc: '影响游戏创新度和口碑' },
  { key: '营销' as const, icon: '📢', desc: '影响宣传效果和市场覆盖' },
  { key: '人脉' as const, icon: '🤝', desc: '影响招聘质量和行业关系' },
  { key: '管理' as const, icon: '📊', desc: '影响团队效率和公司运营' },
  { key: '运气' as const, icon: '🍀', desc: '影响随机事件和市场机遇' },
];

const usedAttrPoints = computed(() => {
  return attributes.技术 + attributes.创意 + attributes.营销 + attributes.人脉 + attributes.管理 + attributes.运气;
});

const usedTalentCost = computed(() => {
  return selectedTalents.value.reduce((sum, t) => sum + t.消耗点数, 0);
});

const remainingPoints = computed(() => totalTalentPoints.value - usedAttrPoints.value - usedTalentCost.value);

const calculatedFund = computed(() => {
  let fund = usedAttrPoints.value * 500000 + 1000000;
  if (selectedTalents.value.some(t => t.名称 === '富二代')) fund += 5000000;
  return fund;
});

function changeAttr(key: keyof CharacterAttributes, delta: number) {
  const newVal = attributes[key] + delta;
  if (newVal < 0 || newVal > 10) return;
  if (delta > 0 && remainingPoints.value <= 0) return;
  attributes[key] = newVal;
}

// ===== 第四步：天赋 =====
const selectedTalents = ref<(Talent & { icon?: string })[]>([]);
const showCustomTalent = ref(false);
const customTalentName = ref('');
const customTalentDesc = ref('');
const customTalentCost = ref(1);

interface TalentDef extends Talent { icon: string; }

const allTalents: TalentDef[] = [
  { 名称: '社交媒体达人', 描述: '社交媒体初始粉丝+500', 消耗点数: 1, icon: '📱' },
  { 名称: '市场嗅觉', 描述: '更容易发现市场趋势', 消耗点数: 1, icon: '🔍' },
  { 名称: '加班狂人', 描述: '开发速度+10%但员工满意度-5%', 消耗点数: 1, icon: '💪' },
  { 名称: '名校毕业', 描述: '招聘时更容易吸引高质量人才', 消耗点数: 2, icon: '🎓' },
  { 名称: '精打细算', 描述: '所有开支减少10%', 消耗点数: 2, icon: '💰' },
  { 名称: '资深玩家', 描述: '对游戏品质的判断更准确', 消耗点数: 2, icon: '🎮' },
  { 名称: '行业人脉', 描述: '开局自带2个行业联系人', 消耗点数: 3, icon: '🌟' },
  { 名称: '获奖经历', 描述: '初始知名度+20', 消耗点数: 3, icon: '🏆' },
  { 名称: '技术极客', 描述: '解锁高级技术选项', 消耗点数: 3, icon: '🔬' },
  { 名称: '富二代', 描述: '额外获得500万启动资金', 消耗点数: 5, icon: '👑' },
  { 名称: '天选之人', 描述: '所有随机事件概率向好的方向偏移', 消耗点数: 5, icon: '🎯' },
  { 名称: '海归精英', 描述: '海外市场初始好感度+30', 消耗点数: 5, icon: '🌐' },
];

const talentGroups = computed(() => {
  const groups = [1, 2, 3, 5].map(cost => ({
    cost,
    talents: allTalents.filter(t => t.消耗点数 === cost),
  }));
  return groups;
});

function isTalentSelected(name: string) {
  return selectedTalents.value.some(t => t.名称 === name);
}

function toggleTalent(t: TalentDef) {
  const idx = selectedTalents.value.findIndex(s => s.名称 === t.名称);
  if (idx >= 0) {
    selectedTalents.value.splice(idx, 1);
  } else {
    if (remainingPoints.value >= t.消耗点数) {
      selectedTalents.value.push({ ...t });
    }
  }
}

function addCustomTalent() {
  if (!customTalentName.value.trim() || !customTalentDesc.value.trim()) return;
  if (customTalentCost.value < 1 || customTalentCost.value > remainingPoints.value) return;
  selectedTalents.value.push({
    名称: customTalentName.value.trim(),
    描述: customTalentDesc.value.trim(),
    消耗点数: customTalentCost.value,
    isCustom: true,
    icon: '✨',
  });
  customTalentName.value = '';
  customTalentDesc.value = '';
  customTalentCost.value = 1;
  showCustomTalent.value = false;
}

// ===== 导航验证 =====
const canProceed = computed(() => {
  switch (currentStep.value) {
    case 1: return !!difficulty.value;
    case 2: return companyName.value.trim().length > 0;
    case 3: return true; // 属性可以全0
    case 4: return true; // 天赋可以不选
    case 5: return companyName.value.trim().length > 0;
    default: return false;
  }
});

// ===== 操作 =====
function goBack() { router.push('/'); }

function startGame() {
  if (!canProceed.value) return;
  const finalCeoName = ceoName.value.trim() || '你';
  gameState.initNewGame({
    公司名称: companyName.value.trim(),
    创始人姓名: finalCeoName,
    公司口号: companySlogan.value.trim(),
    起始年份: startYear.value,
    难度: difficulty.value,
    角色数据: {
      难度: difficulty.value,
      总天赋点: totalTalentPoints.value,
      属性: { ...attributes },
      天赋: selectedTalents.value.map(t => ({
        名称: t.名称,
        描述: t.描述,
        消耗点数: t.消耗点数,
        效果: t.效果,
        isCustom: t.isCustom,
        isAIGenerated: t.isAIGenerated,
      })),
      CEO名称: finalCeoName,
    },
  });
  router.push('/game');
}
</script>

<style scoped>
.creation-page {
  width: 100vw; height: 100vh;
  background: var(--bg-primary); overflow-y: auto; position: relative;
}
.bg-grid {
  position: fixed; inset: 0;
  background-image: linear-gradient(rgba(0,212,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.02) 1px, transparent 1px);
  background-size: 40px 40px; pointer-events: none;
}
.creation-container {
  max-width: 720px; margin: 0 auto; padding: 32px 24px 60px;
  position: relative; z-index: 1;
}
.creation-header { text-align: center; margin-bottom: 24px; }
.back-btn {
  position: absolute; left: 24px; top: 32px;
  background: none; border: 1px solid var(--border-color); color: var(--text-secondary);
  padding: 6px 14px; border-radius: var(--radius-md); cursor: pointer;
  font-family: var(--font-family); font-size: 13px; transition: all var(--transition-fast);
}
.back-btn:hover { border-color: var(--color-primary); color: var(--color-primary); }
.creation-title { font-size: 26px; font-weight: 700; color: var(--text-primary); margin-bottom: 6px; }
.creation-subtitle { font-size: 13px; color: var(--text-muted); }

/* 步骤指示器 */
.step-indicator {
  display: flex; justify-content: center; gap: 32px; margin-bottom: 28px; position: relative;
}
.step-line {
  position: absolute; top: 16px; left: 15%; right: 15%; height: 2px;
  background: var(--border-color); z-index: 0;
}
.step-dot {
  display: flex; flex-direction: column; align-items: center; gap: 4px;
  cursor: default; z-index: 1; transition: all 0.3s;
}
.step-dot.done { cursor: pointer; }
.step-num {
  width: 32px; height: 32px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 14px; font-weight: 600;
  background: var(--bg-card); border: 2px solid var(--border-color); color: var(--text-muted);
  transition: all 0.3s;
}
.step-dot.active .step-num { border-color: var(--color-primary); color: var(--color-primary); background: rgba(0,212,255,0.1); }
.step-dot.done .step-num { border-color: var(--color-success); color: #fff; background: var(--color-success); }
.step-label { font-size: 11px; color: var(--text-muted); }
.step-dot.active .step-label { color: var(--color-primary); }

/* 步骤内容 */
.step-content { min-height: 300px; animation: fadeIn 0.3s ease; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

/* 选项网格 */
.option-grid { display: grid; gap: 12px; }
.four-col { grid-template-columns: repeat(2, 1fr); }
@media (min-width: 640px) { .four-col { grid-template-columns: repeat(4, 1fr); } }

.option-card {
  padding: 16px 12px; border: 1px solid var(--border-color); border-radius: var(--radius-md);
  background: var(--bg-card); cursor: pointer; text-align: center; transition: all 0.2s;
}
.option-card:hover { border-color: var(--border-color-light); background: var(--bg-card-hover); }
.option-card.active { border-color: var(--color-primary); background: rgba(0,212,255,0.06); box-shadow: 0 0 12px rgba(0,212,255,0.15); }
.option-card.green.active { border-color: var(--color-success); background: rgba(0,255,136,0.06); }
.option-card.yellow.active { border-color: #ffaa00; background: rgba(255,170,0,0.06); }
.option-card.red.active { border-color: var(--color-danger); background: rgba(255,68,68,0.06); }
.option-card.skull.active { border-color: #9333ea; background: rgba(147,51,234,0.06); }
.option-icon { font-size: 28px; margin-bottom: 6px; }
.option-label { font-size: 14px; font-weight: 600; color: var(--text-primary); margin-bottom: 4px; }
.option-desc { font-size: 11px; color: var(--text-muted); line-height: 1.4; }
.talent-points { margin-top: 6px; font-size: 13px; font-weight: 600; color: var(--color-primary); }

/* 表单 */
.form-group { margin-bottom: 16px; }
.form-label { display: block; font-size: 13px; font-weight: 500; color: var(--text-secondary); margin-bottom: 6px; }
.required { color: var(--color-danger); }
.optional { color: var(--text-muted); font-size: 11px; }
.input {
  width: 100%; padding: 10px 14px; background: var(--bg-card); border: 1px solid var(--border-color);
  border-radius: var(--radius-md); color: var(--text-primary); font-size: 14px;
  font-family: var(--font-family); transition: border-color 0.2s; box-sizing: border-box;
}
.input:focus { outline: none; border-color: var(--color-primary); }

/* 属性加点 */
.points-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 12px 16px; background: var(--bg-card); border: 1px solid var(--border-color);
  border-radius: var(--radius-md); margin-bottom: 16px; font-size: 14px; color: var(--text-secondary);
}
.text-danger { color: var(--color-danger); }
.text-gold { color: #ffd700; }

.attr-list { display: flex; flex-direction: column; gap: 10px; }
.attr-row {
  display: flex; justify-content: space-between; align-items: center;
  padding: 12px 16px; background: var(--bg-card); border: 1px solid var(--border-color);
  border-radius: var(--radius-md); transition: border-color 0.2s;
}
.attr-row:hover { border-color: var(--border-color-light); }
.attr-info { display: flex; align-items: center; gap: 8px; flex: 1; }
.attr-icon { font-size: 20px; }
.attr-name { font-size: 14px; font-weight: 600; color: var(--text-primary); min-width: 40px; }
.attr-desc { font-size: 11px; color: var(--text-muted); }
.attr-controls { display: flex; align-items: center; gap: 8px; }
.attr-btn {
  width: 30px; height: 30px; border-radius: 50%; border: 1px solid var(--border-color);
  background: var(--bg-card); color: var(--text-primary); font-size: 16px; cursor: pointer;
  display: flex; align-items: center; justify-content: center; transition: all 0.2s;
}
.attr-btn:hover:not(:disabled) { border-color: var(--color-primary); color: var(--color-primary); }
.attr-btn:disabled { opacity: 0.3; cursor: not-allowed; }
.attr-value { font-size: 18px; font-weight: 700; color: var(--color-primary); min-width: 24px; text-align: center; }

/* 天赋 */
.talent-group { margin-bottom: 20px; }
.talent-group-title { font-size: 14px; color: var(--text-secondary); margin-bottom: 10px; font-weight: 600; }
.talent-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
@media (max-width: 600px) { .talent-grid { grid-template-columns: repeat(2, 1fr); } }

.talent-card {
  padding: 12px 10px; border: 1px solid var(--border-color); border-radius: var(--radius-md);
  background: var(--bg-card); cursor: pointer; text-align: center; transition: all 0.2s; position: relative;
}
.talent-card:hover:not(.disabled) { border-color: var(--border-color-light); }
.talent-card.selected { border-color: var(--color-primary); background: rgba(0,212,255,0.08); box-shadow: 0 0 8px rgba(0,212,255,0.15); }
.talent-card.disabled { opacity: 0.4; cursor: not-allowed; }
.talent-icon { font-size: 24px; margin-bottom: 4px; }
.talent-name { font-size: 13px; font-weight: 600; color: var(--text-primary); margin-bottom: 3px; }
.talent-desc { font-size: 10px; color: var(--text-muted); line-height: 1.3; }
.talent-cost { margin-top: 4px; font-size: 11px; color: var(--color-primary); font-weight: 500; }

.custom-talent-section { margin-top: 16px; text-align: center; }

/* 模态框 */
.modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 100;
  display: flex; align-items: center; justify-content: center;
}
.modal-box {
  background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: var(--radius-lg);
  padding: 24px; width: 90%; max-width: 400px;
}
.modal-box h3 { color: var(--text-primary); margin-bottom: 16px; font-size: 16px; }
.modal-actions { display: flex; gap: 10px; margin-top: 16px; justify-content: flex-end; }

/* 预览 */
.preview-section {
  background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-md);
  padding: 16px; margin-bottom: 14px;
}
.preview-title { font-size: 14px; color: var(--text-primary); margin-bottom: 12px; }
.preview-row {
  display: flex; justify-content: space-between; padding: 6px 0;
  border-bottom: 1px solid rgba(255,255,255,0.05); font-size: 13px;
}
.preview-row:last-child { border-bottom: none; }
.preview-label { color: var(--text-muted); }
.preview-value { color: var(--text-primary); font-weight: 500; }

.preview-attrs { display: flex; flex-direction: column; gap: 8px; }
.preview-attr { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--text-secondary); }
.preview-bar-wrap { flex: 1; height: 8px; background: rgba(255,255,255,0.05); border-radius: 4px; overflow: hidden; }
.preview-bar { height: 100%; background: var(--color-primary); border-radius: 4px; transition: width 0.3s; }
.preview-attr-val { min-width: 20px; text-align: right; font-weight: 600; color: var(--color-primary); }

.preview-talents { display: flex; flex-wrap: wrap; gap: 8px; }
.preview-talent-tag {
  padding: 4px 12px; background: rgba(0,212,255,0.1); border: 1px solid rgba(0,212,255,0.3);
  border-radius: 20px; font-size: 12px; color: var(--color-primary);
}
.tag-cost { opacity: 0.7; }

/* 底部按钮 */
.step-actions {
  display: flex; justify-content: space-between; align-items: center; margin-top: 24px; padding-top: 16px;
  border-top: 1px solid var(--border-color);
}
.btn {
  padding: 10px 24px; border-radius: var(--radius-md); font-size: 14px; font-weight: 500;
  cursor: pointer; transition: all 0.2s; font-family: var(--font-family); border: none;
}
.btn-primary { background: var(--color-primary); color: #000; }
.btn-primary:hover:not(:disabled) { filter: brightness(1.1); }
.btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }
.btn-outline { background: transparent; border: 1px solid var(--border-color); color: var(--text-secondary); }
.btn-outline:hover:not(:disabled) { border-color: var(--color-primary); color: var(--color-primary); }
.btn-outline:disabled { opacity: 0.4; cursor: not-allowed; }
.btn-lg { padding: 14px 32px; font-size: 16px; letter-spacing: 1px; }
.start-game-btn { min-width: 200px; }

@media (max-width: 600px) {
  .creation-container { padding: 20px 16px 40px; }
  .step-indicator { gap: 16px; }
  .step-label { display: none; }
}
</style>
