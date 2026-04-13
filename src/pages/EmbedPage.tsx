import { lazy, Suspense } from 'react'
import { useParams } from 'react-router-dom'
import ErrorBoundary from '../components/ErrorBoundary'

const widgetLoaders: Record<string, () => Promise<{ default: React.ComponentType }>> = {
  'belt-simulator': () => import('../widgets/belt-simulator/BeltSimulator'),
  'recipe-dag': () => import('../widgets/recipe-dag/RecipeDAG'),
  'pollution-heatmap': () => import('../widgets/pollution-heatmap/PollutionHeatmap'),
  'quality-markov': () => import('../widgets/quality-markov/QualityMarkov'),
  'system-overview': () => import('../widgets/system-overview/SystemOverview'),
  'power-calculator': () => import('../widgets/power-calculator/PowerCalculator'),
  'inserter-cycle': () => import('../widgets/inserter-cycle/InserterCycle'),
  'evolution-curve': () => import('../widgets/evolution-curve/EvolutionCurve'),
  'train-interrupts': () => import('../widgets/train-interrupts/TrainInterrupts'),
  'spoilage-timeline': () => import('../widgets/spoilage-timeline/SpoilageTimeline'),
  'beacon-layout': () => import('../widgets/beacon-layout/BeaconLayout'),
  'fluid-system': () => import('../widgets/fluid-system/FluidSystem'),
  'tech-tree': () => import('../widgets/tech-tree/TechTree'),
  'solar-curve': () => import('../widgets/solar-curve/SolarCurve'),
  'mining-productivity': () => import('../widgets/mining-productivity/MiningProductivity'),
  'noise-visualizer': () => import('../widgets/noise-visualizer/NoiseVisualizer'),
  'space-platform': () => import('../widgets/space-platform/SpacePlatform'),
  'combinator-sandbox': () => import('../widgets/combinator-sandbox/CombinatorSandbox'),
  'train-pathfinding': () => import('../widgets/train-pathfinding/TrainPathfinding'),
  'game-tick': () => import('../widgets/game-tick/GameTick'),
  'defense-calculator': () => import('../widgets/defense-calculator/DefenseCalculator'),
  'robot-logistics': () => import('../widgets/robot-logistics/RobotLogistics'),
  'blueprint-analyzer': () => import('../widgets/blueprint-analyzer/BlueprintAnalyzer'),
  'ups-optimizer': () => import('../widgets/ups-optimizer/UPSOptimizer'),
  'circuit-2': () => import('../widgets/circuit-2/Circuit2'),
  'chunk-system': () => import('../widgets/chunk-system/ChunkSystem'),
  'entity-lifecycle': () => import('../widgets/entity-lifecycle/EntityLifecycle'),
  'electric-network': () => import('../widgets/electric-network/ElectricNetwork'),
  'power-failure': () => import('../widgets/power-failure/PowerFailure'),
  'multi-surface': () => import('../widgets/multi-surface/MultiSurface'),
  'new-machines': () => import('../widgets/new-machines/NewMachines'),
  'planet-chains': () => import('../widgets/planet-chains/PlanetChains'),
  'biter-ai': () => import('../widgets/biter-ai/BiterAI'),
}

const lazyCache = new Map<string, React.LazyExoticComponent<React.ComponentType>>()
function getLazy(id: string) {
  if (!lazyCache.has(id)) {
    const loader = widgetLoaders[id]
    if (!loader) return null
    lazyCache.set(id, lazy(loader))
  }
  return lazyCache.get(id)!
}

export default function EmbedPage() {
  const { widgetId } = useParams<{ widgetId: string }>()
  const LazyWidget = widgetId ? getLazy(widgetId) : null

  return (
    <div style={{ padding: 16, minHeight: '100vh' }}>
      <ErrorBoundary>
        <Suspense fallback={<div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading...</div>}>
          {LazyWidget ? <LazyWidget /> : <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 40 }}>Widget not found</div>}
        </Suspense>
      </ErrorBoundary>
    </div>
  )
}
