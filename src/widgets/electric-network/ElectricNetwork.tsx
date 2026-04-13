import { useState, useRef, useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'

const GRID = 16
const CELL = 28
const PAD = 6

type PoleType = 'small' | 'medium' | 'big' | 'substation'

interface Pole {
  type: PoleType
  row: number
  col: number
}

const POLE_STATS: Record<PoleType, { wireReach: number; supplyArea: number; color: string; maxConn: number }> = {
  small: { wireReach: 7, supplyArea: 2, color: '#e9a820', maxConn: 2 },
  medium: { wireReach: 9, supplyArea: 3, color: '#4080e0', maxConn: 2 },
  big: { wireReach: 30, supplyArea: 2, color: '#4caf50', maxConn: 4 },
  substation: { wireReach: 18, supplyArea: 7, color: '#9c27b0', maxConn: 4 },
}

function getConnections(poles: Pole[]): [number, number][] {
  // Build candidate connections sorted by distance (nearest first)
  const candidates: { i: number; j: number; dist: number }[] = []
  for (let i = 0; i < poles.length; i++) {
    for (let j = i + 1; j < poles.length; j++) {
      const a = poles[i], b = poles[j]
      const dist = Math.sqrt((a.row - b.row) ** 2 + (a.col - b.col) ** 2)
      const reach = Math.min(POLE_STATS[a.type].wireReach, POLE_STATS[b.type].wireReach)
      if (dist <= reach / 2) {
        candidates.push({ i, j, dist })
      }
    }
  }
  // Sort by distance — connect nearest poles first
  candidates.sort((a, b) => a.dist - b.dist)

  // Respect maxConn limits per pole
  const connCount = new Map<number, number>()
  const connections: [number, number][] = []

  for (const { i, j } of candidates) {
    const aCount = connCount.get(i) || 0
    const bCount = connCount.get(j) || 0
    const aMax = POLE_STATS[poles[i].type].maxConn
    const bMax = POLE_STATS[poles[j].type].maxConn

    if (aCount < aMax && bCount < bMax) {
      connections.push([i, j])
      connCount.set(i, aCount + 1)
      connCount.set(j, bCount + 1)
    }
  }

  return connections
}

function getSuppliedCells(poles: Pole[]): Set<number> {
  const supplied = new Set<number>()
  for (const pole of poles) {
    const area = POLE_STATS[pole.type].supplyArea
    for (let dr = -area; dr <= area; dr++) {
      for (let dc = -area; dc <= area; dc++) {
        const r = pole.row + dr, c = pole.col + dc
        if (r >= 0 && r < GRID && c >= 0 && c < GRID) {
          supplied.add(r * GRID + c)
        }
      }
    }
  }
  return supplied
}

export default function ElectricNetwork() {
  const { t } = useTranslation()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [poles, setPoles] = useState<Pole[]>([
    { type: 'substation', row: 4, col: 4 },
    { type: 'substation', row: 4, col: 11 },
    { type: 'medium', row: 8, col: 7 },
    { type: 'small', row: 11, col: 3 },
    { type: 'small', row: 11, col: 5 },
    { type: 'big', row: 12, col: 12 },
  ])
  const [tool, setTool] = useState<PoleType>('medium')

  const cW = GRID * CELL + PAD * 2
  const cH = GRID * CELL + PAD * 2

  const connections = getConnections(poles)
  const supplied = getSuppliedCells(poles)

  // Find networks via flood fill on connections
  const networkCount = (() => {
    const visited = new Set<number>()
    let count = 0
    for (let i = 0; i < poles.length; i++) {
      if (visited.has(i)) continue
      count++
      const queue = [i]
      while (queue.length) {
        const cur = queue.pop()!
        if (visited.has(cur)) continue
        visited.add(cur)
        for (const [a, b] of connections) {
          if (a === cur && !visited.has(b)) queue.push(b)
          if (b === cur && !visited.has(a)) queue.push(a)
        }
      }
    }
    return count
  })()

  const draw = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = '#0d1117'
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)

    // Supply area
    for (let r = 0; r < GRID; r++) {
      for (let c = 0; c < GRID; c++) {
        const px = PAD + c * CELL, py = PAD + r * CELL
        if (supplied.has(r * GRID + c)) {
          ctx.fillStyle = '#e9a82010'
          ctx.fillRect(px, py, CELL, CELL)
        }
        ctx.strokeStyle = '#ffffff06'
        ctx.lineWidth = 0.5
        ctx.strokeRect(px, py, CELL, CELL)
      }
    }

    // Wire connections
    for (const [i, j] of connections) {
      const a = poles[i], b = poles[j]
      ctx.strokeStyle = '#e0404080'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(PAD + a.col * CELL + CELL / 2, PAD + a.row * CELL + CELL / 2)
      ctx.lineTo(PAD + b.col * CELL + CELL / 2, PAD + b.row * CELL + CELL / 2)
      ctx.stroke()
    }

    // Count connections per pole
    const connPerPole = new Map<number, number>()
    for (const [i, j] of connections) {
      connPerPole.set(i, (connPerPole.get(i) || 0) + 1)
      connPerPole.set(j, (connPerPole.get(j) || 0) + 1)
    }

    // Poles
    for (let pi = 0; pi < poles.length; pi++) {
      const pole = poles[pi]
      const px = PAD + pole.col * CELL, py = PAD + pole.row * CELL
      const stat = POLE_STATS[pole.type]
      const count = connPerPole.get(pi) || 0
      const atMax = count >= stat.maxConn

      ctx.fillStyle = atMax ? '#ff980030' : stat.color + '50'
      ctx.fillRect(px + 3, py + 3, CELL - 6, CELL - 6)
      ctx.strokeStyle = atMax ? '#ff9800' : stat.color
      ctx.lineWidth = atMax ? 2 : 1.5
      ctx.strokeRect(px + 3, py + 3, CELL - 6, CELL - 6)
      ctx.fillStyle = '#fff'
      ctx.font = '8px monospace'
      ctx.textAlign = 'center'
      ctx.fillText(pole.type[0].toUpperCase(), px + CELL / 2, py + CELL / 2 + 1)

      // Connection count indicator
      ctx.fillStyle = atMax ? '#ff9800' : '#ffffff60'
      ctx.font = '7px monospace'
      ctx.fillText(`${count}/${stat.maxConn}`, px + CELL / 2, py + CELL - 4)
    }
  }, [poles, connections, supplied])

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

    const existing = poles.findIndex(p => p.row === row && p.col === col)
    if (existing >= 0) {
      setPoles(prev => prev.filter((_, i) => i !== existing))
    } else {
      setPoles(prev => [...prev, { type: tool, row, col }])
    }
  }

  return (
    <div>
      <div className="controls-row">
        <div className="control-group">
          <label>{t('electric.place')}:</label>
          {(['small', 'medium', 'big', 'substation'] as PoleType[]).map(pt => (
            <button key={pt} className={`btn ${tool === pt ? 'active' : ''}`}
              style={tool === pt ? { borderColor: POLE_STATS[pt].color, color: POLE_STATS[pt].color } : {}}
              onClick={() => setTool(pt)}>
              {t(`electric.${pt}`)}
            </button>
          ))}
        </div>
        <button className="btn" onClick={() => setPoles([])}>{t('controls.reset')}</button>
      </div>

      <div style={{ display: 'flex', gap: 16, marginTop: 8, flexWrap: 'wrap' }}>
        <canvas ref={canvasRef} width={cW} height={cH} onClick={handleClick}
          style={{ display: 'block', borderRadius: 4, cursor: 'crosshair', maxWidth: '100%' }} />
        <div style={{ flex: 1, minWidth: 160, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Stat label={t('electric.poles')} value={`${poles.length}`} />
          <Stat label={t('electric.networks')} value={`${networkCount}`} color={networkCount > 1 ? '#ff9800' : '#4caf50'} />
          <Stat label={t('electric.coverage')} value={`${(supplied.size / (GRID * GRID) * 100).toFixed(1)}%`} color="#e9a820" />
          <Stat label={t('electric.connections')} value={`${connections.length}`} />
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
