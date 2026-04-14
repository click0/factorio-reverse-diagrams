import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'

// Factorio 2.0 steam power constants
const BOILER_CONSUMPTION_MW = 1.8 // MW fuel consumed per boiler
const BOILER_WATER_RATE = 60 // water/s consumed and output as steam
const STEAM_ENGINE_OUTPUT_KW = 900 // kW per steam engine
const STEAM_ENGINE_STEAM_RATE = 30 // steam/s consumed per engine
const OFFSHORE_PUMP_RATE = 1200 // water/s per offshore pump

// Perfect ratio: 1 pump : 20 boilers : 40 engines = 36 MW
const PERFECT_RATIO_PUMPS = 1
const PERFECT_RATIO_BOILERS = 20
const PERFECT_RATIO_ENGINES = 40
const PERFECT_RATIO_MW = 36

// Fuel values in MJ
const FUELS: { id: string; key: string; mj: number }[] = [
  { id: 'wood', key: 'steam.wood', mj: 2 },
  { id: 'coal', key: 'steam.coal', mj: 4 },
  { id: 'solid_fuel', key: 'steam.solidFuel', mj: 12 },
  { id: 'rocket_fuel', key: 'steam.rocketFuel', mj: 100 },
  { id: 'nuclear_fuel', key: 'steam.nuclearFuel', mj: 1210 },
]

// SVG layout constants
const SVG_W = 600
const SVG_H = 160

function calculateSteamSetup(targetMW: number) {
  // Steam engines needed (each produces 900 kW = 0.9 MW)
  const engines = Math.ceil((targetMW * 1000) / STEAM_ENGINE_OUTPUT_KW)

  // Boilers needed: each feeds 2 steam engines (60 steam/s output, 30 steam/s per engine)
  const boilers = Math.ceil(engines / 2)

  // Offshore pumps needed: each supplies 1200 water/s, each boiler needs 60 water/s
  const pumps = Math.ceil((boilers * BOILER_WATER_RATE) / OFFSHORE_PUMP_RATE)

  // Actual power output
  const actualMW = (engines * STEAM_ENGINE_OUTPUT_KW) / 1000

  // Efficiency: how close to perfect ratio alignment
  // Check if we're at a perfect multiple
  const perfectMultiple = targetMW / PERFECT_RATIO_MW
  const nearestPerfect = Math.round(perfectMultiple)
  const perfectEngines = nearestPerfect * PERFECT_RATIO_ENGINES
  const efficiency = perfectEngines > 0
    ? Math.min(100, (targetMW / (nearestPerfect * PERFECT_RATIO_MW)) * 100)
    : 100

  // Water consumption
  const waterPerSec = boilers * BOILER_WATER_RATE

  return { engines, boilers, pumps, actualMW, efficiency, waterPerSec }
}

export default function PowerSteam() {
  const { t } = useTranslation()
  const [targetMW, setTargetMW] = useState(36)
  const [fuelIndex, setFuelIndex] = useState(1) // default: coal

  const fuel = FUELS[fuelIndex]

  const { engines, boilers, pumps, actualMW, efficiency, waterPerSec } = useMemo(
    () => calculateSteamSetup(targetMW),
    [targetMW]
  )

  // Fuel consumption: each boiler consumes 1.8 MW = 1.8 MJ/s of fuel
  const fuelPerSecPerBoiler = BOILER_CONSUMPTION_MW / fuel.mj
  const totalFuelPerSec = useMemo(
    () => fuelPerSecPerBoiler * boilers,
    [fuelPerSecPerBoiler, boilers]
  )

  // Ratios for display
  const ratioStr = `${pumps} : ${boilers} : ${engines}`

  return (
    <div>
      {/* Target power slider */}
      <div className="controls-row">
        <div className="control-group">
          <label>{t('steam.targetPower')}:</label>
          <input
            type="range"
            min={1}
            max={360}
            step={1}
            value={targetMW}
            onChange={(e) => setTargetMW(Number(e.target.value))}
          />
          <span style={{ fontSize: 13, color: 'var(--accent)', minWidth: 60, fontWeight: 700 }}>
            {targetMW} MW
          </span>
        </div>
      </div>

      {/* Fuel type selector */}
      <div className="controls-row">
        <div className="control-group">
          <label>{t('steam.fuelType')}:</label>
          {FUELS.map((f, i) => (
            <button
              key={f.id}
              className={`btn ${fuelIndex === i ? 'active' : ''}`}
              onClick={() => setFuelIndex(i)}
            >
              {t(f.key)}
            </button>
          ))}
        </div>
      </div>

      {/* SVG chain visualization */}
      <svg
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        style={{ width: '100%', maxWidth: SVG_W, background: '#0d1117', borderRadius: 4, marginTop: 8 }}
      >
        {/* Pump box */}
        <rect x={30} y={50} width={120} height={60} rx={6} fill="#42a5f5" opacity={0.85} />
        <text x={90} y={74} textAnchor="middle" fill="#fff" fontSize={13} fontWeight={700}>
          {t('steam.pumps')}
        </text>
        <text x={90} y={96} textAnchor="middle" fill="#fff" fontSize={22} fontWeight={700} fontFamily="monospace">
          {pumps}
        </text>

        {/* Arrow pump → boiler */}
        <line x1={150} y1={80} x2={200} y2={80} stroke="#ffffff60" strokeWidth={2} />
        <polygon points="198,74 210,80 198,86" fill="#ffffff60" />
        <text x={180} y={68} textAnchor="middle" fill="#ffffff50" fontSize={9}>
          {waterPerSec} {t('steam.waterPerSec')}
        </text>

        {/* Boiler box */}
        <rect x={210} y={50} width={120} height={60} rx={6} fill="#ff8f00" opacity={0.85} />
        <text x={270} y={74} textAnchor="middle" fill="#fff" fontSize={13} fontWeight={700}>
          {t('steam.boilers')}
        </text>
        <text x={270} y={96} textAnchor="middle" fill="#fff" fontSize={22} fontWeight={700} fontFamily="monospace">
          {boilers}
        </text>

        {/* Arrow boiler → engine */}
        <line x1={330} y1={80} x2={380} y2={80} stroke="#ffffff60" strokeWidth={2} />
        <polygon points="378,74 390,80 378,86" fill="#ffffff60" />
        <text x={360} y={68} textAnchor="middle" fill="#ffffff50" fontSize={9}>
          steam
        </text>

        {/* Engine box */}
        <rect x={390} y={50} width={140} height={60} rx={6} fill="#ffd54f" opacity={0.85} />
        <text x={460} y={74} textAnchor="middle" fill="#333" fontSize={13} fontWeight={700}>
          {t('steam.engines')}
        </text>
        <text x={460} y={96} textAnchor="middle" fill="#333" fontSize={22} fontWeight={700} fontFamily="monospace">
          {engines}
        </text>

        {/* Output arrow */}
        <line x1={530} y1={80} x2={570} y2={80} stroke="#4caf50" strokeWidth={2} />
        <polygon points="568,74 580,80 568,86" fill="#4caf50" />
        <text x={580} y={68} textAnchor="end" fill="#4caf50" fontSize={10} fontWeight={700}>
          {actualMW} MW
        </text>

        {/* Fuel input arrow to boiler */}
        <line x1={270} y1={130} x2={270} y2={112} stroke="#ff572280" strokeWidth={1.5} />
        <polygon points="264,114 270,110 276,114" fill="#ff572280" />
        <text x={270} y={145} textAnchor="middle" fill="#ff5722" fontSize={10}>
          {totalFuelPerSec.toFixed(2)} {t(fuel.key)}/s
        </text>
      </svg>

      {/* Stat boxes */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10, marginTop: 12 }}>
        <Stat label={t('steam.targetPower')} value={`${targetMW} MW`} />
        <Stat label={t('steam.pumps')} value={`${pumps}`} color="#42a5f5" />
        <Stat label={t('steam.boilers')} value={`${boilers}`} color="#ff8f00" />
        <Stat label={t('steam.engines')} value={`${engines}`} color="#ffd54f" />
        <Stat label={t('steam.fuelPerSec')} value={`${totalFuelPerSec.toFixed(2)}/s`} sub={t(fuel.key)} />
        <Stat label={t('steam.ratio')} value={ratioStr} sub={`${t('steam.pumps')} : ${t('steam.boilers')} : ${t('steam.engines')}`} />
        <Stat
          label={t('steam.efficiency')}
          value={`${efficiency.toFixed(1)}%`}
          color={efficiency >= 99.9 ? '#4caf50' : '#ff9800'}
        />
        <Stat label={t('steam.waterPerSec')} value={`${waterPerSec}/s`} />
      </div>
    </div>
  )
}

function Stat({ label, value, color, sub }: { label: string; value: string; color?: string; sub?: string }) {
  return (
    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 6, padding: '10px 14px' }}>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 18, color: color || 'var(--accent)', fontWeight: 700, fontFamily: 'monospace' }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{sub}</div>}
    </div>
  )
}
