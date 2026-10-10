import React, { useState, useEffect } from 'react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import { ROLE_THEMES, StatusBadge, EmptyState, StatCard } from '../components/shared';
import { CreditCard, CheckCircle2, AlertCircle, Clock, Info } from 'lucide-react';

export default function MyBills() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  // Use role-specific theme colour
  const theme = ROLE_THEMES[user?.role] || ROLE_THEMES.PATIENT;
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    if (isAdmin) {
      // Admin sees all bills
      fetchBills('/billing');
    } else if (user?.patientId) {
      fetchBills(`/billing/patient/${user.patientId}`);
    } else {
      setLoading(false);
      if (user?.role === 'PATIENT') {
        setError('Patient profile not linked. Please log out and back in.');
      }
    }
  }, [user]);

  const fetchBills = async (url) => {
    setLoading(true);
    try {
      const res = await client.get(url);
      setBills(res.data || []);
      setError(null);
    } catch {
      setError('Failed to load billing information.');
    } finally {
      setLoading(false);
    }
  };

  // IMPORTANT: Backend BillResponse uses paymentStatus (not status),
  // consultationCharge (not consultationFee), laboratoryCharge (not labCharges),
  // medicineCharge (not medicineCharges)
  const totalPaid    = bills.filter(b => b.paymentStatus === 'PAID').reduce((s, b) => s + (b.totalAmount || 0), 0);
  const totalPending = bills.filter(b => b.paymentStatus === 'PENDING').reduce((s, b) => s + (b.totalAmount || 0), 0);
  const pendingCount = bills.filter(b => b.paymentStatus === 'PENDING').length;

  const filtered = filter === 'ALL' ? bills : bills.filter(b => b.paymentStatus === filter);

  const fmtCurrency = (val) =>
    `\u20b9${(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

  const LineItem = ({ label, value }) => (
    <div className="flex justify-between items-center py-1.5">
      <span className="text-xs text-slate-500">{label}</span>
      <span className="text-xs font-semibold text-slate-700">{fmtCurrency(value)}</span>
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          {isAdmin ? 'All Bills' : 'My Bills'}
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          {bills.length} total bill{bills.length !== 1 ? 's' : ''}
        </p>
      </div>

      {error && (
        <div className="card p-4 bg-red-50 border-red-200 flex items-center gap-3 text-red-700 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" /> {error}
        </div>
      )}

      {/* Stat row */}
      {!loading && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard icon={CreditCard} label="Total Bills" value={bills.length} theme={theme} />
          <StatCard
            icon={Clock}
            label="Outstanding"
            value={fmtCurrency(totalPending)}
            theme={{ ...theme, primary: '#D97706', bg10: 'rgba(217,119,6,0.1)' }}
            subtitle={pendingCount > 0 ? `${pendingCount} unpaid` : 'All paid'}
          />
          <StatCard
            icon={CheckCircle2}
            label="Total Paid"
            value={fmtCurrency(totalPaid)}
            theme={{ ...theme, primary: '#10B981', bg10: 'rgba(16,185,129,0.1)' }}
          />
        </div>
      )}

      {/* Payment notice — only for patients */}
      {!isAdmin && (
        <div className="card p-4 bg-blue-50 border-blue-100 flex gap-3 text-blue-700 text-sm">
          <Info className="w-5 h-5 flex-shrink-0 text-blue-500 mt-0.5" />
          <p>
            Online payment gateway integration is pending. To pay a bill, please visit
            the hospital front desk or cashier counter.
          </p>
        </div>
      )}

      {/* Filter */}
      <div className="flex items-center gap-2">
        {['ALL', 'PENDING', 'PAID'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all"
            style={
              filter === f
                ? { backgroundColor: theme.primary, color: 'white' }
                : { backgroundColor: '#F1F5F9', color: '#64748B' }
            }
          >
            {f}{' '}
            {f !== 'ALL' && (
              <span className="ml-1 text-xs opacity-75">
                ({bills.filter(b => b.paymentStatus === f).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Bills grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="card p-5 space-y-3">
              <div className="skeleton h-5 w-1/3 rounded" />
              <div className="skeleton h-4 w-full rounded" />
              <div className="skeleton h-4 w-3/4 rounded" />
              <div className="skeleton h-10 w-full rounded" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card py-12">
          <EmptyState icon={CreditCard} message="No bills found." />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(bill => (
            <div
              key={bill.id}
              className="card overflow-visible"
              style={{
                borderLeft: `4px solid ${bill.paymentStatus === 'PAID' ? '#10B981' : '#F59E0B'}`,
              }}
            >
              {/* Bill header */}
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: theme.bg10 }}
                  >
                    <CreditCard style={{ width: 18, height: 18, color: theme.primary }} />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 text-sm">Bill #{bill.id}</p>
                    <p className="text-xs text-slate-400">{bill.billDate}</p>
                  </div>
                </div>
                <StatusBadge status={bill.paymentStatus} />
              </div>

              {/* Line items — using correct backend field names */}
              <div className="px-5 py-4 space-y-0.5">
                <LineItem label="Consultation Fee"  value={bill.consultationCharge} />
                <LineItem label="Lab Charges"       value={bill.laboratoryCharge} />
                <LineItem label="Medicine Charges"  value={bill.medicineCharge} />
                {(bill.otherCharges || 0) > 0 && (
                  <LineItem label="Other Charges" value={bill.otherCharges} />
                )}
                <div className="border-t border-slate-100 mt-2 pt-2 flex justify-between items-center">
                  <span className="text-sm font-bold text-slate-800">Total</span>
                  <span
                    className="text-lg font-extrabold"
                    style={{ color: bill.paymentStatus === 'PAID' ? '#10B981' : '#D97706' }}
                  >
                    {fmtCurrency(bill.totalAmount)}
                  </span>
                </div>
              </div>

              {/* Patient CTA only */}
              {bill.paymentStatus === 'PENDING' && !isAdmin && (
                <div className="px-5 pb-4">
                  <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-700 text-center">
                    Please pay at the hospital front desk
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
