import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import TimelineControls from '../../components/Timeline/TimelineControls'

// Factorio game tick phases (executed in order each tick, 60 ticks/second)
const PHASES = [
  { id: 'input', durationPct: 5, color: '#9c27b0' },
  { id: 'transport', durationPct: 15, color: '#4080e0' },
  { id: 'entity-update', durationPct: 35, color: '#e9a820' },
  { id: 'electric', durationPct: 10, color: '#ffc107' },
  { id: 'fluid', durationPct: 10, color: '#2196f3' },
  { id: 'pollution', durationPct: 5, color: '#4caf50' },
  { id: 'combat', durationPct: 8, color: '#f44336' },
  { id: 'robot', durationPct: 7, color: '#00bcd4' },
  { id: 'render', durationPct: 5, color: '#8bc34a' },
]

const SVG_W = 700
const SVG_H = 300
const BAR_Y = 60
const BAR_H = 40
const PAD = 40

interface TickState {
  tick: number
  currentPhase: number
  phaseProgress: number // 0-1 within current phase
  ups: number
}

function createState(): TickState {
  return { tick: 0, currentPhase: 0, phaseProgress: 0, ups: 60 }
}

function advanceTick(st: TickState): TickState {
  let { currentPhase, phaseProgress, tick } = st
  phaseProgress += 0.15

  if (phaseProgress >= 1) {
    phaseProgress = 0
    currentPhase++
    if (currentPhase >= PHASES.length) {
      currentPhase = 0
      tick++
    }
  }

  return { ...st, tick, currentPhase, phaseProgress }
}

export default function GameTick() {
  const { t } = useTranslation()
  const rafRef = useRef(0)
  const lastRef = useRef(0)

  const [state, setState] = useState<TickState>(createState)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [targetUPS, setTargetUPS] = useState(60)

  useEffect(() => {
    if (!playing) return
    const interval = 1000 / (speed * 15)
    const loop = (time: number) => {
      if (time - lastRef.current >= interval) {
        lastRef.current = time
        setState((p: TickState) => advanceTick(p))
      }
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafRef.current)
  }, [playing, speed])

  const step = () => setState((p: TickState) => advanceTick(p))
  const reset = () => { setPlaying(false); setState(createState()) }

  // Calculate cumulative positions for bar
  let cumX = PAD
  const phaseRects = PHASES.map((phase, i) => {
    const w = (phase.durationPct / 100) * (SVG_W - PAD * 2)
    const rect = { x: cumX, w, phase, index: i }
    cumX += w
    return rect
  })

  const tickDuration = 1000 / targetUPS // ms per tick
  const msPerPhase = PHASES.map(p => (p.durationPct / 100) * tickDuration)

  return (
    <div>
      <TimelineControls playing={playing} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)}
        onStep={step} onReset={reset} speed={speed} onSpeedChange={setSpeed} tick={state.tick} />

      <div className="controls-row">
        <div className="control-group">
          <label>{t('gameTick.targetUPS')}:</label>
          <input type="range" min={10} max={120} value={targetUPS}
            onChange={(e) => setTargetUPS(Number(e.target.value))} />
          <span style={{ fontSize: 13, color: 'var(--accent)', minWidth: 40 }}>{targetUPS} UPS</span>
        </div>
        <div className="control-group">
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {t('gameTick.tickBudget')}: {tickDuration.toFixed(1)}ms
          </span>
        </div>
      </div>

      <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} style={{ width: '100%', maxWidth: SVG_W, background: '#0d1117', borderRadius: 4, marginTop: 8 }}>
        {/* Title */}
        <text x={SVG_W / 2} y={24} textAnchor="middle" fill="#ffffff80" fontSize={12} fontWeight="bold">
          {t('gameTick.oneTickTitle')} ({tickDuration.toFixed(1)}ms @ {targetUPS} UPS)
        </text>

        {/* Phase bars */}
        {phaseRects.map(({ x, w, phase, index }) => {
          const isCurrent = index === state.currentPhase
          const isPast = index < state.currentPhase
          const progressW = isCurrent ? w * state.phaseProgress : 0

          return (
            <g key={phase.id}>
              {/* Background */}
              <rect x={x} y={BAR_Y} width={w} height={BAR_H} rx={index === 0 ? 4 : 0}
                fill={isPast ? phase.color + '60' : phase.color + '20'}
                stroke={isCurrent ? '#ffffff' : phase.color + '60'} strokeWidth={isCurrent ? 2 : 0.5} />

              {/* Progress fill */}
              {isCurrent && (
                <rect x={x} y={BAR_Y} width={progressW} height={BAR_H}
                  fill={phase.color + '80'} rx={index === 0 ? 4 : 0} />
              )}

              {/* Label */}
              {w > 30 && (
                <text x={x + w / 2} y={BAR_Y + BAR_H / 2 + 4} textAnchor="middle"
                  fill={isCurrent ? '#ffffff' : '#ffffffaa'} fontSize={9} fontWeight={isCurrent ? 'bold' : 'normal'}>
                  {t(`gameTick.phase.${phase.id}`)}
                </text>
              )}
            </g>
          )
        })}

        {/* Phase detail rows below */}
        {PHASES.map((phase, i) => {
          const rowY = BAR_Y + BAR_H + 24 + i * 20
          const isCurrent = i === state.currentPhase
          return (
            <g key={phase.id}>
              <rect x={PAD} y={rowY - 8} width={10} height={10} rx={2} fill={phase.color} />
              <text x={PAD + 16} y={rowY} fill={isCurrent ? '#ffffff' : '#ffffff80'} fontSize={10}
                fontWeight={isCurrent ? 'bold' : 'normal'}>
                {t(`gameTick.phase.${phase.id}`)}
              </text>
              <text x={SVG_W / 2} y={rowY} fill="#ffffff60" fontSize={9} fontFamily="monospace">
                {phase.durationPct}% | {msPerPhase[i].toFixed(2)}ms
              </text>
              <text x={SVG_W - PAD} y={rowY} textAnchor="end" fill="#ffffff50" fontSize={9}>
                {t(`gameTick.desc.${phase.id}`)}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
