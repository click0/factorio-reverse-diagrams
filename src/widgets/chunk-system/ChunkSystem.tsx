import { useState, useRef, useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'

const GRID = 16
const CELL = 28
const PAD = 6
const CHUNK_SIZE = 32 // 32x32 tiles per chunk in Factorio

type ChunkState = 'uncharted' | 'charted' | 'active' | 'inactive'

interface ChunkCell {
  state: ChunkState
  entities: number
  pollutionGen: number
}

function createGrid(): ChunkCell[] {
  const grid: ChunkCell[] = Array.from({ length: GRID * GRID }, () => ({
    state: 'uncharted', entities: 0, pollutionGen: 0,
  }))

  // Center area is active (player's base)
  const cx = Math.floor(GRID / 2)
  for (let dy = -2; dy <= 2; dy++) {
    for (let dx = -2; dx <= 2; dx++) {
      const i = (cx + dy) * GRID + (cx + dx)
      grid[i] = {
        state: 'active',
        entities: Math.floor(20 + Math.random() * 80),
        pollutionGen: Math.floor(Math.random() * 30),
      }
    }
  }

  // Surrounding area is charted but inactive
  for (let dy = -4; dy <= 4; dy++) {
    for (let dx = -4; dx <= 4; dx++) {
      const r = cx + dy, c = cx + dx
      if (r < 0 || r >= GRID || c < 0 || c >= GRID) continue
      const i = r * GRID + c
      if (grid[i].state === 'uncharted') {
        grid[i] = { state: 'charted', entities: 0, pollutionGen: 0 }
      }
    }
  }

  return grid
}

// Simulate radar scanning — reveals uncharted chunks near active ones
function simulateRadarScan(grid: ChunkCell[], tick: number): ChunkCell[] {
  const next = grid.map(c => ({ ...c }))
  const scanAngle = (tick * 0.15) % (Math.PI * 2)
  const cx = Math.floor(GRID / 2)

  // Radar scans in a rotating wedge
  for (let r = 0; r < GRID; r++) {
    for (let c = 0; c < GRID; c++) {
      if (next[r * GRID + c].state !== 'uncharted') continue
      const dx = c - cx
      const dy = r - cx
      const dist = Math.sqrt(dx * dx + dy * dy)
      const angle = Math.atan2(dy, dx)
      const angleDiff = Math.abs(((angle - scanAngle + Math.PI * 3) % (Math.PI * 2)) - Math.PI)
      if (dist <= 6 && angleDiff < 0.3) {
        next[r * GRID + c].state = 'charted'
      }
    }
  }

  return next
}

const STATE_COLORS: Record<ChunkState, string> = {
  uncharted: '#0a0a0a',
  charted: '#1a1a2e',
  active: '#1a3a1a',
  inactive: '#1a1a2e',
}

export default function ChunkSystem() {
  const { t } = useTranslation()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [grid, setGrid] = useState<ChunkCell[]>(createGrid)
  const [tick, setTick] = useState(0)
  const [showEntities, setShowEntities] = useState(true)
  const [radarActive, setRadarActive] = useState(true)
  const rafRef = useRef(0)
  const lastRef = useRef(0)

  const cW = GRID * CELL + PAD * 2
  const cH = GRID * CELL + PAD * 2

  const draw = useCallback((ctx: CanvasRenderingContext2D, g: ChunkCell[], tk: number) => {
    ctx.fillStyle = '#050508'
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)

    const cx = Math.floor(GRID / 2)

    for (let r = 0; r < GRID; r++) {
      for (let c = 0; c < GRID; c++) {
        const cell = g[r * GRID + c]
        const px = PAD + c * CELL
        const py = PAD + r * CELL

        ctx.fillStyle = STATE_COLORS[cell.state]
        ctx.fillRect(px, py, CELL, CELL)

        // Entity heat
        if (showEntities && cell.entities > 0) {
          const intensity = Math.min(1, cell.entities / 100)
          ctx.fillStyle = `rgba(233, 168, 32, ${intensity * 0.4})`
          ctx.fillRect(px, py, CELL, CELL)
        }

        // Grid
        ctx.strokeStyle = cell.state === 'uncharted' ? '#ffffff04' : '#ffffff0a'
        ctx.lineWidth = 0.5
        ctx.strokeRect(px, py, CELL, CELL)

        // Entity count
        if (showEntities && cell.entities > 0) {
          ctx.fillStyle = '#ffffffa0'
          ctx.font = '8px monospace'
          ctx.textAlign = 'center'
          ctx.fillText(`${cell.entities}`, px + CELL / 2, py + CELL / 2 + 3)
        }
      }
    }

    // Radar sweep line
    if (radarActive) {
      const angle = (tk * 0.15) % (Math.PI * 2)
      const rcx = PAD + cx * CELL + CELL / 2
      const rcy = PAD + cx * CELL + CELL / 2
      const len = 6 * CELL
      ctx.strokeStyle = '#4caf5040'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(rcx, rcy)
      ctx.lineTo(rcx + Math.cos(angle) * len, rcy + Math.sin(angle) * len)
      ctx.stroke()
    }

    // Info
    ctx.fillStyle = '#ffffff60'
    ctx.font = '10px monospace'
    ctx.textAlign = 'left'
    ctx.fillText(`${CHUNK_SIZE}×${CHUNK_SIZE} ${t('chunk.tilesPerChunk')}`, PAD, ctx.canvas.height - 4)
  }, [showEntities, radarActive, t])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (ctx) draw(ctx, grid, tick)
  }, [grid, tick, draw])

  useEffect(() => {
    if (!radarActive) return
    const loop = (time: number) => {
      if (time - lastRef.current >= 100) {
        lastRef.current = time
        setTick(prev => prev + 1)
        setGrid(prev => simulateRadarScan(prev, tick))
      }
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafRef.current)
  }, [radarActive, tick])

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect()
    const scale = cW / rect.width
    const col = Math.floor(((e.clientX - rect.left) * scale - PAD) / CELL)
    const row = Math.floor(((e.clientY - rect.top) * scale - PAD) / CELL)
    if (col < 0 || col >= GRID || row < 0 || row >= GRID) return
    setGrid(prev => {
      const next = [...prev]
      const i = row * GRID + col
      const states: ChunkState[] = ['uncharted', 'charted', 'active']
      const curIdx = states.indexOf(next[i].state)
      const newState = states[(curIdx + 1) % states.length]
      next[i] = { ...next[i], state: newState, entities: newState === 'active' ? Math.floor(20 + Math.random() * 80) : 0 }
      return next
    })
  }

  const stats = {
    uncharted: grid.filter(c => c.state === 'uncharted').length,
    charted: grid.filter(c => c.state === 'charted').length,
    active: grid.filter(c => c.state === 'active').length,
    totalEntities: grid.reduce((s, c) => s + c.entities, 0),
  }

  return (
    <div>
      <div className="controls-row">
        <div className="control-group">
          <label><input type="checkbox" checked={showEntities} onChange={e => setShowEntities(e.target.checked)} /> {t('chunk.showEntities')}</label>
        </div>
        <div className="control-group">
          <label><input type="checkbox" checked={radarActive} onChange={e => setRadarActive(e.target.checked)} /> {t('chunk.radar')}</label>
        </div>
        <button className="btn" onClick={() => { setGrid(createGrid()); setTick(0) }}>{t('controls.reset')}</button>
      </div>

      <div style={{ overflowX: 'auto', marginTop: 8 }}>
        <canvas ref={canvasRef} width={cW} height={cH} onClick={handleClick}
          style={{ display: 'block', borderRadius: 4, cursor: 'crosshair', maxWidth: '100%' }} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 8, marginTop: 10 }}>
        <Stat label={t('chunk.active')} value={`${stats.active}`} color="#4caf50" />
        <Stat label={t('chunk.charted')} value={`${stats.charted}`} color="#4080e0" />
        <Stat label={t('chunk.uncharted')} value={`${stats.uncharted}`} color="#8a8a8a" />
        <Stat label={t('chunk.entities')} value={`${stats.totalEntities}`} color="var(--accent)" />
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
