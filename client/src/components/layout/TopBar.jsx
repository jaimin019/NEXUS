/**
 * TopBar — Fixed top navigation bar.
 */
import { Bell, Upload, Search } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import useNexusStore from '@/store/nexusStore';

const ROUTE_TO_PAGE = {
  '/': 'dashboard',
  '/synapse': 'synapse',
  '/oracle': 'oracle',
  '/chronicle': 'chronicle',
  '/compliance': 'compliance',
  '/documents': 'documents',
};

const PAGE_TITLES = {
  dashboard:  'Dashboard',
  synapse:    'Knowledge Graph — SYNAPSE',
  oracle:     'ORACLE Copilot',
  chronicle:  'CHRONICLE — Failure Intelligence',
  compliance: 'SpectraSync Compliance',
  documents:  'Document Library',
};

export default function TopBar({ onUploadClick }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { activePage, setActivePage, activeAlerts, sidebarCollapsed } = useNexusStore();

  // Sync activePage with route on navigation
  useEffect(() => {
    const page = ROUTE_TO_PAGE[location.pathname] || 'dashboard';
    setActivePage(page);
  }, [location.pathname, setActivePage]);

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

      {/* Actions */}
      <div className="flex items-center gap-2">
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
