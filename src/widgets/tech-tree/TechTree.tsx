import { useState, useMemo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'

interface Technology {
  id: string
  tier: number
  prerequisites: string[]
  sciencePacks: string[]
  cost: number
}

const TECHS: Technology[] = [
  { id: 'automation', tier: 0, prerequisites: [], sciencePacks: ['automation'], cost: 10 },
  { id: 'logistics', tier: 0, prerequisites: [], sciencePacks: ['automation'], cost: 20 },
  { id: 'electronics', tier: 0, prerequisites: [], sciencePacks: ['automation'], cost: 30 },
  { id: 'steel-processing', tier: 1, prerequisites: [], sciencePacks: ['automation', 'logistic'], cost: 50 },
  { id: 'military', tier: 1, prerequisites: [], sciencePacks: ['automation', 'logistic'], cost: 50 },
  { id: 'oil-processing', tier: 1, prerequisites: ['electronics'], sciencePacks: ['automation', 'logistic'], cost: 75 },
  { id: 'advanced-electronics', tier: 2, prerequisites: ['electronics', 'oil-processing'], sciencePacks: ['automation', 'logistic', 'chemical'], cost: 100 },
  { id: 'modules', tier: 2, prerequisites: ['advanced-electronics'], sciencePacks: ['automation', 'logistic', 'chemical'], cost: 100 },
  { id: 'robotics', tier: 2, prerequisites: ['advanced-electronics', 'steel-processing'], sciencePacks: ['automation', 'logistic', 'chemical'], cost: 150 },
  { id: 'nuclear-power', tier: 3, prerequisites: ['oil-processing', 'steel-processing'], sciencePacks: ['automation', 'logistic', 'chemical'], cost: 200 },
  { id: 'logistics-3', tier: 3, prerequisites: ['robotics', 'modules'], sciencePacks: ['automation', 'logistic', 'chemical', 'production'], cost: 300 },
  { id: 'rocket-silo', tier: 4, prerequisites: ['advanced-electronics', 'robotics', 'nuclear-power'], sciencePacks: ['automation', 'logistic', 'chemical', 'production', 'utility'], cost: 1000 },
  { id: 'space-science', tier: 5, prerequisites: ['rocket-silo'], sciencePacks: ['automation', 'logistic', 'chemical', 'production', 'utility', 'space'], cost: 2000 },
  { id: 'spidertron', tier: 4, prerequisites: ['robotics', 'nuclear-power', 'military'], sciencePacks: ['automation', 'logistic', 'chemical', 'production', 'utility', 'military'], cost: 500 },
]

const TIER_COLORS = ['#4caf50', '#2196f3', '#9c27b0', '#ff9800', '#f44336', '#e91e63']
const SVG_W = 760
const SVG_H = 380
const NODE_W = 100
const NODE_H = 30
const TIER_GAP = 130

function layoutTechs(techs: Technology[]) {
  const tiers = new Map<number, Technology[]>()
  for (const tech of techs) {
    if (!tiers.has(tech.tier)) tiers.set(tech.tier, [])
    tiers.get(tech.tier)!.push(tech)
  }

  const positions = new Map<string, { x: number; y: number }>()
  for (const [tier, list] of tiers) {
    const x = 50 + tier * TIER_GAP
    const startY = (SVG_H - list.length * (NODE_H + 16)) / 2
    list.forEach((tech, i) => {
      positions.set(tech.id, { x, y: startY + i * (NODE_H + 16) })
    })
  }
  return positions
}

export default function TechTree() {
  const { t } = useTranslation()
  const [selected, setSelected] = useState<string | null>(null)
  const [searchFilter, setSearchFilter] = useState('')

  const positions = useMemo(() => layoutTechs(TECHS), [])

  const getUpstream = useCallback((techId: string): Set<string> => {
    const set = new Set<string>()
    const queue = [techId]
    while (queue.length) {
      const cur = queue.pop()!
      const tech = TECHS.find(t => t.id === cur)
      if (!tech) continue
      for (const pre of tech.prerequisites) {
        if (!set.has(pre)) { set.add(pre); queue.push(pre) }
      }
    }
    return set
  }, [])

  const upstream = selected ? getUpstream(selected) : null
  const selectedTech = TECHS.find(t => t.id === selected)
  const lowerFilter = searchFilter.toLowerCase()

  return (
    <div>
      <div className="controls-row">
        <div className="control-group">
          <label>{t('tech.search')}:</label>
          <input type="text" value={searchFilter} onChange={(e) => setSearchFilter(e.target.value)}
            placeholder={t('tech.filterPlaceholder')}
            style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 4, padding: '4px 8px', fontSize: 13, width: 180 }} />
        </div>
        {selected && <button className="btn" onClick={() => setSelected(null)}>{t('recipe.clearHighlight')}</button>}
      </div>

      <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} style={{ width: '100%', maxWidth: SVG_W, background: '#0d1117', borderRadius: 4, marginTop: 8 }}>
        <defs>
          <marker id="tech-arrow" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="#ffffff40" />
          </marker>
        </defs>

        {/* Edges */}
        {TECHS.map(tech => tech.prerequisites.map(pre => {
          const from = positions.get(pre)
          const to = positions.get(tech.id)
          if (!from || !to) return null
          const isHL = upstream && (upstream.has(pre) || pre === selected) && (upstream.has(tech.id) || tech.id === selected)
          return (
            <line key={`${pre}-${tech.id}`}
              x1={from.x + NODE_W / 2 + 2} y1={from.y + NODE_H / 2}
              x2={to.x - NODE_W / 2 - 6} y2={to.y + NODE_H / 2}
              stroke={isHL ? '#e9a820' : '#ffffff20'} strokeWidth={isHL ? 2 : 1}
              markerEnd="url(#tech-arrow)" />
          )
        }))}

        {/* Nodes */}
        {TECHS.map(tech => {
          const pos = positions.get(tech.id)!
          const isHL = selected === tech.id
          const isUpstream = upstream && upstream.has(tech.id)
          const dim = upstream && !isUpstream && !isHL
          const matchesFilter = searchFilter === '' || t(`tech.${tech.id}`).toLowerCase().includes(lowerFilter) || tech.id.includes(lowerFilter)

          return (
            <g key={tech.id} onClick={() => setSelected(selected === tech.id ? null : tech.id)}
              style={{ cursor: 'pointer', opacity: dim ? 0.15 : matchesFilter ? 1 : 0.2 }}>
              <rect x={pos.x - NODE_W / 2} y={pos.y} width={NODE_W} height={NODE_H} rx={4}
                fill={isHL ? TIER_COLORS[tech.tier] + '40' : TIER_COLORS[tech.tier] + '15'}
                stroke={isHL ? '#ffffff' : isUpstream ? '#e9a820' : TIER_COLORS[tech.tier]}
                strokeWidth={isHL ? 2 : 1} />
              <text x={pos.x} y={pos.y + NODE_H / 2 + 4} textAnchor="middle"
                fill={dim ? '#ffffff30' : '#ffffffcc'} fontSize={9} fontFamily="sans-serif">
                {t(`tech.${tech.id}`)}
              </text>
            </g>
          )
        })}
      </svg>

      {/* Info panel */}
      {selectedTech && (
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 6, padding: 14, marginTop: 10 }}>
          <strong style={{ color: 'var(--accent)' }}>{t(`tech.${selectedTech.id}`)}</strong>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 8 }}>Tier {selectedTech.tier}</span>
          <div style={{ marginTop: 6, fontSize: 12, color: 'var(--text-secondary)' }}>
            {t('tech.cost')}: {selectedTech.cost} | {t('tech.packs')}: {selectedTech.sciencePacks.join(', ')}
          </div>
          {selectedTech.prerequisites.length > 0 && (
            <div style={{ marginTop: 4, fontSize: 11, color: 'var(--text-muted)' }}>
              {t('tech.requires')}: {selectedTech.prerequisites.map(p => t(`tech.${p}`)).join(', ')}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
