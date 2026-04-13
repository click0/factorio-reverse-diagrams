import { useState, useRef, useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import TimelineControls from '../../components/Timeline/TimelineControls'

const GRID_W = 20
const GRID_H = 8
const CELL = 32
const PAD = 8
const MAX_PRESSURE = 100

type CellType = 'empty' | 'pipe' | 'pump' | 'source' | 'sink'

interface FluidCell {
  type: CellType
  pressure: number
  flow: number
}

function createGrid(): FluidCell[] {
  const grid: FluidCell[] = Array.from({ length: GRID_W * GRID_H }, () => ({
    type: 'empty', pressure: 0, flow: 0,
  }))
  // Default: source on left, pipe chain, sink on right
  const y = Math.floor(GRID_H / 2)
  grid[y * GRID_W + 0] = { type: 'source', pressure: MAX_PRESSURE, flow: 0 }
  for (let x = 1; x < GRID_W - 1; x++) {
    grid[y * GRID_W + x] = { type: 'pipe', pressure: 0, flow: 0 }
  }
  grid[y * GRID_W + (GRID_W - 1)] = { type: 'sink', pressure: 0, flow: 0 }
  return grid
}

function simulateStep(grid: FluidCell[]): FluidCell[] {
  const next = grid.map(c => ({ ...c, flow: 0 }))

  // Sources maintain max pressure
  for (let i = 0; i < next.length; i++) {
    if (next[i].type === 'source') next[i].pressure = MAX_PRESSURE
    if (next[i].type === 'sink') next[i].pressure = 0
  }

  // Pressure equalization between connected pipes
  for (let y = 0; y < GRID_H; y++) {
    for (let x = 0; x < GRID_W; x++) {
      const i = y * GRID_W + x
      if (next[i].type === 'empty') continue

      const neighbors = [
        x > 0 ? i - 1 : -1,
        x < GRID_W - 1 ? i + 1 : -1,
        y > 0 ? i - GRID_W : -1,
        y < GRID_H - 1 ? i + GRID_W : -1,
      ].filter(n => n >= 0 && next[n].type !== 'empty')

      for (const ni of neighbors) {
        const diff = next[i].pressure - next[ni].pressure
        if (diff > 0) {
          const transfer = diff * 0.1
          next[i].pressure -= transfer
          next[ni].pressure += transfer
          next[i].flow += Math.abs(transfer)
        }
      }

      // Pump: boost pressure by 50 if connected
      if (next[i].type === 'pump') {
        const left = x > 0 ? i - 1 : -1
        const right = x < GRID_W - 1 ? i + 1 : -1
        if (left >= 0 && next[left].type !== 'empty' && right >= 0 && next[right].type !== 'empty') {
          const boost = Math.min(50, MAX_PRESSURE - next[right].pressure)
          next[right].pressure += boost * 0.1
          next[i].flow += boost * 0.1
        }
      }
    }
  }

  return next
}

export default function FluidSystem() {
  const { t } = useTranslation()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef(0)
  const lastRef = useRef(0)

  const [grid, setGrid] = useState<FluidCell[]>(createGrid)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [tick, setTick] = useState(0)
  const [tool, setTool] = useState<CellType>('pipe')

  const cW = GRID_W * CELL + PAD * 2
  const cH = GRID_H * CELL + PAD * 2 + 16

  const pressureColor = (p: number): string => {
    const n = Math.min(1, p / MAX_PRESSURE)
    const r = Math.floor(50 + 180 * n)
    const g = Math.floor(100 * (1 - n * 0.5))
    const b = Math.floor(200 * (1 - n))
    return `rgb(${r},${g},${b})`
  }

  const draw = useCallback((ctx: CanvasRenderingContext2D, g: FluidCell[]) => {
    ctx.fillStyle = '#0d1117'
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)

    for (let y = 0; y < GRID_H; y++) {
      for (let x = 0; x < GRID_W; x++) {
        const i = y * GRID_W + x
        const cell = g[i]
        const px = PAD + x * CELL
        const py = PAD + y * CELL

        ctx.strokeStyle = '#ffffff08'
        ctx.lineWidth = 0.5
        ctx.strokeRect(px, py, CELL, CELL)

        if (cell.type === 'empty') continue

        // Fill by pressure
        ctx.fillStyle = pressureColor(cell.pressure)
        ctx.globalAlpha = 0.6
        ctx.fillRect(px + 1, py + 1, CELL - 2, CELL - 2)
        ctx.globalAlpha = 1

        // Border by type
        const colors: Record<CellType, string> = {
          empty: '', pipe: '#4080e0', pump: '#e9a820', source: '#4caf50', sink: '#f44336'
        }
        ctx.strokeStyle = colors[cell.type]
        ctx.lineWidth = cell.type === 'pipe' ? 1 : 2
        ctx.strokeRect(px + 1, py + 1, CELL - 2, CELL - 2)

        // Labels
        ctx.fillStyle = '#ffffffcc'
        ctx.font = '8px monospace'
        ctx.textAlign = 'center'
        const labels: Record<CellType, string> = { empty: '', pipe: '', pump: 'P', source: 'S', sink: 'D' }
        if (labels[cell.type]) {
          ctx.fillText(labels[cell.type], px + CELL / 2, py + 10)
        }

        // Pressure value
        ctx.fillStyle = '#ffffff80'
        ctx.font = '7px monospace'
        ctx.fillText(cell.pressure.toFixed(0), px + CELL / 2, py + CELL - 4)
      }
    }

    // Info
    ctx.fillStyle = '#ffffff60'
    ctx.font = '10px monospace'
    ctx.textAlign = 'left'
    ctx.fillText(`${t('fluid.tick')}: ${tick}`, PAD, ctx.canvas.height - 4)
  }, [tick, t])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (ctx) draw(ctx, grid)
  }, [grid, draw])

  useEffect(() => {
    if (!playing) return
    const interval = 1000 / (speed * 10)
    const loop = (time: number) => {
      if (time - lastRef.current >= interval) {
        lastRef.current = time
        setGrid(prev => simulateStep(prev))
        setTick(prev => prev + 1)
      }
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafRef.current)
  }, [playing, speed])

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect()
    const scale = cW / rect.width
    const col = Math.floor(((e.clientX - rect.left) * scale - PAD) / CELL)
    const row = Math.floor(((e.clientY - rect.top) * scale - PAD) / CELL)
    if (col < 0 || col >= GRID_W || row < 0 || row >= GRID_H) return
    const idx = row * GRID_W + col
    setGrid(prev => {
      const next = [...prev]
      if (next[idx].type === tool) {
        next[idx] = { type: 'empty', pressure: 0, flow: 0 }
      } else {
        next[idx] = { type: tool, pressure: tool === 'source' ? MAX_PRESSURE : 0, flow: 0 }
      }
      return next
    })
  }

  const step = () => { setGrid(prev => simulateStep(prev)); setTick(t => t + 1) }
  const reset = () => { setPlaying(false); setGrid(createGrid()); setTick(0) }

  // Stats
  const sources = grid.filter(c => c.type === 'source').length
  const pipes = grid.filter(c => c.type === 'pipe').length
  const pumps = grid.filter(c => c.type === 'pump').length
  const avgPressure = pipes > 0 ? grid.filter(c => c.type === 'pipe').reduce((a, c) => a + c.pressure, 0) / pipes : 0

  return (
    <div>
      <TimelineControls playing={playing} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)}
        onStep={step} onReset={reset} speed={speed} onSpeedChange={setSpeed} tick={tick} />

      <div className="controls-row">
        <div className="control-group">
          <label>{t('fluid.place')}:</label>
          {(['pipe', 'pump', 'source', 'sink'] as CellType[]).map(ct => (
            <button key={ct} className={`btn ${tool === ct ? 'active' : ''}`}
              onClick={() => setTool(ct)}>{t(`fluid.${ct}`)}</button>
          ))}
        </div>
      </div>

      <div style={{ overflowX: 'auto', marginTop: 8 }}>
        <canvas ref={canvasRef} width={cW} height={cH} onClick={handleClick}
          style={{ display: 'block', borderRadius: 4, cursor: 'crosshair', maxWidth: '100%' }} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 8, marginTop: 10 }}>
        <Stat label={t('fluid.sources')} value={`${sources}`} />
        <Stat label={t('fluid.pipes')} value={`${pipes}`} />
        <Stat label={t('fluid.pumps')} value={`${pumps}`} />
        <Stat label={t('fluid.avgPressure')} value={`${avgPressure.toFixed(1)}`} />
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 12px' }}>
      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{label}</div>
      <div style={{ fontSize: 16, color: 'var(--accent)', fontWeight: 700, fontFamily: 'monospace' }}>{value}</div>
    </div>
  )
}
