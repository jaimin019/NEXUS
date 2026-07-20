import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import AppShell from '@/components/layout/AppShell';
import Landing from '@/pages/Landing';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import Documents from '@/pages/Documents';
import Synapse from '@/pages/Synapse';
import Compliance from '@/pages/Compliance';
import Oracle from '@/pages/Oracle';
import Chronicle from '@/pages/Chronicle';
import Architecture from '@/pages/Architecture';
import ErrorBoundary from '@/components/ErrorBoundary';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
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
  const theme = useNexusStore(s => s.theme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('nexus-theme', theme);
  }, [theme]);

  useEffect(() => {
    const savedTheme = 'light';
    useNexusStore.setState({ theme: savedTheme });
  }, []);

  return (
    <ToastProvider>
      <BrowserRouter>
        <GlobalKeybinds />
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />

          {/* Protected routes — wrapped in AppShell layout */}
          <Route element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/synapse" element={<Synapse />} />
            <Route path="/oracle" element={
              <ErrorBoundary>
                <Oracle />
              </ErrorBoundary>
            } />
            <Route path="/chronicle" element={<Chronicle />} />
            <Route path="/compliance" element={<Compliance />} />
            <Route path="/documents" element={<Documents />} />
            <Route path="/architecture" element={<Architecture />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}
