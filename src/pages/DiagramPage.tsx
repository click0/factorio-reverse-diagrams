import { useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import WidgetShell from '../components/WidgetShell/WidgetShell'
import BeltSimulator from '../widgets/belt-simulator/BeltSimulator'
import PollutionHeatmap from '../widgets/pollution-heatmap/PollutionHeatmap'
import QualityMarkov from '../widgets/quality-markov/QualityMarkov'
import RecipeDAG from '../widgets/recipe-dag/RecipeDAG'
import SystemOverview from '../widgets/system-overview/SystemOverview'
import PowerCalculator from '../widgets/power-calculator/PowerCalculator'
import InserterCycle from '../widgets/inserter-cycle/InserterCycle'
import EvolutionCurve from '../widgets/evolution-curve/EvolutionCurve'
import TrainInterrupts from '../widgets/train-interrupts/TrainInterrupts'
import SpoilageTimeline from '../widgets/spoilage-timeline/SpoilageTimeline'
import BeaconLayout from '../widgets/beacon-layout/BeaconLayout'
import FluidSystem from '../widgets/fluid-system/FluidSystem'
import TechTree from '../widgets/tech-tree/TechTree'
import SolarCurve from '../widgets/solar-curve/SolarCurve'
import MiningProductivity from '../widgets/mining-productivity/MiningProductivity'
import NoiseVisualizer from '../widgets/noise-visualizer/NoiseVisualizer'
import SpacePlatform from '../widgets/space-platform/SpacePlatform'
import CombinatorSandbox from '../widgets/combinator-sandbox/CombinatorSandbox'
import TrainPathfinding from '../widgets/train-pathfinding/TrainPathfinding'

const DIAGRAM_ORDER = [
  'belt-simulator',
  'recipe-dag',
  'pollution-heatmap',
  'quality-markov',
  'system-overview',
  'power-calculator',
  'inserter-cycle',
  'evolution-curve',
  'train-interrupts',
  'spoilage-timeline',
  'beacon-layout',
  'fluid-system',
  'tech-tree',
  'solar-curve',
  'mining-productivity',
  'noise-visualizer',
  'space-platform',
  'combinator-sandbox',
  'train-pathfinding',
]

const widgetMeta: Record<string, { titleKey: string }> = {
  'belt-simulator': { titleKey: 'belt.title' },
  'recipe-dag': { titleKey: 'recipe.title' },
  'pollution-heatmap': { titleKey: 'pollution.title' },
  'quality-markov': { titleKey: 'quality.title' },
  'system-overview': { titleKey: 'system.title' },
  'power-calculator': { titleKey: 'power.title' },
  'inserter-cycle': { titleKey: 'inserter.title' },
  'evolution-curve': { titleKey: 'evolution.title' },
  'train-interrupts': { titleKey: 'train.title' },
  'spoilage-timeline': { titleKey: 'spoilage.title' },
  'beacon-layout': { titleKey: 'beacon.title' },
  'fluid-system': { titleKey: 'fluid.title' },
  'tech-tree': { titleKey: 'tech.title' },
  'solar-curve': { titleKey: 'solar.title' },
  'mining-productivity': { titleKey: 'mining.title' },
  'noise-visualizer': { titleKey: 'noise.title' },
  'space-platform': { titleKey: 'space.title' },
  'combinator-sandbox': { titleKey: 'circuit.title' },
  'train-pathfinding': { titleKey: 'trainPath.title' },
}

function WidgetPlaceholder() {
  const { t } = useTranslation()
  return (
    <div className="widget-placeholder">
      <div className="icon">&#9881;</div>
      <h3>{t('widget.comingSoon')}</h3>
      <p>{t('widget.comingSoonDesc')}</p>
    </div>
  )
}

function getWidget(widgetId: string) {
  switch (widgetId) {
    case 'belt-simulator': return <BeltSimulator />
    case 'pollution-heatmap': return <PollutionHeatmap />
    case 'quality-markov': return <QualityMarkov />
    case 'recipe-dag': return <RecipeDAG />
    case 'system-overview': return <SystemOverview />
    case 'power-calculator': return <PowerCalculator />
    case 'inserter-cycle': return <InserterCycle />
    case 'evolution-curve': return <EvolutionCurve />
    case 'train-interrupts': return <TrainInterrupts />
    case 'spoilage-timeline': return <SpoilageTimeline />
    case 'beacon-layout': return <BeaconLayout />
    case 'fluid-system': return <FluidSystem />
    case 'tech-tree': return <TechTree />
    case 'solar-curve': return <SolarCurve />
    case 'mining-productivity': return <MiningProductivity />
    case 'noise-visualizer': return <NoiseVisualizer />
    case 'space-platform': return <SpacePlatform />
    case 'combinator-sandbox': return <CombinatorSandbox />
    case 'train-pathfinding': return <TrainPathfinding />
    default: return <WidgetPlaceholder />
  }
}

export default function DiagramPage() {
  const { widgetId } = useParams<{ widgetId: string }>()
  const { t } = useTranslation()

  const meta = widgetMeta[widgetId || '']
  const title = meta ? t(meta.titleKey) : 'Diagram'

  const idx = DIAGRAM_ORDER.indexOf(widgetId || '')
  const prevId = idx > 0 ? DIAGRAM_ORDER[idx - 1] : null
  const nextId = idx >= 0 && idx < DIAGRAM_ORDER.length - 1 ? DIAGRAM_ORDER[idx + 1] : null

  return (
    <>
      <div className="page-header">
        <h1>{title}</h1>
      </div>
      <WidgetShell title={title}>
        {getWidget(widgetId || '')}
      </WidgetShell>

      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 24px' }}>
        {prevId ? (
          <Link to={`/diagram/${prevId}`} className="btn" style={{ textDecoration: 'none' }}>
            &larr; {t(widgetMeta[prevId].titleKey)}
          </Link>
        ) : <span />}
        {nextId ? (
          <Link to={`/diagram/${nextId}`} className="btn" style={{ textDecoration: 'none' }}>
            {t(widgetMeta[nextId].titleKey)} &rarr;
          </Link>
        ) : <span />}
      </div>
    </>
  )
}
