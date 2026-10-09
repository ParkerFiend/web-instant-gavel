import type { AuctionState, AuctionOutcome } from '../types'
import { BUYOUT_MULTIPLIER } from '../data/config'
import { totalRealValue } from './botBidding'
import { revealCollection } from './collectionGenerator'

export interface RoundResult {
  kind: 'buyout' | 'winner' | 'continue' | 'overtime' | 'passed'
  winnerId: string | null
  finalPrice: number | null
  message: string
}

function activeStandings(state: AuctionState): { id: string; price: number }[] {
  const ids: string[] = []
  if (!state.playerPassed) ids.push('player')
  for (const bot of state.bots) {
    if (bot.active) ids.push(bot.id)
  }
  return ids
    .map((id) => ({ id, price: state.standing[id] ?? 0 }))
    .filter((x) => x.price > 0)
}

export const auctionEngine = {
  /** highest & second-highest distinct standing bids among still-active bidders */
  currentTopBids(state: AuctionState): { max: number; second: number; maxBidders: string[]; activeCount: number } {
    const entries = activeStandings(state)
    if (entries.length === 0) return { max: 0, second: 0, maxBidders: [], activeCount: 0 }
    const prices = entries.map((e) => e.price).sort((a, b) => b - a)
    const max = prices[0]
    const second = prices.find((p) => p < max) ?? 0
    const maxBidders = entries.filter((e) => e.price === max).map((e) => e.id)
    return { max, second, maxBidders, activeCount: entries.length }
  },

  resolveRound(state: AuctionState): RoundResult {
    const round = state.currentRound
    const { max, second, maxBidders, activeCount } = this.currentTopBids(state)

    if (activeCount === 0) {
      state.result = 'passed'
      state.winnerId = null
      state.finalPrice = null
      return { kind: 'passed', winnerId: null, finalPrice: null, message: '无人出价，本件藏品流拍。' }
    }

    // Rounds 1-4: early buyout check
    if (round <= 4) {
      const mult = BUYOUT_MULTIPLIER[round]
      const bought = activeCount === 1 || (second > 0 && max > second * mult)
      if (bought) {
        state.winnerId = maxBidders[0]
        state.finalPrice = max
        state.result = 'sold'
        state.buyoutTriggered = true
        const name = state.winnerId === 'player' ? '你' : this.resolvePlayerName(state, state.winnerId)
        return {
          kind: 'buyout',
          winnerId: state.winnerId,
          finalPrice: max,
          message: `第 ${round} 回合达到买断阈值，${name}以 ${max.toLocaleString('en-US')} 直接买断全部藏品！`,
        }
      }
      // not bought, continue
      const next = round + 1
      state.currentRound = next
      return { kind: 'continue', winnerId: null, finalPrice: null, message: '' }
    }

    // Round 5: 价高者得
    if (round === 5) {
      if (maxBidders.length === 1) {
        state.winnerId = maxBidders[0]
        state.finalPrice = max
        state.result = 'sold'
        const name = state.winnerId === 'player' ? '你' : this.resolvePlayerName(state, state.winnerId)
        return { kind: 'winner', winnerId: state.winnerId, finalPrice: max, message: `第 5 回合价高者得，${name}以 ${max.toLocaleString('en-US')} 成交！` }
      }
      // tie -> overtime round 6
      state.currentRound = 6
      return { kind: 'overtime', winnerId: null, finalPrice: null, message: '第 5 回合最高价出现并列，进入第 6 回合加赛！' }
    }

    // Round 6: overtime
    if (round === 6) {
      if (maxBidders.length === 1) {
        state.winnerId = maxBidders[0]
        state.finalPrice = max
        state.result = 'sold'
        const name = state.winnerId === 'player' ? '你' : this.resolvePlayerName(state, state.winnerId)
        return { kind: 'winner', winnerId: state.winnerId, finalPrice: max, message: `加赛回合，${name}力压群雄，以 ${max.toLocaleString('en-US')} 成交！` }
      }
      state.result = 'passed'
      state.winnerId = null
      state.finalPrice = null
      return { kind: 'passed', winnerId: null, finalPrice: null, message: '加赛回合再次并列，结果流拍，藏品无人成交。' }
    }

    return { kind: 'continue', winnerId: null, finalPrice: null, message: '' }
  },

  resolvePlayerName(state: AuctionState, id: string | null): string {
    if (!id || id === 'player') return '玩家'
    const bot = state.bots.find((b) => b.id === id)
    return bot ? bot.name : '竞拍者'
  },

  buildOutcome(state: AuctionState): AuctionOutcome {
    revealCollection(state.items)
    const realTotal = totalRealValue(state.items)
    const entryFee = state.entryFee
    const finalPrice = state.finalPrice ?? 0

    if (state.result === 'passed') {
      return {
        venueId: state.venueId,
        items: state.items,
        realTotal,
        finalPrice: 0,
        entryFee,
        winnerIsPlayer: false,
        result: 'passed',
        playerProfit: -entryFee,
        dividend: 0,
        botWinner: null,
      }
    }

    const winnerIsPlayer = state.winnerId === 'player'
    const winnerBot = winnerIsPlayer ? null : state.bots.find((b) => b.id === state.winnerId)

    let playerProfit = 0
    let dividend = 0
    if (winnerIsPlayer) {
      playerProfit = realTotal - finalPrice - entryFee
      dividend = 0
    } else {
      const botProfit = realTotal - finalPrice
      if (botProfit < 0 && winnerBot) {
        const bonusFactor = 1 + (state.helper?.dividendBonus ?? 0)
        dividend = Math.floor(Math.abs(botProfit) * 0.1 * bonusFactor)
      }
      playerProfit = dividend - entryFee
    }

    return {
      venueId: state.venueId,
      items: state.items,
      realTotal,
      finalPrice,
      entryFee,
      winnerIsPlayer,
      result: 'sold',
      playerProfit,
      dividend,
      botWinner: winnerBot ? { id: winnerBot.id, name: winnerBot.name } : null,
    }
  },
}