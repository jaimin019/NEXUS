import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import * as d3 from 'd3';
import { ZoomIn, Eye, EyeOff, Filter, RefreshCw, Layers } from 'lucide-react';
import { getAssets } from '@/lib/api';
import useNexusStore from '@/store/nexusStore';

export default function KnowledgeGraph({ onNodeSelect, selectedAsset }) {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const zoomBehaviorRef = useRef(null);

  const { assets, setAssets } = useNexusStore();
  const [loading, setLoading] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [activeCriticality, setActiveCriticality] = useState(null); // 'A' | 'B' | 'C' | null
  const [hoveredNode, setHoveredNode] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  // 1. Fetch assets on mount
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setLoading(true);
      const { data, error } = await getAssets();
      if (isMounted) {
        if (data && data.assets) {
          setAssets(data.assets);
        }
        setLoading(false);
      }
    }
    loadData();
    return () => { isMounted = false; };
  }, [setAssets]);

  // 2. Track container dimensions for D3 centering
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setDimensions({ width, height });
        }
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // 3. Prepare nodes and links from assets
  const { nodes, links, nodeMap, adjacencyMap } = useMemo(() => {
    if (!assets || assets.length === 0) {
      return { nodes: [], links: [], nodeMap: new Map(), adjacencyMap: new Map() };
    }

    const nList = assets.map((a) => ({
      id: a.tag,
      name: a.name || a.tag,
      type: a.asset_type || 'Equipment',
      completeness: typeof a.knowledge_completeness === 'number' ? a.knowledge_completeness : 0.5,
      criticality: a.criticality || 'B',
      doc_count: a.doc_count || (a.entity_count ? Math.round(a.entity_count / 2) : 3),
      rawAsset: a,
    }));

    const nodeIds = new Set(nList.map((n) => n.id));
    const nMap = new Map(nList.map((n) => [n.id, n]));
    const adjMap = new Map();
    nList.forEach((n) => adjMap.set(n.id, new Set([n.id])));

    const lList = [];
    assets.forEach((a) => {
      if (Array.isArray(a.relationships)) {
        a.relationships.forEach((r) => {
          if (r.target_tag && nodeIds.has(r.target_tag)) {
            lList.push({
              source: a.tag,
              target: r.target_tag,
              type: r.type || 'RELATED_TO',
              confidence: typeof r.confidence === 'number' ? r.confidence : 0.8,
            });
            adjMap.get(a.tag)?.add(r.target_tag);
            adjMap.get(r.target_tag)?.add(a.tag);
          }
        });
      }
    });

    return { nodes: nList, links: lList, nodeMap: nMap, adjacencyMap: adjMap };
  }, [assets]);

  // Helper colors
  const getNodeColor = useCallback((type) => {
    const t = (type || '').toLowerCase();
    if (t.includes('pump')) return '#C49A3C';
    if (t.includes('exchanger') || t.includes('hx')) return '#A0623A';
    if (t.includes('reactor')) return '#6B7A8C';
    if (t.includes('vessel')) return '#7A8C5A';
    if (t.includes('valve')) return '#9B8B70';
    if (t.includes('column')) return '#8C6B3E';
    if (t.includes('cooler')) return '#6B5B8C';
    return '#B8A888';
  }, []);

  const getBorderColor = useCallback((completeness) => {
    if (completeness > 0.7) return '#D4B896'; // green
    if (completeness >= 0.4) return '#C4A882'; // amber
    return '#B87070'; // red
  }, []);

  const getLinkColor = useCallback((type) => {
    const t = (type || '').toUpperCase();
    if (t === 'FEEDS_INTO') return 'rgba(196,154,60,0.5)';
    if (t === 'FED_BY') return 'rgba(196,154,60,0.3)';
    if (t === 'GOVERNED_BY') return 'rgba(160,98,58,0.5)';
    if (t === 'CONTROLLED_BY') return 'rgba(107,122,140,0.5)';
    return 'rgba(155,139,112,0.4)';
  }, []);

  // Reset Zoom function
  const handleResetZoom = useCallback(() => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    d3.select(svgRef.current)
      .transition()
      .duration(500)
      .call(zoomBehaviorRef.current.transform, d3.zoomIdentity);
  }, []);

  // 4. Render D3 force simulation
  useEffect(() => {
    if (!svgRef.current || nodes.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // Clear previous render

    const { width, height } = dimensions;

    // Base zoom container
    const g = svg.append('g').attr('class', 'zoom-container');

    // Zoom setup
    const zoom = d3.zoom()
      .scaleExtent([0.3, 3])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });
    zoomBehaviorRef.current = zoom;
    svg.call(zoom);

    // Double-click background resets zoom
    svg.on('dblclick.zoom', handleResetZoom);

    // SVG Defs & Markers for Arrowheads
    const defs = svg.append('defs');

    // Grid pattern
    const pattern = defs.append('pattern')
      .attr('id', 'synapse-grid')
      .attr('width', 30)
      .attr('height', 30)
      .attr('patternUnits', 'userSpaceOnUse');
    pattern.append('circle')
      .attr('cx', 2)
      .attr('cy', 2)
      .attr('r', 1)
      .attr('fill', '#1E1E2E')
      .attr('opacity', 0.5);

    // Background grid rect
    g.append('rect')
      .attr('width', width * 10)
      .attr('height', height * 10)
      .attr('x', -width * 4)
      .attr('y', -height * 4)
      .attr('fill', 'url(#synapse-grid)')
      .attr('pointer-events', 'none');

    // Arrowhead markers definition
    const markerConfigs = [
      { id: 'marker-feeds', color: '#C49A3C' },
      { id: 'marker-governed', color: '#B87070' },
      { id: 'marker-controlled', color: '#C4A882' },
      { id: 'marker-default', color: 'var(--border-light)' },
    ];

    markerConfigs.forEach(({ id, color }) => {
      defs.append('marker')
        .attr('id', id)
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 22) // Offset from node center so arrow doesn't hide behind node
        .attr('refY', 0)
        .attr('markerWidth', 6)
        .attr('markerHeight', 6)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M0,-4L8,0L0,4')
        .attr('fill', color);
    });

    // Deep copy nodes and links for simulation mutation
    const simNodes = nodes.map((d) => ({ ...d }));
    const simLinks = links.map((d) => ({ ...d }));

    // Force simulation
    const simulation = d3.forceSimulation(simNodes)
      .force('link', d3.forceLink(simLinks).id((d) => d.id).distance(140))
      .force('charge', d3.forceManyBody().strength(-450))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius((d) => Math.min(12 + d.doc_count * 1.5, 32) + 16));

    // Links group
    const linkGroup = g.append('g').attr('class', 'links');
    const linkElements = linkGroup.selectAll('line')
      .data(simLinks)
      .enter()
      .append('line')
      .attr('stroke', (d) => getLinkColor(d.type).color)
      .attr('stroke-opacity', (d) => getLinkColor(d.type).opacity)
      .attr('stroke-width', (d) => 1.5 + (d.confidence || 0.8) * 2)
      .attr('marker-end', (d) => `url(#${getLinkColor(d.type).marker})`);

    // Nodes group
    const nodeGroup = g.append('g').attr('class', 'nodes');
    const nodeContainers = nodeGroup.selectAll('g.node-item')
      .data(simNodes)
      .enter()
      .append('g')
      .attr('class', 'node-item cursor-pointer')
      .call(
        d3.drag()
          .on('start', (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on('drag', (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on('end', (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          })
      );

    // Glowing ring for selection (will be controlled dynamically)
    nodeContainers.append('circle')
      .attr('class', 'selection-ring')
      .attr('r', (d) => Math.min(12 + d.doc_count * 1.5, 32) + 8)
      .attr('fill', 'none')
      .attr('stroke', '#C49A3C')
      .attr('stroke-width', 2.5)
      .attr('stroke-dasharray', '4 4')
      .attr('opacity', (d) => (selectedAsset?.tag === d.id ? 1 : 0));

    // Node circles
    nodeContainers.append('circle')
      .attr('class', 'node-circle')
      .attr('r', (d) => Math.min(12 + d.doc_count * 1.5, 32))
      .attr('fill', (d) => getNodeColor(d.type))
      .attr('stroke', (d) => getBorderColor(d.completeness))
      .attr('stroke-width', 2.5)
      .style('transition', 'all 0.2s ease');

    // Inner highlight/dot for visual depth
    nodeContainers.append('circle')
      .attr('r', 4)
      .attr('fill', '#FFFFFF')
      .attr('opacity', 0.6)
      .attr('pointer-events', 'none');

    // Node labels
    const labels = nodeContainers.append('text')
      .attr('class', 'node-label font-mono text-[11px]')
      .attr('dy', (d) => Math.min(12 + d.doc_count * 1.5, 32) + 16)
      .attr('text-anchor', 'middle')
      .attr('fill', '#2C2416')
      .attr('font-family', "'Plus Jakarta Sans', sans-serif")
      .attr('font-size', '11px')
      .attr('font-weight', '600')
      .style('pointer-events', 'none')
      .style('user-select', 'none')
      .style('opacity', showLabels ? 1 : 0)
      .text((d) => d.id);

    // Hover interactions
    nodeContainers.on('mouseenter', (event, d) => {
      setHoveredNode(d);
      const [mx, my] = d3.pointer(event, containerRef.current);
      setTooltipPos({ x: mx + 15, y: my - 10 });
    }).on('mousemove', (event) => {
      const [mx, my] = d3.pointer(event, containerRef.current);
      setTooltipPos({ x: mx + 15, y: my - 10 });
    }).on('mouseleave', () => {
      setHoveredNode(null);
    });

    // Click selection
    nodeContainers.on('click', (event, d) => {
      event.stopPropagation();
      const assetObj = nodeMap.get(d.id);
      if (assetObj && onNodeSelect) {
        onNodeSelect(assetObj.rawAsset || assetObj);
      }
    });

    // Background click deselects
    svg.on('click', () => {
      if (onNodeSelect) onNodeSelect(null);
    });

    // Tick update
    simulation.on('tick', () => {
      linkElements
        .attr('x1', (d) => d.source.x)
        .attr('y1', (d) => d.source.y)
        .attr('x2', (d) => d.target.x)
        .attr('y2', (d) => d.target.y);

      nodeContainers.attr('transform', (d) => `translate(${d.x}, ${d.y})`);
    });

    return () => {
      simulation.stop();
    };
  }, [dimensions, nodes, links, getNodeColor, getBorderColor, getLinkColor, nodeMap, onNodeSelect, handleResetZoom]);

  // 5. Dynamic opacity/highlight based on hover, active criticality filter, and selection
  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);

    const connectedIds = hoveredNode ? adjacencyMap.get(hoveredNode.id) || new Set([hoveredNode.id]) : null;

    svg.selectAll('g.node-item').each(function (d) {
      const nodeEl = d3.select(this);
      const isSelected = selectedAsset && (selectedAsset.tag === d.id || selectedAsset.id === d.id);
      const isHoverConnected = !hoveredNode || (connectedIds && connectedIds.has(d.id));
      const matchesCriticality = !activeCriticality || d.criticality === activeCriticality;

      const shouldDim = !isHoverConnected || !matchesCriticality;

      nodeEl.style('opacity', shouldDim ? 0.2 : 1);

      // Update selection ring opacity and animation
      nodeEl.select('.selection-ring')
        .attr('opacity', isSelected ? 1 : 0)
        .classed('animate-spin-slow', isSelected);

      // Update labels visibility based on toggle and hover/selection state
      nodeEl.select('.node-label')
        .style('opacity', (showLabels || isSelected || (hoveredNode && d.id === hoveredNode.id)) && !shouldDim ? 1 : 0);
    });

    svg.selectAll('.links line').each(function (l) {
      const linkEl = d3.select(this);
      const srcId = typeof l.source === 'object' ? l.source.id : l.source;
      const tgtId = typeof l.target === 'object' ? l.target.id : l.target;

      const isHoverLink = hoveredNode && (srcId === hoveredNode.id || tgtId === hoveredNode.id);
      const matchesCrit = !activeCriticality || (
        nodeMap.get(srcId)?.criticality === activeCriticality && nodeMap.get(tgtId)?.criticality === activeCriticality
      );

      let opacity = getLinkColor(l.type).opacity;
      if (hoveredNode) {
        opacity = isHoverLink ? 0.9 : 0.15;
      } else if (activeCriticality && !matchesCrit) {
        opacity = 0.1;
      }
      linkEl.style('opacity', opacity);
      linkEl.attr('stroke-width', isHoverLink ? (1.5 + (l.confidence || 0.8) * 2) * 1.4 : 1.5 + (l.confidence || 0.8) * 2);
    });
  }, [hoveredNode, selectedAsset, activeCriticality, showLabels, adjacencyMap, getLinkColor, nodeMap]);

  return (
    <div ref={containerRef} className="relative w-full h-full bg-nexus-bg overflow-hidden select-none">
      {/* Controls Bar above canvas */}
      <div className="absolute top-4 left-4 z-20 flex flex-wrap items-center gap-3">
        {/* Button Group (Glass Card) */}
        <div className="card flex items-center p-1 gap-1">
          <button
            onClick={handleResetZoom}
            title="Reset Zoom & Center"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-nexus-textMuted hover:text-white hover:bg-white/10 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5 text-nexus-primary" />
            <span>Reset Zoom</span>
          </button>

          <div className="w-[1px] h-4 bg-nexus-border mx-1" />

          <button
            onClick={() => setShowLabels((prev) => !prev)}
            title="Toggle Labels"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              showLabels ? 'bg-nexus-blush/20 text-nexus-blush border border-nexus-blush/30' : 'text-nexus-textMuted hover:text-white hover:bg-white/10'
            }`}
          >
            {showLabels ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span>Labels</span>
          </button>
        </div>

        {/* Criticality Filter Pills */}
        <div className="card flex items-center px-2 py-1 gap-1">
          <span className="flex items-center gap-1 text-[11px] text-nexus-textMuted font-medium px-2">
            <Filter className="w-3 h-3 text-nexus-accent" /> Criticality:
          </span>
          {['A', 'B', 'C'].map((crit) => {
            const isActive = activeCriticality === crit;
            const badgeColor = crit === 'A' ? 'red' : crit === 'B' ? 'amber' : 'green';
            return (
              <button
                key={crit}
                onClick={() => setActiveCriticality(isActive ? null : crit)}
                className={`px-2.5 py-1 rounded text-xs font-mono font-bold transition-all ${
                  isActive
                    ? crit === 'A'
                      ? 'bg-[#B87070] text-white shadow-lg'
                      : crit === 'B'
                      ? 'bg-[#C4A882] text-white shadow-lg'
                      : 'bg-[#D4B896] text-white shadow-lg'
                    : 'bg-white/5 text-nexus-textMuted hover:text-white hover:bg-white/10'
                }`}
              >
                {crit}
              </button>
            );
          })}
        </div>

        {/* Node/Edge count badge */}
        <div className="card px-3 py-1.5 text-xs font-mono text-nexus-textMuted flex items-center gap-2">
          <Layers className="w-3.5 h-3.5 text-nexus-accent" />
          <span><strong className="text-white font-mono">{nodes.length}</strong> nodes</span>
          <span>·</span>
          <span><strong className="text-white font-mono">{links.length}</strong> edges</span>
        </div>
      </div>

      {/* Legend inside canvas */}
      <div className="absolute bottom-4 left-4 z-20 space-y-2" style={{ background: "#FDFAF6", border: "1px solid #E2D9C8", borderRadius: "8px", padding: "12px 16px" }}>
        <div className="font-semibold text-nexus-text flex items-center gap-1.5 border-b border-nexus-border pb-1.5">
          <span>Node Types & Health</span>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-nexus-textMuted">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#C49A3C] border border-white/20" />
            <span>Pump</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#C4A882] border border-white/20" />
            <span>Heat Exchanger</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#C49A3C] border border-white/20" />
            <span>Control Valve</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#D4B896] border border-white/20" />
            <span>General Asset</span>
          </div>
        </div>
        <div className="border-t border-nexus-border pt-1.5 flex items-center justify-between text-[11px] text-nexus-textMuted">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#D4B896]" /> &gt;70%</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#C4A882]" /> 40-70%</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#B87070]" /> &lt;40% Gap</span>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-nexus-bg/80 backdrop-blur-sm z-30">
          <div className="w-8 h-8 rounded-full border-2 border-nexus-primary border-t-transparent animate-spin mb-3" />
          <p className="text-sm font-mono text-nexus-textMuted animate-pulse">Building SYNAPSE Knowledge Network...</p>
        </div>
      )}

      {/* Main SVG Canvas */}
      <svg ref={svgRef} className="w-full h-full block" />

      {/* Absolute Tooltip on Hover */}
      {hoveredNode && (
        <div
          style={{ left: `${tooltipPos.x}px`, top: `${tooltipPos.y}px` }}
          className="absolute z-50 pointer-events-none p-3 w-56 text-xs" style={{ background: "#FDFAF6", border: "1px solid #E2D9C8", borderRadius: "8px", boxShadow: "0 4px 20px rgba(44,36,22,0.10)", color: "#2C2416", padding: "10px 14px", fontSize: "13px", fontFamily: "\'Plus Jakarta Sans\', sans-serif" }}
        >
          <div className="flex items-center justify-between border-b border-nexus-border pb-1.5 mb-1.5">
            <span className="font-mono font-bold text-white tracking-wide">{hoveredNode.id}</span>
            <span className={`px-1.5 py-0.5 rounded font-mono font-bold text-[10px] ${
              hoveredNode.criticality === 'A' ? 'bg-[#B87070]/20 text-[#B87070] border border-[#B87070]/30' :
              hoveredNode.criticality === 'B' ? 'bg-[#C4A882]/20 text-[#C4A882] border border-[#C4A882]/30' :
              'bg-[#D4B896]/20 text-[#D4B896] border border-[#D4B896]/30'
            }`}>
              Crit {hoveredNode.criticality}
            </span>
          </div>
          <div className="text-nexus-text font-medium truncate mb-2">{hoveredNode.name}</div>
          <div className="space-y-1 text-nexus-textMuted text-[11px]">
            <div className="flex justify-between">
              <span>Type:</span>
              <span className="text-white">{hoveredNode.type}</span>
            </div>
            <div className="flex justify-between">
              <span>Indexed Docs:</span>
              <span className="text-white font-mono">{hoveredNode.doc_count} docs</span>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-white/5">
              <span>Completeness:</span>
              <span className={`font-mono font-bold ${
                hoveredNode.completeness > 0.7 ? 'text-[#D4B896]' :
                hoveredNode.completeness >= 0.4 ? 'text-[#C4A882]' : 'text-[#B87070]'
              }`}>
                {Math.round(hoveredNode.completeness * 100)}%
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
