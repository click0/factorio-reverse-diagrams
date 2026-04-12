import { useState } from 'react'
import { useTranslation } from 'react-i18next'

// Circuit Network 2.0 new features (Factorio 2.0)
// Selector Combinator, Display Panel

type SelectorMode = 'index' | 'count' | 'random' | 'stack-size'

interface SelectorConfig {
  mode: SelectorMode
  index: number
}

interface Signal {
  type: string
  value: number
}

const DEMO_SIGNALS: Signal[] = [
  { type: 'A', value: 42 },
  { type: 'B', value: -7 },
  { type: 'C', value: 100 },
  { type: 'D', value: 0 },
  { type: 'E', value: 55 },
  { type: 'F', value: 23 },
]

function evaluateSelector(signals: Signal[], config: SelectorConfig): Signal | null {
  const nonZero = signals.filter(s => s.value !== 0)

  switch (config.mode) {
    case 'index': {
      const sorted = [...nonZero].sort((a, b) => b.value - a.value)
      const idx = Math.max(0, Math.min(config.index - 1, sorted.length - 1))
      return sorted[idx] || null
    }
    case 'count':
      return { type: '#', value: nonZero.length }
    case 'random': {
      if (nonZero.length === 0) return null
      const idx = Math.floor(Math.random() * nonZero.length)
      return nonZero[idx]
    }
    case 'stack-size':
      return { type: 'stack', value: 100 } // simplified: all items stack to 100
  }
}

const SVG_W = 700
const SVG_H = 280

export default function Circuit2() {
  const { t } = useTranslation()
  const [signals, setSignals] = useState<Signal[]>(DEMO_SIGNALS)
  const [selectorConfig, setSelectorConfig] = useState<SelectorConfig>({ mode: 'index', index: 1 })
  const [displayMode, setDisplayMode] = useState<'value' | 'bar' | 'icon'>('value')
  const [evalCount, setEvalCount] = useState(0)

  const result = evaluateSelector(signals, selectorConfig)

  const evaluate = () => {
    setEvalCount(prev => prev + 1)
  }

  const updateSignal = (idx: number, field: 'type' | 'value', val: string | number) => {
    setSignals(prev => prev.map((s, i) => i === idx ? { ...s, [field]: field === 'value' ? Number(val) : val } : s))
  }

  const nonZero = signals.filter(s => s.value !== 0)
  const maxVal = Math.max(1, ...signals.map(s => Math.abs(s.value)))

  return (
    <div>
      {/* Input signals editor */}
      <h4 style={{ color: 'var(--accent)', fontSize: 14 }}>{t('circuit2.inputSignals')}</h4>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 6, marginTop: 6 }}>
        {signals.map((sig, i) => (
          <div key={i} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 4, padding: '4px 8px', display: 'flex', gap: 4, alignItems: 'center' }}>
            <input value={sig.type} onChange={(e) => updateSignal(i, 'type', e.target.value)}
              style={{ background: 'var(--bg-primary)', color: sig.value !== 0 ? '#4caf50' : 'var(--text-muted)', border: '1px solid var(--border)', borderRadius: 3, padding: '2px 4px', fontSize: 12, width: 30, textAlign: 'center' }} />
            <input type="number" value={sig.value} onChange={(e) => updateSignal(i, 'value', e.target.value)}
              style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 3, padding: '2px 4px', fontSize: 12, width: 55 }} />
          </div>
        ))}
      </div>

      {/* Selector Combinator */}
      <h4 style={{ color: '#9c27b0', fontSize: 14, marginTop: 16 }}>{t('circuit2.selector')}</h4>
      <div className="controls-row">
        <div className="control-group">
          <label>{t('circuit2.mode')}:</label>
          {(['index', 'count', 'random', 'stack-size'] as SelectorMode[]).map(m => (
            <button key={m} className={`btn ${selectorConfig.mode === m ? 'active' : ''}`}
              onClick={() => setSelectorConfig({ ...selectorConfig, mode: m })}>
              {t(`circuit2.mode.${m}`)}
            </button>
          ))}
        </div>
        {selectorConfig.mode === 'index' && (
          <div className="control-group">
            <label>{t('circuit2.index')}:</label>
            <input type="number" min={1} max={signals.length} value={selectorConfig.index}
              onChange={(e) => setSelectorConfig({ ...selectorConfig, index: Number(e.target.value) })}
              style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 4, padding: '2px 6px', fontSize: 12, width: 50 }} />
          </div>
        )}
        <button className="btn" style={{ borderColor: '#9c27b0', color: '#9c27b0' }} onClick={evaluate}>
          {t('circuit2.evaluate')} ↻
        </button>
      </div>

      {/* Result display */}
      <div style={{ background: '#0d1117', borderRadius: 4, padding: 16, marginTop: 8 }}>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>{t('circuit2.output')}:</div>
        {result ? (
          <div style={{ fontSize: 24, color: '#9c27b0', fontWeight: 700, fontFamily: 'monospace' }}>
            {result.type} = {result.value}
          </div>
        ) : (
          <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>—</div>
        )}
      </div>

      {/* Display Panel preview */}
      <h4 style={{ color: '#2196f3', fontSize: 14, marginTop: 16 }}>{t('circuit2.displayPanel')}</h4>
      <div className="controls-row">
        <div className="control-group">
          <label>{t('circuit2.displayMode')}:</label>
          {(['value', 'bar', 'icon'] as const).map(m => (
            <button key={m} className={`btn ${displayMode === m ? 'active' : ''}`}
              onClick={() => setDisplayMode(m)}>{t(`circuit2.display.${m}`)}</button>
          ))}
        </div>
      </div>

      <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} style={{ width: '100%', maxWidth: SVG_W, background: '#0a0a12', borderRadius: 4, marginTop: 8, border: '2px solid #2196f340' }}>
        {/* Display panel frame */}
        <rect x={20} y={20} width={SVG_W - 40} height={SVG_H - 40} rx={4}
          fill="none" stroke="#2196f320" strokeWidth={1} />

        {nonZero.map((sig, i) => {
          const x = 40 + i * ((SVG_W - 80) / Math.max(1, nonZero.length))
          const w = ((SVG_W - 80) / Math.max(1, nonZero.length)) - 8

          if (displayMode === 'value') {
            return (
              <g key={i}>
                <text x={x + w / 2} y={100} textAnchor="middle" fill="#2196f3" fontSize={16} fontWeight="bold">{sig.type}</text>
                <text x={x + w / 2} y={140} textAnchor="middle" fill="#ffffffcc" fontSize={24} fontFamily="monospace" fontWeight="bold">
                  {sig.value}
                </text>
              </g>
            )
          }

          if (displayMode === 'bar') {
            const barH = (Math.abs(sig.value) / maxVal) * 120
            const barY = sig.value >= 0 ? 200 - barH : 200
            return (
              <g key={i}>
                <rect x={x + 4} y={barY} width={w - 8} height={barH} rx={2}
                  fill={sig.value >= 0 ? '#4caf5080' : '#f4433680'} />
                <text x={x + w / 2} y={230} textAnchor="middle" fill="#ffffff80" fontSize={10}>{sig.type}</text>
                <text x={x + w / 2} y={barY - 4} textAnchor="middle" fill="#ffffffcc" fontSize={10}>{sig.value}</text>
              </g>
            )
          }

          // icon mode
          return (
            <g key={i}>
              <circle cx={x + w / 2} cy={120} r={20} fill={sig.value > 0 ? '#4caf5030' : '#f4433630'}
                stroke={sig.value > 0 ? '#4caf50' : '#f44336'} strokeWidth={1.5} />
              <text x={x + w / 2} y={124} textAnchor="middle" fill="#ffffffcc" fontSize={14} fontWeight="bold">{sig.type}</text>
              <text x={x + w / 2} y={160} textAnchor="middle" fill="#ffffff80" fontSize={12} fontFamily="monospace">{sig.value}</text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
