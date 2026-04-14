import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'

const WAGON_CAPACITY = 25000 // units per fluid wagon
const PUMP_THROUGHPUT = 12000 // units/s per pump (Factorio 2.0)
const MAX_PUMPS = 3 // connections per wagon

function getPipeThroughput(distance: number): number {
  if (distance < 10) return 6000
  if (distance < 50) {
    // Linear interpolation 6000 -> 3000 over 10..50
    return 6000 - (distance - 10) * (3000 / 40)
  }
  if (distance < 200) {
    // Linear interpolation 3000 -> 1000 over 50..200
    return 3000 - (distance - 50) * (2000 / 150)
  }
  // 200+: interpolation 1000 -> 400 over 200..500
  return Math.max(400, 1000 - (distance - 200) * (600 / 300))
}

function getFillTime(pumps: number): number {
  return WAGON_CAPACITY / (pumps * PUMP_THROUGHPUT)
}

function getWagonThroughput(pumps: number, wagons: number, distance: number): number {
  const fillTime = getFillTime(pumps)
  // Transit time estimate: ~1.5 tiles/tick at 60 ticks/s => ~30 tiles/s average train speed
  // Round trip = 2 * distance / speed + loading + unloading
  const trainSpeed = 30 // tiles/s average
  const transitTime = (2 * distance) / trainSpeed
  const totalCycleTime = fillTime + transitTime + fillTime // fill + travel + unload + return
  const totalCapacity = wagons * WAGON_CAPACITY
  return totalCapacity / totalCycleTime
}

const SVG_W = 520
const SVG_H = 120
const BAR_W = 520
const BAR_H = 100

export default function FluidWagon() {
  const { t } = useTranslation()
  const [pumps, setPumps] = useState(2)
  const [wagons, setWagons] = useState(2)
  const [pipeDistance, setPipeDistance] = useState(50)

  const fillTime = useMemo(() => getFillTime(pumps), [pumps])
  const throughputPerWagon = useMemo(() => pumps * PUMP_THROUGHPUT, [pumps])
  const totalCapacity = useMemo(() => wagons * WAGON_CAPACITY, [wagons])

  const wagonThroughput = useMemo(
    () => getWagonThroughput(pumps, wagons, pipeDistance),
    [pumps, wagons, pipeDistance]
  )
  const pipeThroughput = useMemo(() => getPipeThroughput(pipeDistance), [pipeDistance])

  const wagonWins = wagonThroughput > pipeThroughput
  const maxThroughput = Math.max(wagonThroughput, pipeThroughput, 1)

  // SVG wagon drawing helpers
  const wagonX = 160
  const wagonY = 30
  const wagonW = 200
  const wagonH = 60

  return (
    <div>
      {/* Pump count selector */}
      <div className="controls-row">
        <div className="control-group">
          <label>{t('fluidWagon.pumps')}:</label>
          {[1, 2, 3].map((n) => (
            <button
              key={n}
              className={`btn ${pumps === n ? 'active' : ''}`}
              onClick={() => setPumps(n)}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Wagons slider */}
      <div className="controls-row">
        <div className="control-group">
          <label>{t('fluidWagon.wagons')}:</label>
          <input
            type="range"
            min={1}
            max={8}
            step={1}
            value={wagons}
            onChange={(e) => setWagons(Number(e.target.value))}
          />
          <span style={{ fontSize: 13, color: 'var(--accent)', minWidth: 30, fontWeight: 700 }}>
            {wagons}
          </span>
        </div>
        <div className="control-group">
          <label>{t('fluidWagon.pipeDistance')}:</label>
          <input
            type="range"
            min={1}
            max={500}
            step={1}
            value={pipeDistance}
            onChange={(e) => setPipeDistance(Number(e.target.value))}
          />
          <span style={{ fontSize: 13, color: 'var(--text-muted)', minWidth: 60 }}>
            {pipeDistance} {t('fluidWagon.tiles')}
          </span>
        </div>
      </div>

      {/* SVG wagon diagram */}
      <svg
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        style={{ width: '100%', maxWidth: SVG_W, background: '#0d1117', borderRadius: 4, marginTop: 8 }}
      >
        {/* Wagon body */}
        <rect
          x={wagonX}
          y={wagonY}
          width={wagonW}
          height={wagonH}
          rx={6}
          fill="#1a2233"
          stroke="#4080e0"
          strokeWidth={2}
        />
        {/* Wagon label */}
        <text
          x={wagonX + wagonW / 2}
          y={wagonY + wagonH / 2 + 4}
          textAnchor="middle"
          fill="#ffffffcc"
          fontSize={12}
          fontFamily="monospace"
        >
          {WAGON_CAPACITY.toLocaleString()} u
        </text>
        {/* Wheels */}
        <circle cx={wagonX + 30} cy={wagonY + wagonH + 6} r={6} fill="#333" stroke="#555" strokeWidth={1.5} />
        <circle cx={wagonX + wagonW - 30} cy={wagonY + wagonH + 6} r={6} fill="#333" stroke="#555" strokeWidth={1.5} />
        {/* Couplers */}
        <rect x={wagonX - 14} y={wagonY + wagonH / 2 - 4} width={14} height={8} rx={2} fill="#555" />
        <rect x={wagonX + wagonW} y={wagonY + wagonH / 2 - 4} width={14} height={8} rx={2} fill="#555" />

        {/* Pump connections */}
        {Array.from({ length: MAX_PUMPS }).map((_, i) => {
          const active = i < pumps
          const pumpX = wagonX + 40 + i * 65
          const pumpY = wagonY - 24
          return (
            <g key={i}>
              {/* Pump box */}
              <rect
                x={pumpX}
                y={pumpY}
                width={40}
                height={18}
                rx={3}
                fill={active ? '#1a3320' : '#1a1a1a'}
                stroke={active ? '#4caf50' : '#444'}
                strokeWidth={active ? 2 : 1}
              />
              <text
                x={pumpX + 20}
                y={pumpY + 13}
                textAnchor="middle"
                fill={active ? '#4caf50' : '#555'}
                fontSize={9}
                fontFamily="monospace"
              >
                PUMP
              </text>
              {/* Arrow from pump to wagon */}
              <line
                x1={pumpX + 20}
                y1={pumpY + 18}
                x2={pumpX + 20}
                y2={wagonY}
                stroke={active ? '#4caf50' : '#333'}
                strokeWidth={active ? 2 : 1}
                markerEnd={active ? 'url(#arrowGreen)' : undefined}
              />
            </g>
          )
        })}

        {/* Arrow marker definition */}
        <defs>
          <marker id="arrowGreen" markerWidth={8} markerHeight={6} refX={8} refY={3} orient="auto">
            <path d="M0,0 L8,3 L0,6 Z" fill="#4caf50" />
          </marker>
        </defs>
      </svg>

      {/* Comparison bar chart */}
      <div style={{ marginTop: 16 }}>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8, fontWeight: 600 }}>
          {t('fluidWagon.comparison')}
        </div>
        <svg
          viewBox={`0 0 ${BAR_W} ${BAR_H}`}
          style={{ width: '100%', maxWidth: BAR_W, background: '#0d1117', borderRadius: 4 }}
        >
          {/* Wagon throughput bar */}
          <text x={10} y={24} fill="#ffffffcc" fontSize={11} fontFamily="monospace">
            {t('fluidWagon.wagonThroughput')}
          </text>
          <rect
            x={10}
            y={30}
            width={Math.max(2, (wagonThroughput / maxThroughput) * (BAR_W - 120))}
            height={20}
            rx={3}
            fill={wagonWins ? '#4caf50' : '#4080e0'}
          />
          <text
            x={Math.max(2, (wagonThroughput / maxThroughput) * (BAR_W - 120)) + 16}
            y={44}
            fill="#ffffffcc"
            fontSize={11}
            fontFamily="monospace"
          >
            {wagonThroughput.toFixed(0)} {t('fluidWagon.unitsPerSec')}
          </text>

          {/* Pipe throughput bar */}
          <text x={10} y={68} fill="#ffffffcc" fontSize={11} fontFamily="monospace">
            {t('fluidWagon.pipeThroughput')}
          </text>
          <rect
            x={10}
            y={74}
            width={Math.max(2, (pipeThroughput / maxThroughput) * (BAR_W - 120))}
            height={20}
            rx={3}
            fill={!wagonWins ? '#4caf50' : '#e9a820'}
          />
          <text
            x={Math.max(2, (pipeThroughput / maxThroughput) * (BAR_W - 120)) + 16}
            y={88}
            fill="#ffffffcc"
            fontSize={11}
            fontFamily="monospace"
          >
            {pipeThroughput.toFixed(0)} {t('fluidWagon.unitsPerSec')}
          </text>
        </svg>

        {/* Winner label */}
        <div
          style={{
            marginTop: 8,
            padding: '6px 12px',
            borderRadius: 6,
            background: wagonWins ? '#1a3320' : '#33291a',
            border: `1px solid ${wagonWins ? '#4caf50' : '#e9a820'}`,
            color: wagonWins ? '#4caf50' : '#e9a820',
            fontSize: 13,
            fontWeight: 700,
            fontFamily: 'monospace',
            display: 'inline-block',
          }}
        >
          {wagonWins ? t('fluidWagon.wagonWins') : t('fluidWagon.pipeWins')}
        </div>
      </div>

      {/* Stats grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: 10,
          marginTop: 14,
        }}
      >
        <Stat label={t('fluidWagon.fillTime')} value={`${fillTime.toFixed(2)}s`} />
        <Stat label={t('fluidWagon.throughput')} value={`${throughputPerWagon.toLocaleString()} ${t('fluidWagon.unitsPerSec')}`} />
        <Stat label={t('fluidWagon.totalCapacity')} value={`${totalCapacity.toLocaleString()} u`} />
        <Stat
          label={t('fluidWagon.pipeThroughput')}
          value={`${pipeThroughput.toFixed(0)} ${t('fluidWagon.unitsPerSec')}`}
          color="#e9a820"
        />
      </div>
    </div>
  )
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 6,
        padding: '10px 14px',
      }}
    >
      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{label}</div>
      <div
        style={{
          fontSize: 16,
          color: color || 'var(--accent)',
          fontWeight: 700,
          fontFamily: 'monospace',
        }}
      >
        {value}
      </div>
    </div>
  )
}
