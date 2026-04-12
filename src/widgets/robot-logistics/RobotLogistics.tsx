import { useState, useRef, useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'

const GRID = 20
const CELL = 24
const PAD = 6

type CellType = 'empty' | 'roboport' | 'chest' | 'charger'

interface RobotCell {
  type: CellType
  inRange: boolean
  chargeRange: boolean
}

const ROBOPORT_LOGISTICS_RANGE = 5 // tiles radius for logistics
const ROBOPORT_CONSTRUCTION_RANGE = 8 // tiles radius for construction
const CHARGE_RANGE = 2 // tiles around roboport for charging pads

function createGrid(): RobotCell[] {
  const grid: RobotCell[] = Array.from({ length: GRID * GRID }, () => ({
    type: 'empty', inRange: false, chargeRange: false,
  }))
  // Default: one roboport in center
  const cx = Math.floor(GRID / 2)
  grid[cx * GRID + cx] = { type: 'roboport', inRange: true, chargeRange: true }
  return updateCoverage(grid)
}

function updateCoverage(grid: RobotCell[]): RobotCell[] {
  const result = grid.map(c => ({ ...c, inRange: false, chargeRange: false }))
  const roboports: { r: number; c: number }[] = []

  for (let r = 0; r < GRID; r++) {
    for (let c = 0; c < GRID; c++) {
      if (grid[r * GRID + c].type === 'roboport') {
        roboports.push({ r, c })
      }
    }
  }

  for (let r = 0; r < GRID; r++) {
    for (let c = 0; c < GRID; c++) {
      const idx = r * GRID + c
      for (const rp of roboports) {
        const dist = Math.max(Math.abs(r - rp.r), Math.abs(c - rp.c)) // Chebyshev distance
        if (dist <= ROBOPORT_LOGISTICS_RANGE) {
          result[idx].inRange = true
        }
        if (dist <= CHARGE_RANGE) {
          result[idx].chargeRange = true
        }
      }
      // Roboports are always in range
      if (result[idx].type === 'roboport') {
        result[idx].inRange = true
        result[idx].chargeRange = true
      }
    }
  }

  return result
}

export default function RobotLogistics() {
  const { t } = useTranslation()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [grid, setGrid] = useState<RobotCell[]>(createGrid)
  const [tool, setTool] = useState<CellType>('roboport')

  const cW = GRID * CELL + PAD * 2
  const cH = GRID * CELL + PAD * 2

  // Stats
  const roboports = grid.filter(c => c.type === 'roboport').length
  const chests = grid.filter(c => c.type === 'chest').length
  const coveredCells = grid.filter(c => c.inRange).length
  const totalCells = GRID * GRID
  const coveragePct = (coveredCells / totalCells * 100).toFixed(1)
  const chargePorts = roboports * 4 // 4 charge slots per roboport
  const robotCapacity = roboports * 25 // ~25 robots per roboport storage

  const draw = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = '#0d1117'
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)

    for (let r = 0; r < GRID; r++) {
      for (let c = 0; c < GRID; c++) {
        const idx = r * GRID + c
        const cell = grid[idx]
        const px = PAD + c * CELL
        const py = PAD + r * CELL

        // Coverage background
        if (cell.chargeRange) {
          ctx.fillStyle = '#00bcd420'
          ctx.fillRect(px, py, CELL, CELL)
        } else if (cell.inRange) {
          ctx.fillStyle = '#4caf5015'
          ctx.fillRect(px, py, CELL, CELL)
        }

        ctx.strokeStyle = '#ffffff06'
        ctx.lineWidth = 0.5
        ctx.strokeRect(px, py, CELL, CELL)

        if (cell.type === 'roboport') {
          ctx.fillStyle = '#00bcd440'
          ctx.fillRect(px + 2, py + 2, CELL - 4, CELL - 4)
          ctx.strokeStyle = '#00bcd4'
          ctx.lineWidth = 1.5
          ctx.strokeRect(px + 2, py + 2, CELL - 4, CELL - 4)
          ctx.fillStyle = '#00bcd4'
          ctx.font = '9px monospace'
          ctx.textAlign = 'center'
          ctx.fillText('R', px + CELL / 2, py + CELL / 2 + 3)
        }

        if (cell.type === 'chest') {
          ctx.fillStyle = '#e9a82060'
          ctx.fillRect(px + 4, py + 4, CELL - 8, CELL - 8)
          ctx.strokeStyle = '#e9a820'
          ctx.lineWidth = 1
          ctx.strokeRect(px + 4, py + 4, CELL - 8, CELL - 8)
        }
      }
    }
  }, [grid])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (ctx) draw(ctx)
  }, [draw])

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect()
    const scale = cW / rect.width
    const col = Math.floor(((e.clientX - rect.left) * scale - PAD) / CELL)
    const row = Math.floor(((e.clientY - rect.top) * scale - PAD) / CELL)
    if (col < 0 || col >= GRID || row < 0 || row >= GRID) return
    const idx = row * GRID + col

    setGrid(prev => {
      const next = [...prev]
      if (next[idx].type === tool) {
        next[idx] = { ...next[idx], type: 'empty' }
      } else {
        next[idx] = { ...next[idx], type: tool }
      }
      return updateCoverage(next)
    })
  }

  return (
    <div>
      <div className="controls-row">
        <div className="control-group">
          <label>{t('robots.place')}:</label>
          <button className={`btn ${tool === 'roboport' ? 'active' : ''}`}
            style={tool === 'roboport' ? { borderColor: '#00bcd4', color: '#00bcd4' } : {}}
            onClick={() => setTool('roboport')}>{t('robots.roboport')}</button>
          <button className={`btn ${tool === 'chest' ? 'active' : ''}`}
            style={tool === 'chest' ? { borderColor: '#e9a820', color: '#e9a820' } : {}}
            onClick={() => setTool('chest')}>{t('robots.chest')}</button>
          <button className={`btn ${tool === 'empty' ? 'active' : ''}`}
            onClick={() => setTool('empty')}>{t('beacon.eraser')}</button>
        </div>
        <button className="btn" onClick={() => setGrid(createGrid())}>{t('controls.reset')}</button>
      </div>

      {/* Legend */}
      <div className="controls-row" style={{ gap: 8, fontSize: 11 }}>
        <span style={{ color: '#4caf50', display: 'flex', alignItems: 'center', gap: 3 }}>
          <span style={{ width: 10, height: 10, background: '#4caf5025', border: '1px solid #4caf5060', display: 'inline-block' }} />
          {t('robots.logisticsZone')}
        </span>
        <span style={{ color: '#00bcd4', display: 'flex', alignItems: 'center', gap: 3 }}>
          <span style={{ width: 10, height: 10, background: '#00bcd430', border: '1px solid #00bcd460', display: 'inline-block' }} />
          {t('robots.chargeZone')}
        </span>
      </div>

      <div style={{ display: 'flex', gap: 16, marginTop: 8, flexWrap: 'wrap' }}>
        <canvas ref={canvasRef} width={cW} height={cH} onClick={handleClick}
          style={{ display: 'block', borderRadius: 4, cursor: 'crosshair', maxWidth: '100%' }} />

        <div style={{ flex: 1, minWidth: 180, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Stat label={t('robots.roboports')} value={`${roboports}`} color="#00bcd4" />
          <Stat label={t('robots.coverage')} value={`${coveragePct}%`} color="#4caf50" />
          <Stat label={t('robots.chests')} value={`${chests}`} color="#e9a820" />
          <Stat label={t('robots.chargePorts')} value={`${chargePorts}`} />
          <Stat label={t('robots.robotCapacity')} value={`${robotCapacity}`} />
        </div>
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
