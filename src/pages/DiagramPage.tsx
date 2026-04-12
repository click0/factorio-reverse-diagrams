import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import WidgetShell from '../components/WidgetShell/WidgetShell'
import BeltSimulator from '../widgets/belt-simulator/BeltSimulator'

const widgetMeta: Record<string, { titleKey: string }> = {
  'belt-simulator': { titleKey: 'belt.title' },
  'recipe-dag': { titleKey: 'recipe.title' },
  'pollution-heatmap': { titleKey: 'pollution.title' },
  'quality-markov': { titleKey: 'quality.title' },
  'system-overview': { titleKey: 'system.title' },
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
    case 'belt-simulator':
      return <BeltSimulator />
    default:
      return <WidgetPlaceholder />
  }
}

export default function DiagramPage() {
  const { widgetId } = useParams<{ widgetId: string }>()
  const { t } = useTranslation()

  const meta = widgetMeta[widgetId || '']
  const title = meta ? t(meta.titleKey) : 'Diagram'

  return (
    <>
      <div className="page-header">
        <h1>{title}</h1>
      </div>
      <WidgetShell title={title}>
        {getWidget(widgetId || '')}
      </WidgetShell>
    </>
  )
}
