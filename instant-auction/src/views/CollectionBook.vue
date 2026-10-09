<script setup lang="ts">
import { computed } from 'vue'
import { NAME_POOL, QUALITY_META } from '../data/config'
import { usePlayerStore } from '../stores/playerStore'
import type { Quality } from '../types'
import { formatMoney } from '../utils/format'

const player = usePlayerStore()

interface Entry {
  name: string
  quality: Quality
  unlocked: boolean
  owned: boolean
  value: number | null
}

const qualities: Quality[] = ['red', 'gold', 'purple', 'blue', 'gray']

const ownedNames = computed(() => {
  const set = new Set<string>()
  player.inventory.forEach((i) => set.add(i.name))
  player.exhibition.forEach((i) => set.add(i.name))
  return set
})

const entriesByQuality = computed(() => {
  const book = player.data.collectionBook as Record<string, { quality: Quality; value: number }>
  const map: Record<string, Entry[]> = {}
  for (const q of qualities) {
    map[q] = NAME_POOL[q].map((name) => {
      const rec = book[name]
      return {
        name,
        quality: q,
        unlocked: !!rec,
        owned: ownedNames.value.has(name),
        value: rec ? rec.value : null,
      }
    })
  }
  return map
})

const totalCount = computed(() => qualities.reduce((s, q) => s + NAME_POOL[q].length, 0))
const unlockedCount = computed(() => {
  const book = player.data.collectionBook as Record<string, unknown>
  return Object.keys(book).length
})
</script>

<template>
  <div class="fadein">
    <h1 class="page-title">藏品图鉴</h1>
    <p class="page-sub">
      已记录 {{ unlockedCount }} / {{ totalCount }} 种藏品。参与拍卖并在结算环节即可鉴定并收录藏品。
    </p>

    <div class="card mb">
      <div class="progress-track">
        <div class="progress-fill" :style="{ width: (unlockedCount / totalCount) * 100 + '%' }"></div>
      </div>
      <div class="muted" style="font-size: 12px; margin-top: 8px">
        解锁进度 {{ ((unlockedCount / totalCount) * 100).toFixed(0) }}%
      </div>
    </div>

    <div v-for="q in qualities" :key="q" class="card mb">
      <h3 style="margin: 0 0 12px">
        <span class="q-dot" :style="{ background: QUALITY_META[q].color }"></span>
        {{ QUALITY_META[q].label }}藏品
        <span class="faint" style="font-size: 13px; font-weight: 400">
          （价值区间 {{ formatMoney(QUALITY_META[q].valueRange[0]) }} ~ {{ formatMoney(QUALITY_META[q].valueRange[1]) }}）
        </span>
      </h3>
      <div class="book-grid">
        <div
          v-for="e in entriesByQuality[q]"
          :key="e.name"
          class="book-item"
          :class="{ locked: !e.unlocked }"
          :style="e.unlocked ? { borderColor: QUALITY_META[q].color + '66' } : {}"
        >
          <div class="book-name">{{ e.unlocked ? e.name : '？？？' }}</div>
          <div class="faint" style="font-size: 12px">
            <template v-if="e.unlocked">
              {{ e.value !== null ? '鉴定价值 ' + formatMoney(e.value) : '已收录' }}
              <span v-if="e.owned" class="badge owned">持有中</span>
            </template>
            <template v-else>未解锁</template>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.progress-track {
  height: 10px;
  background: var(--bg);
  border-radius: 999px;
  overflow: hidden;
  border: 1px solid var(--line);
}
.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--accent-2), var(--gold));
  transition: width 0.3s;
}
.book-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}
.book-item {
  background: var(--bg-2);
  border: 1px solid var(--line);
  border-radius: 10px;
  padding: 10px 12px;
}
.book-item.locked {
  opacity: 0.5;
}
.book-name {
  font-weight: 700;
  font-size: 14px;
  margin-bottom: 4px;
}
.owned {
  margin-left: 6px;
  background: var(--green);
  color: #06281c;
  font-size: 10px;
  padding: 1px 6px;
}
@media (max-width: 760px) {
  .book-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>