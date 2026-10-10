import React, { useState, useEffect } from 'react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import { ROLE_THEMES, StatCard, StatusBadge, EmptyState, TableSkeleton } from '../components/shared';
import {
  Users, Calendar, FileText, Clock, CheckCircle2,
  Activity, AlertCircle, Check, Pill, Upload, History,
  Plus, X, Paperclip, Stethoscope, ChevronRight
} from 'lucide-react';

export default function DoctorDashboard() {
  const { user } = useAuth();
  const theme = ROLE_THEMES.DOCTOR;
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  // Consultation Modal State
  const [showConsultModal, setShowConsultModal] = useState(false);
  const [consultApt, setConsultApt] = useState(null);
  const [consultSymptoms, setConsultSymptoms] = useState('');
  const [consultDiagnosis, setConsultDiagnosis] = useState('');
  const [consultNotes, setConsultNotes] = useState('');
  const [consultDate, setConsultDate] = useState(new Date().toISOString().split('T')[0]);
  const [consultLoading, setConsultLoading] = useState(false);
  const [consultError, setConsultError] = useState('');
  const [consultSuccess, setConsultSuccess] = useState('');

  // Prescription Modal State
  const [showPrescribeModal, setShowPrescribeModal] = useState(false);
  const [prescribeApt, setPrescribeApt] = useState(null);
  const [prescribeMode, setPrescribeMode] = useState('DIGITAL'); // 'DIGITAL' | 'UPLOAD'
  const [medicineName, setMedicineName] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState('');
  const [duration, setDuration] = useState('');
  const [instructions, setInstructions] = useState('');
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadNotes, setUploadNotes] = useState('');
  const [uploadTitle, setUploadTitle] = useState('Prescription Document');
  const [prescribeLoading, setPrescribeLoading] = useState(false);
  const [prescribeError, setPrescribeError] = useState('');
  const [prescribeSuccess, setPrescribeSuccess] = useState('');

  // Patient History Modal State
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyPatient, setHistoryPatient] = useState(null);
  const [patientRecords, setPatientRecords] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];

  const fetchDoctorAppointments = async () => {
    setLoading(true);
    try {
      let res;
      if (user?.doctorId) {
        res = await client.get(`/appointments/doctor/${user.doctorId}`);
      } else {
        res = await client.get('/appointments');
      }
      setAppointments(res.data || []);
    } catch (err) {
      console.warn("Could not load doctor appointments", err);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPatients = async () => {
    try {
      const res = await client.get('/patients');
      const pts = res.data || [];
      setPatients(pts);
      if (pts.length > 0 && !selectedPatientId) {
        setSelectedPatientId(pts[0].id);
      }
    } catch (err) {
      console.warn("Could not load patients list", err);
    }
  };

  useEffect(() => {
    fetchDoctorAppointments();
    fetchPatients();
  }, [user]);

  const updateStatus = async (id, status) => {
    setUpdatingId(id);
    try {
      await client.put(`/appointments/${id}/status?status=${status}`);
      await fetchDoctorAppointments();
    } catch (err) {
      alert("Failed to update status. Please try again.");
    } finally {
      setUpdatingId(null);
    }
  };

  // Consultation Handlers
  const openConsultModal = (apt) => {
    setConsultApt(apt);
    if (apt) {
      setSelectedPatientId(apt.patientId);
      setConsultSymptoms(apt.reason || '');
    } else {
      if (patients.length > 0) setSelectedPatientId(patients[0].id);
      setConsultSymptoms('');
    }
    setConsultDiagnosis('');
    setConsultNotes('');
    setConsultDate(todayStr);
    setConsultError('');
    setConsultSuccess('');
    setShowConsultModal(true);
  };

  const handleConsultSubmit = async (e) => {
    e.preventDefault();
    setConsultLoading(true);
    setConsultError('');
    setConsultSuccess('');

    const targetPatientId = consultApt ? consultApt.patientId : Number(selectedPatientId);
    if (!targetPatientId) {
      setConsultError('Please select a valid patient.');
      setConsultLoading(false);
      return;
    }

    try {
      await client.post('/medical-records', {
        patientId: targetPatientId,
        doctorId: user?.doctorId,
        appointmentId: consultApt ? consultApt.id : null,
        consultationDate: consultDate,
        symptoms: consultSymptoms,
        diagnosis: consultDiagnosis,
        treatmentNotes: consultNotes,
      });

      // Automatically mark appointment as completed if it was scheduled or confirmed
      if (consultApt && ['SCHEDULED', 'CONFIRMED'].includes(consultApt.status)) {
        try {
          await client.put(`/appointments/${consultApt.id}/status?status=COMPLETED`);
        } catch {
          // Non-blocking
        }
      }

      setConsultSuccess('Consultation recorded successfully!');
      fetchDoctorAppointments();
      setTimeout(() => {
        setShowConsultModal(false);
        setConsultSuccess('');
      }, 1200);
    } catch (err) {
      setConsultError(err?.response?.data?.message || 'Failed to save consultation record. Please try again.');
    } finally {
      setConsultLoading(false);
    }
  };

  // Prescription Handlers
  const openPrescribeModal = (apt) => {
    setPrescribeApt(apt);
    if (apt) {
      setSelectedPatientId(apt.patientId);
    } else {
      if (patients.length > 0) setSelectedPatientId(patients[0].id);
    }
    setPrescribeMode('DIGITAL');
    setMedicineName('');
    setDosage('');
    setFrequency('');
    setDuration('');
    setInstructions('');
    setUploadFile(null);
    setUploadNotes('');
    setUploadTitle('Prescription Document');
    setPrescribeError('');
    setPrescribeSuccess('');
    setShowPrescribeModal(true);
  };

  const handlePrescribeSubmit = async (e) => {
    e.preventDefault();
    setPrescribeLoading(true);
    setPrescribeError('');
    setPrescribeSuccess('');

    const targetPatientId = prescribeApt ? prescribeApt.patientId : Number(selectedPatientId);
    if (!targetPatientId) {
      setPrescribeError('Please select a valid patient.');
      setPrescribeLoading(false);
      return;
    }

    try {
      if (prescribeMode === 'DIGITAL') {
        if (!medicineName.trim()) {
          setPrescribeError('Medicine name is required.');
          setPrescribeLoading(false);
          return;
        }

        await client.post('/prescriptions', {
          patientId: targetPatientId,
          doctorId: user?.doctorId,
          appointmentId: prescribeApt ? prescribeApt.id : null,
          medicineName: medicineName.trim(),
          dosage: dosage.trim() || 'As directed',
          frequency: frequency.trim() || 'Once daily',
          duration: duration.trim() || '5 days',
          instructions: instructions.trim() || 'Take after meals with water',
          prescriptionDate: todayStr,
          status: 'ACTIVE',
        });
      } else {
        // Upload file mode
        if (!uploadFile) {
          setPrescribeError('Please select a file to upload.');
          setPrescribeLoading(false);
          return;
        }

        if (uploadFile.size > 10 * 1024 * 1024) {
          setPrescribeError('File size exceeds the 10MB limit.');
          setPrescribeLoading(false);
          return;
        }

        const validExts = ['.pdf', '.png', '.jpg', '.jpeg', '.webp'];
        const fileNameLower = uploadFile.name.toLowerCase();
        const isValid = validExts.some(ext => fileNameLower.endsWith(ext));
        if (!isValid) {
          setPrescribeError('Only PDF and image documents (PNG, JPG, WEBP) are allowed.');
          setPrescribeLoading(false);
          return;
        }

        const formData = new FormData();
        formData.append('patientId', targetPatientId);
        if (user?.doctorId) {
          formData.append('doctorId', user.doctorId);
        }
        formData.append('medicineName', uploadTitle.trim() || 'Prescription Document');
        formData.append('notes', uploadNotes.trim());
        formData.append('file', uploadFile);

        await client.post('/prescriptions/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      setPrescribeSuccess('Prescription issued successfully!');
      setTimeout(() => {
        setShowPrescribeModal(false);
        setPrescribeSuccess('');
      }, 1200);
    } catch (err) {
      setPrescribeError(err?.response?.data?.message || 'Failed to issue prescription. Please try again.');
    } finally {
      setPrescribeLoading(false);
    }
  };

  // Patient History Handlers
  const openHistoryModal = async (patientId, patientName) => {
    const pId = patientId || (patients[0] ? patients[0].id : null);
    const pName = patientName || (patients.find(p => p.id === pId)?.name || `Patient #${pId}`);
    if (!pId) return;

    setHistoryPatient({ id: pId, name: pName });
    setShowHistoryModal(true);
    setHistoryLoading(true);
    setHistoryError('');
    try {
      const res = await client.get(`/medical-records/patient/${pId}`);
      const sorted = (res.data || []).sort((a, b) => {
        const da = new Date(a.consultationDate || a.recordDate || a.createdAt || 0);
        const db = new Date(b.consultationDate || b.recordDate || b.createdAt || 0);
        return db - da;
      });
      setPatientRecords(sorted);
    } catch (err) {
      setHistoryError('Could not load patient medical records.');
    } finally {
      setHistoryLoading(false);
    }
  };

  const todayAppts = appointments.filter(a => a.appointmentDate === todayStr);
  const scheduled = todayAppts.filter(a => a.status === 'SCHEDULED' || a.status === 'CONFIRMED');
  const completed = appointments.filter(a => a.status === 'COMPLETED');
  const total = appointments.length;

  return (
    <div className="space-y-6">
      {/* Banner with Doctor Actions */}
      <div
        className="rounded-xl p-5 md:p-6 text-white flex flex-col lg:flex-row lg:items-center justify-between gap-4"
        style={{ background: theme.gradient }}
      >
        <div>
          <h2 className="text-xl font-bold">Doctor Dashboard</h2>
          <p className="text-white/80 text-sm mt-1">
            Welcome, {user.doctorName ? `Dr. ${user.doctorName}` : user.username}. Here's an overview of today's schedule and consultations.
          </p>
        </div>

        {/* Top Action CTAs */}
        <div className="flex items-center gap-2.5 flex-wrap flex-shrink-0">
          <button
            onClick={() => openConsultModal(null)}
            className="inline-flex items-center gap-1.5 bg-white text-purple-900 font-bold text-xs px-3.5 py-2.5 rounded-lg shadow-sm hover:bg-purple-50 transition-colors"
          >
            <Stethoscope className="w-4 h-4 text-purple-700" /> Record Consultation
          </button>
          <button
            onClick={() => openPrescribeModal(null)}
            className="inline-flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white font-semibold text-xs px-3.5 py-2.5 rounded-lg transition-colors"
          >
            <Pill className="w-4 h-4" /> Issue / Upload Prescription
          </button>
          <button
            onClick={() => openHistoryModal(null, null)}
            className="inline-flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white font-semibold text-xs px-3.5 py-2.5 rounded-lg transition-colors"
          >
            <History className="w-4 h-4" /> Patient Records
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Calendar} label="Today's Appointments" value={loading ? '—' : todayAppts.length} theme={theme} />
        <StatCard icon={Clock} label="Waiting / Upcoming" value={loading ? '—' : scheduled.length} theme={theme} />
        <StatCard icon={CheckCircle2} label="Completed" value={loading ? '—' : completed.length} theme={theme} />
        <StatCard icon={Activity} label="Total Appointments" value={loading ? '—' : total} theme={theme} />
      </div>

      {/* Today's schedule table */}
      <div className="card">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2">
            <Calendar style={{ width: 16, height: 16, color: theme.primary }} />
            Today's Consultations — {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
          </h3>
          <span
            className="text-xs font-semibold px-2.5 py-1 rounded-full text-white"
            style={{ backgroundColor: theme.primary }}
          >
            {todayAppts.length} today
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Time</th>
                <th>Type</th>
                <th>Reason</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && <TableSkeleton rows={3} cols={6} />}
              {!loading && todayAppts.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No appointments scheduled for today. You can still record a consultation or issue prescriptions using the buttons above.
                  </td>
                </tr>
              )}
              {!loading && todayAppts.map(apt => (
                <tr key={apt.id}>
                  <td>
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                        style={{ backgroundColor: theme.primary }}
                      >
                        {(apt.patientName || 'P').charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800">{apt.patientName || `Patient #${apt.patientId}`}</p>
                        <p className="text-xs text-slate-400">ID: #{apt.patientId}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="font-medium text-slate-700 flex items-center gap-1.5">
                      <Clock style={{ width: 12, height: 12, color: theme.primary }} />
                      {apt.appointmentTime}
                    </span>
                  </td>
                  <td>
                    <span className="text-xs bg-slate-100 text-slate-600 font-medium px-2 py-0.5 rounded">
                      {apt.type === 'FOLLOW_UP' ? 'Follow-up' : 'Consultation'}
                    </span>
                  </td>
                  <td><span className="text-slate-600 max-w-[200px] line-clamp-1">{apt.reason || '—'}</span></td>
                  <td><StatusBadge status={apt.status} /></td>
                  <td className="text-right">
                    <div className="flex items-center justify-end gap-1.5 flex-wrap">
                      {/* Confirm Button */}
                      {apt.status === 'SCHEDULED' && (
                        <button
                          onClick={() => updateStatus(apt.id, 'CONFIRMED')}
                          disabled={updatingId === apt.id}
                          className="btn-primary text-xs py-1 px-2.5"
                          style={{ backgroundColor: theme.primary }}
                        >
                          Confirm
                        </button>
                      )}

                      {/* Complete Button */}
                      {apt.status === 'CONFIRMED' && (
                        <button
                          onClick={() => updateStatus(apt.id, 'COMPLETED')}
                          disabled={updatingId === apt.id}
                          className="btn-primary text-xs py-1 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                          <Check className="w-3.5 h-3.5 mr-1 inline" /> Complete
                        </button>
                      )}

                      {/* Record Consultation */}
                      <button
                        onClick={() => openConsultModal(apt)}
                        className="btn-secondary text-xs py-1 px-2.5 text-teal-700 hover:bg-teal-50 border-teal-200"
                        title="Record Consultation diagnosis and notes"
                      >
                        <Stethoscope className="w-3.5 h-3.5 mr-1 inline" /> Consult
                      </button>

                      {/* Prescribe Medication / Upload */}
                      <button
                        onClick={() => openPrescribeModal(apt)}
                        className="btn-secondary text-xs py-1 px-2.5 text-purple-700 hover:bg-purple-50 border-purple-200"
                        title="Write or upload prescription"
                      >
                        <Pill className="w-3.5 h-3.5 mr-1 inline" /> Prescribe
                      </button>

                      {/* View Medical History */}
                      <button
                        onClick={() => openHistoryModal(apt.patientId, apt.patientName || `Patient #${apt.patientId}`)}
                        className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                        title="View patient medical history"
                      >
                        <History className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* All appointments overview */}
      <div className="card">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2">
            <FileText style={{ width: 16, height: 16, color: theme.primary }} />
            All Assigned Appointments
          </h3>
          <span className="text-xs text-slate-400">{appointments.length} total</span>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Date</th>
                <th>Time</th>
                <th>Type</th>
                <th>Reason</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && <TableSkeleton rows={3} cols={7} />}
              {!loading && appointments.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 text-sm">
                    No appointments assigned yet. You can record consultations or issue prescriptions directly for any patient using the top action buttons.
                  </td>
                </tr>
              )}
              {!loading && appointments.map(apt => (
                <tr key={apt.id}>
                  <td className="font-medium text-slate-800">{apt.patientName || `#${apt.patientId}`}</td>
                  <td className="text-slate-600">{apt.appointmentDate}</td>
                  <td className="text-slate-600">{apt.appointmentTime}</td>
                  <td>
                    <span className="text-xs bg-slate-100 text-slate-600 font-medium px-2 py-0.5 rounded">
                      {apt.type === 'FOLLOW_UP' ? 'Follow-up' : 'Consultation'}
                    </span>
                  </td>
                  <td className="text-slate-600">{apt.reason || '—'}</td>
                  <td><StatusBadge status={apt.status} /></td>
                  <td className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => openConsultModal(apt)}
                        className="btn-secondary text-xs py-1 px-2 text-teal-700 hover:bg-teal-50"
                        title="Record Consultation"
                      >
                        <Stethoscope className="w-3.5 h-3.5 mr-1 inline" /> Consult
                      </button>
                      <button
                        onClick={() => openPrescribeModal(apt)}
                        className="btn-secondary text-xs py-1 px-2 text-purple-700 hover:bg-purple-50"
                        title="Prescribe Medication"
                      >
                        <Pill className="w-3.5 h-3.5 mr-1 inline" /> Rx
                      </button>
                      <button
                        onClick={() => openHistoryModal(apt.patientId, apt.patientName || `Patient #${apt.patientId}`)}
                        className="p-1 rounded text-slate-400 hover:text-slate-700"
                        title="Patient History"
                      >
                        <History className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── MODAL 1: RECORD CONSULTATION ─── */}
      {showConsultModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl relative border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
                  style={{ backgroundColor: theme.primary }}
                >
                  <Stethoscope className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Record Consultation</h3>
                  <p className="text-xs text-slate-500">
                    {consultApt ? (
                      <>Patient: <span className="font-semibold text-slate-700">{consultApt.patientName || `#${consultApt.patientId}`}</span> (ID: #{consultApt.patientId})</>
                    ) : (
                      'Record clinical diagnosis and consultation notes'
                    )}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowConsultModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConsultSubmit} className="mt-4 space-y-4">
              {consultError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs font-medium">
                  {consultError}
                </div>
              )}
              {consultSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-xs font-medium flex items-center gap-2">
                  <Check className="w-4 h-4" /> {consultSuccess}
                </div>
              )}

              {/* Patient Selection if not launched from a specific appointment */}
              {!consultApt && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Select Patient</label>
                  <select
                    required
                    className="input-field"
                    value={selectedPatientId}
                    onChange={e => setSelectedPatientId(e.target.value)}
                  >
                    {patients.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} (ID: #{p.id}) {p.phone ? `— ${p.phone}` : ''}
                      </option>
                    ))}
                    {patients.length === 0 && <option value="">No patients available</option>}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Consultation Date</label>
                <input
                  type="date"
                  required
                  className="input-field"
                  value={consultDate}
                  onChange={e => setConsultDate(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Symptoms / Patient Complaints</label>
                <textarea
                  rows={2}
                  required
                  className="input-field"
                  placeholder="e.g. High fever for 3 days, sore throat, fatigue..."
                  value={consultSymptoms}
                  onChange={e => setConsultSymptoms(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Clinical Diagnosis</label>
                <input
                  type="text"
                  required
                  className="input-field"
                  placeholder="e.g. Acute Pharyngitis / Viral Upper Respiratory Infection"
                  value={consultDiagnosis}
                  onChange={e => setConsultDiagnosis(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Treatment Notes & Advice</label>
                <textarea
                  rows={3}
                  required
                  className="input-field"
                  placeholder="e.g. Recommended hydration, bed rest. Follow up in 5 days if fever persists."
                  value={consultNotes}
                  onChange={e => setConsultNotes(e.target.value)}
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowConsultModal(false)}
                  className="btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={consultLoading || (!consultApt && patients.length === 0)}
                  className="btn-primary text-xs"
                  style={{ backgroundColor: theme.primary }}
                >
                  {consultLoading ? 'Saving...' : 'Save Consultation Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL 2: WRITE / UPLOAD PRESCRIPTION ─── */}
      {showPrescribeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl relative border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white bg-purple-600"
                >
                  <Pill className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Issue Prescription</h3>
                  <p className="text-xs text-slate-500">
                    {prescribeApt ? (
                      <>Patient: <span className="font-semibold text-slate-700">{prescribeApt.patientName || `#${prescribeApt.patientId}`}</span> (ID: #{prescribeApt.patientId})</>
                    ) : (
                      'Write digital prescription or upload prescription file'
                    )}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowPrescribeModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mode switch: Digital vs Upload */}
            <div className="flex items-center gap-2 mt-4 p-1 bg-slate-100 rounded-lg">
              <button
                type="button"
                onClick={() => setPrescribeMode('DIGITAL')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  prescribeMode === 'DIGITAL' ? 'bg-white text-purple-700 shadow-sm' : 'text-slate-600'
                }`}
              >
                Digital Prescription
              </button>
              <button
                type="button"
                onClick={() => setPrescribeMode('UPLOAD')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  prescribeMode === 'UPLOAD' ? 'bg-white text-purple-700 shadow-sm' : 'text-slate-600'
                }`}
              >
                Upload Document (PDF / Image)
              </button>
            </div>

            <form onSubmit={handlePrescribeSubmit} className="mt-4 space-y-3.5">
              {prescribeError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs font-medium">
                  {prescribeError}
                </div>
              )}
              {prescribeSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-xs font-medium flex items-center gap-2">
                  <Check className="w-4 h-4" /> {prescribeSuccess}
                </div>
              )}

              {/* Patient Selection if not launched from a specific appointment */}
              {!prescribeApt && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Select Patient</label>
                  <select
                    required
                    className="input-field"
                    value={selectedPatientId}
                    onChange={e => setSelectedPatientId(e.target.value)}
                  >
                    {patients.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} (ID: #{p.id}) {p.phone ? `— ${p.phone}` : ''}
                      </option>
                    ))}
                    {patients.length === 0 && <option value="">No patients available</option>}
                  </select>
                </div>
              )}

              {prescribeMode === 'DIGITAL' ? (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Medication Name</label>
                    <input
                      type="text"
                      required
                      className="input-field"
                      placeholder="e.g. Paracetamol 500mg / Amoxicillin 250mg"
                      value={medicineName}
                      onChange={e => setMedicineName(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2.5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Dosage</label>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="1 tablet"
                        value={dosage}
                        onChange={e => setDosage(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Frequency</label>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="Twice daily"
                        value={frequency}
                        onChange={e => setFrequency(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Duration</label>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="5 days"
                        value={duration}
                        onChange={e => setDuration(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Instructions / Advisory</label>
                    <textarea
                      rows={2}
                      className="input-field"
                      placeholder="Take after meals. Drink plenty of water."
                      value={instructions}
                      onChange={e => setInstructions(e.target.value)}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Document Title</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="e.g. Discharge Prescription / OPD Slip"
                      value={uploadTitle}
                      onChange={e => setUploadTitle(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Select Prescription File (PDF, PNG, JPG, WEBP — max 10MB)
                    </label>
                    <input
                      type="file"
                      required
                      accept=".pdf,.png,.jpg,.jpeg,.webp"
                      className="input-field text-xs file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                      onChange={e => setUploadFile(e.target.files[0] || null)}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Notes / Instructions</label>
                    <textarea
                      rows={2}
                      className="input-field"
                      placeholder="Special instructions for patient and pharmacy..."
                      value={uploadNotes}
                      onChange={e => setUploadNotes(e.target.value)}
                    />
                  </div>
                </>
              )}

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPrescribeModal(false)}
                  className="btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={prescribeLoading || (!prescribeApt && patients.length === 0)}
                  className="btn-primary text-xs bg-purple-600 hover:bg-purple-700 text-white"
                >
                  {prescribeLoading ? 'Submitting...' : (prescribeMode === 'DIGITAL' ? 'Create Prescription' : 'Upload Prescription')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL 3: PATIENT MEDICAL HISTORY ─── */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative border border-slate-100 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white bg-slate-800"
                >
                  <History className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Patient Medical History</h3>
                  <p className="text-xs text-slate-500">
                    {historyPatient ? `Patient: ${historyPatient.name} (ID: #${historyPatient.id})` : 'Lookup patient records'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Patient Switcher */}
            {patients.length > 0 && (
              <div className="mt-3 flex items-center gap-2 flex-shrink-0">
                <label className="text-xs font-semibold text-slate-600">Select Patient:</label>
                <select
                  className="input-field text-xs py-1"
                  value={historyPatient?.id || selectedPatientId}
                  onChange={e => {
                    const id = Number(e.target.value);
                    const p = patients.find(x => x.id === id);
                    openHistoryModal(id, p?.name || `Patient #${id}`);
                  }}
                >
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>{p.name} (ID: #{p.id})</option>
                  ))}
                </select>
              </div>
            )}

            <div className="overflow-y-auto flex-1 mt-4 space-y-3 pr-1">
              {historyLoading && <div className="py-8 text-center text-sm text-slate-500">Loading medical history...</div>}
              {historyError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs">
                  {historyError}
                </div>
              )}
              {!historyLoading && !historyError && patientRecords.length === 0 && (
                <div className="py-12 text-center text-slate-400 text-sm">
                  No medical records found for this patient.
                </div>
              )}
              {!historyLoading && patientRecords.map(rec => (
                <div key={rec.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm text-slate-800">{rec.diagnosis}</span>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {rec.consultationDate || rec.recordDate || '—'}
                    </span>
                  </div>
                  {rec.symptoms && (
                    <div className="text-xs text-slate-600">
                      <span className="font-semibold text-slate-700">Symptoms:</span> {rec.symptoms}
                    </div>
                  )}
                  {rec.treatmentNotes && (
                    <div className="text-xs text-slate-600">
                      <span className="font-semibold text-slate-700">Treatment & Notes:</span> {rec.treatmentNotes}
                    </div>
                  )}
                  <div className="text-xs text-slate-400 pt-1 border-t border-slate-100">
                    Consulting Doctor: Dr. {rec.doctorName} {rec.doctorSpecialization ? `(${rec.doctorSpecialization})` : ''}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end flex-shrink-0">
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="btn-secondary text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
