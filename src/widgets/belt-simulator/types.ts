export type ItemType = 'iron-plate' | 'copper-plate' | 'iron-gear' | 'green-circuit' | 'coal'

export interface Item {
  type: ItemType
  color: string
}

export interface BeltTier {
  name: string
  color: string
  itemsPerSecond: number
  tilesPerTick: number
  slotsPerTile: number
}

export interface BeltState {
  topLane: (Item | null)[]
  bottomLane: (Item | null)[]
  tick: number
}

export const ITEMS: Record<ItemType, Item> = {
  'iron-plate': { type: 'iron-plate', color: '#8a9bae' },
  'copper-plate': { type: 'copper-plate', color: '#d4874e' },
  'iron-gear': { type: 'iron-gear', color: '#7a8a9a' },
  'green-circuit': { type: 'green-circuit', color: '#4caf50' },
  'coal': { type: 'coal', color: '#3a3a3a' },
}

export const BELT_TIERS: BeltTier[] = [
  {
    name: 'Yellow',
    color: '#e9c73e',
    itemsPerSecond: 15,
    tilesPerTick: 0.03125,
    slotsPerTile: 4.571,
  },
  {
    name: 'Red',
    color: '#e04040',
    itemsPerSecond: 30,
    tilesPerTick: 0.0625,
    slotsPerTile: 4.571,
  },
  {
    name: 'Blue',
    color: '#4080e0',
    itemsPerSecond: 45,
    tilesPerTick: 0.09375,
    slotsPerTile: 4.571,
  },
]
