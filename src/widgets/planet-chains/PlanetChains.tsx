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
      { id: 'coal', color: '#3a3a3a' },
      { id: 'lava', color: '#ff4400' },
      { id: 'molten-iron', color: '#c06030' },
      { id: 'molten-copper', color: '#d08040' },
      { id: 'iron-plate', color: '#8a9bae' },
      { id: 'copper-plate', color: '#d4874e' },
      { id: 'tungsten-plate', color: '#8a9aaa' },
      { id: 'carbon', color: '#505050' },
      { id: 'tungsten-carbide', color: '#607080' },
      { id: 'acid', color: '#c0ff00' },
    ],
    recipes: [
      { from: 'lava', to: 'molten-iron' },
      { from: 'lava', to: 'molten-copper' },
      { from: 'molten-iron', to: 'iron-plate' },
      { from: 'molten-copper', to: 'copper-plate' },
      { from: 'calcite', to: 'tungsten-plate' },
      { from: 'tungsten-ore', to: 'tungsten-plate' },
      { from: 'acid', to: 'tungsten-plate' },
      { from: 'coal', to: 'carbon' },
      { from: 'tungsten-plate', to: 'tungsten-carbide' },
      { from: 'carbon', to: 'tungsten-carbide' },
    ],
    uniqueBuildings: ['foundry', 'big-mining-drill'],
  },
  {
    id: 'fulgora',
    items: [
      { id: 'scrap', color: '#8a8a6a' },
      { id: 'holmium-ore', color: '#4080c0' },
      { id: 'holmium-plate', color: '#5090d0' },
      { id: 'superconductor', color: '#60c0e0' },
      { id: 'supercapacitor', color: '#40b0d0' },
      { id: 'iron-plate', color: '#8a9bae' },
      { id: 'copper-plate', color: '#d4874e' },
      { id: 'steel-plate', color: '#b0b0b0' },
      { id: 'green-circuit', color: '#4caf50' },
      { id: 'lightning', color: '#ffff00' },
      { id: 'ice', color: '#a0d0f0' },
    ],
    recipes: [
      { from: 'scrap', to: 'iron-plate' },
      { from: 'scrap', to: 'copper-plate' },
      { from: 'scrap', to: 'steel-plate' },
      { from: 'scrap', to: 'green-circuit' },
      { from: 'scrap', to: 'holmium-ore' },
      { from: 'holmium-ore', to: 'holmium-plate' },
      { from: 'holmium-plate', to: 'superconductor' },
      { from: 'superconductor', to: 'supercapacitor' },
      { from: 'holmium-plate', to: 'supercapacitor' },
      { from: 'lightning', to: 'lightning' }, // self — lightning rod generates power
      { from: 'ice', to: 'ice' },
    ],
    uniqueBuildings: ['em-plant', 'lightning-rod', 'recycler'],
  },
  {
    id: 'gleba',
    items: [
      { id: 'yumako-seed', color: '#ff9800' },
      { id: 'jellynut-seed', color: '#e91e63' },
      { id: 'yumako-fruit', color: '#ffb040' },
      { id: 'jelly', color: '#ff4081' },
      { id: 'yumako-mash', color: '#ffc060' },
      { id: 'nutrients', color: '#8bc34a' },
      { id: 'bioflux', color: '#4caf50' },
      { id: 'biter-egg', color: '#f44336' },
      { id: 'pentapod-egg', color: '#9c27b0' },
      { id: 'spoilage', color: '#6a5a4a' },
      { id: 'ag-science', color: '#66bb6a' },
    ],
    recipes: [
      { from: 'yumako-seed', to: 'yumako-fruit' },
      { from: 'jellynut-seed', to: 'jelly' },
      { from: 'yumako-fruit', to: 'yumako-mash' },
      { from: 'yumako-mash', to: 'nutrients' },
      { from: 'jelly', to: 'nutrients' },
      { from: 'nutrients', to: 'bioflux' },
      { from: 'bioflux', to: 'ag-science' },
      { from: 'nutrients', to: 'ag-science' },
      { from: 'biter-egg', to: 'spoilage' },
      { from: 'pentapod-egg', to: 'spoilage' },
      { from: 'yumako-fruit', to: 'spoilage' },
      { from: 'jelly', to: 'spoilage' },
    ],
    uniqueBuildings: ['biochamber', 'agricultural-tower'],
  },
  {
    id: 'aquilo',
    items: [
      { id: 'ammonia', color: '#00bcd4' },
      { id: 'lithium-brine', color: '#90caf0' },
      { id: 'lithium', color: '#b0c4de' },
      { id: 'lithium-plate', color: '#c0d4ee' },
      { id: 'quantum-processor', color: '#e040ff' },
      { id: 'fusion-cell', color: '#ff6090' },
      { id: 'fusion-power', color: '#ff80a0' },
      { id: 'ice', color: '#a0d0f0' },
      { id: 'fluoroketone-cold', color: '#70b0d0' },
      { id: 'fluoroketone-hot', color: '#d07070' },
    ],
    recipes: [
      { from: 'ammonia', to: 'lithium-brine' },
      { from: 'ice', to: 'lithium-brine' },
      { from: 'lithium-brine', to: 'lithium' },
      { from: 'lithium', to: 'lithium-plate' },
      { from: 'lithium-plate', to: 'quantum-processor' },
      { from: 'quantum-processor', to: 'fusion-cell' },
      { from: 'lithium-plate', to: 'fusion-cell' },
      { from: 'fusion-cell', to: 'fusion-power' },
      { from: 'fluoroketone-cold', to: 'fluoroketone-hot' },
      { from: 'fluoroketone-hot', to: 'fluoroketone-cold' },
      { from: 'ammonia', to: 'fluoroketone-cold' },
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

const SVG_W = 680
const SVG_H = 340
const NODE_W = 90
const NODE_H = 26

export default function PlanetChains() {
  const { t } = useTranslation()
  const [planetIdx, setPlanetIdx] = useState(0)

  const planet = PLANETS[planetIdx]
  const color = PLANET_COLORS[planet.id]

  // Layout items left to right based on recipe depth
  const depths = new Map<string, number>()
  // Find source items (not produced by any recipe)
  const produced = new Set(planet.recipes.map(r => r.to))
  const sources = planet.items.filter(it => !produced.has(it.id) || planet.recipes.some(r => r.from === it.id && r.to === it.id))

  for (const s of sources) {
    if (!depths.has(s.id)) depths.set(s.id, 0)
  }
  // Also set items with no incoming recipe to depth 0
  for (const it of planet.items) {
    if (!planet.recipes.some(r => r.to === it.id && r.from !== it.id)) {
      depths.set(it.id, 0)
    }
  }

  // BFS to assign depths
  let changed = true
  let safety = 0
  while (changed && safety++ < 20) {
    changed = false
    for (const r of planet.recipes) {
      if (r.from === r.to) continue // self-loop
      const fromDepth = depths.get(r.from)
      if (fromDepth === undefined) continue
      const newDepth = fromDepth + 1
      if (!depths.has(r.to) || depths.get(r.to)! < newDepth) {
        depths.set(r.to, newDepth)
        changed = true
      }
    }
  }

  // Items not reached
  for (const it of planet.items) {
    if (!depths.has(it.id)) depths.set(it.id, 0)
  }

  const maxDepth = Math.max(...depths.values(), 1)

  // Group by depth
  const tiers = new Map<number, string[]>()
  for (const [id, depth] of depths) {
    if (!tiers.has(depth)) tiers.set(depth, [])
    tiers.get(depth)!.push(id)
  }

  // Position
  const PAD = 30
  const positions = new Map<string, { x: number; y: number }>()
  for (const [depth, ids] of tiers) {
    const x = PAD + NODE_W / 2 + (depth / maxDepth) * (SVG_W - PAD * 2 - NODE_W)
    const totalH = ids.length * (NODE_H + 10) - 10
    const startY = (SVG_H - totalH) / 2
    ids.forEach((id, i) => {
      positions.set(id, { x, y: startY + i * (NODE_H + 10) })
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
          if (r.from === r.to) return null // skip self-loops
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
                fill="#ffffffcc" fontSize={8}>{t(`planet.item.${it.id}`)}</text>
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
