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

  const svgW = 920
  const svgH = 420

  // Refinery as tall vertical rectangle (matches in-game sprite: 2 fluid inputs one side, 3 fluid outputs other side)
  const refineryBox = { x: 210, y: 80, w: 160, h: 260 }
  // Cracking plants: small boxes, heavy on top, light on bottom
  const heavyCrackBox = { x: 540, y: 90, w: 150, h: 70 }
  const lightCrackBox = { x: 540, y: 260, w: 150, h: 70 }
  // Petroleum output on the right
  const outputBox = { x: 790, y: 170, w: 120, h: 100 }

  // Refinery left-side input ports (up to 3 stacked)
  const inputPorts = {
    top: refineryBox.y + 70,      // 150 — used by: advanced=(nothing), coal-liq=coal
    mid: refineryBox.y + 130,     // 210 — advanced=crude, coal-liq=steam
    bot: refineryBox.y + 190,     // 270 — advanced=water, coal-liq=heavy-recycle
  }
  // Refinery right-side output ports (3 fixed: heavy top, petroleum middle, light bottom)
  const outputPorts = {
    heavy: refineryBox.y + 40,       // 120
    petroleum: refineryBox.y + 130,  // 210
    light: refineryBox.y + 220,      // 300
  }

  // Cracking plant ports
  const heavyCrackIn = { x: heavyCrackBox.x, y: heavyCrackBox.y + heavyCrackBox.h / 2 }
  const heavyCrackOut = { x: heavyCrackBox.x + heavyCrackBox.w, y: heavyCrackBox.y + heavyCrackBox.h / 2 }
  const lightCrackIn = { x: lightCrackBox.x, y: lightCrackBox.y + lightCrackBox.h / 2 }
  const lightCrackOut = { x: lightCrackBox.x + lightCrackBox.w, y: lightCrackBox.y + lightCrackBox.h / 2 }

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

          {/* ── Refinery box (tall vertical, game-like) ── */}
          <RefineryBox
            box={refineryBox}
            label={t('oil.refineries')}
            count={calc.refineries}
            inputPorts={inputPorts}
            outputPorts={outputPorts}
            inputs={
              isCoalLiq
                ? [{ port: 'top', color: FLUID_COLORS.coal },
                   { port: 'mid', color: FLUID_COLORS.steam },
                   { port: 'bot', color: FLUID_COLORS.heavy }]
                : mode === 'basic'
                ? [{ port: 'mid', color: FLUID_COLORS.crude }]
                : [{ port: 'mid', color: FLUID_COLORS.crude },
                   { port: 'bot', color: FLUID_COLORS.water }]
            }
            outputs={
              mode === 'basic'
                ? [{ port: 'petroleum', color: FLUID_COLORS.petroleum }]
                : [{ port: 'heavy', color: FLUID_COLORS.heavy },
                   { port: 'petroleum', color: FLUID_COLORS.petroleum },
                   { port: 'light', color: FLUID_COLORS.light }]
            }
          />

          {/* ── Left-side input arrows ── */}
          {mode === 'basic' && (
            <InputArrow
              labelX={110} y={inputPorts.mid}
              x1={110} x2={refineryBox.x - 6}
              color={FLUID_COLORS.crude}
              label={t('oil.crude')}
              value={calc.flows.crudeIn}
              width={flowWidth(calc.flows.crudeIn, maxFlow)}
            />
          )}

          {mode === 'advanced' && (
            <>
              <InputArrow
                labelX={110} y={inputPorts.mid}
                x1={110} x2={refineryBox.x - 6}
                color={FLUID_COLORS.crude}
                label={t('oil.crude')}
                value={calc.flows.crudeIn}
                width={flowWidth(calc.flows.crudeIn, maxFlow)}
              />
              <InputArrow
                labelX={110} y={inputPorts.bot}
                x1={110} x2={refineryBox.x - 6}
                color={FLUID_COLORS.water}
                label={t('oil.water')}
                value={calc.flows.waterRefinery}
                width={flowWidth(calc.flows.waterRefinery, maxFlow)}
              />
            </>
          )}

          {isCoalLiq && (
            <>
              <InputArrow
                labelX={110} y={inputPorts.top}
                x1={110} x2={refineryBox.x - 6}
                color={FLUID_COLORS.coal}
                label={t('oil.coal')}
                value={calc.flows.coalIn}
                width={flowWidth(calc.flows.coalIn, maxFlow)}
              />
              <InputArrow
                labelX={110} y={inputPorts.mid}
                x1={110} x2={refineryBox.x - 6}
                color={FLUID_COLORS.steam}
                label={t('oil.steam')}
                value={calc.flows.steamIn}
                width={flowWidth(calc.flows.steamIn, maxFlow)}
              />
              {calc.flows.heavyRecycleIn > 0 && (
                <InputArrow
                  labelX={110} y={inputPorts.bot}
                  x1={110} x2={refineryBox.x - 6}
                  color={FLUID_COLORS.heavy}
                  label={t('oil.heavy')}
                  value={calc.flows.heavyRecycleIn}
                  width={flowWidth(calc.flows.heavyRecycleIn, maxFlow)}
                />
              )}
            </>
          )}

          {/* ── Cracking boxes ── */}
          {hasHeavyCracking && (
            <ProcessBox
              x={heavyCrackBox.x} y={heavyCrackBox.y} w={heavyCrackBox.w} h={heavyCrackBox.h}
              label={t('oil.heavyCracking')} count={calc.heavyCrackers}
            />
          )}
          {hasLightCracking && (
            <ProcessBox
              x={lightCrackBox.x} y={lightCrackBox.y} w={lightCrackBox.w} h={lightCrackBox.h}
              label={t('oil.lightCracking')} count={calc.lightCrackers}
            />
          )}

          {/* ── Petroleum output box ── */}
          <rect x={outputBox.x} y={outputBox.y} width={outputBox.w} height={outputBox.h}
            rx={6} fill="#1a2a1a" stroke={FLUID_COLORS.petroleum} strokeWidth={2} />
          <text x={outputBox.x + outputBox.w / 2} y={outputBox.y + 22} textAnchor="middle"
            fill="#ffffffcc" fontSize={12} fontWeight={700}>
            {t('oil.petroleum')}
          </text>
          <text x={outputBox.x + outputBox.w / 2} y={outputBox.y + 54} textAnchor="middle"
            fill={FLUID_COLORS.petroleum} fontSize={22} fontWeight={700} fontFamily="monospace">
            {(calc.flows.refineryPetroleumOut + calc.flows.lightCrackPetroleumOut).toFixed(1)}
          </text>
          <text x={outputBox.x + outputBox.w / 2} y={outputBox.y + 74} textAnchor="middle"
            fill="#ffffff80" fontSize={10}>
            {t('oil.unitsPerSec')}
          </text>

          {/* ── Connections: Refinery right-side ports → Cracking / Output ── */}
          {/* Heavy output → Heavy Crack */}
          {hasHeavyCracking && (
            <FlowLine
              x1={refineryBox.x + refineryBox.w + 6} y1={outputPorts.heavy}
              x2={heavyCrackIn.x - 4} y2={heavyCrackIn.y}
              color={FLUID_COLORS.heavy}
              width={flowWidth(calc.flows.refineryHeavyOut, maxFlow)}
              label={calc.flows.refineryHeavyOut.toFixed(1)}
              labelOffset={-8}
            />
          )}

          {/* Light output → Light Crack (for advanced/coal-liq) */}
          {hasLightCracking && calc.flows.refineryLightOut > 0 && (
            <FlowLine
              x1={refineryBox.x + refineryBox.w + 6} y1={outputPorts.light}
              x2={lightCrackIn.x - 4} y2={lightCrackIn.y}
              color={FLUID_COLORS.light}
              width={flowWidth(calc.flows.refineryLightOut, maxFlow)}
              label={calc.flows.refineryLightOut.toFixed(1)}
              labelOffset={12}
            />
          )}

          {/* Heavy Crack output (light) → Light Crack (goes down & in) */}
          {hasHeavyCracking && hasLightCracking && calc.flows.heavyCrackLightOut > 0 && (
            <ElbowFlow
              x1={heavyCrackOut.x + 4} y1={heavyCrackOut.y}
              x2={lightCrackIn.x - 4} y2={lightCrackIn.y - 12}
              color={FLUID_COLORS.light}
              width={flowWidth(calc.flows.heavyCrackLightOut, maxFlow)}
              label={calc.flows.heavyCrackLightOut.toFixed(1)}
            />
          )}

          {/* Direct petroleum from refinery middle-right → output box (straight line, no collision) */}
          {calc.flows.refineryPetroleumOut > 0 && (
            <FlowLine
              x1={refineryBox.x + refineryBox.w + 6} y1={outputPorts.petroleum}
              x2={outputBox.x - 4} y2={outputBox.y + outputBox.h / 2 - 12}
              color={FLUID_COLORS.petroleum}
              width={flowWidth(calc.flows.refineryPetroleumOut, maxFlow)}
              label={calc.flows.refineryPetroleumOut.toFixed(1)}
              labelOffset={-8}
            />
          )}

          {/* Light Crack petroleum output → output box */}
          {hasLightCracking && calc.flows.lightCrackPetroleumOut > 0 && (
            <FlowLine
              x1={lightCrackOut.x + 4} y1={lightCrackOut.y}
              x2={outputBox.x - 4} y2={outputBox.y + outputBox.h / 2 + 12}
              color={FLUID_COLORS.petroleum}
              width={flowWidth(calc.flows.lightCrackPetroleumOut, maxFlow)}
              label={calc.flows.lightCrackPetroleumOut.toFixed(1)}
              labelOffset={12}
            />
          )}

          {/* Water inputs to crackers — vertical arrows from outside */}
          {hasHeavyCracking && calc.flows.waterHeavyCrack > 0 && (
            <WaterInput
              x={heavyCrackBox.x + heavyCrackBox.w / 2}
              y={heavyCrackBox.y}
              value={calc.flows.waterHeavyCrack}
              width={flowWidth(calc.flows.waterHeavyCrack, maxFlow)}
              label={t('oil.water')}
            />
          )}
          {hasLightCracking && calc.flows.waterLightCrack > 0 && (
            <WaterInput
              x={lightCrackBox.x + lightCrackBox.w / 2}
              y={lightCrackBox.y + lightCrackBox.h}
              value={calc.flows.waterLightCrack}
              width={flowWidth(calc.flows.waterLightCrack, maxFlow)}
              label={t('oil.water')}
              fromBelow
            />
          )}

          {/* Balance indicators below output */}
          {mode !== 'basic' && (
            <>
              <text x={outputBox.x + outputBox.w / 2} y={outputBox.y + outputBox.h + 20}
                textAnchor="middle" fill={balanceColor(calc.heavySurplus)} fontSize={10}>
                {t('oil.heavy')}: {balanceLabel(calc.heavySurplus)}
              </text>
              <text x={outputBox.x + outputBox.w / 2} y={outputBox.y + outputBox.h + 36}
                textAnchor="middle" fill={balanceColor(calc.lightSurplus)} fontSize={10}>
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

function RefineryBox({ box, label, count, inputPorts, outputPorts, inputs, outputs }: {
  box: { x: number; y: number; w: number; h: number }
  label: string
  count: number
  inputPorts: { top: number; mid: number; bot: number }
  outputPorts: { heavy: number; petroleum: number; light: number }
  inputs: { port: 'top' | 'mid' | 'bot'; color: string }[]
  outputs: { port: 'heavy' | 'petroleum' | 'light'; color: string }[]
}) {
  const PIPE_LEN = 10
  const PIPE_R = 6
  return (
    <g>
      {/* Main body */}
      <rect x={box.x} y={box.y} width={box.w} height={box.h} rx={8}
        fill="#2a2a3e" stroke="var(--accent)" strokeWidth={2} />

      {/* Top decorative band */}
      <rect x={box.x + 8} y={box.y + 8} width={box.w - 16} height={24} rx={4}
        fill="#1a1a2e" stroke="var(--border)" strokeWidth={1} />

      {/* Label + count */}
      <text x={box.x + box.w / 2} y={box.y + 24} textAnchor="middle"
        fill="#ffffffcc" fontSize={12} fontWeight={700}>
        {label}
      </text>
      <text x={box.x + box.w / 2} y={box.y + box.h / 2 + 6} textAnchor="middle"
        fill="var(--accent)" fontSize={32} fontWeight={700} fontFamily="monospace">
        x{count}
      </text>

      {/* Left-side input pipe stubs */}
      {inputs.map(({ port, color }) => {
        const py = inputPorts[port]
        return (
          <g key={`in-${port}`}>
            <line x1={box.x - PIPE_LEN} y1={py} x2={box.x} y2={py}
              stroke={color} strokeWidth={PIPE_R * 2} strokeLinecap="butt" />
            <circle cx={box.x - PIPE_LEN} cy={py} r={PIPE_R + 1}
              fill="#1a1a2e" stroke={color} strokeWidth={1.5} />
          </g>
        )
      })}

      {/* Right-side output pipe stubs */}
      {outputs.map(({ port, color }) => {
        const py = outputPorts[port]
        return (
          <g key={`out-${port}`}>
            <line x1={box.x + box.w} y1={py} x2={box.x + box.w + PIPE_LEN} y2={py}
              stroke={color} strokeWidth={PIPE_R * 2} strokeLinecap="butt" />
            <circle cx={box.x + box.w + PIPE_LEN} cy={py} r={PIPE_R + 1}
              fill="#1a1a2e" stroke={color} strokeWidth={1.5} />
          </g>
        )
      })}
    </g>
  )
}

function ElbowFlow({ x1, y1, x2, y2, color, width, label }: {
  x1: number; y1: number; x2: number; y2: number
  color: string; width: number; label: string
}) {
  // L-shaped path: horizontal first, then vertical down to target
  const midX = x2
  const path = `M ${x1} ${y1} L ${midX} ${y1} L ${x2} ${y2}`
  return (
    <g>
      <path d={path} fill="none" stroke={color} strokeWidth={width}
        strokeLinecap="round" strokeLinejoin="round"
        markerEnd="url(#oil-arrow)" opacity={0.85} />
      {label && (
        <text x={midX + 6} y={(y1 + y2) / 2} textAnchor="start"
          fill="#ffffffcc" fontSize={10} fontFamily="monospace" fontWeight={600}
          style={{ paintOrder: 'stroke' }} stroke="#0d111788" strokeWidth={3}>
          {label}
        </text>
      )}
    </g>
  )
}

function FlowLine({ x1, y1, x2, y2, color, width, label, labelOffset = -6, labelAnchor = 'middle' }: {
  x1: number; y1: number; x2: number; y2: number
  color: string; width: number; label: string
  labelOffset?: number
  labelAnchor?: 'start' | 'middle' | 'end'
}) {
  const mx = (x1 + x2) / 2
  const my = (y1 + y2) / 2
  return (
    <g>
      <line x1={x1} y1={y1} x2={x2} y2={y2}
        stroke={color} strokeWidth={width} strokeLinecap="round"
        markerEnd="url(#oil-arrow)" opacity={0.85} />
      {label && (
        <text x={mx} y={my + labelOffset} textAnchor={labelAnchor}
          fill="#ffffffcc" fontSize={10} fontFamily="monospace" fontWeight={600}
          style={{ paintOrder: 'stroke' }} stroke="#0d111788" strokeWidth={3}>
          {label}
        </text>
      )}
    </g>
  )
}

function InputArrow({ labelX, y, x1, x2, color, label, value, width }: {
  labelX: number; y: number; x1: number; x2: number
  color: string; label: string; value: number; width: number
}) {
  return (
    <g>
      <text x={labelX - 8} y={y} textAnchor="end" fill={color} fontSize={11}
        dominantBaseline="middle" fontWeight={600}>
        {label}
      </text>
      <line x1={x1} y1={y} x2={x2} y2={y}
        stroke={color} strokeWidth={width} strokeLinecap="round"
        markerEnd="url(#oil-arrow)" opacity={0.85} />
      <text x={(x1 + x2) / 2} y={y - 6} textAnchor="middle"
        fill="#ffffffcc" fontSize={10} fontFamily="monospace" fontWeight={600}
        style={{ paintOrder: 'stroke' }} stroke="#0d111788" strokeWidth={3}>
        {value.toFixed(1)}
      </text>
    </g>
  )
}

function WaterInput({ x, y, value, width, label, fromBelow = false }: {
  x: number; y: number; value: number; width: number; label: string; fromBelow?: boolean
}) {
  const len = 34
  const y1 = fromBelow ? y + len : y - len
  const y2 = y
  const textY = fromBelow ? y + len + 12 : y - len - 5
  return (
    <g>
      <text x={x} y={textY} textAnchor="middle" fill="#42a5f5" fontSize={9}
        fontFamily="monospace" fontWeight={600}>
        {label}: {value.toFixed(1)}
      </text>
      <line x1={x} y1={y1} x2={x} y2={y2}
        stroke="#42a5f5" strokeWidth={Math.max(1.5, width * 0.7)} strokeLinecap="round"
        markerEnd="url(#oil-arrow)" opacity={0.7} />
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
