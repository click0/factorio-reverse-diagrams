import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

const diagrams = [
  { id: 'belt-simulator', labelKey: 'nav.belt' },
  { id: 'recipe-dag', labelKey: 'nav.recipe' },
  { id: 'pollution-heatmap', labelKey: 'nav.pollution' },
  { id: 'quality-markov', labelKey: 'nav.quality' },
  { id: 'system-overview', labelKey: 'nav.system' },
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
      </div>
    </>
  )
}
