import { useState, useRef, useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import TimelineControls from '../../components/Timeline/TimelineControls'
import { BELT_TIERS, type BeltTier, type BeltState } from './types'
import { createInitialState, advanceTick, getSlotCount } from './beltEngine'

const SLOT_SIZE = 20
const LANE_GAP = 4
const PADDING = 16

export default function BeltSimulator() {
  const { t } = useTranslation()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animFrameRef = useRef<number>(0)
  const lastTickRef = useRef<number>(0)

  const [tierIndex, setTierIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [state, setState] = useState<BeltState>(() =>
    createInitialState(BELT_TIERS[0])
  )

  const tier = BELT_TIERS[tierIndex]
  const slotCount = getSlotCount()

  const canvasWidth = slotCount * SLOT_SIZE + PADDING * 2
  const canvasHeight = 2 * SLOT_SIZE + LANE_GAP + PADDING * 2

  // Draw
  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, st: BeltState, beltTier: BeltTier) => {
      const w = ctx.canvas.width
      const h = ctx.canvas.height

      ctx.fillStyle = '#0d1117'
      ctx.fillRect(0, 0, w, h)

      // Belt background
      const beltY = PADDING
      const beltW = slotCount * SLOT_SIZE
      const beltH = 2 * SLOT_SIZE + LANE_GAP

      // Draw belt surface
      ctx.fillStyle = beltTier.color + '30'
      ctx.fillRect(PADDING, beltY, beltW, beltH)

      // Draw lanes
      for (let laneIdx = 0; laneIdx < 2; laneIdx++) {
        const lane = laneIdx === 0 ? st.topLane : st.bottomLane
        const laneY = beltY + laneIdx * (SLOT_SIZE + LANE_GAP)

        // Slot grid
        for (let i = 0; i < slotCount; i++) {
          const x = PADDING + i * SLOT_SIZE

          // Slot border
          ctx.strokeStyle = beltTier.color + '40'
          ctx.lineWidth = 0.5
          ctx.strokeRect(x, laneY, SLOT_SIZE, SLOT_SIZE)

          // Item
          const item = lane[i]
          if (item) {
            ctx.fillStyle = item.color
            ctx.beginPath()
            ctx.arc(x + SLOT_SIZE / 2, laneY + SLOT_SIZE / 2, SLOT_SIZE * 0.35, 0, Math.PI * 2)
            ctx.fill()

            // Highlight border
            ctx.strokeStyle = '#ffffff40'
            ctx.lineWidth = 1
            ctx.stroke()
          }
        }

        // Lane label
        ctx.fillStyle = '#ffffff60'
        ctx.font = '10px monospace'
        ctx.fillText(laneIdx === 0 ? 'L' : 'R', PADDING - 12, laneY + SLOT_SIZE / 2 + 3)
      }

      // Direction arrow
      ctx.fillStyle = beltTier.color + '80'
      ctx.font = '14px sans-serif'
      ctx.fillText('\u2192', PADDING + beltW + 4, beltY + beltH / 2 + 5)

      // Info
      ctx.fillStyle = '#ffffff80'
      ctx.font = '12px monospace'
      ctx.fillText(
        `${beltTier.name} Belt | ${beltTier.itemsPerSecond} items/s | Tick ${st.tick}`,
        PADDING,
        h - 6
      )
    },
    [slotCount]
  )

  // Render canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    draw(ctx, state, tier)
  }, [state, tier, draw])

  // Animation loop
  useEffect(() => {
    if (!playing) return

    const tickInterval = 1000 / (speed * 4) // base: 4 ticks per second at 1x

    const loop = (time: number) => {
      if (time - lastTickRef.current >= tickInterval) {
        lastTickRef.current = time
        setState((prev: BeltState) => advanceTick(prev, tier))
      }
      animFrameRef.current = requestAnimationFrame(loop)
    }

    animFrameRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(animFrameRef.current)
  }, [playing, speed, tier])

  const handleStep = () => {
    setState((prev: BeltState) => advanceTick(prev, tier))
  }

  const handleReset = () => {
    setPlaying(false)
    setState(createInitialState(tier))
  }

  const handleTierChange = (idx: number) => {
    setTierIndex(idx)
    setPlaying(false)
    setState(createInitialState(BELT_TIERS[idx]))
  }

  return (
    <div>
      <TimelineControls
        playing={playing}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onStep={handleStep}
        onReset={handleReset}
        speed={speed}
        onSpeedChange={setSpeed}
        tick={state.tick}
      />

      <div className="controls-row">
        <div className="control-group">
          <label>Belt Tier:</label>
          {BELT_TIERS.map((t, i) => (
            <button
              key={t.name}
              className={`btn ${i === tierIndex ? 'active' : ''}`}
              style={{
                borderColor: i === tierIndex ? t.color : undefined,
                color: i === tierIndex ? t.color : undefined,
              }}
              onClick={() => handleTierChange(i)}
            >
              {t.name}
            </button>
          ))}
        </div>
      </div>

      <div style={{ overflowX: 'auto', marginTop: 8 }}>
        <canvas
          ref={canvasRef}
          width={canvasWidth}
          height={canvasHeight}
          style={{
            display: 'block',
            borderRadius: 4,
            imageRendering: 'pixelated',
          }}
        />
      </div>
    </div>
  )
}
