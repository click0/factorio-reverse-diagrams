import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'

// Space platform mechanics (Space Age DLC)
interface PlatformConfig {
  width: number    // tiles wide (affects drag)
  thrusters: number
  speed: number    // tiles/tick effective
  weight: number
}

interface Route {
  id: string
  distance: number // arbitrary units representing travel time in minutes
  asteroidRate: number // asteroids per minute
}

const ROUTES: Route[] = [
  { id: 'nauvis-vulcanus', distance: 12, asteroidRate: 3 },
  { id: 'nauvis-fulgora', distance: 18, asteroidRate: 5 },
  { id: 'nauvis-gleba', distance: 15, asteroidRate: 4 },
  { id: 'nauvis-aquilo', distance: 30, asteroidRate: 8 },
  { id: 'vulcanus-fulgora', distance: 20, asteroidRate: 6 },
  { id: 'gleba-aquilo', distance: 22, asteroidRate: 7 },
]

const THRUSTER_FORCE = 50 // force per thruster
const DRAG_PER_TILE = 2  // drag per tile of width
const BASE_WEIGHT = 100

function calcPlatform(thrusters: number, width: number): PlatformConfig {
  const weight = BASE_WEIGHT + width * DRAG_PER_TILE * 5
  const force = thrusters * THRUSTER_FORCE
  const speed = Math.max(0.1, (force - width * DRAG_PER_TILE) / weight)
  return { width, thrusters, speed, weight }
}

const SVG_W = 700
const SVG_H = 320

export default function SpacePlatform() {
  const { t } = useTranslation()
  const [thrusters, setThrusters] = useState(8)
  const [width, setWidth] = useState(10)
  const [selectedRoute, setSelectedRoute] = useState(0)

  const platform = useMemo(() => calcPlatform(thrusters, width), [thrusters, width])
  const route = ROUTES[selectedRoute]
  const travelTime = route.distance / platform.speed
  const totalAsteroids = Math.ceil(travelTime * route.asteroidRate)
  const fuelPerMinute = thrusters * 2 // simplified: 2 fuel/min per thruster
  const totalFuel = Math.ceil(travelTime * fuelPerMinute)

  // Planet positions for visualization
  const planets = [
    { id: 'nauvis', x: SVG_W / 2, y: SVG_H / 2, r: 20, color: '#4caf50' },
    { id: 'vulcanus', x: 100, y: 80, r: 16, color: '#ff5722' },
    { id: 'fulgora', x: SVG_W - 100, y: 80, r: 16, color: '#2196f3' },
    { id: 'gleba', x: 100, y: SVG_H - 80, r: 16, color: '#8bc34a' },
    { id: 'aquilo', x: SVG_W - 100, y: SVG_H - 80, r: 16, color: '#00bcd4' },
  ]

  const routePlanets = route.id.split('-')
  const fromPlanet = planets.find(p => p.id === routePlanets[0])!
  const toPlanet = planets.find(p => p.id === routePlanets[1])!

  return (
    <div>
      <div className="controls-row">
        <div className="control-group">
          <label>{t('space.thrusters')}:</label>
          <input type="range" min={1} max={30} value={thrusters}
            onChange={(e) => setThrusters(Number(e.target.value))} />
          <span style={{ fontSize: 13, color: 'var(--text-secondary)', minWidth: 25 }}>{thrusters}</span>
        </div>
        <div className="control-group">
          <label>{t('space.width')}:</label>
          <input type="range" min={4} max={30} value={width}
            onChange={(e) => setWidth(Number(e.target.value))} />
          <span style={{ fontSize: 13, color: 'var(--text-secondary)', minWidth: 25 }}>{width}</span>
        </div>
      </div>
      <div className="controls-row">
        <div className="control-group">
          <label>{t('space.route')}:</label>
          <select value={selectedRoute} onChange={(e) => setSelectedRoute(Number(e.target.value))}
            style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 4, padding: '4px 8px', fontSize: 13 }}>
            {ROUTES.map((r, i) => (
              <option key={i} value={i}>{t(`space.route.${r.id}`)}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Solar system map */}
      <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} style={{ width: '100%', maxWidth: SVG_W, background: '#0d1117', borderRadius: 4, marginTop: 8 }}>
        {/* Stars background */}
        {Array.from({ length: 40 }, (_, i) => (
          <circle key={i} cx={(i * 97 + 13) % SVG_W} cy={(i * 71 + 29) % SVG_H} r={0.8}
            fill="#ffffff" opacity={0.1 + (i % 3) * 0.1} />
        ))}

        {/* Route line */}
        <line x1={fromPlanet.x} y1={fromPlanet.y} x2={toPlanet.x} y2={toPlanet.y}
          stroke="#e9a820" strokeWidth={2} strokeDasharray="8,4" opacity={0.6} />

        {/* Asteroid indicators along route */}
        {Array.from({ length: Math.min(totalAsteroids, 15) }, (_, i) => {
          const frac = (i + 1) / (Math.min(totalAsteroids, 15) + 1)
          const ax = fromPlanet.x + (toPlanet.x - fromPlanet.x) * frac + (Math.sin(i * 3) * 15)
          const ay = fromPlanet.y + (toPlanet.y - fromPlanet.y) * frac + (Math.cos(i * 5) * 12)
          return <circle key={i} cx={ax} cy={ay} r={2.5} fill="#888" opacity={0.5} />
        })}

        {/* Platform icon (moving along route) */}
        <rect x={fromPlanet.x + (toPlanet.x - fromPlanet.x) * 0.4 - 8}
          y={fromPlanet.y + (toPlanet.y - fromPlanet.y) * 0.4 - 5}
          width={16} height={10} rx={2}
          fill="#e9a82060" stroke="#e9a820" strokeWidth={1} />

        {/* Planets */}
        {planets.map(p => (
          <g key={p.id}>
            <circle cx={p.x} cy={p.y} r={p.r}
              fill={p.color + '30'} stroke={p.color} strokeWidth={1.5} />
            <text x={p.x} y={p.y + p.r + 14} textAnchor="middle"
              fill={p.color} fontSize={10} fontWeight="bold">
              {t(`space.planet.${p.id}`)}
            </text>
          </g>
        ))}

        {/* Route label */}
        <text x={(fromPlanet.x + toPlanet.x) / 2} y={(fromPlanet.y + toPlanet.y) / 2 - 12}
          textAnchor="middle" fill="#e9a820cc" fontSize={10}>
          {travelTime.toFixed(1)} {t('space.minutes')}
        </text>
      </svg>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10, marginTop: 12 }}>
        <Stat label={t('space.speed')} value={`${platform.speed.toFixed(2)}`} />
        <Stat label={t('space.travelTime')} value={`${travelTime.toFixed(1)} min`} />
        <Stat label={t('space.asteroids')} value={`${totalAsteroids}`} color="#888" />
        <Stat label={t('space.fuel')} value={`${totalFuel}`} color="#ff9800" />
        <Stat label={t('space.drag')} value={`${width * DRAG_PER_TILE}`} />
        <Stat label={t('space.force')} value={`${thrusters * THRUSTER_FORCE}`} color="#4caf50" />
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
