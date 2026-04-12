import { useState, useRef, useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import TimelineControls from '../../components/Timeline/TimelineControls'
import { BELT_TIERS, type BeltTier, type BeltState, type Scenario, type SplitterConfig } from './types'
import { createInitialState, advanceTick, getSlotCount, getSideSlots } from './beltEngine'

const S = 18 // slot pixel size
const GAP = 3
const PAD = 14

export default function BeltSimulator() {
  const { t } = useTranslation()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef(0)
  const lastRef = useRef(0)

  const [tierIdx, setTierIdx] = useState(0)
  const [scenario, setScenario] = useState<Scenario>('straight')
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [splitterCfg, setSplitterCfg] = useState<SplitterConfig>({ inputPriority: 'none', outputPriority: 'none' })
  const [state, setState] = useState<BeltState>(() => createInitialState('straight'))

  const tier = BELT_TIERS[tierIdx]
  const slots = getSlotCount()
  const sideSlots = getSideSlots()

  const cW = scenario === 'splitter' ? (slots * 2 + 4) * S + PAD * 2 : slots * S + PAD * 2
  const cH = scenario === 'sideload'
    ? (2 * S + GAP) + sideSlots * S + PAD * 2 + 20
    : scenario === 'splitter'
      ? (4 * S + GAP * 3) + PAD * 2 + 20
      : (2 * S + GAP) + PAD * 2 + 20

  const drawLane = (ctx: CanvasRenderingContext2D, lane: (import('./types').Item | null)[], x0: number, y0: number, horizontal: boolean, color: string) => {
    const len = lane.length
    for (let i = 0; i < len; i++) {
      const x = horizontal ? x0 + i * S : x0
      const y = horizontal ? y0 : y0 + i * S
      ctx.strokeStyle = color + '35'
      ctx.lineWidth = 0.5
      ctx.strokeRect(x, y, S, S)
      const item = lane[i]
      if (item) {
        ctx.fillStyle = item.color
        ctx.beginPath()
        ctx.arc(x + S / 2, y + S / 2, S * 0.35, 0, Math.PI * 2)
        ctx.fill()
        ctx.strokeStyle = '#ffffff30'
        ctx.lineWidth = 0.8
        ctx.stroke()
      }
    }
  }

  const draw = useCallback((ctx: CanvasRenderingContext2D, st: BeltState, bt: BeltTier) => {
    ctx.fillStyle = '#0d1117'
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)

    const c = bt.color
    if (scenario === 'straight') {
      ctx.fillStyle = c + '20'
      ctx.fillRect(PAD, PAD, slots * S, 2 * S + GAP)
      drawLane(ctx, st.topLane, PAD, PAD, true, c)
      drawLane(ctx, st.bottomLane, PAD, PAD + S + GAP, true, c)
      ctx.fillStyle = c + '80'
      ctx.font = '13px sans-serif'
      ctx.fillText('\u2192', PAD + slots * S + 4, PAD + S + GAP / 2 + 4)
    } else if (scenario === 'sideload') {
      // Main horizontal belt
      const mainY = PAD + sideSlots * S + 10
      ctx.fillStyle = c + '20'
      ctx.fillRect(PAD, mainY, slots * S, 2 * S + GAP)
      drawLane(ctx, st.topLane, PAD, mainY, true, c)
      drawLane(ctx, st.bottomLane, PAD, mainY + S + GAP, true, c)
      // Side belt (vertical, feeding from top into bottom lane at midpoint)
      const sideX = PAD + 16 * S
      ctx.fillStyle = '#4caf5020'
      ctx.fillRect(sideX, PAD, S, sideSlots * S)
      drawLane(ctx, st.sideInput, sideX, PAD, false, '#4caf50')
      // Arrow showing side-load point
      ctx.fillStyle = '#4caf5080'
      ctx.font = '13px sans-serif'
      ctx.fillText('\u2193', sideX + 3, PAD + sideSlots * S + 8)
      ctx.fillStyle = c + '80'
      ctx.fillText('\u2192', PAD + slots * S + 4, mainY + S + GAP / 2 + 4)
    } else {
      // Splitter view: input belt -> [splitter] -> two output belts
      const inputW = Math.floor(slots / 2)
      const outW = Math.floor(slots / 2)
      const splX = PAD + inputW * S
      const outX = splX + 4 * S

      // Input belt
      ctx.fillStyle = c + '20'
      ctx.fillRect(PAD, PAD, inputW * S, 2 * S + GAP)
      drawLane(ctx, st.topLane.slice(0, inputW), PAD, PAD, true, c)
      drawLane(ctx, st.bottomLane.slice(0, inputW), PAD, PAD + S + GAP, true, c)

      // Splitter box
      ctx.fillStyle = '#e9a82040'
      ctx.fillRect(splX, PAD - S / 2, 3 * S, 4 * S + GAP * 2)
      ctx.strokeStyle = '#e9a82080'
      ctx.lineWidth = 1.5
      ctx.strokeRect(splX, PAD - S / 2, 3 * S, 4 * S + GAP * 2)
      ctx.fillStyle = '#e9a820'
      ctx.font = '10px monospace'
      ctx.fillText('SPL', splX + S * 0.5, PAD + S + GAP / 2 + 3)

      // Output A (top)
      const outAY = PAD - S / 2
      ctx.fillStyle = c + '20'
      ctx.fillRect(outX, outAY, outW * S, 2 * S + GAP)
      drawLane(ctx, st.splitOutTopA.slice(0, outW), outX, outAY, true, c)
      drawLane(ctx, st.splitOutBottomA.slice(0, outW), outX, outAY + S + GAP, true, c)
      ctx.fillStyle = '#ffffff60'
      ctx.font = '10px monospace'
      ctx.fillText('A', outX + outW * S + 4, outAY + S + 3)

      // Output B (bottom)
      const outBY = PAD + 2 * S + GAP * 2
      ctx.fillStyle = c + '20'
      ctx.fillRect(outX, outBY, outW * S, 2 * S + GAP)
      drawLane(ctx, st.splitOutTopB.slice(0, outW), outX, outBY, true, c)
      drawLane(ctx, st.splitOutBottomB.slice(0, outW), outX, outBY + S + GAP, true, c)
      ctx.fillStyle = '#ffffff60'
      ctx.fillText('B', outX + outW * S + 4, outBY + S + 3)
    }

    // Info line
    ctx.fillStyle = '#ffffff70'
    ctx.font = '11px monospace'
    ctx.fillText(`${bt.name} | ${bt.itemsPerSecond} items/s | Tick ${st.tick}`, PAD, ctx.canvas.height - 5)
  }, [scenario, slots, sideSlots])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (ctx) draw(ctx, state, tier)
  }, [state, tier, draw])

  useEffect(() => {
    if (!playing) return
    const interval = 1000 / (speed * 4)
    const loop = (t: number) => {
      if (t - lastRef.current >= interval) {
        lastRef.current = t
        setState((p: BeltState) => advanceTick(p, tier, scenario, splitterCfg))
      }
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafRef.current)
  }, [playing, speed, tier, scenario, splitterCfg])

  const step = () => setState((p: BeltState) => advanceTick(p, tier, scenario, splitterCfg))
  const reset = () => { setPlaying(false); setState(createInitialState(scenario)) }

  const changeTier = (i: number) => { setTierIdx(i); setPlaying(false); setState(createInitialState(scenario)) }
  const changeScenario = (s: Scenario) => { setScenario(s); setPlaying(false); setState(createInitialState(s)) }

  return (
    <div>
      <TimelineControls playing={playing} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)}
        onStep={step} onReset={reset} speed={speed} onSpeedChange={setSpeed} tick={state.tick} />

      <div className="controls-row">
        <div className="control-group">
          <label>{t('belt.tier')}:</label>
          {BELT_TIERS.map((bt, i) => (
            <button key={bt.name} className={`btn ${i === tierIdx ? 'active' : ''}`}
              style={{ borderColor: i === tierIdx ? bt.color : undefined, color: i === tierIdx ? bt.color : undefined }}
              onClick={() => changeTier(i)}>{bt.name}</button>
          ))}
        </div>
        <div className="control-group">
          <label>{t('belt.mode')}:</label>
          {(['straight', 'sideload', 'splitter'] as Scenario[]).map((s) => (
            <button key={s} className={`btn ${scenario === s ? 'active' : ''}`}
              onClick={() => changeScenario(s)}>{t(`belt.${s}`)}</button>
          ))}
        </div>
      </div>

      {scenario === 'splitter' && (
        <div className="controls-row">
          <div className="control-group">
            <label>{t('belt.outputPriority')}:</label>
            <select value={splitterCfg.outputPriority}
              onChange={(e) => setSplitterCfg({ ...splitterCfg, outputPriority: e.target.value as SplitterConfig['outputPriority'] })}>
              <option value="none">{t('belt.priorityNone')}</option>
              <option value="left">{t('belt.priorityLeft')}</option>
              <option value="right">{t('belt.priorityRight')}</option>
            </select>
          </div>
        </div>
      )}

      <div style={{ overflowX: 'auto', marginTop: 8 }}>
        <canvas ref={canvasRef} width={cW} height={cH}
          style={{ display: 'block', borderRadius: 4 }} />
      </div>
    </div>
  )
}
