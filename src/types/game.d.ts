/**
 * AI游戏开发商模拟器 - 核心类型定义
 * 存档数据结构 V1 Schema
 */

// ===== 时间系统 =====
export interface GameTime {
  年: number;
  月: number;    // 1-12
  日: number;    // 1-30
  小时: number;  // 0-23
  分钟: number;  // 0-59
}

// ===== 游戏消息 =====
export interface GameMessage {
  type: 'gm' | 'player';
  role: 'assistant' | 'user';
  content: string;
  time: string;
  actionOptions?: string[];
  stateChanges?: StateChangeLog;
  /** 触发该AI回复的玩家输入（仅GM消息有） */
  playerInput?: string;
}

export interface StateChangeLog {
  changes: StateChange[];
  timestamp: string;
}

export interface StateChange {
  key: string;
  action: string;
  oldValue: unknown;
  newValue: unknown;
}

// ===== 记忆系统 =====
export interface Memory {
  短期记忆: string[];
  中期记忆: string[];
  长期记忆: string[];
  隐式中期记忆: string[];
}

// ===== 公司信息 =====
export interface CompanyInfo {
  名称: string;
  创始人: string;
  成立日期: GameTime;
  口号: string;
  声誉: number;        // 0-100
  知名度: number;      // 0-100
  公司规模: '初创' | '小型' | '中型' | '大型' | '巨头';
  公司logo描述: string;
}

// ===== 财务系统 =====
export interface Finance {
  资金: number;
  月收入: number;
  月支出: number;
  收入明细: IncomeDetail[];
  支出明细: ExpenseDetail[];
  部门预算: DepartmentBudget;
  财务历史: FinanceRecord[];
  贷款: Loan[];
  投资人: Investor[];
}

export interface IncomeDetail {
  来源: string;
  金额: number;
  日期: GameTime;
  类型: '游戏销售' | 'DLC销售' | '内购' | '广告' | '投资' | '其他';
}

export interface ExpenseDetail {
  项目: string;
  金额: number;
  日期: GameTime;
  类型: '工资' | '研发' | '市场' | '办公' | '服务器' | '授权' | '其他';
}

export interface DepartmentBudget {
  研发: number;
  美术: number;
  策划: number;
  测试: number;
  市场: number;
  运营: number;
  行政: number;
}

export interface FinanceRecord {
  月份: string;       // "2025-03"
  收入: number;
  支出: number;
  利润: number;
  资金余额: number;
}

export interface Loan {
  ID: string;
  来源: string;
  金额: number;
  利率: number;
  剩余: number;
  月还款: number;
  到期日: GameTime;
}

export interface Investor {
  ID: string;
  名称: string;
  投资金额: number;
  占股比例: number;
  要求: string;
  满意度: number;
  关系: string;
}

// ===== 部门系统 =====
export interface Departments {
  研发部: Department;
  美术部: Department;
  策划部: Department;
  测试部: Department;
  市场部: Department;
  运营部: Department;
  行政部: Department;
}

export interface Department {
  负责人: string | null;
  成员: string[];
  当前任务: string[];
  效率: number;        // 0-100
  士气: number;        // 0-100
  预算使用率: number;  // 0-100
}

// ===== 办公环境 =====
export interface OfficeEnvironment {
  类型: '居民楼' | '写字楼' | '产业园' | '独栋办公楼' | '总部大厦';
  面积: number;        // 平方米
  月租金: number;
  容纳人数: number;
  设施: string[];
  地段: string;
  装修等级: '简陋' | '普通' | '精装' | '豪华';
}

// ===== 招聘系统 =====
export interface RecruitmentData {
  招聘职位: JobPosting[];
  候选人: Candidate[];
}

export interface JobPosting {
  职位名: string;
  部门: string;
  薪资范围: string;
  要求: string;
  状态: '招聘中' | '已关闭' | '已满';
  收到简历数: number;
}

export interface Candidate {
  姓名: string;
  期望薪资: number;
  经验年数: number;
  技能预览: string;
  自我介绍: string;
  状态: '待面试' | '面试中' | '已录用' | '已拒绝';
}

// ===== 员工系统 =====
export interface Employee {
  ID: string;
  姓名: string;
  年龄: number;
  性别: string;
  职位: string;
  部门: string;
  技能: EmployeeSkills;
  性格: string;
  薪资: number;
  满意度: number;      // 0-100
  忠诚度: number;      // 0-100
  经验值: number;
  入职日期: GameTime;
  状态: '正常' | '请假' | '加班' | '离职中' | '已离职';
  是管理层: boolean;
  管理风格: string | null;
  当前任务: string | null;
  记忆: string[];
  特长: string[];
  弱点: string[];

  // 新增：关系系统
  关系?: EmployeeRelationship;
  // 新增：私密属性
  私密?: EmployeePrivate;
  // 新增：事件历史
  事件历史?: EmployeeEvent[];
}

export interface EmployeeSkills {
  编程: number;        // 0-100
  美术: number;
  策划: number;
  测试: number;
  市场: number;
  管理: number;
  创意: number;
  沟通: number;
}

// ===== 员工关系系统 =====
export interface EmployeeRelationship {
  与老板关系: '陌生' | '普通同事' | '信任' | '亲密' | '暧昧' | '恋人' | '配偶';
  好感度: number; // 0-100
  信任度: number; // 0-100
  与同事关系: Record<string, {
    关系类型: '友好' | '中立' | '竞争' | '敌对' | '暗恋';
    亲密度: number;
  }>;
  社交圈: string[]; // 属于哪些小团体
}

// ===== 员工私密系统 =====
export interface EmployeePrivate {
  // 个人背景
  年龄: number;
  性别: string;
  学历: string;
  家庭状况: string;

  // 隐藏属性（AI可以逐渐揭示）
  真实性格: string[]; // 可能与表面性格不同
  隐藏目标: string; // 如"想当CEO"、"想跳槽"、"想偷技术"
  秘密: string; // 如"前公司被开除"、"在偷偷投简历"
  弱点: string;

  // 情感状态
  情绪: '开心' | '平静' | '焦虑' | '愤怒' | '沮丧' | '兴奋';
  压力值: number; // 0-100

  // 野心和动机
  野心等级: number; // 0-100，高野心的员工可能搞办公室政治
  忠诚动机: '金钱' | '成就' | '归属' | '权力' | '理想';

  // 生活事件
  近期生活事件: string; // 如"刚分手"、"家人生病"
}

// ===== 员工事件 =====
export interface EmployeeEvent {
  id: string;
  类型: '工作' | '社交' | '冲突' | '八卦' | '算计' | '感情' | '离职' | '晋升';
  描述: string;
  涉及人员: string[];
  时间: string;
  影响: string;
  是否已处理: boolean;
}

// ===== 游戏项目 =====
export interface GameProject {
  ID: string;
  名称: string;
  类型: string;
  子类型: string[];
  平台: string[];
  开发阶段: '立项' | '预制作' | '制作' | 'Alpha' | 'Beta' | '打磨' | '已完成';
  进度: GameProgress;
  质量: GameQuality;
  预算: number;
  已花费: number;
  参与人员: string[];
  目标受众: string;
  预计发布日期: GameTime | null;
  开发日志: string[];
  创意方向: string;
  核心玩法描述: string;
}

export interface GameProgress {
  策划: number;        // 0-100
  编程: number;
  美术: number;
  音乐: number;
  测试: number;
  总体: number;
}

export interface GameQuality {
  玩法: number;        // 0-100
  画面: number;
  剧情: number;
  音乐: number;
  优化: number;
  创新: number;
}

// ===== 已发布游戏 =====
export interface PublishedGame {
  ID: string;
  名称: string;
  类型: string;
  子类型: string[];
  发布日期: GameTime;
  发布平台: string[];
  定价: number;
  销量: number;
  总收入: number;
  当前在线人数: number;
  历史最高在线: number;
  评分: GameRating;
  热度: number;        // 0-100
  运营状态: '活跃运营' | '维护模式' | '停运';
  运营负责人: string | null;
  更新历史: GameUpdate[];
  DLC列表: DLC[];
  社区反馈摘要: string;
  质量: GameQuality;
  宣发投入: number;
  口碑趋势: '上升' | '稳定' | '下降';
}

export interface GameRating {
  steam好评率: number;
  wegame评分: number;
  媒体评分: number;
  玩家口碑: number;
}

export interface GameUpdate {
  版本号: string;
  更新内容: string;
  发布日期: GameTime;
  玩家反响: string;
}

export interface DLC {
  ID: string;
  名称: string;
  定价: number;
  销量: number;
  发布日期: GameTime;
  评价: string;
}

// ===== 社交媒体平台数据 =====
export interface PlatformData {
  steam: SteamData;
  wegame: WeGameData;
  bilibili: BilibiliData;
  weibo: WeiboData;
  tieba: TiebaData;
  qq群: QQGroupData;
  discord: DiscordData;
  twitter: TwitterData;
}

// --- Steam ---
export interface SteamData {
  游戏页面: Record<string, SteamGamePage>;
}

export interface SteamGamePage {
  好评率: number;
  评测数量: number;
  最近评测: SteamReview[];
  标签: string[];
  愿望单数: number;
  同时在线: number;
  历史最高在线: number;
  价格: number;
  折扣: number;
}

export interface SteamReview {
  用户名: string;
  推荐: boolean;
  内容: string;
  游戏时长: string;
  点赞数: number;
  发布时间: string;
}

// --- WeGame ---
export interface WeGameData {
  游戏页面: Record<string, WeGameGamePage>;
}

export interface WeGameGamePage {
  评分: number;          // 0-10
  评价数量: number;
  最近评价: WeGameReview[];
  下载量: number;
}

export interface WeGameReview {
  用户名: string;
  评分: number;
  内容: string;
  点赞数: number;
}

// --- Bilibili ---
export interface BilibiliData {
  话题: Record<string, BilibiliTopic>;
}

export interface BilibiliTopic {
  视频列表: BiliVideo[];
  二创数量: number;
  话题热度: number;
  话题浏览量: number;
}

export interface BiliVideo {
  标题: string;
  UP主: string;
  播放量: number;
  弹幕数: number;
  评论数: number;
  点赞数: number;
  类型: '评测' | '攻略' | '二创' | '实况' | '吐槽' | '安利';
  热门弹幕: string[];
  热门评论: BiliComment[];
}

export interface BiliComment {
  用户名: string;
  内容: string;
  点赞数: number;
}

// --- 微博 ---
export interface WeiboData {
  热搜: WeiboHotSearch[];
  相关微博: WeiboPost[];
  节奏事件: ControversyEvent[];
}

export interface WeiboHotSearch {
  话题: string;
  热度: number;
  排名: number;
  标签: '热' | '新' | '沸' | '爆' | '';
}

export interface WeiboPost {
  用户名: string;
  认证: string;
  内容: string;
  转发: number;
  评论: number;
  点赞: number;
  发布时间: string;
  热门评论: WeiboComment[];
}

export interface WeiboComment {
  用户名: string;
  内容: string;
  点赞: number;
}

export interface ControversyEvent {
  话题: string;
  描述: string;
  严重程度: '轻微' | '中等' | '严重' | '危机';
  影响: string;
  发生时间: GameTime;
}

// --- 百度贴吧 ---
export interface TiebaData {
  贴吧: Record<string, TiebaForum>;
}

export interface TiebaForum {
  帖子列表: TiebaPost[];
  吧友数量: number;
  日活跃: number;
  吧规: string;
}

export interface TiebaPost {
  标题: string;
  楼主: string;
  内容: string;
  回复数: number;
  浏览数: number;
  是否置顶: boolean;
  回复列表: TiebaReply[];
}

export interface TiebaReply {
  用户名: string;
  内容: string;
  楼层: number;
  点赞: number;
}

// --- QQ群 ---
export interface QQGroupData {
  群列表: Record<string, QQGroup>;
}

export interface QQGroup {
  群名: string;
  成员数: number;
  消息记录: ChatMessage[];
  活跃度: number;
  群公告: string;
}

export interface ChatMessage {
  用户名: string;
  内容: string;
  时间: string;
  类型: '文字' | '图片' | '表情';
}

// --- Discord ---
export interface DiscordData {
  服务器: Record<string, DiscordServer>;
}

export interface DiscordServer {
  名称: string;
  成员数: number;
  频道消息: Record<string, ChatMessage[]>;
  活跃度: number;
  在线人数: number;
}

// --- Twitter ---
export interface TwitterData {
  推文: TweetItem[];
  话题热度: number;
  海外关注度: number;
}

export interface TweetItem {
  用户名: string;
  显示名: string;
  内容: string;
  点赞: number;
  转推: number;
  评论: number;
  发布时间: string;
  语言: 'en' | 'ja' | 'zh' | 'ko';
}

// ===== 竞品系统 =====
export interface CompetitorCompany {
  ID: string;
  名称: string;
  规模: string;
  知名度: number;
  代表作: string[];
  当前项目: string | null;
  最近动态: string[];
  与玩家公司关系: '友好' | '中立' | '竞争' | '敌对';
  实力评级: 'S' | 'A' | 'B' | 'C' | 'D';
}

// ===== 世界事件 =====
export interface WorldEvent {
  ID: string;
  事件名称: string;
  事件描述: string;
  发生时间: GameTime;
  影响: string;
  持续时间: string;
  影响等级: '轻微' | '中等' | '重大' | '历史性';
  类型: '行业' | '技术' | '政策' | '社会' | '经济';
}

// ===== 行业趋势 =====
export interface IndustryTrend {
  趋势名称: string;
  描述: string;
  热度: number;
  开始时间: GameTime;
  预计持续: string;
  影响类型: string[];
}

// ===== 系统配置 =====
export interface SystemConfig {
  AI模型: string;
  API地址: string;
  API密钥: string;
  流式传输: boolean;
  分步生成: boolean;
  语言: string;
  主题: 'dark' | 'light';
}

// ===== 角色创建系统 =====
export interface CharacterAttributes {
  技术: number;
  创意: number;
  营销: number;
  人脉: number;
  管理: number;
  运气: number;
}

export interface Talent {
  名称: string;
  描述: string;
  消耗点数: number;
  效果?: string;
  isCustom?: boolean;
  isAIGenerated?: boolean;
}

export interface CharacterCreationData {
  难度: '简单' | '普通' | '困难' | '地狱';
  总天赋点: number;
  属性: CharacterAttributes;
  天赋: Talent[];
  CEO名称: string;
}

// ===== 完整存档结构 =====
export interface SaveData {
  元数据: {
    版本号: number;
    存档ID: string;
    存档名: string;
    创建时间: string;
    更新时间: string;
    游戏时长秒: number;
    时间: GameTime;
    角色数据?: CharacterCreationData;
  };

  公司: {
    基本信息: CompanyInfo;
    财务: Finance;
    部门: Departments;
    员工列表: Record<string, Employee>;
    办公环境: OfficeEnvironment;
    招聘?: RecruitmentData;
  };

  项目: {
    当前项目: Record<string, GameProject>;
    已发布游戏: Record<string, PublishedGame>;
    重点关注: string | null;
  };

  市场: {
    平台数据: PlatformData;
    竞品公司: Record<string, CompetitorCompany>;
    行业趋势: IndustryTrend[];
    世界事件: WorldEvent[];
  };

  系统: {
    配置: SystemConfig;
    历史: { 叙事: GameMessage[] };
    记忆: Memory;
    缓存: Record<string, unknown>;
  };
}

// ===== AI响应结构 =====
export interface GMResponse {
  text: string;
  mid_term_memory: string;
  tavern_commands: TavernCommand[];
  action_options: string[];
  status_bar?: StatusBar;
}

export interface TavernCommand {
  action: 'set' | 'add' | 'push' | 'delete' | 'pull';
  key: string;
  value?: unknown;
}

export interface StatusBar {
  当前时间: string;
  公司资金: string;
  员工数: number;
  开发中项目: string;
  已发布游戏: string[];
  重要事件: string;
}

// ===== 开局创建 =====
export interface CompanyCreationPayload {
  公司名称: string;
  创始人姓名: string;
  公司口号: string;
  起始年份: number;
  难度: '简单' | '普通' | '困难' | '地狱';
  角色数据: CharacterCreationData;
}
