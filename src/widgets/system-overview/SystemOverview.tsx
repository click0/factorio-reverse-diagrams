import { useState, useMemo } from 'react'
import { NODES, EDGES, LOOPS } from './systemData'

const W = 820
const H = 420
const NODE_R = 30

export default function SystemOverview() {
  const [activeLoops, setActiveLoops] = useState<Set<string>>(new Set())
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)
  const [selectedNode, setSelectedNode] = useState<string | null>(null)

  const toggleLoop = (loopId: string) => {
    setActiveLoops(prev => {
      const next = new Set(prev)
      if (next.has(loopId)) next.delete(loopId)
      else next.add(loopId)
      return next
    })
  }

  const visibleEdges = useMemo(() => {
    if (activeLoops.size === 0) return EDGES
    return EDGES.filter(e => e.loops.some(l => activeLoops.has(l)))
  }, [activeLoops])

  const visibleNodeIds = useMemo(() => {
    if (activeLoops.size === 0) return new Set(NODES.map(n => n.id))
    const ids = new Set<string>()
    for (const e of visibleEdges) { ids.add(e.from); ids.add(e.to) }
    return ids
  }, [activeLoops, visibleEdges])

  const selectedInfo = NODES.find(n => n.id === selectedNode)

  return (
    <div>
      {/* Loop toggles */}
      <div className="controls-row" style={{ gap: 6 }}>
        <label style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Loops:</label>
        {LOOPS.map(loop => (
          <button key={loop.id}
            className={`btn ${activeLoops.has(loop.id) ? 'active' : ''}`}
            style={activeLoops.has(loop.id) ? { background: loop.color + '30', borderColor: loop.color, color: loop.color } : {}}
            onClick={() => toggleLoop(loop.id)}
            title={loop.description}>
            {loop.name}
          </button>
        ))}
        {activeLoops.size > 0 && (
          <button className="btn" onClick={() => setActiveLoops(new Set())}>Show All</button>
        )}
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', maxWidth: W, background: '#0d1117', borderRadius: 4, marginTop: 8 }}>
        <defs>
          <marker id="sys-arrow-pos" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#ffffff60" />
          </marker>
          <marker id="sys-arrow-neg" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#f4433660" />
          </marker>
        </defs>

        {/* Edges */}
        {visibleEdges.map((e, i) => {
          const from = NODES.find(n => n.id === e.from)!
          const to = NODES.find(n => n.id === e.to)!
          const dx = to.x - from.x
          const dy = to.y - from.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          const nx = dx / dist
          const ny = dy / dist
          const x1 = from.x + nx * (NODE_R + 2)
          const y1 = from.y + ny * (NODE_R + 2)
          const x2 = to.x - nx * (NODE_R + 8)
          const y2 = to.y - ny * (NODE_R + 8)
          // Slight curve
          const mx = (x1 + x2) / 2 + ny * 15
          const my = (y1 + y2) / 2 - nx * 15

          const loopColor = e.loops.length > 0 ? LOOPS.find(l => l.id === e.loops[0])?.color || '#fff' : '#fff'
          const isNeg = e.polarity === '-'

          return (
            <g key={i}>
              <path d={`M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}`}
                fill="none"
                stroke={activeLoops.size > 0 ? loopColor + '80' : '#ffffff30'}
                strokeWidth={e.delay === 'slow' ? 1 : 2}
                strokeDasharray={isNeg ? '6,4' : 'none'}
                markerEnd={isNeg ? 'url(#sys-arrow-neg)' : 'url(#sys-arrow-pos)'} />
              <text x={mx} y={my - 6} textAnchor="middle" fill={isNeg ? '#f4433680' : '#ffffff50'} fontSize={12} fontWeight="bold">
                {e.polarity}
              </text>
            </g>
          )
        })}

        {/* Nodes */}
        {NODES.map(n => {
          const visible = visibleNodeIds.has(n.id)
          const isHovered = hoveredNode === n.id
          const isSelected = selectedNode === n.id
          return (
            <g key={n.id} style={{ cursor: 'pointer', opacity: visible ? 1 : 0.12 }}
              onMouseEnter={() => setHoveredNode(n.id)} onMouseLeave={() => setHoveredNode(null)}
              onClick={() => setSelectedNode(selectedNode === n.id ? null : n.id)}>
              <circle cx={n.x} cy={n.y} r={NODE_R}
                fill={n.partColor + '25'} stroke={isSelected ? '#fff' : n.partColor}
                strokeWidth={isSelected || isHovered ? 2.5 : 1.5} />
              <text x={n.x} y={n.y - 2} textAnchor="middle" dominantBaseline="middle"
                fill={visible ? '#ffffffdd' : '#ffffff30'} fontSize={10} fontWeight="bold" fontFamily="sans-serif">
                {n.label}
              </text>
              <text x={n.x} y={n.y + 12} textAnchor="middle"
                fill={n.partColor + '80'} fontSize={8} fontFamily="monospace">
                Part {n.part}
              </text>
            </g>
          )
        })}
      </svg>

      {/* Info panel */}
      {selectedInfo && (
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 6, padding: 16, marginTop: 12 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: selectedInfo.partColor }} />
            <strong style={{ color: 'var(--accent)' }}>{selectedInfo.label}</strong>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Part {selectedInfo.part}</span>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>{selectedInfo.description}</p>
          <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-muted)' }}>
            Connections: {EDGES.filter(e => e.from === selectedInfo.id || e.to === selectedInfo.id).length}
          </div>
        </div>
      )}

      {/* Loop descriptions */}
      {activeLoops.size > 0 && (
        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {LOOPS.filter(l => activeLoops.has(l.id)).map(l => (
            <div key={l.id} style={{ background: l.color + '10', border: `1px solid ${l.color}30`, borderRadius: 6, padding: '8px 12px' }}>
              <span style={{ color: l.color, fontWeight: 600, fontSize: 13 }}>{l.name}:</span>{' '}
              <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{l.description}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
