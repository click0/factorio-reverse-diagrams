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
