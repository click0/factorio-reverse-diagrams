import { useState } from 'react'
import { useTranslation } from 'react-i18next'

interface Machine {
  id: string
  craftingSpeed: number
  moduleSlots: number
  baseProd: number // base productivity bonus
  powerKW: number
  pollution: number // per minute
  color: string
  category: 'assembler' | 'furnace' | 'chemical'
}

const MACHINES: Machine[] = [
  // Assemblers
  { id: 'assembler-1', craftingSpeed: 0.5, moduleSlots: 0, baseProd: 0, powerKW: 75, pollution: 4, color: '#8a8a8a', category: 'assembler' },
  { id: 'assembler-2', craftingSpeed: 0.75, moduleSlots: 2, baseProd: 0, powerKW: 150, pollution: 3, color: '#4080e0', category: 'assembler' },
  { id: 'assembler-3', craftingSpeed: 1.25, moduleSlots: 4, baseProd: 0, powerKW: 375, pollution: 2, color: '#e9a820', category: 'assembler' },
  { id: 'em-plant', craftingSpeed: 2.0, moduleSlots: 5, baseProd: 0.5, powerKW: 500, pollution: 0, color: '#2196f3', category: 'assembler' },
  // Furnaces
  { id: 'stone-furnace', craftingSpeed: 1.0, moduleSlots: 0, baseProd: 0, powerKW: 0, pollution: 2, color: '#8a7a6a', category: 'furnace' },
  { id: 'steel-furnace', craftingSpeed: 2.0, moduleSlots: 0, baseProd: 0, powerKW: 0, pollution: 4, color: '#a0a0a0', category: 'furnace' },
  { id: 'electric-furnace', craftingSpeed: 2.0, moduleSlots: 2, baseProd: 0, powerKW: 180, pollution: 1, color: '#c0c0c0', category: 'furnace' },
  { id: 'foundry', craftingSpeed: 4.0, moduleSlots: 4, baseProd: 0.5, powerKW: 800, pollution: 0, color: '#ff5722', category: 'furnace' },
  // Chemical
  { id: 'chemical-plant', craftingSpeed: 1.0, moduleSlots: 3, baseProd: 0, powerKW: 210, pollution: 4, color: '#4caf50', category: 'chemical' },
  { id: 'biochamber', craftingSpeed: 2.0, moduleSlots: 4, baseProd: 0.5, powerKW: 400, pollution: 0, color: '#8bc34a', category: 'chemical' },
]

export default function NewMachines() {
  const { t } = useTranslation()
  const [compareA, setCompareA] = useState(2) // assembler-3
  const [compareB, setCompareB] = useState(3) // em-plant
  const [recipeTime, setRecipeTime] = useState(1.0) // seconds

  const a = MACHINES[compareA]
  const b = MACHINES[compareB]

  const effectiveA = a.craftingSpeed * (1 + a.baseProd)
  const effectiveB = b.craftingSpeed * (1 + b.baseProd)
  const timeA = recipeTime / a.craftingSpeed
  const timeB = recipeTime / b.craftingSpeed
  const ratioSpeed = effectiveB / effectiveA

  return (
    <div>
      <div className="controls-row">
        <div className="control-group">
          <label>A:</label>
          <select value={compareA} onChange={(e) => setCompareA(Number(e.target.value))}
            style={{ background: 'var(--bg-surface)', color: a.color, border: `1px solid ${a.color}`, borderRadius: 4, padding: '4px 8px', fontSize: 12 }}>
            {MACHINES.map((m, i) => <option key={i} value={i}>{t(`machines.${m.id}`)}</option>)}
          </select>
        </div>
        <span style={{ color: 'var(--text-muted)', fontSize: 16 }}>vs</span>
        <div className="control-group">
          <label>B:</label>
          <select value={compareB} onChange={(e) => setCompareB(Number(e.target.value))}
            style={{ background: 'var(--bg-surface)', color: b.color, border: `1px solid ${b.color}`, borderRadius: 4, padding: '4px 8px', fontSize: 12 }}>
            {MACHINES.map((m, i) => <option key={i} value={i}>{t(`machines.${m.id}`)}</option>)}
          </select>
        </div>
      </div>
      <div className="controls-row">
        <div className="control-group">
          <label>{t('machines.recipeTime')}:</label>
          <input type="range" min={0.5} max={30} step={0.5} value={recipeTime}
            onChange={(e) => setRecipeTime(Number(e.target.value))} />
          <span style={{ fontSize: 13, color: 'var(--text-secondary)', minWidth: 40 }}>{recipeTime}s</span>
        </div>
      </div>

      {/* Comparison table */}
      <div style={{ overflowX: 'auto', marginTop: 12 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, background: '#0d1117', borderRadius: 4 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <th style={thStyle}>{t('machines.stat')}</th>
              <th style={{ ...thStyle, color: a.color }}>{t(`machines.${a.id}`)}</th>
              <th style={{ ...thStyle, color: b.color }}>{t(`machines.${b.id}`)}</th>
              <th style={thStyle}>{t('machines.winner')}</th>
            </tr>
          </thead>
          <tbody>
            <Row label={t('machines.craftingSpeed')} a={a.craftingSpeed} b={b.craftingSpeed} unit="x" higher />
            <Row label={t('machines.baseProd')} a={a.baseProd * 100} b={b.baseProd * 100} unit="%" higher />
            <Row label={t('machines.effectiveSpeed')} a={effectiveA} b={effectiveB} unit="x" higher />
            <Row label={t('machines.moduleSlots')} a={a.moduleSlots} b={b.moduleSlots} unit="" higher />
            <Row label={t('machines.power')} a={a.powerKW} b={b.powerKW} unit=" kW" higher={false} />
            <Row label={t('machines.pollution')} a={a.pollution} b={b.pollution} unit="/m" higher={false} />
            <Row label={t('machines.timePerCraft')} a={timeA} b={timeB} unit="s" higher={false} decimal />
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 12, padding: '10px 14px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 13 }}>
        <span style={{ color: b.color, fontWeight: 700 }}>{t(`machines.${b.id}`)}</span>
        <span style={{ color: 'var(--text-secondary)' }}> {t('machines.isFaster')} </span>
        <span style={{ color: 'var(--accent)', fontWeight: 700, fontFamily: 'monospace' }}>{ratioSpeed.toFixed(2)}x</span>
        <span style={{ color: 'var(--text-secondary)' }}> {t('machines.thanMachine')} </span>
        <span style={{ color: a.color, fontWeight: 700 }}>{t(`machines.${a.id}`)}</span>
      </div>
    </div>
  )
}

const thStyle: React.CSSProperties = { textAlign: 'left', padding: '8px 12px', color: 'var(--text-muted)', fontWeight: 500 }
const tdStyle: React.CSSProperties = { padding: '6px 12px', borderBottom: '1px solid #ffffff08' }

function Row({ label, a, b, unit, higher, decimal }: { label: string; a: number; b: number; unit: string; higher: boolean; decimal?: boolean }) {
  const aWins = higher ? a > b : a < b
  const bWins = higher ? b > a : b < a
  const fmt = (v: number) => decimal ? v.toFixed(2) : v % 1 === 0 ? v.toString() : v.toFixed(1)
  return (
    <tr>
      <td style={tdStyle}>{label}</td>
      <td style={{ ...tdStyle, color: aWins ? '#4caf50' : 'var(--text-secondary)', fontFamily: 'monospace' }}>{fmt(a)}{unit}</td>
      <td style={{ ...tdStyle, color: bWins ? '#4caf50' : 'var(--text-secondary)', fontFamily: 'monospace' }}>{fmt(b)}{unit}</td>
      <td style={{ ...tdStyle, color: aWins ? '#4caf50' : bWins ? '#4caf50' : 'var(--text-muted)' }}>{a === b ? '=' : aWins ? 'A' : 'B'}</td>
    </tr>
  )
}
