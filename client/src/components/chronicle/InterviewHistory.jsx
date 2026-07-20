import React from 'react';
import { Archive, Brain, Calendar, Bot, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function InterviewHistory({ interviews = [], loading = false }) {
  const navigate = useNavigate();

  const handleQueryKnowledge = (interview) => {
    let tag = 'P-101';
    if (Array.isArray(interview.equipment_tags) && interview.equipment_tags.length > 0) {
      tag = interview.equipment_tags[0];
    } else if (Array.isArray(interview.related_assets) && interview.related_assets.length > 0) {
      tag = typeof interview.related_assets[0] === 'string' ? interview.related_assets[0] : interview.related_assets[0].tag || 'P-101';
    }

    navigate(`/oracle?asset=${tag}`);
  };

  return (
    <div className="space-y-4 pt-6">
      <div className="flex items-center justify-between border-b border-nexus-border pb-3">
        <div className="flex items-center gap-2">
          <Archive className="w-5 h-5 text-[#C49A3C]" />
          <h3 className="text-base font-bold text-white tracking-tight">Indexed Expert Knowledge</h3>
        </div>
        <span className="text-xs font-mono text-nexus-textMuted">
          {interviews.length} sessions recorded in semantic store
        </span>
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs font-mono text-nexus-textMuted animate-pulse">
          Loading indexed tacit interviews from PhoenixMind vector memory...
        </div>
      ) : interviews.length === 0 ? (
        <div className="card p-12 text-center rounded-2xl flex flex-col items-center justify-center space-y-4" style={{ background: 'rgba(252,185,178, 0.02)' }}>
          {/* Illustration SVG of person with thought bubble */}
          <div className="w-20 h-20 rounded-2xl border flex items-center justify-center relative shadow-lg text-[#C49A3C]" style={{ background: 'rgba(252,185,178,0.1)', borderColor: 'rgba(252,185,178,0.2)' }}>
            <Brain className="w-10 h-10" />
            <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-nexus-surface border border-nexus-border flex items-center justify-center">
              <span className="text-[10px] font-bold">Idea:</span>
            </div>
          </div>
          <div className="max-w-sm space-y-1">
            <h4 className="text-sm font-bold text-white">No expert interviews yet</h4>
            <p className="text-xs text-nexus-textMuted leading-relaxed">
              Start by capturing tacit operational knowledge from your first retiring engineer above. Their responses will be embedded directly into ORACLE and the SYNAPSE graph.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {interviews.map((interview, idx) => {
            const engineerName = interview.engineer_name || `Engineer #${idx + 1}`;
            const engineerId = interview.engineer_id || 'EMP-ARCHIVE';
            const dateStr = interview.created_at || interview.interview_date
              ? new Date(interview.created_at || interview.interview_date).toLocaleDateString()
              : 'Recent Session';

            const tags = Array.isArray(interview.equipment_tags) && interview.equipment_tags.length > 0
              ? interview.equipment_tags
              : ['P-101', 'HX-204'];
            const displayedTags = tags.slice(0, 4);
            const extraCount = tags.length - displayedTags.length;

            const answersCount = Array.isArray(interview.answers)
              ? interview.answers.length
              : interview.answers_count || 5;

            return (
              <div
                key={interview._id || idx}
                className="card p-5 hover:border-nexus-blush/40 transition-all flex flex-col justify-between space-y-4 shadow-lg"
                style={{ background: 'rgba(252,185,178, 0.025)' }}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-white text-base tracking-tight">{engineerName}</span>
                        <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-white/5 border border-nexus-border text-nexus-textMuted">
                          {engineerId}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-nexus-textMuted">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{dateStr}</span>
                        <span>·</span>
                        <span className="font-mono text-white font-bold">{answersCount} answers indexed</span>
                      </div>
                    </div>

                    {/* Tacit Knowledge Badge */}
                    <span className="px-2.5 py-1 rounded-full border text-[#C49A3C] font-medium text-[11px] flex items-center gap-1.5 flex-shrink-0 shadow-sm" style={{ background: 'rgba(252,185,178,0.15)', borderColor: 'rgba(252,185,178,0.3)' }}>
                      <Brain className="w-3.5 h-3.5" />
                      <span>Tacit Knowledge</span>
                    </span>
                  </div>

                  {/* Enriched Equipment Pills */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] font-semibold text-nexus-textMuted uppercase tracking-wider block">
                      Enriched Equipment Nodes
                    </span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {displayedTags.map((t, tIdx) => (
                        <span
                          key={tIdx}
                          className="px-2 py-0.5 rounded-md font-mono font-medium text-xs" style={{ background: 'rgba(252,185,178,0.15)', border: '1px solid rgba(252,185,178,0.3)', color: '#C49A3C' }}
                        >
                          {t}
                        </span>
                      ))}
                      {extraCount > 0 && (
                        <span className="px-2 py-0.5 rounded-md bg-white/5 text-xs font-mono text-nexus-textMuted">
                          +{extraCount} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-nexus-border/60 flex justify-end">
                  <button
                    onClick={() => handleQueryKnowledge(interview)}
                    className="px-4 py-2 rounded-xl text-[#C49A3C] hover:text-white font-medium text-xs flex items-center gap-2 transition-all group" style={{ background: 'rgba(252,185,178,0.1)', border: '1px solid rgba(252,185,178,0.3)' }}
                  >
                    <Bot className="w-3.5 h-3.5 text-[#C49A3C]" />
                    <span>Query this knowledge</span>
                    <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
