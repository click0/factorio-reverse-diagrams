import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'

interface InserterDef {
  id: string
  label: string
  color: string
  baseRate: number // items/s at stack size 1
  scalable: boolean // whether stack bonus research applies
}

const INSERTER_DEFS: InserterDef[] = [
  { id: 'burner', label: 'cargo.burner', color: '#8a6a3a', baseRate: 0.6, scalable: false },
  { id: 'basic', label: 'cargo.basic', color: '#e0a020', baseRate: 0.83, scalable: false },
  { id: 'longHanded', label: 'cargo.longHanded', color: '#e04040', baseRate: 1.2, scalable: false },
  { id: 'fast', label: 'cargo.fast', color: '#4080e0', baseRate: 2.31, scalable: false },
  { id: 'stack', label: 'cargo.stack', color: '#40e080', baseRate: 2.31, scalable: true },
  { id: 'bulk', label: 'cargo.bulk', color: '#9c27b0', baseRate: 2.31, scalable: true },
]

const WAGON_SLOTS = 40

// Stack inserter throughput by stack bonus research level
// stack_size = 1 + bonus, throughput = stack_size / swing_time (0.433s)
const STACK_THROUGHPUT: Record<number, number> = {
  0: 2.31,   // stack 1
  1: 4.62,   // stack 2
  2: 9.23,   // stack 4
  3: 13.85,  // stack 8 (diminishing)
  4: 18.46,  // stack 12
  5: 23.08,  // stack 16
  6: 27.69,  // stack 20
  7: 32.31,  // stack 24
}

// Bulk inserter has higher stack cap — same formula but higher values at top levels
const BULK_THROUGHPUT: Record<number, number> = {
  0: 2.31,
  1: 4.62,
  2: 9.23,
  3: 18.46,
  4: 27.69,
  5: 36.92,
  6: 46.15,
  7: 55.38,
}

function getInserterRate(ins: InserterDef, stackLevel: number): number {
  if (!ins.scalable) return ins.baseRate
  if (ins.id === 'bulk') return BULK_THROUGHPUT[stackLevel] ?? ins.baseRate
  return STACK_THROUGHPUT[stackLevel] ?? ins.baseRate
}

export default function CargoWagon() {
  const { t } = useTranslation()
  const [inserterIdx, setInserterIdx] = useState(4) // stack inserter default
  const [inserterCount, setInserterCount] = useState(6)
  const [stackLevel, setStackLevel] = useState(0)
  const [itemStackSize, setItemStackSize] = useState(50)

  const ins = INSERTER_DEFS[inserterIdx]

  const results = useMemo(() => {
    const perInserter = getInserterRate(ins, stackLevel)
    const totalRate = perInserter * inserterCount
    const totalItems = WAGON_SLOTS * itemStackSize
    const fillTime = totalItems / totalRate

    return { perInserter, totalRate, totalItems, fillTime }
  }, [ins, inserterCount, stackLevel, itemStackSize])

  return (
    <div>
      {/* Inserter type selector */}
      <div className="controls-row">
        <div className="control-group">
          <label>{t('cargo.inserterType')}:</label>
          {INSERTER_DEFS.map((def, i) => (
            <button key={def.id} className={`btn ${i === inserterIdx ? 'active' : ''}`}
              style={i === inserterIdx ? { borderColor: def.color, color: def.color } : {}}
              onClick={() => { setInserterIdx(i); setStackLevel(0) }}>
              {t(def.label)}
            </button>
          ))}
        </div>
      </div>

      {/* Inserter count slider */}
      <div className="controls-row">
        <div className="control-group">
          <label>{t('cargo.inserterCount')}:</label>
          <input type="range" min={1} max={12} value={inserterCount}
            onChange={(e) => setInserterCount(Number(e.target.value))} />
          <span style={{ fontSize: 13, color: 'var(--accent)', minWidth: 30, fontWeight: 700 }}>{inserterCount}</span>
        </div>
      </div>

      {/* Stack bonus research level (only for stack/bulk) */}
      {ins.scalable && (
        <div className="controls-row">
          <div className="control-group">
            <label>{t('cargo.stackBonus')} ({t('cargo.level')}):</label>
            <input type="range" min={0} max={7} value={stackLevel}
              onChange={(e) => setStackLevel(Number(e.target.value))} />
            <span style={{ fontSize: 13, color: 'var(--accent)', minWidth: 20, fontWeight: 700 }}>{stackLevel}</span>
          </div>
        </div>
      )}

      {/* Item stack size input */}
      <div className="controls-row">
        <div className="control-group">
          <label>{t('cargo.itemStackSize')}:</label>
          <input type="range" min={1} max={200} value={itemStackSize}
            onChange={(e) => setItemStackSize(Number(e.target.value))} />
          <span style={{ fontSize: 13, color: 'var(--text-muted)', minWidth: 30 }}>{itemStackSize}</span>
        </div>
      </div>

      {/* Stat boxes */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10, marginTop: 12 }}>
        <Stat label={t('cargo.itemsPerSec')} value={`${results.totalRate.toFixed(2)}/s`} color="var(--accent)" />
        <Stat label={t('cargo.fillTime')} value={formatTime(results.fillTime)} color="#4caf50" />
        <Stat label={t('cargo.totalItems')} value={results.totalItems.toLocaleString()} />
        <Stat label={t('cargo.wagonSlots')} value={`${WAGON_SLOTS}`} />
      </div>

      {/* Detail table */}
      <div style={{ marginTop: 16, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <th style={thStyle}>{t('cargo.inserterType')}</th>
              <th style={thStyle}>{t('cargo.perInserter')}</th>
              <th style={thStyle}>{t('cargo.total')} ({inserterCount}x)</th>
              <th style={thStyle}>{t('cargo.fillTime')}</th>
            </tr>
          </thead>
          <tbody>
            {INSERTER_DEFS.map((def, i) => {
              const rate = getInserterRate(def, def.scalable ? stackLevel : 0)
              const total = rate * inserterCount
              const totalItems = WAGON_SLOTS * itemStackSize
              const time = totalItems / total
              const isActive = i === inserterIdx

              return (
                <tr key={def.id}
                  style={{
                    borderBottom: '1px solid var(--border)',
                    background: isActive ? `${def.color}15` : 'transparent',
                    cursor: 'pointer',
                  }}
                  onClick={() => { setInserterIdx(i); if (!def.scalable) setStackLevel(0) }}>
                  <td style={{ ...tdStyle, color: def.color, fontWeight: isActive ? 700 : 400 }}>
                    {t(def.label)}
                  </td>
                  <td style={tdStyle}>{rate.toFixed(2)}/s</td>
                  <td style={{ ...tdStyle, color: 'var(--accent)', fontWeight: 700 }}>{total.toFixed(2)}/s</td>
                  <td style={tdStyle}>{formatTime(time)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Visual wagon representation */}
      <div style={{ marginTop: 16, background: '#0d1117', borderRadius: 4, padding: 12 }}>
        <div style={{ fontSize: 10, color: '#ffffff50', marginBottom: 6 }}>
          {t('cargo.wagonSlots')}: {WAGON_SLOTS} x {itemStackSize} = {results.totalItems.toLocaleString()} {t('cargo.totalItems').toLowerCase()}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 2 }}>
          {Array.from({ length: WAGON_SLOTS }, (_, i) => (
            <div key={i} style={{
              aspectRatio: '1',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 8,
              color: 'var(--text-muted)',
            }}>
              {itemStackSize}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function formatTime(seconds: number): string {
  if (seconds < 60) return `${seconds.toFixed(1)}s`
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}m ${secs.toFixed(0)}s`
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
