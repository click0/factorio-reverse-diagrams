import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'

type Mode = 'basic' | 'advanced' | 'coalLiquefaction'

interface ProcessingMode {
  label: string
  craftTime: number
  inputs: { id: string; amount: number }[]
  outputs: { id: string; amount: number }[]
}

const MODES: Record<Mode, ProcessingMode> = {
  basic: {
    label: 'oil.basic',
    craftTime: 5,
    inputs: [{ id: 'crude', amount: 100 }],
    outputs: [{ id: 'petroleum', amount: 45 }],
  },
  advanced: {
    label: 'oil.advanced',
    craftTime: 5,
    inputs: [
      { id: 'crude', amount: 100 },
      { id: 'water', amount: 50 },
    ],
    outputs: [
      { id: 'heavy', amount: 25 },
      { id: 'light', amount: 45 },
      { id: 'petroleum', amount: 55 },
    ],
  },
  coalLiquefaction: {
    label: 'oil.coalLiquefaction',
    craftTime: 5,
    inputs: [
      { id: 'coal', amount: 10 },
      { id: 'heavy', amount: 25 },
      { id: 'steam', amount: 50 },
    ],
    outputs: [
      { id: 'heavy', amount: 90 },
      { id: 'light', amount: 20 },
      { id: 'petroleum', amount: 10 },
    ],
  },
}

const HEAVY_CRACKING = {
  craftTime: 2,
  inputs: [
    { id: 'heavy', amount: 40 },
    { id: 'water', amount: 30 },
  ],
  outputs: [{ id: 'light', amount: 30 }],
}

const LIGHT_CRACKING = {
  craftTime: 2,
  inputs: [
    { id: 'light', amount: 30 },
    { id: 'water', amount: 30 },
  ],
  outputs: [{ id: 'petroleum', amount: 20 }],
}

const REFINERY_SPEED = 1.0
const CHEMICAL_SPEED = 1.0

const FLUID_COLORS: Record<string, string> = {
  crude: '#5d4037',
  heavy: '#ff8f00',
  light: '#ffd54f',
  petroleum: '#66bb6a',
  water: '#42a5f5',
  coal: '#6d4c41',
  steam: '#b0bec5',
}

interface FlowCalc {
  refineries: number
  heavyCrackers: number
  lightCrackers: number
  heavySurplus: number
  lightSurplus: number
  waterConsumption: number
  flows: {
    refineryHeavyOut: number
    refineryLightOut: number
    refineryPetroleumOut: number
    heavyCrackIn: number
    heavyCrackLightOut: number
    lightCrackIn: number
    lightCrackPetroleumOut: number
    crudeIn: number
    waterRefinery: number
    waterHeavyCrack: number
    waterLightCrack: number
    coalIn: number
    steamIn: number
    heavyRecycleIn: number
  }
}

function calculate(mode: Mode, targetPetroleum: number): FlowCalc {
  const m = MODES[mode]
  const refineryCraftRate = REFINERY_SPEED / m.craftTime
  const chemCraftRate = CHEMICAL_SPEED

  const heavyOut = (m.outputs.find(o => o.id === 'heavy')?.amount ?? 0) * refineryCraftRate
  const lightOut = (m.outputs.find(o => o.id === 'light')?.amount ?? 0) * refineryCraftRate
  const petroOut = (m.outputs.find(o => o.id === 'petroleum')?.amount ?? 0) * refineryCraftRate

  if (mode === 'basic') {
    // Basic: no cracking, only petroleum output
    const perRefinery = petroOut
    const refineries = Math.ceil(targetPetroleum / perRefinery)
    const crudeIn = (m.inputs.find(i => i.id === 'crude')?.amount ?? 0) * refineryCraftRate * refineries
    return {
      refineries,
      heavyCrackers: 0,
      lightCrackers: 0,
      heavySurplus: 0,
      lightSurplus: 0,
      waterConsumption: 0,
      flows: {
        refineryHeavyOut: 0,
        refineryLightOut: 0,
        refineryPetroleumOut: perRefinery * refineries,
        heavyCrackIn: 0,
        heavyCrackLightOut: 0,
        lightCrackIn: 0,
        lightCrackPetroleumOut: 0,
        crudeIn,
        waterRefinery: 0,
        waterHeavyCrack: 0,
        waterLightCrack: 0,
        coalIn: 0,
        steamIn: 0,
        heavyRecycleIn: 0,
      },
    }
  }

  // Advanced / Coal Liquefaction: crack heavy->light, then light->petroleum
  // Per refinery per second:
  //   heavy produced: heavyOut
  //   light produced: lightOut
  //   petroleum produced: petroOut
  //
  // Heavy cracking: 40 heavy + 30 water -> 30 light (2s, chemical plant speed 1.0)
  //   per plant per second: consumes 40/2=20 heavy, produces 30/2=15 light, uses 30/2=15 water
  //
  // Light cracking: 30 light + 30 water -> 20 petroleum (2s)
  //   per plant per second: consumes 30/2=15 light, produces 20/2=10 petroleum, uses 30/2=15 water

  const heavyCrackConsumePerPlant = (HEAVY_CRACKING.inputs[0].amount / HEAVY_CRACKING.craftTime) * chemCraftRate // 20
  const heavyCrackLightPerPlant = (HEAVY_CRACKING.outputs[0].amount / HEAVY_CRACKING.craftTime) * chemCraftRate  // 15
  const heavyCrackWaterPerPlant = (HEAVY_CRACKING.inputs[1].amount / HEAVY_CRACKING.craftTime) * chemCraftRate   // 15

  const lightCrackConsumePerPlant = (LIGHT_CRACKING.inputs[0].amount / LIGHT_CRACKING.craftTime) * chemCraftRate // 15
  const lightCrackPetroPerPlant = (LIGHT_CRACKING.outputs[0].amount / LIGHT_CRACKING.craftTime) * chemCraftRate  // 10
  const lightCrackWaterPerPlant = (LIGHT_CRACKING.inputs[1].amount / LIGHT_CRACKING.craftTime) * chemCraftRate   // 15

  // For coal liquefaction, net heavy per refinery = heavyOut - heavyIn (recycled)
  const heavyInputPerRefinery = (m.inputs.find(i => i.id === 'heavy')?.amount ?? 0) * refineryCraftRate
  const netHeavyPerRefinery = heavyOut - heavyInputPerRefinery

  // We solve for refineries (R), heavy crackers (H), light crackers (L):
  // Petroleum target: R * petroOut + L * lightCrackPetroPerPlant = targetPetroleum
  // Heavy balance: R * netHeavyPerRefinery = H * heavyCrackConsumePerPlant (crack all heavy)
  // Light balance: R * lightOut + H * heavyCrackLightPerPlant = L * lightCrackConsumePerPlant (crack all light)
  //
  // From heavy balance: H = R * netHeavyPerRefinery / heavyCrackConsumePerPlant
  // From light balance: L = (R * lightOut + H * heavyCrackLightPerPlant) / lightCrackConsumePerPlant
  // Petroleum: R * petroOut + L * lightCrackPetroPerPlant = targetPetroleum
  //
  // Substitute H into L:
  // L = (R * lightOut + (R * netHeavyPerRefinery / heavyCrackConsumePerPlant) * heavyCrackLightPerPlant) / lightCrackConsumePerPlant
  // L = R * (lightOut + netHeavyPerRefinery * heavyCrackLightPerPlant / heavyCrackConsumePerPlant) / lightCrackConsumePerPlant
  //
  // Substitute L into petroleum equation:
  // R * petroOut + R * (lightOut + netHeavyPerRefinery * heavyCrackLightPerPlant / heavyCrackConsumePerPlant) / lightCrackConsumePerPlant * lightCrackPetroPerPlant = targetPetroleum

  const extraLightFromHeavyCrack = netHeavyPerRefinery * heavyCrackLightPerPlant / heavyCrackConsumePerPlant
  const totalLightPerRefinery = lightOut + extraLightFromHeavyCrack
  const petroFromLightCrackPerRefinery = (totalLightPerRefinery / lightCrackConsumePerPlant) * lightCrackPetroPerPlant
  const totalPetroPerRefinery = petroOut + petroFromLightCrackPerRefinery

  const refineries = Math.ceil(targetPetroleum / totalPetroPerRefinery)
  const actualHeavy = refineries * netHeavyPerRefinery
  const heavyCrackers = actualHeavy > 0 ? Math.ceil(actualHeavy / heavyCrackConsumePerPlant) : 0
  const actualLightFromCrack = heavyCrackers * heavyCrackLightPerPlant
  const totalLight = refineries * lightOut + actualLightFromCrack
  const lightCrackers = totalLight > 0 ? Math.ceil(totalLight / lightCrackConsumePerPlant) : 0

  const actualPetroleum = refineries * petroOut + lightCrackers * lightCrackPetroPerPlant
  const heavyProduced = refineries * heavyOut
  const heavyConsumed = heavyCrackers * heavyCrackConsumePerPlant + refineries * heavyInputPerRefinery
  const heavySurplus = heavyProduced - heavyConsumed

  const lightProduced = refineries * lightOut + heavyCrackers * heavyCrackLightPerPlant
  const lightConsumed = lightCrackers * lightCrackConsumePerPlant
  const lightSurplus = lightProduced - lightConsumed

  const waterRefinery = (m.inputs.find(i => i.id === 'water')?.amount ?? 0) * refineryCraftRate * refineries
  const waterHeavyCrack = heavyCrackers * heavyCrackWaterPerPlant
  const waterLightCrack = lightCrackers * lightCrackWaterPerPlant
  const waterConsumption = waterRefinery + waterHeavyCrack + waterLightCrack

  const crudeIn = (m.inputs.find(i => i.id === 'crude')?.amount ?? 0) * refineryCraftRate * refineries
  const coalIn = (m.inputs.find(i => i.id === 'coal')?.amount ?? 0) * refineryCraftRate * refineries
  const steamIn = (m.inputs.find(i => i.id === 'steam')?.amount ?? 0) * refineryCraftRate * refineries

  return {
    refineries,
    heavyCrackers,
    lightCrackers,
    heavySurplus,
    lightSurplus,
    waterConsumption,
    flows: {
      refineryHeavyOut: refineries * heavyOut,
      refineryLightOut: refineries * lightOut,
      refineryPetroleumOut: refineries * petroOut,
      heavyCrackIn: heavyCrackers * heavyCrackConsumePerPlant,
      heavyCrackLightOut: heavyCrackers * heavyCrackLightPerPlant,
      lightCrackIn: lightCrackers * lightCrackConsumePerPlant,
      lightCrackPetroleumOut: lightCrackers * lightCrackPetroPerPlant,
      crudeIn,
      waterRefinery,
      waterHeavyCrack,
      waterLightCrack,
      coalIn,
      steamIn,
      heavyRecycleIn: refineries * heavyInputPerRefinery,
    },
  }
}

function flowWidth(value: number, maxFlow: number): number {
  if (maxFlow <= 0) return 1
  return Math.max(1, Math.min(12, (value / maxFlow) * 12))
}

export default function OilRefining() {
  const { t } = useTranslation()
  const [mode, setMode] = useState<Mode>('advanced')
  const [targetPetroleum, setTargetPetroleum] = useState(100)

  const calc = useMemo(() => calculate(mode, targetPetroleum), [mode, targetPetroleum])

  const maxFlow = useMemo(() => {
    const f = calc.flows
    return Math.max(
      f.crudeIn, f.refineryHeavyOut, f.refineryLightOut, f.refineryPetroleumOut,
      f.heavyCrackIn, f.heavyCrackLightOut, f.lightCrackIn, f.lightCrackPetroleumOut,
      f.waterRefinery, f.waterHeavyCrack, f.waterLightCrack, f.coalIn, f.steamIn, 1
    )
  }, [calc])

  const svgW = 800
  const svgH = 420

  // Box positions
  const refineryBox = { x: 200, y: 140, w: 140, h: 60 }
  const heavyCrackBox = { x: 440, y: 60, w: 140, h: 50 }
  const lightCrackBox = { x: 440, y: 220, w: 140, h: 50 }
  const outputBox = { x: 660, y: 160, w: 110, h: 100 }

  const hasHeavyCracking = calc.heavyCrackers > 0
  const hasLightCracking = calc.lightCrackers > 0
  const isCoalLiq = mode === 'coalLiquefaction'

  function balanceLabel(surplus: number): string {
    if (Math.abs(surplus) < 0.01) return t('oil.balanced')
    return surplus > 0
      ? `${t('oil.surplus')}: +${surplus.toFixed(1)}`
      : `${t('oil.deficit')}: ${surplus.toFixed(1)}`
  }

  function balanceColor(surplus: number): string {
    if (Math.abs(surplus) < 0.01) return 'var(--text-muted)'
    return surplus > 0 ? '#66bb6a' : '#ef5350'
  }

  return (
    <div>
      <div className="controls-row">
        <div className="control-group">
          {(['basic', 'advanced', 'coalLiquefaction'] as Mode[]).map(m => (
            <button key={m} className={`btn ${mode === m ? 'active' : ''}`}
              onClick={() => setMode(m)}>
              {t(MODES[m].label)}
            </button>
          ))}
        </div>
      </div>

      <div className="controls-row">
        <div className="control-group">
          <label>{t('oil.targetPetroleum')}:</label>
          <input type="range" min={10} max={1000} step={10} value={targetPetroleum}
            onChange={(e) => setTargetPetroleum(Number(e.target.value))} />
          <span style={{ fontSize: 13, color: 'var(--accent)', minWidth: 80, fontWeight: 700 }}>
            {targetPetroleum} {t('oil.unitsPerSec')}
          </span>
        </div>
      </div>

      {/* SVG Flow Diagram */}
      <div style={{ overflowX: 'auto', marginTop: 8 }}>
        <svg viewBox={`0 0 ${svgW} ${svgH}`} style={{ width: '100%', maxWidth: svgW, display: 'block' }}>
          <defs>
            <marker id="oil-arrow" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
              <polygon points="0 0, 8 3, 0 6" fill="#ffffff60" />
            </marker>
          </defs>

          {/* Background */}
          <rect width={svgW} height={svgH} fill="var(--bg-surface)" rx={6} />

          {/* Input labels on the left */}
          {mode !== 'basic' && mode !== 'coalLiquefaction' && (
            <>
              {/* Crude oil input */}
              <FlowArrow
                x1={40} y1={155} x2={refineryBox.x} y2={155}
                color={FLUID_COLORS.crude} width={flowWidth(calc.flows.crudeIn, maxFlow)}
                label={`${calc.flows.crudeIn.toFixed(1)}`}
              />
              <text x={30} y={155} textAnchor="end" fill={FLUID_COLORS.crude} fontSize={11} dominantBaseline="middle">
                {t('oil.crude')}
              </text>
              {/* Water input to refinery */}
              <FlowArrow
                x1={40} y1={185} x2={refineryBox.x} y2={185}
                color={FLUID_COLORS.water} width={flowWidth(calc.flows.waterRefinery, maxFlow)}
                label={`${calc.flows.waterRefinery.toFixed(1)}`}
              />
              <text x={30} y={185} textAnchor="end" fill={FLUID_COLORS.water} fontSize={11} dominantBaseline="middle">
                {t('oil.water')}
              </text>
            </>
          )}

          {mode === 'basic' && (
            <>
              <FlowArrow
                x1={40} y1={170} x2={refineryBox.x} y2={170}
                color={FLUID_COLORS.crude} width={flowWidth(calc.flows.crudeIn, maxFlow)}
                label={`${calc.flows.crudeIn.toFixed(1)}`}
              />
              <text x={30} y={170} textAnchor="end" fill={FLUID_COLORS.crude} fontSize={11} dominantBaseline="middle">
                {t('oil.crude')}
              </text>
            </>
          )}

          {isCoalLiq && (
            <>
              <FlowArrow
                x1={40} y1={145} x2={refineryBox.x} y2={145}
                color={FLUID_COLORS.coal} width={flowWidth(calc.flows.coalIn, maxFlow)}
                label={`${calc.flows.coalIn.toFixed(1)}`}
              />
              <text x={30} y={145} textAnchor="end" fill={FLUID_COLORS.coal} fontSize={11} dominantBaseline="middle">
                {t('oil.coal')}
              </text>
              <FlowArrow
                x1={40} y1={170} x2={refineryBox.x} y2={170}
                color={FLUID_COLORS.steam} width={flowWidth(calc.flows.steamIn, maxFlow)}
                label={`${calc.flows.steamIn.toFixed(1)}`}
              />
              <text x={30} y={170} textAnchor="end" fill={FLUID_COLORS.steam} fontSize={11} dominantBaseline="middle">
                {t('oil.steam')}
              </text>
              {/* Heavy oil recycle arrow (loop back) */}
              {calc.flows.heavyRecycleIn > 0 && (
                <>
                  <FlowArrow
                    x1={40} y1={195} x2={refineryBox.x} y2={195}
                    color={FLUID_COLORS.heavy} width={flowWidth(calc.flows.heavyRecycleIn, maxFlow)}
                    label={`${calc.flows.heavyRecycleIn.toFixed(1)}`}
                  />
                  <text x={30} y={195} textAnchor="end" fill={FLUID_COLORS.heavy} fontSize={9} dominantBaseline="middle">
                    {t('oil.heavy')}
                  </text>
                </>
              )}
            </>
          )}

          {/* Refinery box */}
          <ProcessBox
            x={refineryBox.x} y={refineryBox.y} w={refineryBox.w} h={refineryBox.h}
            label={t('oil.refineries')} count={calc.refineries}
          />

          {/* Refinery outputs */}
          {hasHeavyCracking && (
            <>
              {/* Heavy -> Heavy Cracking */}
              <FlowArrow
                x1={refineryBox.x + refineryBox.w} y1={refineryBox.y + 15}
                x2={heavyCrackBox.x} y2={heavyCrackBox.y + heavyCrackBox.h / 2}
                color={FLUID_COLORS.heavy} width={flowWidth(calc.flows.refineryHeavyOut, maxFlow)}
                label={`${calc.flows.refineryHeavyOut.toFixed(1)}`}
              />
            </>
          )}

          {hasLightCracking && (
            <>
              {/* Light -> Light Cracking (directly from refinery) */}
              <FlowArrow
                x1={refineryBox.x + refineryBox.w} y1={refineryBox.y + refineryBox.h - 15}
                x2={lightCrackBox.x} y2={lightCrackBox.y + 15}
                color={FLUID_COLORS.light} width={flowWidth(calc.flows.refineryLightOut, maxFlow)}
                label={`${calc.flows.refineryLightOut.toFixed(1)}`}
              />
            </>
          )}

          {/* Direct petroleum from refinery to output */}
          {calc.flows.refineryPetroleumOut > 0 && (
            <FlowArrow
              x1={refineryBox.x + refineryBox.w} y1={refineryBox.y + refineryBox.h / 2}
              x2={hasLightCracking ? lightCrackBox.x + lightCrackBox.w + 15 : outputBox.x}
              y2={outputBox.y + outputBox.h / 2}
              color={FLUID_COLORS.petroleum} width={flowWidth(calc.flows.refineryPetroleumOut, maxFlow)}
              label={`${calc.flows.refineryPetroleumOut.toFixed(1)}`}
            />
          )}

          {/* Heavy Cracking box */}
          {hasHeavyCracking && (
            <>
              <ProcessBox
                x={heavyCrackBox.x} y={heavyCrackBox.y} w={heavyCrackBox.w} h={heavyCrackBox.h}
                label={t('oil.heavyCracking')} count={calc.heavyCrackers}
              />
              {/* Water input to heavy cracking */}
              <FlowArrow
                x1={heavyCrackBox.x} y1={heavyCrackBox.y}
                x2={heavyCrackBox.x + 20} y2={heavyCrackBox.y}
                color={FLUID_COLORS.water} width={flowWidth(calc.flows.waterHeavyCrack, maxFlow)}
                label=""
              />
              <text x={heavyCrackBox.x - 5} y={heavyCrackBox.y - 8} textAnchor="end" fill={FLUID_COLORS.water} fontSize={9}>
                {t('oil.water')}: {calc.flows.waterHeavyCrack.toFixed(1)}
              </text>
              {/* Heavy cracking -> Light output -> joins light cracking */}
              <FlowArrow
                x1={heavyCrackBox.x + heavyCrackBox.w} y1={heavyCrackBox.y + heavyCrackBox.h / 2}
                x2={lightCrackBox.x + lightCrackBox.w / 2} y2={lightCrackBox.y}
                color={FLUID_COLORS.light} width={flowWidth(calc.flows.heavyCrackLightOut, maxFlow)}
                label={`${calc.flows.heavyCrackLightOut.toFixed(1)}`}
              />
            </>
          )}

          {/* Light Cracking box */}
          {hasLightCracking && (
            <>
              <ProcessBox
                x={lightCrackBox.x} y={lightCrackBox.y} w={lightCrackBox.w} h={lightCrackBox.h}
                label={t('oil.lightCracking')} count={calc.lightCrackers}
              />
              {/* Water input to light cracking */}
              <FlowArrow
                x1={lightCrackBox.x} y1={lightCrackBox.y + lightCrackBox.h}
                x2={lightCrackBox.x + 20} y2={lightCrackBox.y + lightCrackBox.h}
                color={FLUID_COLORS.water} width={flowWidth(calc.flows.waterLightCrack, maxFlow)}
                label=""
              />
              <text x={lightCrackBox.x - 5} y={lightCrackBox.y + lightCrackBox.h + 14} textAnchor="end" fill={FLUID_COLORS.water} fontSize={9}>
                {t('oil.water')}: {calc.flows.waterLightCrack.toFixed(1)}
              </text>
              {/* Light cracking -> Petroleum output */}
              <FlowArrow
                x1={lightCrackBox.x + lightCrackBox.w} y1={lightCrackBox.y + lightCrackBox.h / 2}
                x2={outputBox.x} y2={outputBox.y + outputBox.h / 2 + 15}
                color={FLUID_COLORS.petroleum} width={flowWidth(calc.flows.lightCrackPetroleumOut, maxFlow)}
                label={`${calc.flows.lightCrackPetroleumOut.toFixed(1)}`}
              />
            </>
          )}

          {/* Output box */}
          <rect x={outputBox.x} y={outputBox.y} width={outputBox.w} height={outputBox.h}
            rx={6} fill="#1a2a1a" stroke={FLUID_COLORS.petroleum} strokeWidth={1.5} />
          <text x={outputBox.x + outputBox.w / 2} y={outputBox.y + 18} textAnchor="middle"
            fill="#ffffffcc" fontSize={11} fontWeight={700}>
            {t('oil.petroleum')}
          </text>
          <text x={outputBox.x + outputBox.w / 2} y={outputBox.y + 40} textAnchor="middle"
            fill={FLUID_COLORS.petroleum} fontSize={16} fontWeight={700} fontFamily="monospace">
            {(calc.flows.refineryPetroleumOut + calc.flows.lightCrackPetroleumOut).toFixed(1)}
          </text>
          <text x={outputBox.x + outputBox.w / 2} y={outputBox.y + 56} textAnchor="middle"
            fill="#ffffff80" fontSize={9}>
            {t('oil.unitsPerSec')}
          </text>

          {/* Balance indicators */}
          {mode !== 'basic' && (
            <>
              <text x={outputBox.x + outputBox.w / 2} y={outputBox.y + outputBox.h + 20}
                textAnchor="middle" fill={balanceColor(calc.heavySurplus)} fontSize={9}>
                {t('oil.heavy')}: {balanceLabel(calc.heavySurplus)}
              </text>
              <text x={outputBox.x + outputBox.w / 2} y={outputBox.y + outputBox.h + 34}
                textAnchor="middle" fill={balanceColor(calc.lightSurplus)} fontSize={9}>
                {t('oil.light')}: {balanceLabel(calc.lightSurplus)}
              </text>
            </>
          )}
        </svg>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 8, marginTop: 12 }}>
        <Stat label={t('oil.refineries')} value={`${calc.refineries}`} />
        {hasHeavyCracking && (
          <Stat label={t('oil.heavyCracking')} value={`${calc.heavyCrackers} ${t('oil.crackingPlants')}`} />
        )}
        {hasLightCracking && (
          <Stat label={t('oil.lightCracking')} value={`${calc.lightCrackers} ${t('oil.crackingPlants')}`} />
        )}
        <Stat label={t('oil.waterConsumption')} value={`${calc.waterConsumption.toFixed(1)} ${t('oil.unitsPerSec')}`} />
        {mode !== 'basic' && (
          <>
            <Stat
              label={t('oil.heavy')}
              value={balanceLabel(calc.heavySurplus)}
              color={balanceColor(calc.heavySurplus)}
            />
            <Stat
              label={t('oil.light')}
              value={balanceLabel(calc.lightSurplus)}
              color={balanceColor(calc.lightSurplus)}
            />
          </>
        )}
      </div>
    </div>
  )
}

function ProcessBox({ x, y, w, h, label, count }: { x: number; y: number; w: number; h: number; label: string; count: number }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={6}
        fill="#1a1a2e" stroke="var(--border)" strokeWidth={1.5} />
      <text x={x + w / 2} y={y + h / 2 - 6} textAnchor="middle"
        fill="#ffffffcc" fontSize={11} fontWeight={600}>
        {label}
      </text>
      <text x={x + w / 2} y={y + h / 2 + 12} textAnchor="middle"
        fill="var(--accent)" fontSize={14} fontWeight={700} fontFamily="monospace">
        x{count}
      </text>
    </g>
  )
}

function FlowArrow({ x1, y1, x2, y2, color, width, label }: {
  x1: number; y1: number; x2: number; y2: number
  color: string; width: number; label: string
}) {
  const mx = (x1 + x2) / 2
  const my = (y1 + y2) / 2
  return (
    <g>
      <line x1={x1} y1={y1} x2={x2} y2={y2}
        stroke={color} strokeWidth={width} strokeLinecap="round"
        markerEnd="url(#oil-arrow)" opacity={0.85} />
      {label && (
        <text x={mx} y={my - 6} textAnchor="middle" fill="#ffffffcc" fontSize={9}
          fontFamily="monospace" fontWeight={600}>
          {label}
        </text>
      )}
    </g>
  )
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 12px' }}>
      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{label}</div>
      <div style={{ fontSize: 14, color: color || 'var(--accent)', fontWeight: 700, fontFamily: 'monospace' }}>{value}</div>
    </div>
  )
}
