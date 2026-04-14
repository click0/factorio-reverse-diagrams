import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

interface DiagramEntry {
  id: string
  labelKey: string
}

interface Section {
  titleKey: string
  diagrams: DiagramEntry[]
}

const sections: Section[] = [
  {
    titleKey: 'section.core',
    diagrams: [
      { id: 'game-tick', labelKey: 'nav.gameTick' },
      { id: 'chunk-system', labelKey: 'nav.chunk' },
      { id: 'entity-lifecycle', labelKey: 'nav.entityLife' },
    ],
  },
  {
    titleKey: 'section.transport',
    diagrams: [
      { id: 'belt-simulator', labelKey: 'nav.belt' },
      { id: 'inserter-cycle', labelKey: 'nav.inserter' },
      { id: 'inserter-capacity', labelKey: 'nav.inserterCap' },
      { id: 'balancers', labelKey: 'nav.balancer' },
      { id: 'train-pathfinding', labelKey: 'nav.trainPath' },
      { id: 'train-interrupts', labelKey: 'nav.train' },
      { id: 'cargo-wagon', labelKey: 'nav.cargo' },
      { id: 'fluid-wagon', labelKey: 'nav.fluidWagon' },
      { id: 'robot-logistics', labelKey: 'nav.robots' },
    ],
  },
  {
    titleKey: 'section.production',
    diagrams: [
      { id: 'recipe-dag', labelKey: 'nav.recipe' },
      { id: 'beacon-layout', labelKey: 'nav.beacon' },
      { id: 'new-machines', labelKey: 'nav.newMachines' },
      { id: 'common-ratios', labelKey: 'nav.ratios' },
      { id: 'material-processing', labelKey: 'nav.material' },
      { id: 'prod-module-payoff', labelKey: 'nav.prodModule' },
    ],
  },
  {
    titleKey: 'section.energy',
    diagrams: [
      { id: 'power-calculator', labelKey: 'nav.power' },
      { id: 'power-steam', labelKey: 'nav.steam' },
      { id: 'solar-curve', labelKey: 'nav.solar' },
      { id: 'electric-network', labelKey: 'nav.electric' },
      { id: 'power-failure', labelKey: 'nav.powerFail' },
    ],
  },
  {
    titleKey: 'section.oil',
    diagrams: [
      { id: 'oil-refining', labelKey: 'nav.oil' },
    ],
  },
  {
    titleKey: 'section.combat',
    diagrams: [
      { id: 'pollution-heatmap', labelKey: 'nav.pollution' },
      { id: 'evolution-curve', labelKey: 'nav.evolution' },
      { id: 'biter-ai', labelKey: 'nav.biter' },
      { id: 'defense-calculator', labelKey: 'nav.defense' },
    ],
  },
  {
    titleKey: 'section.circuit',
    diagrams: [
      { id: 'combinator-sandbox', labelKey: 'nav.circuit' },
      { id: 'circuit-2', labelKey: 'nav.circuit2' },
    ],
  },
  {
    titleKey: 'section.mapgen',
    diagrams: [
      { id: 'noise-visualizer', labelKey: 'nav.noise' },
    ],
  },
  {
    titleKey: 'section.spaceAge',
    diagrams: [
      { id: 'quality-markov', labelKey: 'nav.quality' },
      { id: 'spoilage-timeline', labelKey: 'nav.spoilage' },
      { id: 'space-platform', labelKey: 'nav.space' },
      { id: 'multi-surface', labelKey: 'nav.multiSurface' },
      { id: 'planet-chains', labelKey: 'nav.planetChains' },
      { id: 'tech-tree', labelKey: 'nav.tech' },
    ],
  },
  {
    titleKey: 'section.vehicles',
    diagrams: [
      { id: 'vehicle-fuel', labelKey: 'nav.vehicleFuel' },
      { id: 'train-colors', labelKey: 'nav.trainColor' },
    ],
  },
  {
    titleKey: 'section.meta',
    diagrams: [
      { id: 'system-overview', labelKey: 'nav.system' },
      { id: 'blueprint-analyzer', labelKey: 'nav.blueprint' },
      { id: 'ups-optimizer', labelKey: 'nav.ups' },
      { id: 'fluid-system', labelKey: 'nav.fluid' },
      { id: 'mining-productivity', labelKey: 'nav.mining' },
    ],
  },
]

// Flat ordered list for DiagramPage prev/next navigation
export const DIAGRAM_SECTIONS = sections

interface SidebarProps {
  onClose?: () => void
}

export default function Sidebar({ onClose }: SidebarProps) {
  const { t, i18n } = useTranslation()
  const location = useLocation()

  // Determine which section contains the active widget
  const activeWidgetId = location.pathname.match(/\/diagram\/(.+)/)?.[1]
  const activeSectionIdx = sections.findIndex(s =>
    s.diagrams.some(d => d.id === activeWidgetId)
  )

  // Initialize: open the section that contains the active widget, or first section
  const [openSections, setOpenSections] = useState<Set<number>>(() => {
    const initial = new Set<number>()
    if (activeSectionIdx >= 0) initial.add(activeSectionIdx)
    return initial
  })

  const toggleSection = (idx: number) => {
    setOpenSections(prev => {
      const next = new Set(prev)
      if (next.has(idx)) next.delete(idx)
      else next.add(idx)
      return next
    })
  }

  const switchLang = (lng: string) => {
    i18n.changeLanguage(lng)
  }

  return (
    <>
      <div className="sidebar-logo">
        <h2>Factorio</h2>
        <span>{t('nav.subtitle')}</span>
      </div>

      <nav className="sidebar-nav">
        <NavLink to="/" end onClick={onClose}>
          {t('nav.home')}
        </NavLink>

        {sections.map((section, idx) => {
          const isOpen = openSections.has(idx)
          const hasActive = section.diagrams.some(d => d.id === activeWidgetId)

          return (
            <div key={section.titleKey} className="sidebar-section">
              <button
                className={`sidebar-section-toggle${hasActive ? ' has-active' : ''}`}
                onClick={() => toggleSection(idx)}
              >
                <span className={`sidebar-arrow${isOpen ? ' open' : ''}`}>&#9656;</span>
                {t(section.titleKey)}
                <span className="sidebar-section-count">{section.diagrams.length}</span>
              </button>
              {isOpen && (
                <div className="sidebar-section-items" onClick={onClose}>
                  {section.diagrams.map(d => (
                    <NavLink key={d.id} to={`/diagram/${d.id}`}>
                      {t(d.labelKey)}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          )
        })}
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
        <div style={{ marginTop: 8, lineHeight: 1.6 }}>
          <span style={{ color: 'var(--accent)', fontSize: 11 }}>v0.50</span>
          <br />
          <a href="https://github.com/click0/factorio-reverse-diagrams" target="_blank" rel="noopener noreferrer"
            style={{ fontSize: 10, color: 'var(--text-muted)', textDecoration: 'none' }}>
            &copy; 2026 Vladyslav V. Prodan
          </a>
        </div>
      </div>
    </>
  )
}
