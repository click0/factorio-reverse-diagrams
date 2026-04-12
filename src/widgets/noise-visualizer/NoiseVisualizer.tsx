import { useState, useRef, useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'

const GRID = 128
const CELL = 3
const PAD = 4

// Simple 2D value noise (Perlin-like) for terrain visualization
function createPermutation(): number[] {
  const p = Array.from({ length: 256 }, (_, i) => i)
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [p[i], p[j]] = [p[j], p[i]]
  }
  return [...p, ...p]
}

function fade(t: number): number { return t * t * t * (t * (t * 6 - 15) + 10) }
function lerp(a: number, b: number, t: number): number { return a + t * (b - a) }

function grad(hash: number, x: number, y: number): number {
  const h = hash & 3
  const u = h < 2 ? x : y
  const v = h < 2 ? y : x
  return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v)
}

function perlin2D(perm: number[], x: number, y: number): number {
  const X = Math.floor(x) & 255
  const Y = Math.floor(y) & 255
  const xf = x - Math.floor(x)
  const yf = y - Math.floor(y)
  const u = fade(xf)
  const v = fade(yf)

  const aa = perm[perm[X] + Y]
  const ab = perm[perm[X] + Y + 1]
  const ba = perm[perm[X + 1] + Y]
  const bb = perm[perm[X + 1] + Y + 1]

  return lerp(
    lerp(grad(aa, xf, yf), grad(ba, xf - 1, yf), u),
    lerp(grad(ab, xf, yf - 1), grad(bb, xf - 1, yf - 1), u),
    v
  )
}

function octaveNoise(perm: number[], x: number, y: number, octaves: number, frequency: number, lacunarity: number, persistence: number): number {
  let value = 0
  let amp = 1
  let freq = frequency
  let maxAmp = 0

  for (let i = 0; i < octaves; i++) {
    value += perlin2D(perm, x * freq, y * freq) * amp
    maxAmp += amp
    amp *= persistence
    freq *= lacunarity
  }

  return value / maxAmp
}

const TERRAIN_COLORS = [
  { threshold: -0.3, color: [13, 42, 74] },   // deep water
  { threshold: -0.1, color: [20, 60, 100] },   // water
  { threshold: -0.02, color: [50, 120, 50] },   // beach/marsh
  { threshold: 0.15, color: [40, 90, 40] },    // grass
  { threshold: 0.3, color: [30, 70, 30] },     // forest
  { threshold: 0.5, color: [60, 55, 40] },     // dirt
  { threshold: 0.7, color: [80, 70, 55] },     // desert
  { threshold: 1.0, color: [50, 50, 50] },     // rock
]

function getTerrainColor(value: number): [number, number, number] {
  for (const t of TERRAIN_COLORS) {
    if (value <= t.threshold) return t.color as [number, number, number]
  }
  return [50, 50, 50]
}

export default function NoiseVisualizer() {
  const { t } = useTranslation()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [seed, setSeed] = useState(42)
  const [frequency, setFrequency] = useState(0.05)
  const [octaves, setOctaves] = useState(4)
  const [lacunarity, setLacunarity] = useState(2.0)
  const [persistence, setPersistence] = useState(0.5)
  const [showOre, setShowOre] = useState(false)

  const perm = useMemo(() => {
    // Seed-based permutation
    const rng = (s: number) => { s = (s * 16807) % 2147483647; return s }
    let s = seed
    const p = Array.from({ length: 256 }, (_, i) => i)
    for (let i = 255; i > 0; i--) {
      s = rng(s)
      const j = s % (i + 1);
      [p[i], p[j]] = [p[j], p[i]]
    }
    return [...p, ...p]
  }, [seed])

  const draw = useCallback((ctx: CanvasRenderingContext2D) => {
    const imageData = ctx.createImageData(GRID, GRID)

    for (let y = 0; y < GRID; y++) {
      for (let x = 0; x < GRID; x++) {
        const value = octaveNoise(perm, x, y, octaves, frequency, lacunarity, persistence)
        const [r, g, b] = getTerrainColor(value)
        const idx = (y * GRID + x) * 4
        imageData.data[idx] = r
        imageData.data[idx + 1] = g
        imageData.data[idx + 2] = b
        imageData.data[idx + 3] = 255

        // Ore overlay
        if (showOre) {
          const oreNoise = octaveNoise(perm, x + 1000, y + 1000, 2, frequency * 3, 2, 0.5)
          if (oreNoise > 0.35 && value > -0.1) {
            // Iron ore patches
            imageData.data[idx] = 140
            imageData.data[idx + 1] = 160
            imageData.data[idx + 2] = 180
          } else if (oreNoise < -0.35 && value > -0.1) {
            // Copper ore patches
            imageData.data[idx] = 180
            imageData.data[idx + 1] = 110
            imageData.data[idx + 2] = 60
          }
        }
      }
    }

    // Draw scaled
    const offscreen = new OffscreenCanvas(GRID, GRID)
    const offCtx = offscreen.getContext('2d')!
    offCtx.putImageData(imageData, 0, 0)

    ctx.imageSmoothingEnabled = false
    ctx.drawImage(offscreen, PAD, PAD, GRID * CELL, GRID * CELL)

    // Border
    ctx.strokeStyle = '#ffffff15'
    ctx.strokeRect(PAD, PAD, GRID * CELL, GRID * CELL)
  }, [perm, frequency, octaves, lacunarity, persistence, showOre])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = '#0d1117'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    draw(ctx)
  }, [draw])

  const cW = GRID * CELL + PAD * 2
  const cH = GRID * CELL + PAD * 2

  return (
    <div>
      <div className="controls-row">
        <div className="control-group">
          <label>{t('noise.seed')}:</label>
          <input type="range" min={1} max={999} value={seed} onChange={(e) => setSeed(Number(e.target.value))} />
          <span style={{ fontSize: 13, color: 'var(--text-secondary)', minWidth: 30 }}>{seed}</span>
        </div>
        <div className="control-group">
          <label>{t('noise.frequency')}:</label>
          <input type="range" min={0.01} max={0.2} step={0.005} value={frequency}
            onChange={(e) => setFrequency(Number(e.target.value))} />
          <span style={{ fontSize: 13, color: 'var(--text-secondary)', minWidth: 40 }}>{frequency.toFixed(3)}</span>
        </div>
      </div>
      <div className="controls-row">
        <div className="control-group">
          <label>{t('noise.octaves')}:</label>
          {[1, 2, 3, 4, 6, 8].map(n => (
            <button key={n} className={`btn ${octaves === n ? 'active' : ''}`}
              onClick={() => setOctaves(n)}>{n}</button>
          ))}
        </div>
        <div className="control-group">
          <label>{t('noise.persistence')}:</label>
          <input type="range" min={0.1} max={0.9} step={0.05} value={persistence}
            onChange={(e) => setPersistence(Number(e.target.value))} />
          <span style={{ fontSize: 13, color: 'var(--text-secondary)', minWidth: 30 }}>{persistence.toFixed(2)}</span>
        </div>
        <div className="control-group">
          <label>
            <input type="checkbox" checked={showOre} onChange={(e) => setShowOre(e.target.checked)} />
            {' '}{t('noise.showOre')}
          </label>
        </div>
      </div>

      <div style={{ overflowX: 'auto', marginTop: 8 }}>
        <canvas ref={canvasRef} width={cW} height={cH}
          style={{ display: 'block', borderRadius: 4, imageRendering: 'pixelated', maxWidth: '100%' }} />
      </div>

      {/* Terrain legend */}
      <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
        {[
          { label: t('noise.deepWater'), color: 'rgb(13,42,74)' },
          { label: t('noise.water'), color: 'rgb(20,60,100)' },
          { label: t('noise.grass'), color: 'rgb(40,90,40)' },
          { label: t('noise.forest'), color: 'rgb(30,70,30)' },
          { label: t('noise.desert'), color: 'rgb(80,70,55)' },
          { label: t('noise.rock'), color: 'rgb(50,50,50)' },
        ].map(({ label, color }) => (
          <span key={label} style={{ fontSize: 10, color: '#ffffff80', display: 'flex', alignItems: 'center', gap: 3 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: color, display: 'inline-block', border: '1px solid #ffffff20' }} />
            {label}
          </span>
        ))}
      </div>
    </div>
  )
}

function useMemo<T>(fn: () => T, deps: unknown[]): T {
  const ref = useRef<{ deps: unknown[]; value: T } | null>(null)
  if (!ref.current || !deps.every((d, i) => d === ref.current!.deps[i])) {
    ref.current = { deps, value: fn() }
  }
  return ref.current.value
}
