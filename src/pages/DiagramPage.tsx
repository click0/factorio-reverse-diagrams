import { lazy, Suspense } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import WidgetShell from '../components/WidgetShell/WidgetShell'
import ErrorBoundary from '../components/ErrorBoundary'

const widgets: Record<string, { loader: () => Promise<{ default: React.ComponentType }>, titleKey: string }> = {
  'belt-simulator': { loader: () => import('../widgets/belt-simulator/BeltSimulator'), titleKey: 'belt.title' },
  'recipe-dag': { loader: () => import('../widgets/recipe-dag/RecipeDAG'), titleKey: 'recipe.title' },
  'pollution-heatmap': { loader: () => import('../widgets/pollution-heatmap/PollutionHeatmap'), titleKey: 'pollution.title' },
  'quality-markov': { loader: () => import('../widgets/quality-markov/QualityMarkov'), titleKey: 'quality.title' },
  'system-overview': { loader: () => import('../widgets/system-overview/SystemOverview'), titleKey: 'system.title' },
  'power-calculator': { loader: () => import('../widgets/power-calculator/PowerCalculator'), titleKey: 'power.title' },
  'inserter-cycle': { loader: () => import('../widgets/inserter-cycle/InserterCycle'), titleKey: 'inserter.title' },
  'evolution-curve': { loader: () => import('../widgets/evolution-curve/EvolutionCurve'), titleKey: 'evolution.title' },
  'train-interrupts': { loader: () => import('../widgets/train-interrupts/TrainInterrupts'), titleKey: 'train.title' },
  'spoilage-timeline': { loader: () => import('../widgets/spoilage-timeline/SpoilageTimeline'), titleKey: 'spoilage.title' },
  'beacon-layout': { loader: () => import('../widgets/beacon-layout/BeaconLayout'), titleKey: 'beacon.title' },
  'fluid-system': { loader: () => import('../widgets/fluid-system/FluidSystem'), titleKey: 'fluid.title' },
  'tech-tree': { loader: () => import('../widgets/tech-tree/TechTree'), titleKey: 'tech.title' },
  'solar-curve': { loader: () => import('../widgets/solar-curve/SolarCurve'), titleKey: 'solar.title' },
  'mining-productivity': { loader: () => import('../widgets/mining-productivity/MiningProductivity'), titleKey: 'mining.title' },
  'noise-visualizer': { loader: () => import('../widgets/noise-visualizer/NoiseVisualizer'), titleKey: 'noise.title' },
  'space-platform': { loader: () => import('../widgets/space-platform/SpacePlatform'), titleKey: 'space.title' },
  'combinator-sandbox': { loader: () => import('../widgets/combinator-sandbox/CombinatorSandbox'), titleKey: 'circuit.title' },
  'train-pathfinding': { loader: () => import('../widgets/train-pathfinding/TrainPathfinding'), titleKey: 'trainPath.title' },
  'game-tick': { loader: () => import('../widgets/game-tick/GameTick'), titleKey: 'gameTick.title' },
  'defense-calculator': { loader: () => import('../widgets/defense-calculator/DefenseCalculator'), titleKey: 'defense.title' },
  'robot-logistics': { loader: () => import('../widgets/robot-logistics/RobotLogistics'), titleKey: 'robots.title' },
  'blueprint-analyzer': { loader: () => import('../widgets/blueprint-analyzer/BlueprintAnalyzer'), titleKey: 'blueprint.title' },
  'ups-optimizer': { loader: () => import('../widgets/ups-optimizer/UPSOptimizer'), titleKey: 'ups.title' },
  'circuit-2': { loader: () => import('../widgets/circuit-2/Circuit2'), titleKey: 'circuit2.title' },
}

export const DIAGRAM_ORDER = Object.keys(widgets)

// Cache lazy components so they aren't re-created on each render
const lazyCache = new Map<string, React.LazyExoticComponent<React.ComponentType>>()
function getLazyWidget(id: string) {
  if (!lazyCache.has(id)) {
    const entry = widgets[id]
    if (!entry) return null
    lazyCache.set(id, lazy(entry.loader))
  }
  return lazyCache.get(id)!
}

function LoadingSpinner() {
  return (
    <div className="widget-placeholder">
      <div style={{ fontSize: 24, animation: 'spin 1s linear infinite' }}>&#9881;</div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

export default function DiagramPage() {
  const { widgetId } = useParams<{ widgetId: string }>()
  const { t } = useTranslation()

  const entry = widgets[widgetId || '']
  const title = entry ? t(entry.titleKey) : 'Diagram'

  const idx = DIAGRAM_ORDER.indexOf(widgetId || '')
  const prevId = idx > 0 ? DIAGRAM_ORDER[idx - 1] : null
  const nextId = idx >= 0 && idx < DIAGRAM_ORDER.length - 1 ? DIAGRAM_ORDER[idx + 1] : null

  const LazyWidget = widgetId ? getLazyWidget(widgetId) : null

  return (
    <>
      <div className="page-header">
        <h1>{title}</h1>
      </div>
      <WidgetShell title={title}>
        <ErrorBoundary>
          <Suspense fallback={<LoadingSpinner />}>
            {LazyWidget ? <LazyWidget /> : (
              <div className="widget-placeholder">
                <div className="icon">&#9881;</div>
                <h3>{t('widget.comingSoon')}</h3>
              </div>
            )}
          </Suspense>
        </ErrorBoundary>
      </WidgetShell>

      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 24px' }}>
        {prevId ? (
          <Link to={`/diagram/${prevId}`} className="btn" style={{ textDecoration: 'none' }}>
            &larr; {t(widgets[prevId].titleKey)}
          </Link>
        ) : <span />}
        {nextId ? (
          <Link to={`/diagram/${nextId}`} className="btn" style={{ textDecoration: 'none' }}>
            {t(widgets[nextId].titleKey)} &rarr;
          </Link>
        ) : <span />}
      </div>
    </>
  )
}
