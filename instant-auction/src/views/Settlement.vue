<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuctionStore } from '../stores/auctionStore'
import { usePlayerStore } from '../stores/playerStore'
import { QUALITY_META } from '../data/config'
import { formatFull, formatMoney } from '../utils/format'
import ItemTile from '../components/ItemTile.vue'

const router = useRouter()
const auction = useAuctionStore()
const player = usePlayerStore()

const outcome = computed(() => auction.outcome)
const sellFlags = ref<boolean[]>([])

onMounted(() => {
  if (!auction.outcome) {
    router.replace('/')
    return
  }
  sellFlags.value = auction.outcome.items.map(() => true)
})

const sellTotal = computed(() => {
  if (!outcome.value) return 0
  return outcome.value.items.reduce((s, it, i) => s + (sellFlags.value[i] ? it.realValue : 0), 0)
})

const exhibitTotal = computed(() => {
  if (!outcome.value) return 0
  return outcome.value.items.reduce(
    (s, it, i) => s + (!sellFlags.value[i] ? QUALITY_META[it.quality].exhibitIncome : 0),
    0,
  )
})

function toggle(i: number, mode: boolean) {
  sellFlags.value[i] = mode
}

function confirm() {
  if (!outcome.value) return
  player.confirmSettlement(outcome.value, sellFlags.value)

  if (auction.state) {
    const leftover = auction.state.instruments.filter((ins) =>
      auction.state!.activeInstrumentIds.includes(ins.id),
    )
    player.setInstruments(leftover)
  }
  auction.reset()
  router.push('/')
}

function finishNoItems() {
  confirm()
}
</script>

<template>
  <div v-if="outcome" class="fadein">
    <h1 class="page-title">结算</h1>
    <p class="page-sub">{{ auction.venue?.name }} · {{ outcome.result === 'passed' ? '流拍' : '成交' }}</p>

    <div class="card mb result-banner" :class="outcome.winnerIsPlayer ? 'win' : 'lose'">
      <div class="big-amount">
        {{ outcome.winnerIsPlayer ? '🏆 你赢下了本场拍品' : outcome.result === 'passed' ? '⚖️ 本场流拍' : '🎩 藏品被他人购得' }}
      </div>
      <div class="muted" style="font-size: 13px; margin-top: 6px">
        <template v-if="outcome.winnerIsPlayer">
          你以 {{ formatFull(outcome.finalPrice) }} 金贝铢购得全部 {{ outcome.items.length }} 件藏品。
        </template>
        <template v-else-if="outcome.result === 'passed'">
          无人出价或加赛并列，藏品未成交，入场费不予退还。
        </template>
        <template v-else>
          买家「{{ outcome.botWinner?.name }}」以 {{ formatFull(outcome.finalPrice) }} 金贝铢成交。
        </template>
      </div>
    </div>

    <div class="stat-grid mb">
      <div class="stat">
        <div class="label">藏品真实总值</div>
        <div class="value" style="color: var(--gold)">{{ formatMoney(outcome.realTotal) }}</div>
      </div>
      <div class="stat">
        <div class="label">成交价</div>
        <div class="value">{{ outcome.finalPrice ? formatMoney(outcome.finalPrice) : '—' }}</div>
      </div>
      <div class="stat">
        <div class="label">入场费（沉没）</div>
        <div class="value">{{ formatMoney(outcome.entryFee) }}</div>
      </div>
      <div class="stat">
        <div class="label">本场盈亏</div>
        <div class="value" :class="outcome.playerProfit >= 0 ? 'pos' : 'neg'">
          {{ formatMoney(outcome.playerProfit) }}
        </div>
      </div>
    </div>

    <div v-if="outcome.dividend > 0" class="card mb dividend-card">
      <b>💰 亏损分红</b>
      <p class="muted" style="font-size: 13px; margin: 6px 0 0">
        买家本场亏损，作为其余玩家你获得亏损额 10% 的分红：<b class="pos">+{{ formatFull(outcome.dividend) }}</b> 金贝铢{{ auction.state?.helper?.dividendBonus ? '（帮手加成已计入）' : '' }}。
      </p>
    </div>

    <div v-if="outcome.winnerIsPlayer" class="card mb">
      <div class="row space-between">
        <h3 style="margin: 0">藏品处置</h3>
        <span class="faint">逐件选择：出售变现 或 放入展览柜持续产出</span>
      </div>
      <div class="dispose-grid">
        <div v-for="(it, i) in outcome.items" :key="it.id" class="dispose-item">
          <ItemTile :item="it" />
          <div class="row" style="margin-top: 8px">
            <button class="btn" :class="{ 'btn-primary': sellFlags[i] }" @click="toggle(i, true)">出售</button>
            <button class="btn" :class="{ 'btn-gold': !sellFlags[i] }" @click="toggle(i, false)">入展</button>
          </div>
          <div class="faint" style="font-size: 12px; margin-top: 4px">
            出售 +{{ formatMoney(it.realValue) }} · 入展 +{{ formatMoney(QUALITY_META[it.quality].exhibitIncome) }}/场
          </div>
        </div>
      </div>
      <hr class="divider" />
      <div class="row space-between">
        <span class="muted">出售变现合计：<b style="color: var(--gold)">{{ formatMoney(sellTotal) }}</b>　入展每场产出：<b class="pos">{{ formatMoney(exhibitTotal) }}</b></span>
        <button class="btn btn-gold" @click="confirm">确认结算并返回</button>
      </div>
    </div>

    <div v-else class="card text-center">
      <p class="muted" style="margin-top: 0">本场没有可处置的藏品。</p>
      <button class="btn btn-primary" @click="finishNoItems">确认结算并返回 →</button>
    </div>
  </div>
</template>

<style scoped>
.result-banner {
  text-align: center;
  padding: 26px;
}
.result-banner.win {
  border-color: rgba(70, 217, 160, 0.5);
  background: linear-gradient(180deg, rgba(70, 217, 160, 0.1), transparent);
}
.result-banner.lose {
  border-color: rgba(255, 95, 109, 0.4);
  background: linear-gradient(180deg, rgba(255, 95, 109, 0.08), transparent);
}
.dividend-card {
  border-color: rgba(240, 200, 103, 0.4);
  background: rgba(240, 200, 103, 0.06);
}
.dispose-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
  margin-top: 12px;
}
@media (max-width: 760px) {
  .dispose-grid {
    grid-template-columns: 1fr;
  }
}
</style>