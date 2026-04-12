import type { CircuitState, CombinatorEntity, Wire, Signal, SignalType, ArithConfig, DeciderConfig, ConstantConfig, ArithOp, DeciderOp } from './types'

/** Collect all signals arriving at an entity via wires from previous tick outputs */
function collectInputs(entityId: string, wires: Wire[], prevOutputs: Map<string, Signal[]>): Signal[] {
  const signals = new Map<SignalType, number>()

  for (const wire of wires) {
    let sourceId: string | null = null
    if (wire.fromId === entityId) sourceId = wire.toId
    if (wire.toId === entityId) sourceId = wire.fromId
    if (!sourceId) continue

    const sourceSignals = prevOutputs.get(sourceId) || []
    for (const sig of sourceSignals) {
      signals.set(sig.type, (signals.get(sig.type) || 0) + sig.value)
    }
  }

  return Array.from(signals.entries()).map(([type, value]) => ({ type, value }))
}

function applyArithOp(a: number, b: number, op: ArithOp): number {
  switch (op) {
    case '+': return a + b
    case '-': return a - b
    case '*': return a * b
    case '/': return b !== 0 ? Math.trunc(a / b) : 0
    case '%': return b !== 0 ? a % b : 0
    case '**': return Math.pow(a, b)
    case '<<': return a << b
    case '>>': return a >> b
    case 'AND': return a & b
    case 'OR': return a | b
    case 'XOR': return a ^ b
  }
}

function evalDecider(a: number, b: number, op: DeciderOp): boolean {
  switch (op) {
    case '>': return a > b
    case '<': return a < b
    case '=': return a === b
    case '>=': return a >= b
    case '<=': return a <= b
    case '!=': return a !== b
  }
}

function evaluateEntity(entity: CombinatorEntity, inputs: Signal[]): Signal[] {
  if (entity.type === 'constant') {
    return (entity.config as ConstantConfig).signals.filter(s => s.value !== 0)
  }

  if (entity.type === 'arithmetic') {
    const cfg = entity.config as ArithConfig
    const leftVal = inputs.find(s => s.type === cfg.leftSignal)?.value || 0
    const rightVal = cfg.rightSignal
      ? (inputs.find(s => s.type === cfg.rightSignal)?.value || 0)
      : cfg.rightConst
    const result = applyArithOp(leftVal, rightVal, cfg.op)
    if (result === 0) return []
    return [{ type: cfg.outputSignal, value: result }]
  }

  if (entity.type === 'decider') {
    const cfg = entity.config as DeciderConfig
    const leftVal = inputs.find(s => s.type === cfg.leftSignal)?.value || 0
    const rightVal = cfg.rightSignal
      ? (inputs.find(s => s.type === cfg.rightSignal)?.value || 0)
      : cfg.rightConst
    const pass = evalDecider(leftVal, rightVal, cfg.op)
    if (!pass) return []
    const outVal = cfg.outputOne ? 1 : (inputs.find(s => s.type === cfg.outputSignal)?.value || leftVal)
    return [{ type: cfg.outputSignal, value: outVal }]
  }

  return []
}

export function createInitialState(): CircuitState {
  const entities: CombinatorEntity[] = [
    {
      id: 'const-1', type: 'constant', x: 60, y: 100,
      config: { signals: [{ type: 'A', value: 10 }, { type: 'B', value: 5 }] } as ConstantConfig,
    },
    {
      id: 'arith-1', type: 'arithmetic', x: 260, y: 80,
      config: { leftSignal: 'A', rightSignal: null, rightConst: 3, op: '*', outputSignal: 'C' } as ArithConfig,
    },
    {
      id: 'decider-1', type: 'decider', x: 460, y: 100,
      config: { leftSignal: 'C', rightSignal: null, rightConst: 20, op: '>', outputSignal: 'D', outputOne: true } as DeciderConfig,
    },
  ]

  const wires: Wire[] = [
    { id: 'w1', color: 'red', fromId: 'const-1', toId: 'arith-1' },
    { id: 'w2', color: 'green', fromId: 'arith-1', toId: 'decider-1' },
  ]

  return {
    entities,
    wires,
    outputs: new Map(),
    prevOutputs: new Map(),
    tick: 0,
  }
}

export function advanceTick(state: CircuitState): CircuitState {
  const newOutputs = new Map<string, Signal[]>()

  for (const entity of state.entities) {
    const inputs = collectInputs(entity.id, state.wires, state.prevOutputs)
    const outputs = evaluateEntity(entity, inputs)
    newOutputs.set(entity.id, outputs)
  }

  return {
    ...state,
    prevOutputs: new Map(state.outputs),
    outputs: newOutputs,
    tick: state.tick + 1,
  }
}
