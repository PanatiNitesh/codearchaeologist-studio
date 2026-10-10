import React, { useState, useRef, useMemo } from 'react';
import { 
  Network, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Layers, 
  Flame, 
  Sliders,
  Filter,
  Move
} from 'lucide-react';
import { SoftwareGraph, GraphNode, GraphEdge, BlastRadiusResult } from '../api/client';

interface ArchitectureGraphProps {
  graph: SoftwareGraph | null;
  selectedFilePath: string | null;
  onSelectNode: (path: string) => void;
  blastRadius: BlastRadiusResult | null;
}

export const ArchitectureGraph: React.FC<ArchitectureGraphProps> = ({
  graph,
  selectedFilePath,
  onSelectNode,
  blastRadius
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(0.85);
  const [pan, setPan] = useState({ x: -40, y: 10 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  // Position nodes by architectural tiers with balanced symmetric spacing
  const { positionedNodes, tierLabels } = useMemo(() => {
    if (!graph || !graph.nodes) return { positionedNodes: [], tierLabels: [] };

    const nodes = [...graph.nodes];
    const tiers: Record<string, { label: string; nodes: GraphNode[] }> = {
      controller: { label: 'CONTROLLERS & API INGRESS', nodes: [] },
      middleware: { label: 'MIDDLEWARE & INTERCEPTORS', nodes: [] },
      service: { label: 'DOMAIN SERVICES & APPLICATION LOGIC', nodes: [] },
      repository: { label: 'DATA REPOSITORIES & STORAGE', nodes: [] },
      model: { label: 'DATA MODELS & ENTITIES', nodes: [] },
      test: { label: 'TEST SUITES & INTEGRATION SPECS', nodes: [] },
      other: { label: 'COMMON & SHARED INFRASTRUCTURE', nodes: [] }
    };

    nodes.forEach(n => {
      const type = (n.component_type || '').toLowerCase();
      if (type.includes('controller') || type.includes('route') || type.includes('api')) tiers.controller.nodes.push(n);
      else if (type.includes('middleware') || type.includes('guard')) tiers.middleware.nodes.push(n);
      else if (type.includes('service') || type.includes('usecase')) tiers.service.nodes.push(n);
      else if (type.includes('repository') || type.includes('dao')) tiers.repository.nodes.push(n);
      else if (type.includes('model') || type.includes('schema') || type.includes('entity')) tiers.model.nodes.push(n);
      else if (type.includes('test')) tiers.test.nodes.push(n);
      else tiers.other.nodes.push(n);
    });

    const positioned: Array<GraphNode & { x: number; y: number; color: string; tierKey: string }> = [];
    const labels: Array<{ text: string; y: number }> = [];

    const activeTiers = Object.entries(tiers).filter(([_, data]) => data.nodes.length > 0);
    const startY = 80;
    const tierSpacing = 160;
    const CARD_WIDTH = 180;
    const HORIZONTAL_GAP = 90;
    const STEP_X = CARD_WIDTH + HORIZONTAL_GAP; // 270px per node

    activeTiers.forEach(([tKey, data], tIndex) => {
      const currentY = startY + tIndex * tierSpacing;
      labels.push({ text: data.label, y: currentY - 36 });

      const count = data.nodes.length;
      // Center all tier nodes symmetrically around centerX = 600
      const tierWidth = (count - 1) * STEP_X;
      const startX = 600 - tierWidth / 2;

      data.nodes.forEach((node, idx) => {
        let color = '#94a3b8';
        if (tKey === 'controller') color = '#10b981';
        else if (tKey === 'middleware') color = '#ec4899';
        else if (tKey === 'service') color = '#6366f1';
        else if (tKey === 'repository') color = '#f59e0b';
        else if (tKey === 'model') color = '#06b6d4';
        else if (tKey === 'test') color = '#f43f5e';

        positioned.push({
          ...node,
          x: startX + idx * STEP_X,
          y: currentY,
          color,
          tierKey: tKey
        });
      });
    });

    return { positionedNodes: positioned, tierLabels: labels };
  }, [graph]);

  const nodeMap = useMemo(() => {
    const map = new Map<string, typeof positionedNodes[0]>();
    positionedNodes.forEach(n => map.set(n.id, n));
    return map;
  }, [positionedNodes]);

  const directSet = useMemo(() => new Set(blastRadius?.direct_affected_files || []), [blastRadius]);
  const indirectSet = useMemo(() => new Set(blastRadius?.indirect_affected_files || []), [blastRadius]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handleMouseUp = () => setIsDragging(false);

  const resetView = () => {
    setZoom(0.85);
    setPan({ x: -40, y: 10 });
  };

  return (
    <div className="studio-panel relative flex flex-col h-full bg-[var(--bg-surface)]">
      {/* Top Toolbar */}
      <div className="h-9 px-3 border-b border-[var(--border-hairline)] bg-[var(--bg-card)] flex items-center justify-between z-10 select-none">
        <div className="flex items-center gap-2">
          <Network className="w-3.5 h-3.5 text-indigo-600" />
          <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-[var(--text-primary)]">
            Topology Graph
          </span>
          {graph && (
            <span className="text-[10px] font-mono text-[var(--text-muted)]">
              ({graph.stats.total_nodes} nodes • {graph.stats.total_edges} dependencies)
            </span>
          )}
        </div>

        {/* View Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setZoom(z => Math.min(2.0, z + 0.15))}
            className="p-1 rounded hover:bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setZoom(z => Math.max(0.4, z - 0.15))}
            className="p-1 rounded hover:bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <div className="h-3 w-px bg-[var(--border-hairline)] mx-0.5" />
          <button
            onClick={resetView}
            className="p-1 rounded hover:bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
            title="Reset Pan & Zoom"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* SVG Canvas Area */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="flex-1 w-full h-full cursor-grab active:cursor-grabbing overflow-hidden bg-graph-grid relative"
      >
        <svg className="w-full h-full select-none overflow-visible">
          <defs>
            <marker
              id="arrow-default"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#64748b" opacity="0.8" />
            </marker>
            <marker
              id="arrow-import"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#818cf8" />
            </marker>
            <marker
              id="arrow-extends"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6.5"
              markerHeight="6.5"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 9 5 L 0 9 z" fill="#34d399" />
            </marker>
            <marker
              id="arrow-calls"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#fbbf24" />
            </marker>
            <marker
              id="arrow-active"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6.5"
              markerHeight="6.5"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 9 5 L 0 9 z" fill="#6366f1" />
            </marker>
            <marker
              id="arrow-impact"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6.5"
              markerHeight="6.5"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 9 5 L 0 9 z" fill="#f43f5e" />
            </marker>
          </defs>

          {/* Scalable & Pannable Master Viewport */}
          <g
            transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}
            style={{
              transition: isDragging ? 'none' : 'transform 0.08s ease-out'
            }}
          >
            {/* Tier Boundary Guidelines & Floating Badges */}
            {tierLabels.map((lbl, idx) => (
              <g key={`tier-${idx}`}>
                <line
                  x1={-100}
                  y1={lbl.y + 12}
                  x2={1300}
                  y2={lbl.y + 12}
                  stroke="#1c1f2b"
                  strokeWidth={1}
                  strokeDasharray="4 4"
                />
                <rect
                  x={20}
                  y={lbl.y - 4}
                  width={lbl.text.length * 6.5 + 20}
                  height={18}
                  rx={4}
                  fill="#0c0e14"
                  stroke="#222638"
                  strokeWidth={1}
                />
                <text
                  x={30}
                  y={lbl.y + 9}
                  fill="#64748b"
                  fontSize="9.5"
                  fontWeight="600"
                  fontFamily="JetBrains Mono, monospace"
                  letterSpacing="0.8px"
                >
                  {lbl.text}
                </text>
              </g>
            ))}

            {/* Render Precision Curved Bezier Edges with Dedicated Anchor Ports */}
            {graph?.edges.map((edge, i) => {
              const src = nodeMap.get(edge.source);
              const tgt = nodeMap.get(edge.target);
              if (!src || !tgt) return null;

              const isSourceSelected = selectedFilePath === edge.source;
              const isTargetSelected = selectedFilePath === edge.target;
              const isSourceHovered = hoveredNodeId === edge.source;
              const isTargetHovered = hoveredNodeId === edge.target;

              const isImpactEdge = 
                (isTargetSelected && directSet.has(edge.source)) ||
                (directSet.has(edge.target) && indirectSet.has(edge.source));

              const isHighlighted = isSourceSelected || isTargetSelected || isSourceHovered || isTargetHovered;

              // Card boundary dimensions (width=176, height=48)
              const HALF_W = 88;
              const HALF_H = 24;

              let srcX = src.x;
              let srcY = src.y;
              let tgtX = tgt.x;
              let tgtY = tgt.y;
              let pathD = '';

              const dy = tgt.y - src.y;
              const dx = tgt.x - src.x;

              if (dy > 30) {
                // Downward Flow (Caller above, Callee below):
                // Exit bottom port of caller, enter top port of callee
                srcY = src.y + HALF_H;
                tgtY = tgt.y - HALF_H;
                const curveDist = Math.max(45, (tgtY - srcY) * 0.5);
                pathD = `M ${srcX} ${srcY} C ${srcX} ${srcY + curveDist}, ${tgtX} ${tgtY - curveDist}, ${tgtX} ${tgtY}`;
              } else if (dy < -30) {
                // Upward Flow (e.g. Test calling service):
                // Exit top port of caller, enter bottom port of callee
                srcY = src.y - HALF_H;
                tgtY = tgt.y + HALF_H;
                const curveDist = Math.max(45, (srcY - tgtY) * 0.5);
                pathD = `M ${srcX} ${srcY} C ${srcX} ${srcY - curveDist}, ${tgtX} ${tgtY + curveDist}, ${tgtX} ${tgtY}`;
              } else {
                // Same Tier Horizontal Flow:
                // Connect side ports with an upper graceful arch so it never cuts through intermediate cards
                if (dx >= 0) {
                  srcX = src.x + HALF_W;
                  tgtX = tgt.x - HALF_W;
                } else {
                  srcX = src.x - HALF_W;
                  tgtX = tgt.x + HALF_W;
                }
                const arcY = src.y - 45;
                const cpOffset = Math.min(60, Math.max(30, Math.abs(dx) * 0.35));
                const cp1x = srcX + (dx >= 0 ? cpOffset : -cpOffset);
                const cp2x = tgtX + (dx >= 0 ? -cpOffset : cpOffset);
                pathD = `M ${srcX} ${src.y} C ${cp1x} ${arcY}, ${cp2x} ${arcY}, ${tgtX} ${tgt.y}`;
              }

              const rel = (edge.relation || 'IMPORTS').toUpperCase();
              let stroke = '#334155';
              let strokeWidth = 1.2;
              let marker = 'url(#arrow-default)';
              let dashArray: string | undefined = undefined;

              if (rel === 'EXTENDS') {
                stroke = '#34d399';
                strokeWidth = 1.4;
                dashArray = '5 4';
                marker = 'url(#arrow-extends)';
              } else if (rel === 'CALLS') {
                stroke = '#fbbf24';
                strokeWidth = 1.3;
                dashArray = '2 3';
                marker = 'url(#arrow-calls)';
              } else {
                stroke = '#475569';
                strokeWidth = 1.2;
                marker = 'url(#arrow-import)';
              }

              if (isImpactEdge) {
                stroke = '#f43f5e';
                strokeWidth = 2.4;
                dashArray = undefined;
                marker = 'url(#arrow-impact)';
              } else if (isHighlighted) {
                strokeWidth = 2.0;
                if (rel === 'IMPORTS') {
                  stroke = '#818cf8';
                  marker = 'url(#arrow-active)';
                }
              }

              return (
                <g key={`edge-${i}`}>
                  <path
                    d={pathD}
                    fill="none"
                    stroke={stroke}
                    strokeWidth={strokeWidth}
                    strokeDasharray={dashArray}
                    markerEnd={marker}
                    opacity={isImpactEdge || isHighlighted ? 1 : 0.45}
                  />
                </g>
              );
            })}

          {/* Render Precision Node Cards */}
          {positionedNodes.map(node => {
            const isSelected = selectedFilePath === node.id;
            const isDirectImpact = directSet.has(node.id);
            const isIndirectImpact = indirectSet.has(node.id);
            const isHovered = hoveredNodeId === node.id;

            let borderColor = 'rgba(255, 255, 255, 0.1)';
            let bgColor = '#13141b';

            if (isSelected) {
              borderColor = '#6366f1';
              bgColor = '#1a1c28';
            } else if (isDirectImpact) {
              borderColor = '#f43f5e';
              bgColor = '#1e141a';
            } else if (isIndirectImpact) {
              borderColor = '#f59e0b';
              bgColor = '#1e1a14';
            } else if (isHovered) {
              borderColor = 'rgba(255, 255, 255, 0.25)';
              bgColor = '#181a23';
            }

            return (
              <g
                key={node.id}
                transform={`translate(${node.x}, ${node.y})`}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectNode(node.id);
                }}
                onMouseEnter={() => setHoveredNodeId(node.id)}
                onMouseLeave={() => setHoveredNodeId(null)}
                className="cursor-pointer"
              >
                {/* Active Outer Ring */}
                {isSelected && (
                  <rect
                    x={-92}
                    y={-28}
                    width={184}
                    height={56}
                    rx={8}
                    fill="none"
                    stroke="#6366f1"
                    strokeWidth={1}
                    opacity={0.5}
                    strokeDasharray="4 2"
                  />
                )}

                {/* Node Box */}
                <rect
                  x={-88}
                  y={-24}
                  width={176}
                  height={48}
                  rx={6}
                  fill={bgColor}
                  stroke={borderColor}
                  strokeWidth={isSelected || isDirectImpact ? 1.5 : 1}
                  className="transition-colors duration-150"
                />

                {/* Left Accent Color Strip */}
                <rect
                  x={-88}
                  y={-24}
                  width={3}
                  height={48}
                  rx={1}
                  fill={node.color}
                />

                {/* Title */}
                <text
                  x={-74}
                  y={-4}
                  fill={isSelected ? '#ffffff' : '#e5e7eb'}
                  fontSize="11"
                  fontWeight="600"
                  fontFamily="Inter, sans-serif"
                >
                  {node.label.length > 17 ? node.label.slice(0, 16) + '…' : node.label}
                </text>

                {/* Subtitle / Details */}
                <text
                  x={-74}
                  y={13}
                  fill="#9ca3af"
                  fontSize="9.5"
                  fontFamily="JetBrains Mono, monospace"
                >
                  {node.component_type || 'Module'} • {node.loc || 0}L
                </text>

                {/* Impact Indicator Tag */}
                {isDirectImpact && (
                  <g transform="translate(68, -14)">
                    <rect x={-8} y={-8} width={18} height={14} rx={3} fill="#f43f5e" />
                    <text y={3} textAnchor="middle" fill="#fff" fontSize="8" fontWeight="bold" fontFamily="Inter">DIR</text>
                  </g>
                )}
                {isIndirectImpact && (
                  <g transform="translate(68, -14)">
                    <rect x={-8} y={-8} width={18} height={14} rx={3} fill="#f59e0b" />
                    <text y={3} textAnchor="middle" fill="#fff" fontSize="8" fontWeight="bold" fontFamily="Inter">IND</text>
                  </g>
                )}
              </g>
            );
          })}
          </g>
        </svg>
      </div>

      {/* Footer Legend: Node Tiers + Edge Relations */}
      <div className="h-7 px-3 border-t border-[var(--border-hairline)] bg-[#0d0e13] flex items-center justify-between text-[10px] font-mono text-zinc-500 select-none overflow-x-auto">
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-emerald-500" /> Controller</div>
          <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-indigo-500" /> Service</div>
          <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-amber-500" /> Repository</div>
          <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-cyan-500" /> Model</div>
          <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-rose-500" /> Test</div>
        </div>

        {/* Edge Types Key */}
        <div className="hidden lg:flex items-center gap-3 border-l border-zinc-800/80 pl-3 shrink-0">
          <div className="flex items-center gap-1.5 text-zinc-400">
            <span className="font-bold text-slate-400 font-mono">──</span> Imports
          </div>
          <div className="flex items-center gap-1.5 text-emerald-400">
            <span className="font-bold text-emerald-400 font-mono">- -</span> Extends
          </div>
          <div className="flex items-center gap-1.5 text-amber-400">
            <span className="font-bold text-amber-400 font-mono">···</span> Calls
          </div>
          <div className="flex items-center gap-1.5 text-rose-400 font-semibold">
            <span className="font-bold text-rose-400 font-mono">═══</span> Blast Impact
          </div>
        </div>

        {blastRadius && (
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-rose-400">
              Direct: {blastRadius.direct_affected_files.length}
            </span>
            <span className="text-amber-400">
              Indirect: {blastRadius.indirect_affected_files.length}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
