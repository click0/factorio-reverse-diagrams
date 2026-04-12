import { type BeltState, type BeltTier, type Item, type Scenario, type SplitterConfig, ITEMS } from './types'

const SLOT_COUNT = 32
const SIDE_SLOTS = 12

export function getSlotCount(): number { return SLOT_COUNT }
export function getSideSlots(): number { return SIDE_SLOTS }

export function createInitialState(scenario: Scenario): BeltState {
  const empty = (n: number) => new Array<Item | null>(n).fill(null)
  const state: BeltState = {
    topLane: empty(SLOT_COUNT),
    bottomLane: empty(SLOT_COUNT),
    sideInput: empty(SIDE_SLOTS),
    splitOutTopA: empty(SLOT_COUNT),
    splitOutBottomA: empty(SLOT_COUNT),
    splitOutTopB: empty(SLOT_COUNT),
    splitOutBottomB: empty(SLOT_COUNT),
    splitterToggle: false,
    tick: 0,
  }

  // Pre-fill input belt
  const items: Item[] = [ITEMS['iron-plate'], ITEMS['copper-plate'], ITEMS['iron-gear']]
  for (let i = 0; i < 6; i++) {
    state.topLane[i] = items[i % items.length]
    state.bottomLane[i] = items[(i + 1) % items.length]
  }

  if (scenario === 'sideload') {
    for (let i = 0; i < 4; i++) {
      state.sideInput[i] = ITEMS['green-circuit']
    }
  }

  return state
}

export function advanceTick(state: BeltState, tier: BeltTier, scenario: Scenario, splitterCfg: SplitterConfig): BeltState {
  if (scenario === 'straight') return advanceStraight(state)
  if (scenario === 'sideload') return advanceSideload(state)
  return advanceSplitter(state, splitterCfg)
}

function advanceStraight(st: BeltState): BeltState {
  const topLane = advanceLane(st.topLane)
  const bottomLane = advanceLane(st.bottomLane)
  spawnItems(topLane, bottomLane, st.tick)
  return { ...st, topLane, bottomLane, tick: st.tick + 1 }
}

function advanceSideload(st: BeltState): BeltState {
  const topLane = advanceLane(st.topLane)
  const bottomLane = advanceLane(st.bottomLane)
  const sideInput = advanceLane(st.sideInput)

  // Side-loading: items from perpendicular belt go onto bottom lane only
  // Insertion point is at slot index 16 (midpoint)
  const insertIdx = 16
  const sideItem = sideInput[sideInput.length - 1]
  if (sideItem && !bottomLane[insertIdx]) {
    bottomLane[insertIdx] = sideItem
    sideInput[sideInput.length - 1] = null
  }

  spawnItems(topLane, bottomLane, st.tick)
  // Spawn side items
  if (!sideInput[0]) {
    sideInput[0] = ITEMS['green-circuit']
  }

  return { ...st, topLane, bottomLane, sideInput, tick: st.tick + 1 }
}

function advanceSplitter(st: BeltState, cfg: SplitterConfig): BeltState {
  const topLane = advanceLane(st.topLane)
  const bottomLane = advanceLane(st.bottomLane)
  let splitOutTopA = advanceLane(st.splitOutTopA)
  let splitOutBottomA = advanceLane(st.splitOutBottomA)
  let splitOutTopB = advanceLane(st.splitOutTopB)
  let splitOutBottomB = advanceLane(st.splitOutBottomB)
  let toggle = st.splitterToggle

  // Splitter takes items from end of input belt and distributes to two outputs
  const topItem = topLane[topLane.length - 1]
  const bottomItem = bottomLane[bottomLane.length - 1]

  if (topItem) {
    topLane[topLane.length - 1] = null
    const target = resolveOutput(toggle, cfg.outputPriority, splitOutTopA, splitOutTopB)
    if (target === 'a' && !splitOutTopA[0]) {
      splitOutTopA[0] = topItem
    } else if (target === 'b' && !splitOutTopB[0]) {
      splitOutTopB[0] = topItem
    } else if (!splitOutTopA[0]) {
      splitOutTopA[0] = topItem
    } else if (!splitOutTopB[0]) {
      splitOutTopB[0] = topItem
    }
    // else item is lost (both outputs full)
  }

  if (bottomItem) {
    bottomLane[bottomLane.length - 1] = null
    const target = resolveOutput(!toggle, cfg.outputPriority, splitOutBottomA, splitOutBottomB)
    if (target === 'a' && !splitOutBottomA[0]) {
      splitOutBottomA[0] = bottomItem
    } else if (target === 'b' && !splitOutBottomB[0]) {
      splitOutBottomB[0] = bottomItem
    } else if (!splitOutBottomA[0]) {
      splitOutBottomA[0] = bottomItem
    } else if (!splitOutBottomB[0]) {
      splitOutBottomB[0] = bottomItem
    }
  }

  toggle = !toggle
  spawnItems(topLane, bottomLane, st.tick)
  return { ...st, topLane, bottomLane, splitOutTopA, splitOutBottomA, splitOutTopB, splitOutBottomB, splitterToggle: toggle, tick: st.tick + 1 }
}

function resolveOutput(toggle: boolean, priority: 'none' | 'left' | 'right', a: (Item | null)[], b: (Item | null)[]): 'a' | 'b' {
  if (priority === 'left') return !a[0] ? 'a' : 'b'
  if (priority === 'right') return !b[0] ? 'b' : 'a'
  return toggle ? 'b' : 'a'
}

function advanceLane(lane: (Item | null)[]): (Item | null)[] {
  const next: (Item | null)[] = new Array(lane.length).fill(null)
  for (let i = lane.length - 1; i >= 0; i--) {
    if (!lane[i]) continue
    const target = i + 1
    if (target >= lane.length) continue // exits
    if (!next[target]) next[target] = lane[i]
    else next[i] = lane[i] // blocked
  }
  return next
}

function spawnItems(top: (Item | null)[], bottom: (Item | null)[], tick: number) {
  const items: Item[] = [ITEMS['iron-plate'], ITEMS['copper-plate'], ITEMS['iron-gear']]
  if (!top[0]) top[0] = items[tick % items.length]
  if (!bottom[0]) bottom[0] = items[(tick + 1) % items.length]
}
