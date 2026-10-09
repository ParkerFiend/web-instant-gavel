import type { CollectionItem, VenueId } from '../types'
import { NAME_POOL, QUALITY_META, VENUES } from '../data/config'
import { pickWeighted, randInt, shuffle, uid } from '../utils/format'

function mkItem(quality: keyof typeof QUALITY_META): CollectionItem {
  const [min, max] = QUALITY_META[quality].valueRange
  const realValue = randInt(min, max)
  const names = NAME_POOL[quality]
  const name = names[randInt(0, names.length - 1)]
  const w = randInt(1, 2)
  const h = randInt(1, 2)
  return {
    id: uid('item-'),
    name,
    quality: quality as CollectionItem['quality'],
    realValue,
    size: [w, h],
    revealed: {
      outline: false,
      quality: false,
      name: false,
      value: false,
      size: false,
      valueEstimate: null,
    },
  }
}

export const collectionGenerator = {
  generate(venueId: VenueId): CollectionItem[] {
    const venue = VENUES.find((v) => v.id === venueId)!
    const [min, max] = venue.itemCount
    const count = randInt(min, max)
    const items: CollectionItem[] = []
    for (let i = 0; i < count; i++) {
      items.push(mkItem(pickWeighted(venue.rarityWeight) as keyof typeof QUALITY_META))
    }
    return items
  },

  qualityOf(item: CollectionItem): CollectionItem['quality'] {
    return item.quality
  },
}

export function hiddenItems(items: CollectionItem[]): number {
  return items.filter((i) => !i.revealed.name).length
}

export function revealedItems(items: CollectionItem[]): CollectionItem[] {
  return items.filter((i) => i.revealed.name || i.revealed.value)
}

export function shuffleItems(count: number): number[] {
  return shuffle(Array.from({ length: count }, (_, i) => i))
}

export function revealCollection(items: CollectionItem[]): void {
  for (const item of items) {
    item.revealed.name = true
    item.revealed.outline = true
    item.revealed.quality = true
    item.revealed.value = true
    item.revealed.size = true
    item.revealed.valueEstimate = item.realValue
  }
}