<script setup lang="ts">
import { useRouter } from 'vue-router'
import { VENUES } from '../data/config'
import { usePlayerStore } from '../stores/playerStore'
import { formatMoney } from '../utils/format'
import type { Venue } from '../types'

const router = useRouter()
const player = usePlayerStore()

function proceed(v: Venue) {
  if (!player.canEnter(v)) return
  if (!player.enterVenue(v)) return
  router.push({ name: 'prepare', query: { venue: v.id } })
}
</script>

<template>
  <div class="fadein">
    <h1 class="page-title">选择会场</h1>
    <p class="page-sub">不同会场门槛与藏品品质分布不同，入场费一经扣除不予退还。</p>

    <div class="grid-3">
      <div v-for="v in VENUES" :key="v.id" class="card venue-card">
        <div class="venue-head">
          <h3 style="margin: 0">{{ v.name }}</h3>
          <span class="tag">{{ v.id === 'shell' ? '入门' : v.id === 'coral' ? '进阶' : '顶级' }}</span>
        </div>
        <p class="muted" style="font-size: 13px; min-height: 54px">{{ v.desc }}</p>
        <div class="venue-info">
          <div class="row space-between">
            <span class="faint">资产门槛</span>
            <span>{{ v.assetRequirement ? formatMoney(v.assetRequirement) : '无要求' }}</span>
          </div>
          <div class="row space-between">
            <span class="faint">入场费</span>
            <span>{{ v.entryFee ? formatMoney(v.entryFee) : '免费' }}</span>
          </div>
          <div class="row space-between">
            <span class="faint">藏品件数</span>
            <span>{{ v.itemCount[0] }}–{{ v.itemCount[1] }} 件</span>
          </div>
          <div class="row space-between">
            <span class="faint">品质分布</span>
            <span class="weights">
              <span v-for="(w, q) in v.rarityWeight" :key="q" class="w-item">
                <span class="q-dot" :style="{ background: q === 'gray' ? '#8a8f98' : q === 'blue' ? '#46b6ff' : q === 'purple' ? '#b58aff' : q === 'gold' ? '#ffb84d' : '#ff5f6d' }"></span>
                {{ w }}
              </span>
            </span>
          </div>
        </div>
        <button
          class="btn btn-primary btn-block mt"
          :disabled="!player.canEnter(v)"
          @click="proceed(v)"
        >
          {{ player.canEnter(v) ? `支付入场费进入` : '资产不足' }}
        </button>
      </div>
    </div>

    <div class="card mt">
      <span class="muted" style="font-size: 13px">
        当前资产：<b style="color: var(--gold)">{{ formatMoney(player.currency) }}</b> 金贝铢
      </span>
    </div>
  </div>
</template>

<style scoped>
.venue-card {
  display: flex;
  flex-direction: column;
}
.venue-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.tag {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 999px;
  background: var(--bg-3);
  border: 1px solid var(--line-2);
  color: var(--text-dim);
}
.venue-info {
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 13px;
}
.weights {
  display: inline-flex;
  gap: 8px;
}
.w-item {
  display: inline-flex;
  align-items: center;
  font-size: 12px;
}
.w-item .q-dot {
  width: 8px;
  height: 8px;
  margin-right: 3px;
}
</style>