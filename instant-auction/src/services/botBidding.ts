import type { BotProfile, CollectionItem, Personality } from '../types'
import { randInt } from '../utils/format'

interface PersonalityParams {
  riskFactor: number
  foldCeil: number
  jumpChance: number
  jumpAmount: number
  skipChance: number
}

const PERSONA: Record<Personality, PersonalityParams> = {
  conservative: { riskFactor: 0.55, foldCeil: 0.7, jumpChance: 0.15, jumpAmount: 0.2, skipChance: 0.05 },
  estimated: { riskFactor: 0.85, foldCeil: 1.0, jumpChance: 0.28, jumpAmount: 0.32, skipChance: 0.05 },
  aggressive: { riskFactor: 1.1, foldCeil: 1.16, jumpChance: 0.6, jumpAmount: 0.5, skipChance: 0 },
  dividend: { riskFactor: 0.6, foldCeil: 0.78, jumpChance: 0.1, jumpAmount: 0.2, skipChance: 0.3 },
}

const PERSONA_NAME: Record<Personality, string> = {
  conservative: '封闭式/商贾',
  estimated: '法眼·估价师',
  aggressive: '狂飙·抬价客',
  dividend: '红利·渔翁',
}

const BOT_NAMES = ['赵掌柜', '钱庄主', '孙藏家', '李买手', '周商贾', '吴行首', '郑大亨', '王拍师']

const CONVICTION = [0.42, 0.54, 0.66, 0.78, 0.9, 0.99]

function roundTo(v: number): number {
  return Math.round(v / 50000) * 50000
}

export function totalRealValue(items: CollectionItem[]): number {
  return items.reduce((s, it) => s + it.realValue, 0)
}

export function createBots(items: CollectionItem[], personalityPool: Personality[]): BotProfile[] {
  const totalReal = totalRealValue(items)
  const names = BOT_NAMES.slice()
  const profiles: BotProfile[] = []
  personalityPool.forEach((p, i) => {
    const num = names[i % names.length] ?? BOT_NAMES[0]
    const cap = randInt(2000000, 4000000)
    const valuationNoise = totalReal * (0.72 + Math.random() * 0.56)
    const valuation = Math.max(100000, valuationNoise)
    profiles.push({
      id: `bot-${i}-${Date.now()}`,
      name: `${num}（${PERSONA_NAME[p]}）`,
      personality: p,
      capital: cap,
      valuation,
      lastBid: 0,
      active: true,
      dividendSkip: () => Math.random() < PERSONA[p].skipChance,
    })
  })
  return profiles
}

export function decideBotBid(bot: BotProfile, round: number, currentMax: number): number | null {
  if (!bot.active) return null
  const params = PERSONA[bot.personality]

  if (bot.personality === 'dividend' && bot.dividendSkip() && bot.lastBid <= currentMax * 0.5) {
    bot.active = false
    return null
  }

  const conviction = CONVICTION[round - 1] ?? 0.99
  const willing = Math.min(
    bot.valuation * conviction * params.riskFactor,
    bot.capital * 0.92,
  )
  const step = Math.max(50000, Math.round(currentMax * 0.1))

  const holdingFloor = params.foldCeil
  const capLimit = currentMax

  if (bot.lastBid > 0 && capLimit === bot.lastBid) {
    return bot.lastBid
  }

  if (currentMax >= willing && currentMax >= holdingFloor * bot.valuation) {
    return null
  }

  if (willing <= currentMax) {
    return null
  }

  let bid = currentMax + step
  if (Math.random() < params.jumpChance) {
    const jumpBid = Math.round(willing * (0.96 - Math.random() * 0.1))
    if (jumpBid > bid) bid = jumpBid
  }
  bid = Math.min(bid, willing, bot.capital * 0.92)
  if (bid <= currentMax) return null
  const rounded = roundTo(bid)
  bot.lastBid = rounded
  return rounded
}

export function dropBot(bot: BotProfile): void {
  bot.active = false
}