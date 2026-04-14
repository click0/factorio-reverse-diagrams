import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'

interface Furnace {
  id: string
  speed: number
  moduleSlots: number
  baseProd: number
  power: string
  color: string
}

interface Recipe {
  id: string
  nameKey: string
  baseTime: number
  inputCount: number
  highlight: boolean
}

const FURNACES: Furnace[] = [
  { id: 'stone-furnace', speed: 1.0, moduleSlots: 0, baseProd: 0, power: 'Fuel', color: '#8a7a6a' },
  { id: 'steel-furnace', speed: 2.0, moduleSlots: 0, baseProd: 0, power: 'Fuel', color: '#a0a0a0' },
  { id: 'electric-furnace', speed: 2.0, moduleSlots: 2, baseProd: 0, power: '180kW', color: '#c0c0c0' },
  { id: 'foundry', speed: 4.0, moduleSlots: 4, baseProd: 0.5, power: '800kW', color: '#ff5722' },
]

const RECIPES: Recipe[] = [
  { id: 'iron-plate', nameKey: 'material.ironOre', baseTime: 3.2, inputCount: 1, highlight: true },
  { id: 'copper-plate', nameKey: 'material.copperOre', baseTime: 3.2, inputCount: 1, highlight: true },
  { id: 'steel-plate', nameKey: 'material.steelPlate', baseTime: 16, inputCount: 5, highlight: true },
  { id: 'stone-brick', nameKey: 'material.stoneBrick', baseTime: 3.2, inputCount: 1, highlight: false },
  { id: 'iron-plate-foundry', nameKey: 'material.ironPlate', baseTime: 3.2, inputCount: 1, highlight: false },
]

const thStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '8px 12px',
  color: 'var(--text-muted)',
  fontWeight: 500,
}

const tdStyle: React.CSSProperties = {
  padding: '6px 12px',
  borderBottom: '1px solid #ffffff08',
  fontFamily: 'monospace',
}

export default function MaterialProcessing() {
  const { t } = useTranslation()
  const [selectedFurnace, setSelectedFurnace] = useState(0)
  const [furnaceCount, setFurnaceCount] = useState(10)

  const furnace = FURNACES[selectedFurnace]

  const tableData = useMemo(() => {
    return RECIPES.map((recipe) => {
      const effectiveTime = recipe.baseTime / furnace.speed
      const perFurnace = 60 / effectiveTime
      const total = perFurnace * furnaceCount
      return {
        ...recipe,
        effectiveTime,
        perFurnace,
        total,
      }
    })
  }, [selectedFurnace, furnaceCount, furnace.speed])

  return (
    <div>
      <div className="controls-row">
        <div className="control-group">
          <label>{t('material.furnaceType')}:</label>
          {FURNACES.map((f, i) => (
            <button
              key={f.id}
              className={`btn ${selectedFurnace === i ? 'active' : ''}`}
              style={{
                borderColor: selectedFurnace === i ? f.color : undefined,
                color: selectedFurnace === i ? f.color : undefined,
              }}
              onClick={() => setSelectedFurnace(i)}
            >
              {t(`material.${furnaceKey(f.id)}`)}
            </button>
          ))}
        </div>
      </div>

      <div className="controls-row">
        <div className="control-group">
          <label>{t('material.furnaceCount')}:</label>
          <input
            type="range"
            min={1}
            max={100}
            step={1}
            value={furnaceCount}
            onChange={(e) => setFurnaceCount(Number(e.target.value))}
          />
          <span style={{ fontSize: 13, color: 'var(--text-secondary)', minWidth: 40 }}>
            {furnaceCount}
          </span>
        </div>
      </div>

      {/* Furnace stat boxes */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: 10,
          marginTop: 12,
        }}
      >
        <Stat label={t('material.speed')} value={`${furnace.speed}x`} color={furnace.color} />
        <Stat label={t('material.moduleSlots')} value={`${furnace.moduleSlots}`} color={furnace.color} />
        <Stat label={t('material.power')} value={furnace.power} color={furnace.color} />
        <Stat
          label={t('material.baseProd')}
          value={`${(furnace.baseProd * 100).toFixed(0)}%`}
          color={furnace.baseProd > 0 ? '#4caf50' : 'var(--text-muted)'}
        />
      </div>

      {/* Recipe table */}
      <div style={{ overflowX: 'auto', marginTop: 12 }}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: 13,
            background: '#0d1117',
            borderRadius: 4,
          }}
        >
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <th style={thStyle}>{t('material.recipe')}</th>
              <th style={thStyle}>{t('material.baseTime')}</th>
              <th style={thStyle}>{t('material.effectiveTime')}</th>
              <th style={thStyle}>{t('material.perFurnace')}</th>
              <th style={thStyle}>{t('material.total')}</th>
            </tr>
          </thead>
          <tbody>
            {tableData.map((row) => (
              <tr key={row.id}>
                <td
                  style={{
                    ...tdStyle,
                    color: row.highlight ? 'var(--accent)' : 'var(--text-secondary)',
                    fontFamily: 'inherit',
                    fontWeight: row.highlight ? 600 : 400,
                  }}
                >
                  {t(row.nameKey)}
                </td>
                <td style={{ ...tdStyle, color: 'var(--text-secondary)' }}>
                  {row.baseTime.toFixed(1)}s
                </td>
                <td style={{ ...tdStyle, color: furnace.color }}>
                  {row.effectiveTime.toFixed(2)}s
                </td>
                <td style={{ ...tdStyle, color: '#4caf50' }}>
                  {row.perFurnace.toFixed(2)} {t('material.itemsPerMin')}
                </td>
                <td
                  style={{
                    ...tdStyle,
                    color: 'var(--accent)',
                    fontWeight: 700,
                  }}
                >
                  {row.total.toFixed(1)} {t('material.itemsPerMin')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function furnaceKey(id: string): string {
  switch (id) {
    case 'stone-furnace':
      return 'stoneFurnace'
    case 'steel-furnace':
      return 'steelFurnace'
    case 'electric-furnace':
      return 'electricFurnace'
    case 'foundry':
      return 'foundry'
    default:
      return id
  }
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 6,
        padding: '10px 14px',
      }}
    >
      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{label}</div>
      <div
        style={{
          fontSize: 18,
          color: color || 'var(--accent)',
          fontWeight: 700,
          fontFamily: 'monospace',
        }}
      >
        {value}
      </div>
    </div>
  )
}
