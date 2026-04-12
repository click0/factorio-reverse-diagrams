interface HeaderProps {
  onMenuToggle: () => void
}

export default function Header({ onMenuToggle }: HeaderProps) {
  return (
    <header className="mobile-header">
      <button className="hamburger" onClick={onMenuToggle} aria-label="Toggle menu">
        &#9776;
      </button>
      <h1>Factorio Reverse Diagrams</h1>
    </header>
  )
}
