/**
 * AI游戏开发商模拟器 - 核心游戏状态Store
 * 参考XianTu架构，管理完整的SaveData游戏状态
 */
import { defineStore } from 'pinia';
import { set, get, cloneDeep } from 'lodash';
import type {
  SaveData,
  GameTime,
  CompanyInfo,
  Finance,
  Departments,
  Employee,
  OfficeEnvironment,
  GameProject,
  PublishedGame,
  PlatformData,
  CompetitorCompany,
  IndustryTrend,
  WorldEvent,
  SystemConfig,
  GameMessage,
  Memory,
  CompanyCreationPayload,
  RecruitmentData,
  CharacterCreationData,
} from '@/types/game.d';

// ===== 游戏状态接口 =====
interface GameState {
  // 元数据
  saveMeta: {
    版本号: number;
    存档ID: string;
    存档名: string;
    创建时间: string;
    更新时间: string;
    游戏时长秒: number;
    时间: GameTime;
    角色数据?: CharacterCreationData;
  } | null;

  // 公司模块
  companyInfo: CompanyInfo | null;
  finance: Finance | null;
  departments: Departments | null;
  employees: Record<string, Employee> | null;
  officeEnvironment: OfficeEnvironment | null;
  recruitment: RecruitmentData | null;

  // 项目模块
  currentProjects: Record<string, GameProject> | null;
  publishedGames: Record<string, PublishedGame> | null;
  focusProject: string | null;

  // 市场模块
  platformData: PlatformData | null;
  competitors: Record<string, CompetitorCompany> | null;
  industryTrends: IndustryTrend[] | null;
  worldEvents: WorldEvent[] | null;

  // 系统模块
  systemConfig: SystemConfig | null;
  narrativeHistory: GameMessage[];
  memory: Memory | null;
  cache: Record<string, unknown>;

  // 游戏时间
  gameTime: GameTime | null;

  // 加载状态
  isGameLoaded: boolean;
}

// ===== 默认初始值工厂 =====
function createDefaultFinance(startingFund: number): Finance {
  return {
    资金: startingFund,
    月收入: 0,
    月支出: 0,
    收入明细: [],
    支出明细: [],
    部门预算: {
      研发: 0,
      美术: 0,
      策划: 0,
      测试: 0,
      市场: 0,
      运营: 0,
      行政: 0,
    },
    财务历史: [],
    贷款: [],
    投资人: [],
  };
}

function createDefaultDepartments(): Departments {
  const createDept = () => ({
    负责人: null,
    成员: [],
    当前任务: [],
    效率: 50,
    士气: 70,
    预算使用率: 0,
  });
  return {
    研发部: createDept(),
    美术部: createDept(),
    策划部: createDept(),
    测试部: createDept(),
    市场部: createDept(),
    运营部: createDept(),
    行政部: createDept(),
  };
}

function createDefaultPlatformData(): PlatformData {
  return {
    steam: { 游戏页面: {} },
    wegame: { 游戏页面: {} },
    bilibili: { 话题: {} },
    weibo: { 热搜: [], 相关微博: [], 节奏事件: [] },
    tieba: { 贴吧: {} },
    qq群: { 群列表: {} },
    discord: { 服务器: {} },
    twitter: { 推文: [], 话题热度: 0, 海外关注度: 0 },
  };
}

function createDefaultMemory(): Memory {
  return {
    短期记忆: [],
    中期记忆: [],
    长期记忆: [],
    隐式中期记忆: [],
  };
}

// ===== Store定义 =====
export const useGameStateStore = defineStore('gameState', {
  state: (): GameState => ({
    saveMeta: null,

    // 公司
    companyInfo: null,
    finance: null,
    departments: null,
    employees: null,
    officeEnvironment: null,
    recruitment: null,

    // 项目
    currentProjects: null,
    publishedGames: null,
    focusProject: null,

    // 市场
    platformData: null,
    competitors: null,
    industryTrends: null,
    worldEvents: null,

    // 系统
    systemConfig: null,
    narrativeHistory: [],
    memory: null,
    cache: {},

    // 时间
    gameTime: null,

    // 状态
    isGameLoaded: false,
  }),

  getters: {
    /** 当前公司资金 */
    currentFunds(): number {
      return this.finance?.资金 ?? 0;
    },

    /** 员工总数 */
    employeeCount(): number {
      return this.employees ? Object.keys(this.employees).length : 0;
    },

    /** 当前开发中的项目列表 */
    activeProjects(): GameProject[] {
      if (!this.currentProjects) return [];
      return Object.values(this.currentProjects).filter(
        (p) => p.开发阶段 !== '已完成'
      );
    },

    /** 格式化的游戏时间字符串 */
    formattedTime(): string {
      if (!this.gameTime) return '未知时间';
      return `${this.gameTime.年}年${this.gameTime.月}月${this.gameTime.日}日`;
    },

    /** 资金状态颜色 */
    fundsColor(): string {
      const funds = this.currentFunds;
      if (funds >= 1000000) return 'var(--color-success)';
      if (funds >= 200000) return 'var(--color-warning)';
      return 'var(--color-danger)';
    },

    /** 公司声誉 */
    reputation(): number {
      return this.companyInfo?.声誉 ?? 0;
    },
  },

  actions: {
    /**
     * 从存档数据加载状态
     * @param saveData 完整的SaveData存档对象
     */
    loadFromSaveData(saveData: SaveData) {
      const deepCopy = <T>(value: T): T => JSON.parse(JSON.stringify(value));

      // 元数据
      this.saveMeta = saveData.元数据 ? deepCopy(saveData.元数据) : null;
      this.gameTime = saveData.元数据?.时间 ? deepCopy(saveData.元数据.时间) : null;

      // 公司模块
      this.companyInfo = saveData.公司?.基本信息 ? deepCopy(saveData.公司.基本信息) : null;
      this.finance = saveData.公司?.财务 ? deepCopy(saveData.公司.财务) : null;
      this.departments = saveData.公司?.部门 ? deepCopy(saveData.公司.部门) : null;
      this.employees = saveData.公司?.员工列表 ? deepCopy(saveData.公司.员工列表) : null;
      this.officeEnvironment = saveData.公司?.办公环境 ? deepCopy(saveData.公司.办公环境) : null;
      this.recruitment = saveData.公司?.招聘 ? deepCopy(saveData.公司.招聘) : { 招聘职位: [], 候选人: [] };

      // 项目模块
      this.currentProjects = saveData.项目?.当前项目 ? deepCopy(saveData.项目.当前项目) : null;
      this.publishedGames = saveData.项目?.已发布游戏 ? deepCopy(saveData.项目.已发布游戏) : null;
      this.focusProject = saveData.项目?.重点关注 ?? null;

      // 市场模块
      this.platformData = saveData.市场?.平台数据 ? deepCopy(saveData.市场.平台数据) : null;
      this.competitors = saveData.市场?.竞品公司 ? deepCopy(saveData.市场.竞品公司) : null;
      this.industryTrends = saveData.市场?.行业趋势 ? deepCopy(saveData.市场.行业趋势) : null;
      this.worldEvents = saveData.市场?.世界事件 ? deepCopy(saveData.市场.世界事件) : null;

      // 系统模块
      this.systemConfig = saveData.系统?.配置 ? deepCopy(saveData.系统.配置) : null;
      this.narrativeHistory = Array.isArray(saveData.系统?.历史?.叙事)
        ? deepCopy(saveData.系统.历史.叙事)
        : [];
      this.memory = saveData.系统?.记忆 ? deepCopy(saveData.系统.记忆) : createDefaultMemory();
      this.cache = saveData.系统?.缓存 ? deepCopy(saveData.系统.缓存) as Record<string, unknown> : {};

      this.isGameLoaded = true;
      console.log('[GameState] ✅ 存档数据加载完成');
    },

    /**
     * 将当前状态导出为SaveData对象
     * @returns 完整的SaveData或null（数据不完整时）
     */
    toSaveData(): SaveData | null {
      if (!this.companyInfo || !this.finance || !this.gameTime) {
        console.error('[GameState] 存档数据不完整，无法导出');
        return null;
      }

      const deepCopy = <T>(value: T): T => JSON.parse(JSON.stringify(value));
      const nowIso = new Date().toISOString();

      const saveData: SaveData = {
        元数据: {
          版本号: this.saveMeta?.版本号 ?? 1,
          存档ID: this.saveMeta?.存档ID ?? `save_${Date.now()}`,
          存档名: this.saveMeta?.存档名 ?? '自动存档',
          创建时间: this.saveMeta?.创建时间 ?? nowIso,
          更新时间: nowIso,
          游戏时长秒: this.saveMeta?.游戏时长秒 ?? 0,
          时间: deepCopy(this.gameTime),
          角色数据: this.saveMeta?.角色数据 ? deepCopy(this.saveMeta.角色数据) : undefined,
        },
        公司: {
          基本信息: deepCopy(this.companyInfo),
          财务: deepCopy(this.finance!),
          部门: deepCopy(this.departments ?? createDefaultDepartments()),
          员工列表: deepCopy(this.employees ?? {}),
          办公环境: deepCopy(this.officeEnvironment ?? {
            类型: '居民楼' as const,
            面积: 50,
            月租金: 3000,
            容纳人数: 5,
            设施: ['基础办公桌', '网络'],
            地段: '城郊',
            装修等级: '简陋' as const,
          }),
          招聘: deepCopy(this.recruitment ?? { 招聘职位: [], 候选人: [] }),
        },
        项目: {
          当前项目: deepCopy(this.currentProjects ?? {}),
          已发布游戏: deepCopy(this.publishedGames ?? {}),
          重点关注: this.focusProject,
        },
        市场: {
          平台数据: deepCopy(this.platformData ?? createDefaultPlatformData()),
          竞品公司: deepCopy(this.competitors ?? {}),
          行业趋势: deepCopy(this.industryTrends ?? []),
          世界事件: deepCopy(this.worldEvents ?? []),
        },
        系统: {
          配置: deepCopy(this.systemConfig ?? {
            AI模型: 'gpt-4',
            API地址: '',
            API密钥: '',
            流式传输: true,
            分步生成: false,
            语言: 'zh-CN',
            主题: 'dark' as const,
          }),
          历史: { 叙事: deepCopy(this.narrativeHistory) },
          记忆: deepCopy(this.memory ?? createDefaultMemory()),
          缓存: deepCopy(this.cache),
        },
      };

      return deepCopy(saveData);
    },

    /**
     * 初始化新游戏
     * @param payload 公司创建参数（含角色数据）
     */
    initNewGame(payload: CompanyCreationPayload) {
      const now = new Date().toISOString();
      const startTime: GameTime = {
        年: payload.起始年份,
        月: 1,
        日: 1,
        小时: 9,
        分钟: 0,
      };

      // 计算启动资金：属性总点数 × 50万 + 基础100万
      const attrs = payload.角色数据.属性;
      const totalAttrPoints = attrs.技术 + attrs.创意 + attrs.营销 + attrs.人脉 + attrs.管理 + attrs.运气;
      let startingFund = totalAttrPoints * 500000 + 1000000;
      // 如果有"富二代"天赋，额外+500万
      if (payload.角色数据.天赋.some(t => t.名称 === '富二代')) {
        startingFund += 5000000;
      }

      // 根据天赋调整知名度
      let initialAwareness = 0;
      if (payload.角色数据.天赋.some(t => t.名称 === '获奖经历')) {
        initialAwareness += 20;
      }

      // 元数据（含角色数据）
      this.saveMeta = {
        版本号: 1,
        存档ID: `save_${Date.now()}`,
        存档名: `${payload.公司名称} - 新存档`,
        创建时间: now,
        更新时间: now,
        游戏时长秒: 0,
        时间: cloneDeep(startTime),
        角色数据: cloneDeep(payload.角色数据),
      };

      this.gameTime = cloneDeep(startTime);

      // 公司基本信息
      this.companyInfo = {
        名称: payload.公司名称,
        创始人: payload.创始人姓名,
        成立日期: cloneDeep(startTime),
        口号: payload.公司口号 || '用心做好游戏',
        声誉: 0,
        知名度: initialAwareness,
        公司规模: '初创',
        公司logo描述: '',
      };

      // 财务
      this.finance = createDefaultFinance(startingFund);

      // 部门
      this.departments = createDefaultDepartments();

      // 员工列表（创始人作为第一个员工）
      const founderId = `emp_${Date.now()}`;
      // 根据角色属性设置CEO技能
      const ceoSkills = {
        编程: Math.min(100, attrs.技术 * 10),
        美术: Math.min(100, attrs.创意 * 7),
        策划: Math.min(100, (attrs.创意 + attrs.技术) * 5),
        测试: Math.min(100, attrs.技术 * 5),
        市场: Math.min(100, attrs.营销 * 10),
        管理: Math.min(100, attrs.管理 * 10),
        创意: Math.min(100, attrs.创意 * 10),
        沟通: Math.min(100, attrs.人脉 * 10),
      };

      this.employees = {
        [founderId]: {
          ID: founderId,
          姓名: payload.创始人姓名,
          年龄: 25,
          性别: '男',
          职位: 'CEO',
          部门: '行政部',
          技能: ceoSkills,
          性格: '有远见的领导者',
          薪资: 0, // 创始人不领工资
          满意度: 100,
          忠诚度: 100,
          经验值: 0,
          入职日期: cloneDeep(startTime),
          状态: '正常',
          是管理层: true,
          管理风格: '民主型',
          当前任务: null,
          记忆: [],
          特长: ['全栈开发', '项目管理'],
          弱点: ['经验不足'],
        },
      };

      // 办公环境 — 初始无办公室，由AI交互决定
      this.officeEnvironment = {
        类型: '居民楼',
        面积: 30,
        月租金: 0,
        容纳人数: 3,
        设施: ['个人电脑', '网络'],
        地段: '自宅',
        装修等级: '简陋',
      };

      // 项目
      this.currentProjects = {};
      this.publishedGames = {};
      this.focusProject = null;

      // 招聘
      this.recruitment = { 招聘职位: [], 候选人: [] };

      // 市场
      this.platformData = createDefaultPlatformData();
      this.competitors = {};
      this.industryTrends = [];
      this.worldEvents = [];

      // 系统
      this.systemConfig = {
        AI模型: 'gpt-4',
        API地址: '',
        API密钥: '',
        流式传输: true,
        分步生成: false,
        语言: 'zh-CN',
        主题: 'dark',
      };
      this.narrativeHistory = [];
      this.memory = createDefaultMemory();
      this.cache = {};

      this.isGameLoaded = true;
      console.log(`[GameState] ✅ 新游戏初始化完成: ${payload.公司名称}，启动资金: ${startingFund}，难度: ${payload.难度}`);
    },

    /**
     * 通用状态更新方法（使用lodash set实现深层路径更新）
     * @param path 状��路径，如 "companyInfo.声誉" 或 "finance.资金"
     * @param value 要设置的值
     */
    updateState(path: string, value: any) {
      const parts = path.split('.');
      const rootKey = parts[0];

      // 顶层属性直接设置
      if (parts.length === 1) {
        (this as any)[rootKey] = value;
        return;
      }

      // 嵌套属性：使用cloneDeep + lodash set + $patch 确保响应式
      const currentRoot = (this as any)[rootKey];
      if (currentRoot && typeof currentRoot === 'object') {
        const clonedRoot = cloneDeep(currentRoot);
        const nestedPath = parts.slice(1).join('.');
        set(clonedRoot, nestedPath, value);

        this.$patch({
          [rootKey]: clonedRoot,
        });

        console.log(`[GameState] ✅ 已更新 ${path}`);
      } else {
        // 非对象类型，直接使用set
        set(this, path, value);
      }
    },

    /**
     * 推进游戏时间
     * @param minutes 要推进的分钟数
     */
    advanceGameTime(minutes: number) {
      if (!this.gameTime) return;

      this.gameTime.分钟 += minutes;

      // 处理分钟→小时进位
      if (this.gameTime.分钟 >= 60) {
        const hours = Math.floor(this.gameTime.分钟 / 60);
        this.gameTime.分钟 = this.gameTime.分钟 % 60;
        this.gameTime.小时 += hours;
      }

      // 处理小时→天进位
      if (this.gameTime.小时 >= 24) {
        const days = Math.floor(this.gameTime.小时 / 24);
        this.gameTime.小时 = this.gameTime.小时 % 24;
        this.gameTime.日 += days;
      }

      // 处理天→月进位（每月30天）
      if (this.gameTime.日 > 30) {
        const months = Math.floor((this.gameTime.日 - 1) / 30);
        this.gameTime.日 = ((this.gameTime.日 - 1) % 30) + 1;
        this.gameTime.月 += months;
      }

      // 处理月→年进位
      if (this.gameTime.月 > 12) {
        const years = Math.floor((this.gameTime.月 - 1) / 12);
        this.gameTime.月 = ((this.gameTime.月 - 1) % 12) + 1;
        this.gameTime.年 += years;
      }
    },

    /**
     * 重置所有状态
     */
    resetState() {
      this.saveMeta = null;
      this.companyInfo = null;
      this.finance = null;
      this.departments = null;
      this.employees = null;
      this.officeEnvironment = null;
      this.recruitment = null;
      this.currentProjects = null;
      this.publishedGames = null;
      this.focusProject = null;
      this.platformData = null;
      this.competitors = null;
      this.industryTrends = null;
      this.worldEvents = null;
      this.systemConfig = null;
      this.narrativeHistory = [];
      this.memory = null;
      this.cache = {};
      this.gameTime = null;
      this.isGameLoaded = false;

      console.log('[GameState] 🔄 状态已重置');
    },

    /**
     * 添加叙事历史消息
     * @param message 游戏消息
     */
    addNarrativeMessage(message: GameMessage) {
      this.narrativeHistory.push(message);
    },

    /**
     * 添加短期记忆
     * @param content 记忆内容
     */
    addToShortTermMemory(content: string) {
      if (!this.memory) {
        this.memory = createDefaultMemory();
      }

      const timePrefix = this.gameTime
        ? `【${this.gameTime.年}年${this.gameTime.月}月${this.gameTime.日}日】`
        : '【未知时间】';

      const hasPrefix = content.startsWith('【');
      const finalContent = hasPrefix ? content : `${timePrefix}${content}`;

      this.memory.短期记忆.push(finalContent);

      // 短期记忆上限为10条，溢出转移到中期记忆
      while (this.memory.短期记忆.length > 10) {
        const overflow = this.memory.短期记忆.shift();
        if (overflow) {
          this.memory.中期记忆.push(overflow);
        }
      }
    },
  },
});
