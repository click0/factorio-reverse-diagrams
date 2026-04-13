import { useState } from 'react'
import { useTranslation } from 'react-i18next'

// Power failure cascade: when satisfaction drops, systems degrade in order
interface System {
  id: string
  priority: number // lower = loses power first
  powerDraw: number // MW
  criticalAt: number // satisfaction % where it stops working
  color: string
}

const SYSTEMS: System[] = [
  { id: 'laser-turrets', priority: 1, powerDraw: 40, criticalAt: 90, color: '#f44336' },
  { id: 'roboports', priority: 2, powerDraw: 20, criticalAt: 75, color: '#00bcd4' },
  { id: 'assemblers', priority: 3, powerDraw: 30, criticalAt: 60, color: '#e9a820' },
  { id: 'inserters', priority: 4, powerDraw: 15, criticalAt: 50, color: '#4080e0' },
  { id: 'electric-furnaces', priority: 5, powerDraw: 25, criticalAt: 45, color: '#c0884a' },
  { id: 'miners', priority: 6, powerDraw: 20, criticalAt: 30, color: '#8bc34a' },
  { id: 'pumps', priority: 7, powerDraw: 5, criticalAt: 20, color: '#2196f3' },
  { id: 'radar', priority: 8, powerDraw: 5, criticalAt: 10, color: '#9c27b0' },
]

const SVG_W = 700
const SVG_H = 320
const BAR_X = 120
const BAR_W = 500
const BAR_H = 28
const GAP = 6

export default function PowerFailure() {
  const { t } = useTranslation()
  const [satisfaction, setSatisfaction] = useState(100)
  const [totalCapacity, setTotalCapacity] = useState(200)

  const totalDemand = SYSTEMS.reduce((s, sys) => s + sys.powerDraw, 0)
  const actualSatisfaction = Math.min(100, (totalCapacity / totalDemand) * 100)
  const displaySat = Math.min(satisfaction, actualSatisfaction)

  return (
    <div>
      <div className="controls-row">
        <div className="control-group">
          <label>{t('powerFail.satisfaction')}:</label>
          <input type="range" min={0} max={100} value={satisfaction}
            onChange={(e) => setSatisfaction(Number(e.target.value))} />
          <span style={{ fontSize: 13, color: displaySat < 50 ? '#f44336' : displaySat < 80 ? '#ff9800' : '#4caf50', fontWeight: 700, minWidth: 40 }}>
            {displaySat.toFixed(0)}%
          </span>
        </div>
        <div className="control-group">
          <label>{t('powerFail.capacity')}:</label>
          <input type="range" min={10} max={300} step={10} value={totalCapacity}
            onChange={(e) => setTotalCapacity(Number(e.target.value))} />
          <span style={{ fontSize: 13, color: 'var(--text-secondary)', minWidth: 50 }}>{totalCapacity} MW</span>
        </div>
      </div>

      <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} style={{ width: '100%', maxWidth: SVG_W, background: '#0d1117', borderRadius: 4, marginTop: 8 }}>
        {/* Satisfaction line */}
        <line x1={BAR_X + BAR_W * displaySat / 100} y1={10}
          x2={BAR_X + BAR_W * displaySat / 100} y2={SVG_H - 10}
          stroke={displaySat < 50 ? '#f44336' : '#4caf50'} strokeWidth={2} strokeDasharray="6,3" />
        <text x={BAR_X + BAR_W * displaySat / 100} y={10} textAnchor="middle"
          fill={displaySat < 50 ? '#f44336' : '#4caf50'} fontSize={10} fontWeight="bold">
          {displaySat.toFixed(0)}%
        </text>

        {/* System bars */}
        {SYSTEMS.map((sys, i) => {
          const y = 24 + i * (BAR_H + GAP)
          const active = displaySat >= sys.criticalAt
          const barFill = active ? BAR_W * (displaySat / 100) : BAR_W * (sys.criticalAt / 100)

          return (
            <g key={sys.id}>
              {/* Label */}
              <text x={BAR_X - 6} y={y + BAR_H / 2 + 4} textAnchor="end"
                fill={active ? sys.color : '#ffffff30'} fontSize={10}>
                {t(`powerFail.sys.${sys.id}`)}
              </text>

              {/* Background bar */}
              <rect x={BAR_X} y={y} width={BAR_W} height={BAR_H} rx={3}
                fill="#ffffff08" />

              {/* Critical threshold marker */}
              <line x1={BAR_X + BAR_W * sys.criticalAt / 100} y1={y}
                x2={BAR_X + BAR_W * sys.criticalAt / 100} y2={y + BAR_H}
                stroke="#ffffff20" strokeWidth={1} strokeDasharray="2,2" />

              {/* Fill bar */}
              <rect x={BAR_X} y={y} width={barFill} height={BAR_H} rx={3}
                fill={active ? sys.color + '60' : '#f4433620'} />

              {/* Status */}
              <text x={BAR_X + BAR_W + 8} y={y + BAR_H / 2 + 4}
                fill={active ? '#4caf50' : '#f44336'} fontSize={10} fontWeight="bold">
                {active ? '✓' : '✗'}
              </text>

              {/* Power draw */}
              <text x={BAR_X + BAR_W * sys.criticalAt / 100} y={y - 2}
                textAnchor="middle" fill="#ffffff30" fontSize={7}>
                {sys.criticalAt}%
              </text>
            </g>
          )
        })}
      </svg>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8, marginTop: 10 }}>
        <Stat label={t('powerFail.totalDemand')} value={`${totalDemand} MW`} />
        <Stat label={t('powerFail.capacity')} value={`${totalCapacity} MW`} />
        <Stat label={t('powerFail.active')} value={`${SYSTEMS.filter(s => displaySat >= s.criticalAt).length}/${SYSTEMS.length}`}
          color={displaySat < 50 ? '#f44336' : '#4caf50'} />
      </div>
    </div>
  )
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 12px' }}>
      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{label}</div>
      <div style={{ fontSize: 16, color: color || 'var(--accent)', fontWeight: 700, fontFamily: 'monospace' }}>{value}</div>
    </div>
  )
}
