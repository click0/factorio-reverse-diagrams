import { useState, useRef, useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'

interface ModuleType {
  id: string
  speedBonus: number
  prodBonus: number
  pollutionBonus: number
  color: string
}

const MODULES: ModuleType[] = [
  { id: 'speed1', speedBonus: 0.2, prodBonus: 0, pollutionBonus: 0.5, color: '#4080e0' },
  { id: 'speed2', speedBonus: 0.3, prodBonus: 0, pollutionBonus: 0.6, color: '#2060c0' },
  { id: 'speed3', speedBonus: 0.5, prodBonus: 0, pollutionBonus: 0.7, color: '#1040a0' },
  { id: 'prod1', speedBonus: -0.05, prodBonus: 0.04, pollutionBonus: 0.5, color: '#c04040' },
  { id: 'prod2', speedBonus: -0.10, prodBonus: 0.06, pollutionBonus: 0.6, color: '#a02020' },
  { id: 'prod3', speedBonus: -0.15, prodBonus: 0.10, pollutionBonus: 0.7, color: '#801010' },
]

const BEACON_DISTRIBUTION = 0.5 // beacons apply 50% of module effect
const BEACON_RANGE = 3 // tiles
const GRID_SIZE = 13
const CELL = 34

export default function BeaconLayout() {
  const { t } = useTranslation()
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const [machineModIdx, setMachineModIdx] = useState(5) // prod3 in machine
  const [beaconModIdx, setBeaconModIdx] = useState(2) // speed3 in beacons
  const [machineModSlots, setMachineModSlots] = useState(4)
  const [beaconModSlots, setBeaconModSlots] = useState(2)

  // Grid: 0 = empty, 1 = machine, 2 = beacon
  const [grid, setGrid] = useState<number[]>(() => {
    const g = new Array(GRID_SIZE * GRID_SIZE).fill(0)
    // Default: 1 machine in center, 8 beacons around
    const cx = Math.floor(GRID_SIZE / 2)
    const cy = Math.floor(GRID_SIZE / 2)
    g[cy * GRID_SIZE + cx] = 1
    for (let dy = -2; dy <= 2; dy += 2) {
      for (let dx = -2; dx <= 2; dx += 2) {
        if (dx === 0 && dy === 0) continue
        g[(cy + dy) * GRID_SIZE + (cx + dx)] = 2
      }
    }
    return g
  })

  const [tool, setTool] = useState<0 | 1 | 2>(1) // placing machine

  // Calculate effects
  const machinePositions = grid.reduce<number[]>((acc, v, i) => { if (v === 1) acc.push(i); return acc }, [])
  const beaconPositions = grid.reduce<number[]>((acc, v, i) => { if (v === 2) acc.push(i); return acc }, [])

  const machineMod = MODULES[machineModIdx]
  const beaconMod = MODULES[beaconModIdx]

  // Count beacons affecting each machine
  const beaconsPerMachine = machinePositions.map(mi => {
    const mx = mi % GRID_SIZE
    const my = Math.floor(mi / GRID_SIZE)
    return beaconPositions.filter(bi => {
      const bx = bi % GRID_SIZE
      const by = Math.floor(bi / GRID_SIZE)
      return Math.abs(mx - bx) <= BEACON_RANGE && Math.abs(my - by) <= BEACON_RANGE
    }).length
  })

  const avgBeacons = beaconsPerMachine.length > 0 ? beaconsPerMachine.reduce((a, b) => a + b, 0) / beaconsPerMachine.length : 0

  const machineSpeedBonus = machineMod.speedBonus * machineModSlots
  const beaconSpeedBonus = beaconMod.speedBonus * beaconModSlots * BEACON_DISTRIBUTION * avgBeacons
  const totalSpeed = 1 + machineSpeedBonus + beaconSpeedBonus

  const machineProdBonus = machineMod.prodBonus * machineModSlots
  const beaconProdBonus = beaconMod.prodBonus * beaconModSlots * BEACON_DISTRIBUTION * avgBeacons
  const totalProd = 1 + machineProdBonus + beaconProdBonus

  const effectiveThroughput = totalSpeed * totalProd

  // Draw
  const draw = useCallback((ctx: CanvasRenderingContext2D) => {
    const w = ctx.canvas.width
    const h = ctx.canvas.height
    ctx.fillStyle = '#0d1117'
    ctx.fillRect(0, 0, w, h)

    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        const i = r * GRID_SIZE + c
        const x = c * CELL
        const y = r * CELL
        const v = grid[i]

        ctx.strokeStyle = '#ffffff10'
        ctx.lineWidth = 0.5
        ctx.strokeRect(x, y, CELL, CELL)

        if (v === 1) {
          // Machine
          ctx.fillStyle = machineMod.color + '50'
          ctx.fillRect(x + 2, y + 2, CELL - 4, CELL - 4)
          ctx.strokeStyle = machineMod.color
          ctx.lineWidth = 1.5
          ctx.strokeRect(x + 2, y + 2, CELL - 4, CELL - 4)
          ctx.fillStyle = '#ffffffcc'
          ctx.font = '9px monospace'
          ctx.textAlign = 'center'
          ctx.fillText('M', x + CELL / 2, y + CELL / 2 + 3)
        } else if (v === 2) {
          // Beacon
          ctx.fillStyle = beaconMod.color + '30'
          ctx.fillRect(x + 2, y + 2, CELL - 4, CELL - 4)
          ctx.strokeStyle = '#e9a82060'
          ctx.lineWidth = 1
          ctx.strokeRect(x + 2, y + 2, CELL - 4, CELL - 4)
          ctx.fillStyle = '#e9a820cc'
          ctx.font = '9px monospace'
          ctx.textAlign = 'center'
          ctx.fillText('B', x + CELL / 2, y + CELL / 2 + 3)

          // Range highlight
          ctx.strokeStyle = '#e9a82015'
          ctx.lineWidth = 0.5
          const rangeX = (c - BEACON_RANGE) * CELL
          const rangeY = (r - BEACON_RANGE) * CELL
          const rangeW = (BEACON_RANGE * 2 + 1) * CELL
          ctx.strokeRect(rangeX, rangeY, rangeW, rangeW)
        }
      }
    }
  }, [grid, machineMod, beaconMod])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (ctx) draw(ctx)
  }, [draw])

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect()
    const scale = (GRID_SIZE * CELL) / rect.width
    const col = Math.floor((e.clientX - rect.left) * scale / CELL)
    const row = Math.floor((e.clientY - rect.top) * scale / CELL)
    if (col < 0 || col >= GRID_SIZE || row < 0 || row >= GRID_SIZE) return
    const idx = row * GRID_SIZE + col
    setGrid(prev => {
      const next = [...prev]
      next[idx] = next[idx] === tool ? 0 : tool
      return next
    })
  }

  return (
    <div>
      <div className="controls-row">
        <div className="control-group">
          <label>{t('beacon.placeTool')}:</label>
          <button className={`btn ${tool === 1 ? 'active' : ''}`} onClick={() => setTool(1)}>{t('beacon.machine')}</button>
          <button className={`btn ${tool === 2 ? 'active' : ''}`} onClick={() => setTool(2)}>{t('beacon.beacon')}</button>
          <button className={`btn ${tool === 0 ? 'active' : ''}`} onClick={() => setTool(0)}>{t('beacon.eraser')}</button>
        </div>
      </div>

      <div className="controls-row">
        <div className="control-group">
          <label>{t('beacon.machineModule')}:</label>
          <select value={machineModIdx} onChange={(e) => setMachineModIdx(Number(e.target.value))}
            style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 4, padding: '4px 8px', fontSize: 13 }}>
            {MODULES.map((m, i) => <option key={i} value={i}>{t(`beacon.mod.${m.id}`)}</option>)}
          </select>
          <label>×</label>
          <select value={machineModSlots} onChange={(e) => setMachineModSlots(Number(e.target.value))}
            style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 4, padding: '4px 8px', fontSize: 13, width: 50 }}>
            {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <div className="control-group">
          <label>{t('beacon.beaconModule')}:</label>
          <select value={beaconModIdx} onChange={(e) => setBeaconModIdx(Number(e.target.value))}
            style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 4, padding: '4px 8px', fontSize: 13 }}>
            {MODULES.map((m, i) => <option key={i} value={i}>{t(`beacon.mod.${m.id}`)}</option>)}
          </select>
          <label>×</label>
          <select value={beaconModSlots} onChange={(e) => setBeaconModSlots(Number(e.target.value))}
            style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 4, padding: '4px 8px', fontSize: 13, width: 50 }}>
            {[1, 2].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16, marginTop: 8, flexWrap: 'wrap' }}>
        <canvas ref={canvasRef} width={GRID_SIZE * CELL} height={GRID_SIZE * CELL}
          onClick={handleClick}
          style={{ display: 'block', borderRadius: 4, cursor: 'crosshair', maxWidth: '100%' }} />

        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Stat label={t('beacon.machines')} value={`${machinePositions.length}`} />
            <Stat label={t('beacon.beacons')} value={`${beaconPositions.length}`} />
            <Stat label={t('beacon.avgBeacons')} value={`${avgBeacons.toFixed(1)}`} />
            <Stat label={t('beacon.speedBonus')} value={`+${((totalSpeed - 1) * 100).toFixed(0)}%`} color="#4080e0" />
            <Stat label={t('beacon.prodBonus')} value={`+${((totalProd - 1) * 100).toFixed(1)}%`} color="#c04040" />
            <Stat label={t('beacon.effectiveThroughput')} value={`×${effectiveThroughput.toFixed(2)}`} color="var(--accent)" />
          </div>
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 12px' }}>
      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{label}</div>
      <div style={{ fontSize: 16, color: color || 'var(--accent)', fontWeight: 700, fontFamily: 'monospace' }}>{value}</div>
    </div>
  )
}
