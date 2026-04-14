import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'

interface FuelType {
  id: string
  labelKey: string
  energy: number // MJ
  energyLabel: string
  speedBonus: number
  accelBonus: number
  color: string
}

interface Vehicle {
  id: string
  labelKey: string
  baseSpeed: number // km/h
  electric: boolean
}

const FUEL_TYPES: FuelType[] = [
  { id: 'wood', labelKey: 'vehicleFuel.wood', energy: 2, energyLabel: '2 MJ', speedBonus: 0, accelBonus: 0, color: '#8d6e63' },
  { id: 'coal', labelKey: 'vehicleFuel.coal', energy: 4, energyLabel: '4 MJ', speedBonus: 0, accelBonus: 0, color: '#424242' },
  { id: 'solidFuel', labelKey: 'vehicleFuel.solidFuel', energy: 12, energyLabel: '12 MJ', speedBonus: 0.2, accelBonus: 0.2, color: '#78909c' },
  { id: 'rocketFuel', labelKey: 'vehicleFuel.rocketFuel', energy: 100, energyLabel: '100 MJ', speedBonus: 0.8, accelBonus: 0.8, color: '#ef5350' },
  { id: 'nuclearFuel', labelKey: 'vehicleFuel.nuclearFuel', energy: 1210, energyLabel: '1.21 GJ', speedBonus: 1.5, accelBonus: 1.5, color: '#66bb6a' },
]

const VEHICLES: Vehicle[] = [
  { id: 'car', labelKey: 'vehicleFuel.car', baseSpeed: 123, electric: false },
  { id: 'tank', labelKey: 'vehicleFuel.tank', baseSpeed: 57, electric: false },
  { id: 'locomotive', labelKey: 'vehicleFuel.locomotive', baseSpeed: 259, electric: false },
  { id: 'spidertron', labelKey: 'vehicleFuel.spidertron', baseSpeed: 54, electric: true },
]

// Base consumption rates in MJ/s (approximate)
const BASE_CONSUMPTION: Record<string, number> = {
  car: 0.6,
  tank: 0.8,
  locomotive: 1.2,
  spidertron: 0,
}

function formatTime(seconds: number): string {
  if (seconds === Infinity || isNaN(seconds)) return '—'
  if (seconds < 60) return `${seconds.toFixed(1)}s`
  if (seconds < 3600) {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}m ${secs}s`
  }
  const hrs = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  return `${hrs}h ${mins}m`
}

export default function VehicleFuel() {
  const { t } = useTranslation()
  const [vehicleIdx, setVehicleIdx] = useState(0)
  const [fuelIdx, setFuelIdx] = useState(2) // solid fuel default

  const vehicle = VEHICLES[vehicleIdx]
  const fuel = FUEL_TYPES[fuelIdx]

  const results = useMemo(() => {
    const isElectric = vehicle.electric
    const speedBonus = isElectric ? 0 : fuel.speedBonus
    const accelBonus = isElectric ? 0 : fuel.accelBonus
    const effectiveSpeed = vehicle.baseSpeed * (1 + speedBonus)
    const consumption = BASE_CONSUMPTION[vehicle.id] || 0
    const runtime = consumption > 0 ? fuel.energy / consumption : Infinity

    return { speedBonus, accelBonus, effectiveSpeed, consumption, runtime, isElectric }
  }, [vehicle, fuel])

  // Compute max speed across all fuels for bar chart scaling
  const maxEffectiveSpeed = useMemo(() => {
    if (vehicle.electric) return vehicle.baseSpeed
    return Math.max(...FUEL_TYPES.map(f => vehicle.baseSpeed * (1 + f.speedBonus)))
  }, [vehicle])

  const SVG_WIDTH = 360
  const SVG_HEIGHT = FUEL_TYPES.length * 36 + 10
  const BAR_HEIGHT = 24
  const LABEL_WIDTH = 90
  const BAR_MAX_WIDTH = SVG_WIDTH - LABEL_WIDTH - 60

  return (
    <div>
      {/* Vehicle selector */}
      <div className="controls-row">
        <div className="control-group">
          <label>{t('vehicleFuel.vehicle')}:</label>
          {VEHICLES.map((v, i) => (
            <button
              key={v.id}
              className={`btn ${i === vehicleIdx ? 'active' : ''}`}
              style={i === vehicleIdx ? { borderColor: 'var(--accent)', color: 'var(--accent)' } : {}}
              onClick={() => setVehicleIdx(i)}
            >
              {t(v.labelKey)}
            </button>
          ))}
        </div>
      </div>

      {/* Fuel selector */}
      <div className="controls-row">
        <div className="control-group">
          <label>{t('vehicleFuel.fuel')}:</label>
          {FUEL_TYPES.map((f, i) => (
            <button
              key={f.id}
              className={`btn ${i === fuelIdx ? 'active' : ''}`}
              style={i === fuelIdx ? { borderColor: f.color, color: f.color } : {}}
              onClick={() => setFuelIdx(i)}
            >
              {t(f.labelKey)}
            </button>
          ))}
        </div>
      </div>

      {/* Stat boxes */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10, marginTop: 12 }}>
        <Stat label={t('vehicleFuel.vehicle')} value={t(vehicle.labelKey)} color="var(--accent)" />
        <Stat
          label={t('vehicleFuel.fuel')}
          value={results.isElectric ? t('vehicleFuel.electric') : t(fuel.labelKey)}
          color={results.isElectric ? 'var(--text-muted)' : fuel.color}
        />
        <Stat
          label={t('vehicleFuel.effectiveSpeed')}
          value={results.isElectric ? `${vehicle.baseSpeed} ${t('vehicleFuel.kmh')}` : `${results.effectiveSpeed.toFixed(1)} ${t('vehicleFuel.kmh')}`}
          color="#4caf50"
        />
        <Stat
          label={t('vehicleFuel.speedBonus')}
          value={results.isElectric ? t('vehicleFuel.noBonus') : `+${(results.speedBonus * 100).toFixed(0)}%`}
          color={results.speedBonus > 0 ? '#ff9800' : 'var(--text-muted)'}
        />
      </div>

      {/* Fuel comparison table */}
      <div style={{ marginTop: 16, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <th style={thStyle}>{t('vehicleFuel.fuel')}</th>
              <th style={thStyle}>{t('vehicleFuel.fuelEnergy')}</th>
              <th style={thStyle}>{t('vehicleFuel.speedBonus')}</th>
              <th style={thStyle}>{t('vehicleFuel.accelBonus')}</th>
              <th style={thStyle}>{t('vehicleFuel.effectiveSpeed')}</th>
              <th style={thStyle}>{t('vehicleFuel.consumption')}</th>
            </tr>
          </thead>
          <tbody>
            {FUEL_TYPES.map((f, i) => {
              const isElectric = vehicle.electric
              const bonus = isElectric ? 0 : f.speedBonus
              const accel = isElectric ? 0 : f.accelBonus
              const effSpeed = vehicle.baseSpeed * (1 + bonus)
              const consumption = BASE_CONSUMPTION[vehicle.id] || 0
              const runtime = consumption > 0 ? f.energy / consumption : Infinity
              const isActive = i === fuelIdx

              return (
                <tr
                  key={f.id}
                  style={{
                    borderBottom: '1px solid var(--border)',
                    background: isActive ? `${f.color}15` : 'transparent',
                    cursor: 'pointer',
                  }}
                  onClick={() => setFuelIdx(i)}
                >
                  <td style={{ ...tdStyle, color: f.color, fontWeight: isActive ? 700 : 400 }}>
                    {t(f.labelKey)}
                  </td>
                  <td style={tdStyle}>{f.energyLabel}</td>
                  <td style={tdStyle}>
                    {isElectric
                      ? t('vehicleFuel.noBonus')
                      : bonus > 0
                        ? `+${(bonus * 100).toFixed(0)}%`
                        : '0%'}
                  </td>
                  <td style={tdStyle}>
                    {isElectric
                      ? t('vehicleFuel.noBonus')
                      : accel > 0
                        ? `+${(accel * 100).toFixed(0)}%`
                        : '0%'}
                  </td>
                  <td style={{ ...tdStyle, color: 'var(--accent)', fontWeight: 700 }}>
                    {isElectric
                      ? `${vehicle.baseSpeed} ${t('vehicleFuel.kmh')}`
                      : `${effSpeed.toFixed(1)} ${t('vehicleFuel.kmh')}`}
                  </td>
                  <td style={tdStyle}>{isElectric ? t('vehicleFuel.electric') : formatTime(runtime)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* SVG bar chart */}
      <div style={{ marginTop: 16, background: '#0d1117', borderRadius: 4, padding: 12 }}>
        <div style={{ fontSize: 10, color: '#ffffff50', marginBottom: 6 }}>
          {t('vehicleFuel.effectiveSpeed')} — {t(vehicle.labelKey)}
        </div>
        <svg width="100%" viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`} style={{ display: 'block' }}>
          {FUEL_TYPES.map((f, i) => {
            const bonus = vehicle.electric ? 0 : f.speedBonus
            const effSpeed = vehicle.baseSpeed * (1 + bonus)
            const barWidth = maxEffectiveSpeed > 0 ? (effSpeed / maxEffectiveSpeed) * BAR_MAX_WIDTH : 0
            const y = i * 36 + 5
            const isActive = i === fuelIdx

            return (
              <g key={f.id} style={{ cursor: 'pointer' }} onClick={() => setFuelIdx(i)}>
                {/* Label */}
                <text
                  x={LABEL_WIDTH - 6}
                  y={y + BAR_HEIGHT / 2 + 4}
                  textAnchor="end"
                  fill={isActive ? f.color : '#ffffff80'}
                  fontSize={11}
                  fontWeight={isActive ? 700 : 400}
                >
                  {t(f.labelKey)}
                </text>
                {/* Bar background */}
                <rect
                  x={LABEL_WIDTH}
                  y={y}
                  width={BAR_MAX_WIDTH}
                  height={BAR_HEIGHT}
                  rx={3}
                  fill="#ffffff08"
                />
                {/* Bar fill */}
                <rect
                  x={LABEL_WIDTH}
                  y={y}
                  width={barWidth}
                  height={BAR_HEIGHT}
                  rx={3}
                  fill={f.color}
                  opacity={isActive ? 0.9 : 0.5}
                />
                {/* Speed label */}
                <text
                  x={LABEL_WIDTH + barWidth + 6}
                  y={y + BAR_HEIGHT / 2 + 4}
                  fill="#ffffffcc"
                  fontSize={11}
                  fontFamily="monospace"
                >
                  {effSpeed.toFixed(1)} {t('vehicleFuel.kmh')}
                </text>
              </g>
            )
          })}
        </svg>
      </div>
    </div>
  )
}

const thStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '6px 10px',
  color: 'var(--text-muted)',
  fontSize: 11,
  fontWeight: 600,
}

const tdStyle: React.CSSProperties = {
  padding: '6px 10px',
  fontFamily: 'monospace',
  fontSize: 13,
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 6, padding: '10px 14px' }}>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 18, color: color || 'var(--accent)', fontWeight: 700, fontFamily: 'monospace' }}>{value}</div>
    </div>
  )
}
