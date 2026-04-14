import { useState } from 'react'
import { useTranslation } from 'react-i18next'

interface Splitter {
  x: number
  y: number
}

interface Connection {
  from: { x: number; y: number }
  to: { x: number; y: number }
}

interface BalancerConfig {
  id: string
  labelKey: string
  inputs: number
  outputs: number
  splitters: number
  inputBalanced: boolean
  outputBalanced: boolean
  throughputUnlimited: boolean
  splitterPos: Splitter[]
  connections: Connection[]
  inputY: number[]
  outputY: number[]
}

const SVG_W = 500
const SVG_H = 220
const IN_X = 20
const OUT_X = 480
const SP_W = 28
const SP_H = 28

const CONFIGS: BalancerConfig[] = [
  // 1→2: one input splits into two outputs
  {
    id: '1to2', labelKey: 'balancer.1to2', inputs: 1, outputs: 2,
    splitters: 1, inputBalanced: true, outputBalanced: true, throughputUnlimited: true,
    inputY: [110],
    outputY: [75, 145],
    splitterPos: [{ x: 250, y: 110 }],
    connections: [
      { from: { x: IN_X, y: 110 }, to: { x: 236, y: 110 } },
      { from: { x: 264, y: 96 }, to: { x: OUT_X, y: 75 } },
      { from: { x: 264, y: 124 }, to: { x: OUT_X, y: 145 } },
    ],
  },
  // 2→2: two inputs balanced to two outputs
  {
    id: '2to2', labelKey: 'balancer.2to2', inputs: 2, outputs: 2,
    splitters: 1, inputBalanced: true, outputBalanced: true, throughputUnlimited: true,
    inputY: [80, 140],
    outputY: [80, 140],
    splitterPos: [{ x: 250, y: 110 }],
    connections: [
      { from: { x: IN_X, y: 80 }, to: { x: 236, y: 96 } },
      { from: { x: IN_X, y: 140 }, to: { x: 236, y: 124 } },
      { from: { x: 264, y: 96 }, to: { x: OUT_X, y: 80 } },
      { from: { x: 264, y: 124 }, to: { x: OUT_X, y: 140 } },
    ],
  },
  // 4→4: classic 2-stage with 4 splitters
  {
    id: '4to4', labelKey: 'balancer.4to4', inputs: 4, outputs: 4,
    splitters: 4, inputBalanced: true, outputBalanced: true, throughputUnlimited: true,
    inputY: [40, 80, 130, 175],
    outputY: [40, 80, 130, 175],
    splitterPos: [
      { x: 150, y: 60 }, { x: 150, y: 152 },
      { x: 350, y: 60 }, { x: 350, y: 152 },
    ],
    connections: [
      // inputs → stage 1
      { from: { x: IN_X, y: 40 }, to: { x: 136, y: 46 } },
      { from: { x: IN_X, y: 80 }, to: { x: 136, y: 74 } },
      { from: { x: IN_X, y: 130 }, to: { x: 136, y: 138 } },
      { from: { x: IN_X, y: 175 }, to: { x: 136, y: 166 } },
      // stage 1 cross → stage 2
      { from: { x: 164, y: 46 }, to: { x: 336, y: 46 } },
      { from: { x: 164, y: 74 }, to: { x: 336, y: 166 } },
      { from: { x: 164, y: 138 }, to: { x: 336, y: 74 } },
      { from: { x: 164, y: 166 }, to: { x: 336, y: 138 } },
      // stage 2 → outputs
      { from: { x: 364, y: 46 }, to: { x: OUT_X, y: 40 } },
      { from: { x: 364, y: 74 }, to: { x: OUT_X, y: 80 } },
      { from: { x: 364, y: 138 }, to: { x: OUT_X, y: 130 } },
      { from: { x: 364, y: 166 }, to: { x: OUT_X, y: 175 } },
    ],
  },
  // 4→4 compact: 3 splitters, throughput limited
  {
    id: '4to4compact', labelKey: 'balancer.4to4compact', inputs: 4, outputs: 4,
    splitters: 3, inputBalanced: true, outputBalanced: true, throughputUnlimited: false,
    inputY: [40, 80, 130, 175],
    outputY: [40, 80, 130, 175],
    splitterPos: [
      { x: 150, y: 60 }, { x: 250, y: 110 }, { x: 350, y: 152 },
    ],
    connections: [
      { from: { x: IN_X, y: 40 }, to: { x: 136, y: 46 } },
      { from: { x: IN_X, y: 80 }, to: { x: 136, y: 74 } },
      { from: { x: 164, y: 46 }, to: { x: OUT_X, y: 40 } },
      { from: { x: 164, y: 74 }, to: { x: 236, y: 96 } },
      { from: { x: IN_X, y: 130 }, to: { x: 236, y: 124 } },
      { from: { x: 264, y: 96 }, to: { x: OUT_X, y: 80 } },
      { from: { x: 264, y: 124 }, to: { x: 336, y: 138 } },
      { from: { x: IN_X, y: 175 }, to: { x: 336, y: 166 } },
      { from: { x: 364, y: 138 }, to: { x: OUT_X, y: 130 } },
      { from: { x: 364, y: 166 }, to: { x: OUT_X, y: 175 } },
    ],
  },
  // 6→6
  {
    id: '6to6', labelKey: 'balancer.6to6', inputs: 6, outputs: 6,
    splitters: 8, inputBalanced: true, outputBalanced: true, throughputUnlimited: false,
    inputY: [22, 55, 88, 121, 154, 190],
    outputY: [22, 55, 88, 121, 154, 190],
    splitterPos: [
      { x: 110, y: 38 }, { x: 110, y: 105 }, { x: 110, y: 172 },
      { x: 250, y: 55 }, { x: 250, y: 155 },
      { x: 390, y: 38 }, { x: 390, y: 105 }, { x: 390, y: 172 },
    ],
    connections: [
      // in → stage 1
      { from: { x: IN_X, y: 22 }, to: { x: 96, y: 24 } },
      { from: { x: IN_X, y: 55 }, to: { x: 96, y: 52 } },
      { from: { x: IN_X, y: 88 }, to: { x: 96, y: 91 } },
      { from: { x: IN_X, y: 121 }, to: { x: 96, y: 119 } },
      { from: { x: IN_X, y: 154 }, to: { x: 96, y: 158 } },
      { from: { x: IN_X, y: 190 }, to: { x: 96, y: 186 } },
      // stage 1 → stage 2
      { from: { x: 124, y: 24 }, to: { x: 236, y: 41 } },
      { from: { x: 124, y: 52 }, to: { x: 236, y: 69 } },
      { from: { x: 124, y: 91 }, to: { x: OUT_X, y: 88 } },
      { from: { x: 124, y: 119 }, to: { x: OUT_X, y: 121 } },
      { from: { x: 124, y: 158 }, to: { x: 236, y: 141 } },
      { from: { x: 124, y: 186 }, to: { x: 236, y: 169 } },
      // stage 2 → stage 3
      { from: { x: 264, y: 41 }, to: { x: 376, y: 24 } },
      { from: { x: 264, y: 69 }, to: { x: 376, y: 158 } },
      { from: { x: 264, y: 141 }, to: { x: 376, y: 52 } },
      { from: { x: 264, y: 169 }, to: { x: 376, y: 186 } },
      // stage 3 → out
      { from: { x: 404, y: 24 }, to: { x: OUT_X, y: 22 } },
      { from: { x: 404, y: 52 }, to: { x: OUT_X, y: 55 } },
      { from: { x: 404, y: 91 }, to: { x: OUT_X, y: 88 } },
      { from: { x: 404, y: 119 }, to: { x: OUT_X, y: 121 } },
      { from: { x: 404, y: 158 }, to: { x: OUT_X, y: 154 } },
      { from: { x: 404, y: 186 }, to: { x: OUT_X, y: 190 } },
    ],
  },
  // 8→8
  {
    id: '8to8', labelKey: 'balancer.8to8', inputs: 8, outputs: 8,
    splitters: 10, inputBalanced: true, outputBalanced: true, throughputUnlimited: false,
    inputY: [16, 42, 68, 94, 126, 152, 178, 204],
    outputY: [16, 42, 68, 94, 126, 152, 178, 204],
    splitterPos: [
      { x: 100, y: 29 }, { x: 100, y: 81 }, { x: 100, y: 139 }, { x: 100, y: 191 },
      { x: 250, y: 55 }, { x: 250, y: 165 },
      { x: 400, y: 29 }, { x: 400, y: 81 }, { x: 400, y: 139 }, { x: 400, y: 191 },
    ],
    connections: [
      // in → stage 1
      { from: { x: IN_X, y: 16 }, to: { x: 86, y: 15 } },
      { from: { x: IN_X, y: 42 }, to: { x: 86, y: 43 } },
      { from: { x: IN_X, y: 68 }, to: { x: 86, y: 67 } },
      { from: { x: IN_X, y: 94 }, to: { x: 86, y: 95 } },
      { from: { x: IN_X, y: 126 }, to: { x: 86, y: 125 } },
      { from: { x: IN_X, y: 152 }, to: { x: 86, y: 153 } },
      { from: { x: IN_X, y: 178 }, to: { x: 86, y: 177 } },
      { from: { x: IN_X, y: 204 }, to: { x: 86, y: 205 } },
      // stage 1 → stage 2
      { from: { x: 114, y: 15 }, to: { x: 236, y: 41 } },
      { from: { x: 114, y: 43 }, to: { x: 236, y: 69 } },
      { from: { x: 114, y: 67 }, to: { x: OUT_X, y: 68 } },
      { from: { x: 114, y: 95 }, to: { x: OUT_X, y: 94 } },
      { from: { x: 114, y: 125 }, to: { x: OUT_X, y: 126 } },
      { from: { x: 114, y: 153 }, to: { x: OUT_X, y: 152 } },
      { from: { x: 114, y: 177 }, to: { x: 236, y: 151 } },
      { from: { x: 114, y: 205 }, to: { x: 236, y: 179 } },
      // stage 2 → stage 3
      { from: { x: 264, y: 41 }, to: { x: 386, y: 15 } },
      { from: { x: 264, y: 69 }, to: { x: 386, y: 177 } },
      { from: { x: 264, y: 151 }, to: { x: 386, y: 43 } },
      { from: { x: 264, y: 179 }, to: { x: 386, y: 205 } },
      // stage 3 → out
      { from: { x: 414, y: 15 }, to: { x: OUT_X, y: 16 } },
      { from: { x: 414, y: 43 }, to: { x: OUT_X, y: 42 } },
      { from: { x: 414, y: 67 }, to: { x: OUT_X, y: 68 } },
      { from: { x: 414, y: 95 }, to: { x: OUT_X, y: 94 } },
      { from: { x: 414, y: 125 }, to: { x: OUT_X, y: 126 } },
      { from: { x: 414, y: 153 }, to: { x: OUT_X, y: 152 } },
      { from: { x: 414, y: 177 }, to: { x: OUT_X, y: 178 } },
      { from: { x: 414, y: 205 }, to: { x: OUT_X, y: 204 } },
    ],
  },
]

export default function Balancers() {
  const { t } = useTranslation()
  const [selected, setSelected] = useState(2) // 4-to-4

  const cfg = CONFIGS[selected]

  return (
    <div>
      <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 12 }}>{t('balancer.description')}</p>

      <div className="controls-row">
        <div className="control-group">
          <label>{t('balancer.config')}:</label>
          {CONFIGS.map((c, i) => (
            <button key={c.id} className={`btn ${selected === i ? 'active' : ''}`}
              onClick={() => setSelected(i)}>
              {t(c.labelKey)}
            </button>
          ))}
        </div>
      </div>

      <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        style={{ width: '100%', maxWidth: SVG_W, background: '#0d1117', borderRadius: 4, marginTop: 8 }}>

        {/* Connections (belt lines) */}
        {cfg.connections.map((c, i) => (
          <line key={`c-${i}`}
            x1={c.from.x} y1={c.from.y} x2={c.to.x} y2={c.to.y}
            stroke="#ffd54f" strokeWidth={2.5} strokeLinecap="round" />
        ))}

        {/* Input arrows */}
        {cfg.inputY.map((y, i) => (
          <polygon key={`ia-${i}`}
            points={`${IN_X + 6},${y - 4} ${IN_X + 16},${y} ${IN_X + 6},${y + 4}`}
            fill="#ffd54f" />
        ))}

        {/* Output arrows */}
        {cfg.outputY.map((y, i) => (
          <polygon key={`oa-${i}`}
            points={`${OUT_X - 10},${y - 4} ${OUT_X},${y} ${OUT_X - 10},${y + 4}`}
            fill="#ffd54f" />
        ))}

        {/* Splitters */}
        {cfg.splitterPos.map((p, i) => (
          <g key={`sp-${i}`}>
            <rect x={p.x - SP_W / 2} y={p.y - SP_H / 2} width={SP_W} height={SP_H} rx={4}
              fill="#2e7d32" stroke="#66bb6a" strokeWidth={1.5} />
            <line x1={p.x - 8} y1={p.y - 5} x2={p.x + 8} y2={p.y - 5} stroke="#fff" strokeWidth={1.5} />
            <line x1={p.x - 8} y1={p.y + 5} x2={p.x + 8} y2={p.y + 5} stroke="#fff" strokeWidth={1.5} />
            <line x1={p.x} y1={p.y - 5} x2={p.x} y2={p.y + 5} stroke="#fff" strokeWidth={1} strokeDasharray="2,2" />
          </g>
        ))}

        {/* Labels */}
        <text x={10} y={SVG_H - 6} fill="#ffffff40" fontSize={10}>
          {cfg.inputs} {t('balancer.inputs')} → {cfg.outputs} {t('balancer.outputs')}
        </text>
      </svg>

      {/* Properties */}
      <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
        <PropBadge label={t('balancer.splitters')} value={`${cfg.splitters}`} />
        <PropBadge label={t('balancer.inputBalanced')} value={cfg.inputBalanced ? t('balancer.yes') : t('balancer.no')}
          color={cfg.inputBalanced ? '#4caf50' : '#ef5350'} />
        <PropBadge label={t('balancer.outputBalanced')} value={cfg.outputBalanced ? t('balancer.yes') : t('balancer.no')}
          color={cfg.outputBalanced ? '#4caf50' : '#ef5350'} />
        <PropBadge label={t('balancer.throughputUnlimited')} value={cfg.throughputUnlimited ? t('balancer.yes') : t('balancer.no')}
          color={cfg.throughputUnlimited ? '#4caf50' : '#ff9800'} />
      </div>
    </div>
  )
}

function PropBadge({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 6, padding: '10px 14px' }}>
      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{label}</div>
      <div style={{ fontSize: 18, color: color || 'var(--accent)', fontWeight: 700, fontFamily: 'monospace' }}>{value}</div>
    </div>
  )
}
