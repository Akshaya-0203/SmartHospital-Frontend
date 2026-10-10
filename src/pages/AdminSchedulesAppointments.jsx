import React, { useEffect, useState } from 'react';
import client from '../api/client';
import { StatusBadge, EmptyState, TableSkeleton } from '../components/shared';
import { Calendar, Clock, Plus, Filter, CheckCircle2, XCircle, AlertCircle, RefreshCw } from 'lucide-react';

export default function AdminSchedulesAppointments() {
  const [tab, setTab] = useState('appointments'); // 'appointments' or 'schedules'
  const [appointments, setAppointments] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  // Status Filter
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Reschedule Modal
  const [rescheduleModal, setRescheduleModal] = useState(false);
  const [selectedAppt, setSelectedAppt] = useState(null);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('10:00:00');
  const [actionLoading, setActionLoading] = useState(false);

  // New Schedule Modal
  const [scheduleModal, setScheduleModal] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({
    doctorId: '',
    availableDate: '',
    startTime: '09:00:00',
    endTime: '17:00:00',
    isAvailable: true,
  });

  const loadData = () => {
    setLoading(true);
    Promise.all([
      client.get('/appointments').catch(() => ({ data: [] })),
      client.get('/schedules').catch(() => ({ data: [] })),
      client.get('/doctors').catch(() => ({ data: [] })),
      client.get('/patients').catch(() => ({ data: [] })),
    ])
      .then(([aptRes, schRes, docRes, patRes]) => {
        setAppointments(aptRes.data || []);
        setSchedules(schRes.data || []);
        setDoctors(docRes.data || []);
        setPatients(patRes.data || []);
        if (docRes.data && docRes.data.length > 0 && !scheduleForm.doctorId) {
          setScheduleForm(prev => ({ ...prev, doctorId: docRes.data[0].id }));
        }
      })
      .catch(() => setError('Failed to load appointments and doctor schedules.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStatusUpdate = async (id, status) => {
    setActionLoading(true);
    setError(null);
    try {
      await client.put(`/appointments/${id}/status?status=${status}`);
      setSuccessMsg(`Appointment #${id} updated to ${status}.`);
      loadData();
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to update appointment status.');
    } finally {
      setActionLoading(false);
    }
  };

  const openRescheduleModal = (apt) => {
    setSelectedAppt(apt);
    setNewDate(apt.appointmentDate || '');
    setNewTime(apt.appointmentTime ? apt.appointmentTime + (apt.appointmentTime.length === 5 ? ':00' : '') : '10:00:00');
    setRescheduleModal(true);
  };

  const handleRescheduleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAppt) return;
    setActionLoading(true);
    setError(null);

    // Format time to HH:mm:ss if HH:mm
    const formattedTime = newTime.length === 5 ? `${newTime}:00` : newTime;

    try {
      await client.put(`/appointments/${selectedAppt.id}/reschedule?date=${newDate}&time=${formattedTime}`);
      setSuccessMsg(`Appointment #${selectedAppt.id} successfully rescheduled to ${newDate} at ${formattedTime}.`);
      setRescheduleModal(false);
      loadData();
    } catch (err) {
      setError(err?.response?.data?.message || 'Conflict or invalid time: slot unavailable or double-booked.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setError(null);
    try {
      const formattedStart = scheduleForm.startTime.length === 5 ? `${scheduleForm.startTime}:00` : scheduleForm.startTime;
      const formattedEnd = scheduleForm.endTime.length === 5 ? `${scheduleForm.endTime}:00` : scheduleForm.endTime;

      await client.post('/schedules', {
        ...scheduleForm,
        startTime: formattedStart,
        endTime: formattedEnd,
      });
      setSuccessMsg('Doctor schedule created successfully.');
      setScheduleModal(false);
      loadData();
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to save doctor schedule.');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredAppointments = appointments.filter(a => {
    if (statusFilter === 'ALL') return true;
    return a.status === statusFilter;
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Doctor Schedules & Appointments</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Administer doctor consultation shifts, slot availability, and patient bookings
          </p>
        </div>
        <div className="flex items-center gap-2">
          {tab === 'schedules' && (
            <button
              onClick={() => setScheduleModal(true)}
              className="btn-primary flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Add Doctor Shift
            </button>
          )}
          <button onClick={loadData} className="btn-secondary flex items-center gap-1.5" disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="card p-4 bg-red-50 border-red-200 flex items-center gap-3 text-red-700 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" /> {error}
        </div>
      )}
      {successMsg && (
        <div className="card p-4 bg-emerald-50 border-emerald-200 flex items-center gap-3 text-emerald-700 text-sm">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600" /> {successMsg}
        </div>
      )}

      {/* Tabs */}
      <div className="card p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTab('appointments')}
            className={`px-4 py-2 rounded-lg font-bold text-sm transition-all flex items-center gap-2 ${
              tab === 'appointments' ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Calendar className="w-4 h-4" /> Appointments ({appointments.length})
          </button>
          <button
            onClick={() => setTab('schedules')}
            className={`px-4 py-2 rounded-lg font-bold text-sm transition-all flex items-center gap-2 ${
              tab === 'schedules' ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Clock className="w-4 h-4" /> Doctor Shifts & Slots ({schedules.length})
          </button>
        </div>

        {tab === 'appointments' && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-slate-500">Status:</span>
            {['ALL', 'SCHEDULED', 'CONFIRMED', 'COMPLETED', 'CANCELLED'].map(st => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  statusFilter === st ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Appointments View */}
      {tab === 'appointments' && (
        <div className="bg-white rounded-xl shadow overflow-hidden border border-slate-200">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-800 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Appt #</th>
                  <th className="px-6 py-4">Patient</th>
                  <th className="px-6 py-4">Doctor</th>
                  <th className="px-6 py-4">Date & Time</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading && <TableSkeleton rows={4} cols={7} />}
                {!loading && filteredAppointments.map(a => (
                  <tr key={a.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs font-bold text-slate-700">#{a.id}</td>
                    <td className="px-6 py-4 font-semibold text-slate-900">{a.patientName || `Patient #${a.patientId}`}</td>
                    <td className="px-6 py-4 text-slate-700">Dr. {a.doctorName}</td>
                    <td className="px-6 py-4 text-slate-800 font-medium">
                      {a.appointmentDate} <span className="text-xs text-slate-500 font-normal">at {a.appointmentTime}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">
                        {a.type || a.appointmentType || 'ROUTINE'}
                      </span>
                    </td>
                    <td className="px-6 py-4"><StatusBadge status={a.status} /></td>
                    <td className="px-6 py-4 text-right space-x-1.5 whitespace-nowrap">
                      {a.status === 'SCHEDULED' && (
                        <button
                          onClick={() => handleStatusUpdate(a.id, 'CONFIRMED')}
                          disabled={actionLoading}
                          className="px-2.5 py-1 text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg"
                        >
                          Confirm
                        </button>
                      )}
                      {a.status !== 'COMPLETED' && a.status !== 'CANCELLED' && (
                        <button
                          onClick={() => openRescheduleModal(a)}
                          disabled={actionLoading}
                          className="px-2.5 py-1 text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-lg"
                        >
                          Reschedule
                        </button>
                      )}
                      {a.status !== 'CANCELLED' && a.status !== 'COMPLETED' && (
                        <button
                          onClick={() => handleStatusUpdate(a.id, 'CANCELLED')}
                          disabled={actionLoading}
                          className="px-2.5 py-1 text-xs font-semibold bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 rounded-lg"
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!loading && filteredAppointments.length === 0 && (
              <div className="p-8 text-center text-slate-500">No appointments found matching filter.</div>
            )}
          </div>
        </div>
      )}

      {/* Schedules View */}
      {tab === 'schedules' && (
        <div className="bg-white rounded-xl shadow overflow-hidden border border-slate-200">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-800 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Shift ID</th>
                  <th className="px-6 py-4">Doctor</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Working Hours</th>
                  <th className="px-6 py-4">Availability</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading && <TableSkeleton rows={4} cols={5} />}
                {!loading && schedules.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-slate-400">#{s.id}</td>
                    <td className="px-6 py-4 font-semibold text-slate-900">Dr. {s.doctorName}</td>
                    <td className="px-6 py-4 font-medium text-slate-800">{s.availableDate}</td>
                    <td className="px-6 py-4 text-slate-700">
                      {s.startTime} — {s.endTime}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        s.isAvailable ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {s.isAvailable ? 'Active Shift' : 'Unavailable'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!loading && schedules.length === 0 && (
              <div className="p-8 text-center text-slate-500">
                No doctor shifts configured yet. Click "Add Doctor Shift" to define consultation slots.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {rescheduleModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Reschedule Appointment</h3>
            <p className="text-xs text-slate-500 mb-4">
              Patient: {selectedAppt?.patientName} with Dr. {selectedAppt?.doctorName}
            </p>

            <form onSubmit={handleRescheduleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">New Date *</label>
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  className="input-field"
                  value={newDate}
                  onChange={e => setNewDate(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">New Time Slot *</label>
                <input
                  type="time"
                  required
                  className="input-field"
                  value={newTime.slice(0, 5)}
                  onChange={e => setNewTime(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRescheduleModal(false)}
                  className="btn-secondary"
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Verifying Slot...' : 'Confirm Reschedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Schedule Modal */}
      {scheduleModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-slate-900 mb-1">Add Doctor Consultation Shift</h3>
            <p className="text-xs text-slate-500 mb-4">
              Configure working dates and hours to open appointment booking slots
            </p>

            <form onSubmit={handleScheduleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Assign Doctor *</label>
                <select
                  required
                  className="input-field"
                  value={scheduleForm.doctorId}
                  onChange={e => setScheduleForm({ ...scheduleForm, doctorId: e.target.value })}
                >
                  {doctors.map(d => (
                    <option key={d.id} value={d.id}>Dr. {d.name} ({d.specialization})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Shift Date *</label>
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  className="input-field"
                  value={scheduleForm.availableDate}
                  onChange={e => setScheduleForm({ ...scheduleForm, availableDate: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Start Time *</label>
                  <input
                    type="time"
                    required
                    className="input-field"
                    value={scheduleForm.startTime.slice(0, 5)}
                    onChange={e => setScheduleForm({ ...scheduleForm, startTime: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">End Time *</label>
                  <input
                    type="time"
                    required
                    className="input-field"
                    value={scheduleForm.endTime.slice(0, 5)}
                    onChange={e => setScheduleForm({ ...scheduleForm, endTime: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="shiftAvail"
                  checked={scheduleForm.isAvailable}
                  onChange={e => setScheduleForm({ ...scheduleForm, isAvailable: e.target.checked })}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="shiftAvail" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  Mark shift as available for patient booking
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setScheduleModal(false)}
                  className="btn-secondary"
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Saving...' : 'Save Shift'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
