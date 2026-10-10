import React, { useEffect, useState } from 'react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import { ROLE_THEMES, StatusBadge, EmptyState, TableSkeleton } from '../components/shared';
import { Pill, AlertCircle } from 'lucide-react';

/**
 * AllPrescriptions — used by PHARMACY and ADMIN roles from the /prescriptions sidebar route.
 * Fetches all prescriptions via GET /api/prescriptions (requires PHARMACY or ADMIN role).
 */
export default function AllPrescriptions() {
  const { user } = useAuth();
  const theme = ROLE_THEMES[user?.role] || ROLE_THEMES.PHARMACY;
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    client.get('/prescriptions')
      .then(res => setPrescriptions(res.data || []))
      .catch(() => setError('Failed to load prescriptions. Please try again.'))
      .finally(() => setLoading(false));
  }, []);

  const filtered =
    filter === 'ALL' ? prescriptions : prescriptions.filter(p => p.status === filter);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Prescriptions</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          {prescriptions.length} total prescription{prescriptions.length !== 1 ? 's' : ''}
        </p>
      </div>

      {error && (
        <div className="card p-4 bg-red-50 border-red-200 flex items-center gap-3 text-red-700 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" /> {error}
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {['ALL', 'ACTIVE', 'COMPLETED', 'CANCELLED'].map(f => (
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
            {f}
            {f !== 'ALL' && (
              <span className="ml-1 text-xs opacity-75">
                ({prescriptions.filter(p => p.status === f).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Medicine</th>
                <th>Patient ID</th>
                <th>Doctor ID</th>
                <th>Dosage</th>
                <th>Frequency</th>
                <th>Duration</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading && <TableSkeleton rows={4} cols={8} />}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No prescriptions found.
                  </td>
                </tr>
              )}
              {!loading && filtered.map(pres => (
                <tr key={pres.id}>
                  <td>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: theme.bg10 }}
                      >
                        <Pill style={{ width: 13, height: 13, color: theme.primary }} />
                      </div>
                      <span className="font-semibold text-slate-800">{pres.medicineName}</span>
                    </div>
                  </td>
                  <td className="text-slate-600">#{pres.patientId}</td>
                  <td className="text-slate-600">{pres.doctorId ? `#${pres.doctorId}` : '—'}</td>
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
    </div>
  );
}
