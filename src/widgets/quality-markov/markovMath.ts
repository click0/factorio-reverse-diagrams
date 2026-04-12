import { type ModuleConfig, QUALITY_MODULES, QUALITY_TIERS } from './types'

/**
 * Build the 5x5 transition matrix for the quality Markov chain.
 * - From state i, probability `p` of going to state i+1 (quality upgrade)
 * - From state i, probability `1-p` of staying at state i (failed upgrade)
 * - Legendary (state 4) is absorbing
 * - With recycler: failed items get recycled (25% return) and re-enter at same quality
 */
export function buildTransitionMatrix(config: ModuleConfig): number[][] {
  const mod = QUALITY_MODULES[config.moduleIdx]
  const totalChance = Math.min(100, mod.qualityChance * config.moduleCount) / 100
  const n = QUALITY_TIERS.length

  // matrix[i][j] = probability of going from state i to state j
  const matrix: number[][] = Array.from({ length: n }, () => new Array(n).fill(0))

  for (let i = 0; i < n; i++) {
    if (i === n - 1) {
      // Legendary is absorbing
      matrix[i][i] = 1
    } else {
      // Probability of upgrade distributes across higher tiers
      // Simplified: all upgrade chance goes to next tier
      matrix[i][i + 1] = totalChance
      matrix[i][i] = 1 - totalChance
    }
  }

  return matrix
}

/**
 * Calculate expected number of crafts to reach target quality from Normal.
 * Uses absorbing Markov chain: E[steps] = (I - Q)^(-1) * 1
 * For our simple chain this reduces to a geometric series.
 */
export function expectedIterations(config: ModuleConfig, targetTierIdx: number): number {
  const mod = QUALITY_MODULES[config.moduleIdx]
  const p = Math.min(1, (mod.qualityChance * config.moduleCount) / 100)

  if (p === 0) return Infinity

  // For a chain Normal -> Uncommon -> ... -> target,
  // each step has probability p of advancing.
  // Expected steps per transition = 1/p
  // Total expected = targetTierIdx * (1/p)
  // With recycler: each failed craft returns 25% materials, effectively
  // reducing cost per attempt but not changing expected craft count
  return targetTierIdx / p
}

/**
 * Calculate total raw resources needed per successful target-quality item.
 * Without recycler: expectedIterations * ingredientCost
 * With recycler: reduced by recycler recovery (25% return per fail)
 */
export function resourceCost(config: ModuleConfig, targetTierIdx: number): number {
  const iters = expectedIterations(config, targetTierIdx)
  if (!isFinite(iters)) return Infinity

  if (config.useRecycler) {
    // Each failed craft returns 25% of ingredients
    // Net cost per attempt = 1 - 0.25 = 0.75 of one craft
    // But only fails cost; successes cost 1
    const p = Math.min(1, (QUALITY_MODULES[config.moduleIdx].qualityChance * config.moduleCount) / 100)
    const failRate = 1 - p
    const avgCostPerCraft = p * 1 + failRate * 0.75
    return iters * avgCostPerCraft
  }

  return iters
}

/**
 * Steady-state probability distribution during grinding.
 * Shows what fraction of time is spent at each quality tier.
 */
export function steadyStateDistribution(config: ModuleConfig): number[] {
  const mod = QUALITY_MODULES[config.moduleIdx]
  const p = Math.min(1, (mod.qualityChance * config.moduleCount) / 100)
  const n = QUALITY_TIERS.length

  // For a simple absorbing chain, the distribution during grinding
  // is geometric: P(at tier i) proportional to (1-p)^i
  const dist: number[] = []
  let sum = 0
  for (let i = 0; i < n - 1; i++) {
    const val = Math.pow(1 - p, i)
    dist.push(val)
    sum += val
  }
  dist.push(0) // Legendary exits the chain
  // Normalize
  for (let i = 0; i < dist.length; i++) dist[i] /= sum

  return dist
}
