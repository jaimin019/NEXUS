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
    if (t === 'FEEDS_INTO') return { color: 'rgba(196,154,60,0.55)', opacity: 0.55, marker: 'marker-feeds' };
    if (t === 'FED_BY') return { color: 'rgba(196,154,60,0.35)', opacity: 0.35, marker: 'marker-feeds' };
    if (t === 'GOVERNED_BY') return { color: 'rgba(160,98,58,0.55)', opacity: 0.55, marker: 'marker-governed' };
    if (t === 'CONTROLLED_BY') return { color: 'rgba(107,122,140,0.45)', opacity: 0.45, marker: 'marker-controlled' };
    if (t === 'INTERLOCKED_WITH') return { color: 'rgba(122,140,90,0.45)', opacity: 0.45, marker: 'marker-interlocked' };
    return { color: 'rgba(155,139,112,0.45)', opacity: 0.45, marker: 'marker-default' };
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
      .attr('fill', '#E2D9C8')
      .attr('opacity', 0.8);

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
      { id: 'marker-feeds', color: 'rgba(196,154,60,0.8)' },
      { id: 'marker-governed', color: 'rgba(160,98,58,0.8)' },
      { id: 'marker-controlled', color: 'rgba(107,122,140,0.8)' },
      { id: 'marker-interlocked', color: 'rgba(122,140,90,0.8)' },
      { id: 'marker-default', color: 'rgba(155,139,112,0.8)' },
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
      .attr('stroke-width', (d) => Math.max(1.5, 1.5 + (d.confidence || 0.8) * 2))
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
      linkEl.attr('stroke-width', isHoverLink ? Math.max(1.5, (1.5 + (l.confidence || 0.8) * 2) * 1.4) : Math.max(1.5, 1.5 + (l.confidence || 0.8) * 2));
    });
  }, [hoveredNode, selectedAsset, activeCriticality, showLabels, adjacencyMap, getLinkColor, nodeMap]);

  return (
    <div ref={containerRef} style={{ background: '#F8F3EC', borderRadius: '12px' }} className="relative w-full h-full overflow-hidden select-none">
      {/* Controls Bar above canvas */}
      <div
        style={{
          background: '#FDFAF6',
          border: '1px solid #E2D9C8',
          borderRadius: '8px',
          boxShadow: '0 1px 4px rgba(44,36,22,0.06)',
          padding: '6px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}
        className="absolute top-4 left-4 z-20"
      >
        <button
          onClick={handleResetZoom}
          title="Reset Zoom & Center"
          className="btn-ghost"
          style={{ color: '#6B5B3E' }}
        >
          <RefreshCw className="w-3.5 h-3.5" style={{ color: '#C49A3C' }} />
          <span>Reset Zoom</span>
        </button>

        <div className="w-[1px] h-4 mx-1" style={{ background: '#E2D9C8' }} />

        <button
          onClick={() => setShowLabels((prev) => !prev)}
          title="Toggle Labels"
          className={showLabels ? 'btn-secondary' : 'btn-ghost'}
        >
          {showLabels ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          <span>Labels</span>
        </button>

        <div className="flex items-center gap-1">
          <span className="flex items-center gap-1 text-[11px] font-medium px-2" style={{ color: '#9B8B70' }}>
            <Filter className="w-3 h-3" style={{ color: '#9B8B70' }} /> Criticality:
          </span>
          {['A', 'B', 'C'].map((crit) => {
            const isActive = activeCriticality === crit;
            return (
              <button
                key={crit}
                onClick={() => setActiveCriticality(isActive ? null : crit)}
                className={isActive ? 'badge-gold cursor-pointer' : 'badge-muted cursor-pointer'}
              >
                {crit}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-1 text-xs font-mono" style={{ color: '#9B8B70', fontSize: '13px' }}>
          <Layers className="w-3.5 h-3.5" style={{ color: '#9B8B70' }} />
          <span><strong style={{ color: '#2C2416' }}>{nodes.length}</strong> nodes</span>
          <span>·</span>
          <span><strong style={{ color: '#2C2416' }}>{links.length}</strong> edges</span>
        </div>
      </div>

      {/* Legend inside canvas */}
      <div
        style={{
          background: '#FDFAF6',
          border: '1px solid #E2D9C8',
          borderRadius: '8px',
          padding: '12px 16px'
        }}
        className="absolute bottom-4 left-4 z-20 space-y-2"
      >
        <div style={{ color: '#9B8B70', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', borderColor: '#E2D9C8' }} className="flex items-center gap-1.5 border-b pb-1.5">
          <span>Node Types & Health</span>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5" style={{ color: '#6B5B3E', fontSize: '12px' }}>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full" style={{ background: '#C49A3C' }} />
            <span>Pump</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full" style={{ background: '#A0623A' }} />
            <span>Heat Exchanger</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full" style={{ background: '#9B8B70' }} />
            <span>Control Valve</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full" style={{ background: '#7A8C5A' }} />
            <span>Vessel / General</span>
          </div>
        </div>
        <div className="pt-1.5 flex items-center justify-between gap-3 border-t" style={{ borderColor: '#E2D9C8', color: '#9B8B70', fontSize: '11px' }}>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: '#7A8C5A' }} /> &gt;70%</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: '#C49A3C' }} /> 40-70%</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: '#A0623A' }} /> &lt;40% Gap</span>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div style={{ background: 'rgba(245,240,232,0.85)' }} className="absolute inset-0 flex flex-col items-center justify-center backdrop-blur-sm z-30">
          <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin mb-3" style={{ borderColor: '#C49A3C', borderTopColor: 'transparent' }} />
          <p className="text-sm font-mono animate-pulse" style={{ color: '#9B8B70' }}>Building SYNAPSE Knowledge Network...</p>
        </div>
      )}

      {/* Main SVG Canvas */}
      <svg ref={svgRef} style={{ background: '#F8F3EC', borderRadius: '12px', border: '1px solid #E2D9C8' }} className="w-full h-full block" />

      {/* Absolute Tooltip on Hover */}
      {hoveredNode && (
        <div
          style={{
            left: `${tooltipPos.x}px`,
            top: `${tooltipPos.y}px`,
            background: '#FDFAF6',
            border: '1px solid #E2D9C8',
            borderRadius: '8px',
            boxShadow: '0 4px 20px rgba(44,36,22,0.10)',
            color: '#2C2416',
            padding: '10px 14px',
            fontSize: '13px',
            fontFamily: "'Plus Jakarta Sans', sans-serif"
          }}
          className="absolute z-50 pointer-events-none w-56"
        >
          <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b" style={{ borderColor: '#E2D9C8' }}>
            <span style={{ fontWeight: 700, color: '#2C2416' }} className="font-mono tracking-wide">{hoveredNode.id}</span>
            <span className={
              hoveredNode.criticality === 'A' ? 'badge-critical' :
              hoveredNode.criticality === 'B' ? 'badge-caution' : 'badge-positive'
            }>
              Crit {hoveredNode.criticality}
            </span>
          </div>
          <div style={{ color: '#2C2416', fontWeight: 600 }} className="truncate mb-2">{hoveredNode.name}</div>
          <div className="space-y-1 text-[11px]" style={{ color: '#9B8B70' }}>
            <div className="flex justify-between">
              <span>Type:</span>
              <span style={{ color: '#6B5B3E' }}>{hoveredNode.type}</span>
            </div>
            <div className="flex justify-between">
              <span>Indexed Docs:</span>
              <span style={{ color: '#6B5B3E' }} className="font-mono">{hoveredNode.doc_count} docs</span>
            </div>
            <div className="flex items-center justify-between pt-1 border-t" style={{ borderColor: '#E2D9C8' }}>
              <span>Completeness:</span>
              <span className="font-mono font-bold" style={{
                color: hoveredNode.completeness > 0.7 ? '#7A8C5A' :
                       hoveredNode.completeness >= 0.4 ? '#C49A3C' : '#A0623A'
              }}>
                {Math.round(hoveredNode.completeness * 100)}%
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
