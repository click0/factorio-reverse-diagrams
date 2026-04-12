import { useState, useRef, useMemo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import dagre from 'dagre'
import { ITEMS, RECIPES, CATEGORY_COLORS, type RecipeItem } from './recipeData'

interface NodePos { id: string; x: number; y: number; item: RecipeItem }
interface EdgePos { from: string; to: string; x1: number; y1: number; x2: number; y2: number; amount: number }

const NODE_W = 120
const NODE_H = 32

function buildGraph(filter: string, highlighted: string | null, translate: (key: string) => string) {
  const g = new dagre.graphlib.Graph()
  g.setGraph({ rankdir: 'LR', ranksep: 80, nodesep: 20 })
  g.setDefaultEdgeLabel(() => ({}))

  const itemMap = new Map(ITEMS.map(it => [it.id, it]))
  const usedItems = new Set<string>()

  // Find which items to show
  for (const r of RECIPES) {
    usedItems.add(r.output)
    for (const inp of r.inputs) usedItems.add(inp.id)
  }

  const lowerFilter = filter.toLowerCase()
  const visibleItems = ITEMS.filter(it =>
    usedItems.has(it.id) && (filter === '' || it.name.toLowerCase().includes(lowerFilter) || it.id.includes(lowerFilter) || translate(`item.${it.id}`).toLowerCase().includes(lowerFilter))
  )

  const visibleIds = new Set(visibleItems.map(it => it.id))

  for (const it of visibleItems) {
    g.setNode(it.id, { width: NODE_W, height: NODE_H })
  }

  const edges: { from: string; to: string; amount: number }[] = []
  for (const r of RECIPES) {
    if (!visibleIds.has(r.output)) continue
    for (const inp of r.inputs) {
      if (!visibleIds.has(inp.id)) continue
      g.setEdge(inp.id, r.output)
      edges.push({ from: inp.id, to: r.output, amount: inp.amount })
    }
  }

  dagre.layout(g)

  const nodes: NodePos[] = []
  for (const id of g.nodes()) {
    const n = g.node(id)
    const item = itemMap.get(id)
    if (n && item) nodes.push({ id, x: n.x, y: n.y, item })
  }

  const edgePositions: EdgePos[] = []
  for (const e of edges) {
    const fn = g.node(e.from)
    const tn = g.node(e.to)
    if (fn && tn) {
      edgePositions.push({ from: e.from, to: e.to, x1: fn.x + NODE_W / 2, y1: fn.y, x2: tn.x - NODE_W / 2, y2: tn.y, amount: e.amount })
    }
  }

  const graphInfo = g.graph()
  const width = (graphInfo?.width ?? 800) + 100
  const height = (graphInfo?.height ?? 600) + 100

  return { nodes, edges: edgePositions, width, height }
}

function getUpstreamDownstream(itemId: string): Set<string> {
  const connected = new Set<string>()
  connected.add(itemId)

  // Upstream (ingredients of ingredients)
  const qUp = [itemId]
  while (qUp.length) {
    const cur = qUp.pop()!
    for (const r of RECIPES) {
      if (r.output === cur) {
        for (const inp of r.inputs) {
          if (!connected.has(inp.id)) {
            connected.add(inp.id)
            qUp.push(inp.id)
          }
        }
      }
    }
  }

  // Downstream (products that use this)
  const qDown = [itemId]
  while (qDown.length) {
    const cur = qDown.pop()!
    for (const r of RECIPES) {
      if (r.inputs.some(inp => inp.id === cur)) {
        if (!connected.has(r.output)) {
          connected.add(r.output)
          qDown.push(r.output)
        }
      }
    }
  }

  return connected
}

export default function RecipeDAG() {
  const { t } = useTranslation()
  const containerRef = useRef<HTMLDivElement>(null)
  const [filter, setFilter] = useState('')
  const [highlighted, setHighlighted] = useState<string | null>(null)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(0.85)
  const dragging = useRef(false)
  const lastMouse = useRef({ x: 0, y: 0 })

  const graph = useMemo(() => buildGraph(filter, highlighted, t), [filter, highlighted, t])
  const connectedSet = useMemo(() => highlighted ? getUpstreamDownstream(highlighted) : null, [highlighted])

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    setZoom(z => Math.max(0.2, Math.min(2, z - e.deltaY * 0.001)))
  }, [])

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) { dragging.current = true; lastMouse.current = { x: e.clientX, y: e.clientY } }
  }
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging.current) return
    setPan(p => ({ x: p.x + e.clientX - lastMouse.current.x, y: p.y + e.clientY - lastMouse.current.y }))
    lastMouse.current = { x: e.clientX, y: e.clientY }
  }
  const handleMouseUp = () => { dragging.current = false }

  return (
    <div>
      <div className="controls-row">
        <div className="control-group">
          <label>{t('recipe.search')}:</label>
          <input type="text" value={filter} onChange={(e) => { setFilter(e.target.value); setHighlighted(null) }}
            placeholder={t('recipe.filterPlaceholder')} style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 4, padding: '4px 8px', fontSize: 13, width: 180 }} />
        </div>
        {highlighted && (
          <button className="btn" onClick={() => setHighlighted(null)}>{t('recipe.clearHighlight')}</button>
        )}
        <div className="control-group">
          <label>{t('recipe.zoom')}:</label>
          <input type="range" min={0.2} max={2} step={0.05} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} />
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{Math.round(zoom * 100)}%</span>
        </div>
      </div>

      {/* Legend */}
      <div className="controls-row" style={{ gap: 8 }}>
        {Object.entries(CATEGORY_COLORS).map(([cat, color]) => (
          <span key={cat} style={{ fontSize: 11, color, display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: color, display: 'inline-block' }} />
            {t(`recipe.cat.${cat}`)}
          </span>
        ))}
      </div>

      <div ref={containerRef} style={{ overflow: 'hidden', borderRadius: 4, background: '#0d1117', height: 500, cursor: dragging.current ? 'grabbing' : 'grab', position: 'relative' }}
        onWheel={handleWheel} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
        <svg width={graph.width} height={graph.height}
          style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: '0 0' }}>
          <defs>
            <marker id="dag-arrow" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
              <polygon points="0 0, 8 3, 0 6" fill="#ffffff50" />
            </marker>
          </defs>

          {/* Edges */}
          {graph.edges.map((e, i) => {
            const dim = connectedSet && (!connectedSet.has(e.from) || !connectedSet.has(e.to))
            return (
              <line key={i} x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2}
                stroke={dim ? '#ffffff08' : '#ffffff25'} strokeWidth={Math.max(1, Math.min(4, e.amount * 0.5))}
                markerEnd="url(#dag-arrow)" />
            )
          })}

          {/* Nodes */}
          {graph.nodes.map(n => {
            const color = CATEGORY_COLORS[n.item.category] || '#888'
            const dim = connectedSet && !connectedSet.has(n.id)
            const isHL = highlighted === n.id
            return (
              <g key={n.id} onClick={() => setHighlighted(highlighted === n.id ? null : n.id)}
                style={{ cursor: 'pointer', opacity: dim ? 0.12 : 1 }}>
                <rect x={n.x - NODE_W / 2} y={n.y - NODE_H / 2} width={NODE_W} height={NODE_H} rx={4}
                  fill={color + '25'} stroke={isHL ? '#ffffff' : color} strokeWidth={isHL ? 2 : 1} />
                <text x={n.x} y={n.y + 1} textAnchor="middle" dominantBaseline="middle"
                  fill={dim ? '#ffffff30' : '#ffffffcc'} fontSize={10} fontFamily="sans-serif">
                  {t(`item.${n.id}`)}
                </text>
              </g>
            )
          })}
        </svg>
      </div>
    </div>
  )
}
