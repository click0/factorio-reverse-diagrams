import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'

// Precise Factorio day/night timing (in ticks, 60 ticks = 1 second)
const TICKS_PER_DAY = 12500 // full daylight
const TICKS_DUSK = 2500 // dimming
const TICKS_NIGHT = 5000 // full darkness
const TICKS_DAWN = 2500 // brightening
const TOTAL_CYCLE = TICKS_PER_DAY + TICKS_DUSK + TICKS_NIGHT + TICKS_DAWN // 22500

const SOLAR_PEAK = 60 // kW
const ACCUMULATOR_CAP = 5000 // kJ

function getSolarOutput(tick: number): number {
  const t = tick % TOTAL_CYCLE
  if (t < TICKS_PER_DAY) return SOLAR_PEAK
  if (t < TICKS_PER_DAY + TICKS_DUSK) return SOLAR_PEAK * (1 - (t - TICKS_PER_DAY) / TICKS_DUSK)
  if (t < TICKS_PER_DAY + TICKS_DUSK + TICKS_NIGHT) return 0
  return SOLAR_PEAK * ((t - TICKS_PER_DAY - TICKS_DUSK - TICKS_NIGHT) / TICKS_DAWN)
}

function simulateCycle(panels: number, accumulators: number, loadKW: number) {
  const data: { tick: number; solar: number; load: number; accCharge: number; satisfied: boolean }[] = []
  let accEnergy = accumulators * ACCUMULATOR_CAP // start fully charged (kJ)
  const maxAccEnergy = accumulators * ACCUMULATOR_CAP
  const step = Math.max(1, Math.floor(TOTAL_CYCLE / 300))

  let unsatisfiedTicks = 0

  for (let tick = 0; tick <= TOTAL_CYCLE; tick += step) {
    const solarKW = getSolarOutput(tick) * panels / 1000 // MW
    const loadMW = loadKW / 1000
    const surplus = solarKW - loadMW

    if (surplus >= 0) {
      // Charge accumulators
      accEnergy = Math.min(maxAccEnergy, accEnergy + surplus * (step / 60) * 1000) // kJ
    } else {
      // Discharge accumulators
      const deficit = -surplus * (step / 60) * 1000 // kJ needed
      accEnergy -= deficit
    }

    const satisfied = accEnergy > 0
    if (!satisfied) unsatisfiedTicks += step

    data.push({
      tick,
      solar: solarKW * 1000, // back to kW for display
      load: loadKW,
      accCharge: Math.max(0, accEnergy / maxAccEnergy) * 100,
      satisfied,
    })

    accEnergy = Math.max(0, accEnergy)
  }

  return { data, unsatisfiedTicks, blackoutPercent: (unsatisfiedTicks / TOTAL_CYCLE) * 100 }
}

const CHART_W = 700
const CHART_H = 250
const CHART_PAD = 50

export default function SolarCurve() {
  const { t } = useTranslation()
  const [loadMW, setLoadMW] = useState(50)
  const [panels, setPanels] = useState(1200)
  const [accumulators, setAccumulators] = useState(1000)

  const loadKW = loadMW * 1000
  const { data, blackoutPercent } = useMemo(() => simulateCycle(panels, accumulators, loadKW), [panels, accumulators, loadKW])

  const xScale = (tick: number) => CHART_PAD + (tick / TOTAL_CYCLE) * (CHART_W - CHART_PAD * 2)
  const yScaleKW = (kw: number) => CHART_H - CHART_PAD - (kw / (loadKW * 1.5)) * (CHART_H - CHART_PAD * 2)
  const yScaleAcc = (pct: number) => CHART_H - CHART_PAD - (pct / 100) * (CHART_H - CHART_PAD * 2)

  const solarAvg = panels * SOLAR_PEAK * (TICKS_PER_DAY + TICKS_DUSK * 0.5 + TICKS_DAWN * 0.5) / TOTAL_CYCLE / 1000
  const optimalPanels = Math.ceil(loadKW / (SOLAR_PEAK * (TICKS_PER_DAY + TICKS_DUSK * 0.5 + TICKS_DAWN * 0.5) / TOTAL_CYCLE))
  const optimalAcc = Math.ceil(optimalPanels * 0.84)

  return (
    <div>
      <div className="controls-row">
        <div className="control-group">
          <label>{t('solar.load')}:</label>
          <input type="range" min={5} max={500} step={5} value={loadMW}
            onChange={(e) => setLoadMW(Number(e.target.value))} />
          <span style={{ fontSize: 13, color: 'var(--accent)', minWidth: 60, fontWeight: 700 }}>{loadMW} MW</span>
        </div>
      </div>
      <div className="controls-row">
        <div className="control-group">
          <label>{t('solar.panels')}:</label>
          <input type="range" min={100} max={10000} step={100} value={panels}
            onChange={(e) => setPanels(Number(e.target.value))} />
          <span style={{ fontSize: 13, color: 'var(--text-secondary)', minWidth: 50 }}>{panels}</span>
        </div>
        <div className="control-group">
          <label>{t('solar.accumulators')}:</label>
          <input type="range" min={0} max={10000} step={100} value={accumulators}
            onChange={(e) => setAccumulators(Number(e.target.value))} />
          <span style={{ fontSize: 13, color: 'var(--text-secondary)', minWidth: 50 }}>{accumulators}</span>
        </div>
      </div>

      {/* Chart */}
      <svg viewBox={`0 0 ${CHART_W} ${CHART_H}`} style={{ width: '100%', maxWidth: CHART_W, background: '#0d1117', borderRadius: 4, marginTop: 8 }}>
        {/* Night zone */}
        <rect x={xScale(TICKS_PER_DAY + TICKS_DUSK)} y={CHART_PAD / 2}
          width={xScale(TICKS_NIGHT) - CHART_PAD} height={CHART_H - CHART_PAD * 1.5}
          fill="#00000040" />
        <text x={xScale(TICKS_PER_DAY + TICKS_DUSK + TICKS_NIGHT / 2)} y={CHART_PAD - 4}
          textAnchor="middle" fill="#ffffff30" fontSize={9}>{t('solar.night')}</text>

        {/* Load line */}
        <line x1={CHART_PAD} y1={yScaleKW(loadKW)} x2={CHART_W - CHART_PAD} y2={yScaleKW(loadKW)}
          stroke="#f4433660" strokeWidth={1} strokeDasharray="6,3" />
        <text x={CHART_W - CHART_PAD + 4} y={yScaleKW(loadKW) + 3} fill="#f44336" fontSize={9}>{loadMW}MW</text>

        {/* Solar output curve */}
        <polyline points={data.map(d => `${xScale(d.tick)},${yScaleKW(d.solar)}`).join(' ')}
          fill="none" stroke="#ffc107" strokeWidth={2} />

        {/* Accumulator charge curve */}
        <polyline points={data.map(d => `${xScale(d.tick)},${yScaleAcc(d.accCharge)}`).join(' ')}
          fill="none" stroke="#4caf50" strokeWidth={1.5} strokeDasharray="4,2" />

        {/* Blackout zones */}
        {data.filter(d => !d.satisfied).map((d, i) => (
          <rect key={i} x={xScale(d.tick)} y={CHART_H - CHART_PAD - 3}
            width={Math.max(2, (CHART_W - CHART_PAD * 2) / data.length)} height={6}
            fill="#f44336" opacity={0.8} />
        ))}

        {/* Legend */}
        <line x1={CHART_PAD} y1={CHART_H - 8} x2={CHART_PAD + 20} y2={CHART_H - 8} stroke="#ffc107" strokeWidth={2} />
        <text x={CHART_PAD + 24} y={CHART_H - 5} fill="#ffffff60" fontSize={8}>{t('solar.solarOutput')}</text>
        <line x1={CHART_PAD + 100} y1={CHART_H - 8} x2={CHART_PAD + 120} y2={CHART_H - 8} stroke="#4caf50" strokeWidth={1.5} strokeDasharray="4,2" />
        <text x={CHART_PAD + 124} y={CHART_H - 5} fill="#ffffff60" fontSize={8}>{t('solar.accCharge')}</text>
      </svg>

      {/* Results */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10, marginTop: 12 }}>
        <Stat label={t('solar.avgOutput')} value={`${solarAvg.toFixed(1)} MW`} />
        <Stat label={t('solar.blackout')} value={`${blackoutPercent.toFixed(1)}%`} color={blackoutPercent > 0 ? '#f44336' : '#4caf50'} />
        <Stat label={t('solar.optPanels')} value={`${optimalPanels}`} />
        <Stat label={t('solar.optAcc')} value={`${optimalAcc}`} />
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
