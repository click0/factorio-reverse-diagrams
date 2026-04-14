import { useState } from 'react'
import { useTranslation } from 'react-i18next'

interface BalancerConfig {
  id: string
  labelKey: string
  inputs: number
  outputs: number
  splitters: number
  inputBalanced: boolean
  outputBalanced: boolean
  throughputUnlimited: boolean
  // SVG layout: splitter positions [x, y, inputA_y, inputB_y, outputA_y, outputB_y]
  paths: { x: number; y: number }[]
}

const CONFIGS: BalancerConfig[] = [
  {
    id: '1to2', labelKey: 'balancer.1to2', inputs: 1, outputs: 2,
    splitters: 1, inputBalanced: true, outputBalanced: true, throughputUnlimited: true,
    paths: [{ x: 200, y: 80 }],
  },
  {
    id: '2to2', labelKey: 'balancer.2to2', inputs: 2, outputs: 2,
    splitters: 1, inputBalanced: true, outputBalanced: true, throughputUnlimited: true,
    paths: [{ x: 200, y: 80 }],
  },
  {
    id: '4to4', labelKey: 'balancer.4to4', inputs: 4, outputs: 4,
    splitters: 4, inputBalanced: true, outputBalanced: true, throughputUnlimited: true,
    paths: [{ x: 140, y: 50 }, { x: 140, y: 130 }, { x: 280, y: 50 }, { x: 280, y: 130 }],
  },
  {
    id: '4to4compact', labelKey: 'balancer.4to4compact', inputs: 4, outputs: 4,
    splitters: 3, inputBalanced: true, outputBalanced: true, throughputUnlimited: false,
    paths: [{ x: 140, y: 60 }, { x: 200, y: 100 }, { x: 280, y: 60 }],
  },
  {
    id: '6to6', labelKey: 'balancer.6to6', inputs: 6, outputs: 6,
    splitters: 8, inputBalanced: true, outputBalanced: true, throughputUnlimited: false,
    paths: [
      { x: 100, y: 40 }, { x: 100, y: 100 }, { x: 100, y: 160 },
      { x: 200, y: 60 }, { x: 200, y: 130 },
      { x: 300, y: 40 }, { x: 300, y: 100 }, { x: 300, y: 160 },
    ],
  },
  {
    id: '8to8', labelKey: 'balancer.8to8', inputs: 8, outputs: 8,
    splitters: 10, inputBalanced: true, outputBalanced: true, throughputUnlimited: false,
    paths: [
      { x: 100, y: 30 }, { x: 100, y: 80 }, { x: 100, y: 130 }, { x: 100, y: 180 },
      { x: 220, y: 55 }, { x: 220, y: 155 },
      { x: 340, y: 30 }, { x: 340, y: 80 }, { x: 340, y: 130 }, { x: 340, y: 180 },
    ],
  },
]

const SVG_W = 500
const SVG_H = 220

export default function Balancers() {
  const { t } = useTranslation()
  const [selected, setSelected] = useState(2) // 4-to-4

  const cfg = CONFIGS[selected]
  const beltSpacing = SVG_H / (Math.max(cfg.inputs, cfg.outputs) + 1)

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

      {/* SVG Balancer Diagram */}
      <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        style={{ width: '100%', maxWidth: SVG_W, background: '#0d1117', borderRadius: 4, marginTop: 8 }}>

        {/* Input belts */}
        {Array.from({ length: cfg.inputs }, (_, i) => {
          const y = (i + 1) * (SVG_H / (cfg.inputs + 1))
          return (
            <g key={`in-${i}`}>
              <line x1={10} y1={y} x2={cfg.paths[0]?.x ?? 200} y2={y}
                stroke="#ffd54f" strokeWidth={3} strokeLinecap="round" />
              <polygon points={`${30},${y - 4} ${40},${y} ${30},${y + 4}`} fill="#ffd54f" />
            </g>
          )
        })}

        {/* Output belts */}
        {Array.from({ length: cfg.outputs }, (_, i) => {
          const y = (i + 1) * (SVG_H / (cfg.outputs + 1))
          const lastX = cfg.paths[cfg.paths.length - 1]?.x ?? 300
          return (
            <g key={`out-${i}`}>
              <line x1={lastX + 40} y1={y} x2={SVG_W - 10} y2={y}
                stroke="#ffd54f" strokeWidth={3} strokeLinecap="round" />
              <polygon points={`${SVG_W - 20},${y - 4} ${SVG_W - 10},${y} ${SVG_W - 20},${y + 4}`} fill="#ffd54f" />
            </g>
          )
        })}

        {/* Splitters */}
        {cfg.paths.map((p, i) => (
          <g key={`sp-${i}`}>
            <rect x={p.x - 15} y={p.y - 15} width={30} height={30} rx={4}
              fill="#2e7d32" stroke="#66bb6a" strokeWidth={1.5} />
            <line x1={p.x - 8} y1={p.y - 6} x2={p.x + 8} y2={p.y - 6} stroke="#fff" strokeWidth={1.5} />
            <line x1={p.x - 8} y1={p.y + 6} x2={p.x + 8} y2={p.y + 6} stroke="#fff" strokeWidth={1.5} />
            <line x1={p.x} y1={p.y - 6} x2={p.x} y2={p.y + 6} stroke="#fff" strokeWidth={1} strokeDasharray="2,2" />
          </g>
        ))}

        {/* Cross-connections between splitters */}
        {cfg.paths.length > 1 && cfg.paths.slice(0, -1).map((p, i) => {
          const next = cfg.paths[i + 1]
          if (!next || Math.abs(p.x - next.x) > 10) return null
          return (
            <line key={`conn-${i}`} x1={p.x} y1={p.y + 15} x2={next.x} y2={next.y - 15}
              stroke="#66bb6a" strokeWidth={1.5} strokeDasharray="4,3" opacity={0.5} />
          )
        })}

        {/* Labels */}
        <text x={10} y={14} fill="#ffffff60" fontSize={10}>{cfg.inputs} {t('balancer.inputs')}</text>
        <text x={SVG_W - 10} y={14} textAnchor="end" fill="#ffffff60" fontSize={10}>{cfg.outputs} {t('balancer.outputs')}</text>
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
