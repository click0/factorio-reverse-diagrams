import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'

export default function Layout() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <>
      <Header onMenuToggle={() => setMenuOpen((o) => !o)} />
      <div className="app-layout">
        <aside className={`sidebar ${menuOpen ? 'open' : ''}`}>
          <Sidebar onClose={() => setMenuOpen(false)} />
        </aside>
        {menuOpen && (
          <div className="mobile-overlay open" onClick={() => setMenuOpen(false)} />
        )}
        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </>
  )
}
