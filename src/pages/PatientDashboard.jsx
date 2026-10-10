import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import { ROLE_THEMES, StatCard, StatusBadge, EmptyState, CardSkeleton } from '../components/shared';
import {
  Calendar, FileText, CreditCard, AlertCircle,
  ArrowRight, Clock, CheckCircle2, Activity
} from 'lucide-react';

export default function PatientDashboard() {
  const { user } = useAuth();
  const theme = ROLE_THEMES.PATIENT;
  const [data, setData] = useState({ appointments: [], prescriptions: [], bills: [], records: [] });
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  useEffect(() => {
    if (user?.patientId) {
      fetchAll();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchAll = async () => {
    try {
      const [aptRes, presRes, billRes, recRes] = await Promise.all([
        client.get(`/appointments/patient/${user.patientId}`),
        client.get(`/prescriptions/patient/${user.patientId}`),
        client.get(`/billing/patient/${user.patientId}`),
        client.get(`/medical-records/patient/${user.patientId}`),
      ]);
      setData({
        appointments: aptRes.data,
        prescriptions: presRes.data,
        bills: billRes.data,
        records: recRes.data,
      });
      setFetchError(null);
    } catch (err) {
      setFetchError('Could not load your data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // --- No patient ID mapped ---
  if (!loading && !user?.patientId) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="card p-8 max-w-md w-full text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4" style={{ color: theme.primary }} />
          <h2 className="text-lg font-bold text-slate-800 mb-2">Profile Not Linked</h2>
          <p className="text-sm text-slate-500">
            Your login account isn't linked to a patient profile yet. Please log out and back in, or contact support.
          </p>
        </div>
      </div>
    );
  }

  const upcoming = data.appointments.filter(a => ['SCHEDULED', 'CONFIRMED'].includes(a.status));
  const activePrescriptions = data.prescriptions.filter(p => p.status === 'ACTIVE');
  const pendingBills = data.bills.filter(b => b.paymentStatus === 'PENDING');
  const outstanding = pendingBills.reduce((sum, b) => sum + (b.totalAmount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div
        className="rounded-xl p-5 md:p-6 text-white flex flex-col md:flex-row md:items-center justify-between gap-4"
        style={{ background: theme.gradient }}
      >
        <div>
          <h2 className="text-xl font-bold">Welcome back, {user.username}!</h2>
          <p className="text-white/80 text-sm mt-1">
            {upcoming.length > 0
              ? `You have ${upcoming.length} upcoming appointment${upcoming.length > 1 ? 's' : ''}.`
              : 'No upcoming appointments scheduled.'}
          </p>
        </div>
        <Link
          to="/appointments"
          className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white font-semibold text-sm px-4 py-2.5 rounded-lg transition-colors flex-shrink-0"
        >
          <Calendar className="w-4 h-4" /> View Appointments
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Calendar} label="Upcoming" value={loading ? '—' : upcoming.length} theme={theme} />
        <StatCard icon={FileText} label="Active Rx" value={loading ? '—' : activePrescriptions.length} theme={theme} />
        <StatCard icon={Activity} label="Records" value={loading ? '—' : data.records.length} theme={theme} />
        <StatCard
          icon={CreditCard}
          label="Outstanding"
          value={loading ? '—' : `₹${outstanding.toLocaleString('en-IN')}`}
          theme={theme}
          subtitle={pendingBills.length > 0 ? `${pendingBills.length} pending bill${pendingBills.length > 1 ? 's' : ''}` : 'All clear'}
        />
      </div>

      {fetchError && (
        <div className="card p-4 border-red-200 bg-red-50 text-red-700 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {fetchError}
        </div>
      )}

      {/* Two-col detail */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Upcoming Appointments */}
        <div className="card">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              <Calendar style={{ width: 16, height: 16, color: theme.primary }} />
              Upcoming Appointments
            </h3>
            <Link to="/appointments" className="text-xs font-semibold flex items-center gap-1 hover:underline" style={{ color: theme.primary }}>
              View all <ArrowRight style={{ width: 12, height: 12 }} />
            </Link>
          </div>
          <div className="p-4">
            {loading ? (
              <div className="space-y-3">
                {[1,2].map(i => <CardSkeleton key={i} />)}
              </div>
            ) : upcoming.length === 0 ? (
              <EmptyState icon={Calendar} message="No upcoming appointments" />
            ) : (
              <div className="space-y-2.5">
                {upcoming.slice(0, 4).map(apt => (
                  <div
                    key={apt.id}
                    className="flex items-center gap-3 p-3 rounded-lg"
                    style={{ backgroundColor: theme.lighter }}
                  >
                    <div
                      className="w-10 h-10 rounded-lg flex flex-col items-center justify-center flex-shrink-0 text-white"
                      style={{ backgroundColor: theme.primary }}
                    >
                      <span className="text-xs font-bold leading-none">
                        {apt.appointmentDate?.split('-')[2] || '??'}
                      </span>
                      <span className="text-xs leading-none opacity-80">
                        {apt.appointmentDate
                          ? new Date(apt.appointmentDate + 'T00:00:00').toLocaleDateString('en-IN', { month: 'short' })
                          : ''}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">Dr. {apt.doctorName}</p>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <Clock style={{ width: 10, height: 10 }} /> {apt.appointmentTime}
                      </p>
                    </div>
                    <StatusBadge status={apt.status} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Pending Bills */}
        <div className="card">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              <CreditCard style={{ width: 16, height: 16, color: theme.primary }} />
              Pending Bills
            </h3>
            <Link to="/billing" className="text-xs font-semibold flex items-center gap-1 hover:underline" style={{ color: theme.primary }}>
              View all <ArrowRight style={{ width: 12, height: 12 }} />
            </Link>
          </div>
          <div className="p-4">
            {loading ? (
              <div className="space-y-3">
                {[1,2].map(i => <CardSkeleton key={i} />)}
              </div>
            ) : pendingBills.length === 0 ? (
              <EmptyState
                icon={CheckCircle2}
                message="No pending bills — you're all clear!"
              />
            ) : (
              <div className="space-y-2.5">
                {pendingBills.slice(0, 4).map(bill => (
                  <div key={bill.id} className="flex items-center justify-between p-3 rounded-lg bg-amber-50 border border-amber-100">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">Bill #{bill.id}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{bill.billDate}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-base font-bold text-amber-700">₹{(bill.totalAmount || 0).toLocaleString('en-IN')}</p>
                      <StatusBadge status="PENDING" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Prescriptions */}
        <div className="card">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              <FileText style={{ width: 16, height: 16, color: theme.primary }} />
              Recent Prescriptions
            </h3>
            <Link to="/records" className="text-xs font-semibold flex items-center gap-1 hover:underline" style={{ color: theme.primary }}>
              View all <ArrowRight style={{ width: 12, height: 12 }} />
            </Link>
          </div>
          <div className="p-4">
            {loading ? (
              <div className="space-y-3">{[1,2].map(i => <CardSkeleton key={i} />)}</div>
            ) : data.prescriptions.length === 0 ? (
              <EmptyState icon={FileText} message="No prescriptions on record" />
            ) : (
              <div className="space-y-2.5">
                {data.prescriptions.slice(0, 4).map(pres => (
                  <div key={pres.id} className="flex items-start justify-between p-3 rounded-lg bg-slate-50">
                    <div className="min-w-0 mr-3">
                      <p className="text-sm font-semibold text-slate-800 truncate">{pres.medicineName}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{pres.dosage} — {pres.frequency}</p>
                      <p className="text-xs text-slate-400 mt-0.5">Dr. {pres.doctorName}</p>
                    </div>
                    <StatusBadge status={pres.status} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Medical Records */}
        <div className="card">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              <Activity style={{ width: 16, height: 16, color: theme.primary }} />
              Recent Medical Records
            </h3>
            <Link to="/records" className="text-xs font-semibold flex items-center gap-1 hover:underline" style={{ color: theme.primary }}>
              View all <ArrowRight style={{ width: 12, height: 12 }} />
            </Link>
          </div>
          <div className="p-4">
            {loading ? (
              <div className="space-y-3">{[1,2].map(i => <CardSkeleton key={i} />)}</div>
            ) : data.records.length === 0 ? (
              <EmptyState icon={Activity} message="No medical records found" />
            ) : (
              <div className="space-y-2.5">
                {data.records.slice(0, 3).map(rec => (
                  <div key={rec.id} className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-800 truncate">{rec.diagnosis}</p>
                      <span className="text-xs text-slate-400 flex-shrink-0">{rec.consultationDate || rec.recordDate}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{rec.treatmentNotes || rec.symptoms}</p>
                    <p className="text-xs text-slate-400 mt-1">Dr. {rec.doctorName}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
