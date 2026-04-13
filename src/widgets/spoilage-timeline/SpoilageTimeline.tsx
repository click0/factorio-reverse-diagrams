import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'

interface SpoilableItem {
  id: string
  spoilTime: number // seconds
  color: string
  result: string // what it spoils into
}

const SPOILABLE_ITEMS: SpoilableItem[] = [
  { id: 'nutrients', spoilTime: 200, color: '#8bc34a', result: 'spoilage' },
  { id: 'bioflux', spoilTime: 600, color: '#4caf50', result: 'spoilage' },
  { id: 'biter-egg', spoilTime: 300, color: '#ff5722', result: 'small-biter' },
  { id: 'pentapod-egg', spoilTime: 450, color: '#9c27b0', result: 'small-pentapod' },
  { id: 'yumako-fruit', spoilTime: 120, color: '#ff9800', result: 'spoilage' },
  { id: 'jelly', spoilTime: 90, color: '#e91e63', result: 'spoilage' },
]

const BELT_SPEEDS = [
  { id: 'yellow', speed: 15, color: '#e9c73e' },
  { id: 'red', speed: 30, color: '#e04040' },
  { id: 'blue', speed: 45, color: '#4080e0' },
  { id: 'turbo', speed: 90, color: '#40e080' },
]

const SVG_W = 700
const SVG_H = 260
const BAR_H = 20
const PAD = 50

export default function SpoilageTimeline() {
  const { t } = useTranslation()
  const [selectedItem, setSelectedItem] = useState(0)
  const [beltTier, setBeltTier] = useState(2) // blue
  const [distance, setDistance] = useState(100) // tiles
  const [processingTime, setProcessingTime] = useState(10) // seconds

  const item = SPOILABLE_ITEMS[selectedItem]
  const belt = BELT_SPEEDS[beltTier]

  const transitTime = distance / belt.speed
  const totalTime = transitTime + processingTime
  const remainingLife = Math.max(0, item.spoilTime - totalTime)
  const spoilPercent = Math.min(100, (totalTime / item.spoilTime) * 100)
  const survives = totalTime < item.spoilTime

  // Timeline segments
  const maxTime = item.spoilTime * 1.2
  const xScale = (sec: number) => PAD + (sec / maxTime) * (SVG_W - PAD * 2)

  // Items on belt visualization
  const itemCount = Math.min(20, Math.ceil(distance / 5))

  return (
    <div>
      <div className="controls-row">
        <div className="control-group">
          <label>{t('spoilage.item')}:</label>
          <select value={selectedItem} onChange={(e) => setSelectedItem(Number(e.target.value))}
            style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 4, padding: '4px 8px', fontSize: 13 }}>
            {SPOILABLE_ITEMS.map((it, i) => (
              <option key={i} value={i}>{t(`spoilage.item.${it.id}`)} ({it.spoilTime}s)</option>
            ))}
          </select>
        </div>
        <div className="control-group">
          <label>{t('spoilage.belt')}:</label>
          {BELT_SPEEDS.map((b, i) => (
            <button key={b.id} className={`btn ${i === beltTier ? 'active' : ''}`}
              style={i === beltTier ? { borderColor: b.color, color: b.color } : {}}
              onClick={() => setBeltTier(i)}>
              {t(`belt.${b.id}`)}
            </button>
          ))}
        </div>
      </div>

      <div className="controls-row">
        <div className="control-group">
          <label>{t('spoilage.distance')}:</label>
          <input type="range" min={10} max={500} step={10} value={distance}
            onChange={(e) => setDistance(Number(e.target.value))} />
          <span style={{ fontSize: 13, color: 'var(--text-secondary)', minWidth: 50 }}>{distance} {t('spoilage.tiles')}</span>
        </div>
        <div className="control-group">
          <label>{t('spoilage.processing')}:</label>
          <input type="range" min={0} max={120} step={5} value={processingTime}
            onChange={(e) => setProcessingTime(Number(e.target.value))} />
          <span style={{ fontSize: 13, color: 'var(--text-secondary)', minWidth: 30 }}>{processingTime}s</span>
        </div>
      </div>

      {/* Timeline SVG */}
      <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} style={{ width: '100%', maxWidth: SVG_W, background: '#0d1117', borderRadius: 4, marginTop: 8 }}>
        {/* Time axis */}
        <line x1={PAD} y1={SVG_H - 30} x2={SVG_W - PAD} y2={SVG_H - 30} stroke="#ffffff20" />
        {Array.from({ length: 6 }, (_, i) => {
          const sec = (i / 5) * maxTime
          return (
            <g key={i}>
              <line x1={xScale(sec)} y1={SVG_H - 33} x2={xScale(sec)} y2={SVG_H - 27} stroke="#ffffff30" />
              <text x={xScale(sec)} y={SVG_H - 16} textAnchor="middle" fill="#ffffff50" fontSize={9}>{Math.round(sec)}s</text>
            </g>
          )
        })}

        {/* Spoil deadline */}
        <line x1={xScale(item.spoilTime)} y1={20} x2={xScale(item.spoilTime)} y2={SVG_H - 30}
          stroke="#f44336" strokeWidth={2} strokeDasharray="6,3" />
        <text x={xScale(item.spoilTime)} y={15} textAnchor="middle" fill="#f44336" fontSize={10} fontWeight="bold">
          {t('spoilage.spoils')} ({item.spoilTime}s)
        </text>

        {/* Transit bar */}
        <rect x={xScale(0)} y={50} width={xScale(transitTime) - PAD} height={BAR_H} rx={3}
          fill={belt.color + '40'} stroke={belt.color} strokeWidth={1} />
        <text x={xScale(transitTime / 2)} y={50 + BAR_H / 2 + 4} textAnchor="middle" fill="#ffffffcc" fontSize={9}>
          {t('spoilage.transit')}: {transitTime.toFixed(1)}s
        </text>

        {/* Processing bar */}
        {processingTime > 0 && (
          <>
            <rect x={xScale(transitTime)} y={50} width={xScale(processingTime) - PAD} height={BAR_H} rx={3}
              fill="#4080e030" stroke="#4080e0" strokeWidth={1} />
            <text x={xScale(transitTime + processingTime / 2)} y={50 + BAR_H / 2 + 4} textAnchor="middle" fill="#ffffffcc" fontSize={9}>
              {t('spoilage.processing')}: {processingTime}s
            </text>
          </>
        )}

        {/* Remaining life bar */}
        {survives && (
          <rect x={xScale(totalTime)} y={50} width={xScale(remainingLife) - PAD} height={BAR_H} rx={3}
            fill="#4caf5020" stroke="#4caf5060" strokeWidth={1} strokeDasharray="4,2" />
        )}

        {/* Freshness gradient bar */}
        <defs>
          <linearGradient id="fresh-grad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={item.color} stopOpacity="0.8" />
            <stop offset={`${Math.min(100, spoilPercent)}%`} stopColor="#f44336" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#f44336" stopOpacity="0.2" />
          </linearGradient>
        </defs>
        <rect x={PAD} y={90} width={SVG_W - PAD * 2} height={10} rx={5}
          fill="url(#fresh-grad)" />
        <text x={PAD} y={115} fill="#ffffff50" fontSize={9}>{t('spoilage.fresh')}</text>
        <text x={SVG_W - PAD} y={115} textAnchor="end" fill="#f4433680" fontSize={9}>{t('spoilage.spoiled')}</text>

        {/* Items on belt visualization */}
        {Array.from({ length: itemCount }, (_, i) => {
          const frac = i / itemCount
          const age = frac * transitTime
          const freshness = 1 - age / item.spoilTime
          const x = PAD + 20 + frac * (SVG_W - PAD * 2 - 40)
          return (
            <circle key={i} cx={x} cy={145} r={5}
              fill={item.color} opacity={Math.max(0.15, freshness)}
              stroke="#ffffff20" strokeWidth={0.5} />
          )
        })}
        <text x={SVG_W / 2} y={165} textAnchor="middle" fill="#ffffff40" fontSize={9}>
          {t('spoilage.itemsOnBelt')}
        </text>

        {/* Result */}
        <text x={SVG_W / 2} y={195} textAnchor="middle" fontSize={14} fontWeight="bold"
          fill={survives ? '#4caf50' : '#f44336'}>
          {survives ? `✓ ${t('spoilage.survives')} (${remainingLife.toFixed(1)}s ${t('spoilage.remaining')})` : `✗ ${t('spoilage.spoilsBefore')}`}
        </text>
      </svg>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10, marginTop: 12 }}>
        <Stat label={t('spoilage.spoilTime')} value={`${item.spoilTime}s`} />
        <Stat label={t('spoilage.transitTime')} value={`${transitTime.toFixed(1)}s`} />
        <Stat label={t('spoilage.totalTime')} value={`${totalTime.toFixed(1)}s`} />
        <Stat label={t('spoilage.spoilsInto')} value={t(`spoilage.result.${item.result}`)} />
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 6, padding: '10px 14px' }}>
      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{label}</div>
      <div style={{ fontSize: 18, color: 'var(--accent)', fontWeight: 700, fontFamily: 'monospace' }}>{value}</div>
    </div>
  )
}
