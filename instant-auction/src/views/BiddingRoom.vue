<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuctionStore } from '../stores/auctionStore'
import { usePlayerStore } from '../stores/playerStore'
import { BUYOUT_MULTIPLIER } from '../data/config'
import { formatFull, formatMoney } from '../utils/format'
import ItemTile from '../components/ItemTile.vue'

const router = useRouter()
const auction = useAuctionStore()
const player = usePlayerStore()

const bidInput = ref(0)
const pendingBid = ref<number | null>(null)
const roundUsedInstrument = ref(false)
const flash = ref('')

const s = computed(() => auction.state)
const round = computed(() => auction.currentRound)
const top = computed(() => auction.topBids)
const wonItems = computed(() => (s.value ? s.value.items.filter((i) => i.revealed.name).length : 0))

const buyoutText = computed(() => {
  const r = round.value
  if (r <= 4) {
    const m = BUYOUT_MULTIPLIER[r]
    const second = top.value.second
    const need = second > 0 ? Math.floor(second * m) + 1 : 0
    return `本回合买断线：最高价需高于第二名 ${m.toFixed(1)} 倍${need ? `（需 > ${formatMoney(need)}）` : ''}`
  }
  if (r === 5) return '第 5 回合不买断，最高价者直接成交。'
  return '加赛回合：出价不得低于第 5 回合最高价，再次并列则流拍。'
})

const canBid = computed(() => !!s.value && s.value.result === 'pending' && !s.value.playerPassed && !auction.isFinished)
const minBid = computed(() => auction.playerMinBid)

const botRows = computed(() => {
  const st = s.value
  if (!st) return []
  return st.bots.map((b) => ({
    name: b.name,
    active: b.active,
    bid: st.standing[b.id] ?? null,
  }))
})

function suggestBid(): number {
  const base = Math.max(minBid.value, top.value.max + 50000)
  return Math.ceil(base / 50000) * 50000
}

function adjust(delta: number) {
  bidInput.value = Math.max(minBid.value, bidInput.value + delta)
}

function useInstrument(id: string) {
  if (roundUsedInstrument.value) return
  const before = s.value ? s.value.items.filter((i) => i.revealed.name || i.revealed.value).length : 0
  auction.useInstrument(id)
  const after = s.value ? s.value.items.filter((i) => i.revealed.name || i.revealed.value).length : 0
  roundUsedInstrument.value = true
  flash.value = `情报更新：信息量 +${after - before}`
}

function askConfirm() {
  const v = Math.max(minBid.value, Math.round(bidInput.value))
  bidInput.value = v
  if (v < minBid.value) return
  pendingBid.value = v
}

function doConfirm() {
  if (pendingBid.value === null) return
  auction.placeBid(pendingBid.value)
  pendingBid.value = null
  maybeFlash()
}

function doFold() {
  auction.playerFold()
  maybeFlash()
}

function maybeFlash() {
  const r = auction.lastResult
  if (r && r.kind !== 'continue') flash.value = r.message
  else flash.value = '回合结束，进入下一回合。'
}

function resetForRound() {
  roundUsedInstrument.value = false
  bidInput.value = suggestBid()
  pendingBid.value = null
}

watch(round, () => resetForRound())
watch(
  () => auction.isFinished,
  (done) => {
    if (done) resetForRound()
  },
)

onMounted(() => {
  if (!auction.active || !auction.state) {
    router.replace('/')
    return
  }
  resetForRound()
})

function goSettlement() {
  router.push({ name: 'settlement' })
}
</script>

<template>
  <div v-if="s" class="fadein">
    <div class="row space-between mb">
      <div>
        <h1 class="page-title" style="margin: 0">竞拍房间 · {{ auction.venue?.name }}</h1>
        <span class="muted" style="font-size: 13px">
          第 <b style="color: var(--gold)">{{ round }}</b> 回合 / 最多 6 回合 · 已揭示 {{ wonItems }}/{{ s.items.length }} 件
        </span>
      </div>
      <div class="money-chip">持有 {{ formatMoney(player.currency) }} <span class="unit">金贝铢</span></div>
    </div>

    <div class="layout">
      <section class="left card">
        <h3 style="margin-top: 0">藏品仓库</h3>
        <div class="item-grid">
          <ItemTile v-for="it in s.items" :key="it.id" :item="it" />
        </div>
      </section>

      <aside class="right">
        <div class="card">
          <div class="round-head">
            <span class="round-pill">R{{ round }}</span>
            <span class="muted" style="font-size: 12px">{{ buyoutText }}</span>
          </div>
          <div class="topic">
            <div>
              <div class="faint" style="font-size: 12px">当前最高价</div>
              <div class="big-amount" style="color: var(--gold)">{{ top.max ? formatMoney(top.max) : '—' }}</div>
            </div>
            <div>
              <div class="faint" style="font-size: 12px">第二名</div>
              <div class="big-amount" style="color: var(--text-dim)">{{ top.second ? formatMoney(top.second) : '—' }}</div>
            </div>
          </div>
          <div v-if="auction.roundPublicInfo.length" class="public-info">
            <div v-for="(p, i) in auction.roundPublicInfo" :key="i">📢 {{ p }}</div>
          </div>
        </div>

        <div class="card">
          <h4 style="margin: 0 0 8px">情报仪器 <span class="faint" style="font-size: 12px">（每回合限用一个）</span></h4>
          <div v-if="s.instruments.length === 0" class="faint" style="font-size: 13px">本局未携带仪器。</div>
          <div v-else class="inst-btns">
            <button
              v-for="ins in s.instruments"
              :key="ins.id"
              class="btn"
              :disabled="roundUsedInstrument || !s.activeInstrumentIds.includes(ins.id)"
              @click="useInstrument(ins.id)"
            >
              {{ ins.name }}
              <span class="faint">×{{ s.activeInstrumentIds.filter((x) => x.split('#')[0] === ins.id.split('#')[0]).length }}</span>
            </button>
          </div>
        </div>

        <div class="card">
          <h4 style="margin: 0 0 10px">出价</h4>

          <div v-if="!auction.isFinished">
            <div class="bid-input">
              <button class="mini" @click="adjust(-50000)">−5万</button>
              <input
                type="number"
                v-model.number="bidInput"
                :min="minBid"
                :step="10000"
                class="num"
                :disabled="!canBid"
              />
              <button class="mini" @click="adjust(50000)">＋5万</button>
            </div>
            <div class="row" style="margin-top: 8px; font-size: 12px">
              <span class="faint">最低可出价 {{ formatFull(minBid) }}</span>
              <button class="mini" @click="() => (bidInput = suggestBid())">推荐 {{ formatMoney(suggestBid()) }}</button>
            </div>

            <div v-if="s.playerPassed" class="muted mt">你已弃权，本局将等待其他买家决出胜负。</div>
            <div v-else-if="pendingBid !== null" class="confirm-box mt">
              <div>确认出价 <b style="color: var(--gold)">{{ formatFull(pendingBid) }}</b> 金贝铢？出价后不可撤销。</div>
              <div class="row mt">
                <button class="btn btn-primary" @click="doConfirm">确认出价</button>
                <button class="btn" @click="pendingBid = null">取消</button>
              </div>
            </div>
            <div v-else class="row mt">
              <button class="btn btn-primary" :disabled="!canBid" @click="askConfirm">出价</button>
              <button class="btn btn-danger" :disabled="!canBid" @click="doFold">弃权退出</button>
            </div>
          </div>

          <div v-else class="mt text-center">
            <div class="big-amount" :class="auction.outcome?.winnerIsPlayer ? 'pos' : 'neg'">
              {{ auction.outcome?.winnerIsPlayer ? '竞价结束 · 你赢得本场' : auction.outcome?.result === 'passed' ? '竞价结束 · 流拍' : '竞价结束 · 藏品被他人购得' }}
            </div>
            <button class="btn btn-gold mt" @click="goSettlement">查看结算结果 →</button>
          </div>
        </div>

        <div class="card">
          <h4 style="margin: 0 0 8px">其他买家</h4>
          <div v-for="(b, i) in botRows" :key="i" class="bot-row">
            <span class="q-dot" :style="{ background: b.active ? '#46d9a0' : '#6f6a92' }"></span>
            <span class="bot-name">{{ b.name }}</span>
            <span style="margin-left: auto" class="muted">
              {{ b.active ? (b.bid ? '出价 ' + formatMoney(b.bid) : '观望中') : '已离场' }}
            </span>
          </div>
        </div>
      </aside>
    </div>

    <div class="card mt">
      <h3 style="margin-top: 0">回合日志</h3>
      <div class="log">
        <div v-for="(l, i) in s.logs" :key="i" class="log-line">› {{ l }}</div>
      </div>
    </div>

    <div v-if="flash" class="flash">{{ flash }}</div>
  </div>
</template>

<style scoped>
.layout {
  display: grid;
  grid-template-columns: 1.15fr 0.85fr;
  gap: 16px;
  align-items: start;
}
.item-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}
.right {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.round-head {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}
.round-pill {
  background: linear-gradient(90deg, var(--accent-2), var(--accent));
  color: #fff;
  font-weight: 800;
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 13px;
}
.topic {
  display: flex;
  gap: 30px;
}
.public-info {
  margin-top: 12px;
  font-size: 13px;
  color: var(--text-dim);
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.inst-btns {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.bid-input {
  display: flex;
  align-items: center;
  gap: 8px;
}
.num {
  flex: 1;
  background: var(--bg);
  border: 1px solid var(--line-2);
  color: var(--text);
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 18px;
  font-weight: 700;
  text-align: center;
}
.mini {
  border: 1px solid var(--line-2);
  background: var(--bg-3);
  color: var(--text);
  border-radius: 8px;
  padding: 6px 10px;
  cursor: pointer;
  font-size: 12px;
  white-space: nowrap;
}
.confirm-box {
  background: rgba(240, 200, 103, 0.08);
  border: 1px solid rgba(240, 200, 103, 0.35);
  border-radius: 10px;
  padding: 12px;
  font-size: 13px;
}
.bot-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 0;
  border-bottom: 1px solid var(--line);
  font-size: 13px;
}
.bot-row:last-child {
  border-bottom: none;
}
.bot-name {
  max-width: 190px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.log {
  max-height: 220px;
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 5px;
  font-size: 13px;
  color: var(--text-dim);
}
.log-line {
  line-height: 1.5;
}
.flash {
  position: fixed;
  left: 50%;
  bottom: 26px;
  transform: translateX(-50%);
  background: rgba(23, 21, 42, 0.96);
  border: 1px solid var(--accent);
  color: #fff;
  padding: 12px 20px;
  border-radius: 12px;
  font-size: 14px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.5);
  max-width: 90vw;
  animation: fadein 0.25s ease both;
}
@media (max-width: 860px) {
  .layout {
    grid-template-columns: 1fr;
  }
  .item-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>