import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'

export type ConditionType = 'circuit' | 'item-count' | 'fluid-count' | 'time' | 'inactivity' | 'full-cargo' | 'empty-cargo'

export interface TrainStop {
  id: string
  name: string
  color: string
}

export interface Interrupt {
  id: string
  name: string
  condition: ConditionType
  threshold: number
  targetStop: string
  enabled: boolean
}

interface ScheduleEntry {
  stopId: string
  waitCondition: ConditionType
  waitValue: number
}

const STOPS: TrainStop[] = [
  { id: 'iron-load', name: 'Iron Loading', color: '#8a9bae' },
  { id: 'iron-unload', name: 'Iron Unloading', color: '#8a9bae' },
  { id: 'copper-load', name: 'Copper Loading', color: '#d4874e' },
  { id: 'copper-unload', name: 'Copper Unloading', color: '#d4874e' },
  { id: 'fuel', name: 'Fuel Station', color: '#e9a820' },
  { id: 'depot', name: 'Depot', color: '#6b6b80' },
]

const DEFAULT_SCHEDULE: ScheduleEntry[] = [
  { stopId: 'iron-load', waitCondition: 'full-cargo', waitValue: 0 },
  { stopId: 'iron-unload', waitCondition: 'empty-cargo', waitValue: 0 },
]

const DEFAULT_INTERRUPTS: Interrupt[] = [
  { id: 'int-1', name: 'Low Fuel', condition: 'item-count', threshold: 5, targetStop: 'fuel', enabled: true },
  { id: 'int-2', name: 'Inactivity Timeout', condition: 'inactivity', threshold: 300, targetStop: 'depot', enabled: false },
]

const CONDITION_LABELS: Record<ConditionType, string> = {
  'circuit': 'train.cond.circuit',
  'item-count': 'train.cond.itemCount',
  'fluid-count': 'train.cond.fluidCount',
  'time': 'train.cond.time',
  'inactivity': 'train.cond.inactivity',
  'full-cargo': 'train.cond.fullCargo',
  'empty-cargo': 'train.cond.emptyCargo',
}

interface SimState {
  currentStopIdx: number
  tick: number
  waitTick: number
  interrupted: boolean
  interruptId: string | null
  log: string[]
}

function simulateStep(st: SimState, schedule: ScheduleEntry[], interrupts: Interrupt[]): SimState {
  const log = [...st.log]
  let { currentStopIdx, tick, waitTick, interrupted, interruptId } = st
  tick++
  waitTick++

  // Check interrupts first
  for (const int of interrupts) {
    if (!int.enabled) continue
    if (interrupted && interruptId === int.id) continue

    let triggered = false
    if (int.condition === 'item-count' && waitTick > 60) triggered = true
    if (int.condition === 'inactivity' && waitTick > int.threshold / 5) triggered = true
    if (int.condition === 'time' && waitTick > int.threshold / 5) triggered = true

    if (triggered) {
      const stopName = STOPS.find(s => s.id === int.targetStop)?.name || int.targetStop
      log.push(`[${tick}] ⚡ ${int.name} → ${stopName}`)
      interrupted = true
      interruptId = int.id
      waitTick = 0
      if (log.length > 12) log.shift()
      return { currentStopIdx, tick, waitTick, interrupted, interruptId, log }
    }
  }

  // Normal schedule progression
  const entry = schedule[currentStopIdx]
  let advance = false

  if (entry.waitCondition === 'full-cargo' && waitTick > 40) advance = true
  if (entry.waitCondition === 'empty-cargo' && waitTick > 20) advance = true
  if (entry.waitCondition === 'time' && waitTick > entry.waitValue / 5) advance = true
  if (entry.waitCondition === 'inactivity' && waitTick > entry.waitValue / 5) advance = true

  if (advance) {
    currentStopIdx = (currentStopIdx + 1) % schedule.length
    const nextStop = STOPS.find(s => s.id === schedule[currentStopIdx].stopId)
    log.push(`[${tick}] → ${nextStop?.name || '?'}`)
    waitTick = 0
    interrupted = false
    interruptId = null
    if (log.length > 12) log.shift()
  }

  return { currentStopIdx, tick, waitTick, interrupted, interruptId, log }
}

const NODE_W = 110
const NODE_H = 36
const SVG_W = 700
const SVG_H = 200

export default function TrainInterrupts() {
  const { t } = useTranslation()
  const [schedule] = useState<ScheduleEntry[]>(DEFAULT_SCHEDULE)
  const [interrupts, setInterrupts] = useState<Interrupt[]>(DEFAULT_INTERRUPTS)
  const [simState, setSimState] = useState<SimState>({
    currentStopIdx: 0, tick: 0, waitTick: 0, interrupted: false, interruptId: null, log: []
  })
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const rafRef = useRef(0)
  const lastRef = useRef(0)

  // Animation loop
  useEffect(() => {
    if (!playing) return
    const interval = 1000 / (speed * 4)
    const loop = (time: number) => {
      if (time - lastRef.current >= interval) {
        lastRef.current = time
        setSimState((prev: SimState) => simulateStep(prev, schedule, interrupts))
      }
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafRef.current)
  }, [playing, speed, schedule, interrupts])

  const toggleInterrupt = (id: string) => {
    setInterrupts(prev => prev.map(i => i.id === id ? { ...i, enabled: !i.enabled } : i))
  }

  const step = () => setSimState(prev => simulateStep(prev, schedule, interrupts))
  const reset = () => setSimState({ currentStopIdx: 0, tick: 0, waitTick: 0, interrupted: false, interruptId: null, log: [] })

  // Layout schedule stops in a row
  const scheduleStops = schedule.map((e, i) => {
    const stop = STOPS.find(s => s.id === e.stopId)!
    return { ...stop, x: 80 + i * 180, y: 50, condition: e.waitCondition }
  })

  // Interrupt targets
  const intTargets = interrupts.map((int, i) => {
    const stop = STOPS.find(s => s.id === int.targetStop)!
    return { ...int, stop, x: 80 + i * 200, y: 150 }
  })

  return (
    <div>
      <div className="controls-row">
        <button className="btn" onClick={() => setPlaying(!playing)}>
          {playing ? '⏸' : '▶'} {playing ? t('controls.pause') : t('controls.play')}
        </button>
        <button className="btn" onClick={step}>{t('controls.step')}</button>
        <button className="btn" onClick={reset}>{t('controls.reset')}</button>
        <div className="control-group">
          <label>{t('controls.speed')}:</label>
          <input type="range" min={0.25} max={4} step={0.25} value={speed}
            onChange={(e) => setSpeed(parseFloat(e.target.value))} />
          <span style={{ fontSize: 12, color: 'var(--text-secondary)', minWidth: 36 }}>{speed}x</span>
        </div>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t('common.tick')}: {simState.tick}</span>
      </div>

      {/* Interrupt toggles */}
      <div className="controls-row">
        <label style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{t('train.interrupts')}:</label>
        {interrupts.map(int => (
          <button key={int.id} className={`btn ${int.enabled ? 'active' : ''}`}
            onClick={() => toggleInterrupt(int.id)}
            style={int.enabled ? { borderColor: '#f44336', color: '#f44336' } : {}}>
            ⚡ {t(`train.int.${int.id}`, { defaultValue: int.name })}
          </button>
        ))}
      </div>

      {/* Schedule visualization */}
      <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} style={{ width: '100%', maxWidth: SVG_W, background: '#0d1117', borderRadius: 4, marginTop: 8 }}>
        {/* Schedule stops */}
        {scheduleStops.map((s, i) => {
          const isCurrent = schedule[simState.currentStopIdx]?.stopId === s.id && !simState.interrupted
          return (
            <g key={i}>
              <rect x={s.x - NODE_W / 2} y={s.y - NODE_H / 2} width={NODE_W} height={NODE_H} rx={4}
                fill={isCurrent ? s.color + '40' : s.color + '15'}
                stroke={isCurrent ? '#ffffff' : s.color} strokeWidth={isCurrent ? 2 : 1} />
              <text x={s.x} y={s.y - 2} textAnchor="middle" fill="#ffffffcc" fontSize={10} fontWeight="bold">
                {t(`train.stop.${s.id}`, { defaultValue: s.name })}
              </text>
              <text x={s.x} y={s.y + 12} textAnchor="middle" fill="#ffffff60" fontSize={8}>
                {t(CONDITION_LABELS[s.condition])}
              </text>
              {i < scheduleStops.length - 1 && (
                <line x1={s.x + NODE_W / 2 + 4} y1={s.y} x2={scheduleStops[i + 1].x - NODE_W / 2 - 10} y2={scheduleStops[i + 1].y}
                  stroke="#ffffff30" strokeWidth={1.5} markerEnd="url(#train-arrow)" />
              )}
            </g>
          )
        })}
        {/* Return arrow */}
        {scheduleStops.length > 1 && (
          <path d={`M ${scheduleStops[scheduleStops.length - 1].x} ${scheduleStops[scheduleStops.length - 1].y + NODE_H / 2 + 5} Q ${(scheduleStops[0].x + scheduleStops[scheduleStops.length - 1].x) / 2} ${scheduleStops[0].y + 60} ${scheduleStops[0].x} ${scheduleStops[0].y + NODE_H / 2 + 5}`}
            fill="none" stroke="#ffffff20" strokeWidth={1} strokeDasharray="4,4" markerEnd="url(#train-arrow)" />
        )}

        {/* Interrupt targets */}
        {intTargets.map((int) => (
          <g key={int.id} style={{ opacity: int.enabled ? 1 : 0.3 }}>
            <rect x={int.x - NODE_W / 2} y={int.y - NODE_H / 2} width={NODE_W} height={NODE_H} rx={4}
              fill={simState.interruptId === int.id ? '#f4433630' : '#f4433610'}
              stroke={simState.interruptId === int.id ? '#f44336' : '#f4433660'} strokeWidth={1} strokeDasharray="4,2" />
            <text x={int.x} y={int.y - 2} textAnchor="middle" fill="#f44336cc" fontSize={9} fontWeight="bold">
              ⚡ {t(`train.int.${int.id}`, { defaultValue: int.name })}
            </text>
            <text x={int.x} y={int.y + 12} textAnchor="middle" fill="#ffffff50" fontSize={8}>
              → {t(`train.stop.${int.stop.id}`, { defaultValue: int.stop.name })}
            </text>
          </g>
        ))}

        <defs>
          <marker id="train-arrow" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="#ffffff50" />
          </marker>
        </defs>
      </svg>

      {/* Log */}
      <div style={{ background: '#0d1117', borderRadius: 4, padding: '8px 12px', marginTop: 8, maxHeight: 160, overflowY: 'auto', fontFamily: 'monospace', fontSize: 11 }}>
        {simState.log.length === 0 && <span style={{ color: 'var(--text-muted)' }}>{t('train.logEmpty')}</span>}
        {simState.log.map((l, i) => (
          <div key={i} style={{ color: l.includes('⚡') ? '#f44336' : 'var(--text-secondary)', lineHeight: 1.6 }}>{l}</div>
        ))}
      </div>
    </div>
  )
}
