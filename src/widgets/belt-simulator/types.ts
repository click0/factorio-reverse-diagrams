export type ItemType = 'iron-plate' | 'copper-plate' | 'iron-gear' | 'green-circuit' | 'coal'

export interface Item {
  type: ItemType
  color: string
}

export interface BeltTier {
  id: string
  color: string
  itemsPerSecond: number
  tilesPerTick: number
  slotsPerTile: number
}

export type Scenario = 'straight' | 'sideload' | 'splitter'

export interface SplitterConfig {
  inputPriority: 'none' | 'left' | 'right'
  outputPriority: 'none' | 'left' | 'right'
}

export interface BeltState {
  topLane: (Item | null)[]
  bottomLane: (Item | null)[]
  /** Side-load: perpendicular belt feeding into the main belt */
  sideInput: (Item | null)[]
  /** Splitter: second output belt top lane */
  splitOutTopA: (Item | null)[]
  splitOutBottomA: (Item | null)[]
  splitOutTopB: (Item | null)[]
  splitOutBottomB: (Item | null)[]
  splitterToggle: boolean
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
  { id: 'yellow', color: '#e9c73e', itemsPerSecond: 15, tilesPerTick: 0.03125, slotsPerTile: 4.571 },
  { id: 'red', color: '#e04040', itemsPerSecond: 30, tilesPerTick: 0.0625, slotsPerTile: 4.571 },
  { id: 'blue', color: '#4080e0', itemsPerSecond: 45, tilesPerTick: 0.09375, slotsPerTile: 4.571 },
  { id: 'turbo', color: '#40e080', itemsPerSecond: 90, tilesPerTick: 0.1875, slotsPerTile: 4.571 },
]
