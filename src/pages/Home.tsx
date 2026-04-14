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
  {
    id: 'game-tick',
    titleKey: 'gameTick.title',
    descKey: 'gameTick.description',
    tags: ['gameTick.tag.core', 'gameTick.tag.tick'],
  },
  {
    id: 'defense-calculator',
    titleKey: 'defense.title',
    descKey: 'defense.description',
    tags: ['defense.tag.combat', 'defense.tag.calculator'],
  },
  {
    id: 'robot-logistics',
    titleKey: 'robots.title',
    descKey: 'robots.description',
    tags: ['robots.tag.logistics', 'robots.tag.robots'],
  },
  {
    id: 'blueprint-analyzer',
    titleKey: 'blueprint.title',
    descKey: 'blueprint.description',
    tags: ['blueprint.tag.blueprint', 'blueprint.tag.analyzer'],
  },
  {
    id: 'ups-optimizer',
    titleKey: 'ups.title',
    descKey: 'ups.description',
    tags: ['ups.tag.performance', 'ups.tag.ups'],
  },
  {
    id: 'circuit-2',
    titleKey: 'circuit2.title',
    descKey: 'circuit2.description',
    tags: ['circuit2.tag.circuit', 'circuit2.tag.new'],
  },
  { id: 'chunk-system', titleKey: 'chunk.title', descKey: 'chunk.description', tags: ['chunk.tag.core', 'chunk.tag.map'] },
  { id: 'entity-lifecycle', titleKey: 'entity.title', descKey: 'entity.description', tags: ['entity.tag.core', 'entity.tag.states'] },
  { id: 'electric-network', titleKey: 'electric.title', descKey: 'electric.description', tags: ['electric.tag.energy', 'electric.tag.topology'] },
  { id: 'power-failure', titleKey: 'powerFail.title', descKey: 'powerFail.description', tags: ['powerFail.tag.energy', 'powerFail.tag.cascade'] },
  { id: 'multi-surface', titleKey: 'surface.title', descKey: 'surface.description', tags: ['surface.tag.spaceAge', 'surface.tag.surfaces'] },
  { id: 'new-machines', titleKey: 'machines.title', descKey: 'machines.description', tags: ['machines.tag.production', 'machines.tag.comparison'] },
  { id: 'planet-chains', titleKey: 'planet.title', descKey: 'planet.description', tags: ['planet.tag.spaceAge', 'planet.tag.resources'] },
  { id: 'biter-ai', titleKey: 'biter.title', descKey: 'biter.description', tags: ['biter.tag.combat', 'biter.tag.ai'] },
  { id: 'common-ratios', titleKey: 'ratios.title', descKey: 'ratios.description', tags: ['ratios.tag.calculator', 'ratios.tag.ratios'] },
  { id: 'oil-refining', titleKey: 'oil.title', descKey: 'oil.description', tags: ['oil.tag.flow', 'oil.tag.calculator'] },
  { id: 'power-steam', titleKey: 'steam.title', descKey: 'steam.description', tags: ['steam.tag.calculator', 'steam.tag.energy'] },
  { id: 'cargo-wagon', titleKey: 'cargo.title', descKey: 'cargo.description', tags: ['cargo.tag.trains', 'cargo.tag.throughput'] },
  { id: 'fluid-wagon', titleKey: 'fluidWagon.title', descKey: 'fluidWagon.description', tags: ['fluidWagon.tag.trains', 'fluidWagon.tag.fluids'] },
  { id: 'material-processing', titleKey: 'material.title', descKey: 'material.description', tags: ['material.tag.production', 'material.tag.smelting'] },
  { id: 'prod-module-payoff', titleKey: 'prodModule.title', descKey: 'prodModule.description', tags: ['prodModule.tag.calculator', 'prodModule.tag.modules'] },
  { id: 'balancers', titleKey: 'balancer.title', descKey: 'balancer.description', tags: ['balancer.tag.belts', 'balancer.tag.layout'] },
  { id: 'inserter-capacity', titleKey: 'inserterCap.title', descKey: 'inserterCap.description', tags: ['inserterCap.tag.inserters', 'inserterCap.tag.research'] },
  { id: 'vehicle-fuel', titleKey: 'vehicleFuel.title', descKey: 'vehicleFuel.description', tags: ['vehicleFuel.tag.vehicles', 'vehicleFuel.tag.fuel'] },
  { id: 'train-colors', titleKey: 'trainColor.title', descKey: 'trainColor.description', tags: ['trainColor.tag.trains', 'trainColor.tag.colors'] },
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
