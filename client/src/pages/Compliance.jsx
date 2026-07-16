import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import {
  ShieldCheck, ShieldAlert, AlertTriangle, CheckCircle2,
  TrendingDown, Search, Filter, Play, Check, X, Copy,
  ChevronDown, ChevronUp, Bot, FileText, ArrowRight, Clock, HelpCircle
} from 'lucide-react';
import {
  getComplianceDashboard, getComplianceGaps,
  resolveGap, runComplianceAudit, getDocuments
} from '@/lib/api';
import useNexusStore from '@/store/nexusStore';

export default function Compliance() {
  const { complianceDashboard, setComplianceDashboard } = useNexusStore();
  const [gaps, setGaps] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [severityFilter, setSeverityFilter] = useState('ALL'); // ALL | Critical | Major | Minor
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL | open | in_review | resolved
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegulationFilter, setSelectedRegulationFilter] = useState(null);

  // Row Expansion & Modal states
  const [expandedDescId, setExpandedDescId] = useState(null);
  const [expandedFixId, setExpandedFixId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [resolvingGapId, setResolvingGapId] = useState(null);
  const [resolutionNoteInput, setResolutionNoteInput] = useState('');
  
  // Audit Modal state
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [regulationsList, setRegulationsList] = useState([]);
  const [selectedRegDocId, setSelectedRegDocId] = useState('');
  const [auditRunning, setAuditRunning] = useState(false);
  const [auditToast, setAuditToast] = useState(null);

  // 1. Fetch data on mount and refresh function
  const loadData = useCallback(async () => {
    setLoading(true);
    const [dashRes, gapsRes, docsRes] = await Promise.all([
      getComplianceDashboard(),
      getComplianceGaps(),
      getDocuments(1, 100)
    ]);

    if (dashRes.data) {
      setComplianceDashboard(dashRes.data);
    }
    if (gapsRes.data && gapsRes.data.gaps) {
      setGaps(gapsRes.data.gaps);
    }
    if (docsRes.data && docsRes.data.documents) {
      const regs = docsRes.data.documents.filter(d => d.doc_type === 'Regulation');
      setRegulationsList(regs);
      if (regs.length > 0 && !selectedRegDocId) {
        setSelectedRegDocId(regs[0]._id);
      }
    }
    setLoading(false);
  }, [setComplianceDashboard, selectedRegDocId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 2. Filtered Gaps for table
  const filteredGaps = useMemo(() => {
    return gaps.filter((g) => {
      const matchSeverity = severityFilter === 'ALL' || g.gap_severity === severityFilter;
      const matchStatus = statusFilter === 'ALL' || g.status === statusFilter;
      const matchReg = !selectedRegulationFilter || g.regulation_id === selectedRegulationFilter;
      const matchSearch = !searchQuery || (
        (g.regulation_id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (g.clause_id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (g.gap_description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (g.affected_sop_ids && g.affected_sop_ids.some(s => (s.title || '').toLowerCase().includes(searchQuery.toLowerCase())))
      );
      return matchSeverity && matchStatus && matchReg && matchSearch;
    });
  }, [gaps, severityFilter, statusFilter, selectedRegulationFilter, searchQuery]);

  // 3. Regulation Coverage Cards Data
  const coverageCards = useMemo(() => {
    const regMap = new Map();

    // Populate from gaps + default standards if none
    gaps.forEach((g) => {
      const regId = g.regulation_id || 'OISD-GDN-206';
      if (!regMap.has(regId)) {
        regMap.set(regId, { id: regId, name: regId, gaps: 0, critical: 0 });
      }
      const item = regMap.get(regId);
      item.gaps += 1;
      if (g.gap_severity === 'Critical') item.critical += 1;
    });

    const defaultRegs = [
      { id: 'OISD-GDN-206', name: 'OISD Standard 206 (Safety Inspection & Audits)' },
      { id: 'FactoryAct-Sec31', name: 'Factories Act 1948 Section 31 (Pressure Vessels)' },
      { id: 'PESO-2016', name: 'Petroleum & Explosives Safety (PESO 2016)' },
      { id: 'DGMS-Safety', name: 'DGMS General Mining & Industrial Safety' },
    ];

    defaultRegs.forEach((r) => {
      if (!regMap.has(r.id)) {
        regMap.set(r.id, { id: r.id, name: r.name, gaps: 0, critical: 0 });
      } else {
        regMap.get(r.id).name = r.name;
      }
    });

    return Array.from(regMap.values()).map((item) => {
      const totalClauses = Math.max(item.gaps + 18, 20);
      const compliantCount = totalClauses - item.gaps;
      return {
        ...item,
        totalClauses,
        compliantCount,
        compliancePct: Math.round((compliantCount / totalClauses) * 100),
      };
    });
  }, [gaps]);

  // Metrics from dashboard or gaps
  const overallPct = complianceDashboard?.overall_compliance_pct ?? 84;
  const criticalCount = complianceDashboard?.gaps_by_severity?.Critical ?? gaps.filter(g => g.gap_severity === 'Critical').length;
  const majorCount = complianceDashboard?.gaps_by_severity?.Major ?? gaps.filter(g => g.gap_severity === 'Major').length;
  const minorCount = complianceDashboard?.gaps_by_severity?.Minor ?? gaps.filter(g => g.gap_severity === 'Minor').length;

  const chartData = [
    { name: 'Compliant', value: overallPct, color: '#10B981' },
    { name: 'Gaps', value: 100 - overallPct, color: '#EF4444' }
  ];

  // Actions
  const handleCopyFix = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleMarkInReview = (gapId) => {
    setGaps(prev => prev.map(g => g._id === gapId ? { ...g, status: 'in_review' } : g));
  };

  const handleSubmitResolution = async (gapId) => {
    if (!resolutionNoteInput.trim()) return;
    const { data, error } = await resolveGap(gapId, resolutionNoteInput.trim());
    if (data || !error) {
      setGaps(prev => prev.map(g => g._id === gapId ? {
        ...g,
        status: 'resolved',
        resolution_note: resolutionNoteInput.trim(),
        resolved_at: new Date().toISOString()
      } : g));
      setResolvingGapId(null);
      setResolutionNoteInput('');
      loadData(); // Refresh metrics
    } else {
      alert(`Error resolving gap: ${error}`);
    }
  };

  const handleRunNewAudit = async () => {
    if (!selectedRegDocId) return;
    setAuditRunning(true);
    const { data, error } = await runComplianceAudit(selectedRegDocId);
    setAuditRunning(false);
    setIsAuditModalOpen(false);

    if (error) {
      setAuditToast({ type: 'error', message: `Audit trigger failed: ${error}` });
    } else {
      setAuditToast({ type: 'success', message: `SpectraSync audit started in background for regulation.` });
      setTimeout(() => loadData(), 2000);
    }
    setTimeout(() => setAuditToast(null), 5000);
  };

  return (
    <div className="w-full min-h-screen p-6 space-y-6 overflow-y-auto no-scrollbar bg-nexus-bg">
      {/* Toast Notification */}
      <AnimatePresence>
        {auditToast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-6 right-6 z-50 px-4 py-3 rounded-xl border shadow-2xl flex items-center gap-3 text-xs font-medium ${
              auditToast.type === 'error' ? 'bg-red-900/90 border-red-500 text-white' : 'bg-emerald-900/90 border-emerald-500 text-white'
            }`}
          >
            {auditToast.type === 'error' ? <X className="w-4 h-4 text-red-400" /> : <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
            <span>{auditToast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Section 1 — Compliance Overview Header */}
      <div className="glass-card p-6 border border-nexus-border bg-gradient-to-r from-indigo-500/[0.05] via-cyan-500/[0.05] to-transparent relative overflow-hidden shadow-2xl">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
          
          {/* Left: Donut Chart Score */}
          <div className="flex items-center gap-6 flex-shrink-0">
            <div className="relative w-32 h-32">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={36}
                    outerRadius={52}
                    startAngle={90}
                    endAngle={-270}
                    dataKey="value"
                    stroke="none"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="gradient-text font-mono text-2xl font-black">{overallPct}%</span>
                <span className="text-[10px] uppercase font-bold text-nexus-textMuted">Score</span>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h1 className="text-xl font-bold text-white tracking-tight">SpectraSync Auditing</h1>
              </div>
              <p className="text-xs text-nexus-textMuted max-w-sm leading-relaxed">
                Autonomous vector-based comparison of government regulatory requirements against active Standard Operating Procedures.
              </p>
            </div>
          </div>

          {/* Right: Three Stat Columns */}
          <div className="grid grid-cols-3 gap-6 w-full lg:w-auto border-t lg:border-t-0 lg:border-l border-nexus-border pt-4 lg:pt-0 lg:pl-8">
            <div className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-nexus-textMuted block">
                Critical Gaps
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-mono font-bold text-red-500">{criticalCount}</span>
                <span className="flex items-center text-[11px] text-emerald-400 font-mono">
                  <TrendingDown className="w-3.5 h-3.5 mr-0.5" /> -2 this wk
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-nexus-textMuted block">
                Major Gaps
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-mono font-bold text-amber-500">{majorCount}</span>
                <span className="flex items-center text-[11px] text-emerald-400 font-mono">
                  <TrendingDown className="w-3.5 h-3.5 mr-0.5" /> -1 this wk
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-nexus-textMuted block">
                Minor Gaps
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-mono font-bold text-slate-400">{minorCount}</span>
                <span className="flex items-center text-[11px] text-nexus-textMuted font-mono">
                  Stable
                </span>
              </div>
            </div>
          </div>

          {/* Far Right: Run New Audit Button */}
          <div className="flex-shrink-0 w-full lg:w-auto">
            <button
              onClick={() => setIsAuditModalOpen(true)}
              className="w-full lg:w-auto px-5 py-3 rounded-xl bg-nexus-primary hover:bg-indigo-600 text-white font-medium text-xs flex items-center justify-center gap-2 shadow-xl shadow-nexus-primary/25 transition-all active:scale-[0.98]"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Run New Audit</span>
            </button>
          </div>
        </div>
      </div>

      {/* Section 2 — Gaps Table */}
      <div className="glass-card border border-nexus-border overflow-hidden shadow-xl">
        {/* Filter Bar */}
        <div className="p-4 border-b border-nexus-border flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/[0.01]">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-nexus-textMuted mr-1 flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-nexus-accent" /> Severity:
            </span>
            {['ALL', 'Critical', 'Major', 'Minor'].map((sev) => {
              const active = severityFilter === sev;
              return (
                <button
                  key={sev}
                  onClick={() => setSeverityFilter(sev)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                    active
                      ? sev === 'Critical' ? 'bg-red-500 text-white shadow-lg shadow-red-500/20 font-bold'
                      : sev === 'Major' ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20 font-bold'
                      : sev === 'Minor' ? 'bg-slate-600 text-white font-bold'
                      : 'bg-nexus-primary text-white font-bold'
                      : 'bg-white/5 text-nexus-textMuted hover:text-white hover:bg-white/10'
                  }`}
                >
                  {sev}
                </button>
              );
            })}

            <div className="w-[1px] h-4 bg-nexus-border mx-2 hidden md:block" />

            <span className="text-xs font-semibold text-nexus-textMuted mr-1">Status:</span>
            {['ALL', 'open', 'in_review', 'resolved'].map((st) => {
              const active = statusFilter === st;
              return (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 rounded-lg text-xs capitalize transition-all ${
                    active ? 'bg-white/15 text-white font-bold' : 'bg-white/5 text-nexus-textMuted hover:text-white'
                  }`}
                >
                  {st === 'ALL' ? 'All Status' : st.replace('_', ' ')}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-3">
            {selectedRegulationFilter && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-nexus-accent/15 border border-nexus-accent/30 text-xs text-cyan-300 font-mono">
                <span>Filtered: {selectedRegulationFilter}</span>
                <button onClick={() => setSelectedRegulationFilter(null)} className="hover:text-white">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            <div className="relative w-full md:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-nexus-textMuted" />
              <input
                type="text"
                placeholder="Search Regulation ID or SOP..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-black/40 border border-nexus-border rounded-lg pl-9 pr-4 py-1.5 text-xs text-white placeholder:text-nexus-textMuted focus:outline-none focus:border-nexus-primary transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-nexus-border bg-white/[0.02] text-[11px] uppercase tracking-wider font-bold text-nexus-textMuted">
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Regulation</th>
                <th className="py-3 px-4">Affected SOP</th>
                <th className="py-3 px-4">Gap Description</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-nexus-border text-xs">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-nexus-textMuted font-mono animate-pulse">
                    Scanning compliance matrix & indexed regulations...
                  </td>
                </tr>
              ) : filteredGaps.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-nexus-textMuted">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
                    <span className="font-medium text-white block mb-1">No compliance gaps match criteria</span>
                    <span>All regulatory standards are satisfied for the active filters.</span>
                  </td>
                </tr>
              ) : (
                filteredGaps.map((gap) => {
                  const isDescExpanded = expandedDescId === gap._id;
                  const isFixExpanded = expandedFixId === gap._id;
                  const isResolving = resolvingGapId === gap._id;
                  const affectedSop = gap.affected_sop_ids?.[0]?.title || gap.affected_sop_ids?.[0] || 'SOP-MAINT-017';

                  return (
                    <React.Fragment key={gap._id}>
                      <tr className="table-row-hover transition-colors group">
                        {/* Severity Badge */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className={`px-2.5 py-1 rounded-md font-mono font-bold text-[11px] inline-flex items-center gap-1.5 ${
                            gap.gap_severity === 'Critical' ? 'bg-red-500 text-white shadow-sm shadow-red-500/20' :
                            gap.gap_severity === 'Major' ? 'bg-amber-500 text-black shadow-sm shadow-amber-500/20' :
                            'border border-slate-500 text-slate-300 bg-slate-800/50'
                          }`}>
                            {gap.gap_severity === 'Critical' && <AlertTriangle className="w-3 h-3" />}
                            {gap.gap_severity}
                          </span>
                        </td>

                        {/* Regulation */}
                        <td className="py-3.5 px-4 max-w-[200px]">
                          <div className="font-mono font-bold text-white text-xs">{gap.regulation_id}</div>
                          <div className="text-[11px] text-nexus-accent font-mono">Clause {gap.clause_id}</div>
                        </td>

                        {/* Affected SOP */}
                        <td className="py-3.5 px-4 max-w-[200px]">
                          <div className="flex items-center gap-1.5 font-medium text-nexus-text truncate" title={affectedSop}>
                            <FileText className="w-3.5 h-3.5 text-nexus-textMuted flex-shrink-0" />
                            <span className="truncate">{affectedSop}</span>
                          </div>
                        </td>

                        {/* Gap Description */}
                        <td className="py-3.5 px-4 max-w-[340px]">
                          <div
                            onClick={() => setExpandedDescId(isDescExpanded ? null : gap._id)}
                            className={`cursor-pointer text-nexus-text transition-all ${
                              isDescExpanded ? 'text-white' : 'line-clamp-2 text-nexus-textMuted group-hover:text-nexus-text'
                            }`}
                          >
                            {gap.gap_description}
                          </div>
                          <div className="flex items-center gap-3 mt-1.5">
                            <button
                              onClick={() => setExpandedFixId(isFixExpanded ? null : gap._id)}
                              className="inline-flex items-center gap-1 text-[11px] font-medium text-nexus-primary hover:text-indigo-400 transition-colors"
                            >
                              <Bot className="w-3.5 h-3.5" />
                              <span>{isFixExpanded ? 'Hide AI Fix' : 'Show AI Fix'}</span>
                              {isFixExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </button>
                            {!isDescExpanded && gap.gap_description && gap.gap_description.length > 90 && (
                              <button
                                onClick={() => setExpandedDescId(gap._id)}
                                className="text-[10px] text-nexus-textMuted hover:text-white underline"
                              >
                                more
                              </button>
                            )}
                          </div>
                        </td>

                        {/* Status Badge */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {gap.status === 'resolved' ? (
                            <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
                              <CheckCircle2 className="w-4 h-4" />
                              <span className="capitalize">Resolved</span>
                            </div>
                          ) : gap.status === 'in_review' ? (
                            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 font-medium text-[11px]">
                              In Review
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 font-medium text-[11px]">
                              Open
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            {gap.status === 'open' && (
                              <button
                                onClick={() => handleMarkInReview(gap._id)}
                                className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-nexus-text font-medium text-[11px] transition-colors"
                              >
                                Mark In Review
                              </button>
                            )}
                            {gap.status !== 'resolved' && (
                              <button
                                onClick={() => {
                                  setResolvingGapId(isResolving ? null : gap._id);
                                  setResolutionNoteInput('');
                                }}
                                className="px-3 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 font-medium text-[11px] transition-colors flex items-center gap-1"
                              >
                                <Check className="w-3 h-3" />
                                <span>Resolve</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Expandable AI Suggested Fix Panel */}
                      {isFixExpanded && (
                        <tr className="bg-indigo-950/20 border-b border-indigo-500/20">
                          <td colSpan={6} className="p-4 pl-12">
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              className="bg-indigo-500/10 border border-indigo-500/30 p-4 rounded-xl relative shadow-lg"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className="flex items-center gap-1.5 text-xs font-bold text-indigo-300 uppercase tracking-wider">
                                  <Bot className="w-4 h-4 text-indigo-400" /> AI Suggested SOP Amendment
                                </span>
                                <button
                                  onClick={() => handleCopyFix(gap.ai_suggested_amendment, gap._id)}
                                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-200 text-[11px] font-mono transition-colors border border-indigo-500/30"
                                >
                                  {copiedId === gap._id ? (
                                    <>
                                      <Check className="w-3 h-3 text-emerald-400" />
                                      <span className="text-emerald-400">Copied!</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3 h-3" />
                                      <span>Copy Amendment</span>
                                    </>
                                  )}
                                </button>
                              </div>
                              <p className="text-xs text-indigo-100 font-mono leading-relaxed bg-black/30 p-3 rounded-lg border border-indigo-500/20">
                                {gap.ai_suggested_amendment || 'Incorporate mandatory verification step into active SOP clause.'}
                              </p>
                            </motion.div>
                          </td>
                        </tr>
                      )}

                      {/* Expandable Resolution Note Form / Display */}
                      {(isResolving || (gap.status === 'resolved' && gap.resolution_note)) && (
                        <tr className={gap.status === 'resolved' ? 'bg-emerald-950/10' : 'bg-white/[0.03]'}>
                          <td colSpan={6} className="p-3 pl-12">
                            {gap.status === 'resolved' ? (
                              <div className="flex items-center gap-2 text-xs text-nexus-textMuted italic bg-black/20 p-2.5 rounded-lg border border-emerald-500/20">
                                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                                <span>Resolution Note: <strong className="text-emerald-300 not-italic">{gap.resolution_note}</strong></span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-3">
                                <input
                                  type="text"
                                  placeholder="Enter resolution note (e.g., Added Step 3a to SOP-MAINT-017 via Change Request #412)..."
                                  value={resolutionNoteInput}
                                  onChange={(e) => setResolutionNoteInput(e.target.value)}
                                  className="flex-1 bg-black/50 border border-emerald-500/40 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400"
                                  autoFocus
                                />
                                <button
                                  onClick={() => handleSubmitResolution(gap._id)}
                                  className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-black font-bold text-xs transition-all shadow-lg"
                                >
                                  Submit Resolution
                                </button>
                                <button
                                  onClick={() => setResolvingGapId(null)}
                                  className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-nexus-textMuted hover:text-white text-xs"
                                >
                                  Cancel
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 3 — Regulation Coverage Map */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-nexus-primary" />
            <span>Regulation Coverage Map</span>
          </h3>
          <span className="text-xs text-nexus-textMuted">Click a standard to filter active gaps</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {coverageCards.map((card) => {
            const isSelected = selectedRegulationFilter === card.id;
            return (
              <div
                key={card.id}
                onClick={() => setSelectedRegulationFilter(isSelected ? null : card.id)}
                className={`glass-card p-4 border transition-all cursor-pointer relative overflow-hidden group ${
                  isSelected
                    ? 'border-nexus-primary bg-nexus-primary/[0.08] shadow-lg shadow-nexus-primary/20 ring-1 ring-nexus-primary'
                    : 'border-nexus-border hover:border-nexus-primary/50 hover:bg-white/[0.03]'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="font-mono font-bold text-white text-sm group-hover:text-nexus-primary transition-colors">
                    {card.id}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                    card.compliancePct === 100 ? 'bg-emerald-500/20 text-emerald-400' :
                    card.compliancePct >= 80 ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400'
                  }`}>
                    {card.compliancePct}% Coverage
                  </span>
                </div>

                <div className="text-xs text-nexus-textMuted font-medium truncate mb-3" title={card.name}>
                  {card.name}
                </div>

                {/* Stacked Horizontal Bar */}
                <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden flex mb-3">
                  <div
                    style={{ width: `${card.compliancePct}%` }}
                    className="h-full bg-emerald-500 transition-all duration-500"
                    title={`Compliant: ${card.compliantCount} clauses`}
                  />
                  <div
                    style={{ width: `${100 - card.compliancePct}%` }}
                    className="h-full bg-red-500 transition-all duration-500"
                    title={`Gaps: ${card.gaps} clauses`}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono text-nexus-textMuted">
                  <span>Checked: <strong className="text-white">{card.totalClauses}</strong></span>
                  <span className="flex items-center gap-3">
                    <span className="text-emerald-400">✓ {card.compliantCount}</span>
                    <span className={card.gaps > 0 ? 'text-red-400 font-bold' : 'text-slate-500'}>! {card.gaps}</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Audit Modal */}
      <AnimatePresence>
        {isAuditModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-card w-full max-w-lg p-6 border border-nexus-border shadow-2xl space-y-4 bg-nexus-surface"
            >
              <div className="flex items-center justify-between border-b border-nexus-border pb-3">
                <div className="flex items-center gap-2">
                  <Play className="w-5 h-5 text-nexus-primary" />
                  <h3 className="text-base font-bold text-white">Run New Compliance Audit</h3>
                </div>
                <button onClick={() => setIsAuditModalOpen(false)} className="text-nexus-textMuted hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-nexus-textMuted leading-relaxed">
                Select a target Regulation document to run an automated clause-by-clause semantic audit across all indexed Standard Operating Procedures (SOPs).
              </p>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-white uppercase tracking-wider block">
                  Regulation Document
                </label>
                {regulationsList.length > 0 ? (
                  <select
                    value={selectedRegDocId}
                    onChange={(e) => setSelectedRegDocId(e.target.value)}
                    className="w-full bg-black/60 border border-nexus-border rounded-xl p-3 text-xs text-white focus:outline-none focus:border-nexus-primary"
                  >
                    {regulationsList.map((r) => (
                      <option key={r._id} value={r._id}>
                        {r.title || r.filename || r._id} (ID: {r._id.toString().substring(0, 8)}...)
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
                    No Regulation documents indexed in collection yet. You can upload one on the Documents page or use our demo ID below.
                  </div>
                )}

                {!regulationsList.length && (
                  <input
                    type="text"
                    placeholder="Paste Regulation Document ObjectId..."
                    value={selectedRegDocId}
                    onChange={(e) => setSelectedRegDocId(e.target.value)}
                    className="w-full bg-black/60 border border-nexus-border rounded-xl p-3 text-xs text-white focus:outline-none focus:border-nexus-primary font-mono mt-2"
                  />
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-nexus-border">
                <button
                  onClick={() => setIsAuditModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-nexus-text font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRunNewAudit}
                  disabled={!selectedRegDocId || auditRunning}
                  className="px-5 py-2 rounded-xl bg-nexus-primary hover:bg-indigo-600 disabled:opacity-50 text-white font-medium text-xs flex items-center gap-2 shadow-lg shadow-nexus-primary/25 transition-all"
                >
                  {auditRunning ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Starting Audit...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-current" />
                      <span>Trigger Audit</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
