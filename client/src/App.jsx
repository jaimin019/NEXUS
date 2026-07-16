import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppShell from '@/components/layout/AppShell';
import Dashboard from '@/pages/Dashboard';
import Documents from '@/pages/Documents';
import Synapse from '@/pages/Synapse';
import Compliance from '@/pages/Compliance';
import Oracle from '@/pages/Oracle';
import { ChroniclePage } from '@/pages/Placeholders';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* All pages share the AppShell layout */}
        <Route element={<AppShell />}>
          <Route index element={<Dashboard />} />
          <Route path="/synapse" element={<Synapse />} />
          <Route path="/oracle" element={<Oracle />} />
          <Route path="/chronicle" element={<ChroniclePage />} />
          <Route path="/compliance" element={<Compliance />} />
          <Route path="/documents" element={<Documents />} />
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
