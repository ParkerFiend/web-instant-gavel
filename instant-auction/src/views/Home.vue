<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { usePlayerStore } from '../stores/playerStore'
import { QUALITY_META } from '../data/config'
import { formatMoney } from '../utils/format'

const player = usePlayerStore()
const router = useRouter()
const notice = ref('')

const exhibitIncome = computed(() =>
  player.exhibition.reduce((s, it) => s + QUALITY_META[it.quality].exhibitIncome, 0),
)

const sortedExhibit = computed(() =>
  [...player.exhibition].sort((a, b) => QUALITY_META[b.quality].order - QUALITY_META[a.quality].order),
)

function claim() {
  const res = player.claimDaily()
  notice.value = res.message
}

function resultLabel(r: string) {
  return r === 'win' ? '成交·你购得' : r === 'botWin' ? '被他人购得' : '流拍'
}
</script>

<template>
  <div class="fadein">
    <h1 class="page-title">玩家主页</h1>
    <p class="page-sub">盲盒藏品 · 情报探测 · 多回合竞价 · 盈亏结算</p>

    <div class="stat-grid mb">
      <div class="stat">
        <div class="label">当前资产</div>
        <div class="value" style="color: var(--gold)">{{ formatMoney(player.currency) }}</div>
      </div>
      <div class="stat">
        <div class="label">累计盈利</div>
        <div class="value" :class="player.player.totalProfit >= 0 ? 'pos' : 'neg'">
          {{ formatMoney(player.player.totalProfit) }}
        </div>
      </div>
      <div class="stat">
        <div class="label">单次最高盈利</div>
        <div class="value">{{ formatMoney(player.player.bestSingleProfit) }}</div>
      </div>
      <div class="stat">
        <div class="label">成交 / 总场次</div>
        <div class="value">{{ player.player.wins }} / {{ player.player.games }}</div>
      </div>
    </div>

    <div class="grid-2 mb">
      <div class="card">
        <div class="row space-between">
          <h3 style="margin: 0">快速开始</h3>
        </div>
        <p class="muted" style="font-size: 13px">
          进入会场后将扣除入场费，通过情报研判与拍卖竞价争夺神秘藏品。若你出价过高导致亏损，其他玩家会分走你 10% 的亏损额。
        </p>
        <div class="row mt">
          <button class="btn btn-primary" @click="router.push('/venue')">进入会场</button>
          <button class="btn" @click="router.push('/book')">查看图鉴</button>
          <button class="btn btn-gold" @click="claim">领取低保金</button>
        </div>
        <p v-if="notice" class="muted" style="font-size: 13px; margin-bottom: 0">{{ notice }}</p>
      </div>

      <div class="card">
        <div class="row space-between">
          <h3 style="margin: 0">展览柜</h3>
          <span class="faint">每场结算 +{{ formatMoney(exhibitIncome) }}</span>
        </div>
        <p class="muted" style="font-size: 13px">
          展览柜藏品会在每场对局结算时产出持续收益，优先陈列高价值藏品收益更高。
        </p>
        <div class="exhibit-list">
          <div v-if="sortedExhibit.length === 0" class="faint" style="font-size: 13px">暂无展品，赢下拍卖后可选择将藏品放入展览柜。</div>
          <div v-for="it in sortedExhibit" :key="it.id" class="exhibit-row">
            <span class="q-dot" :style="{ background: QUALITY_META[it.quality].color }"></span>
            <span>{{ it.name }}</span>
            <span class="badge" :style="{ background: QUALITY_META[it.quality].color, color: '#111' }">
              {{ QUALITY_META[it.quality].label }}
            </span>
            <span style="margin-left: auto" class="muted">+{{ formatMoney(QUALITY_META[it.quality].exhibitIncome) }}/场</span>
          </div>
        </div>
      </div>
    </div>

    <div class="card mb">
      <div class="row space-between">
        <h3 style="margin: 0">库存藏品</h3>
        <span class="faint">{{ player.inventory.length }} 件</span>
      </div>
      <p class="muted" style="font-size: 13px">暂存于仓库的藏品，可随时出售换取金贝铢。</p>
      <div v-if="player.inventory.length === 0" class="faint" style="font-size: 13px">仓库空空如也。</div>
      <div v-else class="grid-3">
        <div v-for="it in player.inventory" :key="it.id" class="inv-row">
          <div>
            <span class="q-dot" :style="{ background: QUALITY_META[it.quality].color }"></span>
            <b>{{ it.name }}</b>
          </div>
          <div class="faint" style="font-size: 12px">{{ QUALITY_META[it.quality].label }} · 估值 {{ formatMoney(it.realValue) }}</div>
          <button class="btn" style="margin-top: 8px" @click="player.sellInventoryItem(it.id)">
            出售 +{{ formatMoney(it.realValue) }}
          </button>
        </div>
      </div>
    </div>

    <div class="card">
      <h3 style="margin: 0 0 12px">历史战绩（近 {{ player.history.length }} 场）</h3>
      <div v-if="player.history.length === 0" class="faint">暂无对局记录。</div>
      <table v-else class="hist-table">
        <thead>
          <tr>
            <th>会场</th>
            <th>结果</th>
            <th>件数</th>
            <th>真实总值</th>
            <th>成交价</th>
            <th>本场盈亏</th>
            <th>分红</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="h in player.history" :key="h.id">
            <td>{{ h.venueName }}</td>
            <td>{{ resultLabel(h.result) }}</td>
            <td>{{ h.itemsCount }}</td>
            <td>{{ formatMoney(h.realTotal) }}</td>
            <td>{{ h.finalPrice ? formatMoney(h.finalPrice) : '—' }}</td>
            <td :class="h.playerProfit >= 0 ? 'pos' : 'neg'">{{ formatMoney(h.playerProfit) }}</td>
            <td class="pos">{{ h.dividend ? '+' + formatMoney(h.dividend) : '—' }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.exhibit-list {
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 180px;
  overflow: auto;
}
.exhibit-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}
.inv-row {
  background: var(--bg-2);
  border: 1px solid var(--line);
  border-radius: 10px;
  padding: 12px;
}
.hist-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
.hist-table th,
.hist-table td {
  text-align: left;
  padding: 8px 10px;
  border-bottom: 1px solid var(--line);
}
.hist-table th {
  color: var(--text-faint);
  font-weight: 600;
}
</style>