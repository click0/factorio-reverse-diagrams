import { useState } from 'react'
import { useTranslation } from 'react-i18next'

interface CargoColor {
  id: string
  nameKey: string
  r: number
  g: number
  b: number
  hex: string
}

const CARGO_COLORS: CargoColor[] = [
  { id: 'iron', nameKey: 'trainColor.iron', r: 0.6, g: 0.6, b: 0.65, hex: '#999AA6' },
  { id: 'copper', nameKey: 'trainColor.copper', r: 0.85, g: 0.55, b: 0.25, hex: '#D98C40' },
  { id: 'coal', nameKey: 'trainColor.coal', r: 0.2, g: 0.2, b: 0.2, hex: '#333333' },
  { id: 'stone', nameKey: 'trainColor.stone', r: 0.75, g: 0.7, b: 0.55, hex: '#BFB38C' },
  { id: 'oil', nameKey: 'trainColor.oil', r: 0.1, g: 0.1, b: 0.1, hex: '#1A1A1A' },
  { id: 'petroleum', nameKey: 'trainColor.petroleum', r: 0.3, g: 0.7, b: 0.3, hex: '#4DB34D' },
  { id: 'greenCircuit', nameKey: 'trainColor.greenCircuit', r: 0.2, g: 0.7, b: 0.3, hex: '#33B34D' },
  { id: 'redCircuit', nameKey: 'trainColor.redCircuit', r: 0.8, g: 0.2, b: 0.2, hex: '#CC3333' },
  { id: 'blueCircuit', nameKey: 'trainColor.blueCircuit', r: 0.2, g: 0.4, b: 0.8, hex: '#3366CC' },
  { id: 'steel', nameKey: 'trainColor.steel', r: 0.7, g: 0.7, b: 0.75, hex: '#B3B3BF' },
  { id: 'sulfuricAcid', nameKey: 'trainColor.sulfuricAcid', r: 0.9, g: 0.85, b: 0.1, hex: '#E6D91A' },
  { id: 'water', nameKey: 'trainColor.water', r: 0.15, g: 0.45, b: 0.85, hex: '#2673D9' },
  { id: 'uranium', nameKey: 'trainColor.uranium', r: 0.1, g: 0.9, b: 0.2, hex: '#1AE633' },
  { id: 'military', nameKey: 'trainColor.military', r: 0.5, g: 0.35, b: 0.15, hex: '#805926' },
]

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (v: number) => Math.round(v).toString(16).padStart(2, '0').toUpperCase()
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const match = hex.replace('#', '').match(/^([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/)
  if (!match) return null
  return {
    r: parseInt(match[1], 16),
    g: parseInt(match[2], 16),
    b: parseInt(match[3], 16),
  }
}

function toFactorioFloat(v: number): string {
  return (v / 255).toFixed(2)
}

function formatFactorio(r: number, g: number, b: number): string {
  return `{r=${toFactorioFloat(r)}, g=${toFactorioFloat(g)}, b=${toFactorioFloat(b)}}`
}

function LocomotiveSvg({ color }: { color: string }) {
  return (
    <svg width="80" height="160" viewBox="0 0 80 160" style={{ display: 'block', margin: '0 auto' }}>
      {/* Body */}
      <rect x="10" y="10" width="60" height="140" rx="6" fill={color} stroke="#000" strokeWidth="2" />
      {/* Cab window */}
      <rect x="18" y="18" width="44" height="24" rx="3" fill="#0008" />
      {/* Headlight */}
      <circle cx="40" cy="14" r="4" fill="#FFE066" opacity="0.9" />
      {/* Side details */}
      <rect x="16" y="50" width="48" height="4" rx="1" fill="#0003" />
      <rect x="16" y="60" width="48" height="4" rx="1" fill="#0003" />
      <rect x="16" y="70" width="48" height="4" rx="1" fill="#0003" />
      {/* Engine grille */}
      <rect x="20" y="82" width="40" height="30" rx="3" fill="#0002" stroke="#0003" strokeWidth="1" />
      {Array.from({ length: 5 }, (_, i) => (
        <rect key={i} x="24" y={86 + i * 5} width="32" height="2" rx="1" fill="#0003" />
      ))}
      {/* Wheels */}
      <circle cx="24" cy="126" r="8" fill="#222" stroke="#444" strokeWidth="1.5" />
      <circle cx="56" cy="126" r="8" fill="#222" stroke="#444" strokeWidth="1.5" />
      <circle cx="24" cy="146" r="8" fill="#222" stroke="#444" strokeWidth="1.5" />
      <circle cx="56" cy="146" r="8" fill="#222" stroke="#444" strokeWidth="1.5" />
      {/* Wheel hubs */}
      <circle cx="24" cy="126" r="3" fill="#555" />
      <circle cx="56" cy="126" r="3" fill="#555" />
      <circle cx="24" cy="146" r="3" fill="#555" />
      <circle cx="56" cy="146" r="3" fill="#555" />
    </svg>
  )
}

type Tab = 'presets' | 'custom'

export default function TrainColors() {
  const { t } = useTranslation()

  const [tab, setTab] = useState<Tab>('presets')
  const [selectedIdx, setSelectedIdx] = useState(0)
  const [customR, setCustomR] = useState(128)
  const [customG, setCustomG] = useState(128)
  const [customB, setCustomB] = useState(128)
  const [hexInput, setHexInput] = useState('#808080')
  const [copied, setCopied] = useState(false)

  const selectedCargo = CARGO_COLORS[selectedIdx]

  const activeColor = tab === 'presets'
    ? selectedCargo.hex
    : rgbToHex(customR, customG, customB)

  const activeR = tab === 'presets' ? Math.round(selectedCargo.r * 255) : customR
  const activeG = tab === 'presets' ? Math.round(selectedCargo.g * 255) : customG
  const activeB = tab === 'presets' ? Math.round(selectedCargo.b * 255) : customB

  const factorioFormat = formatFactorio(activeR, activeG, activeB)

  function handleHexChange(value: string) {
    setHexInput(value)
    const parsed = hexToRgb(value)
    if (parsed) {
      setCustomR(parsed.r)
      setCustomG(parsed.g)
      setCustomB(parsed.b)
    }
  }

  function handleSliderChange(channel: 'r' | 'g' | 'b', value: number) {
    if (channel === 'r') setCustomR(value)
    if (channel === 'g') setCustomG(value)
    if (channel === 'b') setCustomB(value)
    const r = channel === 'r' ? value : customR
    const g = channel === 'g' ? value : customG
    const b = channel === 'b' ? value : customB
    setHexInput(rgbToHex(r, g, b))
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(factorioFormat)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback: silent fail
    }
  }

  return (
    <div>
      <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 12px 0' }}>
        {t('trainColor.description')}
      </p>

      {/* Tab selector */}
      <div className="controls-row">
        <div className="control-group">
          <button
            className={`btn ${tab === 'presets' ? 'active' : ''}`}
            onClick={() => setTab('presets')}
          >
            {t('trainColor.cargo')}
          </button>
          <button
            className={`btn ${tab === 'custom' ? 'active' : ''}`}
            onClick={() => setTab('custom')}
          >
            {t('trainColor.custom')}
          </button>
        </div>
      </div>

      {tab === 'presets' && (
        <>
          {/* Color grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
            gap: 8,
            marginTop: 12,
          }}>
            {CARGO_COLORS.map((cargo, i) => {
              const isActive = i === selectedIdx
              return (
                <div
                  key={cargo.id}
                  onClick={() => setSelectedIdx(i)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 10px',
                    background: isActive ? 'var(--bg-surface)' : 'transparent',
                    border: `1px solid ${isActive ? 'var(--accent)' : 'var(--border)'}`,
                    borderRadius: 6,
                    cursor: 'pointer',
                    transition: 'border-color 0.15s',
                  }}
                >
                  <div style={{
                    width: 24,
                    height: 24,
                    borderRadius: 4,
                    background: cargo.hex,
                    border: '1px solid #0003',
                    flexShrink: 0,
                  }} />
                  <span style={{
                    fontSize: 12,
                    fontWeight: isActive ? 700 : 400,
                    color: isActive ? 'var(--accent)' : 'inherit',
                  }}>
                    {t(cargo.nameKey)}
                  </span>
                </div>
              )
            })}
          </div>
        </>
      )}

      {tab === 'custom' && (
        <div style={{ marginTop: 12 }}>
          {/* Hex input */}
          <div className="controls-row">
            <div className="control-group">
              <label>{t('trainColor.hex')}:</label>
              <input
                type="text"
                value={hexInput}
                onChange={(e) => handleHexChange(e.target.value)}
                style={{
                  width: 90,
                  fontFamily: 'monospace',
                  fontSize: 13,
                  padding: '4px 8px',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 4,
                  color: 'inherit',
                }}
              />
              <div style={{
                width: 24,
                height: 24,
                borderRadius: 4,
                background: rgbToHex(customR, customG, customB),
                border: '1px solid #0003',
              }} />
            </div>
          </div>

          {/* RGB sliders */}
          <div className="controls-row">
            <div className="control-group">
              <label style={{ color: '#E06060' }}>{t('trainColor.r')}:</label>
              <input
                type="range"
                min={0}
                max={255}
                value={customR}
                onChange={(e) => handleSliderChange('r', Number(e.target.value))}
                style={{ accentColor: '#E06060' }}
              />
              <span style={{ fontSize: 13, color: 'var(--text-muted)', minWidth: 30, fontFamily: 'monospace' }}>{customR}</span>
            </div>
          </div>
          <div className="controls-row">
            <div className="control-group">
              <label style={{ color: '#60C060' }}>{t('trainColor.g')}:</label>
              <input
                type="range"
                min={0}
                max={255}
                value={customG}
                onChange={(e) => handleSliderChange('g', Number(e.target.value))}
                style={{ accentColor: '#60C060' }}
              />
              <span style={{ fontSize: 13, color: 'var(--text-muted)', minWidth: 30, fontFamily: 'monospace' }}>{customG}</span>
            </div>
          </div>
          <div className="controls-row">
            <div className="control-group">
              <label style={{ color: '#6080E0' }}>{t('trainColor.b')}:</label>
              <input
                type="range"
                min={0}
                max={255}
                value={customB}
                onChange={(e) => handleSliderChange('b', Number(e.target.value))}
                style={{ accentColor: '#6080E0' }}
              />
              <span style={{ fontSize: 13, color: 'var(--text-muted)', minWidth: 30, fontFamily: 'monospace' }}>{customB}</span>
            </div>
          </div>
        </div>
      )}

      {/* Preview section */}
      <div style={{
        marginTop: 16,
        display: 'grid',
        gridTemplateColumns: 'auto 1fr',
        gap: 20,
        alignItems: 'start',
      }}>
        {/* Locomotive preview */}
        <div style={{
          background: '#0d1117',
          borderRadius: 6,
          padding: 12,
        }}>
          <div style={{ fontSize: 10, color: '#ffffff50', marginBottom: 6, textAlign: 'center' }}>
            {t('trainColor.preview')}
          </div>
          <LocomotiveSvg color={activeColor} />
        </div>

        {/* Color details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Color swatch large */}
          <div style={{
            width: '100%',
            height: 48,
            borderRadius: 6,
            background: activeColor,
            border: '1px solid var(--border)',
          }} />

          {/* Hex value */}
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: 6,
            padding: '8px 12px',
          }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>
              {t('trainColor.hex')}
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'monospace', color: 'var(--accent)' }}>
              {activeColor}
            </div>
          </div>

          {/* Factorio format */}
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: 6,
            padding: '8px 12px',
          }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>
              {t('trainColor.factorioFormat')}
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, fontFamily: 'monospace', color: 'var(--accent)' }}>
              {factorioFormat}
            </div>
          </div>

          {/* Copy button */}
          <button
            className="btn"
            onClick={handleCopy}
            style={{
              alignSelf: 'flex-start',
              borderColor: copied ? '#4caf50' : undefined,
              color: copied ? '#4caf50' : undefined,
            }}
          >
            {copied ? '✓' : ''} {t('trainColor.copyFormat')}
          </button>
        </div>
      </div>
    </div>
  )
}
