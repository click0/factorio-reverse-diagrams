import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'

interface EntityCategory {
  id: string
  upsPerEntity: number // microseconds per entity per tick
  color: string
}

const CATEGORIES: EntityCategory[] = [
  { id: 'belt', upsPerEntity: 0.5, color: '#e9c73e' },
  { id: 'inserter', upsPerEntity: 1.2, color: '#4080e0' },
  { id: 'assembler', upsPerEntity: 3.0, color: '#e04040' },
  { id: 'furnace', upsPerEntity: 2.0, color: '#c0884a' },
  { id: 'pipe', upsPerEntity: 0.3, color: '#2196f3' },
  { id: 'bot', upsPerEntity: 1.5, color: '#00bcd4' },
  { id: 'train', upsPerEntity: 5.0, color: '#9c27b0' },
  { id: 'turret', upsPerEntity: 2.5, color: '#f44336' },
  { id: 'solar', upsPerEntity: 0.1, color: '#ffc107' },
  { id: 'beacon', upsPerEntity: 0.8, color: '#ff9800' },
]

const TICK_BUDGET_US = 16667 // 16.667ms = 60 UPS in microseconds

const CHART_W = 700
const CHART_H = 200
const PAD = 40

export default function UPSOptimizer() {
  const { t } = useTranslation()
  const [counts, setCounts] = useState<Record<string, number>>(() => {
    const c: Record<string, number> = {}
    CATEGORIES.forEach(cat => { c[cat.id] = cat.id === 'belt' ? 5000 : cat.id === 'inserter' ? 2000 : cat.id === 'assembler' ? 500 : 200 })
    return c
  })

  const setCount = (id: string, value: number) => {
    setCounts(prev => ({ ...prev, [id]: Math.max(0, value) }))
  }

  const breakdown = useMemo(() => {
    return CATEGORIES.map(cat => ({
      ...cat,
      count: counts[cat.id] || 0,
      totalUs: (counts[cat.id] || 0) * cat.upsPerEntity,
    }))
  }, [counts])

  const totalUs = breakdown.reduce((sum, b) => sum + b.totalUs, 0)
  const usagePercent = (totalUs / TICK_BUDGET_US) * 100
  const estimatedUPS = Math.min(60, 1000000 / totalUs)
  const topConsumers = [...breakdown].sort((a, b) => b.totalUs - a.totalUs).slice(0, 5)

  // Stacked bar data
  let cumX = PAD
  const barWidth = CHART_W - PAD * 2
  const bars = breakdown.filter(b => b.totalUs > 0).map(b => {
    const w = (b.totalUs / Math.max(totalUs, TICK_BUDGET_US)) * barWidth
    const bar = { x: cumX, w, ...b }
    cumX += w
    return bar
  })

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8 }}>
        {CATEGORIES.map(cat => (
          <div key={cat.id} className="control-group" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 6, padding: '6px 10px' }}>
            <span style={{ color: cat.color, fontSize: 11, minWidth: 70 }}>{t(`ups.cat.${cat.id}`)}</span>
            <input type="number" value={counts[cat.id] || 0}
              onChange={(e) => setCount(cat.id, Number(e.target.value))}
              style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 3, padding: '2px 6px', fontSize: 12, width: 70 }} />
          </div>
        ))}
      </div>

      {/* UPS budget bar */}
      <svg viewBox={`0 0 ${CHART_W} ${CHART_H}`} style={{ width: '100%', maxWidth: CHART_W, background: '#0d1117', borderRadius: 4, marginTop: 12 }}>
        {/* Budget line */}
        <line x1={PAD + barWidth * Math.min(1, TICK_BUDGET_US / Math.max(totalUs, TICK_BUDGET_US))} y1={30}
          x2={PAD + barWidth * Math.min(1, TICK_BUDGET_US / Math.max(totalUs, TICK_BUDGET_US))} y2={90}
          stroke="#4caf50" strokeWidth={2} strokeDasharray="4,3" />
        <text x={PAD + barWidth * Math.min(1, TICK_BUDGET_US / Math.max(totalUs, TICK_BUDGET_US))} y={24}
          textAnchor="middle" fill="#4caf50" fontSize={9}>60 UPS</text>

        {/* Stacked bars */}
        {bars.map(bar => (
          <g key={bar.id}>
            <rect x={bar.x} y={40} width={Math.max(1, bar.w)} height={40} fill={bar.color + '80'} />
            {bar.w > 30 && (
              <text x={bar.x + bar.w / 2} y={64} textAnchor="middle" fill="#0d1117" fontSize={8} fontWeight="bold">
                {t(`ups.cat.${bar.id}`)}
              </text>
            )}
          </g>
        ))}

        {/* Overflow indicator */}
        {totalUs > TICK_BUDGET_US && (
          <text x={CHART_W - PAD} y={64} textAnchor="end" fill="#f44336" fontSize={10} fontWeight="bold">
            ⚠ {t('ups.overBudget')}
          </text>
        )}

        {/* Top consumers list */}
        {topConsumers.map((b, i) => (
          <g key={b.id}>
            <rect x={PAD} y={100 + i * 18} width={8} height={8} rx={1} fill={b.color} />
            <text x={PAD + 14} y={108 + i * 18} fill="#ffffff80" fontSize={10}>
              {t(`ups.cat.${b.id}`)}: {b.count} × {b.upsPerEntity}μs = {(b.totalUs / 1000).toFixed(1)}ms ({(b.totalUs / totalUs * 100).toFixed(0)}%)
            </text>
          </g>
        ))}
      </svg>

      {/* Results */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10, marginTop: 12 }}>
        <Stat label={t('ups.totalTime')} value={`${(totalUs / 1000).toFixed(1)}ms`} />
        <Stat label={t('ups.budget')} value={`${usagePercent.toFixed(1)}%`}
          color={usagePercent > 100 ? '#f44336' : usagePercent > 80 ? '#ff9800' : '#4caf50'} />
        <Stat label={t('ups.estimatedUPS')} value={`${estimatedUPS.toFixed(0)}`}
          color={estimatedUPS >= 60 ? '#4caf50' : estimatedUPS >= 30 ? '#ff9800' : '#f44336'} />
        <Stat label={t('ups.totalEntities')} value={`${Object.values(counts).reduce((a, b) => a + b, 0).toLocaleString()}`} />
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
