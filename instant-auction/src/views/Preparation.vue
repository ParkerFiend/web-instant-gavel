<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { HELPERS, INSTRUMENTS, VENUES } from '../data/config'
import { usePlayerStore } from '../stores/playerStore'
import { useAuctionStore } from '../stores/auctionStore'
import { formatMoney } from '../utils/format'
import type { Instrument } from '../types'

const route = useRoute()
const router = useRouter()
const player = usePlayerStore()
const auction = useAuctionStore()

const venueId = (route.query.venue as string) || 'shell'
const venue = VENUES.find((v) => v.id === venueId)!
const helperId = ref<string>(HELPERS[0].id)

const qty = reactive<Record<string, number>>({})
INSTRUMENTS.forEach((i) => (qty[i.id] = 0))

const existingStock = ref<Instrument[]>(player.player.instruments.map((i) => ({ ...i })))
const carryIds = ref<string[]>(existingStock.value.map((i) => i.id))

const buyCost = computed(() =>
  INSTRUMENTS.reduce((s, i) => s + i.price * (qty[i.id] || 0), 0),
)
const buyCount = computed(() => INSTRUMENTS.reduce((s, i) => s + (qty[i.id] || 0), 0))

function changeQty(id: string, delta: number) {
  qty[id] = Math.max(0, (qty[id] || 0) + delta)
}

function buildInstanceIds(): string[] {
  const ids: string[] = []
  const counter: Record<string, number> = {}
  INSTRUMENTS.forEach((i) => {
    const n = qty[i.id] || 0
    for (let k = 0; k < n; k++) {
      counter[i.id] = (counter[i.id] || 0) + 1
      ids.push(`${i.id}#${counter[i.id]}`)
    }
  })
  return ids
}

const notice = ref('')

function purchase() {
  if (buyCount.value === 0) {
    notice.value = '请先选择要购买的仪器数量。'
    return
  }
  if (player.currency < buyCost.value) {
    notice.value = '金贝铢不足，无法购买该仪器组合。'
    return
  }
  const ids = buildInstanceIds()
  const built: Instrument[] = ids.map((iid) => {
    const base = iid.split('#')[0]
    const cfg = INSTRUMENTS.find((x) => x.id === base)!
    return { id: iid, name: cfg.name, type: cfg.type, price: cfg.price, desc: cfg.desc }
  })
  player.buyInstruments(built)
  existingStock.value = built.map((i) => ({ ...i }))
  carryIds.value = ids
  notice.value = `已购入 ${built.length} 件仪器，旧的仪器库存已作废。`
}

function carryExisting() {
  carryIds.value = existingStock.value.map((i) => i.id)
  notice.value = carryIds.value.length ? `将携带现有库存 ${carryIds.value.length} 件仪器。` : '当前没有可携带的仪器。'
}

function start() {
  auction.startAuction(venue.id, helperId.value, carryIds.value)
  router.push({ name: 'bidding' })
}
</script>

<template>
  <div class="fadein">
    <h1 class="page-title">局前准备 · {{ venue.name }}</h1>
    <p class="page-sub">选择一名竞拍帮手，并可购买或携带仪器进入拍卖。仪器每回合最多使用一个。</p>

    <div class="grid-2">
      <div class="card">
        <h3 style="margin-top: 0">竞拍帮手</h3>
        <div class="helper-list">
          <label v-for="h in HELPERS" :key="h.id" class="helper" :class="{ active: helperId === h.id }">
            <input type="radio" :value="h.id" v-model="helperId" />
            <div>
              <div class="helper-name">{{ h.name }} <span class="tag">{{ h.title }}</span></div>
              <div class="muted" style="font-size: 12px">{{ h.desc }}</div>
            </div>
          </label>
        </div>
      </div>

      <div class="card">
        <h3 style="margin-top: 0">仪器采购</h3>
        <p class="muted" style="font-size: 12px">
          购买新组合会清空旧库存。未使用的仪器可带出留待下次使用。
        </p>
        <div class="inst-catalog">
          <div v-for="i in INSTRUMENTS" :key="i.id" class="inst-row">
            <div class="inst-info">
              <div class="inst-name">{{ i.name }}</div>
              <div class="faint" style="font-size: 11px">{{ i.desc }}</div>
            </div>
            <div class="inst-price">{{ formatMoney(i.price) }}</div>
            <div class="stepper">
              <button class="mini" @click="changeQty(i.id, -1)">−</button>
              <span class="qty">{{ qty[i.id] }}</span>
              <button class="mini" @click="changeQty(i.id, 1)">＋</button>
            </div>
          </div>
        </div>
        <div class="row space-between mt">
          <span class="muted">合计：<b style="color: var(--gold)">{{ formatMoney(buyCost) }}</b></span>
          <button class="btn btn-primary" :disabled="buyCount === 0 || player.currency < buyCost" @click="purchase">
            购买 {{ buyCount }} 件
          </button>
        </div>

        <hr class="divider" />
        <div class="row space-between">
          <span class="muted" style="font-size: 13px">
            现有库存：{{ existingStock.length }} 件
          </span>
          <button class="btn" @click="carryExisting">携带现有库存</button>
        </div>
      </div>
    </div>

    <div class="card mt row space-between">
      <div>
        <div>本次携带仪器：<b>{{ carryIds.length }}</b> 件</div>
        <div class="faint" style="font-size: 12px">入场费已支付 {{ formatMoney(venue.entryFee) }}，当前资产 {{ formatMoney(player.currency) }}</div>
      </div>
      <div class="row">
        <button class="btn" @click="router.push('/')">返回主页</button>
        <button class="btn btn-gold" @click="start">开始拍卖 →</button>
      </div>
    </div>
    <p v-if="notice" class="muted mt" style="font-size: 13px">{{ notice }}</p>
  </div>
</template>

<style scoped>
.helper-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.helper {
  display: flex;
  gap: 10px;
  padding: 12px;
  border: 1px solid var(--line);
  border-radius: 10px;
  cursor: pointer;
  background: var(--bg-2);
  transition: 0.15s;
}
.helper.active {
  border-color: var(--accent);
  background: linear-gradient(90deg, rgba(124, 92, 255, 0.12), transparent);
}
.helper input {
  margin-top: 3px;
}
.helper-name {
  font-weight: 700;
}
.tag {
  font-size: 11px;
  padding: 1px 7px;
  border-radius: 999px;
  background: var(--bg-3);
  border: 1px solid var(--line-2);
  color: var(--text-dim);
  font-weight: 500;
}
.inst-catalog {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 10px;
}
.inst-row {
  display: flex;
  align-items: center;
  gap: 10px;
  background: var(--bg-2);
  border: 1px solid var(--line);
  border-radius: 10px;
  padding: 10px 12px;
}
.inst-info {
  flex: 1;
}
.inst-name {
  font-weight: 600;
  font-size: 14px;
}
.inst-price {
  color: var(--gold);
  font-weight: 600;
  font-size: 13px;
  min-width: 60px;
  text-align: right;
}
.stepper {
  display: flex;
  align-items: center;
  gap: 6px;
}
.mini {
  width: 26px;
  height: 26px;
  border-radius: 7px;
  border: 1px solid var(--line-2);
  background: var(--bg-3);
  color: var(--text);
  cursor: pointer;
  font-size: 15px;
}
.qty {
  min-width: 18px;
  text-align: center;
  font-weight: 700;
}
</style>