import React, { useEffect, useState } from 'react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import { ROLE_THEMES, StatCard, StatusBadge, EmptyState, TableSkeleton } from '../components/shared';
import { Pill, AlertTriangle, Package, FileText } from 'lucide-react';

export default function PharmacyDashboard() {
  const { user } = useAuth();
  const theme = ROLE_THEMES.PHARMACY;
  const [summary, setSummary] = useState(null);
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      client.get('/pharmacy/medicines/summary'),
      client.get('/prescriptions'),
    ])
      .then(([summRes, presRes]) => {
        setSummary(summRes.data);
        setPrescriptions(presRes.data || []);
      })
      .catch(err => {
        setError('Failed to load pharmacy data.');
      })
      .finally(() => setLoading(false));
  }, []);

  const activePres = prescriptions.filter(p => p.status === 'ACTIVE').length;

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="rounded-xl p-5 md:p-6 text-white" style={{ background: theme.gradient }}>
        <h2 className="text-xl font-bold">Pharmacy Dashboard</h2>
        <p className="text-white/80 text-sm mt-1">Inventory overview and active prescriptions</p>
      </div>

      {error && (
        <div className="card p-4 bg-red-50 border-red-200 text-red-700 text-sm">{error}</div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Package} label="Total Medicines" value={loading ? '—' : (summary?.totalMedicines || 0)} theme={theme} />
        <StatCard
          icon={AlertTriangle}
          label="Low Stock Items"
          value={loading ? '—' : (summary?.lowStockCount || 0)}
          theme={{ ...theme, primary: '#D97706', bg10: 'rgba(217,119,6,0.1)' }}
        />
        <StatCard icon={FileText} label="Active Prescriptions" value={loading ? '—' : activePres} theme={theme} />
        <StatCard
          icon={Pill}
          label="Available Items"
          value={loading ? '—' : (summary?.medicines?.filter(m => m.stockStatus === 'SUFFICIENT').length || 0)}
          theme={{ ...theme, primary: '#10B981', bg10: 'rgba(16,185,129,0.1)' }}
        />
      </div>

      {/* Inventory table */}
      <div className="card">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2">
            <Pill style={{ width: 16, height: 16, color: theme.primary }} />
            Medicine Inventory
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Medicine</th>
                <th>Current Stock</th>
                <th>Min. Level</th>
                <th>Max. Level</th>
                <th>Unit Price</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading && <TableSkeleton rows={3} cols={6} />}
              {!loading && (!summary?.medicines || summary.medicines.length === 0) && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">No medicines in inventory.</td>
                </tr>
              )}
              {!loading && summary?.medicines?.map(med => (
                <tr key={med.id}>
                  <td>
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: theme.bg10 }}
                      >
                        <Pill style={{ width: 15, height: 15, color: theme.primary }} />
                      </div>
                      <span className="font-semibold text-slate-800">{med.name}</span>
                    </div>
                  </td>
                  <td>
                    <span
                      className="font-bold text-base"
                      style={{ color: med.currentStock <= (med.minimumStockLevel || 0) ? '#D97706' : '#10B981' }}
                    >
                      {med.currentStock}
                    </span>
                  </td>
                  <td className="text-slate-600">{med.minimumStockLevel ?? '—'}</td>
                  <td className="text-slate-600">{med.maximumStockLevel ?? '—'}</td>
                  <td className="font-medium text-slate-800">₹{med.unitPrice?.toFixed(2)}</td>
                  <td><StatusBadge status={med.stockStatus} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Active prescriptions */}
      {!loading && prescriptions.length > 0 && (
        <div className="card">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              <FileText style={{ width: 16, height: 16, color: theme.primary }} />
              Recent Prescriptions
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Medicine</th>
                  <th>Dosage</th>
                  <th>Frequency</th>
                  <th>Duration</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {prescriptions.slice(0, 10).map(pres => (
                  <tr key={pres.id}>
                    <td className="font-semibold text-slate-800">{pres.medicineName}</td>
                    <td className="text-slate-600">{pres.dosage}</td>
                    <td className="text-slate-600">{pres.frequency}</td>
                    <td className="text-slate-600">{pres.duration}</td>
                    <td className="text-slate-600">{pres.prescriptionDate}</td>
                    <td><StatusBadge status={pres.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
