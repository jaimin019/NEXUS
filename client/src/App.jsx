import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppShell from '@/components/layout/AppShell';
import Dashboard from '@/pages/Dashboard';
import Documents from '@/pages/Documents';
import { SynapsePage, OraclePage, ChroniclePage, CompliancePage } from '@/pages/Placeholders';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* All pages share the AppShell layout */}
        <Route element={<AppShell />}>
          <Route index element={<Dashboard />} />
          <Route path="/synapse" element={<SynapsePage />} />
          <Route path="/oracle" element={<OraclePage />} />
          <Route path="/chronicle" element={<ChroniclePage />} />
          <Route path="/compliance" element={<CompliancePage />} />
          <Route path="/documents" element={<Documents />} />
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
