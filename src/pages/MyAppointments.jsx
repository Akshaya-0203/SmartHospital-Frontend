import React, { useState, useEffect } from 'react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import { ROLE_THEMES, StatusBadge, EmptyState, TableSkeleton } from '../components/shared';
import { Calendar, Clock, User, XCircle, AlertCircle, Plus, X, Check, Stethoscope } from 'lucide-react';

export default function MyAppointments() {
  const { user } = useAuth();
  const theme = ROLE_THEMES[user?.role] || ROLE_THEMES.PATIENT;
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancelling, setCancelling] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [filter, setFilter] = useState('ALL');

  // Booking modal state
  const [showBookModal, setShowBookModal] = useState(false);
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const [bookDoctorId, setBookDoctorId] = useState('');
  const [bookDate, setBookDate] = useState('');
  const [bookTime, setBookTime] = useState('10:00');
  const [bookType, setBookType] = useState('ROUTINE');
  const [bookReason, setBookReason] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookError, setBookError] = useState('');
  const [bookSuccess, setBookSuccess] = useState('');
  const [availableSchedules, setAvailableSchedules] = useState([]);
  const [checkingSchedules, setCheckingSchedules] = useState(false);

  useEffect(() => {
    if (user?.role === 'PATIENT' && user?.patientId) {
      fetchAppointments(`/appointments/patient/${user.patientId}`);
      fetchDoctors();
    } else if (user?.role === 'DOCTOR' && user?.doctorId) {
      fetchAppointments(`/appointments/doctor/${user.doctorId}`);
    } else if (user?.role === 'PATIENT') {
      setLoading(false);
      setError('Patient profile not linked. Please log out and back in.');
    } else if (user?.role === 'DOCTOR') {
      setLoading(false);
      setError('Doctor profile not linked. Please log out and back in.');
    } else {
      setLoading(false);
      setError('Appointments are available for Patient and Doctor roles.');
    }
  }, [user]);

  const fetchAppointments = async (url) => {
    setLoading(true);
    const endpoint = url || (user?.role === 'PATIENT' ? `/appointments/patient/${user?.patientId}` : `/appointments/doctor/${user?.doctorId}`);
    try {
      const res = await client.get(endpoint);
      setAppointments(res.data || []);
      setError(null);
    } catch (err) {
      setError('Failed to load appointments.');
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctors = async () => {
    try {
      const res = await client.get('/doctors');
      const docs = res.data || [];
      setDoctors(docs);
      if (docs.length > 0) {
        const specs = Array.from(new Set(docs.map(d => d.specialization).filter(Boolean)));
        const initialSpec = specs[0] || '';
        setSelectedSpecialty(initialSpec);
        const specDocs = docs.filter(d => d.specialization === initialSpec);
        setBookDoctorId(specDocs.length > 0 ? specDocs[0].id : docs[0].id);
      }
    } catch (err) {
      console.warn('Could not fetch doctors', err);
    }
  };

  // Check doctor schedule availability when doctor or date changes
  useEffect(() => {
    if (showBookModal && bookDoctorId && bookDate) {
      const checkSchedule = async () => {
        setCheckingSchedules(true);
        try {
          const res = await client.get(`/schedules/doctor/${bookDoctorId}/available?date=${bookDate}`);
          setAvailableSchedules(res.data || []);
        } catch {
          setAvailableSchedules([]);
        } finally {
          setCheckingSchedules(false);
        }
      };
      checkSchedule();
    }
  }, [showBookModal, bookDoctorId, bookDate]);

  const handleSpecialtyChange = (spec) => {
    setSelectedSpecialty(spec);
    const specDocs = doctors.filter(d => d.specialization === spec);
    if (specDocs.length > 0) {
      setBookDoctorId(specDocs[0].id);
    } else {
      setBookDoctorId('');
    }
  };

  const cancelAppointment = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return;
    setCancelling(id);
    try {
      await client.put(`/appointments/${id}/cancel`);
      await fetchAppointments();
    } catch {
      alert('Could not cancel appointment. Please try again.');
    } finally {
      setCancelling(null);
    }
  };

  const updateAppointmentStatus = async (id, status) => {
    setUpdatingId(id);
    try {
      await client.put(`/appointments/${id}/status?status=${status}`);
      await fetchAppointments();
    } catch {
      alert('Could not update appointment status. Please try again.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleBookSubmit = async (e) => {
    e.preventDefault();
    setBookError('');
    setBookSuccess('');
    setBookingLoading(true);

    try {
      await client.post('/appointments', {
        patientId: user.patientId,
        doctorId: Number(bookDoctorId),
        appointmentDate: bookDate,
        appointmentTime: bookTime.length === 5 ? bookTime + ':00' : bookTime,
        type: bookType,
        reason: bookReason,
      });

      setBookSuccess('Appointment booked successfully!');
      setTimeout(() => {
        setShowBookModal(false);
        setBookSuccess('');
        setBookReason('');
        fetchAppointments();
      }, 1200);
    } catch (err) {
      setBookError(err?.response?.data?.message || 'Booking failed. Please ensure the doctor has availability at the selected time.');
    } finally {
      setBookingLoading(false);
    }
  };

  const filtered = filter === 'ALL' ? appointments : appointments.filter(a => a.status === filter);

  const uniqueSpecs = Array.from(new Set(doctors.map(d => d.specialization).filter(Boolean)));
  const STANDARD_SPECS = [
    'General Medicine', 'Cardiology', 'Dermatology', 'Obstetrics & Gynaecology',
    'Ophthalmology', 'Orthopaedics', 'Paediatrics', 'ENT', 'Neurology',
    'Psychiatry', 'Pulmonology', 'Gastroenterology', 'Urology', 'Nephrology',
    'Endocrinology', 'Oncology', 'Dentistry', 'Physiotherapy'
  ];
  const specialties = Array.from(new Set([...uniqueSpecs, ...STANDARD_SPECS]));
  const filteredSpecialtyDoctors = doctors.filter(d => !selectedSpecialty || d.specialization === selectedSpecialty);

  const tabs = [
    { key: 'ALL', label: 'All' },
    { key: 'SCHEDULED', label: 'Scheduled' },
    { key: 'CONFIRMED', label: 'Confirmed' },
    { key: 'COMPLETED', label: 'Completed' },
    { key: 'CANCELLED', label: 'Cancelled' },
  ];

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-5">
      {/* Page header with Book CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Appointments</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {appointments.length} total appointment{appointments.length !== 1 ? 's' : ''}
          </p>
        </div>
        {user?.role === 'PATIENT' && (
          <button
            onClick={() => {
              setBookDate(todayStr);
              setShowBookModal(true);
            }}
            className="btn-primary"
            style={{ backgroundColor: theme.primary }}
          >
            <Plus className="w-4 h-4" /> Book Appointment
          </button>
        )}
      </div>

      {/* Error state */}
      {error && (
        <div className="card p-4 bg-red-50 border-red-200 flex items-center gap-3 text-red-700 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex items-center gap-1 flex-wrap">
        {tabs.map(tab => {
          const count = tab.key === 'ALL' ? appointments.length : appointments.filter(a => a.status === tab.key).length;
          const isActive = filter === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className="px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all"
              style={
                isActive
                  ? { backgroundColor: theme.primary, color: 'white' }
                  : { backgroundColor: '#F1F5F9', color: '#64748B' }
              }
            >
              {tab.label} {count > 0 && <span className="ml-1 text-xs opacity-75">({count})</span>}
            </button>
          );
        })}
      </div>

      {/* Table card */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>{user?.role === 'DOCTOR' ? 'Patient' : 'Doctor'}</th>
                <th>Date & Time</th>
                <th>Type</th>
                <th>Reason</th>
                <th>Status</th>
                {user?.role !== 'PATIENT' && <th className="text-right">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {loading && <TableSkeleton rows={3} cols={user?.role === 'PATIENT' ? 5 : 6} />}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={user?.role === 'PATIENT' ? 5 : 6} className="py-12 text-center text-slate-400 text-sm">
                    No appointments found for the selected filter.
                  </td>
                </tr>
              )}
              {!loading && filtered.map(apt => (
                <tr key={apt.id}>
                  <td>
                    {user?.role === 'DOCTOR' ? (
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-white text-xs font-bold"
                          style={{ backgroundColor: theme.primary }}
                        >
                          {(apt.patientName || 'P').charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800">{apt.patientName || `Patient #${apt.patientId}`}</p>
                          <p className="text-xs text-slate-400">ID: #{apt.patientId}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-white text-xs font-bold"
                          style={{ backgroundColor: theme.primary }}
                        >
                          {(apt.doctorName || 'D').charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800">Dr. {apt.doctorName}</p>
                        </div>
                      </div>
                    )}
                  </td>
                  <td>
                    <div className="flex flex-col">
                      <span className="font-medium text-slate-800 flex items-center gap-1.5">
                        <Calendar style={{ width: 12, height: 12, color: theme.primary }} />
                        {apt.appointmentDate}
                      </span>
                      <span className="text-slate-500 text-xs flex items-center gap-1.5 mt-0.5">
                        <Clock style={{ width: 10, height: 10 }} />
                        {apt.appointmentTime}
                      </span>
                    </div>
                  </td>
                  <td>
                    <span className="text-slate-600 text-xs font-medium bg-slate-100 px-2 py-0.5 rounded">
                      {apt.type === 'FOLLOW_UP' ? 'Follow-up' : 'Consultation'}
                    </span>
                  </td>
                  <td>
                    <span className="text-slate-600 text-sm line-clamp-1 max-w-[200px]">
                      {apt.reason || '—'}
                    </span>
                  </td>
                  <td>
                    <StatusBadge status={apt.status} />
                  </td>
                  {user?.role !== 'PATIENT' && (
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {user?.role === 'DOCTOR' && apt.status === 'SCHEDULED' && (
                          <button
                            onClick={() => updateAppointmentStatus(apt.id, 'CONFIRMED')}
                            disabled={updatingId === apt.id}
                            className="btn-primary text-xs py-1 px-2.5"
                            style={{ backgroundColor: theme.primary }}
                          >
                            Confirm
                          </button>
                        )}
                        {user?.role === 'DOCTOR' && apt.status === 'CONFIRMED' && (
                          <button
                            onClick={() => updateAppointmentStatus(apt.id, 'COMPLETED')}
                            disabled={updatingId === apt.id}
                            className="btn-primary text-xs py-1 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                          >
                            Complete
                          </button>
                        )}
                        {['SCHEDULED', 'CONFIRMED'].includes(apt.status) ? (
                          <button
                            onClick={() => cancelAppointment(apt.id)}
                            disabled={cancelling === apt.id}
                            className="btn-danger py-1 px-2.5 text-xs"
                          >
                            {cancelling === apt.id ? (
                              <span className="inline-block w-3 h-3 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <XCircle style={{ width: 12, height: 12 }} />
                            )}
                            Cancel
                          </button>
                        ) : (
                          <span className="text-slate-300 text-xs">—</span>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Booking Modal */}
      {showBookModal && (
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
                <h3 className="text-lg font-bold text-slate-900">Book New Appointment</h3>
              </div>
              <button
                onClick={() => setShowBookModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleBookSubmit} className="mt-4 space-y-4">
              {bookError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs font-medium">
                  {bookError}
                </div>
              )}
              {bookSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-xs font-medium flex items-center gap-2">
                  <Check className="w-4 h-4" /> {bookSuccess}
                </div>
              )}

              {/* Select Medical Specialty First */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Medical Specialty</label>
                <select
                  className="input-field"
                  value={selectedSpecialty}
                  onChange={e => handleSpecialtyChange(e.target.value)}
                >
                  {specialties.map(spec => (
                    <option key={spec} value={spec}>{spec}</option>
                  ))}
                  {specialties.length === 0 && <option value="">General Medicine</option>}
                </select>
              </div>

              {/* Select Doctor belonging to that Specialty */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Doctor</label>
                <select
                  required
                  className="input-field"
                  value={bookDoctorId}
                  onChange={e => setBookDoctorId(e.target.value)}
                >
                  {filteredSpecialtyDoctors.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.specialization}) {d.available ? '— Available' : '— Currently Busy'}
                    </option>
                  ))}
                  {filteredSpecialtyDoctors.length === 0 && (
                    <option value="">No doctors available for this specialty</option>
                  )}
                </select>
              </div>

              {/* Schedule availability feedback */}
              {availableSchedules.length > 0 && (
                <div className="p-2.5 bg-teal-50 border border-teal-200 text-teal-800 rounded-lg text-xs">
                  <span className="font-semibold">Doctor's Schedule for {bookDate}:</span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {availableSchedules.map(s => (
                      <span key={s.id} className="bg-teal-100 text-teal-900 px-2 py-0.5 rounded font-mono text-xs">
                        {s.startTime ? s.startTime.toString().slice(0, 5) : ''} - {s.endTime ? s.endTime.toString().slice(0, 5) : ''}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    min={todayStr}
                    className="input-field"
                    value={bookDate}
                    onChange={e => setBookDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Time</label>
                  <select
                    className="input-field"
                    value={bookTime}
                    onChange={e => setBookTime(e.target.value)}
                  >
                    <option value="09:00">09:00 AM</option>
                    <option value="09:30">09:30 AM</option>
                    <option value="10:00">10:00 AM</option>
                    <option value="10:30">10:30 AM</option>
                    <option value="11:00">11:00 AM</option>
                    <option value="11:30">11:30 AM</option>
                    <option value="14:00">02:00 PM</option>
                    <option value="14:30">02:30 PM</option>
                    <option value="15:00">03:00 PM</option>
                    <option value="15:30">03:30 PM</option>
                    <option value="16:00">04:00 PM</option>
                    <option value="16:30">04:30 PM</option>
                  </select>
                </div>
              </div>

              {/* Type - Consultation and Follow-up only */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Appointment Type</label>
                <select
                  className="input-field"
                  value={bookType}
                  onChange={e => setBookType(e.target.value)}
                >
                  <option value="ROUTINE">Consultation</option>
                  <option value="FOLLOW_UP">Follow-up</option>
                </select>
              </div>

              {/* Reason */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Reason / Symptoms</label>
                <textarea
                  rows={2}
                  className="input-field"
                  placeholder="Describe your symptoms or reason for visit..."
                  value={bookReason}
                  onChange={e => setBookReason(e.target.value)}
                />
              </div>

              {/* Action buttons */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowBookModal(false)}
                  className="btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={bookingLoading || doctors.length === 0}
                  className="btn-primary text-xs"
                  style={{ backgroundColor: theme.primary }}
                >
                  {bookingLoading ? 'Booking...' : 'Confirm Appointment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
