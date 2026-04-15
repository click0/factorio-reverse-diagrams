import { useState } from 'react'
import { useTranslation } from 'react-i18next'

type EntityState = 'placed' | 'built' | 'active' | 'mining' | 'crafting' | 'idle' | 'no-power' | 'no-resource' | 'damaged' | 'destroyed'

interface EntityType {
  id: string
  states: EntityState[]
  transitions: { from: EntityState; to: EntityState; trigger: string }[]
}

const ENTITY_TYPES: EntityType[] = [
  {
    id: 'assembler',
    states: ['placed', 'built', 'idle', 'crafting', 'no-power', 'damaged', 'destroyed'],
    transitions: [
      { from: 'placed', to: 'built', trigger: 'construction' },
      { from: 'built', to: 'idle', trigger: 'power-on' },
      { from: 'idle', to: 'crafting', trigger: 'recipe-set+items' },
      { from: 'crafting', to: 'idle', trigger: 'output-full' },
      { from: 'crafting', to: 'no-power', trigger: 'power-loss' },
      { from: 'idle', to: 'no-power', trigger: 'power-loss' },
      { from: 'no-power', to: 'idle', trigger: 'power-restored' },
      { from: 'idle', to: 'damaged', trigger: 'attack' },
      { from: 'crafting', to: 'damaged', trigger: 'attack' },
      { from: 'damaged', to: 'destroyed', trigger: 'hp-zero' },
      { from: 'damaged', to: 'idle', trigger: 'repaired' },
    ],
  },
  {
    id: 'inserter',
    states: ['placed', 'built', 'idle', 'active', 'no-power', 'destroyed'],
    transitions: [
      { from: 'placed', to: 'built', trigger: 'construction' },
      { from: 'built', to: 'idle', trigger: 'power-on' },
      { from: 'idle', to: 'active', trigger: 'items-available' },
      { from: 'active', to: 'idle', trigger: 'no-items' },
      { from: 'active', to: 'no-power', trigger: 'power-loss' },
      { from: 'idle', to: 'no-power', trigger: 'power-loss' },
      { from: 'no-power', to: 'idle', trigger: 'power-restored' },
      { from: 'active', to: 'destroyed', trigger: 'hp-zero' },
    ],
  },
  {
    id: 'mining-drill',
    states: ['placed', 'built', 'idle', 'mining', 'no-power', 'no-resource', 'destroyed'],
    transitions: [
      { from: 'placed', to: 'built', trigger: 'construction' },
      { from: 'built', to: 'idle', trigger: 'power-on' },
      { from: 'idle', to: 'mining', trigger: 'resource-below' },
      { from: 'mining', to: 'no-resource', trigger: 'depleted' },
      { from: 'mining', to: 'no-power', trigger: 'power-loss' },
      { from: 'no-power', to: 'mining', trigger: 'power-restored' },
      { from: 'no-resource', to: 'idle', trigger: 'moved' },
      { from: 'mining', to: 'destroyed', trigger: 'hp-zero' },
    ],
  },
]

const STATE_COLORS: Record<EntityState, string> = {
  placed: '#8a8a8a',
  built: '#4080e0',
  active: '#4caf50',
  mining: '#c0a040',
  crafting: '#e9a820',
  idle: '#2196f3',
  'no-power': '#ff9800',
  'no-resource': '#9c27b0',
  damaged: '#f44336',
  destroyed: '#666',
}

const SVG_W = 700
const SVG_H = 340
const NODE_R = 24

export default function EntityLifecycle() {
  const { t } = useTranslation()
  const [typeIdx, setTypeIdx] = useState(0)
  const [highlightState, setHighlightState] = useState<EntityState | null>(null)
  const [zoom, setZoom] = useState(1)

  const entityType = ENTITY_TYPES[typeIdx]
  const states = entityType.states

  // Layout states in a circle
  const cx = SVG_W / 2
  const cy = SVG_H / 2 + 10
  const radius = Math.min(cx, cy) - 50

  const positions = states.map((_, i) => {
    const angle = (i / states.length) * Math.PI * 2 - Math.PI / 2
    return { x: cx + Math.cos(angle) * radius, y: cy + Math.sin(angle) * radius }
  })

  const stateIndex = (s: EntityState) => states.indexOf(s)

  // ViewBox with zoom centered on the diagram
  const vbW = SVG_W / zoom
  const vbH = SVG_H / zoom
  const vbX = (SVG_W - vbW) / 2
  const vbY = (SVG_H - vbH) / 2

  const zoomIn = () => setZoom(z => Math.min(4, z * 1.25))
  const zoomOut = () => setZoom(z => Math.max(0.5, z / 1.25))
  const zoomReset = () => setZoom(1)

  return (
    <div>
      <div className="controls-row">
        <div className="control-group">
          <label>{t('entity.type')}:</label>
          {ENTITY_TYPES.map((et, i) => (
            <button key={et.id} className={`btn ${i === typeIdx ? 'active' : ''}`}
              onClick={() => { setTypeIdx(i); setHighlightState(null) }}>
              {t(`entity.${et.id}`)}
            </button>
          ))}
        </div>
        <div className="control-group">
          <label>{t('entity.zoom')}:</label>
          <button className="btn" onClick={zoomOut} title={t('entity.zoomOut')} aria-label={t('entity.zoomOut')}>&minus;</button>
          <button className="btn" onClick={zoomReset} title={t('entity.zoomReset')}
            style={{ minWidth: 52, fontFamily: 'monospace' }}>{Math.round(zoom * 100)}%</button>
          <button className="btn" onClick={zoomIn} title={t('entity.zoomIn')} aria-label={t('entity.zoomIn')}>+</button>
        </div>
      </div>

      <svg viewBox={`${vbX} ${vbY} ${vbW} ${vbH}`} style={{ width: '100%', maxWidth: SVG_W, background: '#0d1117', borderRadius: 4, marginTop: 8 }}>
        <defs>
          <marker id="lifecycle-arrow" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="#ffffff40" />
          </marker>
        </defs>

        {/* Transitions (arrows) */}
        {entityType.transitions.map((tr, i) => {
          const fromIdx = stateIndex(tr.from)
          const toIdx = stateIndex(tr.to)
          if (fromIdx < 0 || toIdx < 0) return null
          const from = positions[fromIdx]
          const to = positions[toIdx]
          const dx = to.x - from.x
          const dy = to.y - from.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          const nx = dx / dist
          const ny = dy / dist
          const x1 = from.x + nx * (NODE_R + 2)
          const y1 = from.y + ny * (NODE_R + 2)
          const x2 = to.x - nx * (NODE_R + 8)
          const y2 = to.y - ny * (NODE_R + 8)
          const mx = (x1 + x2) / 2 + ny * 20
          const my = (y1 + y2) / 2 - nx * 20

          const isHL = highlightState === tr.from || highlightState === tr.to

          return (
            <g key={i}>
              <path d={`M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}`}
                fill="none" stroke={isHL ? '#ffffff60' : '#ffffff18'} strokeWidth={isHL ? 1.5 : 1}
                markerEnd="url(#lifecycle-arrow)" />
              <text x={mx} y={my - 4} textAnchor="middle" fill={isHL ? '#ffffffa0' : '#ffffff30'} fontSize={7}>
                {t(`entity.trigger.${tr.trigger}`)}
              </text>
            </g>
          )
        })}

        {/* States (nodes) */}
        {states.map((state, i) => {
          const pos = positions[i]
          const isHL = highlightState === state
          const color = STATE_COLORS[state]
          return (
            <g key={state} style={{ cursor: 'pointer' }}
              onMouseEnter={() => setHighlightState(state)} onMouseLeave={() => setHighlightState(null)}>
              <circle cx={pos.x} cy={pos.y} r={NODE_R}
                fill={color + '25'} stroke={isHL ? '#fff' : color} strokeWidth={isHL ? 2.5 : 1.5} />
              <text x={pos.x} y={pos.y + 1} textAnchor="middle" dominantBaseline="middle"
                fill={isHL ? '#fff' : '#ffffffcc'} fontSize={9} fontWeight="bold">
                {t(`entity.state.${state}`)}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
