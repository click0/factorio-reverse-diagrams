import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'

// Mining productivity infinite research:
// Each level costs more, but gives +10% mining productivity (cumulative)
// Cost formula: base_cost * (level ^ cost_multiplier)
const BASE_COST = 250 // science packs per level
const COST_MULTIPLIER = 2.5
const PROD_PER_LEVEL = 0.1 // +10% per level

// Mining drill base: 0.5 items/s for iron ore (mining speed 0.5, hardness removed in 2.0)
const BASE_MINING_SPEED = 0.5

// Electric mining drill stats
const DRILL_SPEED = 0.5 // base mining speed
const MODULE_SLOTS = 3

function researchCost(level: number): number {
  if (level <= 0) return 0
  return Math.ceil(BASE_COST * Math.pow(level, COST_MULTIPLIER))
}

function cumulativeCost(levels: number): number {
  let total = 0
  for (let i = 1; i <= levels; i++) total += researchCost(i)
  return total
}

function miningSpeed(level: number, speedModules: number): number {
  const prodBonus = level * PROD_PER_LEVEL
  const speedBonus = speedModules * 0.5 // speed module 3
  return DRILL_SPEED * (1 + speedBonus) * (1 + prodBonus)
}

const CHART_W = 700
const CHART_H = 250
const PAD = 50

export default function MiningProductivity() {
  const { t } = useTranslation()
  const [maxLevel, setMaxLevel] = useState(50)
  const [speedMods, setSpeedMods] = useState(0)
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null)

  const data = useMemo(() => {
    const points: { level: number; speed: number; cost: number; cumCost: number; bonus: number }[] = []
    for (let l = 0; l <= maxLevel; l++) {
      points.push({
        level: l,
        speed: miningSpeed(l, speedMods),
        cost: researchCost(l),
        cumCost: cumulativeCost(l),
        bonus: l * PROD_PER_LEVEL * 100,
      })
    }
    return points
  }, [maxLevel, speedMods])

  const maxSpeed = data[data.length - 1].speed
  const maxCost = data[data.length - 1].cumCost

  const xScale = (l: number) => PAD + (l / maxLevel) * (CHART_W - PAD * 2)
  const ySpeedScale = (s: number) => CHART_H - PAD - (s / (maxSpeed * 1.1)) * (CHART_H - PAD * 2)
  const yCostScale = (c: number) => CHART_H - PAD - (c / (maxCost * 1.1)) * (CHART_H - PAD * 2)

  const sel = selectedLevel !== null ? data[selectedLevel] : data[data.length - 1]

  return (
    <div>
      <div className="controls-row">
        <div className="control-group">
          <label>{t('mining.maxLevel')}:</label>
          <input type="range" min={10} max={200} step={10} value={maxLevel}
            onChange={(e) => setMaxLevel(Number(e.target.value))} />
          <span style={{ fontSize: 13, color: 'var(--text-secondary)', minWidth: 40 }}>{maxLevel}</span>
        </div>
        <div className="control-group">
          <label>{t('mining.speedMods')}:</label>
          {[0, 1, 2, 3].map(n => (
            <button key={n} className={`btn ${speedMods === n ? 'active' : ''}`}
              onClick={() => setSpeedMods(n)}>{n}</button>
          ))}
        </div>
      </div>

      <svg viewBox={`0 0 ${CHART_W} ${CHART_H}`} style={{ width: '100%', maxWidth: CHART_W, background: '#0d1117', borderRadius: 4, marginTop: 8 }}
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect()
          const x = (e.clientX - rect.left) / rect.width * CHART_W
          const level = Math.round(((x - PAD) / (CHART_W - PAD * 2)) * maxLevel)
          if (level >= 0 && level <= maxLevel) setSelectedLevel(level)
        }}
        onMouseLeave={() => setSelectedLevel(null)}>

        {/* Grid */}
        {[0, 0.25, 0.5, 0.75, 1].map(f => (
          <line key={f} x1={PAD} y1={PAD + f * (CHART_H - PAD * 2)} x2={CHART_W - PAD} y2={PAD + f * (CHART_H - PAD * 2)}
            stroke="#ffffff08" />
        ))}

        {/* Mining speed curve (green) */}
        <polyline points={data.map(d => `${xScale(d.level)},${ySpeedScale(d.speed)}`).join(' ')}
          fill="none" stroke="#4caf50" strokeWidth={2} />

        {/* Cumulative cost curve (orange) */}
        <polyline points={data.map(d => `${xScale(d.level)},${yCostScale(d.cumCost)}`).join(' ')}
          fill="none" stroke="#ff980080" strokeWidth={1.5} strokeDasharray="4,3" />

        {/* Hover crosshair */}
        {selectedLevel !== null && (
          <>
            <line x1={xScale(selectedLevel)} y1={PAD} x2={xScale(selectedLevel)} y2={CHART_H - PAD}
              stroke="#ffffff30" strokeWidth={1} />
            <circle cx={xScale(selectedLevel)} cy={ySpeedScale(data[selectedLevel].speed)} r={4}
              fill="#4caf50" stroke="#fff" strokeWidth={1} />
          </>
        )}

        {/* X axis */}
        {Array.from({ length: 6 }, (_, i) => Math.round(i * maxLevel / 5)).map(l => (
          <text key={l} x={xScale(l)} y={CHART_H - 8} textAnchor="middle" fill="#ffffff50" fontSize={9}>Lv{l}</text>
        ))}

        {/* Legend */}
        <line x1={PAD} y1={CHART_H - 4} x2={PAD + 16} y2={CHART_H - 4} stroke="#4caf50" strokeWidth={2} />
        <text x={PAD + 20} y={CHART_H - 1} fill="#ffffff60" fontSize={8}>{t('mining.speed')}</text>
        <line x1={PAD + 90} y1={CHART_H - 4} x2={PAD + 106} y2={CHART_H - 4} stroke="#ff980080" strokeWidth={1.5} strokeDasharray="4,3" />
        <text x={PAD + 110} y={CHART_H - 1} fill="#ffffff60" fontSize={8}>{t('mining.cumCost')}</text>
      </svg>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10, marginTop: 12 }}>
        <Stat label={t('mining.level')} value={`${sel.level}`} />
        <Stat label={t('mining.bonus')} value={`+${sel.bonus.toFixed(0)}%`} color="#4caf50" />
        <Stat label={t('mining.speed')} value={`${sel.speed.toFixed(2)}/s`} color="#4caf50" />
        <Stat label={t('mining.levelCost')} value={sel.cost.toLocaleString()} />
        <Stat label={t('mining.cumCost')} value={sel.cumCost.toLocaleString()} />
      </div>
    </div>
  )
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 6, padding: '10px 14px' }}>
      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{label}</div>
      <div style={{ fontSize: 18, color: color || 'var(--accent)', fontWeight: 700, fontFamily: 'monospace' }}>{value}</div>
    </div>
  )
}
