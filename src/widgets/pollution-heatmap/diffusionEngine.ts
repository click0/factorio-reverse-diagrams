import { type PollutionState, type TileType, type PlacedEntity, TILE_ABSORPTION, ENTITIES, DIFFUSION_RATE } from './types'

export function createState(w: number, h: number): PollutionState {
  const grid = new Float64Array(w * h)
  const tiles: TileType[] = new Array(w * h)

  // Default: grass everywhere, some forest patches, some water
  for (let r = 0; r < h; r++) {
    for (let c = 0; c < w; c++) {
      const i = r * w + c
      // Forest ring around edges
      if (r < 3 || r >= h - 3 || c < 3 || c >= w - 3) {
        tiles[i] = 'forest'
      } else if ((r === Math.floor(h / 2) && c > w * 0.6) || (c === Math.floor(w * 0.7) && r > h * 0.5)) {
        tiles[i] = 'water'
      } else {
        tiles[i] = 'grass'
      }
    }
  }

  // Default entities: small factory in center
  const cx = Math.floor(w / 2)
  const cy = Math.floor(h / 2)
  const entities: PlacedEntity[] = [
    { entityIdx: 0, row: cy, col: cx }, // Boiler
    { entityIdx: 1, row: cy, col: cx + 1 }, // Steam Engine
    { entityIdx: 2, row: cy - 1, col: cx }, // Assembler
    { entityIdx: 3, row: cy + 1, col: cx - 1 }, // Mining Drill
  ]

  return { grid, tiles, width: w, height: h, entities, tick: 0 }
}

export function advanceTick(state: PollutionState): PollutionState {
  const { grid, tiles, width: w, height: h, entities } = state
  const next = new Float64Array(grid.length)

  // 1. Copy + diffusion
  for (let r = 0; r < h; r++) {
    for (let c = 0; c < w; c++) {
      const i = r * w + c
      const val = grid[i]
      if (val <= 0) continue

      const spread = val * DIFFUSION_RATE
      let remaining = val

      // Spread to 4 neighbors
      const neighbors = [
        r > 0 ? (r - 1) * w + c : -1,
        r < h - 1 ? (r + 1) * w + c : -1,
        c > 0 ? r * w + (c - 1) : -1,
        c < w - 1 ? r * w + (c + 1) : -1,
      ]

      for (const ni of neighbors) {
        if (ni >= 0) {
          next[ni] += spread
          remaining -= spread
        }
      }

      next[i] += Math.max(0, remaining)
    }
  }

  // 2. Absorption by tile type
  for (let i = 0; i < next.length; i++) {
    const abs = TILE_ABSORPTION[tiles[i]]
    next[i] = Math.max(0, next[i] - next[i] * abs)
  }

  // 3. Entity pollution generation
  for (const e of entities) {
    const i = e.row * w + e.col
    next[i] += ENTITIES[e.entityIdx].pollutionPerMinute / 3600 // per-tick approximation
  }

  return { ...state, grid: next, tick: state.tick + 1 }
}

export function toggleTile(state: PollutionState, row: number, col: number, tile: TileType): PollutionState {
  const tiles = [...state.tiles]
  tiles[row * state.width + col] = tile
  return { ...state, tiles }
}

export function addEntity(state: PollutionState, entityIdx: number, row: number, col: number): PollutionState {
  return { ...state, entities: [...state.entities, { entityIdx, row, col }] }
}

export function removeEntity(state: PollutionState, row: number, col: number): PollutionState {
  return { ...state, entities: state.entities.filter(e => !(e.row === row && e.col === col)) }
}
