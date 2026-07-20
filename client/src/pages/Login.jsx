import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2, XCircle } from 'lucide-react';
import { login as apiLogin, register as apiRegister } from '@/lib/api';
import useNexusStore from '@/store/nexusStore';

/* ─── Hexagon Logo ─── */
function HexLogo() {
  return (
    <svg width="40" height="40" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M32 4L57.7128 18.8V48.4L32 63.2L6.2872 48.4V18.8L32 4Z"
        fill="url(#hexGradLogin)"
        opacity="0.9"
      />
      <path
        d="M32 16L47.3205 24.8V42.4L32 51.2L16.6795 42.4V24.8L32 16Z"
        fill="var(--bg)"
        opacity="0.6"
      />
      <circle cx="32" cy="33" r="6" fill="#C49A3C" />
      <defs>
        <linearGradient id="hexGradLogin" x1="4" y1="4" x2="60" y2="64" gradientUnits="userSpaceOnUse">
          <stop stopColor="#C49A3C" />
          <stop offset="1" stopColor="#C49A3C" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/* ─── Floating Orbs ─── */
function FloatingOrbs() {
  const orbs = [
    { size: 200, color: '#C49A3C', x: '10%', y: '20%', delay: '0s', duration: '22s' },
    { size: 160, color: '#C49A3C', x: '75%', y: '15%', delay: '3s', duration: '25s' },
    { size: 240, color: '#C49A3C', x: '80%', y: '65%', delay: '6s', duration: '20s' },
    { size: 180, color: '#C49A3C', x: '15%', y: '75%', delay: '9s', duration: '28s' },
  ];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {orbs.map((orb, i) => (
        <div
          key={i}
          className="absolute rounded-full animate-float"
          style={{
            width: orb.size,
            height: orb.size,
            background: orb.color,
            opacity: 0.08,
            filter: 'blur(60px)',
            left: orb.x,
            top: orb.y,
            animationDelay: orb.delay,
            animationDuration: orb.duration,
          }}
        />
      ))}
    </div>
  );
}

export default function Login() {
  const navigate = useNavigate();
  const { setCurrentUser } = useNexusStore();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  // If already logged in, redirect
  useEffect(() => {
    const token = localStorage.getItem('nexus_token');
    if (token) navigate('/dashboard', { replace: true });
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password || (isRegistering && !name)) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError('');

    const { data, error: apiError } = isRegistering 
      ? await apiRegister(name, email, password, 'engineer')
      : await apiLogin(email, password);

    if (apiError) {
      setError(apiError);
      setLoading(false);
      return;
    }

    if (data?.token) {
      localStorage.setItem('nexus_token', data.token);
      setCurrentUser(data.user);
      navigate('/dashboard', { replace: true });
    } else {
      setError('Unexpected response from server');
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 relative"
      style={{
        background: 'radial-gradient(ellipse at center, #461220 0%, var(--bg) 70%)',
      }}
    >
      <FloatingOrbs />

      <div
        className="card-elevated relative z-10 w-full"
        style={{ maxWidth: 440, padding: 40 }}
      >
        {/* Logo + Header */}
        <div className="flex flex-col items-center mb-8">
          <HexLogo />
          <span
            className="gradient-text mt-2"
            style={{ fontSize: 24, fontWeight: 700, letterSpacing: '0.1em' }}
          >
            NEXUS
          </span>
          <h1 className="mt-4 text-nexus-text" style={{ fontSize: 24, fontWeight: 600 }}>
            {isRegistering ? 'Create an account' : 'Welcome back'}
          </h1>
          <p className="mt-1" style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            {isRegistering ? 'Sign up for the plant intelligence platform' : 'Sign in to your plant intelligence platform'}
          </p>
        </div>

        {/* Divider */}
        <div className="w-full h-px mb-6" style={{ background: 'var(--border)' }} />

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name (Register Only) */}
          {isRegistering && (
            <div>
              <label
                htmlFor="register-name"
                className="block text-xs font-medium mb-1.5"
                style={{ color: 'var(--text-muted)' }}
              >
                Full Name
              </label>
              <input
                id="register-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="nexus-input w-full"
                autoComplete="name"
                disabled={loading}
              />
            </div>
          )}
          {/* Email */}
          <div>
            <label
              htmlFor="login-email"
              className="block text-xs font-medium mb-1.5"
              style={{ color: 'var(--text-muted)' }}
            >
              Email address
            </label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="demo@nexus.ai"
              className="nexus-input w-full"
              autoComplete="email"
              disabled={loading}
            />
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="login-password"
              className="block text-xs font-medium mb-1.5"
              style={{ color: 'var(--text-muted)' }}
            >
              Password
            </label>
            <div className="relative">
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="nexus-input w-full pr-10"
                autoComplete="current-password"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-nexus-textFaint hover:text-nexus-text transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full justify-center"
            style={{ padding: '14px', borderRadius: 8 }}
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                {isRegistering ? 'Signing up...' : 'Signing in...'}
              </>
            ) : (
              isRegistering ? 'Sign Up' : 'Sign In'
            )}
          </button>
        </form>

        {/* Error */}
        {error && (
          <div
            className="flex items-center gap-2 mt-4 px-3 py-2 rounded-lg text-xs"
            style={{ background: 'rgba(194,59,46,0.1)', color: '#B87070' }}
          >
            <XCircle size={14} />
            <span>{error}</span>
          </div>
        )}

        {/* Demo credentials */}
        {!isRegistering && (
          <div
            className="mt-6 px-4 py-3 rounded-lg text-xs"
            style={{
              background: 'var(--surface-high)',
              borderLeft: '3px solid #C49A3C',
              color: 'var(--text-muted)',
            }}
          >
            <span className="font-medium" style={{ color: '#C49A3C' }}>Demo credentials:</span>{' '}
            demo@nexus.ai / nexus2026
          </div>
        )}

        {/* Toggle Register/Login */}
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => {
              setIsRegistering(!isRegistering);
              setError('');
            }}
            className="text-sm font-medium hover:underline"
            style={{ color: '#C49A3C' }}
          >
            {isRegistering
              ? 'Already have an account? Sign in'
              : "Don't have an account? Sign up"}
          </button>
        </div>
      </div>
    </div>
  );
}
