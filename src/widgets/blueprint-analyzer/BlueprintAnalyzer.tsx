import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'

interface EntityCount {
  name: string
  count: number
}

interface BlueprintStats {
  entities: EntityCount[]
  totalEntities: number
  tiles: { width: number; height: number }
  itemCost: Record<string, number>
  categories: Record<string, number>
}

// Simple blueprint string parser (Factorio blueprint strings are base64-encoded zlib-compressed JSON)
// Since we can't decompress zlib in browser easily without a lib, we'll provide a demo mode
// with a paste-and-analyze UI that parses simplified JSON format
function parseBlueprint(input: string): BlueprintStats | null {
  try {
    // Try parsing as plain JSON (for demo/testing)
    let data: any
    if (input.startsWith('{')) {
      data = JSON.parse(input)
    } else if (input.startsWith('0')) {
      // Factorio blueprint string starts with version byte '0'
      // We can't decode without zlib, show a message
      return null
    } else {
      data = JSON.parse(input)
    }

    const bp = data.blueprint || data
    const entities: any[] = bp.entities || []

    // Count entities
    const countMap = new Map<string, number>()
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity

    for (const ent of entities) {
      const name = ent.name || 'unknown'
      countMap.set(name, (countMap.get(name) || 0) + 1)

      const pos = ent.position || { x: 0, y: 0 }
      minX = Math.min(minX, pos.x)
      maxX = Math.max(maxX, pos.x)
      minY = Math.min(minY, pos.y)
      maxY = Math.max(maxY, pos.y)
    }

    const entityCounts = Array.from(countMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)

    // Categorize
    const categories: Record<string, number> = {}
    for (const [name, count] of countMap) {
      let cat = 'other'
      if (name.includes('belt') || name.includes('splitter') || name.includes('underground')) cat = 'transport'
      else if (name.includes('inserter')) cat = 'logistics'
      else if (name.includes('assembl') || name.includes('furnace') || name.includes('chemical') || name.includes('refinery')) cat = 'production'
      else if (name.includes('pipe') || name.includes('pump')) cat = 'fluid'
      else if (name.includes('pole') || name.includes('solar') || name.includes('accumulator') || name.includes('reactor')) cat = 'power'
      else if (name.includes('turret') || name.includes('wall') || name.includes('gate')) cat = 'defense'
      else if (name.includes('roboport') || name.includes('chest')) cat = 'logistics'
      else if (name.includes('combinator') || name.includes('speaker') || name.includes('lamp')) cat = 'circuit'
      else if (name.includes('rail') || name.includes('train') || name.includes('signal') || name.includes('station')) cat = 'rail'
      categories[cat] = (categories[cat] || 0) + count
    }

    return {
      entities: entityCounts,
      totalEntities: entities.length,
      tiles: {
        width: entities.length > 0 ? Math.ceil(maxX - minX) + 1 : 0,
        height: entities.length > 0 ? Math.ceil(maxY - minY) + 1 : 0,
      },
      itemCost: {}, // simplified
      categories,
    }
  } catch {
    return null
  }
}

// Demo blueprint for testing
const DEMO_BLUEPRINT = JSON.stringify({
  blueprint: {
    entities: [
      ...Array.from({ length: 12 }, (_, i) => ({ name: 'transport-belt', position: { x: i, y: 0 } })),
      ...Array.from({ length: 4 }, (_, i) => ({ name: 'assembling-machine-2', position: { x: i * 4, y: 3 } })),
      ...Array.from({ length: 8 }, (_, i) => ({ name: 'inserter', position: { x: i * 2, y: 2 } })),
      ...Array.from({ length: 8 }, (_, i) => ({ name: 'inserter', position: { x: i * 2, y: 4 } })),
      ...Array.from({ length: 12 }, (_, i) => ({ name: 'transport-belt', position: { x: i, y: 5 } })),
      ...Array.from({ length: 6 }, (_, i) => ({ name: 'medium-electric-pole', position: { x: i * 3, y: 3 } })),
      { name: 'substation', position: { x: 6, y: 3 } },
      ...Array.from({ length: 3 }, (_, i) => ({ name: 'pipe', position: { x: 10 + i, y: 3 } })),
    ],
  },
}, null, 2)

const CATEGORY_COLORS: Record<string, string> = {
  transport: '#e9c73e',
  logistics: '#4080e0',
  production: '#e04040',
  fluid: '#2196f3',
  power: '#ffc107',
  defense: '#f44336',
  circuit: '#4caf50',
  rail: '#9c27b0',
  other: '#8a8a8a',
}

export default function BlueprintAnalyzer() {
  const { t } = useTranslation()
  const [input, setInput] = useState(DEMO_BLUEPRINT)
  const stats = useMemo(() => parseBlueprint(input), [input])

  const totalCat = stats ? Object.values(stats.categories).reduce((a, b) => a + b, 0) : 0

  return (
    <div>
      <div style={{ marginBottom: 8 }}>
        <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
          {t('blueprint.pasteLabel')}
        </label>
        <textarea value={input} onChange={(e) => setInput(e.target.value)}
          rows={4}
          style={{ width: '100%', background: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 4, padding: 8, fontSize: 12, fontFamily: 'monospace', resize: 'vertical' }} />
      </div>

      <div className="controls-row">
        <button className="btn" onClick={() => setInput(DEMO_BLUEPRINT)}>{t('blueprint.loadDemo')}</button>
        <button className="btn" onClick={() => setInput('')}>{t('blueprint.clear')}</button>
      </div>

      {!stats && input.length > 0 && (
        <div style={{ color: '#f44336', fontSize: 13, marginTop: 8 }}>
          {input.startsWith('0')
            ? t('blueprint.zLibNotice')
            : t('blueprint.parseError')}
        </div>
      )}

      {stats && (
        <>
          {/* Overview stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10, marginTop: 12 }}>
            <Stat label={t('blueprint.totalEntities')} value={`${stats.totalEntities}`} />
            <Stat label={t('blueprint.uniqueTypes')} value={`${stats.entities.length}`} />
            <Stat label={t('blueprint.size')} value={`${stats.tiles.width}×${stats.tiles.height}`} />
          </div>

          {/* Category breakdown bar */}
          <h4 style={{ color: 'var(--accent)', marginTop: 16, fontSize: 14 }}>{t('blueprint.categories')}</h4>
          <div style={{ display: 'flex', height: 28, borderRadius: 4, overflow: 'hidden', marginTop: 6 }}>
            {Object.entries(stats.categories).sort(([, a], [, b]) => b - a).map(([cat, count]) => (
              <div key={cat} style={{ flex: count, background: CATEGORY_COLORS[cat] || '#888', display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: count / totalCat > 0.08 ? 0 : 0 }}>
                {count / totalCat > 0.08 && (
                  <span style={{ fontSize: 9, color: '#0d1117', fontWeight: 700 }}>
                    {t(`blueprint.cat.${cat}`)} ({count})
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
            {Object.entries(stats.categories).sort(([, a], [, b]) => b - a).map(([cat, count]) => (
              <span key={cat} style={{ fontSize: 10, color: '#ffffff80', display: 'flex', alignItems: 'center', gap: 3 }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: CATEGORY_COLORS[cat] || '#888', display: 'inline-block' }} />
                {t(`blueprint.cat.${cat}`)} ({count})
              </span>
            ))}
          </div>

          {/* Entity table */}
          <h4 style={{ color: 'var(--accent)', marginTop: 16, fontSize: 14 }}>{t('blueprint.entityList')}</h4>
          <div style={{ maxHeight: 200, overflowY: 'auto', background: '#0d1117', borderRadius: 4, marginTop: 6 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th style={{ textAlign: 'left', padding: '6px 10px', color: 'var(--text-muted)' }}>{t('blueprint.entity')}</th>
                  <th style={{ textAlign: 'right', padding: '6px 10px', color: 'var(--text-muted)' }}>{t('blueprint.count')}</th>
                </tr>
              </thead>
              <tbody>
                {stats.entities.map(ent => (
                  <tr key={ent.name} style={{ borderBottom: '1px solid #ffffff08' }}>
                    <td style={{ padding: '4px 10px', color: 'var(--text-secondary)' }}>{ent.name}</td>
                    <td style={{ padding: '4px 10px', textAlign: 'right', color: 'var(--accent)', fontFamily: 'monospace' }}>{ent.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 6, padding: '10px 14px' }}>
      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{label}</div>
      <div style={{ fontSize: 18, color: 'var(--accent)', fontWeight: 700, fontFamily: 'monospace' }}>{value}</div>
    </div>
  )
}
