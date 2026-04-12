import { useState, useRef, useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'

interface Turret {
  id: string
  dps: number
  range: number
  color: string
  dmgType: 'physical' | 'fire' | 'electric' | 'laser'
}

const TURRETS: Turret[] = [
  { id: 'gun-turret', dps: 14, range: 18, color: '#e9a820', dmgType: 'physical' },
  { id: 'laser-turret', dps: 24, range: 24, color: '#e04040', dmgType: 'laser' },
  { id: 'flamethrower', dps: 40, range: 30, color: '#ff5722', dmgType: 'fire' },
  { id: 'artillery', dps: 500, range: 100, color: '#9c27b0', dmgType: 'physical' },
  { id: 'tesla-turret', dps: 30, range: 28, color: '#2196f3', dmgType: 'electric' },
]

interface WallSegment {
  hp: number
  maxHp: number
}

const WALL_HP = 350
const DRAGON_TEETH_SLOW = 0.5 // 50% speed reduction

const CANVAS_SIZE = 400
const CENTER = CANVAS_SIZE / 2
const SCALE = 3 // pixels per tile

export default function DefenseCalculator() {
  const { t } = useTranslation()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [turretCounts, setTurretCounts] = useState<Record<string, number>>({
    'gun-turret': 4, 'laser-turret': 2, 'flamethrower': 1, 'artillery': 0, 'tesla-turret': 0,
  })
  const [wallLayers, setWallLayers] = useState(2)
  const [dragonTeeth, setDragonTeeth] = useState(true)

  const totalDPS = TURRETS.reduce((sum, t) => sum + t.dps * (turretCounts[t.id] || 0), 0)
  const maxRange = Math.max(...TURRETS.filter(t => (turretCounts[t.id] || 0) > 0).map(t => t.range), 0)
  const wallTotalHP = wallLayers * WALL_HP
  const effectiveDPS = dragonTeeth ? totalDPS * 1.5 : totalDPS // more time in kill zone

  // DPS breakdown by type
  const dpsByType = TURRETS.reduce<Record<string, number>>((acc, t) => {
    const count = turretCounts[t.id] || 0
    acc[t.dmgType] = (acc[t.dmgType] || 0) + t.dps * count
    return acc
  }, {})

  const draw = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = '#0d1117'
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)

    // Range circles
    TURRETS.forEach(turret => {
      const count = turretCounts[turret.id] || 0
      if (count === 0) return
      ctx.strokeStyle = turret.color + '30'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.arc(CENTER, CENTER, turret.range * SCALE, 0, Math.PI * 2)
      ctx.stroke()
    })

    // Wall layers
    for (let layer = 0; layer < wallLayers; layer++) {
      const r = 30 + layer * 8
      ctx.strokeStyle = '#8a8a8a80'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.arc(CENTER, CENTER, r * SCALE, 0, Math.PI * 2)
      ctx.stroke()
    }

    // Dragon teeth
    if (dragonTeeth) {
      const teethR = 30 + wallLayers * 8 + 10
      for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 12) {
        const x = CENTER + Math.cos(angle) * teethR * SCALE
        const y = CENTER + Math.sin(angle) * teethR * SCALE
        ctx.fillStyle = '#6a6a6a60'
        ctx.fillRect(x - 2, y - 2, 4, 4)
      }
    }

    // Turret positions (distributed around center)
    let turretAngle = 0
    TURRETS.forEach(turret => {
      const count = turretCounts[turret.id] || 0
      for (let i = 0; i < count; i++) {
        const r = 20 * SCALE
        const angle = turretAngle
        turretAngle += (Math.PI * 2) / Math.max(1, Object.values(turretCounts).reduce((a, b) => a + b, 0))
        const x = CENTER + Math.cos(angle) * r
        const y = CENTER + Math.sin(angle) * r
        ctx.fillStyle = turret.color + '80'
        ctx.fillRect(x - 4, y - 4, 8, 8)
        ctx.strokeStyle = turret.color
        ctx.lineWidth = 1
        ctx.strokeRect(x - 4, y - 4, 8, 8)
      }
    })

    // Center label
    ctx.fillStyle = '#ffffff40'
    ctx.font = '10px monospace'
    ctx.textAlign = 'center'
    ctx.fillText('Factory', CENTER, CENTER + 4)
  }, [turretCounts, wallLayers, dragonTeeth])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (ctx) draw(ctx)
  }, [draw])

  const setCount = (id: string, count: number) => {
    setTurretCounts(prev => ({ ...prev, [id]: Math.max(0, count) }))
  }

  return (
    <div>
      <div className="controls-row" style={{ flexWrap: 'wrap' }}>
        {TURRETS.map(turret => (
          <div key={turret.id} className="control-group">
            <span style={{ color: turret.color, fontSize: 11, minWidth: 90 }}>{t(`defense.${turret.id}`)}</span>
            <button className="btn btn-icon" onClick={() => setCount(turret.id, (turretCounts[turret.id] || 0) - 1)}>−</button>
            <span style={{ fontSize: 13, minWidth: 20, textAlign: 'center' }}>{turretCounts[turret.id] || 0}</span>
            <button className="btn btn-icon" onClick={() => setCount(turret.id, (turretCounts[turret.id] || 0) + 1)}>+</button>
          </div>
        ))}
      </div>
      <div className="controls-row">
        <div className="control-group">
          <label>{t('defense.walls')}:</label>
          <input type="range" min={0} max={5} value={wallLayers} onChange={(e) => setWallLayers(Number(e.target.value))} />
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{wallLayers}</span>
        </div>
        <div className="control-group">
          <label>
            <input type="checkbox" checked={dragonTeeth} onChange={(e) => setDragonTeeth(e.target.checked)} />
            {' '}{t('defense.dragonTeeth')}
          </label>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16, marginTop: 8, flexWrap: 'wrap' }}>
        <canvas ref={canvasRef} width={CANVAS_SIZE} height={CANVAS_SIZE}
          style={{ display: 'block', borderRadius: 4, maxWidth: '100%', flex: '0 0 auto' }} />

        <div style={{ flex: 1, minWidth: 200, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Stat label={t('defense.totalDPS')} value={`${totalDPS.toFixed(0)}`} color="#f44336" />
          <Stat label={t('defense.effectiveDPS')} value={`${effectiveDPS.toFixed(0)}`} color="#e9a820" />
          <Stat label={t('defense.maxRange')} value={`${maxRange} ${t('defense.tiles')}`} />
          <Stat label={t('defense.wallHP')} value={`${wallTotalHP}`} color="#8a8a8a" />
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 12px' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{t('defense.dmgBreakdown')}</div>
            {Object.entries(dpsByType).filter(([, v]) => v > 0).map(([type, dps]) => (
              <div key={type} style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                {t(`defense.dmg.${type}`)}: <span style={{ color: 'var(--accent)', fontFamily: 'monospace' }}>{dps.toFixed(0)}</span> DPS
              </div>
            ))}
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
