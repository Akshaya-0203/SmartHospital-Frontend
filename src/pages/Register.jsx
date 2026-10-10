import React, { useState } from 'react';
import { Navigate, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Activity, Eye, EyeOff, ChevronRight, ArrowLeft, CheckCircle2 } from 'lucide-react';
import client from '../api/client';

const GENDER_OPTIONS = ['Male', 'Female', 'Non-binary', 'Prefer not to say'];

function FieldError({ msg }) {
  if (!msg) return null;
  return <p className="text-xs text-red-600 mt-1 font-medium">{msg}</p>;
}

function PasswordStrength({ password }) {
  if (!password) return null;
  const checks = {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    digit: /\d/.test(password),
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const bars = [
    { threshold: 1, color: '#EF4444' },
    { threshold: 2, color: '#F59E0B' },
    { threshold: 3, color: '#3B82F6' },
    { threshold: 4, color: '#10B981' },
  ];
  const label = ['', 'Weak', 'Fair', 'Good', 'Strong'][passed];
  const barColor = bars.find(b => passed <= b.threshold)?.color || '#10B981';

  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-1">
        {[1, 2, 3, 4].map(n => (
          <div
            key={n}
            className="h-1 flex-1 rounded-full transition-all duration-200"
            style={{ backgroundColor: passed >= n ? barColor : '#E2E8F0' }}
          />
        ))}
      </div>
      <div className="flex justify-between text-xs text-slate-400">
        <span className="space-x-2">
          <span style={{ color: checks.length ? '#10B981' : undefined }}>8+ chars</span>
          <span style={{ color: checks.upper ? '#10B981' : undefined }}>A–Z</span>
          <span style={{ color: checks.lower ? '#10B981' : undefined }}>a–z</span>
          <span style={{ color: checks.digit ? '#10B981' : undefined }}>0–9</span>
        </span>
        <span style={{ color: barColor, fontWeight: 600 }}>{label}</span>
      </div>
    </div>
  );
}

export default function Register() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: '',
    username: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    password: '',
    confirmPassword: '',
    role: 'PATIENT',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const setField = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: '' }));
    setApiError('');
  };

  const validate = () => {
    const errs = {};

    if (!form.fullName.trim()) errs.fullName = 'Full name is required.';
    else if (form.fullName.trim().length < 2) errs.fullName = 'Name must be at least 2 characters.';

    if (!form.username.trim()) errs.username = 'Username is required.';
    else if (!/^[a-zA-Z0-9_]{3,50}$/.test(form.username))
      errs.username = 'Username must be 3–50 chars using only letters, digits, and underscores.';

    if (!form.email.trim()) errs.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Enter a valid email address.';

    if (!form.phone.trim()) errs.phone = 'Phone number is required.';
    else if (!/^[+]?[0-9\-\s]{7,20}$/.test(form.phone)) errs.phone = 'Enter a valid phone number.';

    if (!form.dateOfBirth) errs.dateOfBirth = 'Date of birth is required.';
    else {
      const dob = new Date(form.dateOfBirth);
      const today = new Date();
      if (dob >= today) errs.dateOfBirth = 'Date of birth must be in the past.';
    }

    if (!form.password) errs.password = 'Password is required.';
    else if (form.password.length < 8) errs.password = 'Password must be at least 8 characters.';
    else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/.test(form.password))
      errs.password = 'Password must include uppercase, lowercase, and a digit.';

    if (!form.confirmPassword) errs.confirmPassword = 'Please confirm your password.';
    else if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match.';

    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setLoading(true);
    setApiError('');

    try {
      await client.post('/auth/register', {
        fullName: form.fullName.trim(),
        username: form.username.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        dateOfBirth: form.dateOfBirth,
        gender: form.gender || 'Unspecified',
        password: form.password,
        role: form.role,
      });
      setSuccess(true);
    } catch (err) {
      const data = err?.response?.data;
      if (data?.fieldErrors) {
        // Map server-side field errors to local state
        const serverErrors = {};
        for (const [field, msg] of Object.entries(data.fieldErrors)) {
          serverErrors[field] = msg;
        }
        setErrors(serverErrors);
      } else {
        setApiError(
          data?.message ||
          (err?.response?.status === 409
            ? 'An account with this username or email already exists.'
            : 'Registration failed. Please try again.')
        );
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F0F4F8' }}>
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Account created!</h2>
          <p className="text-slate-500 mb-6">
            Account created successfully. You can now sign in.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="w-full py-3 rounded-xl text-white font-bold text-base"
            style={{ background: 'linear-gradient(135deg, #0D9488, #0F766E)' }}
          >
            Go to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#F0F4F8' }}>
      {/* Left branding panel */}
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
            Join Smart Hospital<br />as a Patient
          </h1>
          <p className="text-white/70 text-lg leading-relaxed">
            Create your patient account to manage appointments, access medical records, and view your bills — all in one place.
          </p>
          <div className="mt-8 space-y-3">
            {[
              { icon: '📅', text: 'Book appointments online' },
              { icon: '📋', text: 'Access your medical records' },
              { icon: '💊', text: 'View prescriptions' },
              { icon: '💳', text: 'Manage your billing' },
            ].map(f => (
              <div key={f.text} className="flex items-center gap-3 bg-white/10 rounded-lg px-4 py-2.5">
                <span className="text-lg">{f.icon}</span>
                <span className="text-sm text-white/90 font-medium">{f.text}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="text-white/40 text-sm">© 2026 Smart Hospital Management System</p>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 overflow-y-auto">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2 mb-6">
          <Activity className="w-8 h-8" style={{ color: '#0D9488' }} />
          <span className="text-2xl font-bold text-slate-900">Smart Hospital</span>
        </div>

        <div className="w-full max-w-md">
          {/* Back to login */}
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Sign In
          </Link>

          <div className="mb-6">
            <h2 className="text-3xl font-extrabold text-slate-900">Create account</h2>
            <p className="text-slate-500 mt-1.5">Account registration</p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {apiError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium flex items-start gap-2">
                <span className="flex-shrink-0 mt-0.5">⚠</span>
                <span>{apiError}</span>
              </div>
            )}

            {/* Role selection — NOTE: Public role selection is enabled for local academic
                demonstration only. Before any public deployment, restrict staff role
                registration to authenticated admin provisioning via /api/admin/staff. */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Account Role <span className="text-red-500">*</span>
              </label>
              <select
                className="input-field"
                value={form.role}
                onChange={e => setField('role', e.target.value)}
              >
                <option value="PATIENT">Patient</option>
                <option value="DOCTOR">Doctor</option>
                <option value="ADMIN">Admin</option>
                <option value="PHARMACY">Pharmacy</option>
                <option value="LAB">Lab</option>
              </select>
            </div>

            {/* Full name */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                autoComplete="name"
                className={`input-field ${errors.fullName ? 'border-red-400' : ''}`}
                placeholder="e.g. Alice Johnson"
                value={form.fullName}
                onChange={e => setField('fullName', e.target.value)}
              />
              <FieldError msg={errors.fullName} />
            </div>

            {/* Username */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Username <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                autoComplete="username"
                className={`input-field ${errors.username ? 'border-red-400' : ''}`}
                placeholder="e.g. alice_johnson"
                value={form.username}
                onChange={e => setField('username', e.target.value)}
              />
              <FieldError msg={errors.username} />
            </div>

            {/* Email + Phone row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  autoComplete="email"
                  className={`input-field ${errors.email ? 'border-red-400' : ''}`}
                  placeholder="alice@example.com"
                  value={form.email}
                  onChange={e => setField('email', e.target.value)}
                />
                <FieldError msg={errors.email} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Phone <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  autoComplete="tel"
                  className={`input-field ${errors.phone ? 'border-red-400' : ''}`}
                  placeholder="+1-555-0001"
                  value={form.phone}
                  onChange={e => setField('phone', e.target.value)}
                />
                <FieldError msg={errors.phone} />
              </div>
            </div>

            {/* DOB + Gender row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Date of Birth <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  autoComplete="bday"
                  max={new Date().toISOString().split('T')[0]}
                  className={`input-field ${errors.dateOfBirth ? 'border-red-400' : ''}`}
                  value={form.dateOfBirth}
                  onChange={e => setField('dateOfBirth', e.target.value)}
                />
                <FieldError msg={errors.dateOfBirth} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Gender</label>
                <select
                  className="input-field"
                  value={form.gender}
                  onChange={e => setField('gender', e.target.value)}
                >
                  <option value="">Prefer not to say</option>
                  {GENDER_OPTIONS.map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  className={`input-field pr-10 ${errors.password ? 'border-red-400' : ''}`}
                  placeholder="Min 8 chars, A-Z, a-z, 0-9"
                  value={form.password}
                  onChange={e => setField('password', e.target.value)}
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
              <PasswordStrength password={form.password} />
              <FieldError msg={errors.password} />
            </div>

            {/* Confirm password */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  autoComplete="new-password"
                  className={`input-field pr-10 ${errors.confirmPassword ? 'border-red-400' : ''}`}
                  placeholder="Re-enter your password"
                  value={form.confirmPassword}
                  onChange={e => setField('confirmPassword', e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <FieldError msg={errors.confirmPassword} />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-white font-bold text-base transition-all mt-2"
              style={{
                background: 'linear-gradient(135deg, #0D9488, #0F766E)',
                opacity: loading ? 0.7 : 1,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating account…
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Create Account <ChevronRight className="w-4 h-4" />
                </span>
              )}
            </button>
          </form>

          <div className="mt-5 text-center">
            <p className="text-sm text-slate-500">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-teal-600 hover:text-teal-700 hover:underline transition-colors">
                Sign in
              </Link>
            </p>
          </div>
          <p className="text-xs text-slate-400 text-center mt-2">
            
          </p>
        </div>
      </div>
    </div>
  );
}
