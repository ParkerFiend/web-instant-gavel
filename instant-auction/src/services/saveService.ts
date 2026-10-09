import type { SaveData } from '../types'
import { INITIAL_CURRENCY } from '../data/config'
import { uid, today } from '../utils/format'

const KEY = 'instant-auction-save-v1'

function defaultSave(): SaveData {
  return {
    player: {
      currency: INITIAL_CURRENCY,
      totalProfit: 0,
      bestSingleProfit: 0,
      inventory: [],
      exhibition: [],
      lowDailyCount: 0,
      lastLowDate: '',
      wins: 0,
      games: 0,
      instruments: [],
    },
    history: [],
    season: {
      cycleDays: 60,
      startAt: today(),
      profitRank: [],
    },
    collectionBook: {},
  }
}

export const saveService = {
  load(): SaveData {
    try {
      const raw = localStorage.getItem(KEY)
      if (!raw) return defaultSave()
      const parsed = JSON.parse(raw) as SaveData
      const base = defaultSave()
      return {
        ...base,
        ...parsed,
        player: { ...base.player, ...parsed.player },
        season: { ...base.season, ...(parsed.season ?? {}) },
      }
    } catch {
      return defaultSave()
    }
  },

  save(data: SaveData): void {
    try {
      localStorage.setItem(KEY, JSON.stringify(data))
    } catch {
      // storage unavailable
    }
  },

  reset(): SaveData {
    const fresh = defaultSave()
    fresh.player.lastLowDate = today()
    saveService.save(fresh)
    return fresh
  },

  newGameId(): string {
    return uid('game-')
  },
}