import React, { useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Activity, Eye, EyeOff, ChevronRight, ArrowLeft, CheckCircle2,
  Stethoscope, ShieldCheck, FlaskConical, Pill
} from 'lucide-react';
import client from '../api/client';

const STAFF_ROLES = [
  { value: 'DOCTOR',   label: 'Doctor',    icon: Stethoscope,  color: '#7C3AED', bg: '#F5F3FF' },
  { value: 'ADMIN',    label: 'Admin',     icon: ShieldCheck,  color: '#2563EB', bg: '#EFF6FF' },
  { value: 'PHARMACY', label: 'Pharmacy',  icon: Pill,         color: '#C026D3', bg: '#FDF4FF' },
  { value: 'LAB',      label: 'Lab',       icon: FlaskConical, color: '#EA580C', bg: '#FFF7ED' },
];

function FieldError({ msg }) {
  if (!msg) return null;
  return <p className="text-xs text-red-600 mt-1 font-medium">{msg}</p>;
}

export default function AdminStaffCreate() {
  const { user } = useAuth();

  const [form, setForm] = useState({
    fullName: '',
    username: '',
    email: '',
    phone: '',
    role: '',
    specialization: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);

  // Gate: only ADMIN can see this page
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'ADMIN') return <Navigate to="/" replace />;

  const setField = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: '' }));
    setApiError('');
  };

  const validate = () => {
    const errs = {};

    if (!form.fullName.trim()) errs.fullName = 'Full name is required.';
    if (!form.username.trim()) errs.username = 'Username is required.';
    else if (!/^[a-zA-Z0-9_]{3,50}$/.test(form.username))
      errs.username = 'Username: 3–50 chars, letters/digits/underscores only.';

    if (!form.email.trim()) errs.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Enter a valid email.';

    if (!form.phone.trim()) errs.phone = 'Phone is required.';
    else if (!/^[+]?[0-9\-\s]{7,20}$/.test(form.phone)) errs.phone = 'Enter a valid phone number.';

    if (!form.role) errs.role = 'Please select a role.';

    if (form.role === 'DOCTOR' && !form.specialization.trim())
      errs.specialization = 'Specialization is required for doctors.';

    if (!form.password) errs.password = 'Password is required.';
    else if (form.password.length < 8) errs.password = 'Password must be at least 8 characters.';
    else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/.test(form.password))
      errs.password = 'Password must include uppercase, lowercase, and a digit.';

    if (!form.confirmPassword) errs.confirmPassword = 'Please confirm the password.';
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

    const payload = {
      fullName: form.fullName.trim(),
      username: form.username.trim(),
      email: form.email.trim().toLowerCase(),
      phone: form.phone.trim(),
      role: form.role,
      password: form.password,
    };
    if (form.role === 'DOCTOR' && form.specialization.trim()) {
      payload.specialization = form.specialization.trim();
    }

    try {
      const res = await client.post('/admin/staff', payload);
      setSuccess(res.data);
      setForm({ fullName: '', username: '', email: '', phone: '', role: '', specialization: '', password: '', confirmPassword: '' });
    } catch (err) {
      const data = err?.response?.data;
      if (data?.fieldErrors) {
        setErrors(data.fieldErrors);
      } else {
        setApiError(
          data?.message ||
          (err?.response?.status === 409
            ? 'Username or email already exists.'
            : err?.response?.status === 403
            ? 'Access denied. Admin privileges required.'
            : 'Failed to create staff account. Please try again.')
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const selectedRoleDef = STAFF_ROLES.find(r => r.value === form.role);

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Page header */}
      <div className="flex items-center gap-3 mb-2">
        <Link
          to="/"
          className="p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600"
          title="Back to dashboard"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Create Staff Account</h1>
          <p className="text-sm text-slate-500 mt-0.5">Provision a new doctor, admin, pharmacy, or lab account</p>
        </div>
      </div>

      {/* Success notification */}
      {success && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-emerald-800">Staff account created successfully!</p>
            <p className="text-sm text-emerald-700 mt-0.5">
              Username: <strong>{success.username}</strong> · Role: <strong>{success.role}</strong>
            </p>
          </div>
        </div>
      )}

      {/* Form card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8">
        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          {apiError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium flex items-start gap-2">
              <span className="flex-shrink-0 mt-0.5">⚠</span>
              <span>{apiError}</span>
            </div>
          )}

          {/* Role selector */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Staff Role <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {STAFF_ROLES.map(r => {
                const Icon = r.icon;
                const isSelected = form.role === r.value;
                return (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setField('role', r.value)}
                    className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 transition-all text-sm font-semibold"
                    style={{
                      borderColor: isSelected ? r.color : '#E2E8F0',
                      backgroundColor: isSelected ? r.bg : 'white',
                      color: isSelected ? r.color : '#64748B',
                    }}
                  >
                    <Icon style={{ width: 20, height: 20 }} />
                    {r.label}
                  </button>
                );
              })}
            </div>
            <FieldError msg={errors.role} />
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
              placeholder="e.g. Dr. Jane Smith"
              value={form.fullName}
              onChange={e => setField('fullName', e.target.value)}
            />
            <FieldError msg={errors.fullName} />
          </div>

          {/* Doctor specialization (conditional) */}
          {form.role === 'DOCTOR' && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Specialization <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className={`input-field ${errors.specialization ? 'border-red-400' : ''}`}
                placeholder="e.g. Cardiology, Pediatrics"
                value={form.specialization}
                onChange={e => setField('specialization', e.target.value)}
              />
              <FieldError msg={errors.specialization} />
            </div>
          )}

          {/* Username */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Username <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              autoComplete="off"
              className={`input-field ${errors.username ? 'border-red-400' : ''}`}
              placeholder="e.g. dr_jane_smith"
              value={form.username}
              onChange={e => setField('username', e.target.value)}
            />
            <FieldError msg={errors.username} />
          </div>

          {/* Email + Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                autoComplete="off"
                className={`input-field ${errors.email ? 'border-red-400' : ''}`}
                placeholder="jane.smith@hospital.com"
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
                autoComplete="off"
                className={`input-field ${errors.phone ? 'border-red-400' : ''}`}
                placeholder="+1-555-0101"
                value={form.phone}
                onChange={e => setField('phone', e.target.value)}
              />
              <FieldError msg={errors.phone} />
            </div>
          </div>

          {/* Password fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Temporary Password <span className="text-red-500">*</span>
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
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <FieldError msg={errors.password} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  autoComplete="new-password"
                  className={`input-field pr-10 ${errors.confirmPassword ? 'border-red-400' : ''}`}
                  placeholder="Re-enter password"
                  value={form.confirmPassword}
                  onChange={e => setField('confirmPassword', e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <FieldError msg={errors.confirmPassword} />
            </div>
          </div>

          <p className="text-xs text-slate-400">
            💡 The staff member should change this password on first login.
          </p>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl text-white font-bold text-base transition-all"
            style={{
              background: selectedRoleDef
                ? `linear-gradient(135deg, ${selectedRoleDef.color}, ${selectedRoleDef.color}CC)`
                : 'linear-gradient(135deg, #2563EB, #1D4ED8)',
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
                Create Staff Account <ChevronRight className="w-4 h-4" />
              </span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
