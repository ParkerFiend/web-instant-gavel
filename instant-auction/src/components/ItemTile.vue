<script setup lang="ts">
import { computed } from 'vue'
import type { CollectionItem } from '../types'
import { QUALITY_META } from '../data/config'
import { formatMoney } from '../utils/format'

const props = defineProps<{ item: CollectionItem; hint?: boolean }>()

const meta = computed(() => QUALITY_META[props.item.quality])
const fully = computed(() => props.item.revealed.name)

const shownName = computed(() => (props.item.revealed.name ? props.item.name : '神秘藏品'))
const shownQual = computed(() => (props.item.revealed.quality ? meta.value.label : ''))
const shownValue = computed(() => (props.item.revealed.value && props.item.revealed.valueEstimate ? props.item.revealed.valueEstimate : null))

const style = computed(() => {
  const color = meta.value.color
  return { borderColor: color, boxShadow: `0 0 0 1px ${color}22` }
})
</script>

<template>
  <div class="tile" :style="style">
    <div class="tile-top">
      <span class="q-dot" :style="{ background: meta.color }"></span>
      <span class="tile-size faint" v-if="props.item.revealed.size">{{ props.item.size[0] }}×{{ props.item.size[1] }}格</span>
      <span class="tile-size faint" v-else>??×??</span>
    </div>
    <div class="tile-body">
      <div v-if="fully || props.item.revealed.outline" class="tile-name">{{ shownName }}</div>
      <div v-else class="tile-name masked">？</div>
      <div class="tile-qual">
        <span v-if="shownQual" class="badge" :style="{ background: meta.color, color: '#111' }">{{ shownQual }}</span>
        <span v-else class="faint">品质未知</span>
      </div>
    </div>
    <div class="tile-foot">
      <template v-if="shownValue">
        <span class="tile-val">约 {{ formatMoney(shownValue) }}</span>
      </template>
      <template v-else-if="fully">
        <span class="tile-val">¥ {{ formatMoney(props.item.realValue) }}</span>
      </template>
      <template v-else>
        <span class="faint">估值未知</span>
      </template>
    </div>
  </div>
</template>

<style scoped>
.tile {
  background: linear-gradient(160deg, var(--bg-3), var(--bg-2));
  border: 1px solid;
  border-radius: 12px;
  padding: 12px;
  min-height: 118px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.tile-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.tile-size {
  font-size: 12px;
}
.tile-body {
  flex: 1;
}
.tile-name {
  font-weight: 700;
  font-size: 15px;
}
.tile-name.masked {
  font-size: 22px;
  color: var(--text-faint);
  letter-spacing: 4px;
}
.tile-qual {
  margin-top: 6px;
}
.tile-foot {
  font-size: 13px;
}
.tile-val {
  color: var(--gold);
  font-weight: 600;
}
</style>