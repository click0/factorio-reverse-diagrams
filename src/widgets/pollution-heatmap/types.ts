export type TileType = 'grass' | 'forest' | 'water' | 'concrete'

export interface EntityDef {
  name: string
  pollutionPerMinute: number
  color: string
}

export interface PlacedEntity {
  entityIdx: number
  row: number
  col: number
}

export interface PollutionState {
  grid: Float64Array
  tiles: TileType[]
  width: number
  height: number
  entities: PlacedEntity[]
  tick: number
}

export const TILE_ABSORPTION: Record<TileType, number> = {
  grass: 0.0001,
  forest: 0.002,
  water: 0.001,
  concrete: 0,
}

export const TILE_COLORS: Record<TileType, string> = {
  grass: '#1a3a1a',
  forest: '#0d4a0d',
  water: '#0d2a4a',
  concrete: '#3a3a3a',
}

export const ENTITIES: EntityDef[] = [
  { name: 'Boiler', pollutionPerMinute: 30, color: '#ff6b35' },
  { name: 'Steam Engine', pollutionPerMinute: 9, color: '#ffa040' },
  { name: 'Assembler', pollutionPerMinute: 4, color: '#4080e0' },
  { name: 'Mining Drill', pollutionPerMinute: 10, color: '#c0a040' },
  { name: 'Furnace', pollutionPerMinute: 4, color: '#e04040' },
]

export const DIFFUSION_RATE = 0.02
