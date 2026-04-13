import { useState, useRef, useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import TimelineControls from '../../components/Timeline/TimelineControls'
import { GRID, createState, advanceTick, getBiterColor, type BiterState } from './biterEngine'

const CELL = 16
const PAD = 4

export default function BiterAI() {
  const { t } = useTranslation()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef(0)
  const lastRef = useRef(0)

  const [evolution, setEvolution] = useState(0.3)
  const [pollutionRate, setPollutionRate] = useState(50)
  const [nestCount, setNestCount] = useState(4)
  const [state, setState] = useState<BiterState>(() => createState(4))
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)

  const cW = GRID * CELL + PAD * 2
  const cH = GRID * CELL + PAD * 2

  const draw = useCallback((ctx: CanvasRenderingContext2D, st: BiterState) => {
    ctx.fillStyle = '#0a0e08'
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)

    // Pollution heatmap
    for (let y = 0; y < GRID; y++) {
      for (let x = 0; x < GRID; x++) {
        const px = PAD + x * CELL
        const py = PAD + y * CELL
        const p = st.pollution[y * GRID + x]

        if (p > 0.001) {
          const intensity = Math.min(1, p / 0.3)
          ctx.fillStyle = `rgba(180, 80, 0, ${intensity * 0.35})`
          ctx.fillRect(px, py, CELL, CELL)
        }

        ctx.strokeStyle = '#ffffff04'
        ctx.lineWidth = 0.5
        ctx.strokeRect(px, py, CELL, CELL)

        const cell = st.grid[y * GRID + x]
        if (cell === 'water') {
          ctx.fillStyle = '#0d2a4a80'
          ctx.fillRect(px, py, CELL, CELL)
        } else if (cell === 'factory') {
          ctx.fillStyle = '#e9a82040'
          ctx.fillRect(px + 1, py + 1, CELL - 2, CELL - 2)
          ctx.strokeStyle = '#e9a82080'
          ctx.lineWidth = 1
          ctx.strokeRect(px + 1, py + 1, CELL - 2, CELL - 2)
        } else if (cell === 'turret') {
          ctx.fillStyle = '#4080e050'
          ctx.fillRect(px + 2, py + 2, CELL - 4, CELL - 4)
          ctx.strokeStyle = '#4080e0'
          ctx.lineWidth = 1
          ctx.strokeRect(px + 2, py + 2, CELL - 4, CELL - 4)
          // Range circle
          ctx.strokeStyle = '#4080e015'
          ctx.beginPath()
          ctx.arc(px + CELL / 2, py + CELL / 2, 5 * CELL, 0, Math.PI * 2)
          ctx.stroke()
        } else if (cell === 'nest') {
          ctx.fillStyle = '#f4433650'
          ctx.beginPath()
          ctx.arc(px + CELL / 2, py + CELL / 2, CELL / 2 - 1, 0, Math.PI * 2)
          ctx.fill()
          ctx.strokeStyle = '#f44336'
          ctx.lineWidth = 1.5
          ctx.stroke()
        } else if (cell === 'wall') {
          ctx.fillStyle = '#8a8a8a80'
          ctx.fillRect(px + 1, py + 1, CELL - 2, CELL - 2)
        }
      }
    }

    // Biters
    for (const biter of st.biters) {
      const bx = PAD + biter.x * CELL
      const by = PAD + biter.y * CELL
      const r = biter.type === 'behemoth' ? 5 : biter.type === 'big' ? 4 : biter.type === 'medium' ? 3 : 2.5
      ctx.fillStyle = getBiterColor(biter.type)
      ctx.beginPath()
      ctx.arc(bx + CELL / 2, by + CELL / 2, r, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = '#ffffff30'
      ctx.lineWidth = 0.5
      ctx.stroke()
    }

    // Info
    ctx.fillStyle = '#ffffff50'
    ctx.font = '9px monospace'
    ctx.textAlign = 'left'
    ctx.fillText(`Tick ${st.tick} | Biters: ${st.biters.length} | Kills: ${st.kills}`, PAD, ctx.canvas.height - 3)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (ctx) draw(ctx, state)
  }, [state, draw])

  useEffect(() => {
    if (!playing) return
    const interval = 1000 / (speed * 6)
    const loop = (time: number) => {
      if (time - lastRef.current >= interval) {
        lastRef.current = time
        setState((p: BiterState) => advanceTick(p, evolution, pollutionRate))
      }
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafRef.current)
  }, [playing, speed, evolution, pollutionRate])

  const step = () => setState((p: BiterState) => advanceTick(p, evolution, pollutionRate))
  const reset = () => { setPlaying(false); setState(createState(nestCount)) }

  // Stats
  const bitersByType = state.biters.reduce<Record<string, number>>((acc, b) => {
    acc[b.type] = (acc[b.type] || 0) + 1; return acc
  }, {})
  const maxPollution = Math.max(...Array.from(state.pollution))
  const totalAbsorbed = state.nests.reduce((s, n) => s + n.absorbed, 0)

  return (
    <div>
      <TimelineControls playing={playing} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)}
        onStep={step} onReset={reset} speed={speed} onSpeedChange={setSpeed} tick={state.tick} />

      <div className="controls-row">
        <div className="control-group">
          <label>{t('biter.evolution')}:</label>
          <input type="range" min={0} max={1} step={0.05} value={evolution}
            onChange={(e) => setEvolution(Number(e.target.value))} />
          <span style={{ fontSize: 13, color: '#f44336', fontWeight: 700, minWidth: 40 }}>{(evolution * 100).toFixed(0)}%</span>
        </div>
        <div className="control-group">
          <label>{t('biter.pollution')}:</label>
          <input type="range" min={10} max={200} step={10} value={pollutionRate}
            onChange={(e) => setPollutionRate(Number(e.target.value))} />
          <span style={{ fontSize: 13, color: 'var(--text-secondary)', minWidth: 30 }}>{pollutionRate}</span>
        </div>
        <div className="control-group">
          <label>{t('biter.nests')}:</label>
          <input type="range" min={1} max={8} value={nestCount}
            onChange={(e) => { setNestCount(Number(e.target.value)); setPlaying(false); setState(createState(Number(e.target.value))) }} />
          <span style={{ fontSize: 13, color: 'var(--text-secondary)', minWidth: 15 }}>{nestCount}</span>
        </div>
      </div>

      {/* Legend */}
      <div className="controls-row" style={{ gap: 8, fontSize: 10 }}>
        {[
          { label: t('biter.factory'), color: '#e9a820' },
          { label: t('biter.turret'), color: '#4080e0' },
          { label: t('biter.nest'), color: '#f44336' },
          { label: t('biter.waterLabel'), color: '#0d2a4a' },
        ].map(({ label, color }) => (
          <span key={label} style={{ color: '#ffffff80', display: 'flex', alignItems: 'center', gap: 3 }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: color, border: '1px solid #ffffff20', display: 'inline-block' }} />
            {label}
          </span>
        ))}
        {['small', 'medium', 'big', 'behemoth'].map(type => (
          <span key={type} style={{ color: '#ffffff80', display: 'flex', alignItems: 'center', gap: 3 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: getBiterColor(type), display: 'inline-block' }} />
            {t(`biter.type.${type}`)}
          </span>
        ))}
      </div>

      <div style={{ overflowX: 'auto', marginTop: 8 }}>
        <canvas ref={canvasRef} width={cW} height={cH}
          style={{ display: 'block', borderRadius: 4, maxWidth: '100%' }} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 8, marginTop: 10 }}>
        <Stat label={t('biter.activeBiters')} value={`${state.biters.length}`} color="#f44336" />
        <Stat label={t('biter.kills')} value={`${state.kills}`} color="#4caf50" />
        <Stat label={t('biter.maxPollution')} value={`${maxPollution.toFixed(3)}`} color="#ff9800" />
        <Stat label={t('biter.absorbed')} value={`${totalAbsorbed.toFixed(2)}`} color="#9c27b0" />
        {Object.entries(bitersByType).map(([type, count]) => (
          <Stat key={type} label={t(`biter.type.${type}`)} value={`${count}`} color={getBiterColor(type)} />
        ))}
      </div>
    </div>
  )
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 12px' }}>
      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{label}</div>
      <div style={{ fontSize: 16, color: color || 'var(--accent)', fontWeight: 700, fontFamily: 'monospace' }}>{value}</div>
    </div>
  )
}
