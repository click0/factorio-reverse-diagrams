import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import TimelineControls from '../../components/Timeline/TimelineControls'
import { COMBINATOR_COLORS, SIGNAL_TYPES, ARITH_OPS, DECIDER_OPS, type CircuitState, type CombinatorEntity, type CombinatorType, type ArithConfig, type DeciderConfig, type ConstantConfig, type Signal, type Wire } from './types'
import { createInitialState, advanceTick } from './circuitEngine'

const SVG_W = 700
const SVG_H = 280
const ENT_W = 120
const ENT_H = 56

let idCounter = 100

export default function CombinatorSandbox() {
  const { t } = useTranslation()
  const rafRef = useRef(0)
  const lastRef = useRef(0)

  const [state, setState] = useState<CircuitState>(createInitialState)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [selected, setSelected] = useState<string | null>(null)
  const [wireMode, setWireMode] = useState<{ fromId: string; color: 'red' | 'green' } | null>(null)

  // Auto-step
  useEffect(() => {
    if (!playing) return
    const interval = 1000 / (speed * 2)
    const loop = (time: number) => {
      if (time - lastRef.current >= interval) {
        lastRef.current = time
        setState((p: CircuitState) => advanceTick(p))
      }
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafRef.current)
  }, [playing, speed])

  const step = () => setState((p: CircuitState) => advanceTick(p))
  const reset = () => { setPlaying(false); setState(createInitialState()); setSelected(null); setWireMode(null) }

  const addEntity = (type: CombinatorType) => {
    const id = `${type}-${idCounter++}`
    const x = 100 + Math.random() * 400
    const y = 60 + Math.random() * 160
    let config: ConstantConfig | ArithConfig | DeciderConfig

    if (type === 'constant') {
      config = { signals: [{ type: 'A', value: 1 }] } as ConstantConfig
    } else if (type === 'arithmetic') {
      config = { leftSignal: 'A', rightSignal: null, rightConst: 1, op: '+', outputSignal: 'B' } as ArithConfig
    } else {
      config = { leftSignal: 'A', rightSignal: null, rightConst: 0, op: '>', outputSignal: 'A', outputOne: true } as DeciderConfig
    }

    const entity: CombinatorEntity = { id, type, x, y, config }
    setState(prev => ({ ...prev, entities: [...prev.entities, entity] }))
  }

  const handleEntityClick = (entityId: string) => {
    if (wireMode) {
      if (wireMode.fromId !== entityId) {
        const wire: Wire = { id: `w-${idCounter++}`, color: wireMode.color, fromId: wireMode.fromId, toId: entityId }
        setState(prev => ({ ...prev, wires: [...prev.wires, wire] }))
      }
      setWireMode(null)
    } else {
      setSelected(selected === entityId ? null : entityId)
    }
  }

  const deleteSelected = () => {
    if (!selected) return
    setState(prev => ({
      ...prev,
      entities: prev.entities.filter(e => e.id !== selected),
      wires: prev.wires.filter(w => w.fromId !== selected && w.toId !== selected),
    }))
    setSelected(null)
  }

  const selectedEntity = state.entities.find(e => e.id === selected)

  return (
    <div>
      <TimelineControls playing={playing} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)}
        onStep={step} onReset={reset} speed={speed} onSpeedChange={setSpeed} tick={state.tick} />

      <div className="controls-row">
        <div className="control-group">
          <label>{t('circuit.add')}:</label>
          <button className="btn" style={{ borderColor: COMBINATOR_COLORS.constant, color: COMBINATOR_COLORS.constant }}
            onClick={() => addEntity('constant')}>{t('circuit.constant')}</button>
          <button className="btn" style={{ borderColor: COMBINATOR_COLORS.arithmetic, color: COMBINATOR_COLORS.arithmetic }}
            onClick={() => addEntity('arithmetic')}>{t('circuit.arithmetic')}</button>
          <button className="btn" style={{ borderColor: COMBINATOR_COLORS.decider, color: COMBINATOR_COLORS.decider }}
            onClick={() => addEntity('decider')}>{t('circuit.decider')}</button>
        </div>
        {selected && (
          <div className="control-group">
            <button className="btn" style={{ borderColor: '#e04040', color: '#e04040' }}
              onClick={deleteSelected}>{t('circuit.delete')}</button>
            <button className="btn" style={{ borderColor: '#ff4444', color: '#ff4444' }}
              onClick={() => setWireMode({ fromId: selected, color: 'red' })}>{t('circuit.wireRed')}</button>
            <button className="btn" style={{ borderColor: '#44ff44', color: '#44ff44' }}
              onClick={() => setWireMode({ fromId: selected, color: 'green' })}>{t('circuit.wireGreen')}</button>
          </div>
        )}
        {wireMode && (
          <span style={{ fontSize: 12, color: wireMode.color === 'red' ? '#ff4444' : '#44ff44' }}>
            {t('circuit.clickTarget')}...
          </span>
        )}
      </div>

      {/* Circuit diagram */}
      <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} style={{ width: '100%', maxWidth: SVG_W, background: '#0d1117', borderRadius: 4, marginTop: 8 }}>
        {/* Wires */}
        {state.wires.map(wire => {
          const from = state.entities.find(e => e.id === wire.fromId)
          const to = state.entities.find(e => e.id === wire.toId)
          if (!from || !to) return null
          const offset = wire.color === 'red' ? -3 : 3
          return (
            <line key={wire.id}
              x1={from.x + ENT_W / 2} y1={from.y + ENT_H / 2 + offset}
              x2={to.x + ENT_W / 2} y2={to.y + ENT_H / 2 + offset}
              stroke={wire.color === 'red' ? '#ff4444' : '#44ff44'}
              strokeWidth={2} opacity={0.6} />
          )
        })}

        {/* Entities */}
        {state.entities.map(ent => {
          const color = COMBINATOR_COLORS[ent.type]
          const isSel = selected === ent.id
          const outputs = state.outputs.get(ent.id) || []

          return (
            <g key={ent.id} onClick={() => handleEntityClick(ent.id)} style={{ cursor: 'pointer' }}>
              <rect x={ent.x} y={ent.y} width={ENT_W} height={ENT_H} rx={4}
                fill={isSel ? color + '40' : color + '18'}
                stroke={isSel ? '#ffffff' : color} strokeWidth={isSel ? 2 : 1} />

              {/* Type label */}
              <text x={ent.x + ENT_W / 2} y={ent.y + 14} textAnchor="middle"
                fill={color} fontSize={10} fontWeight="bold">
                {t(`circuit.${ent.type}`)}
              </text>

              {/* Config summary */}
              <text x={ent.x + ENT_W / 2} y={ent.y + 28} textAnchor="middle"
                fill="#ffffff80" fontSize={8} fontFamily="monospace">
                {getConfigSummary(ent)}
              </text>

              {/* Output signals */}
              <text x={ent.x + ENT_W / 2} y={ent.y + ENT_H - 6} textAnchor="middle"
                fill="#ffffff60" fontSize={8} fontFamily="monospace">
                {outputs.map(s => `${s.type}=${s.value}`).join(' ') || '—'}
              </text>
            </g>
          )
        })}
      </svg>

      {/* Entity editor */}
      {selectedEntity && (
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 6, padding: 14, marginTop: 10 }}>
          <strong style={{ color: COMBINATOR_COLORS[selectedEntity.type] }}>
            {t(`circuit.${selectedEntity.type}`)}
          </strong>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 8 }}>{selectedEntity.id}</span>

          <div style={{ marginTop: 8 }}>
            {selectedEntity.type === 'constant' && (
              <ConstantEditor entity={selectedEntity} onChange={(cfg) => updateConfig(selectedEntity.id, cfg, setState)} t={t} />
            )}
            {selectedEntity.type === 'arithmetic' && (
              <ArithEditor entity={selectedEntity} onChange={(cfg) => updateConfig(selectedEntity.id, cfg, setState)} t={t} />
            )}
            {selectedEntity.type === 'decider' && (
              <DeciderEditor entity={selectedEntity} onChange={(cfg) => updateConfig(selectedEntity.id, cfg, setState)} t={t} />
            )}
          </div>
        </div>
      )}

      {/* Signal table */}
      {state.tick > 0 && (
        <div style={{ marginTop: 10, fontSize: 11, fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
          <strong style={{ color: 'var(--text-primary)' }}>{t('circuit.signalTable')} (tick {state.tick}):</strong>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 4, marginTop: 4 }}>
            {state.entities.map(ent => {
              const outputs = state.outputs.get(ent.id) || []
              return (
                <div key={ent.id} style={{ background: '#0d1117', padding: '4px 8px', borderRadius: 3 }}>
                  <span style={{ color: COMBINATOR_COLORS[ent.type] }}>{ent.id.split('-')[0]}:</span>{' '}
                  {outputs.length > 0 ? outputs.map(s => `${s.type}=${s.value}`).join(', ') : '—'}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function getConfigSummary(ent: CombinatorEntity): string {
  if (ent.type === 'constant') {
    const cfg = ent.config as ConstantConfig
    return cfg.signals.map(s => `${s.type}=${s.value}`).join(' ')
  }
  if (ent.type === 'arithmetic') {
    const cfg = ent.config as ArithConfig
    const right = cfg.rightSignal || cfg.rightConst
    return `${cfg.leftSignal} ${cfg.op} ${right} → ${cfg.outputSignal}`
  }
  const cfg = ent.config as DeciderConfig
  const right = cfg.rightSignal || cfg.rightConst
  return `${cfg.leftSignal} ${cfg.op} ${right} → ${cfg.outputSignal}`
}

function updateConfig(entityId: string, config: ConstantConfig | ArithConfig | DeciderConfig, setState: React.Dispatch<React.SetStateAction<CircuitState>>) {
  setState(prev => ({
    ...prev,
    entities: prev.entities.map(e => e.id === entityId ? { ...e, config } : e),
  }))
}

function ConstantEditor({ entity, onChange, t }: { entity: CombinatorEntity; onChange: (cfg: ConstantConfig) => void; t: (k: string) => string }) {
  const cfg = entity.config as ConstantConfig
  return (
    <div className="controls-row" style={{ gap: 6 }}>
      {cfg.signals.map((sig, i) => (
        <div key={i} className="control-group">
          <select value={sig.type} onChange={(e) => { const s = [...cfg.signals]; s[i] = { ...s[i], type: e.target.value as any }; onChange({ signals: s }) }}
            style={selectStyle}>{SIGNAL_TYPES.map(s => <option key={s} value={s}>{s}</option>)}</select>
          <input type="number" value={sig.value} onChange={(e) => { const s = [...cfg.signals]; s[i] = { ...s[i], value: Number(e.target.value) }; onChange({ signals: s }) }}
            style={{ ...selectStyle, width: 60 }} />
        </div>
      ))}
      <button className="btn" onClick={() => onChange({ signals: [...cfg.signals, { type: 'A', value: 0 }] })}>+</button>
    </div>
  )
}

function ArithEditor({ entity, onChange, t }: { entity: CombinatorEntity; onChange: (cfg: ArithConfig) => void; t: (k: string) => string }) {
  const cfg = entity.config as ArithConfig
  return (
    <div className="controls-row" style={{ gap: 6 }}>
      <select value={cfg.leftSignal} onChange={(e) => onChange({ ...cfg, leftSignal: e.target.value as any })} style={selectStyle}>
        {SIGNAL_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
      </select>
      <select value={cfg.op} onChange={(e) => onChange({ ...cfg, op: e.target.value as any })} style={selectStyle}>
        {ARITH_OPS.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      <input type="number" value={cfg.rightConst} onChange={(e) => onChange({ ...cfg, rightConst: Number(e.target.value) })}
        style={{ ...selectStyle, width: 60 }} />
      <span style={{ color: 'var(--text-muted)' }}>→</span>
      <select value={cfg.outputSignal} onChange={(e) => onChange({ ...cfg, outputSignal: e.target.value as any })} style={selectStyle}>
        {SIGNAL_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
      </select>
    </div>
  )
}

function DeciderEditor({ entity, onChange, t }: { entity: CombinatorEntity; onChange: (cfg: DeciderConfig) => void; t: (k: string) => string }) {
  const cfg = entity.config as DeciderConfig
  return (
    <div className="controls-row" style={{ gap: 6 }}>
      <select value={cfg.leftSignal} onChange={(e) => onChange({ ...cfg, leftSignal: e.target.value as any })} style={selectStyle}>
        {SIGNAL_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
      </select>
      <select value={cfg.op} onChange={(e) => onChange({ ...cfg, op: e.target.value as any })} style={selectStyle}>
        {DECIDER_OPS.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      <input type="number" value={cfg.rightConst} onChange={(e) => onChange({ ...cfg, rightConst: Number(e.target.value) })}
        style={{ ...selectStyle, width: 60 }} />
      <span style={{ color: 'var(--text-muted)' }}>→</span>
      <select value={cfg.outputSignal} onChange={(e) => onChange({ ...cfg, outputSignal: e.target.value as any })} style={selectStyle}>
        {SIGNAL_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
      </select>
      <label style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
        <input type="checkbox" checked={cfg.outputOne} onChange={(e) => onChange({ ...cfg, outputOne: e.target.checked })} />
        {' '}=1
      </label>
    </div>
  )
}

const selectStyle: React.CSSProperties = {
  background: 'var(--bg-primary)', color: 'var(--text-primary)',
  border: '1px solid var(--border)', borderRadius: 4, padding: '2px 6px', fontSize: 12,
}
