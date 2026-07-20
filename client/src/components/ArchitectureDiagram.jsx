import { motion } from 'framer-motion';

export default function ArchitectureDiagram() {
  return (
    <div className="w-full h-full bg-nexus-bg flex flex-col items-center justify-center p-8 overflow-y-auto no-scrollbar">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold gradient-text mb-2">NEXUS Architecture</h1>
        <p className="text-nexus-textMuted">AI-powered Industrial Knowledge Intelligence Platform</p>
      </div>

      <div className="w-full max-w-5xl rounded-2xl border border-nexus-border bg-nexus-surface/50 p-10 shadow-2xl relative">
        <svg viewBox="0 0 1000 600" className="w-full h-auto">
          <defs>
            <linearGradient id="grad-ds" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="var(--surface)" stopOpacity="0.8" />
              <stop offset="100%" stopColor="var(--bg)" stopOpacity="0.8" />
            </linearGradient>
            <linearGradient id="grad-synapse" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#C49A3C" stopOpacity="0.2" />
              <stop offset="100%" stopColor="var(--border)" stopOpacity="0.2" />
            </linearGradient>
            <linearGradient id="grad-oracle" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#C4A882" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#8F5419" stopOpacity="0.2" />
            </linearGradient>
            <linearGradient id="grad-chronicle" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#C49A3C" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#C78881" stopOpacity="0.2" />
            </linearGradient>
            <linearGradient id="grad-spectra" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#D4B896" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#476631" stopOpacity="0.2" />
            </linearGradient>
            <linearGradient id="grad-infra" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="var(--surface)" stopOpacity="0.6" />
              <stop offset="100%" stopColor="var(--bg)" stopOpacity="0.6" />
            </linearGradient>
            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="#4B5563" />
            </marker>
          </defs>

          {/* LAYER 1: DATA SOURCES */}
          <g transform="translate(0, 0)">
            <rect x="50" y="20" width="900" height="100" rx="12" fill="url(#grad-ds)" stroke="var(--border)" strokeWidth="2" strokeDasharray="4 4" />
            <text x="500" y="45" fill="#D4B8B8" fontSize="14" fontWeight="600" textAnchor="middle" letterSpacing="2">LAYER 1: INDUSTRIAL DATA SOURCES</text>
            
            <g transform="translate(80, 60)">
              <rect width="120" height="40" rx="6" fill="var(--surface-high)" stroke="var(--border-light)" strokeWidth="1" />
              <text x="60" y="25" fill="#F9ECEC" fontSize="12" textAnchor="middle">PDF Documents</text>
            </g>
            <g transform="translate(220, 60)">
              <rect width="120" height="40" rx="6" fill="var(--surface-high)" stroke="var(--border-light)" strokeWidth="1" />
              <text x="60" y="25" fill="#F9ECEC" fontSize="12" textAnchor="middle">P&IDs</text>
            </g>
            <g transform="translate(360, 60)">
              <rect width="120" height="40" rx="6" fill="var(--surface-high)" stroke="var(--border-light)" strokeWidth="1" />
              <text x="60" y="25" fill="#F9ECEC" fontSize="12" textAnchor="middle">Work Orders</text>
            </g>
            <g transform="translate(500, 60)">
              <rect width="120" height="40" rx="6" fill="var(--surface-high)" stroke="var(--border-light)" strokeWidth="1" />
              <text x="60" y="25" fill="#F9ECEC" fontSize="12" textAnchor="middle">Regulations</text>
            </g>
            <g transform="translate(640, 60)">
              <rect width="120" height="40" rx="6" fill="var(--surface-high)" stroke="var(--border-light)" strokeWidth="1" />
              <text x="60" y="25" fill="#F9ECEC" fontSize="12" textAnchor="middle">Email Archives</text>
            </g>
            <g transform="translate(780, 60)">
              <rect width="120" height="40" rx="6" fill="var(--surface-high)" stroke="var(--border-light)" strokeWidth="1" />
              <text x="60" y="25" fill="#F9ECEC" fontSize="12" textAnchor="middle">Expert Interviews</text>
            </g>
          </g>

          {/* ARROWS DOWN */}
          <line x1="500" y1="120" x2="500" y2="180" stroke="#4B5563" strokeWidth="2" markerEnd="url(#arrowhead)" />
          <line x1="250" y1="120" x2="250" y2="180" stroke="#4B5563" strokeWidth="2" markerEnd="url(#arrowhead)" />
          <line x1="750" y1="120" x2="750" y2="180" stroke="#4B5563" strokeWidth="2" markerEnd="url(#arrowhead)" />

          {/* LAYER 2: INTELLIGENCE LAYER */}
          <g transform="translate(0, 190)">
            <text x="500" y="0" fill="#D4B8B8" fontSize="14" fontWeight="600" textAnchor="middle" letterSpacing="2">LAYER 2: CORE INTELLIGENCE</text>
            
            {/* SYNAPSE */}
            <g transform="translate(50, 20)">
              <rect width="280" height="120" rx="12" fill="url(#grad-synapse)" stroke="#C49A3C" strokeWidth="2" />
              <text x="140" y="35" fill="#F9ECEC" fontSize="16" fontWeight="bold" textAnchor="middle">SYNAPSE</text>
              <text x="140" y="65" fill="#D4B8B8" fontSize="12" textAnchor="middle">Knowledge Graph Builder</text>
              <text x="140" y="85" fill="#D4B8B8" fontSize="12" textAnchor="middle">Entity Extraction</text>
              <text x="140" y="105" fill="#D4B8B8" fontSize="12" textAnchor="middle">Relationship Inference</text>
            </g>

            {/* ORACLE */}
            <g transform="translate(360, 20)">
              <rect width="280" height="120" rx="12" fill="url(#grad-oracle)" stroke="#C4A882" strokeWidth="2" />
              <text x="140" y="35" fill="#F9ECEC" fontSize="16" fontWeight="bold" textAnchor="middle">ORACLE</text>
              <text x="140" y="65" fill="#D4B8B8" fontSize="12" textAnchor="middle">Hybrid RAG Search</text>
              <text x="140" y="85" fill="#D4B8B8" fontSize="12" textAnchor="middle">Groq Llama 3.3 70B</text>
              <text x="140" y="105" fill="#D4B8B8" fontSize="12" textAnchor="middle">Voice Interface</text>
            </g>

            {/* CHRONICLE */}
            <g transform="translate(670, 20)">
              <rect width="280" height="120" rx="12" fill="url(#grad-chronicle)" stroke="#C49A3C" strokeWidth="2" />
              <text x="140" y="35" fill="#F9ECEC" fontSize="16" fontWeight="bold" textAnchor="middle">CHRONICLE</text>
              <text x="140" y="65" fill="#D4B8B8" fontSize="12" textAnchor="middle">Failure Pattern Mining</text>
              <text x="140" y="85" fill="#D4B8B8" fontSize="12" textAnchor="middle">Expert Capture</text>
              <text x="140" y="105" fill="#D4B8B8" fontSize="12" textAnchor="middle">Precursor Alerts</text>
            </g>

            {/* SPECTRASYNC */}
            <g transform="translate(200, 160)">
              <rect width="600" height="60" rx="12" fill="url(#grad-spectra)" stroke="#D4B896" strokeWidth="2" />
              <text x="300" y="25" fill="#F9ECEC" fontSize="14" fontWeight="bold" textAnchor="middle">SpectraSync Compliance Engine</text>
              <text x="300" y="45" fill="#D4B8B8" fontSize="12" textAnchor="middle">Gap Detection · Regulatory Mapping (OISD / Factory Act / PESO)</text>
            </g>
          </g>

          {/* ARROWS DOWN */}
          <line x1="500" y1="420" x2="500" y2="470" stroke="#4B5563" strokeWidth="2" markerEnd="url(#arrowhead)" />
          <line x1="250" y1="340" x2="250" y2="470" stroke="#4B5563" strokeWidth="2" markerEnd="url(#arrowhead)" />
          <line x1="750" y1="340" x2="750" y2="470" stroke="#4B5563" strokeWidth="2" markerEnd="url(#arrowhead)" />

          {/* LAYER 3: INFRASTRUCTURE */}
          <g transform="translate(0, 480)">
            <rect x="50" y="0" width="900" height="100" rx="12" fill="url(#grad-infra)" stroke="var(--border)" strokeWidth="2" strokeDasharray="4 4" />
            <text x="500" y="25" fill="#D4B8B8" fontSize="14" fontWeight="600" textAnchor="middle" letterSpacing="2">LAYER 3: INFRASTRUCTURE</text>
            
            <g transform="translate(90, 45)">
              <rect width="130" height="40" rx="6" fill="var(--surface-high)" stroke="var(--border-light)" strokeWidth="1" />
              <text x="65" y="20" fill="#F9ECEC" fontSize="11" textAnchor="middle">MongoDB Atlas M0</text>
              <text x="65" y="35" fill="#D4B8B8" fontSize="9" textAnchor="middle">Vector Search (384-d)</text>
            </g>
            <g transform="translate(250, 45)">
              <rect width="130" height="40" rx="6" fill="var(--surface-high)" stroke="var(--border-light)" strokeWidth="1" />
              <text x="65" y="20" fill="#F9ECEC" fontSize="11" textAnchor="middle">Bull Queue</text>
              <text x="65" y="35" fill="#D4B8B8" fontSize="9" textAnchor="middle">Upstash Redis</text>
            </g>
            <g transform="translate(410, 45)">
              <rect width="130" height="40" rx="6" fill="var(--surface-high)" stroke="var(--border-light)" strokeWidth="1" />
              <text x="65" y="20" fill="#F9ECEC" fontSize="11" textAnchor="middle">Groq API</text>
              <text x="65" y="35" fill="#D4B8B8" fontSize="9" textAnchor="middle">800 tokens/sec</text>
            </g>
            <g transform="translate(570, 45)">
              <rect width="130" height="40" rx="6" fill="var(--surface-high)" stroke="var(--border-light)" strokeWidth="1" />
              <text x="65" y="20" fill="#F9ECEC" fontSize="11" textAnchor="middle">Xenova Transformers</text>
              <text x="65" y="35" fill="#D4B8B8" fontSize="9" textAnchor="middle">Local Embeddings</text>
            </g>
            <g transform="translate(730, 45)">
              <rect width="130" height="40" rx="6" fill="var(--surface-high)" stroke="var(--border-light)" strokeWidth="1" />
              <text x="65" y="20" fill="#F9ECEC" fontSize="11" textAnchor="middle">Vercel & Render</text>
              <text x="65" y="35" fill="#D4B8B8" fontSize="9" textAnchor="middle">Deployment</text>
            </g>
          </g>
        </svg>
      </div>
    </div>
  );
}
