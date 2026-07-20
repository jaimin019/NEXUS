import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Network, Bot, Activity, ShieldCheck, Upload, ArrowRight } from 'lucide-react';

/* ─── Hexagon Logo SVG ─── */
function HexLogo({ size = 64 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M32 4L57.7128 18.8V48.4L32 63.2L6.2872 48.4V18.8L32 4Z"
        fill="url(#hexGradLanding)"
        opacity="0.9"
      />
      <path
        d="M32 16L47.3205 24.8V42.4L32 51.2L16.6795 42.4V24.8L32 16Z"
        fill="var(--bg)"
        opacity="0.6"
      />
      <circle cx="32" cy="33" r="6" fill="#C49A3C" />
      <defs>
        <linearGradient id="hexGradLanding" x1="4" y1="4" x2="60" y2="64" gradientUnits="userSpaceOnUse">
          <stop stopColor="#C49A3C" />
          <stop offset="1" stopColor="#C49A3C" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/* ─── Floating Orbs Background ─── */
function FloatingOrbs() {
  const orbs = [
    { size: 200, color: '#C49A3C', x: '10%', y: '20%', delay: '0s', duration: '22s' },
    { size: 160, color: '#C49A3C', x: '70%', y: '15%', delay: '3s', duration: '25s' },
    { size: 240, color: '#C49A3C', x: '80%', y: '60%', delay: '6s', duration: '20s' },
    { size: 180, color: '#C49A3C', x: '20%', y: '70%', delay: '9s', duration: '28s' },
    { size: 120, color: '#C49A3C', x: '50%', y: '40%', delay: '12s', duration: '24s' },
    { size: 140, color: '#C49A3C', x: '35%', y: '85%', delay: '15s', duration: '26s' },
  ];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {orbs.map((orb, i) => (
        <div
          key={i}
          className="absolute rounded-full animate-float"
          style={{
            width: orb.size,
            height: orb.size,
            background: orb.color,
            opacity: 0.08,
            filter: 'blur(60px)',
            left: orb.x,
            top: orb.y,
            animationDelay: orb.delay,
            animationDuration: orb.duration,
          }}
        />
      ))}
    </div>
  );
}

/* ─── Feature Card ─── */
function FeatureCard({ icon: Icon, iconColor, title, description, tags }) {
  return (
    <div
      className="card p-7 transition-all duration-200 hover:border-nexus-blush group cursor-default"
    >
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
        style={{ background: 'rgba(196,154,60,0.2)' }}
      >
        <Icon size={28} color={iconColor} />
      </div>
      <h3 className="text-base font-semibold text-nexus-text mb-2">{title}</h3>
      <p className="text-sm text-nexus-textMuted leading-relaxed mb-4">{description}</p>
      <span className="badge badge-muted text-xs">{tags}</span>
    </div>
  );
}

/* ─── Step Card ─── */
function StepCard({ icon: Icon, title, description, number }) {
  return (
    <div className="flex flex-col items-center text-center max-w-xs">
      <div
        className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
        style={{ background: 'rgba(252,185,178,0.15)', border: '1px solid rgba(252,185,178,0.25)' }}
      >
        <Icon size={24} color="#C49A3C" />
      </div>
      <span className="text-caption mb-1">Step {number}</span>
      <h4 className="text-sm font-semibold text-nexus-text mb-2">{title}</h4>
      <p className="text-xs text-nexus-textMuted leading-relaxed">{description}</p>
    </div>
  );
}

/* ─── Main Landing Page ─── */
export default function Landing() {
  const navigate = useNavigate();

  // Check if already logged in
  useEffect(() => {
    const token = localStorage.getItem('nexus_token');
    if (token) {
      navigate('/dashboard', { replace: true });
    }
  }, [navigate]);

  // Enter key -> navigate to dashboard/login
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Enter') {
        const token = localStorage.getItem('nexus_token');
        navigate(token ? '/dashboard' : '/login');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  const handleEnter = () => {
    const token = localStorage.getItem('nexus_token');
    navigate(token ? '/dashboard' : '/login');
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)', color: 'var(--text)' }}>

      {/* ═══ SECTION 1 — HERO ═══ */}
      <section
        className="relative min-h-screen flex flex-col items-center justify-center px-6"
        style={{
          background: 'radial-gradient(ellipse at center, #461220 0%, var(--bg) 70%)',
        }}
      >
        <FloatingOrbs />

        <div className="relative z-10 flex flex-col items-center text-center max-w-2xl">
          {/* Logo */}
          <HexLogo size={72} />
          <h1
            className="gradient-text mt-4"
            style={{ fontSize: 64, fontWeight: 700, letterSpacing: '0.15em', lineHeight: 1.1 }}
          >
            NEXUS
          </h1>

          {/* Subtitle */}
          <p className="mt-3" style={{ color: 'var(--text-muted)', fontSize: 20 }}>
            Industrial Knowledge Intelligence Platform
          </p>

          {/* Tagline */}
          <p
            className="mt-4"
            style={{
              color: 'var(--text)',
              fontSize: 16,
              maxWidth: 480,
              lineHeight: 1.7,
            }}
          >
            Your plant&apos;s collective knowledge — queryable, connected, and continuously updated.
          </p>

          {/* Badge Row */}
          <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
            {['Bharat Refinery Unit-3', '4,847 Documents Indexed', '312 Equipment Nodes'].map((text) => (
              <span
                key={text}
                className="px-4 py-1.5 rounded-full text-xs font-medium"
                style={{
                  background: 'var(--surface-high)',
                  border: '1px solid var(--border)',
                  color: '#C49A3C',
                }}
              >
                {text}
              </span>
            ))}
          </div>

          {/* CTA Button */}
          <button
            onClick={handleEnter}
            className="mt-10 btn-primary"
            style={{
              padding: '16px 48px',
              fontSize: 16,
              fontWeight: 600,
              borderRadius: 8,
              boxShadow: '0 0 24px rgba(140, 47, 57, 0.3)',
            }}
          >
            Enter NEXUS
          </button>

          {/* Hint */}
          <p className="mt-3" style={{ color: 'var(--text-faint)', fontSize: 13 }}>
            or press Enter
          </p>
        </div>
      </section>

      {/* ═══ SECTION 2 — HOW NEXUS WORKS ═══ */}
      <section className="py-20 px-6" style={{ background: 'var(--bg)' }}>
        <div className="max-w-5xl mx-auto">
          <h2 className="gradient-text text-center" style={{ fontSize: 36, fontWeight: 700 }}>
            How NEXUS Works
          </h2>
          <p className="text-center mt-3 mb-12" style={{ color: 'var(--text-muted)', fontSize: 15 }}>
            Four intelligent systems working together to eliminate knowledge fragmentation.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FeatureCard
              icon={Network}
              iconColor="#C49A3C"
              title="SYNAPSE — Knowledge Graph"
              description="Automatically builds a connected graph of every equipment tag, document, and regulation in your plant. See how P-101 connects to HX-204 connects to OISD-GDN-206 — in one visual."
              tags="Entity Extraction · Relationship Inference"
            />
            <FeatureCard
              icon={Bot}
              iconColor="#D4B896"
              title="ORACLE — AI Copilot"
              description="Ask anything about your plant in plain language. Isolation procedures, maintenance history, permit requirements — answered in seconds with full source citations. Works on mobile for field technicians."
              tags="Voice Enabled · Mobile First"
            />
            <FeatureCard
              icon={Activity}
              iconColor="#C49A3C"
              title="CHRONICLE — Failure Intelligence"
              description="Mines historical incident reports to detect failure patterns before they repeat. Also captures undocumented knowledge from retiring engineers through structured interviews."
              tags="Pattern Mining · Expert Capture"
            />
            <FeatureCard
              icon={ShieldCheck}
              iconColor="#D4B896"
              title="SpectraSync — Compliance AI"
              description="Continuously audits your SOPs against OISD, Factory Act, and PESO regulations. Detects gaps, suggests amendments, and tracks resolution — before the auditors arrive."
              tags="OISD · Factory Act · PESO"
            />
          </div>
        </div>
      </section>

      {/* ═══ SECTION 3 — GETTING STARTED ═══ */}
      <section className="py-20 px-6" style={{ background: 'var(--surface)' }}>
        <div className="max-w-5xl mx-auto">
          <h2 className="gradient-text text-center" style={{ fontSize: 36, fontWeight: 700 }}>
            Getting Started
          </h2>

          <div className="flex flex-col md:flex-row items-start justify-center gap-8 mt-14">
            <StepCard
              icon={Upload}
              number={1}
              title="Upload Your Documents"
              description="Go to Documents -> upload SOPs, P&IDs, work orders, inspection reports, or regulations. NEXUS automatically parses, chunks, embeds, and builds the knowledge graph."
            />

            {/* Connector */}
            <div className="hidden md:flex items-center self-center">
              <div className="w-16 border-t border-dashed" style={{ borderColor: 'var(--border)' }} />
            </div>

            <StepCard
              icon={Network}
              number={2}
              title="Explore SYNAPSE"
              description="Navigate to Knowledge Graph to see all equipment relationships. Click any node to see its connected documents, health indicators, and active work orders."
            />

            <div className="hidden md:flex items-center self-center">
              <div className="w-16 border-t border-dashed" style={{ borderColor: 'var(--border)' }} />
            </div>

            <StepCard
              icon={Bot}
              number={3}
              title="Query with ORACLE"
              description="Open the AI Copilot and ask questions in plain English. Use voice input on mobile, or scan equipment QR codes for instant context."
            />
          </div>

          <div className="flex flex-col items-center mt-14">
            <p className="text-sm text-nexus-textMuted mb-3">Ready to begin?</p>
            <button
              onClick={() => navigate('/login')}
              className="btn-primary group text-lg flex items-center justify-center gap-2"
              style={{ padding: '12px 32px' }}
            >
              Enter NEXUS
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </section>

      {/* ═══ SECTION 4 — STATS BAR ═══ */}
      <section className="py-16 px-6" style={{ background: '#461220' }}>
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { value: '35%', desc: 'of engineer time saved searching' },
            { value: '18-22%', desc: 'reduction in unplanned downtime' },
            { value: '4 min', desc: 'compliance audit vs 3 weeks manual' },
            { value: '11 days', desc: 'average failure prediction lead time' },
          ].map((stat) => (
            <div key={stat.value} className="text-center">
              <div className="gradient-text text-3xl md:text-4xl font-bold mb-2">
                {stat.value}
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>{stat.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="py-8 px-6 text-center" style={{ background: 'var(--bg)' }}>
        <p style={{ color: 'var(--text-faint)', fontSize: 12 }}>
          NEXUS · ET AI Hackathon 2026 · Built by Jaimin Hadvani
        </p>
      </footer>
    </div>
  );
}
