export type SignalType = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'each' | 'any' | 'all'

export interface Signal {
  type: SignalType
  value: number
}

export type CombinatorType = 'constant' | 'arithmetic' | 'decider'
export type ArithOp = '+' | '-' | '*' | '/' | '%' | '**' | '<<' | '>>' | 'AND' | 'OR' | 'XOR'
export type DeciderOp = '>' | '<' | '=' | '>=' | '<=' | '!='
export type WireColor = 'red' | 'green'

export interface ConstantConfig {
  signals: Signal[]
}

export interface ArithConfig {
  leftSignal: SignalType
  rightSignal: SignalType | null
  rightConst: number
  op: ArithOp
  outputSignal: SignalType
}

export interface DeciderConfig {
  leftSignal: SignalType
  rightSignal: SignalType | null
  rightConst: number
  op: DeciderOp
  outputSignal: SignalType
  outputOne: boolean // true = output 1, false = output input count
}

export interface CombinatorEntity {
  id: string
  type: CombinatorType
  x: number
  y: number
  config: ConstantConfig | ArithConfig | DeciderConfig
}

export interface Wire {
  id: string
  color: WireColor
  fromId: string
  toId: string
}

export interface CircuitState {
  entities: CombinatorEntity[]
  wires: Wire[]
  /** Current output signals per entity (computed after each tick) */
  outputs: Map<string, Signal[]>
  /** Previous tick outputs (for 1-tick delay) */
  prevOutputs: Map<string, Signal[]>
  tick: number
}

export const ARITH_OPS: ArithOp[] = ['+', '-', '*', '/', '%', '**', '<<', '>>', 'AND', 'OR', 'XOR']
export const DECIDER_OPS: DeciderOp[] = ['>', '<', '=', '>=', '<=', '!=']
export const SIGNAL_TYPES: SignalType[] = ['A', 'B', 'C', 'D', 'E', 'F']
export const VIRTUAL_SIGNALS: SignalType[] = ['each', 'any', 'all']

export const COMBINATOR_COLORS: Record<CombinatorType, string> = {
  constant: '#e9a820',
  arithmetic: '#4080e0',
  decider: '#e04040',
}
