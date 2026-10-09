import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { AuctionOutcome, AuctionRound, AuctionState, Instrument, VenueId } from '../types'
import { VENUES } from '../data/config'
import { collectionGenerator } from '../services/collectionGenerator'
import { intelligenceEngine } from '../services/intelligenceEngine'
import { auctionEngine, type RoundResult } from '../services/auctionEngine'
import { createBots, decideBotBid } from '../services/botBidding'
import { HELPERS } from '../data/config'
import { shuffle } from '../utils/format'

const personalities = ['conservative', 'estimated', 'aggressive', 'dividend'] as const

export const useAuctionStore = defineStore('auction', () => {
  const state = ref<AuctionState | null>(null)
  const active = ref(false)
  const lastResult = ref<RoundResult | null>(null)
  const outcome = ref<AuctionOutcome | null>(null)
  const justBots = ref<{ botId: string; price: number }[]>([])

  const venue = computed(() => (state.value ? VENUES.find((v) => v.id === state.value!.venueId) : null))

  const currentRound = computed(() => state.value?.currentRound ?? 0)
  const currentBids = computed(() => {
    const s = state.value
    if (!s) return []
    const round = s.rounds[s.rounds.length - 1]
    return round ? round.bids : []
  })
  const roundPublicInfo = computed(() => {
    const s = state.value
    if (!s) return []
    const round = s.rounds[s.rounds.length - 1]
    return round && round.publicInfo ? round.publicInfo : []
  })
  const topBids = computed(() => (state.value ? auctionEngine.currentTopBids(state.value) : { max: 0, second: 0, maxBidders: [], activeCount: 0 }))

  const playerMinBid = computed(() => {
    const s = state.value
    if (!s) return 0
    if (s.currentRound === 1) return 1
    if (s.currentRound === 6) {
      const globalMax = Math.max(0, ...Object.values(s.standing))
      return Math.max(1, s.playerLastBid, globalMax)
    }
    return Math.max(1, s.playerLastBid)
  })

  const isFinished = computed(() => state.value !== null && state.value.result !== 'pending')

  function startAuction(venueId: VenueId, helperId: string | null, instrumentIds: string[]): void {
    const items = collectionGenerator.generate(venueId)
    const v = VENUES.find((x) => x.id === venueId)!
    const helper = HELPERS.find((h) => h.id === helperId) ?? null
    const instruments: Instrument[] = []
    for (const iid of instrumentIds) {
      // lookup by storing id -> find in a registry by matching known ids
      const found = importKnownInstrument(iid)
      if (found) instruments.push({ ...found })
    }
    const bots = createBots(items, shuffle([...personalities]))

    const firstRound: AuctionRound = {
      round: 1,
      bids: [],
      publicInfo: intelligenceEngine.publicInfo(1, items),
    }

    const logs: string[] = []
    logs.push(`大会开启：你进入「${v.name}」，共生成 ${items.length} 件神秘藏品。`)
    if (helper) {
      logs.push(`你选择了帮手「${helper.name}」。`)
      if (helper.revealRound === 1) {
        logs.push(...intelligenceEngine.applyHelper(items, helper))
      }
    }

    const s: AuctionState = {
      venueId,
      items,
      helper,
      instruments,
      activeInstrumentIds: instruments.map((i) => i.id),
      rounds: [firstRound],
      currentRound: 1,
      activePlayers: ['player', ...bots.map((b) => b.id)],
      standing: {},
      playerLastBid: 0,
      playerPassed: false,
      bots,
      winnerId: null,
      finalPrice: null,
      result: 'pending',
      buyoutTriggered: false,
      logs,
      entryFee: v.entryFee,
    }
    state.value = s
    active.value = true
    outcome.value = null
    lastResult.value = null
    justBots.value = []
  }

  function log(msg: string): void {
    state.value?.logs.push(msg)
  }

  function useInstrument(instrumentId: string): string[] {
    const s = state.value
    if (!s) return []
    const idx = s.activeInstrumentIds.indexOf(instrumentId)
    if (idx >= 0) {
      s.activeInstrumentIds.splice(idx, 1)
    }
    const inst = s.instruments.find((i) => i.id === instrumentId)
    if (!inst) return []
    const msgs = intelligenceEngine.applyInstrument(s.items, inst)
    s.logs.push(`你使用了仪器「${inst.name}」。`)
    msgs.forEach((m) => s.logs.push(m))
    return msgs
  }

  function placeBid(price: number): void {
    const s = state.value
    if (!s || s.result !== 'pending' || s.playerPassed) return
    const prev = s.standing['player'] ?? 0
    const priceNum = Math.max(prev, 1, Math.round(price))
    s.playerLastBid = priceNum
    s.standing['player'] = priceNum

    const round = s.rounds[s.rounds.length - 1]
    round.bids.push({ playerId: 'player', price: priceNum, active: true })
    log(`你出价 ${priceNum.toLocaleString('en-US')}，静待其他买家出价…`)

    runBotsAndResolve()
  }

  function playerFold(): void {
    const s = state.value
    if (!s || s.result !== 'pending' || s.playerPassed) return
    s.playerPassed = true
    log('你选择了弃权，退出本轮竞价。')
    runBotsAndResolve()
  }

  function runBotsAndResolve(): void {
    const s = state.value
    if (!s) return

    const round = s.rounds[s.rounds.length - 1]
    let globalMax = Math.max(0, ...Object.values(s.standing))

    justBots.value = []
    for (const bot of s.bots) {
      if (!bot.active) continue
      const bid = decideBotBid(bot, s.currentRound, globalMax)
      if (bid !== null && bid > 0) {
        s.standing[bot.id] = bid
        round.bids.push({ playerId: bot.id, price: bid, active: true })
        if (bid > globalMax) globalMax = bid
        justBots.value.push({ botId: bot.id, price: bid })
      } else {
        bot.active = false
      }
    }

    const res = auctionEngine.resolveRound(s)
    lastResult.value = res

    if (res.kind === 'buyout' || res.kind === 'winner' || res.kind === 'passed') {
      s.logs.push(res.message)
      s.result = res.kind === 'passed' ? 'passed' : 'sold'
      outcome.value = auctionEngine.buildOutcome(s)
      return
    }

    if (res.kind === 'overtime') {
      s.logs.push(res.message)
      startRound(6)
      if (s.playerPassed) runBotsAndResolve()
      return
    }

    const top = auctionEngine.currentTopBids(s)
    const leader = top.maxBidders[0]
    const leaderName = leader ? auctionEngine.resolvePlayerName(s, leader) : '—'
    s.logs.push(
      `第 ${s.currentRound - 1} 回合结束，当前最高价 ${top.max.toLocaleString('en-US')}（领先：${leaderName}）。`,
    )
    startRound(s.currentRound)
    if (s.playerPassed) runBotsAndResolve()
  }

  function startRound(roundNum: number): void {
    const s = state.value
    if (!s) return
    const round: AuctionRound = {
      round: roundNum,
      bids: [],
      publicInfo: intelligenceEngine.publicInfo(roundNum, s.items),
    }
    s.rounds.push(round)

    if (s.helper && s.helper.revealRound === roundNum) {
      const msgs = intelligenceEngine.applyHelper(s.items, s.helper)
      msgs.forEach((m) => s.logs.push(m))
    }
    s.logs.push(`第 ${roundNum} 回合开始，请确认你的出价。`)
    justBots.value = []
  }

  function reset(): void {
    state.value = null
    active.value = false
    outcome.value = null
    lastResult.value = null
    justBots.value = []
  }

  return {
    state,
    active,
    lastResult,
    outcome,
    venue,
    currentRound,
    currentBids,
    roundPublicInfo,
    topBids,
    playerMinBid,
    isFinished,
    justBots,
    startAuction,
    useInstrument,
    placeBid,
    playerFold,
    reset,
  }
})

const knownInstruments: Record<string, { name: string; type: Instrument['type']; price: number }> = {
  'i-estimate': { name: '估值扫描仪', type: 'value', price: 30000 },
  'i-outline': { name: '轮廓成像仪', type: 'outline', price: 20000 },
  'i-quality': { name: '品质探测笔', type: 'quality', price: 22000 },
  'i-exclude': { name: '低值排除仪', type: 'low', price: 38000 },
  'i-size': { name: '尺寸量具', type: 'size', price: 15000 },
}

function importKnownInstrument(instanceId: string): Instrument | null {
  const base = instanceId.split('#')[0]
  const known = knownInstruments[base]
  if (!known) return null
  return { id: instanceId, name: known.name, type: known.type, price: known.price, desc: '' }
}