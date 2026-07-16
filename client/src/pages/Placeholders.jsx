// Placeholder pages for routes not yet implemented

import { Network, Bot, Activity, ShieldCheck } from 'lucide-react';

function PlaceholderPage({ icon: Icon, title, subtitle, color = 'indigo' }) {
  const colorMap = {
    indigo: 'text-indigo-400',
    cyan: 'text-cyan-400',
    purple: 'text-purple-400',
    green: 'text-emerald-400',
  };
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-nexus-surface border border-nexus-border mb-4">
          <Icon className={`w-8 h-8 ${colorMap[color]}`} />
        </div>
        <h2 className="text-xl font-bold text-nexus-text mb-2">{title}</h2>
        <p className="text-sm text-nexus-textMuted max-w-xs">{subtitle}</p>
        <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-nexus-primary/10 border border-nexus-primary/20">
          <span className="w-2 h-2 bg-nexus-primary rounded-full animate-pulse" />
          <span className="text-xs text-nexus-primary font-medium">Coming in next prompt</span>
        </div>
      </div>
    </div>
  );
}

export function SynapsePage() {
  return <PlaceholderPage icon={Network} title="SYNAPSE — Knowledge Graph" subtitle="Interactive 3D graph of equipment relationships and document connections." color="cyan" />;
}

export function OraclePage() {
  return <PlaceholderPage icon={Bot} title="ORACLE Copilot" subtitle="AI-powered conversational interface for querying your industrial knowledge base." color="indigo" />;
}

export function ChroniclePage() {
  return <PlaceholderPage icon={Activity} title="CHRONICLE — Failure Intelligence" subtitle="Pattern mining, expert knowledge capture, and predictive failure analysis." color="purple" />;
}

export function CompliancePage() {
  return <PlaceholderPage icon={ShieldCheck} title="SpectraSync Compliance" subtitle="Automated regulation gap analysis and compliance mapping across your document library." color="green" />;
}
