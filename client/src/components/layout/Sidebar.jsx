/**
 * Sidebar — Fixed left navigation with collapse animation. Golden Parchment palette.
 */
import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Network, Bot, Activity, ShieldCheck,
  FileStack, Layers, ChevronLeft, ChevronRight, LogOut
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import useNexusStore from '@/store/nexusStore';
import { getFailurePatterns, getComplianceDashboard, getAssets, logout } from '@/lib/api';

const NAV_GROUPS = [
  {
    label: 'INTELLIGENCE',
    items: [
      { id: 'dashboard',   label: 'Dashboard',       icon: LayoutDashboard, route: '/dashboard' },
      { id: 'synapse',     label: 'SYNAPSE',          icon: Network,         route: '/synapse' },
      { id: 'oracle',      label: 'ORACLE Copilot',   icon: Bot,             route: '/oracle' },
      { id: 'chronicle',   label: 'CHRONICLE',        icon: Activity,        route: '/chronicle' },
      { id: 'compliance',  label: 'Compliance',       icon: ShieldCheck,     route: '/compliance' },
    ],
  },
  {
    label: 'MANAGEMENT',
    items: [
      { id: 'documents',   label: 'Documents',        icon: FileStack,       route: '/documents' },
      { id: 'architecture',label: 'Architecture',     icon: Layers,          route: '/architecture' },
    ],
  },
];

// Hexagon SVG logo
function HexLogo() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M14 2L25.2583 8.5V21.5L14 28L2.74167 21.5V8.5L14 2Z"
        fill="#C49A3C"
        opacity="0.9"
      />
      <path
        d="M14 7L20.9282 11V19L14 23L7.07183 19V11L14 7Z"
        fill="var(--sidebar)"
        opacity="0.6"
      />
      <circle cx="14" cy="14" r="3" fill="#F5EDD8" />
    </svg>
  );
}

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    sidebarCollapsed, toggleSidebar,
    setActivePage, activeAlerts, currentUser,
    assets, setAssets,
    complianceDashboard, setComplianceDashboard,
    failurePatterns, setFailurePatterns, clearUser,
  } = useNexusStore();

  // Fetch metrics and refresh every 60 seconds
  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const [patRes, compRes, astRes] = await Promise.all([
          getFailurePatterns(),
          getComplianceDashboard(),
          assets.length === 0 ? getAssets() : Promise.resolve({ data: { assets } })
        ]);

        if (patRes.data?.patterns) setFailurePatterns(patRes.data.patterns);
        if (compRes.data) setComplianceDashboard(compRes.data);
        if (astRes.data?.assets && assets.length === 0) setAssets(astRes.data.assets);
      } catch (err) {
        console.warn('[Sidebar] background poll check failed:', err.message);
      }
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 60000);
    return () => clearInterval(interval);
  }, [setFailurePatterns, setComplianceDashboard, setAssets, assets.length]);

  // Check condition: failurePatterns with occurrence_count >= 3
  const highOccurrencePatterns = failurePatterns.filter((p) => (p.occurrence_count || 1) >= 3);
  const hasHighOccurrencePatterns = highOccurrencePatterns.length > 0;

  // Check condition: critical compliance gaps
  const hasCriticalComplianceGaps =
    (complianceDashboard?.gaps_by_severity?.Critical ?? 0) > 0 ||
    activeAlerts.some((a) => a.gap_severity === 'Critical' || a.severity === 'HIGH' || a.severity === 'CRITICAL');

  const handleNav = (item) => {
    setActivePage(item.id);
    navigate(item.route);
  };

  const handleLogout = () => {
    logout();
    clearUser();
    navigate('/login');
  };

  const isActive = (item) => {
    return location.pathname.startsWith(item.route);
  };

  return (
    <motion.aside
      animate={{ width: sidebarCollapsed ? 68 : 248 }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      className="fixed left-0 top-0 h-screen z-40 flex flex-col overflow-hidden select-none"
      style={{ background: '#EDE8DE', borderRight: '1px solid #E2D9C8' }}
    >
      {/* Logo */}
      <div
        className="flex items-center gap-3 px-4 flex-shrink-0"
        style={{ height: 64, borderBottom: '1px solid #E2D9C8' }}
      >
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
              className="gradient-text cursor-pointer"
              style={{ fontWeight: 800, letterSpacing: '0.12em', fontSize: '17px' }}
            >
              NEXUS
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 overflow-y-auto no-scrollbar">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            {/* Section label */}
            <AnimatePresence>
              {!sidebarCollapsed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="px-4 pt-4 pb-1"
                >
                  <span style={{ color: '#C4B49A', fontSize: 10, letterSpacing: '0.1em', fontWeight: 700 }}>
                    {group.label}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            {group.items.map((item) => {
              const active = isActive(item);
              const Icon = item.icon;
              const isChronicle = item.id === 'chronicle';
              const isCompliance = item.id === 'compliance';

              return (
                <div key={item.id} className="relative group px-2 my-0.5">
                  <button
                    onClick={() => handleNav(item)}
                    className="w-full flex items-center gap-3 rounded-lg text-left transition-all duration-150 relative"
                    style={{
                      padding: active ? '9px 12px 9px 9px' : '9px 12px',
                      margin: '2px 8px',
                      background: active ? '#F5EDD8' : 'transparent',
                      borderLeft: active ? '3px solid #C49A3C' : 'none',
                      color: active ? '#C49A3C' : '#6B5B3E',
                      fontWeight: active ? 600 : 500,
                      fontSize: 14
                    }}
                    onMouseEnter={(e) => {
                      if (!active) {
                        e.currentTarget.style.background = 'rgba(196,154,60,0.08)';
                        e.currentTarget.style.color = '#2C2416';
                        e.currentTarget.querySelector('svg').style.color = '#C49A3C';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!active) {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = '#6B5B3E';
                        e.currentTarget.querySelector('svg').style.color = '#9B8B70';
                      }
                    }}
                  >
                    <div className="relative flex-shrink-0">
                      <Icon
                        className="w-5 h-5 transition-colors"
                        style={{ color: active ? '#C49A3C' : '#9B8B70' }}
                      />

                      {/* Compliance badge */}
                      {isCompliance && hasCriticalComplianceGaps && (
                        <span
                          className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-white text-[8px] flex items-center justify-center font-bold animate-pulse"
                          style={{ background: '#C49A3C' }}
                        />
                      )}

                      {/* Chronicle badge */}
                      {isChronicle && hasHighOccurrencePatterns && (
                        <span
                          className="absolute -top-1 -right-1 rounded-full text-white flex items-center justify-center font-bold animate-pulse"
                          style={{ background: '#C49A3C', width: 18, height: 18, fontSize: 10 }}
                        >
                          {highOccurrencePatterns.length}
                        </span>
                      )}
                    </div>

                    <AnimatePresence>
                      {!sidebarCollapsed && (
                        <motion.span
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.15 }}
                          className="whitespace-nowrap"
                        >
                          {item.label}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </button>

                  {/* Tooltip when collapsed */}
                  {sidebarCollapsed && (
                    <div
                      className="absolute left-full ml-2 top-1/2 -translate-y-1/2 z-50 px-3 py-1.5 text-sm whitespace-nowrap shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150"
                      style={{
                        background: 'var(--surface)',
                        border: '1px solid var(--border)',
                        borderRadius: 8,
                        color: 'var(--text)',
                      }}
                    >
                      {item.label}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Bottom: User info + collapse toggle */}
      <div style={{ borderTop: '1px solid #E2D9C8', padding: '16px' }} className="flex-shrink-0">
        {/* User info (expanded only) */}
        <AnimatePresence>
          {!sidebarCollapsed && currentUser && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="pb-2"
            >
              <div className="flex items-center gap-3 rounded-lg mb-2">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{ background: '#C49A3C', color: 'white' }}
                >
                  {currentUser.avatar_initials || 'JH'}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-medium truncate" style={{ color: '#2C2416', fontWeight: 600, fontSize: 14 }}>{currentUser.name}</div>
                  <div className="truncate" style={{ color: '#9B8B70', fontSize: 12 }}>{currentUser.role}</div>
                </div>
              </div>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="btn-ghost w-full justify-start mt-2"
                style={{ color: '#9B8B70' }}
                onMouseEnter={(e) => { e.currentTarget.style.color = '#A0623A'; e.currentTarget.style.background = 'var(--surface-high)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = '#9B8B70'; e.currentTarget.style.background = 'transparent'; }}
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Collapse toggle */}
        <div className="flex justify-center mt-2">
          <button
            onClick={toggleSidebar}
            className="flex items-center justify-center transition-all duration-200"
            style={{ 
              color: '#9B8B70', 
              background: '#F0EBE1', 
              border: '1px solid #E2D9C8', 
              borderRadius: '50%',
              width: 32,
              height: 32,
              padding: 0
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#C49A3C'; e.currentTarget.style.background = '#F5EDD8'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#9B8B70'; e.currentTarget.style.background = '#F0EBE1'; }}
          >
            {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </motion.aside>
  );
}
