import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'

// Assembler tiers: id, speed, module slots
interface AssemblerTier {
  id: string
  label: string
  speed: number
  moduleSlots: number
  baseProd: number // base productivity bonus (e.g., EM Plant has 50%)
}

const ASSEMBLER_TIERS: AssemblerTier[] = [
  { id: 'asm1', label: 'Assembler 1', speed: 0.5, moduleSlots: 0, baseProd: 0 },
  { id: 'asm2', label: 'Assembler 2', speed: 0.75, moduleSlots: 2, baseProd: 0 },
  { id: 'asm3', label: 'Assembler 3', speed: 1.25, moduleSlots: 4, baseProd: 0 },
  { id: 'em', label: 'EM Plant', speed: 2.0, moduleSlots: 5, baseProd: 0.5 },
]

// Prod module 3: +10% productivity, -15% speed per module
const PROD_MODULE_PROD = 0.1
const PROD_MODULE_SPEED = -0.15

// Base reference speed for ratio calculations (Assembler 2)
const BASE_SPEED = 0.75

interface RecipeRatio {
  id: string
  nameKey: string
  notesKey: string
  // Base machine counts at Assembler 2 speed with no modules
  machines: { role: string; count: number }[]
  // Base ratio description
  ratioDesc: string
}

const RECIPES: RecipeRatio[] = [
  {
    id: 'green-circuit',
    nameKey: 'ratios.greenCircuit',
    notesKey: 'ratios.perBelt',
    machines: [
      { role: 'Green Circuit', count: 3 },
      { role: 'Copper Cable', count: 2 },
    ],
    ratioDesc: '3 : 2',
  },
  {
    id: 'red-circuit',
    nameKey: 'ratios.redCircuit',
    notesKey: 'ratios.perMin',
    machines: [
      { role: 'Red Circuit', count: 6 },
      { role: 'Copper Cable', count: 1 },
      { role: 'Green Circuit', count: 8 },
    ],
    ratioDesc: '6 : 1 : 8',
  },
  {
    id: 'blue-circuit',
    nameKey: 'ratios.blueCircuit',
    notesKey: 'ratios.perMin',
    machines: [
      { role: 'Blue Circuit', count: 1 },
      { role: 'Green Circuit', count: 20 },
      { role: 'Red Circuit', count: 2 },
    ],
    ratioDesc: '1 : 20 : 2',
  },
  {
    id: 'steel',
    nameKey: 'ratios.steel',
    notesKey: 'ratios.perMin',
    machines: [
      { role: 'Stone Furnace (iron)', count: 5 },
      { role: 'Stone Furnace (steel)', count: 1 },
    ],
    ratioDesc: '5 : 1',
  },
  {
    id: 'rocket-fuel',
    nameKey: 'ratios.rocketFuel',
    notesKey: 'ratios.perMin',
    machines: [
      { role: 'Solid Fuel', count: 1 },
      { role: 'Rocket Fuel', count: 1 },
    ],
    ratioDesc: '1 : 1',
  },
  {
    id: 'science-red',
    nameKey: 'ratios.scienceRed',
    notesKey: 'ratios.perMin',
    machines: [
      { role: 'Assembler', count: 1 },
    ],
    ratioDesc: '1',
  },
  {
    id: 'science-green',
    nameKey: 'ratios.scienceGreen',
    notesKey: 'ratios.perMin',
    machines: [
      { role: 'Assembler', count: 1 },
    ],
    ratioDesc: '1',
  },
  {
    id: 'science-blue',
    nameKey: 'ratios.scienceBlue',
    notesKey: 'ratios.perMin',
    machines: [
      { role: 'Assembler', count: 2 },
    ],
    ratioDesc: '2',
  },
  {
    id: 'science-black',
    nameKey: 'ratios.scienceBlack',
    notesKey: 'ratios.perMin',
    machines: [
      { role: 'Assembler', count: 3 },
    ],
    ratioDesc: '3',
  },
]

function calcEffectiveSpeed(tier: AssemblerTier, prodModules: number): { speed: number; prod: number } {
  const numMods = Math.min(prodModules, tier.moduleSlots)
  const speedMult = Math.max(0.2, 1 + numMods * PROD_MODULE_SPEED)
  const effectiveSpeed = tier.speed * speedMult
  const totalProd = 1 + tier.baseProd + numMods * PROD_MODULE_PROD
  return { speed: effectiveSpeed, prod: totalProd }
}

export default function CommonRatios() {
  const { t } = useTranslation()
  const [tierIdx, setTierIdx] = useState(1) // default: Assembler 2
  const [prodModules, setProdModules] = useState(false)

  const tier = ASSEMBLER_TIERS[tierIdx]
  const numProdMods = prodModules ? tier.moduleSlots : 0

  const { speed: effSpeed, prod: effProd } = useMemo(
    () => calcEffectiveSpeed(tier, numProdMods),
    [tier, numProdMods]
  )

  // Scale factor: how many machines of the selected tier are needed
  // compared to the base ratio (defined at Assembler 2 speed, no modules)
  // More speed = fewer machines needed; more productivity = fewer machines needed
  const scaleFactor = useMemo(() => {
    const baseEffective = BASE_SPEED * 1 // base speed * base prod (1.0)
    const currentEffective = effSpeed * effProd
    return baseEffective / currentEffective
  }, [effSpeed, effProd])

  const scaledRecipes = useMemo(() => {
    return RECIPES.map(recipe => ({
      ...recipe,
      scaledMachines: recipe.machines.map(m => ({
        ...m,
        scaledCount: m.count * scaleFactor,
      })),
    }))
  }, [scaleFactor])

  const totalMachines = useMemo(() => {
    return scaledRecipes.reduce<number>(
      (sum, r) => sum + r.scaledMachines.reduce<number>((s, m) => s + m.scaledCount, 0),
      0
    )
  }, [scaledRecipes])

  return (
    <div>
      <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 12px 0' }}>
        {t('ratios.description')}
      </p>

      <div className="controls-row">
        <div className="control-group">
          <label>{t('ratios.tier')}:</label>
          {ASSEMBLER_TIERS.map((a, i) => (
            <button
              key={a.id}
              className={`btn ${tierIdx === i ? 'active' : ''}`}
              onClick={() => setTierIdx(i)}
            >
              {a.label}
            </button>
          ))}
        </div>
        <div className="control-group">
          <label>
            <input
              type="checkbox"
              checked={prodModules}
              onChange={(e) => setProdModules(e.target.checked)}
            />
            {' '}{t('ratios.prodModules')}
          </label>
          {prodModules && (
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              ({numProdMods} mod{numProdMods !== 1 ? 's' : ''})
            </span>
          )}
        </div>
      </div>

      {/* Summary stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10, marginTop: 12 }}>
        <Stat label={t('ratios.tier')} value={tier.label} />
        <Stat
          label={t('ratios.machines')}
          value={totalMachines.toFixed(1)}
          color="#4caf50"
        />
        <Stat
          label="Speed"
          value={`${effSpeed.toFixed(2)}x`}
          color={prodModules ? '#ff9800' : 'var(--accent)'}
        />
        <Stat
          label="Productivity"
          value={`${(effProd * 100).toFixed(0)}%`}
          color="#4caf50"
        />
      </div>

      {/* Recipes table */}
      <div style={{ marginTop: 16, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr>
              <th style={thStyle}>{t('ratios.recipe')}</th>
              <th style={thStyle}>{t('ratios.machines')}</th>
              <th style={thStyle}>{t('ratios.ratio')}</th>
              <th style={thStyle}>{t('ratios.notes')}</th>
            </tr>
          </thead>
          <tbody>
            {scaledRecipes.map(recipe => (
              <tr key={recipe.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={tdStyle}>
                  <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>
                    {t(recipe.nameKey)}
                  </span>
                </td>
                <td style={tdStyle}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {recipe.scaledMachines.map((m, i) => (
                      <span key={i} style={{ fontSize: 12 }}>
                        <span style={{ fontFamily: 'monospace', color: 'var(--accent)', fontWeight: 700 }}>
                          {m.scaledCount < 1 ? m.scaledCount.toFixed(2) : m.scaledCount % 1 === 0 ? m.scaledCount.toFixed(0) : m.scaledCount.toFixed(1)}
                        </span>
                        <span style={{ color: 'var(--text-muted)', marginLeft: 4 }}>
                          {m.role}
                        </span>
                      </span>
                    ))}
                  </div>
                </td>
                <td style={{ ...tdStyle, fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
                  {recipe.scaledMachines
                    .map(m =>
                      m.scaledCount < 1
                        ? m.scaledCount.toFixed(2)
                        : m.scaledCount % 1 === 0
                          ? m.scaledCount.toFixed(0)
                          : m.scaledCount.toFixed(1)
                    )
                    .join(' : ')}
                </td>
                <td style={{ ...tdStyle, color: 'var(--text-muted)', fontSize: 11 }}>
                  {t(recipe.notesKey)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const thStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '8px 12px',
  fontSize: 11,
  color: 'var(--text-muted)',
  borderBottom: '2px solid var(--border)',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
}

const tdStyle: React.CSSProperties = {
  padding: '8px 12px',
  verticalAlign: 'top',
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 6, padding: '10px 14px' }}>
      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{label}</div>
      <div style={{ fontSize: 18, color: color || 'var(--accent)', fontWeight: 700, fontFamily: 'monospace' }}>{value}</div>
    </div>
  )
}
