/**
 * Sidebar — Fixed left navigation with collapse animation.
 */
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Network, Bot, Activity, ShieldCheck,
  FileStack, ChevronLeft, ChevronRight, Bell
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import useNexusStore from '@/store/nexusStore';

const NAV_ITEMS = [
  { id: 'dashboard',   label: 'Dashboard',       icon: LayoutDashboard, route: '/' },
  { id: 'synapse',     label: 'Knowledge Graph',  icon: Network,         route: '/synapse' },
  { id: 'oracle',      label: 'ORACLE Copilot',   icon: Bot,             route: '/oracle' },
  { id: 'chronicle',   label: 'CHRONICLE',        icon: Activity,        route: '/chronicle' },
  { id: 'compliance',  label: 'Compliance',       icon: ShieldCheck,     route: '/compliance' },
  { id: 'documents',   label: 'Documents',        icon: FileStack,       route: '/documents' },
];

// Hexagon SVG logo
function HexLogo() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M14 2L25.2583 8.5V21.5L14 28L2.74167 21.5V8.5L14 2Z"
        fill="url(#hexGrad)"
        opacity="0.9"
      />
      <path
        d="M14 7L20.9282 11V19L14 23L7.07183 19V11L14 7Z"
        fill="#0A0A0F"
        opacity="0.6"
      />
      <circle cx="14" cy="14" r="3" fill="#06B6D4" />
      <defs>
        <linearGradient id="hexGrad" x1="2" y1="2" x2="26" y2="28" gradientUnits="userSpaceOnUse">
          <stop stopColor="#4F46E5" />
          <stop offset="1" stopColor="#06B6D4" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    sidebarCollapsed, toggleSidebar,
    setActivePage, activeAlerts,
    assets, complianceDashboard
  } = useNexusStore();

  // Check condition: knowledge gaps (< 0.4 completeness)
  const hasKnowledgeGaps = assets.some((a) => (a.knowledge_completeness ?? 1) < 0.4);

  // Check condition: critical compliance gaps
  const hasCriticalComplianceGaps =
    (complianceDashboard?.gaps_by_severity?.Critical ?? 0) > 0 ||
    activeAlerts.some((a) => a.gap_severity === 'Critical' || a.severity === 'HIGH' || a.severity === 'CRITICAL');

  const handleNav = (item) => {
    setActivePage(item.id);
    navigate(item.route);
  };

  const isActive = (item) => {
    if (item.route === '/') return location.pathname === '/';
    return location.pathname.startsWith(item.route);
  };

  return (
    <motion.aside
      animate={{ width: sidebarCollapsed ? 64 : 240 }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      className="fixed left-0 top-0 h-screen z-40 flex flex-col overflow-hidden select-none"
      style={{ background: '#111118', borderRight: '1px solid #1E1E2E' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-14 flex-shrink-0 border-b border-nexus-border">
        <div className="flex-shrink-0 cursor-pointer" onClick={() => navigate('/')}>
          <HexLogo />
        </div>
        <AnimatePresence>
          {!sidebarCollapsed && (
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.15 }}
              onClick={() => navigate('/')}
              className="gradient-text text-lg font-bold tracking-tight whitespace-nowrap cursor-pointer"
            >
              NEXUS
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto no-scrollbar">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item);
          const Icon = item.icon;
          const isSynapse = item.id === 'synapse';
          const isCompliance = item.id === 'compliance';

          return (
            <div key={item.id} className="relative group">
              <button
                onClick={() => handleNav(item)}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left
                  transition-all duration-200 relative
                  ${active
                    ? 'nav-item-active text-nexus-text'
                    : 'text-nexus-textMuted hover:text-nexus-text hover:bg-white/5'}
                `}
              >
                <div className="relative flex-shrink-0">
                  {isSynapse && hasKnowledgeGaps ? (
                    <motion.div
                      animate={{ scale: [1, 1.15, 1], opacity: [0.7, 1, 0.7] }}
                      transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                    >
                      <Icon className={`w-5 h-5 ${active ? 'text-nexus-primary' : 'text-amber-400'}`} />
                    </motion.div>
                  ) : (
                    <Icon className={`w-5 h-5 ${active ? 'text-nexus-primary' : ''}`} />
                  )}

                  {/* Red dot badge for compliance critical gaps */}
                  {isCompliance && hasCriticalComplianceGaps && (
                    <span
                      title="Critical Compliance Gaps Detected"
                      className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-nexus-surface animate-pulse"
                    />
                  )}
                </div>

                <AnimatePresence>
                  {!sidebarCollapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="text-sm font-medium whitespace-nowrap flex items-center justify-between flex-1"
                    >
                      <span>{item.label}</span>
                      {isCompliance && hasCriticalComplianceGaps && (
                        <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" />
                      )}
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>

              {/* Tooltip when collapsed */}
              {sidebarCollapsed && (
                <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 z-50
                  bg-nexus-surface border border-nexus-border rounded-lg px-3 py-1.5
                  text-sm text-nexus-text whitespace-nowrap shadow-xl
                  opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 flex items-center gap-2">
                  <span>{item.label}</span>
                  {isCompliance && hasCriticalComplianceGaps && (
                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Alert badge */}
        {activeAlerts.length > 0 && (
          <div className="mt-3 px-3">
            <AnimatePresence>
              {!sidebarCollapsed ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => navigate('/')}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 cursor-pointer hover:bg-red-500/15 transition-colors"
                >
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse flex-shrink-0" />
                  <Bell className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <span className="text-xs text-red-300 font-medium truncate">{activeAlerts.length} Active Alerts</span>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => navigate('/')}
                  className="flex justify-center cursor-pointer"
                >
                  <div className="relative p-2 rounded-lg hover:bg-white/5">
                    <Bell className="w-5 h-5 text-red-400" />
                    <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-[9px] text-white flex items-center justify-center font-bold">
                      {activeAlerts.length}
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </nav>

      {/* Collapse Toggle */}
      <div className="flex-shrink-0 p-3 border-t border-nexus-border">
        <button
          onClick={toggleSidebar}
          className="w-full flex items-center justify-center p-2 rounded-lg text-nexus-textMuted
            hover:text-nexus-text hover:bg-white/5 transition-all duration-200"
        >
          {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </motion.aside>
  );
}
