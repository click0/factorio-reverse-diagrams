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
  {
    id: 'train-interrupts',
    titleKey: 'train.title',
    descKey: 'train.description',
    tags: ['train.tag.simulator', 'train.tag.trains'],
  },
  {
    id: 'spoilage-timeline',
    titleKey: 'spoilage.title',
    descKey: 'spoilage.description',
    tags: ['spoilage.tag.spaceAge', 'spoilage.tag.timeline'],
  },
  {
    id: 'beacon-layout',
    titleKey: 'beacon.title',
    descKey: 'beacon.description',
    tags: ['beacon.tag.layout', 'beacon.tag.modules'],
  },
  {
    id: 'fluid-system',
    titleKey: 'fluid.title',
    descKey: 'fluid.description',
    tags: ['fluid.tag.simulator', 'fluid.tag.fluids'],
  },
  {
    id: 'tech-tree',
    titleKey: 'tech.title',
    descKey: 'tech.description',
    tags: ['tech.tag.tree', 'tech.tag.research'],
  },
  {
    id: 'solar-curve',
    titleKey: 'solar.title',
    descKey: 'solar.description',
    tags: ['solar.tag.energy', 'solar.tag.curve'],
  },
  {
    id: 'mining-productivity',
    titleKey: 'mining.title',
    descKey: 'mining.description',
    tags: ['mining.tag.research', 'mining.tag.scaling'],
  },
  {
    id: 'noise-visualizer',
    titleKey: 'noise.title',
    descKey: 'noise.description',
    tags: ['noise.tag.mapgen', 'noise.tag.noise'],
  },
  {
    id: 'space-platform',
    titleKey: 'space.title',
    descKey: 'space.description',
    tags: ['space.tag.spaceAge', 'space.tag.platform'],
  },
  {
    id: 'combinator-sandbox',
    titleKey: 'circuit.title',
    descKey: 'circuit.description',
    tags: ['circuit.tag.circuit', 'circuit.tag.simulator'],
  },
  {
    id: 'train-pathfinding',
    titleKey: 'trainPath.title',
    descKey: 'trainPath.description',
    tags: ['trainPath.tag.trains', 'trainPath.tag.signals'],
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
