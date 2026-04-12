import { type BeltState, type BeltTier, type Item, ITEMS } from './types'
export type { BeltState }

const SLOT_COUNT = 32

export function createInitialState(tier: BeltTier): BeltState {
  const topLane: (Item | null)[] = new Array(SLOT_COUNT).fill(null)
  const bottomLane: (Item | null)[] = new Array(SLOT_COUNT).fill(null)

  // Pre-fill some items at the start (source end)
  const items: Item[] = [ITEMS['iron-plate'], ITEMS['copper-plate'], ITEMS['iron-gear']]
  for (let i = 0; i < 8; i++) {
    topLane[i] = items[i % items.length]
    bottomLane[i] = items[(i + 1) % items.length]
  }

  return { topLane, bottomLane, tick: 0 }
}

/**
 * Advance belt by one tick.
 * Items move forward (toward higher indices). A slot can only move
 * into the next slot if it is empty (no compression through).
 * Items that reach the end are removed.
 * New items are spawned at position 0 if empty (simulating infinite source).
 */
export function advanceTick(state: BeltState, tier: BeltTier): BeltState {
  const topLane = advanceLane(state.topLane)
  const bottomLane = advanceLane(state.bottomLane)

  // Spawn new items at source
  const items: Item[] = [ITEMS['iron-plate'], ITEMS['copper-plate'], ITEMS['iron-gear']]
  if (!topLane[0]) {
    topLane[0] = items[state.tick % items.length]
  }
  if (!bottomLane[0]) {
    bottomLane[0] = items[(state.tick + 1) % items.length]
  }

  return { topLane, bottomLane, tick: state.tick + 1 }
}

function advanceLane(lane: (Item | null)[]): (Item | null)[] {
  const next: (Item | null)[] = new Array(lane.length).fill(null)

  for (let i = lane.length - 1; i >= 0; i--) {
    if (!lane[i]) continue

    const target = i + 1
    if (target >= lane.length) {
      // Item exits the belt
      continue
    }
    if (!next[target]) {
      next[target] = lane[i]
    } else {
      // Blocked — stay in place
      next[i] = lane[i]
    }
  }

  return next
}

export function getSlotCount(): number {
  return SLOT_COUNT
}
