import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

const diagrams = [
  {
    id: 'belt-simulator',
    titleKey: 'belt.title',
    descKey: 'belt.description',
    tags: ['belt.tag.canvas', 'belt.tag.simulation'],
  },
  {
    id: 'recipe-dag',
    titleKey: 'recipe.title',
    descKey: 'recipe.description',
    tags: ['recipe.tag.d3', 'recipe.tag.graph'],
  },
  {
    id: 'pollution-heatmap',
    titleKey: 'pollution.title',
    descKey: 'pollution.description',
    tags: ['pollution.tag.canvas', 'pollution.tag.simulation'],
  },
  {
    id: 'quality-markov',
    titleKey: 'quality.title',
    descKey: 'quality.description',
    tags: ['quality.tag.markov', 'quality.tag.calculator'],
  },
  {
    id: 'system-overview',
    titleKey: 'system.title',
    descKey: 'system.description',
    tags: ['system.tag.causal', 'system.tag.overview'],
  },
  {
    id: 'power-calculator',
    titleKey: 'power.title',
    descKey: 'power.description',
    tags: ['power.tag.calculator', 'power.tag.ratios'],
  },
  {
    id: 'inserter-cycle',
    titleKey: 'inserter.title',
    descKey: 'inserter.description',
    tags: ['inserter.tag.animation', 'inserter.tag.timing'],
  },
  {
    id: 'evolution-curve',
    titleKey: 'evolution.title',
    descKey: 'evolution.description',
    tags: ['evolution.tag.curve', 'evolution.tag.combat'],
  },
]

export default function Home() {
  const { t } = useTranslation()

  return (
    <>
      <div className="page-header">
        <h1>{t('home.title')}</h1>
        <p>{t('home.description')}</p>
      </div>

      <div className="card-grid">
        {diagrams.map((d) => (
          <Link key={d.id} to={`/diagram/${d.id}`} style={{ textDecoration: 'none' }}>
            <div className="diagram-card">
              <h3>{t(d.titleKey)}</h3>
              <p>{t(d.descKey)}</p>
              <div>
                {d.tags.map((tag) => (
                  <span key={tag} className="card-tag">
                    {t(tag)}
                  </span>
                ))}
              </div>
              <span className="card-link">{t('common.openDiagram')} &rarr;</span>
            </div>
          </Link>
        ))}
      </div>
    </>
  )
}
