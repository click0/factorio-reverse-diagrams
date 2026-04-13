import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

const diagrams = [
  { id: 'belt-simulator', labelKey: 'nav.belt' },
  { id: 'recipe-dag', labelKey: 'nav.recipe' },
  { id: 'pollution-heatmap', labelKey: 'nav.pollution' },
  { id: 'quality-markov', labelKey: 'nav.quality' },
  { id: 'system-overview', labelKey: 'nav.system' },
  { id: 'power-calculator', labelKey: 'nav.power' },
  { id: 'inserter-cycle', labelKey: 'nav.inserter' },
  { id: 'evolution-curve', labelKey: 'nav.evolution' },
  { id: 'train-interrupts', labelKey: 'nav.train' },
  { id: 'spoilage-timeline', labelKey: 'nav.spoilage' },
  { id: 'beacon-layout', labelKey: 'nav.beacon' },
  { id: 'fluid-system', labelKey: 'nav.fluid' },
  { id: 'tech-tree', labelKey: 'nav.tech' },
  { id: 'solar-curve', labelKey: 'nav.solar' },
  { id: 'mining-productivity', labelKey: 'nav.mining' },
  { id: 'noise-visualizer', labelKey: 'nav.noise' },
  { id: 'space-platform', labelKey: 'nav.space' },
  { id: 'combinator-sandbox', labelKey: 'nav.circuit' },
  { id: 'train-pathfinding', labelKey: 'nav.trainPath' },
  { id: 'game-tick', labelKey: 'nav.gameTick' },
  { id: 'defense-calculator', labelKey: 'nav.defense' },
  { id: 'robot-logistics', labelKey: 'nav.robots' },
  { id: 'blueprint-analyzer', labelKey: 'nav.blueprint' },
  { id: 'ups-optimizer', labelKey: 'nav.ups' },
  { id: 'circuit-2', labelKey: 'nav.circuit2' },
  { id: 'chunk-system', labelKey: 'nav.chunk' },
  { id: 'entity-lifecycle', labelKey: 'nav.entityLife' },
  { id: 'electric-network', labelKey: 'nav.electric' },
  { id: 'power-failure', labelKey: 'nav.powerFail' },
  { id: 'multi-surface', labelKey: 'nav.multiSurface' },
  { id: 'new-machines', labelKey: 'nav.newMachines' },
  { id: 'planet-chains', labelKey: 'nav.planetChains' },
  { id: 'biter-ai', labelKey: 'nav.biter' },
]

interface SidebarProps {
  onClose?: () => void
}

export default function Sidebar({ onClose }: SidebarProps) {
  const { t, i18n } = useTranslation()

  const switchLang = (lng: string) => {
    i18n.changeLanguage(lng)
  }

  return (
    <>
      <div className="sidebar-logo">
        <h2>Factorio</h2>
        <span>{t('nav.subtitle')}</span>
      </div>

      <nav className="sidebar-nav" onClick={onClose}>
        <NavLink to="/" end>
          {t('nav.home')}
        </NavLink>
        {diagrams.map((d) => (
          <NavLink key={d.id} to={`/diagram/${d.id}`}>
            {t(d.labelKey)}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="lang-switch">
          <button
            className={i18n.language === 'en' ? 'active' : ''}
            onClick={() => switchLang('en')}
          >
            EN
          </button>
          <button
            className={i18n.language === 'uk' ? 'active' : ''}
            onClick={() => switchLang('uk')}
          >
            UK
          </button>
        </div>
        <div style={{ marginTop: 8, lineHeight: 1.4 }}>
          <span style={{ color: 'var(--accent)', fontSize: 11 }}>v0.44</span>
          <br />
          <span style={{ fontSize: 10 }}>&copy; 2026 Vladyslav V. Prodan</span>
        </div>
      </div>
    </>
  )
}
