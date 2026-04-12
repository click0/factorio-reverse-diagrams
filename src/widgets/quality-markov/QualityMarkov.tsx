import { useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { QUALITY_TIERS, QUALITY_COLORS, QUALITY_MULTIPLIERS, QUALITY_MODULES, type ModuleConfig } from './types'
import { buildTransitionMatrix, expectedIterations, resourceCost } from './markovMath'

const W = 700
const H = 320
const NODE_R = 28
const PAD = 50

export default function QualityMarkov() {
  const { t } = useTranslation()
  const svgRef = useRef<SVGSVGElement>(null)
  const [config, setConfig] = useState<ModuleConfig>({ moduleIdx: 2, moduleCount: 4, useRecycler: false })
  const [targetTier, setTargetTier] = useState(4) // Legendary

  const matrix = buildTransitionMatrix(config)
  const expIter = expectedIterations(config, targetTier)
  const resCost = resourceCost(config, targetTier)

  const nodePositions = QUALITY_TIERS.map((_, i) => ({
    x: PAD + NODE_R + i * ((W - PAD * 2 - NODE_R * 2) / (QUALITY_TIERS.length - 1)),
    y: H / 2,
  }))

  return (
    <div>
      <div className="controls-row">
        <div className="control-group">
          <label>{t('quality.module')}:</label>
          <select value={config.moduleIdx} onChange={(e) => setConfig({ ...config, moduleIdx: Number(e.target.value) })}>
            {QUALITY_MODULES.map((m, i) => <option key={i} value={i}>{m.name} ({m.qualityChance}%)</option>)}
          </select>
        </div>
        <div className="control-group">
          <label>{t('quality.count')}:</label>
          <select value={config.moduleCount} onChange={(e) => setConfig({ ...config, moduleCount: Number(e.target.value) })}>
            {[1, 2, 3, 4].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <div className="control-group">
          <label>{t('quality.target')}:</label>
          <select value={targetTier} onChange={(e) => setTargetTier(Number(e.target.value))}>
            {QUALITY_TIERS.map((tier, i) => i > 0 && <option key={i} value={i}>{tier}</option>)}
          </select>
        </div>
        <div className="control-group">
          <label>
            <input type="checkbox" checked={config.useRecycler}
              onChange={(e) => setConfig({ ...config, useRecycler: e.target.checked })} />
            {' '}{t('quality.recycler')}
          </label>
        </div>
      </div>

      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', maxWidth: W, background: '#0d1117', borderRadius: 4 }}>
        {/* Edges with probability labels */}
        {QUALITY_TIERS.map((_, i) => {
          if (i >= QUALITY_TIERS.length - 1) return null
          const from = nodePositions[i]
          const to = nodePositions[i + 1]
          const p = matrix[i][i + 1]
          const selfP = matrix[i][i]
          return (
            <g key={`edge-${i}`}>
              {/* Forward arrow */}
              <line x1={from.x + NODE_R + 2} y1={from.y} x2={to.x - NODE_R - 8} y2={to.y}
                stroke={QUALITY_COLORS[QUALITY_TIERS[i + 1]]} strokeWidth={Math.max(1, p * 6)} opacity={0.7}
                markerEnd="url(#arrowhead)" />
              <text x={(from.x + to.x) / 2} y={from.y - NODE_R - 8} textAnchor="middle"
                fill="#ffffff90" fontSize={11} fontFamily="monospace">
                {(p * 100).toFixed(1)}%
              </text>
              {/* Self-loop (stay) */}
              <path d={`M ${from.x - 12} ${from.y - NODE_R - 2} A 20 20 0 1 1 ${from.x + 12} ${from.y - NODE_R - 2}`}
                fill="none" stroke="#ffffff30" strokeWidth={1} strokeDasharray="3,3" />
              <text x={from.x} y={from.y - NODE_R - 22} textAnchor="middle"
                fill="#ffffff50" fontSize={9} fontFamily="monospace">
                {(selfP * 100).toFixed(1)}%
              </text>
            </g>
          )
        })}

        {/* Arrowhead marker */}
        <defs>
          <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="#ffffff80" />
          </marker>
        </defs>

        {/* Nodes */}
        {QUALITY_TIERS.map((tier, i) => {
          const pos = nodePositions[i]
          const isTarget = i === targetTier
          return (
            <g key={tier}>
              <circle cx={pos.x} cy={pos.y} r={NODE_R}
                fill={QUALITY_COLORS[tier] + '30'}
                stroke={isTarget ? '#ffffff' : QUALITY_COLORS[tier]}
                strokeWidth={isTarget ? 2.5 : 1.5} />
              <text x={pos.x} y={pos.y + 1} textAnchor="middle" dominantBaseline="middle"
                fill={QUALITY_COLORS[tier]} fontSize={11} fontWeight="bold" fontFamily="sans-serif">
                {tier.slice(0, 3)}
              </text>
              <text x={pos.x} y={pos.y + NODE_R + 16} textAnchor="middle"
                fill="#ffffff60" fontSize={9} fontFamily="monospace">
                x{QUALITY_MULTIPLIERS[tier]}
              </text>
            </g>
          )
        })}
      </svg>

      {/* Calculator results */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginTop: 16 }}>
        <ResultCard label={t('quality.expectedCrafts')} value={isFinite(expIter) ? expIter.toFixed(1) : '∞'} />
        <ResultCard label={t('quality.resourceCost')} value={isFinite(resCost) ? `${resCost.toFixed(1)}x` : '∞'} />
        <ResultCard label={t('quality.chancePerCraft')} value={`${Math.min(100, QUALITY_MODULES[config.moduleIdx].qualityChance * config.moduleCount).toFixed(1)}%`} />
        <ResultCard label={t('quality.statMultiplier')} value={`x${QUALITY_MULTIPLIERS[QUALITY_TIERS[targetTier]]}`} />
      </div>
    </div>
  )
}

function ResultCard({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 6, padding: '12px 16px' }}>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 20, color: 'var(--accent)', fontWeight: 700, fontFamily: 'monospace' }}>{value}</div>
    </div>
  )
}
