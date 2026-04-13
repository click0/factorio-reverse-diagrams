import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'

// Evolution factors (per the wiki formula):
// evolution += time_factor * (1 - evolution) per tick
// evolution += pollution_factor * pollution_absorbed * (1 - evolution) per chunk absorbed
// evolution += destroy_factor per spawner destroyed

const TIME_FACTOR = 0.000004 // per tick
const POLLUTION_FACTOR = 0.0000009
const DESTROY_FACTOR = 0.002

// Unit spawn probability by evolution (simplified tiers)
const UNIT_TIERS = [
  { id: 'small-biter', color: '#8a6a3a', minEvo: 0, maxEvo: 0.5 },
  { id: 'medium-biter', color: '#c09030', minEvo: 0.15, maxEvo: 0.7 },
  { id: 'big-biter', color: '#e04040', minEvo: 0.3, maxEvo: 0.9 },
  { id: 'behemoth-biter', color: '#9c27b0', minEvo: 0.5, maxEvo: 1.0 },
  { id: 'small-spitter', color: '#4a8a4a', minEvo: 0.2, maxEvo: 0.6 },
  { id: 'medium-spitter', color: '#6ab06a', minEvo: 0.35, maxEvo: 0.75 },
  { id: 'big-spitter', color: '#40c040', minEvo: 0.5, maxEvo: 0.9 },
  { id: 'behemoth-spitter', color: '#20e0a0', minEvo: 0.65, maxEvo: 1.0 },
]

function simulateEvolution(hours: number, pollutionRate: number, spawnersDestroyed: number) {
  const points: { hour: number; evo: number }[] = []
  const tps = 60 // ticks per second
  const totalTicks = hours * 3600 * tps
  const step = Math.max(1, Math.floor(totalTicks / 500)) // max 500 data points
  let evo = 0

  for (let tick = 0; tick <= totalTicks; tick += step) {
    const hour = tick / (3600 * tps)
    points.push({ hour, evo })

    // Time contribution over step
    for (let s = 0; s < step; s++) {
      evo += TIME_FACTOR * (1 - evo)
    }

    // Pollution: simplified as continuous rate absorbed per tick
    const pollPerTick = pollutionRate / (60 * tps)
    for (let s = 0; s < step; s++) {
      evo += POLLUTION_FACTOR * pollPerTick * (1 - evo)
    }

    // Spawner destruction: distribute evenly across time
    const destroyPerStep = (spawnersDestroyed / totalTicks) * step
    evo += DESTROY_FACTOR * destroyPerStep

    evo = Math.min(1, evo)
  }

  return points
}

function getUnitComposition(evo: number): { id: string; color: string; weight: number }[] {
  const biters = UNIT_TIERS.filter(u => u.id.includes('biter'))
  const active = biters.filter(u => evo >= u.minEvo && evo <= u.maxEvo)
  if (active.length === 0) return [{ ...biters[0], weight: 1 }]
  const total = active.length
  return active.map(u => ({ ...u, weight: 1 / total }))
}

const CHART_W = 680
const CHART_H = 200
const CHART_PAD = 40

export default function EvolutionCurve() {
  const { t } = useTranslation()
  const [hours, setHours] = useState(10)
  const [pollutionRate, setPollutionRate] = useState(500)
  const [spawnersDestroyed, setSpawnersDestroyed] = useState(20)

  const data = useMemo(() => simulateEvolution(hours, pollutionRate, spawnersDestroyed), [hours, pollutionRate, spawnersDestroyed])
  const finalEvo = data.length > 0 ? data[data.length - 1].evo : 0
  const composition = useMemo(() => getUnitComposition(finalEvo), [finalEvo])

  const xScale = (h: number) => CHART_PAD + (h / hours) * (CHART_W - CHART_PAD * 2)
  const yScale = (e: number) => CHART_H - CHART_PAD - e * (CHART_H - CHART_PAD * 2)

  return (
    <div>
      <div className="controls-row">
        <div className="control-group">
          <label>{t('evolution.hours')}:</label>
          <input type="range" min={1} max={50} value={hours} onChange={(e) => setHours(Number(e.target.value))} />
          <span style={{ fontSize: 13, color: 'var(--text-secondary)', minWidth: 30 }}>{hours}h</span>
        </div>
        <div className="control-group">
          <label>{t('evolution.pollution')}:</label>
          <input type="range" min={0} max={5000} step={50} value={pollutionRate}
            onChange={(e) => setPollutionRate(Number(e.target.value))} />
          <span style={{ fontSize: 13, color: 'var(--text-secondary)', minWidth: 50 }}>{pollutionRate}/m</span>
        </div>
        <div className="control-group">
          <label>{t('evolution.spawners')}:</label>
          <input type="range" min={0} max={200} step={5} value={spawnersDestroyed}
            onChange={(e) => setSpawnersDestroyed(Number(e.target.value))} />
          <span style={{ fontSize: 13, color: 'var(--text-secondary)', minWidth: 30 }}>{spawnersDestroyed}</span>
        </div>
      </div>

      {/* Evolution curve */}
      <svg viewBox={`0 0 ${CHART_W} ${CHART_H}`} style={{ width: '100%', maxWidth: CHART_W, background: '#0d1117', borderRadius: 4, marginTop: 8 }}>
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map(e => (
          <g key={e}>
            <line x1={CHART_PAD} y1={yScale(e)} x2={CHART_W - CHART_PAD} y2={yScale(e)} stroke="#ffffff10" />
            <text x={CHART_PAD - 4} y={yScale(e) + 3} textAnchor="end" fill="#ffffff40" fontSize={9}>{(e * 100).toFixed(0)}%</text>
          </g>
        ))}

        {/* Evolution curve */}
        <polyline
          points={data.map(d => `${xScale(d.hour)},${yScale(d.evo)}`).join(' ')}
          fill="none" stroke="#f44336" strokeWidth={2} />

        {/* Threshold lines for unit tiers */}
        {[0.15, 0.3, 0.5, 0.65].map(e => (
          <line key={e} x1={CHART_PAD} y1={yScale(e)} x2={CHART_W - CHART_PAD} y2={yScale(e)}
            stroke="#ffffff15" strokeDasharray="3,3" />
        ))}

        {/* X axis labels */}
        {Array.from({ length: Math.min(hours, 10) + 1 }, (_, i) => Math.round(i * hours / Math.min(hours, 10))).map(h => (
          <text key={h} x={xScale(h)} y={CHART_H - 8} textAnchor="middle" fill="#ffffff40" fontSize={9}>{h}h</text>
        ))}
      </svg>

      {/* Results */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10, marginTop: 12 }}>
        <ResultCard label={t('evolution.finalEvo')} value={`${(finalEvo * 100).toFixed(1)}%`} color="#f44336" />
        <ResultCard label={t('evolution.timeFactor')} value={`${(TIME_FACTOR * 100000).toFixed(1)}`} color="#ffffff80" />
        <ResultCard label={t('evolution.pollFactor')} value={`${(POLLUTION_FACTOR * 1000000).toFixed(1)}`} color="#4caf50" />
      </div>

      {/* Unit composition bar */}
      <h4 style={{ color: '#f44336', marginTop: 16, fontSize: 14 }}>{t('evolution.unitComposition')} ({(finalEvo * 100).toFixed(0)}%)</h4>
      <div style={{ display: 'flex', height: 28, borderRadius: 4, overflow: 'hidden', marginTop: 6 }}>
        {composition.map((u, i) => (
          <div key={i} style={{ flex: u.weight, background: u.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 9, color: '#0d1117', fontWeight: 700 }}>{t(`evolution.unit.${u.id}`)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function ResultCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 6, padding: '10px 14px' }}>
      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{label}</div>
      <div style={{ fontSize: 18, color, fontWeight: 700, fontFamily: 'monospace' }}>{value}</div>
    </div>
  )
}
