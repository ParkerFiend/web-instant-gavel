# 即刻落槌 · 异环本地 Web 复刻

参考《异环》「即刻落槌」玩法搭建的本地 Web 单机原型，还原核心循环：
**盲盒藏品 → 情报探测 → 多回合竞价 → 买断/价高者得 → 盈亏结算 → 分红与资产成长**。

> 设计依据：《web版即刻落槌设计文档》。开发进度见 [进度文档.md](./进度文档.md)。

## 技术栈

- Vue 3 + Vite + TypeScript
- Pinia（状态管理）
- Vue Router（Hash 路由）
- LocalStorage（本地存档）
- 手写主题 CSS（无第三方 UI 库依赖）

## 快速开始

```bash
npm install
npm run dev        # 本地开发 http://localhost:5173
npm run build      # 生产构建（含 vue-tsc 类型检查）
npm run preview    # 预览构建产物
```

## 玩法要点

- 三大会场：海贝场（无门槛）/ 珊瑚场（资产 ≥ 100 万，入场费 5,000）/ 真珠场（资产 ≥ 500 万，入场费 20,000）。
- 藏品默认隐藏，通过 **帮手** 与 **仪器** 逐步揭示轮廓 / 品质 / 尺寸 / 估值。
- 最多 6 回合竞价：第 1–4 回合达标可提前 **买断**，第 5 回合 **价高者得**，并列进入第 6 回合 **加赛**，再并列则 **流拍**。
- 成交后结算盈亏；买家亏损时其余玩家可获得 **亏损额 10%** 的分红。
- 赢下的藏品可选择 **出售变现** 或 **放入展览柜** 持续产出收益。

## 目录结构

```
src/
  data/       配置（会场、帮手、仪器、品质）
  services/   纯逻辑（生成、情报、竞价引擎、机器人、存档）
  stores/     Pinia 状态（playerStore / auctionStore）
  components/ 通用组件（ItemTile）
  views/      页面（Home / VenueSelect / Preparation / BiddingRoom / Settlement / CollectionBook）
  router/     路由
  types.ts    数据模型
```
