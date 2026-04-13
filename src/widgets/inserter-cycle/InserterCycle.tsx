import { useState, useRef, useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import TimelineControls from '../../components/Timeline/TimelineControls'

interface InserterType {
  id: string
  color: string
  pickupTicks: number
  dropTicks: number
  rotationTicks: number
  stackSize: number
}

const INSERTER_TYPES: InserterType[] = [
  { id: 'burner', color: '#8a6a3a', pickupTicks: 3, dropTicks: 3, rotationTicks: 52, stackSize: 1 },
  { id: 'basic', color: '#e0a020', pickupTicks: 3, dropTicks: 3, rotationTicks: 26, stackSize: 1 },
  { id: 'long', color: '#e04040', pickupTicks: 3, dropTicks: 3, rotationTicks: 40, stackSize: 1 },
  { id: 'fast', color: '#4080e0', pickupTicks: 2, dropTicks: 2, rotationTicks: 17, stackSize: 1 },
  { id: 'stack', color: '#40e080', pickupTicks: 2, dropTicks: 2, rotationTicks: 17, stackSize: 12 },
  { id: 'bulk', color: '#9c27b0', pickupTicks: 2, dropTicks: 2, rotationTicks: 17, stackSize: 16 },
]

const W = 500
const H = 300
const CX = W / 2
const CY = H / 2 + 20
const ARM_LEN = 90
const PICKUP_ANGLE = -Math.PI * 0.75
const DROP_ANGLE = -Math.PI * 0.25

interface InserterState {
  tick: number
  phase: 'pickup' | 'swing-to-drop' | 'drop' | 'swing-to-pickup'
  phaseTick: number
  itemsCarried: number
  totalDelivered: number
}

function createState(): InserterState {
  return { tick: 0, phase: 'swing-to-pickup', phaseTick: 0, itemsCarried: 0, totalDelivered: 0 }
}

function advanceTick(st: InserterState, ins: InserterType, stackOverride: number): InserterState {
  const stack = Math.min(stackOverride, ins.stackSize)
  let { phase, phaseTick, itemsCarried, totalDelivered } = st

  phaseTick++

  if (phase === 'swing-to-pickup' && phaseTick >= ins.rotationTicks) {
    phase = 'pickup'; phaseTick = 0
  } else if (phase === 'pickup' && phaseTick >= ins.pickupTicks) {
    itemsCarried = stack; phase = 'swing-to-drop'; phaseTick = 0
  } else if (phase === 'swing-to-drop' && phaseTick >= ins.rotationTicks) {
    phase = 'drop'; phaseTick = 0
  } else if (phase === 'drop' && phaseTick >= ins.dropTicks) {
    totalDelivered += itemsCarried; itemsCarried = 0; phase = 'swing-to-pickup'; phaseTick = 0
  }

  return { tick: st.tick + 1, phase, phaseTick, itemsCarried, totalDelivered }
}

function getArmAngle(st: InserterState, ins: InserterType): number {
  const { phase, phaseTick } = st
  if (phase === 'pickup') return PICKUP_ANGLE
  if (phase === 'drop') return DROP_ANGLE
  if (phase === 'swing-to-drop') {
    const t = Math.min(1, phaseTick / ins.rotationTicks)
    return PICKUP_ANGLE + (DROP_ANGLE - PICKUP_ANGLE) * t
  }
  // swing-to-pickup
  const t = Math.min(1, phaseTick / ins.rotationTicks)
  return DROP_ANGLE + (PICKUP_ANGLE - DROP_ANGLE) * t
}

export default function InserterCycle() {
  const { t } = useTranslation()
  const rafRef = useRef(0)
  const lastRef = useRef(0)

  const [insIdx, setInsIdx] = useState(1) // basic
  const [stackSize, setStackSize] = useState(1)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [state, setState] = useState<InserterState>(createState)

  const ins = INSERTER_TYPES[insIdx]
  const totalCycleTicks = ins.pickupTicks + ins.rotationTicks + ins.dropTicks + ins.rotationTicks
  const itemsPerSecond = (Math.min(stackSize, ins.stackSize) / totalCycleTicks) * 60 // 60 ticks/sec

  useEffect(() => {
    if (!playing) return
    const interval = 1000 / (speed * 60) // 60 UPS
    const loop = (time: number) => {
      if (time - lastRef.current >= interval) {
        lastRef.current = time
        setState((p: InserterState) => advanceTick(p, ins, stackSize))
      }
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafRef.current)
  }, [playing, speed, ins, stackSize])

  const angle = getArmAngle(state, ins)
  const handX = CX + Math.cos(angle) * ARM_LEN
  const handY = CY + Math.sin(angle) * ARM_LEN

  const pickupX = CX + Math.cos(PICKUP_ANGLE) * (ARM_LEN + 20)
  const pickupY = CY + Math.sin(PICKUP_ANGLE) * (ARM_LEN + 20)
  const dropX = CX + Math.cos(DROP_ANGLE) * (ARM_LEN + 20)
  const dropY = CY + Math.sin(DROP_ANGLE) * (ARM_LEN + 20)

  return (
    <div>
      <TimelineControls playing={playing} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)}
        onStep={() => setState((p: InserterState) => advanceTick(p, ins, stackSize))}
        onReset={() => { setPlaying(false); setState(createState()) }}
        speed={speed} onSpeedChange={setSpeed} tick={state.tick} />

      <div className="controls-row">
        <div className="control-group">
          <label>{t('inserter.type')}:</label>
          {INSERTER_TYPES.map((it, i) => (
            <button key={it.id} className={`btn ${i === insIdx ? 'active' : ''}`}
              style={i === insIdx ? { borderColor: it.color, color: it.color } : {}}
              onClick={() => { setInsIdx(i); setPlaying(false); setState(createState()); setStackSize(1) }}>
              {t(`inserter.${it.id}`)}
            </button>
          ))}
        </div>
      </div>
      {ins.stackSize > 1 && (
        <div className="controls-row">
          <div className="control-group">
            <label>{t('inserter.stackSize')}:</label>
            <input type="range" min={1} max={ins.stackSize} value={stackSize}
              onChange={(e) => setStackSize(Number(e.target.value))} />
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{stackSize}</span>
          </div>
        </div>
      )}

      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', maxWidth: W, background: '#0d1117', borderRadius: 4, marginTop: 8 }}>
        {/* Swing arc */}
        <path d={`M ${CX + Math.cos(PICKUP_ANGLE) * ARM_LEN} ${CY + Math.sin(PICKUP_ANGLE) * ARM_LEN} A ${ARM_LEN} ${ARM_LEN} 0 0 1 ${CX + Math.cos(DROP_ANGLE) * ARM_LEN} ${CY + Math.sin(DROP_ANGLE) * ARM_LEN}`}
          fill="none" stroke="#ffffff15" strokeWidth={1} strokeDasharray="4,4" />

        {/* Pickup zone */}
        <rect x={pickupX - 20} y={pickupY - 20} width={40} height={40} rx={4}
          fill="#4caf5015" stroke="#4caf5040" strokeWidth={1} />
        <text x={pickupX} y={pickupY + 30} textAnchor="middle" fill="#4caf5060" fontSize={10}>
          {t('inserter.pickup')}
        </text>

        {/* Drop zone */}
        <rect x={dropX - 20} y={dropY - 20} width={40} height={40} rx={4}
          fill="#e0a02015" stroke="#e0a02040" strokeWidth={1} />
        <text x={dropX} y={dropY + 30} textAnchor="middle" fill="#e0a02060" fontSize={10}>
          {t('inserter.drop')}
        </text>

        {/* Inserter base */}
        <circle cx={CX} cy={CY} r={12} fill={ins.color + '40'} stroke={ins.color} strokeWidth={2} />

        {/* Arm */}
        <line x1={CX} y1={CY} x2={handX} y2={handY} stroke={ins.color} strokeWidth={3} strokeLinecap="round" />

        {/* Hand */}
        <circle cx={handX} cy={handY} r={6} fill={state.itemsCarried > 0 ? '#e0a020' : ins.color + '60'}
          stroke={ins.color} strokeWidth={1.5} />
        {state.itemsCarried > 0 && (
          <text x={handX} y={handY + 4} textAnchor="middle" fill="#0d1117" fontSize={8} fontWeight="bold">
            {state.itemsCarried}
          </text>
        )}

        {/* Phase info */}
        <text x={W / 2} y={24} textAnchor="middle" fill="#ffffff80" fontSize={12} fontFamily="monospace">
          {t(`inserter.phase.${state.phase}`)} ({state.phaseTick}/{
            state.phase === 'pickup' ? ins.pickupTicks :
            state.phase === 'drop' ? ins.dropTicks : ins.rotationTicks
          })
        </text>
      </svg>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10, marginTop: 12 }}>
        <Stat label={t('inserter.cycleTicks')} value={`${totalCycleTicks}`} />
        <Stat label={t('inserter.throughput')} value={`${itemsPerSecond.toFixed(2)}/s`} />
        <Stat label={t('inserter.delivered')} value={`${state.totalDelivered}`} />
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 6, padding: '10px 14px' }}>
      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{label}</div>
      <div style={{ fontSize: 18, color: 'var(--accent)', fontWeight: 700, fontFamily: 'monospace' }}>{value}</div>
    </div>
  )
}
