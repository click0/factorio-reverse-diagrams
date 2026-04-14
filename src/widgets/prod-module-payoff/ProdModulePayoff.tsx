import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'

// Productivity module tiers
const MODULES = [
  { tier: 1, prodBonus: 0.04, speedPenalty: -0.05, energyPenalty: 0.40, pollutionBonus: 0.05, costIPE: 50 },
  { tier: 2, prodBonus: 0.06, speedPenalty: -0.10, energyPenalty: 0.60, pollutionBonus: 0.10, costIPE: 200 },
  { tier: 3, prodBonus: 0.10, speedPenalty: -0.15, energyPenalty: 0.80, pollutionBonus: 0.15, costIPE: 1000 },
]

// Recipes with approximate iron-plate-equivalent values and craft times (seconds)
const RECIPES = [
  { id: 'greenCircuit',  valueIPE: 3.5,  craftTime: 0.5  },
  { id: 'redCircuit',    valueIPE: 14,   craftTime: 6    },
  { id: 'blueCircuit',   valueIPE: 70,   craftTime: 10   },
  { id: 'rocketControl', valueIPE: 200,  craftTime: 30   },
  { id: 'lowDensity',    valueIPE: 40,   craftTime: 20   },
  { id: 'rocketFuel',    valueIPE: 20,   craftTime: 30   },
]

// Machine tiers: craft speed multiplier and module slots
const MACHINES = [
  { id: 'assembler1', speed: 0.5,  slots: 0 },
  { id: 'assembler2', speed: 0.75, slots: 2 },
  { id: 'assembler3', speed: 1.25, slots: 4 },
]

const CHART_W = 700
const CHART_H = 260
const PAD = 50

export default function ProdModulePayoff() {
  const { t } = useTranslation()
  const [moduleTier, setModuleTier] = useState(0) // index into MODULES
  const [recipeIdx, setRecipeIdx] = useState(0)
  const [machineIdx, setMachineIdx] = useState(2) // default assembler 3

  const mod = MODULES[moduleTier]
  const recipe = RECIPES[recipeIdx]
  const machine = MACHINES[machineIdx]

  const numModules = machine.slots
  const totalProdBonus = mod.prodBonus * numModules
  const totalSpeedPenalty = mod.speedPenalty * numModules
  const effectiveSpeed = machine.speed * (1 + totalSpeedPenalty)
  const totalModuleCost = mod.costIPE * numModules

  const payoff = useMemo(() => {
    if (numModules === 0) {
      return { craftsToPayoff: Infinity, timeToPayoff: Infinity, extraPerMin: 0 }
    }

    const extraOutputPerCraft = recipe.valueIPE * totalProdBonus
    const craftsToPayoff = totalModuleCost / extraOutputPerCraft
    const timeToPayoff = craftsToPayoff * recipe.craftTime / effectiveSpeed
    const craftsPerMin = 60 / (recipe.craftTime / effectiveSpeed)
    const extraPerMin = craftsPerMin * extraOutputPerCraft

    return { craftsToPayoff, timeToPayoff, extraPerMin }
  }, [numModules, recipe, totalProdBonus, totalModuleCost, effectiveSpeed])

  // Chart data: cumulative value with vs without modules over crafts
  const chartData = useMemo(() => {
    const maxCrafts = numModules === 0 ? 100 : Math.ceil(payoff.craftsToPayoff * 2)
    const steps = Math.min(200, maxCrafts)
    const points: { craft: number; withMod: number; withoutMod: number }[] = []

    for (let i = 0; i <= steps; i++) {
      const craft = (i / steps) * maxCrafts
      const withoutMod = craft * recipe.valueIPE
      const withMod = craft * recipe.valueIPE * (1 + totalProdBonus) - totalModuleCost
      points.push({ craft, withMod, withoutMod })
    }
    return { points, maxCrafts }
  }, [numModules, recipe, totalProdBonus, totalModuleCost, payoff.craftsToPayoff])

  const { points, maxCrafts } = chartData
  const maxValue = points.length > 0 ? Math.max(points[points.length - 1].withoutMod, points[points.length - 1].withMod) : 1
  const minValue = numModules > 0 ? -totalModuleCost : 0
  const valueRange = maxValue - minValue

  const xScale = (craft: number) => PAD + (craft / maxCrafts) * (CHART_W - PAD * 2)
  const yScale = (val: number) => CHART_H - PAD - ((val - minValue) / (valueRange * 1.05)) * (CHART_H - PAD * 2)

  const formatTime = (seconds: number): string => {
    if (!isFinite(seconds)) return '--'
    if (seconds < 60) return `${seconds.toFixed(1)}s`
    if (seconds < 3600) return `${(seconds / 60).toFixed(1)}m`
    return `${(seconds / 3600).toFixed(1)}h`
  }

  const recipeLabel = (id: string): string => {
    const keyMap: Record<string, string> = {
      greenCircuit: 'prodModule.greenCircuit',
      redCircuit: 'prodModule.redCircuit',
      blueCircuit: 'prodModule.blueCircuit',
      rocketControl: 'prodModule.rocketControl',
      lowDensity: 'prodModule.lowDensity',
      rocketFuel: 'prodModule.rocketFuel',
    }
    return t(keyMap[id] || id)
  }

  // Break-even x position for the vertical marker
  const breakEvenX = numModules > 0 && isFinite(payoff.craftsToPayoff)
    ? xScale(payoff.craftsToPayoff)
    : null

  return (
    <div>
      <div className="controls-row">
        <div className="control-group">
          <label>{t('prodModule.moduleTier')}:</label>
          {MODULES.map((m, i) => (
            <button key={i} className={`btn ${moduleTier === i ? 'active' : ''}`}
              onClick={() => setModuleTier(i)}>
              {m.tier}
            </button>
          ))}
        </div>
        <div className="control-group">
          <label>{t('prodModule.recipe')}:</label>
          <select value={recipeIdx} onChange={(e) => setRecipeIdx(Number(e.target.value))}
            style={{ background: 'var(--bg-surface)', color: 'inherit', border: '1px solid var(--border)', borderRadius: 4, padding: '4px 8px' }}>
            {RECIPES.map((r, i) => (
              <option key={r.id} value={i}>{recipeLabel(r.id)}</option>
            ))}
          </select>
        </div>
        <div className="control-group">
          <label>{t('prodModule.machine')}:</label>
          {MACHINES.map((m, i) => (
            <button key={i} className={`btn ${machineIdx === i ? 'active' : ''}`}
              onClick={() => setMachineIdx(i)}>
              {m.id.replace('assembler', 'Asm ')}
            </button>
          ))}
        </div>
      </div>

      {/* Break-even chart */}
      <svg viewBox={`0 0 ${CHART_W} ${CHART_H}`}
        style={{ width: '100%', maxWidth: CHART_W, background: '#0d1117', borderRadius: 4, marginTop: 8 }}>

        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map(f => (
          <line key={f} x1={PAD} y1={PAD + f * (CHART_H - PAD * 2)} x2={CHART_W - PAD} y2={PAD + f * (CHART_H - PAD * 2)}
            stroke="#ffffff08" />
        ))}

        {/* Zero line if module cost pushes below zero */}
        {minValue < 0 && (
          <line x1={PAD} y1={yScale(0)} x2={CHART_W - PAD} y2={yScale(0)}
            stroke="#ffffff20" strokeWidth={1} strokeDasharray="4,4" />
        )}

        {/* Without modules line (orange) */}
        <polyline
          points={points.map(d => `${xScale(d.craft)},${yScale(d.withoutMod)}`).join(' ')}
          fill="none" stroke="#ff9800" strokeWidth={2} />

        {/* With modules line (green) */}
        {numModules > 0 && (
          <polyline
            points={points.map(d => `${xScale(d.craft)},${yScale(d.withMod)}`).join(' ')}
            fill="none" stroke="#4caf50" strokeWidth={2} />
        )}

        {/* Break-even vertical marker */}
        {breakEvenX !== null && breakEvenX >= PAD && breakEvenX <= CHART_W - PAD && (
          <>
            <line x1={breakEvenX} y1={PAD} x2={breakEvenX} y2={CHART_H - PAD}
              stroke="#ffffff40" strokeWidth={1} strokeDasharray="3,3" />
            <circle cx={breakEvenX} cy={yScale(payoff.craftsToPayoff * recipe.valueIPE)} r={4}
              fill="#4caf50" stroke="#fff" strokeWidth={1} />
            <text x={breakEvenX} y={PAD - 6} textAnchor="middle" fill="#ffffff80" fontSize={9}>
              {t('prodModule.breakEven')}
            </text>
          </>
        )}

        {/* X axis labels */}
        {Array.from({ length: 6 }, (_, i) => Math.round(i * maxCrafts / 5)).map(c => (
          <text key={c} x={xScale(c)} y={CHART_H - 8} textAnchor="middle" fill="#ffffff50" fontSize={9}>
            {c >= 1000 ? `${(c / 1000).toFixed(1)}k` : c}
          </text>
        ))}

        {/* Legend */}
        <line x1={PAD} y1={CHART_H - 4} x2={PAD + 16} y2={CHART_H - 4} stroke="#ff9800" strokeWidth={2} />
        <text x={PAD + 20} y={CHART_H - 1} fill="#ffffff60" fontSize={8}>{t('prodModule.withoutModules')}</text>
        {numModules > 0 && (
          <>
            <line x1={PAD + 130} y1={CHART_H - 4} x2={PAD + 146} y2={CHART_H - 4} stroke="#4caf50" strokeWidth={2} />
            <text x={PAD + 150} y={CHART_H - 1} fill="#ffffff60" fontSize={8}>{t('prodModule.withModules')}</text>
          </>
        )}
      </svg>

      {/* Stat boxes */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10, marginTop: 12 }}>
        <Stat
          label={t('prodModule.craftsToPayoff')}
          value={numModules > 0 && isFinite(payoff.craftsToPayoff) ? Math.ceil(payoff.craftsToPayoff).toLocaleString() : '--'}
        />
        <Stat
          label={t('prodModule.timeToPayoff')}
          value={formatTime(payoff.timeToPayoff)}
        />
        <Stat
          label={t('prodModule.extraPerMin')}
          value={numModules > 0 ? `+${payoff.extraPerMin.toFixed(2)}` : '--'}
          color="#4caf50"
        />
        <Stat
          label={t('prodModule.prodBonus')}
          value={numModules > 0 ? `+${(totalProdBonus * 100).toFixed(1)}%` : '--'}
          color="#4caf50"
        />
        <Stat
          label={t('prodModule.speedPenalty')}
          value={numModules > 0 ? `${(totalSpeedPenalty * 100).toFixed(1)}%` : '--'}
          color="#f44336"
        />
      </div>
    </div>
  )
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 6, padding: '10px 14px' }}>
      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{label}</div>
      <div style={{ fontSize: 18, color: color || 'var(--accent)', fontWeight: 700, fontFamily: 'monospace' }}>{value}</div>
    </div>
  )
}
