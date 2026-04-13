import { useState } from 'react'
import { useTranslation } from 'react-i18next'

interface Surface {
  id: string
  color: string
  children: string[]
  entities: string[]
}

const SURFACES: Surface[] = [
  { id: 'nauvis', color: '#4caf50', children: ['space-platform-1', 'space-platform-2'], entities: ['factory', 'logistics', 'combat', 'power'] },
  { id: 'vulcanus', color: '#ff5722', children: [], entities: ['foundry', 'lava-processing', 'calcite'] },
  { id: 'fulgora', color: '#2196f3', children: [], entities: ['em-plant', 'lightning-rod', 'recycler'] },
  { id: 'gleba', color: '#8bc34a', children: [], entities: ['bioprocessing', 'spoilage', 'agriculture'] },
  { id: 'aquilo', color: '#00bcd4', children: [], entities: ['cryogenic', 'fusion', 'heating'] },
  { id: 'space-platform-1', color: '#9c27b0', children: [], entities: ['thrusters', 'cargo-bay', 'asteroid-collector'] },
  { id: 'space-platform-2', color: '#e91e63', children: [], entities: ['thrusters', 'cargo-bay', 'crusher'] },
]

const SVG_W = 700
const SVG_H = 360

export default function MultiSurface() {
  const { t } = useTranslation()
  const [selected, setSelected] = useState<string | null>('nauvis')

  const selectedSurface = SURFACES.find(s => s.id === selected)

  // Layout: Nauvis in center, planets around, platforms as children
  const positions: Record<string, { x: number; y: number }> = {
    nauvis: { x: SVG_W / 2, y: 100 },
    vulcanus: { x: 100, y: 260 },
    fulgora: { x: SVG_W - 100, y: 260 },
    gleba: { x: 200, y: 100 },
    aquilo: { x: SVG_W - 200, y: 100 },
    'space-platform-1': { x: SVG_W / 2 - 80, y: 200 },
    'space-platform-2': { x: SVG_W / 2 + 80, y: 200 },
  }

  return (
    <div>
      <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} style={{ width: '100%', maxWidth: SVG_W, background: '#0d1117', borderRadius: 4, marginTop: 8 }}>
        {/* Rocket routes from Nauvis */}
        {['vulcanus', 'fulgora', 'gleba', 'aquilo'].map(planetId => {
          const from = positions.nauvis
          const to = positions[planetId]
          return (
            <line key={planetId} x1={from.x} y1={from.y} x2={to.x} y2={to.y}
              stroke="#ffffff15" strokeWidth={1} strokeDasharray="6,4" />
          )
        })}

        {/* Platform connections */}
        {['space-platform-1', 'space-platform-2'].map(platId => {
          const from = positions.nauvis
          const to = positions[platId]
          return (
            <line key={platId} x1={from.x} y1={from.y + 20} x2={to.x} y2={to.y - 15}
              stroke="#9c27b040" strokeWidth={1.5} />
          )
        })}

        {/* Surface nodes */}
        {SURFACES.map(surface => {
          const pos = positions[surface.id]
          if (!pos) return null
          const isSel = selected === surface.id
          const isPlatform = surface.id.includes('platform')
          const r = isPlatform ? 18 : 26

          return (
            <g key={surface.id} style={{ cursor: 'pointer' }}
              onClick={() => setSelected(selected === surface.id ? null : surface.id)}>
              <circle cx={pos.x} cy={pos.y} r={r}
                fill={surface.color + '25'}
                stroke={isSel ? '#fff' : surface.color}
                strokeWidth={isSel ? 2.5 : 1.5} />
              <text x={pos.x} y={pos.y + 1} textAnchor="middle" dominantBaseline="middle"
                fill={surface.color} fontSize={isPlatform ? 8 : 11} fontWeight="bold">
                {t(`surface.${surface.id}`)}
              </text>
              <text x={pos.x} y={pos.y + r + 14} textAnchor="middle"
                fill="#ffffff50" fontSize={8}>
                {isPlatform ? t('surface.platform') : t('surface.planet')}
              </text>
            </g>
          )
        })}
      </svg>

      {/* Detail panel */}
      {selectedSurface && (
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 6, padding: 14, marginTop: 10 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
            <span style={{ width: 12, height: 12, borderRadius: '50%', background: selectedSurface.color }} />
            <strong style={{ color: selectedSurface.color, fontSize: 16 }}>{t(`surface.${selectedSurface.id}`)}</strong>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>
            {t(`surface.desc.${selectedSurface.id}`)}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            <strong>{t('surface.uniqueEntities')}:</strong>{' '}
            {selectedSurface.entities.map(e => t(`surface.entity.${e}`)).join(', ')}
          </div>
          {selectedSurface.children.length > 0 && (
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
              <strong>{t('surface.platforms')}:</strong>{' '}
              {selectedSurface.children.map(c => t(`surface.${c}`)).join(', ')}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
