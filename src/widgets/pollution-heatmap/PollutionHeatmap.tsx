import { useState, useRef, useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import TimelineControls from '../../components/Timeline/TimelineControls'
import { ENTITIES, TILE_COLORS, type TileType, type PollutionState } from './types'
import { createState, advanceTick, toggleTile, addEntity, removeEntity } from './diffusionEngine'

const GRID_SIZE = 32
const CELL = 16
const PAD = 8

export default function PollutionHeatmap() {
  const { t } = useTranslation()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef(0)
  const lastRef = useRef(0)

  const [state, setState] = useState<PollutionState>(() => createState(GRID_SIZE, GRID_SIZE))
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [tool, setTool] = useState<'entity' | 'tile'>('entity')
  const [selectedEntity, setSelectedEntity] = useState(0)
  const [selectedTile, setSelectedTile] = useState<TileType>('forest')

  const cW = GRID_SIZE * CELL + PAD * 2
  const cH = GRID_SIZE * CELL + PAD * 2

  const pollutionColor = (val: number): string => {
    if (val < 0.001) return 'transparent'
    const intensity = Math.min(1, val / 0.15)
    const r = Math.floor(255 * intensity)
    const g = Math.floor(200 * (1 - intensity) * intensity)
    const b = 0
    const a = 0.3 + intensity * 0.6
    return `rgba(${r},${g},${b},${a})`
  }

  const tickLabel = t('pollution.tick')
  const maxPLabel = t('pollution.maxPollution')
  const entityNames = [
    t('pollution.ent.boiler'),
    t('pollution.ent.steamEngine'),
    t('pollution.ent.assembler'),
    t('pollution.ent.miningDrill'),
    t('pollution.ent.furnace'),
  ]

  const draw = useCallback((ctx: CanvasRenderingContext2D, st: PollutionState) => {
    ctx.fillStyle = '#0d1117'
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)

    // Tiles
    for (let r = 0; r < st.height; r++) {
      for (let c = 0; c < st.width; c++) {
        const i = r * st.width + c
        const x = PAD + c * CELL
        const y = PAD + r * CELL

        // Tile background
        ctx.fillStyle = TILE_COLORS[st.tiles[i]]
        ctx.fillRect(x, y, CELL, CELL)

        // Pollution overlay
        const pColor = pollutionColor(st.grid[i])
        if (pColor !== 'transparent') {
          ctx.fillStyle = pColor
          ctx.fillRect(x, y, CELL, CELL)
        }

        // Grid line
        ctx.strokeStyle = '#ffffff08'
        ctx.lineWidth = 0.5
        ctx.strokeRect(x, y, CELL, CELL)
      }
    }

    // Entities
    for (const e of st.entities) {
      const x = PAD + e.col * CELL
      const y = PAD + e.row * CELL
      ctx.fillStyle = ENTITIES[e.entityIdx].color
      ctx.fillRect(x + 2, y + 2, CELL - 4, CELL - 4)
      ctx.strokeStyle = '#ffffff60'
      ctx.lineWidth = 1
      ctx.strokeRect(x + 2, y + 2, CELL - 4, CELL - 4)
    }

    // Info
    const maxP = Math.max(...Array.from(st.grid))
    ctx.fillStyle = '#ffffff70'
    ctx.font = '11px monospace'
    ctx.fillText(`${tickLabel} ${st.tick} | ${maxPLabel}: ${maxP.toFixed(4)}`, PAD, ctx.canvas.height - 4)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (ctx) draw(ctx, state)
  }, [state, draw])

  useEffect(() => {
    if (!playing) return
    const interval = 1000 / (speed * 8)
    const loop = (t: number) => {
      if (t - lastRef.current >= interval) {
        lastRef.current = t
        setState((p: PollutionState) => advanceTick(p))
      }
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafRef.current)
  }, [playing, speed])

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect()
    const col = Math.floor((e.clientX - rect.left - PAD) / CELL)
    const row = Math.floor((e.clientY - rect.top - PAD) / CELL)
    if (col < 0 || col >= GRID_SIZE || row < 0 || row >= GRID_SIZE) return

    if (tool === 'tile') {
      setState((p: PollutionState) => toggleTile(p, row, col, selectedTile))
    } else {
      const existing = state.entities.find(en => en.row === row && en.col === col)
      if (existing) {
        setState((p: PollutionState) => removeEntity(p, row, col))
      } else {
        setState((p: PollutionState) => addEntity(p, selectedEntity, row, col))
      }
    }
  }

  return (
    <div>
      <TimelineControls playing={playing} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)}
        onStep={() => setState((p: PollutionState) => advanceTick(p))}
        onReset={() => { setPlaying(false); setState(createState(GRID_SIZE, GRID_SIZE)) }}
        speed={speed} onSpeedChange={setSpeed} tick={state.tick} />

      <div className="controls-row">
        <div className="control-group">
          <label>{t('pollution.tool')}:</label>
          <button className={`btn ${tool === 'entity' ? 'active' : ''}`} onClick={() => setTool('entity')}>{t('pollution.entity')}</button>
          <button className={`btn ${tool === 'tile' ? 'active' : ''}`} onClick={() => setTool('tile')}>{t('pollution.tile')}</button>
        </div>
        {tool === 'entity' ? (
          <div className="control-group">
            <select value={selectedEntity} onChange={(e) => setSelectedEntity(Number(e.target.value))}>
              {ENTITIES.map((_, i) => <option key={i} value={i}>{entityNames[i]} ({ENTITIES[i].pollutionPerMinute}/min)</option>)}
            </select>
          </div>
        ) : (
          <div className="control-group">
            <select value={selectedTile} onChange={(e) => setSelectedTile(e.target.value as TileType)}>
              <option value="grass">{t('pollution.grass')}</option>
              <option value="forest">{t('pollution.forest')}</option>
              <option value="water">{t('pollution.water')}</option>
              <option value="concrete">{t('pollution.concrete')}</option>
            </select>
          </div>
        )}
      </div>

      <div style={{ overflowX: 'auto', marginTop: 8 }}>
        <canvas ref={canvasRef} width={cW} height={cH} onClick={handleCanvasClick}
          style={{ display: 'block', borderRadius: 4, cursor: 'crosshair' }} />
      </div>
    </div>
  )
}
