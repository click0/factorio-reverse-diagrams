import { useState, useRef, useMemo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import dagre from 'dagre'
import { ITEMS, RECIPES, CATEGORY_COLORS, type RecipeItem } from './recipeData'

interface NodePos { id: string; x: number; y: number; item: RecipeItem }
interface EdgePos { from: string; to: string; x1: number; y1: number; x2: number; y2: number; amount: number }

const NODE_W = 120
const NODE_H = 32

function buildGraph(filter: string, translate: (key: string) => string) {
  const g = new dagre.graphlib.Graph()
  g.setGraph({ rankdir: 'LR', ranksep: 80, nodesep: 20 })
  g.setDefaultEdgeLabel(() => ({}))

  const itemMap = new Map(ITEMS.map(it => [it.id, it]))
  const usedItems = new Set<string>()

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
  const qUp = [itemId]
  while (qUp.length) {
    const cur = qUp.pop()!
    for (const r of RECIPES) {
      if (r.output === cur) {
        for (const inp of r.inputs) {
          if (!connected.has(inp.id)) { connected.add(inp.id); qUp.push(inp.id) }
        }
      }
    }
  }
  const qDown = [itemId]
  while (qDown.length) {
    const cur = qDown.pop()!
    for (const r of RECIPES) {
      if (r.inputs.some(inp => inp.id === cur)) {
        if (!connected.has(r.output)) { connected.add(r.output); qDown.push(r.output) }
      }
    }
  }
  return connected
}

/** Find critical path: longest chain from any raw resource to target */
function getCriticalPath(targetId: string): Set<string> {
  const recipeMap = new Map<string, typeof RECIPES[0]>()
  for (const r of RECIPES) recipeMap.set(r.output, r)

  const rawIds = new Set(ITEMS.filter(it => it.category === 'raw').map(it => it.id))

  // BFS backwards from target, tracking depth
  const depths = new Map<string, number>()
  const parents = new Map<string, string>()
  const queue: { id: string; depth: number }[] = [{ id: targetId, depth: 0 }]
  depths.set(targetId, 0)

  while (queue.length) {
    const { id, depth } = queue.shift()!
    const recipe = recipeMap.get(id)
    if (!recipe) continue
    for (const inp of recipe.inputs) {
      const newDepth = depth + 1
      if (!depths.has(inp.id) || depths.get(inp.id)! < newDepth) {
        depths.set(inp.id, newDepth)
        parents.set(inp.id, id)
        queue.push({ id: inp.id, depth: newDepth })
      }
    }
  }

  // Find deepest raw resource
  let maxDepth = 0
  let deepestRaw = ''
  for (const [id, depth] of depths) {
    if (rawIds.has(id) && depth > maxDepth) { maxDepth = depth; deepestRaw = id }
  }

  if (!deepestRaw) return new Set()

  // Trace path from deepest raw to target
  const path = new Set<string>()
  let cur = deepestRaw
  path.add(cur)
  while (parents.has(cur)) {
    cur = parents.get(cur)!
    path.add(cur)
  }
  return path
}

export default function RecipeDAG() {
  const { t } = useTranslation()
  const containerRef = useRef<HTMLDivElement>(null)
  const [filter, setFilter] = useState('')
  const [highlighted, setHighlighted] = useState<string | null>(null)
  const [showCritical, setShowCritical] = useState(false)
  const [rate, setRate] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(0.85)
  const dragging = useRef(false)
  const lastMouse = useRef({ x: 0, y: 0 })

  const graph = useMemo(() => buildGraph(filter, t), [filter, t])
  const connectedSet = useMemo(() => highlighted ? getUpstreamDownstream(highlighted) : null, [highlighted])
  const criticalPath = useMemo(() => {
    if (!showCritical) return null
    // Critical path to rocket-part (or highlighted item)
    const target = highlighted || 'rocket-part'
    return getCriticalPath(target)
  }, [showCritical, highlighted])

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
          <label>{t('recipe.rate')}:</label>
          <input type="range" min={0.1} max={10} step={0.1} value={rate} onChange={(e) => setRate(Number(e.target.value))} />
          <span style={{ fontSize: 12, color: 'var(--text-muted)', minWidth: 55 }}>{rate.toFixed(1)}{t('recipe.perMin')}</span>
        </div>
        <div className="control-group">
          <label>
            <input type="checkbox" checked={showCritical} onChange={(e) => setShowCritical(e.target.checked)} />
            {' '}{t('recipe.criticalPath')}
          </label>
        </div>
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
            <marker id="dag-arrow-crit" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
              <polygon points="0 0, 8 3, 0 6" fill="#e9a820" />
            </marker>
          </defs>

          {/* Edges */}
          {graph.edges.map((e, i) => {
            const dim = connectedSet && (!connectedSet.has(e.from) || !connectedSet.has(e.to))
            const isCrit = criticalPath && criticalPath.has(e.from) && criticalPath.has(e.to)
            const thickness = Math.max(1, Math.min(6, e.amount * rate * 0.4))
            return (
              <line key={i} x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2}
                stroke={isCrit ? '#e9a820' : dim ? '#ffffff08' : '#ffffff25'}
                strokeWidth={isCrit ? Math.max(2.5, thickness) : thickness}
                markerEnd={isCrit ? 'url(#dag-arrow-crit)' : 'url(#dag-arrow)'} />
            )
          })}

          {/* Nodes */}
          {graph.nodes.map(n => {
            const color = CATEGORY_COLORS[n.item.category] || '#888'
            const dim = connectedSet && !connectedSet.has(n.id)
            const isHL = highlighted === n.id
            const isCrit = criticalPath && criticalPath.has(n.id)
            return (
              <g key={n.id} onClick={() => setHighlighted(highlighted === n.id ? null : n.id)}
                style={{ cursor: 'pointer', opacity: dim ? 0.12 : 1 }}>
                <rect x={n.x - NODE_W / 2} y={n.y - NODE_H / 2} width={NODE_W} height={NODE_H} rx={4}
                  fill={isCrit ? '#e9a82020' : color + '25'}
                  stroke={isHL ? '#ffffff' : isCrit ? '#e9a820' : color}
                  strokeWidth={isHL ? 2 : isCrit ? 2 : 1} />
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
