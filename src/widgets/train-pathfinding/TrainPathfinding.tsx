import { useState, useRef, useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import TimelineControls from '../../components/Timeline/TimelineControls'

type CellType = 'empty' | 'rail' | 'signal' | 'chain-signal' | 'station' | 'train'
type BlockState = 'free' | 'occupied' | 'reserved'

interface RailCell {
  type: CellType
  blockId: number
  direction: 'h' | 'v' // horizontal or vertical
}

const GRID_W = 24
const GRID_H = 10
const CELL = 28
const PAD = 6

const BLOCK_COLORS: Record<BlockState, string> = {
  free: '#4caf5040',
  occupied: '#f4433660',
  reserved: '#ff980050',
}

const SIGNAL_COLORS: Record<BlockState, string> = {
  free: '#4caf50',
  occupied: '#f44336',
  reserved: '#ff9800',
}

function createGrid(): { grid: RailCell[]; blockStates: BlockState[]; trainPos: number } {
  const grid: RailCell[] = Array.from({ length: GRID_W * GRID_H }, () => ({
    type: 'empty', blockId: -1, direction: 'h',
  }))

  // Horizontal main line y=4
  const y = 4
  let blockId = 0

  // Station at start
  grid[y * GRID_W + 1] = { type: 'station', blockId: 0, direction: 'h' }

  // Block 0: tiles 2-7
  for (let x = 2; x <= 7; x++) {
    grid[y * GRID_W + x] = { type: 'rail', blockId: 0, direction: 'h' }
  }

  // Signal at x=8
  grid[y * GRID_W + 8] = { type: 'signal', blockId: 0, direction: 'h' }

  // Block 1: tiles 9-14
  blockId = 1
  for (let x = 9; x <= 14; x++) {
    grid[y * GRID_W + x] = { type: 'rail', blockId: 1, direction: 'h' }
  }

  // Chain signal at x=15 (before intersection)
  grid[y * GRID_W + 15] = { type: 'chain-signal', blockId: 1, direction: 'h' }

  // Block 2: intersection tiles 16-18
  blockId = 2
  for (let x = 16; x <= 18; x++) {
    grid[y * GRID_W + x] = { type: 'rail', blockId: 2, direction: 'h' }
  }

  // Vertical spur through intersection
  for (let dy = -2; dy <= 2; dy++) {
    if (dy === 0) continue
    const vy = y + dy
    if (vy >= 0 && vy < GRID_H) {
      grid[vy * GRID_W + 17] = { type: 'rail', blockId: 2, direction: 'v' }
    }
  }

  // Signal at x=19
  grid[y * GRID_W + 19] = { type: 'signal', blockId: 2, direction: 'h' }

  // Block 3: tiles 20-22
  blockId = 3
  for (let x = 20; x <= 22; x++) {
    grid[y * GRID_W + x] = { type: 'rail', blockId: 3, direction: 'h' }
  }

  // Station at end
  grid[y * GRID_W + 22] = { type: 'station', blockId: 3, direction: 'h' }

  // Train at start
  grid[y * GRID_W + 3] = { type: 'train', blockId: 0, direction: 'h' }

  const blockStates: BlockState[] = ['occupied', 'free', 'free', 'free']

  return { grid, blockStates, trainPos: 3 }
}

interface SimState {
  grid: RailCell[]
  blockStates: BlockState[]
  trainPos: number
  tick: number
  trainTargetBlock: number
  log: string[]
}

function createSimState(): SimState {
  const { grid, blockStates, trainPos } = createGrid()
  return { grid, blockStates, trainPos, tick: 0, trainTargetBlock: 3, log: [] }
}

function simStep(st: SimState, t: (k: string) => string): SimState {
  const { grid, blockStates, trainPos, trainTargetBlock, log: prevLog } = st
  const log = [...prevLog]
  const newBlockStates = [...blockStates]
  const newGrid = grid.map(c => ({ ...c }))
  let newTrainPos = trainPos
  const tick = st.tick + 1

  const y = 4

  // Find next rail cell ahead
  const nextX = trainPos + 1
  if (nextX >= GRID_W) {
    return { ...st, tick, log }
  }

  const nextCell = newGrid[y * GRID_W + nextX]

  if (nextCell.type === 'empty') {
    return { ...st, tick, log }
  }

  // Check if we hit a signal
  if (nextCell.type === 'signal' || nextCell.type === 'chain-signal') {
    const nextBlockId = nextCell.blockId + 1
    if (nextBlockId < newBlockStates.length) {
      const nextBlockState = newBlockStates[nextBlockId]

      if (nextCell.type === 'chain-signal') {
        // Chain signal: check ALL blocks ahead until next regular signal
        let allFree = true
        for (let b = nextBlockId; b < newBlockStates.length; b++) {
          if (newBlockStates[b] !== 'free') { allFree = false; break }
        }
        if (!allFree) {
          log.push(`[${tick}] ⛓ ${t('trainPath.chainBlocked')}`)
          if (log.length > 10) log.shift()
          return { ...st, tick, log, blockStates: newBlockStates }
        }
      } else {
        // Regular signal: only check next block
        if (nextBlockState !== 'free') {
          log.push(`[${tick}] 🚫 ${t('trainPath.blocked')} (block ${nextBlockId})`)
          if (log.length > 10) log.shift()
          return { ...st, tick, log, blockStates: newBlockStates }
        }
      }

      // Reserve next block
      newBlockStates[nextBlockId] = 'reserved'
      log.push(`[${tick}] ✓ ${t('trainPath.reserved')} block ${nextBlockId}`)
    }
  }

  // Move train forward
  const curCell = newGrid[y * GRID_W + trainPos]
  const curBlockId = curCell.blockId

  newGrid[y * GRID_W + trainPos] = { ...curCell, type: curCell.type === 'train' ? 'rail' : curCell.type }
  newGrid[y * GRID_W + nextX] = { ...nextCell, type: 'train' }
  newTrainPos = nextX

  // Update block states
  const newBlockId = nextCell.blockId
  if (newBlockId >= 0 && newBlockId < newBlockStates.length) {
    newBlockStates[newBlockId] = 'occupied'
  }
  // Free previous block if train left it
  if (curBlockId >= 0 && curBlockId !== newBlockId && curBlockId < newBlockStates.length) {
    newBlockStates[curBlockId] = 'free'
    log.push(`[${tick}] ← ${t('trainPath.freed')} block ${curBlockId}`)
  }

  if (log.length > 10) log.shift()
  return { grid: newGrid, blockStates: newBlockStates, trainPos: newTrainPos, tick, trainTargetBlock, log }
}

export default function TrainPathfinding() {
  const { t } = useTranslation()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef(0)
  const lastRef = useRef(0)

  const [state, setState] = useState<SimState>(createSimState)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)

  const cW = GRID_W * CELL + PAD * 2
  const cH = GRID_H * CELL + PAD * 2

  const draw = useCallback((ctx: CanvasRenderingContext2D, st: SimState) => {
    ctx.fillStyle = '#0d1117'
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)

    for (let y = 0; y < GRID_H; y++) {
      for (let x = 0; x < GRID_W; x++) {
        const i = y * GRID_W + x
        const cell = st.grid[i]
        const px = PAD + x * CELL
        const py = PAD + y * CELL

        // Block background
        if (cell.blockId >= 0 && cell.blockId < st.blockStates.length) {
          ctx.fillStyle = BLOCK_COLORS[st.blockStates[cell.blockId]]
          ctx.fillRect(px, py, CELL, CELL)
        }

        ctx.strokeStyle = '#ffffff06'
        ctx.lineWidth = 0.5
        ctx.strokeRect(px, py, CELL, CELL)

        if (cell.type === 'empty') continue

        if (cell.type === 'rail') {
          ctx.fillStyle = '#8a8a8a'
          if (cell.direction === 'h') {
            ctx.fillRect(px + 2, py + CELL / 2 - 2, CELL - 4, 4)
          } else {
            ctx.fillRect(px + CELL / 2 - 2, py + 2, 4, CELL - 4)
          }
        }

        if (cell.type === 'signal' || cell.type === 'chain-signal') {
          const blockAhead = cell.blockId + 1
          const signalState: BlockState = blockAhead < st.blockStates.length ? st.blockStates[blockAhead] : 'free'
          ctx.fillStyle = SIGNAL_COLORS[signalState]
          ctx.beginPath()
          ctx.arc(px + CELL / 2, py + CELL / 2, 6, 0, Math.PI * 2)
          ctx.fill()

          if (cell.type === 'chain-signal') {
            ctx.strokeStyle = '#ffffff80'
            ctx.lineWidth = 1.5
            ctx.stroke()
          }

          // Rail underneath
          ctx.fillStyle = '#8a8a8a'
          ctx.fillRect(px + 2, py + CELL / 2 - 2, CELL - 4, 4)
        }

        if (cell.type === 'station') {
          ctx.fillStyle = '#e9a82060'
          ctx.fillRect(px + 2, py + 2, CELL - 4, CELL - 4)
          ctx.strokeStyle = '#e9a820'
          ctx.lineWidth = 1
          ctx.strokeRect(px + 2, py + 2, CELL - 4, CELL - 4)
          ctx.fillStyle = '#8a8a8a'
          ctx.fillRect(px + 2, py + CELL / 2 - 2, CELL - 4, 4)
          ctx.fillStyle = '#e9a820'
          ctx.font = '8px monospace'
          ctx.textAlign = 'center'
          ctx.fillText('S', px + CELL / 2, py + CELL / 2 + 3)
        }

        if (cell.type === 'train') {
          ctx.fillStyle = '#4080e0'
          ctx.fillRect(px + 3, py + 4, CELL - 6, CELL - 8)
          ctx.strokeStyle = '#6ab0ff'
          ctx.lineWidth = 1.5
          ctx.strokeRect(px + 3, py + 4, CELL - 6, CELL - 8)
          ctx.fillStyle = '#ffffff'
          ctx.font = 'bold 10px monospace'
          ctx.textAlign = 'center'
          ctx.fillText('T', px + CELL / 2, py + CELL / 2 + 4)
          // Rail underneath
          ctx.fillStyle = '#8a8a8a40'
          ctx.fillRect(px + 2, py + CELL / 2 - 2, CELL - 4, 4)
        }
      }
    }

    // Block labels
    ctx.font = '9px monospace'
    ctx.textAlign = 'center'
    const y = 4
    const blockLabels = [{ x: 4.5, id: 0 }, { x: 11.5, id: 1 }, { x: 17, id: 2 }, { x: 21, id: 3 }]
    for (const bl of blockLabels) {
      ctx.fillStyle = SIGNAL_COLORS[st.blockStates[bl.id]] + 'cc'
      ctx.fillText(`${t('common.block')} ${bl.id}`, PAD + bl.x * CELL, PAD + (y + 2) * CELL - 2)
    }
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (ctx) draw(ctx, state)
  }, [state, draw])

  useEffect(() => {
    if (!playing) return
    const interval = 1000 / (speed * 3)
    const loop = (time: number) => {
      if (time - lastRef.current >= interval) {
        lastRef.current = time
        setState((p: SimState) => simStep(p, t))
      }
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafRef.current)
  }, [playing, speed, t])

  const step = () => setState((p: SimState) => simStep(p, t))
  const reset = () => { setPlaying(false); setState(createSimState()) }

  return (
    <div>
      <TimelineControls playing={playing} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)}
        onStep={step} onReset={reset} speed={speed} onSpeedChange={setSpeed} tick={state.tick} />

      {/* Legend */}
      <div className="controls-row" style={{ gap: 8, fontSize: 11 }}>
        {[
          { label: t('trainPath.free'), color: '#4caf50' },
          { label: t('trainPath.reserved'), color: '#ff9800' },
          { label: t('trainPath.occupied'), color: '#f44336' },
          { label: t('trainPath.signal'), color: '#ffffff80', symbol: '●' },
          { label: t('trainPath.chainSignal'), color: '#ffffff80', symbol: '◉' },
        ].map(({ label, color, symbol }) => (
          <span key={label} style={{ color, display: 'flex', alignItems: 'center', gap: 3 }}>
            <span style={{ width: 10, height: 10, borderRadius: symbol ? '50%' : 2, background: color + '60', border: `1px solid ${color}`, display: 'inline-block' }} />
            {label}
          </span>
        ))}
      </div>

      <div style={{ overflowX: 'auto', marginTop: 8 }}>
        <canvas ref={canvasRef} width={cW} height={cH}
          style={{ display: 'block', borderRadius: 4, maxWidth: '100%' }} />
      </div>

      {/* Log */}
      <div style={{ background: '#0d1117', borderRadius: 4, padding: '8px 12px', marginTop: 8, maxHeight: 130, overflowY: 'auto', fontFamily: 'monospace', fontSize: 11 }}>
        {state.log.length === 0 && <span style={{ color: 'var(--text-muted)' }}>{t('trainPath.logEmpty')}</span>}
        {state.log.map((l, i) => (
          <div key={i} style={{ color: l.includes('🚫') || l.includes('⛓') ? '#f44336' : l.includes('✓') ? '#4caf50' : 'var(--text-secondary)', lineHeight: 1.6 }}>{l}</div>
        ))}
      </div>
    </div>
  )
}
