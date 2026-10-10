import React, { useEffect, useState } from 'react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import { ROLE_THEMES, StatCard, StatusBadge, EmptyState, TableSkeleton } from '../components/shared';
import { 
  CreditCard, Users, FileText, CheckCircle2, Clock, 
  TrendingUp, TestTube, Pill, AlertTriangle, Activity, Calendar
} from 'lucide-react';

export default function AdminDashboard() {
  const { user } = useAuth();
  const theme = ROLE_THEMES.ADMIN;
  const [metrics, setMetrics] = useState(null);
  const [recentBills, setRecentBills] = useState([]);
  const [recentAppointments, setRecentAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      client.get('/admin/metrics').catch(() => ({ data: null })),
      client.get('/billing').catch(() => ({ data: [] })),
      client.get('/appointments').catch(() => ({ data: [] })),
    ])
      .then(([metricsRes, billsRes, aptsRes]) => {
        setMetrics(metricsRes.data);
        setRecentBills(billsRes.data || []);
        setRecentAppointments(aptsRes.data || []);
      })
      .finally(() => setLoading(false));
  }, []);

  const totalPatients = metrics?.totalPatients ?? '—';
  const totalDoctors = metrics?.totalDoctors ?? '—';
  const totalStaffUsers = metrics?.totalUsers ?? '—';
  const totalAppointments = metrics?.totalAppointments ?? recentAppointments.length;
  const todayAppointments = metrics?.todayAppointments ?? 0;
  const pendingAppointments = metrics?.pendingAppointments ?? 0;
  const revenueCollected = metrics?.revenueCollected ?? 0;
  const pendingRevenue = metrics?.pendingRevenue ?? 0;
  const pendingLabTests = metrics?.pendingLabTests ?? 0;
  const lowStockMedicines = metrics?.lowStockMedicines ?? 0;
  const expiringMedicines = metrics?.expiringMedicines ?? 0;

  const todayStr = new Date().toISOString().split('T')[0];
  const todayApptsList = recentAppointments.filter(a => a.appointmentDate === todayStr);

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="rounded-xl p-5 md:p-6 text-white" style={{ background: theme.gradient }}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Activity className="w-6 h-6" /> Admin Control Center
            </h2>
            <p className="text-white/80 text-sm mt-1">
              Live database-backed hospital performance metrics — {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="bg-white/20 backdrop-blur-sm px-3.5 py-1.5 rounded-lg text-xs font-semibold">
              Live Database Active
            </span>
          </div>
        </div>
      </div>

      {/* Primary Key Performance Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Patients" value={loading ? '—' : totalPatients} theme={theme} />
        <StatCard icon={Activity} label="Doctors On Duty" value={loading ? '—' : totalDoctors} theme={{ ...theme, primary: '#7C3AED', bg10: 'rgba(124,58,237,0.1)' }} />
        <StatCard icon={Calendar} label="Total Appointments" value={loading ? '—' : totalAppointments} theme={{ ...theme, primary: '#0284C7', bg10: 'rgba(2,132,199,0.1)' }} />
        <StatCard icon={Users} label="Registered Accounts" value={loading ? '—' : totalStaffUsers} theme={{ ...theme, primary: '#475569', bg10: 'rgba(71,85,105,0.1)' }} />
      </div>

      {/* Operational Highlights Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={TrendingUp}
          label="Revenue Collected"
          value={loading ? '—' : `₹${revenueCollected.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          theme={{ ...theme, primary: '#10B981', bg10: 'rgba(16,185,129,0.1)' }}
        />
        <StatCard
          icon={Clock}
          label="Outstanding Revenue"
          value={loading ? '—' : `₹${pendingRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          theme={{ ...theme, primary: '#D97706', bg10: 'rgba(217,119,6,0.1)' }}
        />
        <StatCard
          icon={TestTube}
          label="Pending Lab Tests"
          value={loading ? '—' : pendingLabTests}
          theme={{ ...theme, primary: '#EA580C', bg10: 'rgba(234,88,12,0.1)' }}
        />
        <StatCard
          icon={AlertTriangle}
          label="Low Stock Medicines"
          value={loading ? '—' : lowStockMedicines}
          subtitle={expiringMedicines > 0 ? `${expiringMedicines} expiring soon` : 'Stock normal'}
          theme={{ ...theme, primary: '#DC2626', bg10: 'rgba(220,38,38,0.1)' }}
        />
      </div>

      {/* Operational Split View: Today's Appointments & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Appointments */}
        <div className="card">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              <Calendar style={{ width: 16, height: 16, color: theme.primary }} />
              Today's Schedule & Appointments
            </h3>
            <span
              className="text-xs font-semibold px-2.5 py-1 rounded-full text-white"
              style={{ backgroundColor: theme.primary }}
            >
              {todayApptsList.length} today ({pendingAppointments} pending)
            </span>
          </div>
          <div className="overflow-x-auto max-h-80">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Doctor</th>
                  <th>Time</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {loading && <TableSkeleton rows={3} cols={4} />}
                {!loading && todayApptsList.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400">
                      No appointments scheduled for today.
                    </td>
                  </tr>
                )}
                {!loading && todayApptsList.map(apt => (
                  <tr key={apt.id}>
                    <td className="font-medium text-slate-800">{apt.patientName || `Patient #${apt.patientId}`}</td>
                    <td className="text-slate-600">Dr. {apt.doctorName}</td>
                    <td className="text-slate-700 font-medium">{apt.appointmentTime}</td>
                    <td><StatusBadge status={apt.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Live Billing Activity */}
        <div className="card">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              <CreditCard style={{ width: 16, height: 16, color: theme.primary }} />
              Recent Billing Transactions
            </h3>
            <span className="text-xs text-slate-500">{recentBills.length} total records</span>
          </div>
          <div className="overflow-x-auto max-h-80">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Bill #</th>
                  <th>Patient</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {loading && <TableSkeleton rows={3} cols={5} />}
                {!loading && recentBills.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      No billing activity recorded yet.
                    </td>
                  </tr>
                )}
                {!loading && recentBills.slice(0, 5).map(b => (
                  <tr key={b.id}>
                    <td className="font-semibold text-slate-800">#{b.id}</td>
                    <td className="text-slate-700">{b.patientName ? b.patientName : `Patient #${b.patientId}`}</td>
                    <td className="text-slate-500 text-xs">{b.billDate}</td>
                    <td className="font-bold text-slate-900">₹{(b.totalAmount || 0).toFixed(2)}</td>
                    <td><StatusBadge status={b.paymentStatus} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
