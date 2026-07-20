/**
 * TopBar — Fixed top navigation bar. Golden Parchment palette.
 */
import { Search, User, Activity, Layers, LogOut, X } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useNexusStore from '@/store/nexusStore';
import { logout } from '@/lib/api';

const ROUTE_TO_PAGE = {
  '/dashboard': 'dashboard',
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

export default function TopBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { activePage, setActivePage, sidebarCollapsed, currentUser, clearUser } = useNexusStore();

  const [healthStatus, setHealthStatus] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);

  const userMenuRef = useRef(null);

  // Sync activePage with route
  useEffect(() => {
    const page = ROUTE_TO_PAGE[location.pathname] || 'dashboard';
    setActivePage(page);
  }, [location.pathname, setActivePage]);

  // Fetch health status
  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const res = await fetch('/api/health');
        if (res.ok) {
          const data = await res.json();
          setHealthStatus(data.status);
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

  // Click outside to close dropdowns
  useEffect(() => {
    const handler = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setShowUserMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchValue.trim()) {
      setActivePage('oracle');
      navigate('/oracle');
    }
  };

  const handleLogout = () => {
    logout();
    clearUser();
    navigate('/login');
  };

  const sidebarW = sidebarCollapsed ? 68 : 248;

  return (
    <div
      className="fixed top-0 right-0 z-30 flex items-center px-6 gap-4 transition-all duration-200"
      style={{
        left: sidebarW,
        height: 60,
        background: '#FDFAF6',
        borderBottom: '1px solid #E2D9C8',
        boxShadow: '0 1px 0 #E2D9C8',
      }}
    >
      {/* Left — Breadcrumb */}
      <div className="flex-1 min-w-0">
        <motion.h1
          key={activePage}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="truncate"
          style={{ color: '#2C2416', fontWeight: 700, fontSize: 16 }}
        >
          {PAGE_TITLES[activePage] || 'NEXUS'}
        </motion.h1>
        
      </div>

      {/* Center — Search */}
      <form onSubmit={handleSearchSubmit} className="hidden md:flex items-center relative">
        <div
          className="flex items-center gap-2 px-3 py-1.5 transition-all duration-200"
          style={{
            background: '#F5F0E8',
            border: searchFocused ? '1px solid #C49A3C' : '1px solid #E2D9C8',
            borderRadius: 8,
            width: 340,
            boxShadow: searchFocused ? '0 0 0 3px rgba(196,154,60,0.12)' : 'none',
          }}
        >
          <Search className="w-4 h-4 flex-shrink-0" style={{ color: '#C4B49A' }} />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            placeholder="Search equipment, documents, procedures..."
            className="bg-transparent border-none outline-none flex-1"
            style={{ color: '#2C2416', fontSize: 14 }}
          />
          <kbd
            className="px-1.5 py-0.5 rounded"
            style={{ color: '#C4B49A', fontSize: 12, fontFamily: 'inherit' }}
          >
            ⌘K
          </kbd>
        </div>
      </form>

      {/* Right — Actions */}
      <div className="flex items-center gap-3 ml-auto">
        {/* System Health Dot */}
        <div className="hidden lg:flex items-center gap-1.5 group relative">
          <div className="relative w-2.5 h-2.5 flex items-center justify-center">
            {healthStatus === 'healthy' ? (
              <>
                <span className="absolute w-full h-full rounded-full animate-ping" style={{ background: '#7A8C5A', opacity: 0.2 }} />
                <span className="relative w-1.5 h-1.5 rounded-full" style={{ background: '#7A8C5A' }} />
              </>
            ) : healthStatus === 'unhealthy' ? (
              <span className="relative w-1.5 h-1.5 rounded-full" style={{ background: '#A0623A' }} />
            ) : (
              <span className="relative w-1.5 h-1.5 rounded-full" style={{ background: '#C49A3C' }} />
            )}
          </div>
          {/* Tooltip */}
          <div
            className="absolute top-full mt-2 right-0 px-3 py-1.5 rounded-lg text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50"
            style={{ background: '#FDFAF6', border: '1px solid #E2D9C8', color: '#2C2416', boxShadow: '0 4px 20px rgba(44,36,22,0.10)' }}
          >
            {healthStatus === 'healthy' ? 'All systems operational' : healthStatus === 'unhealthy' ? 'System issue detected' : 'Checking...'}
          </div>
        </div>

        

        {/* User Avatar */}
        <div ref={userMenuRef} className="relative">
          <button
            onClick={() => { setShowUserMenu(!showUserMenu); }}
            className="rounded-full flex items-center justify-center cursor-pointer transition-shadow"
            style={{ 
              background: '#C49A3C', 
              color: 'white',
              width: 36,
              height: 36,
              fontSize: 13,
              fontWeight: 700
            }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = '0 0 0 3px rgba(196,154,60,0.2)'}
            onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
          >
            {currentUser?.avatar_initials || 'JH'}
          </button>

          {/* User Menu Dropdown */}
          <AnimatePresence>
            {showUserMenu && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="card-elevated absolute top-full right-0 mt-2 z-50 overflow-hidden"
                style={{ width: 240 }}
              >
                {/* User info — read only, not clickable */}
                <div style={{ padding: '16px', borderBottom: '1px solid #E2D9C8' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: '50%',
                      background: '#C49A3C', color: 'white',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 700, fontSize: 13
                    }}>
                      {currentUser?.avatar_initials || 'U'}
                    </div>
                    <div>
                      <div style={{ color: '#2C2416', fontSize: 14, fontWeight: 700 }}>{currentUser?.name || 'User'}</div>
                      <div style={{ color: '#9B8B70', fontSize: 12 }}>{currentUser?.email || ''}</div>
                      
                    </div>
                  </div>
                  
                </div>

                {/* Architecture link */}
                <div style={{ padding: '8px' }}>
                  <button
                    onClick={() => { navigate('/architecture'); setShowUserMenu(false); }}
                    className="btn-ghost w-full justify-start"
                  >
                    <Layers size={15} />
                    Architecture
                  </button>
                </div>

                {/* Divider */}
                <div style={{ height: 1, background: '#E2D9C8', margin: '0 8px' }} />

                {/* Sign out */}
                <div style={{ padding: '8px' }}>
                  <button
                    onClick={handleLogout}
                    className="btn-ghost w-full justify-start"
                    onMouseEnter={(e) => { e.currentTarget.style.color = '#A0623A'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = '#6B5B3E'; }}
                  >
                    <LogOut size={15} />
                    Sign Out
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
