import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { AuctionOutcome, CollectionItem, Instrument, SaveData, Venue } from '../types'
import { saveService } from '../services/saveService'
import { revealCollection } from '../services/collectionGenerator'
import { QUALITY_META } from '../data/config'
import { today, uid } from '../utils/format'

const DAILY_ALLOWANCE = 50000

export const usePlayerStore = defineStore('player', () => {
  const data = ref<SaveData>(saveService.load())

  const player = computed(() => data.value.player)
  const currency = computed(() => data.value.player.currency)
  const inventory = computed(() => data.value.player.inventory)
  const exhibition = computed(() => data.value.player.exhibition)
  const history = computed(() => data.value.history)

  function persist(): void {
    saveService.save(data.value)
  }

  function claimDaily(): { success: boolean; amount: number; message: string } {
    const p = data.value.player
    const now = today()
    if (p.lastLowDate !== now) {
      p.lastLowDate = now
      p.lowDailyCount = 0
    }
    if (p.lowDailyCount > 0) {
      return { success: false, amount: 0, message: '今日已领取过低保金。' }
    }
    p.lowDailyCount += 1
    p.currency += DAILY_ALLOWANCE
    persist()
    return { success: true, amount: DAILY_ALLOWANCE, message: `领取低保金 ${DAILY_ALLOWANCE.toLocaleString('en-US')} 金贝铢。` }
  }

  function canEnter(venue: Venue): boolean {
    return data.value.player.currency >= venue.assetRequirement && data.value.player.currency >= venue.entryFee
  }

  function enterVenue(venue: Venue): boolean {
    if (!canEnter(venue)) return false
    data.value.player.currency -= venue.entryFee
    persist()
    return true
  }

  function buyInstruments(newOnes: Instrument[]): boolean {
    const cost = newOnes.reduce((s, i) => s + i.price, 0)
    if (data.value.player.currency < cost) return false
    data.value.player.currency -= cost
    data.value.player.instruments = newOnes.map((i) => ({ ...i }))
    persist()
    return true
  }

  function emptyInstrumentStock(): void {
    data.value.player.instruments = []
    persist()
  }

  function setInstruments(list: Instrument[]): void {
    data.value.player.instruments = list.map((i) => ({ ...i }))
    persist()
  }

  function confirmSettlement(outcome: AuctionOutcome, sellFlags: boolean[]): void {
    const p = data.value.player

    const currentExhibitIncome = exhibition.value.reduce((s, it) => s + QUALITY_META[it.quality].exhibitIncome, 0)
    if (currentExhibitIncome > 0) {
      p.currency += currentExhibitIncome
    }

    if (outcome.winnerIsPlayer) {
      p.currency -= outcome.finalPrice
      outcome.items.forEach((it, idx) => {
        const item = { ...it }
        if (sellFlags[idx]) {
          p.currency += it.realValue
        } else {
          p.exhibition.push(item)
        }
      })
    }

    if (outcome.dividend > 0) p.currency += outcome.dividend

    const netOfGame = outcome.playerProfit + currentExhibitIncome
    p.totalProfit += netOfGame
    if (netOfGame > p.bestSingleProfit) p.bestSingleProfit = netOfGame

    if (outcome.winnerIsPlayer) p.wins += 1
    p.games += 1

    for (const it of outcome.items) {
      data.value.collectionBook[it.name] = { quality: it.quality, value: it.realValue }
    }

    const vname = venueNameOf(outcome.venueId)
    data.value.history.unshift({
      id: uid('rec-'),
      venueId: outcome.venueId,
      venueName: vname,
      date: new Date().toISOString(),
      itemsCount: outcome.items.length,
      realTotal: outcome.realTotal,
      finalPrice: outcome.finalPrice,
      result: outcome.winnerIsPlayer ? 'win' : outcome.result === 'passed' ? 'pass' : 'botWin',
      playerProfit: outcome.playerProfit,
      dividend: outcome.dividend,
      entryFee: outcome.entryFee,
    })
    if (data.value.history.length > 60) data.value.history.length = 60

    persist()
  }

  function sellInventoryItem(id: string): boolean {
    const idx = data.value.player.inventory.findIndex((i) => i.id === id)
    if (idx < 0) return false
    const [item] = data.value.player.inventory.splice(idx, 1)
    data.value.player.currency += item.realValue
    persist()
    return true
  }

  function keepWonItems(items: CollectionItem[]): void {
    const kept: CollectionItem[] = []
    for (const it of items) {
      const item = { ...it }
      revealCollection([item])
      kept.push(item)
    }
    data.value.player.inventory.push(...kept)
    persist()
  }

  function resetSave(): void {
    data.value = saveService.reset()
  }

  return {
    data,
    player,
    currency,
    inventory,
    exhibition,
    history,
    claimDaily,
    canEnter,
    enterVenue,
    buyInstruments,
    emptyInstrumentStock,
    setInstruments,
    confirmSettlement,
    sellInventoryItem,
    keepWonItems,
    resetSave,
  }
})

const VENUE_NAMES: Record<string, string> = { shell: '海贝场', coral: '珊瑚场', pearl: '真珠场' }
function venueNameOf(id: string): string {
  return VENUE_NAMES[id] ?? id
}