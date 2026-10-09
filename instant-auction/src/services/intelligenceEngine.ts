import type { CollectionItem, Helper, Instrument, RevealType } from '../types'
import { QUALITY_META } from '../data/config'
import { randInt } from '../utils/format'

function notFullyRevealed(items: CollectionItem[]): CollectionItem[] {
  return items.filter((i) => !i.revealed.name)
}

function estimateNoise(real: number): number {
  return Math.max(1, Math.round(real * (0.82 + Math.random() * 0.36)))
}

export const intelligenceEngine = {
  applyReveal(items: CollectionItem[], type: RevealType, count: number): string[] {
    const messages: string[] = []
    const targetable = notFullyRevealed(items)

    let chosen: CollectionItem[] = []
    if (type === 'low') {
      const sorted = [...targetable].sort((a, b) => a.realValue - b.realValue)
      chosen = sorted.slice(0, count)
    } else {
      chosen = []
      const pool = targetable.slice()
      while (chosen.length < count && pool.length > 0) {
        const idx = randInt(0, pool.length - 1)
        chosen.push(pool[idx])
        pool.splice(idx, 1)
      }
    }

    for (const item of chosen) {
      if (type === 'outline' && !item.revealed.outline) {
        item.revealed.outline = true
        messages.push(`轮廓成像：${item.name}的外形轮廓逐渐清晰。`)
      } else if (type === 'quality' && !item.revealed.quality) {
        item.revealed.quality = true
        messages.push(`品质辨识：其中一件藏品的品质为「${QUALITY_META[item.quality].label}」。`)
      } else if (type === 'size' && !item.revealed.size) {
        item.revealed.size = true
        messages.push(`尺寸判定：其中一件藏品需占用 ${item.size[0]}×${item.size[1]} 格空间。`)
      } else if (type === 'value' && !item.revealed.value) {
        item.revealed.value = true
        item.revealed.valueEstimate = estimateNoise(item.realValue)
        messages.push(`估值扫描：推断某件藏品的价值约为 ${(item.revealed.valueEstimate / 10000).toFixed(0)} 万。`)
      } else if (type === 'low' && !item.revealed.value) {
        item.revealed.value = true
        item.revealed.valueEstimate = item.realValue
        messages.push(`排除仪确认：其中一件藏品属低价值区间（估值 ${(item.revealed.valueEstimate / 10000).toFixed(0)} 万）。`)
      } else if (type === 'full') {
        item.revealed.name = true
        item.revealed.outline = true
        item.revealed.quality = true
        item.revealed.value = true
        item.revealed.size = true
        item.revealed.valueEstimate = item.realValue
        messages.push(`完全鉴定：确认藏品「${item.name}」为「${QUALITY_META[item.quality].label}」，真实价值 ${item.realValue.toLocaleString('en-US')}。`)
      }
    }
    return messages
  },

  applyHelper(items: CollectionItem[], helper: Helper | null): string[] {
    if (!helper) return []
    return this.applyReveal(items, helper.revealType, helper.revealCount)
  },

  applyInstrument(items: CollectionItem[], instrument: Instrument): string[] {
    const count = instrument.type === 'size' ? 4 : 3
    return this.applyReveal(items, instrument.type, count)
  },

  publicInfo(round: number, items: CollectionItem[]): string[] {
    const total = items.length
    if (round === 1) {
      return [`第 1 回合公开情报：本场共 ${total} 件神秘藏品，皆被黑布遮盖，真容莫测。`, '提示：品质越深的藏品，价值波动越大，风险与收益并存。']
    }
    if (round === 3) {
      return ['第 3 回合公开情报：当前场地条件良好，拍卖热度上升，高价藏品可能引来激烈争抢。', '注意：本回合买断阈值已降至 1.3 倍。']
    }
    if (round === 6) {
      return ['加赛回合！第 5 回合最高价出现并列，本回合出价不得低于第 5 回合最高价，再次并列则流拍。']
    }
    return []
  },
}

export function indexPoolPublic(_items: CollectionItem[]): void {
  // reserved for future filters
}