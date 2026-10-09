import type { Helper, Instrument, Quality, Venue } from '../types'

export const INITIAL_CURRENCY = 3000000

export const QUALITY_META: Record<
  Quality,
  { label: string; color: string; valueRange: [number, number]; exhibitIncome: number; order: number }
> = {
  gray: { label: '普通', color: '#8a8f98', valueRange: [200000, 600000], exhibitIncome: 20000, order: 0 },
  blue: { label: '优秀', color: '#46b6ff', valueRange: [500000, 1200000], exhibitIncome: 60000, order: 1 },
  purple: { label: '稀有', color: '#b58aff', valueRange: [1000000, 2500000], exhibitIncome: 150000, order: 2 },
  gold: { label: '史诗', color: '#ffb84d', valueRange: [2000000, 4500000], exhibitIncome: 300000, order: 3 },
  red: { label: '传说', color: '#ff5f6d', valueRange: [3500000, 7000000], exhibitIncome: 600000, order: 4 },
}

export const VENUES: Venue[] = [
  {
    id: 'shell',
    name: '海贝场',
    desc: '无资产要求，无入场费。多为普通藏品的跳蚤集市，适合练手热身。',
    assetRequirement: 0,
    entryFee: 0,
    rarityWeight: { gray: 46, blue: 34, purple: 15, gold: 4, red: 1 },
    itemCount: [3, 4],
  },
  {
    id: 'coral',
    name: '珊瑚场',
    desc: '资产不少于 1,000,000，入场费 5,000。有一定门槛的中坚会场。',
    assetRequirement: 1000000,
    entryFee: 5000,
    rarityWeight: { gray: 16, blue: 30, purple: 34, gold: 16, red: 4 },
    itemCount: [4, 5],
  },
  {
    id: 'pearl',
    name: '真珠场',
    desc: '资产不少于 5,000,000，入场费 20,000。顶级买家云集的高端拍卖会。',
    assetRequirement: 5000000,
    entryFee: 20000,
    rarityWeight: { gray: 4, blue: 10, purple: 24, gold: 40, red: 22 },
    itemCount: [5, 6],
  },
]

export const BUYOUT_MULTIPLIER: Record<number, number> = {
  1: 2.0,
  2: 1.6,
  3: 1.3,
  4: 1.1,
  5: Infinity,
  6: Infinity,
}

export const HELPERS: Helper[] = [
  {
    id: 'peek',
    name: '灵目·窥察师',
    title: '轮廓洞察',
    desc: '第 1 回合揭示 2 件藏品的轮廓与外观剪影。',
    revealType: 'outline',
    revealCount: 2,
    revealRound: 1,
    dividendBonus: 0,
  },
  {
    id: 'value',
    name: '慧眼·估价师',
    title: '价值估算',
    desc: '第 1 回合揭示 3 件藏品的估值区间。',
    revealType: 'value',
    revealCount: 3,
    revealRound: 1,
    dividendBonus: 0,
  },
  {
    id: 'quality',
    name: '辨色·鉴藏师',
    title: '品质辨识',
    desc: '第 1 回合揭示 4 件藏品的品质等级。',
    revealType: 'quality',
    revealCount: 4,
    revealRound: 1,
    dividendBonus: 0,
  },
  {
    id: 'size',
    name: '衡尺·仓储师',
    title: '尺寸判定',
    desc: '第 1 回合揭示 4 件藏品的占用尺寸。',
    revealType: 'size',
    revealCount: 4,
    revealRound: 1,
    dividendBonus: 0,
  },
  {
    id: 'dividend',
    name: '观心·红利猎人',
    title: '分红强化',
    desc: '其余玩家亏损时，你获得的分红提升 50%。',
    revealType: 'full',
    revealCount: 1,
    revealRound: 1,
    dividendBonus: 0.5,
  },
]

export const INSTRUMENTS: Instrument[] = [
  {
    id: 'i-estimate',
    name: '估值扫描仪',
    type: 'value',
    price: 30000,
    desc: '使用时揭示 3 件藏品的估值。',
  },
  {
    id: 'i-outline',
    name: '轮廓成像仪',
    type: 'outline',
    price: 20000,
    desc: '使用时揭示 3 件藏品的轮廓剪影。',
  },
  {
    id: 'i-quality',
    name: '品质探测笔',
    type: 'quality',
    price: 22000,
    desc: '使用时揭示 3 件藏品的品质等级。',
  },
  {
    id: 'i-exclude',
    name: '低值排除仪',
    type: 'low',
    price: 38000,
    desc: '使用时锁定 3 件低价值藏品并揭示其真实估值。',
  },
  {
    id: 'i-size',
    name: '尺寸量具',
    type: 'size',
    price: 15000,
    desc: '使用时揭示 4 件藏品的占用尺寸。',
  },
]

export const NAME_POOL: Record<Quality, string[]> = {
  gray: ['残损陶罐', '褪色画卷', '旧木雕件', '锈蚀铜币', '素纹瓷片', '破旧书简', '青石小像', '粗布织锦'],
  blue: ['釉里青瓷', '狮钮铜印', '鎏金香炉', '水墨折扇', '螺钿漆盒', '银錾托盘', '玛瑙把件', '错金银带钩'],
  purple: ['紫檀博古架', '翡翠扳指', '唐风戗金盒', '秘色瓷碗', '瑞兽纹玉璧', '珐琅西洋钟', '珊瑚朝珠', '点翠花簪'],
  gold: ['鎏金佛坐像', '青花缠枝瓶', '羊脂白玉觥', '孔雀蓝釉罐', '鎏金十二兽首', '黄地粉彩尊', '和田籽料炉', '景泰蓝象尊'],
  red: ['镇国青铜鼎', '夜明珠', '传国玉玺', '琉璃舍利塔', '九龙戏珠毯', '曜变天目盏', '和氏璧', '陨铁神剑'],
}