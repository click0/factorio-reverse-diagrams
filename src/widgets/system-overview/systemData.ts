export interface SystemNode {
  id: string
  label: string
  part: string
  partColor: string
  x: number
  y: number
  description: string
}

export interface CausalEdge {
  from: string
  to: string
  polarity: '+' | '-'
  delay: 'fast' | 'slow'
  loops: string[]
  description: string
}

export interface FeedbackLoop {
  id: string
  name: string
  color: string
  description: string
}

export const LOOPS: FeedbackLoop[] = [
  { id: 'growth', name: 'Growth Spiral', color: '#4caf50', description: 'Mine → Smelt → Craft → Research → Unlock → Need more → Mine more' },
  { id: 'pollution-combat', name: 'Pollution–Combat', color: '#f44336', description: 'Factory → Pollution → Biters attack → Build defenses → More resources → More pollution' },
  { id: 'power', name: 'Power–Production', color: '#ff9800', description: 'Factory needs power → Power generation → Pollution → Attacks damage power → Brownout' },
  { id: 'research', name: 'Research–Complexity', color: '#2196f3', description: 'Research unlocks recipes → New recipes need diverse inputs → More infrastructure' },
  { id: 'space', name: 'Space Age', color: '#9c27b0', description: 'Nauvis → Rockets → Space platform → New planet → Unique resources → Advanced recipes' },
]

export const NODES: SystemNode[] = [
  { id: 'mining', label: 'Mining', part: 'III', partColor: '#c0884a', x: 100, y: 200, description: 'Extracts raw resources from ore patches' },
  { id: 'smelting', label: 'Smelting', part: 'III', partColor: '#c0884a', x: 250, y: 150, description: 'Converts ores into plates' },
  { id: 'crafting', label: 'Crafting', part: 'III', partColor: '#c0884a', x: 400, y: 200, description: 'Assembles intermediates and products' },
  { id: 'research', label: 'Research', part: 'IX', partColor: '#8a6ab0', x: 400, y: 50, description: 'Consumes science packs to unlock technologies' },
  { id: 'power', label: 'Power Grid', part: 'IV', partColor: '#e0a020', x: 250, y: 330, description: 'Generates and distributes electricity' },
  { id: 'pollution', label: 'Pollution', part: 'V', partColor: '#c04a6a', x: 550, y: 330, description: 'Spreads from factories, absorbed by environment' },
  { id: 'biters', label: 'Biters', part: 'V', partColor: '#c04a6a', x: 700, y: 330, description: 'Attack when pollution reaches nests' },
  { id: 'defense', label: 'Defense', part: 'V', partColor: '#c04a6a', x: 700, y: 200, description: 'Walls, turrets, military infrastructure' },
  { id: 'transport', label: 'Transport', part: 'II', partColor: '#4a80c0', x: 250, y: 50, description: 'Belts, trains, robots move items' },
  { id: 'circuits', label: 'Circuits', part: 'VI', partColor: '#6ab06a', x: 550, y: 50, description: 'Wire networks for automation logic' },
  { id: 'logistics', label: 'Logistics', part: 'II', partColor: '#4a80c0', x: 100, y: 50, description: 'Inserters, chests, logistics robots' },
  { id: 'rockets', label: 'Rockets', part: 'VIII', partColor: '#9c27b0', x: 550, y: 200, description: 'Launch rockets to space platforms' },
  { id: 'planets', label: 'Planets', part: 'VIII', partColor: '#9c27b0', x: 700, y: 50, description: 'Space Age: Vulcanus, Fulgora, Gleba, Aquilo' },
]

export const EDGES: CausalEdge[] = [
  // Growth Spiral
  { from: 'mining', to: 'smelting', polarity: '+', delay: 'fast', loops: ['growth'], description: 'Ore feeds smelters' },
  { from: 'smelting', to: 'crafting', polarity: '+', delay: 'fast', loops: ['growth'], description: 'Plates feed assemblers' },
  { from: 'crafting', to: 'research', polarity: '+', delay: 'fast', loops: ['growth', 'research'], description: 'Science packs enable research' },
  { from: 'research', to: 'crafting', polarity: '+', delay: 'slow', loops: ['growth', 'research'], description: 'New recipes require more crafting' },
  { from: 'research', to: 'mining', polarity: '+', delay: 'slow', loops: ['growth'], description: 'New recipes need more raw materials' },

  // Pollution–Combat
  { from: 'crafting', to: 'pollution', polarity: '+', delay: 'fast', loops: ['pollution-combat', 'power'], description: 'Factories generate pollution' },
  { from: 'power', to: 'pollution', polarity: '+', delay: 'fast', loops: ['pollution-combat', 'power'], description: 'Power generation produces pollution' },
  { from: 'pollution', to: 'biters', polarity: '+', delay: 'slow', loops: ['pollution-combat'], description: 'Pollution triggers biter attacks' },
  { from: 'biters', to: 'defense', polarity: '+', delay: 'fast', loops: ['pollution-combat'], description: 'Attacks require defense investment' },
  { from: 'defense', to: 'crafting', polarity: '+', delay: 'fast', loops: ['pollution-combat'], description: 'Defense consumes resources' },

  // Power–Production
  { from: 'power', to: 'crafting', polarity: '+', delay: 'fast', loops: ['power'], description: 'Power enables all machines' },
  { from: 'biters', to: 'power', polarity: '-', delay: 'fast', loops: ['power'], description: 'Attacks can damage power infrastructure' },
  { from: 'mining', to: 'power', polarity: '+', delay: 'fast', loops: ['power'], description: 'Coal/uranium fuel power generation' },

  // Transport & Logistics
  { from: 'transport', to: 'crafting', polarity: '+', delay: 'fast', loops: ['growth'], description: 'Transport moves items to assemblers' },
  { from: 'logistics', to: 'mining', polarity: '+', delay: 'fast', loops: ['growth'], description: 'Inserters load/unload miners' },
  { from: 'circuits', to: 'crafting', polarity: '+', delay: 'fast', loops: ['research'], description: 'Circuit control optimizes production' },

  // Space Age
  { from: 'crafting', to: 'rockets', polarity: '+', delay: 'slow', loops: ['space'], description: 'Craft rocket parts' },
  { from: 'rockets', to: 'planets', polarity: '+', delay: 'slow', loops: ['space'], description: 'Rockets reach new planets' },
  { from: 'planets', to: 'crafting', polarity: '+', delay: 'slow', loops: ['space'], description: 'Unique resources enable advanced recipes' },
]
