import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { getMe } from '@/lib/api';
import useNexusStore from '@/store/nexusStore';

export default function ProtectedRoute({ children }) {
  const { currentUser, setCurrentUser } = useNexusStore();
  const [checking, setChecking] = useState(true);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('nexus_token');
    if (!token) {
      setChecking(false);
      setAuthed(false);
      return;
    }

    if (currentUser) {
      setChecking(false);
      setAuthed(true);
      return;
    }

    // Verify token
    getMe().then(({ data, error }) => {
      if (data?.user) {
        setCurrentUser(data.user);
        setAuthed(true);
      } else {
        localStorage.removeItem('nexus_token');
        setAuthed(false);
      }
      setChecking(false);
    });
  }, [currentUser, setCurrentUser]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: 'var(--border)', borderTopColor: 'transparent' }}
          />
          <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Verifying session...</span>
        </div>
      </div>
    );
  }

  if (!authed) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
