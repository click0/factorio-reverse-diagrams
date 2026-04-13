import { useState } from 'react'
import { useTranslation } from 'react-i18next'

interface PlanetResource {
  id: string
  items: { id: string; color: string }[]
  recipes: { from: string; to: string }[]
  uniqueBuildings: string[]
}

const PLANETS: PlanetResource[] = [
  {
    id: 'vulcanus',
    items: [
      { id: 'calcite', color: '#e0d0b0' },
      { id: 'tungsten-ore', color: '#708090' },
      { id: 'tungsten-plate', color: '#8a9aaa' },
      { id: 'lava', color: '#ff4400' },
      { id: 'molten-iron', color: '#c06030' },
      { id: 'molten-copper', color: '#d08040' },
    ],
    recipes: [
      { from: 'lava', to: 'molten-iron' },
      { from: 'lava', to: 'molten-copper' },
      { from: 'calcite', to: 'tungsten-plate' },
      { from: 'tungsten-ore', to: 'tungsten-plate' },
      { from: 'molten-iron', to: 'iron-plate' },
      { from: 'molten-copper', to: 'copper-plate' },
    ],
    uniqueBuildings: ['foundry', 'big-mining-drill'],
  },
  {
    id: 'fulgora',
    items: [
      { id: 'scrap', color: '#8a8a6a' },
      { id: 'holmium-ore', color: '#4080c0' },
      { id: 'holmium-plate', color: '#5090d0' },
      { id: 'lightning', color: '#ffff00' },
      { id: 'superconductor', color: '#60c0e0' },
    ],
    recipes: [
      { from: 'scrap', to: 'holmium-ore' },
      { from: 'scrap', to: 'iron-plate' },
      { from: 'scrap', to: 'copper-plate' },
      { from: 'holmium-ore', to: 'holmium-plate' },
      { from: 'holmium-plate', to: 'superconductor' },
    ],
    uniqueBuildings: ['em-plant', 'lightning-rod', 'recycler'],
  },
  {
    id: 'gleba',
    items: [
      { id: 'yumako-seed', color: '#ff9800' },
      { id: 'jellynut-seed', color: '#e91e63' },
      { id: 'nutrients', color: '#8bc34a' },
      { id: 'bioflux', color: '#4caf50' },
      { id: 'biter-egg', color: '#f44336' },
      { id: 'pentapod-egg', color: '#9c27b0' },
    ],
    recipes: [
      { from: 'yumako-seed', to: 'nutrients' },
      { from: 'jellynut-seed', to: 'nutrients' },
      { from: 'nutrients', to: 'bioflux' },
      { from: 'biter-egg', to: 'small-biter' },
      { from: 'pentapod-egg', to: 'small-pentapod' },
    ],
    uniqueBuildings: ['biochamber', 'agricultural-tower'],
  },
  {
    id: 'aquilo',
    items: [
      { id: 'ammonia', color: '#00bcd4' },
      { id: 'lithium', color: '#b0c4de' },
      { id: 'lithium-plate', color: '#c0d4ee' },
      { id: 'quantum-processor', color: '#e040ff' },
      { id: 'fusion-cell', color: '#ff6090' },
    ],
    recipes: [
      { from: 'ammonia', to: 'lithium' },
      { from: 'lithium', to: 'lithium-plate' },
      { from: 'lithium-plate', to: 'quantum-processor' },
      { from: 'quantum-processor', to: 'fusion-cell' },
    ],
    uniqueBuildings: ['cryogenic-plant', 'fusion-reactor', 'heating-tower'],
  },
]

const PLANET_COLORS: Record<string, string> = {
  vulcanus: '#ff5722',
  fulgora: '#2196f3',
  gleba: '#8bc34a',
  aquilo: '#00bcd4',
}

const SVG_W = 650
const SVG_H = 260
const NODE_W = 80
const NODE_H = 26

export default function PlanetChains() {
  const { t } = useTranslation()
  const [planetIdx, setPlanetIdx] = useState(0)

  const planet = PLANETS[planetIdx]
  const color = PLANET_COLORS[planet.id]

  // Layout items left to right based on recipe depth
  const depths = new Map<string, number>()
  const queue = planet.items.filter(it => !planet.recipes.some(r => r.to === it.id)).map(it => it.id)
  queue.forEach(id => depths.set(id, 0))
  let maxDepth = 0

  let safety = 0
  while (queue.length && safety++ < 100) {
    const cur = queue.shift()!
    const curDepth = depths.get(cur) || 0
    for (const r of planet.recipes) {
      if (r.from === cur) {
        const newDepth = curDepth + 1
        if (!depths.has(r.to) || depths.get(r.to)! < newDepth) {
          depths.set(r.to, newDepth)
          maxDepth = Math.max(maxDepth, newDepth)
          queue.push(r.to)
        }
      }
    }
  }

  // Position by depth
  const tiers = new Map<number, string[]>()
  for (const [id, depth] of depths) {
    if (!tiers.has(depth)) tiers.set(depth, [])
    tiers.get(depth)!.push(id)
  }
  // Items not in any recipe
  for (const it of planet.items) {
    if (!depths.has(it.id)) {
      if (!tiers.has(0)) tiers.set(0, [])
      tiers.get(0)!.push(it.id)
      depths.set(it.id, 0)
    }
  }

  const positions = new Map<string, { x: number; y: number }>()
  for (const [depth, ids] of tiers) {
    const x = 40 + (depth / Math.max(1, maxDepth)) * (SVG_W - 80)
    ids.forEach((id, i) => {
      const y = 40 + i * (NODE_H + 14)
      positions.set(id, { x, y })
    })
  }

  const itemMap = new Map(planet.items.map(it => [it.id, it]))

  return (
    <div>
      <div className="controls-row">
        {PLANETS.map((p, i) => (
          <button key={p.id} className={`btn ${i === planetIdx ? 'active' : ''}`}
            style={i === planetIdx ? { borderColor: PLANET_COLORS[p.id], color: PLANET_COLORS[p.id] } : {}}
            onClick={() => setPlanetIdx(i)}>
            {t(`surface.${p.id}`)}
          </button>
        ))}
      </div>

      <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} style={{ width: '100%', maxWidth: SVG_W, background: '#0d1117', borderRadius: 4, marginTop: 8 }}>
        <defs>
          <marker id="planet-arrow" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill={color + '80'} />
          </marker>
        </defs>

        {/* Recipe edges */}
        {planet.recipes.map((r, i) => {
          const from = positions.get(r.from)
          const to = positions.get(r.to)
          if (!from || !to) return null
          return (
            <line key={i} x1={from.x + NODE_W / 2 + 2} y1={from.y + NODE_H / 2}
              x2={to.x - NODE_W / 2 - 6} y2={to.y + NODE_H / 2}
              stroke={color + '50'} strokeWidth={1.5} markerEnd="url(#planet-arrow)" />
          )
        })}

        {/* Item nodes */}
        {planet.items.map(it => {
          const pos = positions.get(it.id)
          if (!pos) return null
          return (
            <g key={it.id}>
              <rect x={pos.x - NODE_W / 2} y={pos.y} width={NODE_W} height={NODE_H} rx={4}
                fill={it.color + '20'} stroke={it.color + '80'} strokeWidth={1} />
              <text x={pos.x} y={pos.y + NODE_H / 2 + 4} textAnchor="middle"
                fill="#ffffffcc" fontSize={9}>{t(`planet.item.${it.id}`)}</text>
            </g>
          )
        })}
      </svg>

      {/* Unique buildings */}
      <div style={{ marginTop: 10, fontSize: 12, color: 'var(--text-secondary)' }}>
        <strong style={{ color }}>{t('planet.uniqueBuildings')}:</strong>{' '}
        {planet.uniqueBuildings.map(b => t(`planet.building.${b}`)).join(', ')}
      </div>
    </div>
  )
}
