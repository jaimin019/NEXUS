/**
 * TopBar — Fixed top navigation bar.
 */
import { Bell, Upload, Search, Server, Activity } from 'lucide-react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useNexusStore from '@/store/nexusStore';

const ROUTE_TO_PAGE = {
  '/': 'dashboard',
  '/synapse': 'synapse',
  '/oracle': 'oracle',
  '/chronicle': 'chronicle',
  '/compliance': 'compliance',
  '/documents': 'documents',
  '/architecture': 'architecture',
};

const PAGE_TITLES = {
  dashboard:  'Dashboard',
  synapse:    'Knowledge Graph — SYNAPSE',
  oracle:     'ORACLE Copilot',
  chronicle:  'CHRONICLE — Failure Intelligence',
  compliance: 'SpectraSync Compliance',
  documents:  'Document Library',
  architecture: 'Architecture Diagram',
};

export default function TopBar({ onUploadClick }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { activePage, setActivePage, activeAlerts, sidebarCollapsed } = useNexusStore();
  
  const [healthStatus, setHealthStatus] = useState(null);

  // Sync activePage with route on navigation
  useEffect(() => {
    const page = ROUTE_TO_PAGE[location.pathname] || 'dashboard';
    setActivePage(page);
  }, [location.pathname, setActivePage]);

  // Fetch health status periodically
  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const res = await fetch('/api/health');
        if (res.ok) {
          const data = await res.json();
          setHealthStatus(data.status); // 'healthy' or 'unhealthy'
        } else {
          setHealthStatus('unhealthy');
        }
      } catch {
        setHealthStatus('unhealthy');
      }
    };
    fetchHealth();
    const interval = setInterval(fetchHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleSearchClick = () => {
    setActivePage('oracle');
    navigate('/oracle');
  };

  const sidebarW = sidebarCollapsed ? 64 : 240;

  return (
    <div
      className="fixed top-0 right-0 z-30 flex items-center px-6 gap-4"
      style={{
        left: sidebarW,
        height: 56,
        background: '#111118',
        borderBottom: '1px solid #1E1E2E',
        transition: 'left 0.25s ease-in-out',
      }}
    >
      {/* Page Title */}
      <div className="flex-1 min-w-0">
        <motion.h1
          key={activePage}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm font-semibold text-nexus-text truncate"
        >
          {PAGE_TITLES[activePage] || 'NEXUS'}
        </motion.h1>
      </div>

      {/* Global Search */}
      <button
        onClick={handleSearchClick}
        className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg
          bg-nexus-bg border border-nexus-border text-nexus-muted
          hover:border-nexus-primary/40 hover:text-nexus-text
          transition-all duration-200 text-sm min-w-[200px]"
      >
        <Search className="w-4 h-4 flex-shrink-0" />
        <span>Ask ORACLE anything…</span>
        <kbd className="ml-auto text-[10px] px-1.5 py-0.5 bg-nexus-surface rounded border border-nexus-border">
          ⌘K
        </kbd>
      </button>

      {/* System Status */}
      <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-nexus-border bg-nexus-surface/50 ml-2">
        <div className="relative flex items-center justify-center w-2.5 h-2.5">
          {healthStatus === 'healthy' ? (
            <>
              <span className="absolute inline-flex w-full h-full rounded-full bg-emerald-400 opacity-20 animate-ping"></span>
              <span className="relative inline-flex w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            </>
          ) : (
            <span className="relative inline-flex w-1.5 h-1.5 rounded-full bg-red-500"></span>
          )}
        </div>
        <span className="text-[10px] font-medium text-nexus-muted">
          {healthStatus === 'healthy' ? 'System Healthy' : (healthStatus === 'unhealthy' ? 'System Issue' : 'Checking...')}
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 ml-auto">
        {/* Architecture Button */}
        <Link
          to="/architecture"
          onClick={() => setActivePage('architecture')}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg
            border border-nexus-primary/30 text-nexus-primary bg-nexus-primary/10
            hover:bg-nexus-primary/20 transition-colors text-xs font-medium"
        >
          <Server className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Architecture</span>
        </Link>

        {/* Upload Button */}
        <button
          onClick={onUploadClick}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg
            bg-nexus-primary hover:bg-nexus-primaryHover
            text-white text-sm font-medium transition-colors duration-200
            shadow-nexus-glow"
        >
          <Upload className="w-4 h-4" />
          <span className="hidden sm:inline">Index Documents</span>
        </button>

        {/* Notifications */}
        <button className="relative p-2 rounded-lg text-nexus-muted hover:text-nexus-text hover:bg-white/5 transition-all duration-200">
          <Bell className="w-5 h-5" />
          {activeAlerts.length > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full
              text-[9px] text-white flex items-center justify-center font-bold animate-pulse">
              {activeAlerts.length > 9 ? '9+' : activeAlerts.length}
            </span>
          )}
        </button>

        {/* User Avatar */}
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-nexus-primary to-nexus-accent
          flex items-center justify-center text-white text-xs font-bold cursor-pointer
          hover:opacity-90 transition-opacity">
          JH
        </div>
      </div>
    </div>
  );
}
