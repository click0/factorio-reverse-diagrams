export interface RecipeItem {
  id: string
  name: string
  category: 'raw' | 'smelt' | 'intermediate' | 'product' | 'science' | 'rocket'
}

export interface Recipe {
  output: string
  inputs: { id: string; amount: number }[]
  outputAmount: number
  time: number // crafting time in seconds
}

export const ITEMS: RecipeItem[] = [
  // Raw resources
  { id: 'iron-ore', name: 'Iron Ore', category: 'raw' },
  { id: 'copper-ore', name: 'Copper Ore', category: 'raw' },
  { id: 'coal', name: 'Coal', category: 'raw' },
  { id: 'stone', name: 'Stone', category: 'raw' },
  { id: 'crude-oil', name: 'Crude Oil', category: 'raw' },
  { id: 'water', name: 'Water', category: 'raw' },
  { id: 'uranium-ore', name: 'Uranium Ore', category: 'raw' },

  // Smelted
  { id: 'iron-plate', name: 'Iron Plate', category: 'smelt' },
  { id: 'copper-plate', name: 'Copper Plate', category: 'smelt' },
  { id: 'steel-plate', name: 'Steel Plate', category: 'smelt' },
  { id: 'stone-brick', name: 'Stone Brick', category: 'smelt' },

  // Oil products
  { id: 'petroleum-gas', name: 'Petroleum Gas', category: 'intermediate' },
  { id: 'light-oil', name: 'Light Oil', category: 'intermediate' },
  { id: 'heavy-oil', name: 'Heavy Oil', category: 'intermediate' },
  { id: 'sulfur', name: 'Sulfur', category: 'intermediate' },
  { id: 'plastic-bar', name: 'Plastic Bar', category: 'intermediate' },
  { id: 'sulfuric-acid', name: 'Sulfuric Acid', category: 'intermediate' },
  { id: 'lubricant', name: 'Lubricant', category: 'intermediate' },
  { id: 'solid-fuel', name: 'Solid Fuel', category: 'intermediate' },

  // Basic intermediates
  { id: 'iron-gear', name: 'Iron Gear', category: 'intermediate' },
  { id: 'copper-cable', name: 'Copper Cable', category: 'intermediate' },
  { id: 'iron-stick', name: 'Iron Stick', category: 'intermediate' },
  { id: 'pipe', name: 'Pipe', category: 'intermediate' },

  // Circuits
  { id: 'green-circuit', name: 'Electronic Circuit', category: 'intermediate' },
  { id: 'red-circuit', name: 'Advanced Circuit', category: 'intermediate' },
  { id: 'blue-circuit', name: 'Processing Unit', category: 'intermediate' },

  // Advanced intermediates
  { id: 'engine-unit', name: 'Engine Unit', category: 'intermediate' },
  { id: 'electric-engine', name: 'Electric Engine', category: 'intermediate' },
  { id: 'battery', name: 'Battery', category: 'intermediate' },
  { id: 'flying-robot-frame', name: 'Flying Robot Frame', category: 'intermediate' },
  { id: 'electric-furnace', name: 'Electric Furnace', category: 'product' },

  // Products / Science packs
  { id: 'automation-science', name: 'Automation Science', category: 'science' },
  { id: 'logistic-science', name: 'Logistic Science', category: 'science' },
  { id: 'military-science', name: 'Military Science', category: 'science' },
  { id: 'chemical-science', name: 'Chemical Science', category: 'science' },
  { id: 'production-science', name: 'Production Science', category: 'science' },
  { id: 'utility-science', name: 'Utility Science', category: 'science' },

  // Rocket
  { id: 'low-density-structure', name: 'Low Density Structure', category: 'rocket' },
  { id: 'rocket-fuel', name: 'Rocket Fuel', category: 'rocket' },
  { id: 'rocket-control-unit', name: 'Rocket Control Unit', category: 'rocket' },
  { id: 'rocket-part', name: 'Rocket Part', category: 'rocket' },
]

export const RECIPES: Recipe[] = [
  // Smelting
  { output: 'iron-plate', inputs: [{ id: 'iron-ore', amount: 1 }], outputAmount: 1, time: 3.2 },
  { output: 'copper-plate', inputs: [{ id: 'copper-ore', amount: 1 }], outputAmount: 1, time: 3.2 },
  { output: 'steel-plate', inputs: [{ id: 'iron-plate', amount: 5 }], outputAmount: 1, time: 16 },
  { output: 'stone-brick', inputs: [{ id: 'stone', amount: 2 }], outputAmount: 1, time: 3.2 },

  // Oil processing (simplified)
  { output: 'petroleum-gas', inputs: [{ id: 'crude-oil', amount: 100 }], outputAmount: 45, time: 5 },
  { output: 'light-oil', inputs: [{ id: 'crude-oil', amount: 100 }], outputAmount: 30, time: 5 },
  { output: 'heavy-oil', inputs: [{ id: 'crude-oil', amount: 100 }], outputAmount: 25, time: 5 },
  { output: 'sulfur', inputs: [{ id: 'water', amount: 30 }, { id: 'petroleum-gas', amount: 30 }], outputAmount: 2, time: 1 },
  { output: 'plastic-bar', inputs: [{ id: 'petroleum-gas', amount: 20 }, { id: 'coal', amount: 1 }], outputAmount: 2, time: 1 },
  { output: 'sulfuric-acid', inputs: [{ id: 'sulfur', amount: 5 }, { id: 'iron-plate', amount: 1 }, { id: 'water', amount: 100 }], outputAmount: 50, time: 1 },
  { output: 'lubricant', inputs: [{ id: 'heavy-oil', amount: 10 }], outputAmount: 10, time: 1 },
  { output: 'solid-fuel', inputs: [{ id: 'light-oil', amount: 10 }], outputAmount: 1, time: 2 },

  // Basic intermediates
  { output: 'iron-gear', inputs: [{ id: 'iron-plate', amount: 2 }], outputAmount: 1, time: 0.5 },
  { output: 'copper-cable', inputs: [{ id: 'copper-plate', amount: 1 }], outputAmount: 2, time: 0.5 },
  { output: 'iron-stick', inputs: [{ id: 'iron-plate', amount: 1 }], outputAmount: 2, time: 0.5 },
  { output: 'pipe', inputs: [{ id: 'iron-plate', amount: 1 }], outputAmount: 1, time: 0.5 },

  // Circuits
  { output: 'green-circuit', inputs: [{ id: 'iron-plate', amount: 1 }, { id: 'copper-cable', amount: 3 }], outputAmount: 1, time: 0.5 },
  { output: 'red-circuit', inputs: [{ id: 'green-circuit', amount: 2 }, { id: 'plastic-bar', amount: 2 }, { id: 'copper-cable', amount: 4 }], outputAmount: 1, time: 6 },
  { output: 'blue-circuit', inputs: [{ id: 'red-circuit', amount: 2 }, { id: 'green-circuit', amount: 20 }, { id: 'sulfuric-acid', amount: 5 }], outputAmount: 1, time: 10 },

  // Engines
  { output: 'engine-unit', inputs: [{ id: 'steel-plate', amount: 1 }, { id: 'iron-gear', amount: 1 }, { id: 'pipe', amount: 2 }], outputAmount: 1, time: 10 },
  { output: 'electric-engine', inputs: [{ id: 'engine-unit', amount: 1 }, { id: 'green-circuit', amount: 2 }, { id: 'lubricant', amount: 15 }], outputAmount: 1, time: 10 },
  { output: 'battery', inputs: [{ id: 'sulfuric-acid', amount: 20 }, { id: 'iron-plate', amount: 1 }, { id: 'copper-plate', amount: 1 }], outputAmount: 1, time: 4 },
  { output: 'flying-robot-frame', inputs: [{ id: 'electric-engine', amount: 1 }, { id: 'battery', amount: 2 }, { id: 'steel-plate', amount: 1 }, { id: 'green-circuit', amount: 3 }], outputAmount: 1, time: 20 },

  // Science packs
  { output: 'automation-science', inputs: [{ id: 'copper-plate', amount: 1 }, { id: 'iron-gear', amount: 1 }], outputAmount: 1, time: 5 },
  { output: 'logistic-science', inputs: [{ id: 'green-circuit', amount: 1 }, { id: 'iron-gear', amount: 1 }], outputAmount: 1, time: 6 },
  { output: 'military-science', inputs: [{ id: 'iron-gear', amount: 3 }, { id: 'copper-plate', amount: 3 }, { id: 'steel-plate', amount: 2 }], outputAmount: 2, time: 10 },
  { output: 'chemical-science', inputs: [{ id: 'sulfur', amount: 1 }, { id: 'red-circuit', amount: 3 }, { id: 'engine-unit', amount: 2 }], outputAmount: 2, time: 24 },
  { output: 'production-science', inputs: [{ id: 'red-circuit', amount: 1 }, { id: 'steel-plate', amount: 2 }, { id: 'stone-brick', amount: 5 }], outputAmount: 3, time: 21 },
  { output: 'utility-science', inputs: [{ id: 'blue-circuit', amount: 2 }, { id: 'flying-robot-frame', amount: 1 }, { id: 'low-density-structure', amount: 3 }], outputAmount: 3, time: 21 },

  // Rocket
  { output: 'low-density-structure', inputs: [{ id: 'steel-plate', amount: 2 }, { id: 'copper-plate', amount: 20 }, { id: 'plastic-bar', amount: 5 }], outputAmount: 1, time: 20 },
  { output: 'rocket-fuel', inputs: [{ id: 'solid-fuel', amount: 10 }, { id: 'light-oil', amount: 10 }], outputAmount: 1, time: 30 },
  { output: 'rocket-control-unit', inputs: [{ id: 'blue-circuit', amount: 1 }, { id: 'speed-module', amount: 1 }], outputAmount: 1, time: 30 },
  { output: 'rocket-part', inputs: [{ id: 'low-density-structure', amount: 10 }, { id: 'rocket-fuel', amount: 10 }, { id: 'rocket-control-unit', amount: 10 }], outputAmount: 1, time: 3 },
]

export const CATEGORY_COLORS: Record<string, string> = {
  raw: '#6d8a4e',
  smelt: '#c0884a',
  intermediate: '#4a80c0',
  product: '#8a6ab0',
  science: '#c04a6a',
  rocket: '#e0a020',
}
