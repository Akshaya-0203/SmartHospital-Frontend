import React, { useEffect, useState } from 'react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import { ROLE_THEMES, StatCard, StatusBadge, EmptyState, TableSkeleton } from '../components/shared';
import { TestTube, Clock, CheckCircle2, AlertCircle, FlaskConical } from 'lucide-react';

export default function LabDashboard() {
  const { user } = useAuth();
  const theme = ROLE_THEMES.LAB;
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    client.get('/lab')
      .then(res => setRequests(res.data || []))
      .catch(() => setError('Failed to fetch lab requests.'))
      .finally(() => setLoading(false));
  }, []);

  const pending = requests.filter(r => !['COMPLETED', 'CANCELLED'].includes(r.status));
  const completed = requests.filter(r => r.status === 'COMPLETED');
  const inProgress = requests.filter(r => r.status === 'PROCESSING' || r.status === 'SAMPLE_COLLECTED');

  const filtered = filter === 'ALL' ? requests : requests.filter(r => r.status === filter);

  const statusGroups = [
    { key: 'ALL', label: 'All' },
    { key: 'REQUESTED', label: 'Requested' },
    { key: 'SAMPLE_COLLECTED', label: 'Collected' },
    { key: 'PROCESSING', label: 'Processing' },
    { key: 'COMPLETED', label: 'Completed' },
  ];

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="rounded-xl p-5 md:p-6 text-white" style={{ background: theme.gradient }}>
        <h2 className="text-xl font-bold">Lab Dashboard</h2>
        <p className="text-white/80 text-sm mt-1">
          {pending.length > 0
            ? `${pending.length} test${pending.length !== 1 ? 's' : ''} pending processing`
            : 'All lab tests up to date'}
        </p>
      </div>

      {error && (
        <div className="card p-4 bg-red-50 border-red-200 text-red-700 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={TestTube} label="Total Requests" value={loading ? '—' : requests.length} theme={theme} />
        <StatCard
          icon={Clock}
          label="Pending"
          value={loading ? '—' : pending.length}
          theme={{ ...theme, primary: '#D97706', bg10: 'rgba(217,119,6,0.1)' }}
        />
        <StatCard
          icon={FlaskConical}
          label="In Progress"
          value={loading ? '—' : inProgress.length}
          theme={{ ...theme, primary: '#2563EB', bg10: 'rgba(37,99,235,0.1)' }}
        />
        <StatCard
          icon={CheckCircle2}
          label="Completed"
          value={loading ? '—' : completed.length}
          theme={{ ...theme, primary: '#10B981', bg10: 'rgba(16,185,129,0.1)' }}
        />
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {statusGroups.map(g => {
          const count = g.key === 'ALL' ? requests.length : requests.filter(r => r.status === g.key).length;
          return (
            <button
              key={g.key}
              onClick={() => setFilter(g.key)}
              className="px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all"
              style={filter === g.key
                ? { backgroundColor: theme.primary, color: 'white' }
                : { backgroundColor: '#F1F5F9', color: '#64748B' }
              }
            >
              {g.label} {count > 0 && <span className="ml-1 text-xs opacity-75">({count})</span>}
            </button>
          );
        })}
      </div>

      {/* Requests table */}
      <div className="card">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2">
            <TestTube style={{ width: 16, height: 16, color: theme.primary }} />
            Lab Requests
          </h3>
          <span className="text-xs text-slate-500">{filtered.length} shown</span>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Test Name</th>
                <th>Patient ID</th>
                <th>Ordered By</th>
                <th>Request Date</th>
                <th>Status</th>
                <th>Result Date</th>
              </tr>
            </thead>
            <tbody>
              {loading && <TableSkeleton rows={4} cols={6} />}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No lab requests for the selected filter.
                  </td>
                </tr>
              )}
              {!loading && filtered.map(req => (
                <tr key={req.id}>
                  <td>
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: theme.bg10 }}
                      >
                        <TestTube style={{ width: 14, height: 14, color: theme.primary }} />
                      </div>
                      <span className="font-semibold text-slate-800">{req.testName}</span>
                    </div>
                  </td>
                  <td className="text-slate-600">#{req.patientId}</td>
                  <td className="text-slate-600">{req.doctorId ? `Dr. #${req.doctorId}` : '—'}</td>
                  <td className="text-slate-600">{req.requestDate}</td>
                  <td><StatusBadge status={req.status} /></td>
                  <td className="text-slate-500">{req.resultDate || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
