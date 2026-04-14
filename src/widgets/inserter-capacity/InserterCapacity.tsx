import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'

// Swing time for stack/bulk inserters: 26 ticks = 0.433s at 60 UPS
const SWING_TICKS = 26
const SWING_TIME_S = SWING_TICKS / 60

// Swing times per inserter type (full cycle = pickup + swing + drop + swing)
// For throughput we use items_per_swing / swing_time as a simplified model
const INSERTER_SWING_TICKS: Record<string, number> = {
  burner: 52,
  basic: 26,
  longHanded: 40,
  fast: 17,
  stack: 26,
  bulk: 26,
}

// Stack inserter capacity by research level (Factorio 2.0)
const STACK_CAPACITY = [1, 2, 3, 4, 5, 7, 10, 12]

// Bulk inserter capacity by research level (Space Age)
const BULK_CAPACITY = [1, 2, 3, 4, 5, 8, 12, 16]

// Research costs per level
const RESEARCH_COSTS: { level: number; packs: number; sciences: string }[] = [
  { level: 0, packs: 0, sciences: '-' },
  { level: 1, packs: 50, sciences: 'Red + Green' },
  { level: 2, packs: 200, sciences: 'Red + Green + Black' },
  { level: 3, packs: 300, sciences: 'Red + Green + Black + Blue' },
  { level: 4, packs: 500, sciences: 'All' },
  { level: 5, packs: 0, sciences: 'Space Age' },
  { level: 6, packs: 0, sciences: 'Space Age' },
  { level: 7, packs: 0, sciences: 'Space Age' },
]

interface InserterRow {
  id: string
  color: string
  stackSize: number
  swingTicks: number
  throughput: number
}

const COLORS: Record<string, string> = {
  burner: '#8a6a3a',
  basic: '#e0a020',
  longHanded: '#e04040',
  fast: '#4080e0',
  stack: '#40e080',
  bulk: '#9c27b0',
}

function buildRows(level: number): InserterRow[] {
  const fixed = ['burner', 'basic', 'longHanded', 'fast']
  const rows: InserterRow[] = fixed.map((id) => {
    const swingTicks = INSERTER_SWING_TICKS[id]
    const stackSize = 1
    const throughput = (stackSize / swingTicks) * 60
    return { id, color: COLORS[id], stackSize, swingTicks, throughput }
  })

  const stackSize = STACK_CAPACITY[level]
  const stackSwing = INSERTER_SWING_TICKS.stack
  rows.push({
    id: 'stack',
    color: COLORS.stack,
    stackSize,
    swingTicks: stackSwing,
    throughput: (stackSize / stackSwing) * 60,
  })

  const bulkSize = BULK_CAPACITY[level]
  const bulkSwing = INSERTER_SWING_TICKS.bulk
  rows.push({
    id: 'bulk',
    color: COLORS.bulk,
    stackSize: bulkSize,
    swingTicks: bulkSwing,
    throughput: (bulkSize / bulkSwing) * 60,
  })

  return rows
}

const CHART_W = 600
const CHART_H = 180
const BAR_PAD = 60

export default function InserterCapacity() {
  const { t } = useTranslation()
  const [level, setLevel] = useState(4)

  const rows = useMemo(() => buildRows(level), [level])
  const prevRows = useMemo(() => (level > 0 ? buildRows(level - 1) : null), [level])

  const maxThroughput = useMemo(
    () => Math.max(...rows.map((r) => r.throughput), 1),
    [rows]
  )

  const cost = RESEARCH_COSTS[level]

  const barH = 18
  const barGap = 6
  const chartInnerH = rows.length * (barH + barGap)
  const svgH = chartInnerH + 40

  return (
    <div>
      {/* Research Level Slider */}
      <div className="controls-row">
        <div className="control-group">
          <label>{t('inserterCap.researchLevel')}:</label>
          <input
            type="range"
            min={0}
            max={7}
            step={1}
            value={level}
            onChange={(e) => setLevel(Number(e.target.value))}
          />
          <span
            style={{
              fontSize: 13,
              color: 'var(--text-secondary)',
              minWidth: 60,
              fontFamily: 'monospace',
            }}
          >
            {t('inserterCap.level')} {level}
          </span>
        </div>
      </div>

      {/* Research cost info */}
      {level > 0 && (
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: 6,
            padding: '8px 14px',
            marginTop: 8,
            fontSize: 13,
            color: 'var(--text-muted)',
          }}
        >
          {t('inserterCap.researchCost')}: {cost.packs > 0 ? `${cost.packs} x ${cost.sciences}` : cost.sciences}
        </div>
      )}

      {/* Data Table */}
      <div style={{ overflowX: 'auto', marginTop: 12 }}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: 13,
            fontFamily: 'monospace',
          }}
        >
          <thead>
            <tr
              style={{
                borderBottom: '2px solid var(--border)',
                color: 'var(--text-muted)',
                fontSize: 11,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
              }}
            >
              <th style={{ textAlign: 'left', padding: '8px 12px' }}>
                {t('inserterCap.inserterType')}
              </th>
              <th style={{ textAlign: 'right', padding: '8px 12px' }}>
                {t('inserterCap.stackSize')}
              </th>
              <th style={{ textAlign: 'right', padding: '8px 12px' }}>
                {t('inserterCap.throughput')} ({t('inserterCap.itemsPerSec')})
              </th>
              <th style={{ textAlign: 'right', padding: '8px 12px' }}>
                {t('inserterCap.swingTime')} ({t('inserterCap.ticks')})
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const isVariable = row.id === 'stack' || row.id === 'bulk'
              const isHighlight = isVariable && level > 0
              return (
                <tr
                  key={row.id}
                  style={{
                    borderBottom: '1px solid var(--border)',
                    background: isHighlight ? 'var(--bg-surface)' : 'transparent',
                  }}
                >
                  <td style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span
                      style={{
                        display: 'inline-block',
                        width: 10,
                        height: 10,
                        borderRadius: 2,
                        background: row.color,
                        flexShrink: 0,
                      }}
                    />
                    {t(`inserterCap.${row.id}`)}
                  </td>
                  <td
                    style={{
                      textAlign: 'right',
                      padding: '8px 12px',
                      color: isHighlight ? 'var(--accent)' : undefined,
                      fontWeight: isHighlight ? 700 : 400,
                    }}
                  >
                    {row.stackSize}
                  </td>
                  <td
                    style={{
                      textAlign: 'right',
                      padding: '8px 12px',
                      color: isHighlight ? 'var(--accent)' : undefined,
                      fontWeight: isHighlight ? 700 : 400,
                    }}
                  >
                    {row.throughput.toFixed(2)}
                  </td>
                  <td style={{ textAlign: 'right', padding: '8px 12px' }}>
                    {row.swingTicks}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* SVG Mini Bar Chart - Throughput comparison */}
      <svg
        viewBox={`0 0 ${CHART_W} ${svgH}`}
        style={{
          width: '100%',
          maxWidth: CHART_W,
          background: '#0d1117',
          borderRadius: 4,
          marginTop: 12,
        }}
      >
        {/* Title */}
        <text x={CHART_W / 2} y={16} textAnchor="middle" fill="#ffffff80" fontSize={11}>
          {t('inserterCap.throughput')} ({t('inserterCap.itemsPerSec')})
        </text>

        {rows.map((row, i) => {
          const y = 28 + i * (barH + barGap)
          const barMaxW = CHART_W - BAR_PAD - 60
          const barW = (row.throughput / maxThroughput) * barMaxW

          // Previous level bar for comparison
          const prevRow = prevRows?.find((r) => r.id === row.id)
          const prevBarW = prevRow
            ? (prevRow.throughput / maxThroughput) * barMaxW
            : barW

          return (
            <g key={row.id}>
              {/* Label */}
              <text
                x={BAR_PAD - 4}
                y={y + barH / 2 + 4}
                textAnchor="end"
                fill="#ffffff80"
                fontSize={10}
              >
                {t(`inserterCap.${row.id}`)}
              </text>

              {/* Previous level ghost bar */}
              {prevRow && prevBarW !== barW && (
                <rect
                  x={BAR_PAD}
                  y={y}
                  width={prevBarW}
                  height={barH}
                  rx={3}
                  fill="#ffffff10"
                />
              )}

              {/* Current bar */}
              <rect
                x={BAR_PAD}
                y={y}
                width={barW}
                height={barH}
                rx={3}
                fill={row.color + 'cc'}
              />

              {/* Value label */}
              <text
                x={BAR_PAD + barW + 6}
                y={y + barH / 2 + 4}
                fill="#ffffffb0"
                fontSize={10}
                fontFamily="monospace"
              >
                {row.throughput.toFixed(2)}
              </text>
            </g>
          )
        })}
      </svg>

      {/* Stats */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: 10,
          marginTop: 12,
        }}
      >
        <Stat
          label={t('inserterCap.researchLevel')}
          value={`${level} / 7`}
        />
        <Stat
          label={`${t('inserterCap.stack')} ${t('inserterCap.stackSize')}`}
          value={`${STACK_CAPACITY[level]}`}
          color="#40e080"
        />
        <Stat
          label={`${t('inserterCap.bulk')} ${t('inserterCap.stackSize')}`}
          value={`${BULK_CAPACITY[level]}`}
          color="#9c27b0"
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
          fontSize: 18,
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
