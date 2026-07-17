import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import AppShell from '@/components/layout/AppShell';
import Dashboard from '@/pages/Dashboard';
import Documents from '@/pages/Documents';
import Synapse from '@/pages/Synapse';
import Compliance from '@/pages/Compliance';
import Oracle from '@/pages/Oracle';
import Chronicle from '@/pages/Chronicle';
import Architecture from '@/pages/Architecture';
import { ToastProvider } from '@/components/ui/Toast';
import useNexusStore from '@/store/nexusStore';

// Global keyboard shortcuts component inside Router context
function GlobalKeybinds() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setActivePage } = useNexusStore();

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+K / Cmd+K: Focus ORACLE query input or navigate to /oracle
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (location.pathname !== '/oracle') {
          setActivePage('oracle');
          navigate('/oracle');
        } else {
          const queryInput = document.querySelector('textarea[placeholder*="Ask ORACLE"], input[placeholder*="Ask ORACLE"]');
          if (queryInput) queryInput.focus();
        }
      }

      // Ctrl+G / Cmd+G: Navigate to /synapse (graph)
      if ((e.metaKey || e.ctrlKey) && e.key === 'g') {
        e.preventDefault();
        if (location.pathname !== '/synapse') {
          setActivePage('synapse');
          navigate('/synapse');
        }
      }

      // Escape: Close open modals if any
      if (e.key === 'Escape') {
        const closeBtns = document.querySelectorAll('button[title="Close"], button[aria-label="Close"]');
        if (closeBtns.length > 0) {
          closeBtns[closeBtns.length - 1].click();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate, location.pathname, setActivePage]);

  return null;
}

export default function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <GlobalKeybinds />
        <Routes>
          {/* All pages share the AppShell layout */}
          <Route element={<AppShell />}>
            <Route index element={<Dashboard />} />
            <Route path="/synapse" element={<Synapse />} />
            <Route path="/oracle" element={<Oracle />} />
            <Route path="/chronicle" element={<Chronicle />} />
            <Route path="/compliance" element={<Compliance />} />
            <Route path="/documents" element={<Documents />} />
            <Route path="/architecture" element={<Architecture />} />
            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}
