export type QualityTier = 'Normal' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary'

export const QUALITY_TIERS: QualityTier[] = ['Normal', 'Uncommon', 'Rare', 'Epic', 'Legendary']

export const QUALITY_COLORS: Record<QualityTier, string> = {
  Normal: '#8a8a8a',
  Uncommon: '#4caf50',
  Rare: '#2196f3',
  Epic: '#9c27b0',
  Legendary: '#ff9800',
}

export const QUALITY_MULTIPLIERS: Record<QualityTier, number> = {
  Normal: 1.0,
  Uncommon: 1.3,
  Rare: 1.6,
  Epic: 1.9,
  Legendary: 2.5,
}

export interface QualityModule {
  name: string
  qualityChance: number // per module, percentage
}

export const QUALITY_MODULES: QualityModule[] = [
  { name: 'Quality Module 1', qualityChance: 2.5 },
  { name: 'Quality Module 2', qualityChance: 5.0 },
  { name: 'Quality Module 3', qualityChance: 10.0 },
]

export interface ModuleConfig {
  moduleIdx: number
  moduleCount: number
  useRecycler: boolean
}
