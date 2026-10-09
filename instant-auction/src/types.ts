export type Quality = 'gray' | 'blue' | 'purple' | 'gold' | 'red'
export type VenueId = 'shell' | 'coral' | 'pearl'
export type RevealType = 'outline' | 'quality' | 'full' | 'value' | 'size' | 'low'
export type Personality = 'conservative' | 'estimated' | 'aggressive' | 'dividend'

export interface CollectionItem {
  id: string
  name: string
  quality: Quality
  realValue: number
  size: [number, number]
  revealed: {
    outline: boolean
    quality: boolean
    name: boolean
    value: boolean
    size: boolean
    valueEstimate: number | null
  }
}

export interface Venue {
  id: VenueId
  name: string
  desc: string
  assetRequirement: number
  entryFee: number
  rarityWeight: Record<Quality, number>
  itemCount: [number, number]
}

export interface Helper {
  id: string
  name: string
  title: string
  desc: string
  revealType: RevealType
  revealCount: number
  revealRound: number
  dividendBonus: number
}

export interface Instrument {
  id: string
  name: string
  type: RevealType
  price: number
  desc: string
}

export interface BidRecord {
  playerId: string
  price: number
  active: boolean
}

export interface AuctionRound {
  round: number
  bids: BidRecord[]
  publicInfo: string[]
}

export interface BotProfile {
  id: string
  name: string
  personality: Personality
  capital: number
  valuation: number
  lastBid: number
  active: boolean
  dividendSkip: () => boolean
}

export interface AuctionState {
  venueId: VenueId
  items: CollectionItem[]
  helper: Helper | null
  instruments: Instrument[]
  activeInstrumentIds: string[]
  rounds: AuctionRound[]
  currentRound: number
  activePlayers: string[]
  standing: Record<string, number>
  playerLastBid: number
  playerPassed: boolean
  bots: BotProfile[]
  winnerId: string | null
  finalPrice: number | null
  result: 'pending' | 'sold' | 'passed'
  buyoutTriggered: boolean
  logs: string[]
  entryFee: number
}

export interface AuctionOutcome {
  venueId: VenueId
  items: CollectionItem[]
  realTotal: number
  finalPrice: number
  entryFee: number
  winnerIsPlayer: boolean
  result: 'sold' | 'passed'
  playerProfit: number
  dividend: number
  botWinner: { id: string; name: string } | null
}

export interface AuctionHistoryRecord {
  id: string
  venueId: VenueId
  venueName: string
  date: string
  itemsCount: number
  realTotal: number
  finalPrice: number
  result: 'win' | 'pass' | 'botWin'
  playerProfit: number
  dividend: number
  entryFee: number
}

export interface PlayerAsset {
  currency: number
  totalProfit: number
  bestSingleProfit: number
  inventory: CollectionItem[]
  exhibition: CollectionItem[]
  lowDailyCount: number
  lastLowDate: string
  wins: number
  games: number
  instruments: Instrument[]
}

export interface SeasonStats {
  cycleDays: number
  startAt: string
  profitRank: { name: string; profit: number }[]
}

export interface SaveData {
  player: PlayerAsset
  history: AuctionHistoryRecord[]
  season: SeasonStats
  collectionBook: Record<string, unknown>
}