import React, { useState, useEffect } from 'react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import { ROLE_THEMES, StatusBadge, EmptyState, TableSkeleton } from '../components/shared';
import { FileText, Calendar, Pill, AlertCircle, Paperclip } from 'lucide-react';

export default function PatientRecords() {
  const { user } = useAuth();
  const theme = ROLE_THEMES.PATIENT;
  const [records, setRecords] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState('records');

  useEffect(() => {
    if (user?.patientId) {
      loadData();
    } else {
      setLoading(false);
      setError('Patient profile not linked.');
    }
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [recRes, presRes] = await Promise.all([
        client.get(`/medical-records/patient/${user.patientId}`),
        client.get(`/prescriptions/patient/${user.patientId}`),
      ]);
      const recData = (recRes.data || []).sort((a, b) => {
        const da = new Date(a.consultationDate || a.recordDate || a.createdAt || 0);
        const db = new Date(b.consultationDate || b.recordDate || b.createdAt || 0);
        return db - da;
      });
      const presData = (presRes.data || []).sort((a, b) => {
        const da = new Date(a.prescriptionDate || a.createdAt || 0);
        const db = new Date(b.prescriptionDate || b.createdAt || 0);
        return db - da;
      });
      setRecords(recData);
      setPrescriptions(presData);
      setError(null);
    } catch {
      setError('Failed to load medical history.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Medical History</h1>
        <p className="text-sm text-slate-500 mt-0.5">Your complete medical records and prescriptions</p>
      </div>

      {error && (
        <div className="card p-4 bg-red-50 border-red-200 text-red-700 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" /> {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200">
        <button
          onClick={() => setTab('records')}
          className="px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors"
          style={tab === 'records'
            ? { borderColor: theme.primary, color: theme.primary }
            : { borderColor: 'transparent', color: '#64748B' }
          }
        >
          <span className="flex items-center gap-2">
            <FileText style={{ width: 14, height: 14 }} />
            Medical Records ({records.length})
          </span>
        </button>
        <button
          onClick={() => setTab('prescriptions')}
          className="px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors"
          style={tab === 'prescriptions'
            ? { borderColor: theme.primary, color: theme.primary }
            : { borderColor: 'transparent', color: '#64748B' }
          }
        >
          <span className="flex items-center gap-2">
            <Pill style={{ width: 14, height: 14 }} />
            Prescriptions ({prescriptions.length})
          </span>
        </button>
      </div>

      {/* Records tab */}
      {tab === 'records' && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Doctor</th>
                  <th>Diagnosis</th>
                  <th>Symptoms</th>
                  <th>Notes / Treatment</th>
                </tr>
              </thead>
              <tbody>
                {loading && <TableSkeleton rows={3} cols={5} />}
                {!loading && records.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">No medical records found.</td>
                  </tr>
                )}
                {!loading && records.map(rec => (
                  <tr key={rec.id}>
                    <td>
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <Calendar style={{ width: 12, height: 12, color: theme.primary }} />
                        {rec.consultationDate || rec.recordDate || '—'}
                      </div>
                    </td>
                    <td className="font-medium text-slate-800">Dr. {rec.doctorName}</td>
                    <td>
                      <span
                        className="inline-block font-semibold text-sm px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: theme.lighter, color: theme.primary }}
                      >
                        {rec.diagnosis}
                      </span>
                    </td>
                    <td className="text-slate-600 text-sm max-w-[200px]">
                      <span className="line-clamp-2">{rec.symptoms || '—'}</span>
                    </td>
                    <td className="text-slate-600 text-sm max-w-[220px]">
                      <span className="line-clamp-2">{rec.treatmentNotes || rec.notes || '—'}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Prescriptions tab */}
      {tab === 'prescriptions' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {loading && (
            [1,2,3].map(i => (
              <div key={i} className="card p-5 space-y-3">
                <div className="skeleton h-5 w-1/2 rounded" />
                <div className="skeleton h-4 w-3/4 rounded" />
                <div className="skeleton h-4 w-full rounded" />
              </div>
            ))
          )}
          {!loading && prescriptions.length === 0 && (
            <div className="card py-12 col-span-2">
              <EmptyState icon={Pill} message="No prescriptions on record" />
            </div>
          )}
          {!loading && prescriptions.map(pres => {
            const hasAttachment = pres.instructions?.includes('Attached File:') || pres.medicineName?.toLowerCase().includes('uploaded');
            const fileName = hasAttachment && pres.instructions?.includes('Attached File:')
              ? pres.instructions.split('Attached File:')[1]?.trim()
              : (hasAttachment ? 'prescription_doc' : null);
            const displayInstructions = hasAttachment && pres.instructions?.includes('Attached File:')
              ? pres.instructions.split('| Attached File:')[0]?.replace('Attached File:' + (fileName || ''), '')?.trim()
              : pres.instructions;

            return (
              <div
                key={pres.id}
                className="card p-5"
                style={{
                  borderLeft: `4px solid ${pres.status === 'ACTIVE' ? theme.primary : '#94A3B8'}`
                }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: theme.bg10 }}
                    >
                      <Pill style={{ width: 18, height: 18, color: theme.primary }} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">{pres.medicineName}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{pres.dosage || 'Prescribed Dosage'}</p>
                    </div>
                  </div>
                  <StatusBadge status={pres.status} />
                </div>

                {hasAttachment && (
                  <div className="mb-3 p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between gap-2 text-xs">
                    <span className="flex items-center gap-1.5 font-medium text-slate-700 truncate">
                      <Paperclip className="w-3.5 h-3.5 text-teal-600 flex-shrink-0" />
                      Attached File: <span className="font-mono text-slate-900">{fileName}</span>
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 bg-teal-100 text-teal-800 rounded">Document</span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 text-sm mt-3 pt-3 border-t border-slate-100">
                  <div>
                    <span className="text-xs text-slate-400 block">Frequency</span>
                    <span className="font-medium text-slate-700">{pres.frequency || 'As directed'}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block">Duration</span>
                    <span className="font-medium text-slate-700">{pres.duration || 'As prescribed'}</span>
                  </div>
                  {displayInstructions && (
                    <div className="col-span-2">
                      <span className="text-xs text-slate-400 block">Instructions</span>
                      <span className="text-slate-700">{displayInstructions}</span>
                    </div>
                  )}
                  <div className="col-span-2 pt-1 border-t border-slate-50 text-xs text-slate-400">
                    Prescribed by Dr. {pres.doctorName} on {pres.prescriptionDate}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
