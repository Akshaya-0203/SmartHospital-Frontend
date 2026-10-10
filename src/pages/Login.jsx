import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate, Link, useNavigate } from 'react-router-dom';
import { Activity, Eye, EyeOff, ChevronRight, UserPlus } from 'lucide-react';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, user } = useAuth();
  const navigate = useNavigate();

  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      navigate('/');
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        (err?.response?.status === 401
          ? 'Invalid username or password. Please try again.'
          : 'Sign in failed. Please check your connection and try again.');
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#F0F4F8' }}>
      {/* Left panel — branding */}
      <div
        className="hidden lg:flex flex-col justify-between p-12 w-2/5 text-white"
        style={{ background: 'linear-gradient(145deg, #0F766E 0%, #065F46 100%)' }}
      >
        <div className="flex items-center gap-3">
          <div className="bg-white/20 rounded-xl p-2.5">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold">Smart Hospital</span>
        </div>
        <div>
          <h1 className="text-4xl font-extrabold leading-tight mb-4">
            Modern Hospital<br />Management System
          </h1>
          <p className="text-white/70 text-lg leading-relaxed">
            Streamlined care for patients, doctors, pharmacists, and lab staff — all in one secure platform.
          </p>
          <div className="mt-8 grid grid-cols-2 gap-3">
            {['Appointment Management', 'Secure Billing', 'Digital Prescriptions', 'Lab Integration'].map(f => (
              <div key={f} className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-300 flex-shrink-0" />
                <span className="text-sm text-white/90 font-medium">{f}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="text-white/40 text-sm">© 2026 Smart Hospital Management System</p>
      </div>

      {/* Right panel — login form */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2 mb-8">
          <Activity className="w-8 h-8" style={{ color: '#0D9488' }} />
          <span className="text-2xl font-bold text-slate-900">Smart Hospital</span>
        </div>

        <div className="w-full max-w-md">
          <div className="mb-8">
            <h2 className="text-3xl font-extrabold text-slate-900">Sign in</h2>
            <p className="text-slate-500 mt-1.5">Enter your credentials to access your portal</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium flex items-start gap-2">
                <span className="flex-shrink-0 mt-0.5">⚠</span>
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Username</label>
              <input
                type="text"
                required
                autoComplete="username"
                className="input-field"
                placeholder="Enter your username"
                value={username}
                onChange={e => setUsername(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  className="input-field pr-10"
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-white font-bold text-base transition-all"
              style={{
                background: 'linear-gradient(135deg, #0D9488, #0F766E)',
                opacity: loading ? 0.7 : 1,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Signing in…
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Sign In <ChevronRight className="w-4 h-4" />
                </span>
              )}
            </button>
          </form>

          {/* Registration link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-slate-500">
              Don't have an account?{' '}
              <Link
                to="/register"
                className="font-semibold text-teal-600 hover:text-teal-700 hover:underline transition-colors inline-flex items-center gap-1"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Create an account
              </Link>
            </p>
          </div>

          <p className="text-xs text-slate-400 text-center mt-4">
            
          </p>
        </div>
      </div>
    </div>
  );
}
