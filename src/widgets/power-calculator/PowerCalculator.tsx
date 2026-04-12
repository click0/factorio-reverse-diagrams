import { useState } from 'react'
import { useTranslation } from 'react-i18next'

interface PowerSource {
  id: string
  perUnit: number // kW per unit
  pollution: number // per minute
}

const SOLAR_OUTPUT = 60 // kW peak
const ACCUMULATOR_CAPACITY = 5000 // kJ
const DAY_TICKS = 25000
const DUSK_TICKS = 5000
const NIGHT_TICKS = 12500
const DAWN_TICKS = 2500
const TOTAL_CYCLE = DAY_TICKS + DUSK_TICKS + NIGHT_TICKS + DAWN_TICKS // 45000

// Solar average: ~42kW accounting for day/night cycle
const SOLAR_AVERAGE = SOLAR_OUTPUT * (DAY_TICKS + DUSK_TICKS * 0.5 + DAWN_TICKS * 0.5) / TOTAL_CYCLE

// Accumulators needed per solar panel to cover night
const ACC_PER_SOLAR = 0.84

const NUCLEAR_REACTOR_OUTPUT = 40000 // kW (40MW)
const NEIGHBOR_BONUS = 1.0 // +100% per adjacent reactor

function calcNuclearOutput(reactors: number, layout: 'line' | '2x2' | '2xN'): number {
  if (reactors <= 0) return 0
  if (reactors === 1) return NUCLEAR_REACTOR_OUTPUT
  if (layout === '2x2' && reactors >= 4) {
    // 2x2: corners have 2 neighbors, total bonus
    return NUCLEAR_REACTOR_OUTPUT * reactors * (1 + NEIGHBOR_BONUS * 2 * (4 / reactors))
  }
  if (layout === '2xN') {
    // 2xN: end reactors have 2 neighbors, middle have 3
    const ends = 4
    const middles = Math.max(0, reactors - 4)
    return NUCLEAR_REACTOR_OUTPUT * (ends * (1 + NEIGHBOR_BONUS * 2) + middles * (1 + NEIGHBOR_BONUS * 3))
  }
  // Line: each reactor (except ends) has 2 neighbors
  const ends = 2
  const middles = Math.max(0, reactors - 2)
  return NUCLEAR_REACTOR_OUTPUT * (ends * (1 + NEIGHBOR_BONUS * 1) + middles * (1 + NEIGHBOR_BONUS * 2))
}

export default function PowerCalculator() {
  const { t } = useTranslation()
  const [targetMW, setTargetMW] = useState(100)
  const [nuclearReactors, setNuclearReactors] = useState(4)
  const [nuclearLayout, setNuclearLayout] = useState<'line' | '2x2' | '2xN'>('2xN')

  // Solar calculations
  const solarPanels = Math.ceil((targetMW * 1000) / SOLAR_AVERAGE)
  const accumulators = Math.ceil(solarPanels * ACC_PER_SOLAR)

  // Nuclear calculations
  const nuclearOutput = calcNuclearOutput(nuclearReactors, nuclearLayout)
  const heatExchangers = Math.ceil(nuclearOutput / 10000) // 10MW per heat exchanger
  const steamTurbines = Math.ceil(nuclearOutput / 5820) // 5.82MW per turbine
  const offshorePumps = Math.ceil(steamTurbines / 20) // ~20 turbines per pump

  // Day/night cycle data for chart
  const cycleData = []
  const steps = 90
  for (let i = 0; i <= steps; i++) {
    const tick = (i / steps) * TOTAL_CYCLE
    let solarFactor = 0
    if (tick < DAY_TICKS) solarFactor = 1
    else if (tick < DAY_TICKS + DUSK_TICKS) solarFactor = 1 - (tick - DAY_TICKS) / DUSK_TICKS
    else if (tick < DAY_TICKS + DUSK_TICKS + NIGHT_TICKS) solarFactor = 0
    else solarFactor = (tick - DAY_TICKS - DUSK_TICKS - NIGHT_TICKS) / DAWN_TICKS
    cycleData.push({ tick: Math.round(tick), solar: solarFactor * 100 })
  }

  return (
    <div>
      <div className="controls-row">
        <div className="control-group">
          <label>{t('power.target')}:</label>
          <input type="range" min={10} max={1000} step={10} value={targetMW}
            onChange={(e) => setTargetMW(Number(e.target.value))} />
          <span style={{ fontSize: 13, color: 'var(--accent)', minWidth: 60, fontWeight: 700 }}>{targetMW} MW</span>
        </div>
      </div>

      {/* Solar section */}
      <h4 style={{ color: '#ffc107', marginTop: 16, fontSize: 14 }}>{t('power.solar')}</h4>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10, marginTop: 8 }}>
        <Card label={t('power.solarPanels')} value={solarPanels.toLocaleString()} />
        <Card label={t('power.accumulators')} value={accumulators.toLocaleString()} />
        <Card label={t('power.ratio')} value={`1 : ${ACC_PER_SOLAR}`} sub={t('power.solarToAcc')} />
        <Card label={t('power.avgOutput')} value={`${(SOLAR_AVERAGE / 1000).toFixed(2)} kW`} sub={t('power.perPanel')} />
      </div>

      {/* Day/Night cycle visualization */}
      <div style={{ marginTop: 12, background: '#0d1117', borderRadius: 4, padding: 12, height: 100, position: 'relative' }}>
        <svg viewBox={`0 0 ${steps} 100`} preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
          <defs>
            <linearGradient id="solar-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffc107" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#ffc107" stopOpacity="0.05" />
            </linearGradient>
          </defs>
          <path d={`M 0 100 ${cycleData.map((d, i) => `L ${i} ${100 - d.solar}`).join(' ')} L ${steps} 100 Z`}
            fill="url(#solar-fill)" />
          <polyline points={cycleData.map((d, i) => `${i},${100 - d.solar}`).join(' ')}
            fill="none" stroke="#ffc107" strokeWidth="1.5" />
        </svg>
        <div style={{ position: 'absolute', bottom: 4, left: 12, fontSize: 10, color: '#ffffff50' }}>
          {t('power.dayNight')}
        </div>
      </div>

      {/* Nuclear section */}
      <h4 style={{ color: '#4caf50', marginTop: 20, fontSize: 14 }}>{t('power.nuclear')}</h4>
      <div className="controls-row">
        <div className="control-group">
          <label>{t('power.reactors')}:</label>
          <input type="range" min={1} max={20} value={nuclearReactors}
            onChange={(e) => setNuclearReactors(Number(e.target.value))} />
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{nuclearReactors}</span>
        </div>
        <div className="control-group">
          <label>{t('power.layout')}:</label>
          {(['line', '2x2', '2xN'] as const).map(l => (
            <button key={l} className={`btn ${nuclearLayout === l ? 'active' : ''}`}
              onClick={() => setNuclearLayout(l)}>{l}</button>
          ))}
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10, marginTop: 8 }}>
        <Card label={t('power.totalOutput')} value={`${(nuclearOutput / 1000).toFixed(1)} MW`} />
        <Card label={t('power.heatExchangers')} value={heatExchangers.toString()} />
        <Card label={t('power.steamTurbines')} value={steamTurbines.toString()} />
        <Card label={t('power.offshorePumps')} value={offshorePumps.toString()} />
      </div>
    </div>
  )
}

function Card({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 6, padding: '10px 14px' }}>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 18, color: 'var(--accent)', fontWeight: 700, fontFamily: 'monospace' }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{sub}</div>}
    </div>
  )
}
