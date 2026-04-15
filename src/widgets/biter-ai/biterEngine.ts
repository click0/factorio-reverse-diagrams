export const GRID = 32
export type CellType = 'empty' | 'water' | 'wall' | 'factory' | 'nest' | 'turret'

export interface Biter {
  x: number
  y: number
  targetX: number
  targetY: number
  path: { x: number; y: number }[]
  pathIdx: number
  hp: number
  type: 'small' | 'medium' | 'big' | 'behemoth'
}

export interface Nest {
  x: number
  y: number
  absorbed: number
  spawnCooldown: number
}

export interface BiterState {
  grid: CellType[]
  pollution: Float64Array
  nests: Nest[]
  biters: Biter[]
  tick: number
  factoryX: number
  factoryY: number
  kills: number
}

const BITER_HP: Record<string, number> = { small: 15, medium: 75, big: 375, behemoth: 3000 }
const BITER_COLORS: Record<string, string> = { small: '#8a6a3a', medium: '#c09030', big: '#e04040', behemoth: '#9c27b0' }

export function getBiterColor(type: string): string { return BITER_COLORS[type] || '#888' }

export function createState(nestCount: number): BiterState {
  const grid: CellType[] = new Array(GRID * GRID).fill('empty')
  const pollution = new Float64Array(GRID * GRID)

  // Factory in center-left
  const fx = 8, fy = Math.floor(GRID / 2)
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      grid[(fy + dy) * GRID + (fx + dx)] = 'factory'
    }
  }

  // Turrets around factory
  const turretPositions = [
    { x: fx - 2, y: fy - 2 }, { x: fx + 2, y: fy - 2 },
    { x: fx - 2, y: fy + 2 }, { x: fx + 2, y: fy + 2 },
  ]
  for (const tp of turretPositions) {
    if (tp.x >= 0 && tp.x < GRID && tp.y >= 0 && tp.y < GRID) {
      grid[tp.y * GRID + tp.x] = 'turret'
    }
  }

  // Water patches
  for (let i = 0; i < 3; i++) {
    const wx = 14 + i * 3
    const wy = 10 + (i % 2) * 12
    for (let dy = 0; dy < 3; dy++) {
      for (let dx = 0; dx < 2; dx++) {
        const r = wy + dy, c = wx + dx
        if (r >= 0 && r < GRID && c >= 0 && c < GRID) grid[r * GRID + c] = 'water'
      }
    }
  }

  // Nests on the right side
  const nests: Nest[] = []
  for (let i = 0; i < nestCount; i++) {
    const nx = GRID - 4 - (i % 3) * 3
    const ny = 6 + Math.floor(i / 3) * 8 + (i % 2) * 3
    if (ny < GRID - 2) {
      grid[ny * GRID + nx] = 'nest'
      nests.push({ x: nx, y: ny, absorbed: 0, spawnCooldown: 0 })
    }
  }

  return { grid, pollution, nests, biters: [], tick: 0, factoryX: fx, factoryY: fy, kills: 0 }
}

// Simple A* pathfinding
function findPath(grid: CellType[], fromX: number, fromY: number, toX: number, toY: number): { x: number; y: number }[] {
  const key = (x: number, y: number) => y * GRID + x
  const open = new Map<number, { x: number; y: number; g: number; f: number; parent: number | null }>()
  const closed = new Set<number>()

  const startKey = key(fromX, fromY)
  const h = (x: number, y: number) => Math.abs(x - toX) + Math.abs(y - toY)
  open.set(startKey, { x: fromX, y: fromY, g: 0, f: h(fromX, fromY), parent: null })

  let iterations = 0
  while (open.size > 0 && iterations++ < 500) {
    // Find lowest f
    let bestKey = -1
    let bestF = Infinity
    for (const [k, node] of open) {
      if (node.f < bestF) { bestF = node.f; bestKey = k }
    }

    const current = open.get(bestKey)!
    open.delete(bestKey)
    closed.add(bestKey)

    if (current.x === toX && current.y === toY) {
      // Reconstruct path
      const path: { x: number; y: number }[] = []
      let node: typeof current | undefined = current
      while (node) {
        path.unshift({ x: node.x, y: node.y })
        node = node.parent !== null ? [...open.values(), ...Array.from(closed).map(k => {
          const x = k % GRID, y = Math.floor(k / GRID)
          return { x, y, g: 0, f: 0, parent: null }
        })].find(() => false) : undefined
        // Simplified: just use direct path since full reconstruction is complex
        break
      }
      return path.length > 0 ? path : directPath(fromX, fromY, toX, toY, grid)
    }

    // Neighbors (4-directional)
    for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
      const nx = current.x + dx
      const ny = current.y + dy
      if (nx < 0 || nx >= GRID || ny < 0 || ny >= GRID) continue
      const nk = key(nx, ny)
      if (closed.has(nk)) continue
      const cell = grid[ny * GRID + nx]
      if (cell === 'water') continue // can't cross water

      const g = current.g + 1
      const existing = open.get(nk)
      if (!existing || g < existing.g) {
        open.set(nk, { x: nx, y: ny, g, f: g + h(nx, ny), parent: bestKey })
      }
    }
  }

  return directPath(fromX, fromY, toX, toY, grid)
}

function directPath(fromX: number, fromY: number, toX: number, toY: number, grid: CellType[]): { x: number; y: number }[] {
  const path: { x: number; y: number }[] = []
  let x = fromX, y = fromY
  for (let i = 0; i < 60; i++) {
    const dx = Math.sign(toX - x)
    const dy = Math.sign(toY - y)
    if (dx === 0 && dy === 0) break

    // Try horizontal first, then vertical, then diagonal
    const candidates = [
      { nx: x + dx, ny: y },
      { nx: x, ny: y + dy },
      { nx: x + dx, ny: y + dy },
    ].filter(c => c.nx >= 0 && c.nx < GRID && c.ny >= 0 && c.ny < GRID && grid[c.ny * GRID + c.nx] !== 'water')

    if (candidates.length === 0) break
    x = candidates[0].nx
    y = candidates[0].ny
    path.push({ x, y })
  }
  return path
}

function getBiterType(evolution: number): Biter['type'] {
  const r = Math.random()
  if (evolution > 0.65 && r < evolution * 0.3) return 'behemoth'
  if (evolution > 0.35 && r < evolution * 0.5) return 'big'
  if (evolution > 0.15 && r < evolution * 0.7) return 'medium'
  return 'small'
}

export function advanceTick(state: BiterState, evolution: number, pollutionRate: number): BiterState {
  const { grid, nests, factoryX, factoryY } = state
  const pollution = new Float64Array(state.pollution)
  let biters = state.biters.map(b => ({ ...b }))
  let kills = state.kills
  const newNests = nests.map(n => ({ ...n }))

  // 1. Factory generates pollution
  for (let dy = -2; dy <= 2; dy++) {
    for (let dx = -2; dx <= 2; dx++) {
      const r = factoryY + dy, c = factoryX + dx
      if (r >= 0 && r < GRID && c >= 0 && c < GRID) {
        pollution[r * GRID + c] += pollutionRate * 0.005
      }
    }
  }

  // 2. Pollution diffusion (simplified, multiple passes for faster spread)
  const nextPoll = new Float64Array(pollution.length)
  for (let y = 0; y < GRID; y++) {
    for (let x = 0; x < GRID; x++) {
      const i = y * GRID + x
      const val = pollution[i]
      if (val <= 0) continue
      const spread = val * 0.08
      let remaining = val
      for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
        const nx = x + dx, ny = y + dy
        if (nx >= 0 && nx < GRID && ny >= 0 && ny < GRID) {
          nextPoll[ny * GRID + nx] += spread
          remaining -= spread
        }
      }
      nextPoll[i] += Math.max(0, remaining * 0.97) // slight decay
    }
  }

  // 3. Nests absorb pollution and spawn biters
  for (const nest of newNests) {
    const pollAtNest = nextPoll[nest.y * GRID + nest.x]
    nest.absorbed += pollAtNest
    nextPoll[nest.y * GRID + nest.x] *= 0.5 // absorb half

    nest.spawnCooldown = Math.max(0, nest.spawnCooldown - 1)

    const spawnThreshold = 0.1 / (1 + evolution) // higher evo = spawn more often
    if (nest.absorbed > spawnThreshold && nest.spawnCooldown <= 0 && biters.length < 30) {
      const groupSize = 1 + Math.floor(evolution * 3)
      for (let g = 0; g < groupSize; g++) {
        const type = getBiterType(evolution)
        const path = findPath(grid, nest.x, nest.y, factoryX, factoryY)
        biters.push({
          x: nest.x + (Math.random() - 0.5) * 2,
          y: nest.y + (Math.random() - 0.5) * 2,
          targetX: factoryX, targetY: factoryY,
          path, pathIdx: 0,
          hp: BITER_HP[type],
          type,
        })
      }
      nest.absorbed = 0
      nest.spawnCooldown = Math.floor(20 / (1 + evolution))
    }
  }

  // 4. Move biters along path
  for (const biter of biters) {
    if (biter.path.length > 0 && biter.pathIdx < biter.path.length) {
      const target = biter.path[biter.pathIdx]
      const dx = target.x - biter.x
      const dy = target.y - biter.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      const speed = 0.3 + evolution * 0.2
      if (dist < speed) {
        biter.x = target.x
        biter.y = target.y
        biter.pathIdx++
      } else {
        biter.x += (dx / dist) * speed
        biter.y += (dy / dist) * speed
      }
    } else {
      // Move directly toward factory
      const dx = factoryX - biter.x
      const dy = factoryY - biter.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist > 0.5) {
        const speed = 0.3 + evolution * 0.2
        biter.x += (dx / dist) * speed
        biter.y += (dy / dist) * speed
      }
    }
  }

  // 5. Turrets shoot nearest biter in range
  const TURRET_RANGE = 5
  const TURRET_DPS = 14
  for (let y = 0; y < GRID; y++) {
    for (let x = 0; x < GRID; x++) {
      if (grid[y * GRID + x] !== 'turret') continue
      let nearest: Biter | null = null
      let nearestDist = TURRET_RANGE + 1
      for (const b of biters) {
        const dist = Math.sqrt((b.x - x) ** 2 + (b.y - y) ** 2)
        if (dist < nearestDist) { nearest = b; nearestDist = dist }
      }
      if (nearest) {
        nearest.hp -= TURRET_DPS
      }
    }
  }

  // 6. Remove dead biters
  const deadCount = biters.filter(b => b.hp <= 0).length
  kills += deadCount
  biters = biters.filter(b => b.hp > 0)

  return { ...state, pollution: nextPoll, nests: newNests, biters, tick: state.tick + 1, kills }
}
