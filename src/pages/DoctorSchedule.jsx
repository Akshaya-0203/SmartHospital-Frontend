import React, { useState, useEffect } from 'react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import { ROLE_THEMES, StatusBadge } from '../components/shared';
import {
  Calendar, Clock, Plus, X, Check, Trash2, AlertCircle, ToggleLeft, ToggleRight
} from 'lucide-react';

export default function DoctorSchedule() {
  const { user } = useAuth();
  const theme = ROLE_THEMES.DOCTOR;

  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Add Schedule Form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newDate, setNewDate] = useState('');
  const [newStart, setNewStart] = useState('09:00');
  const [newEnd, setNewEnd] = useState('17:00');
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState('');
  const [addSuccess, setAddSuccess] = useState('');

  // Toggle/Delete
  const [togglingId, setTogglingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const doctorId = user?.doctorId;
  const todayStr = new Date().toISOString().split('T')[0];

  const fetchSchedules = async () => {
    if (!doctorId) {
      setError('Doctor profile not loaded. Please log out and log back in.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await client.get(`/schedules/doctor/${doctorId}`);
      const sorted = (res.data || []).sort((a, b) =>
        new Date(a.availableDate) - new Date(b.availableDate)
      );
      setSchedules(sorted);
    } catch (err) {
      setError('Failed to load your schedule. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, [doctorId]);

  const handleAddSchedule = async (e) => {
    e.preventDefault();
    setAddError('');
    setAddSuccess('');

    if (!newDate) { setAddError('Please select a date.'); return; }
    if (!newStart || !newEnd) { setAddError('Please set start and end times.'); return; }
    if (newStart >= newEnd) { setAddError('End time must be after start time.'); return; }
    if (newDate < todayStr) { setAddError('Cannot add schedule for a past date.'); return; }

    setAddLoading(true);
    try {
      await client.post('/schedules', {
        doctorId,
        availableDate: newDate,
        startTime: newStart,
        endTime: newEnd,
        isAvailable: true,
      });
      setAddSuccess('Schedule added successfully!');
      setNewDate('');
      setNewStart('09:00');
      setNewEnd('17:00');
      fetchSchedules();
      setTimeout(() => {
        setShowAddForm(false);
        setAddSuccess('');
      }, 1200);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.response?.data || 'Failed to add schedule.';
      setAddError(typeof msg === 'string' ? msg : 'Failed to add schedule.');
    } finally {
      setAddLoading(false);
    }
  };

  const handleToggleAvailability = async (schedule) => {
    setTogglingId(schedule.id);
    try {
      await client.put(`/schedules/${schedule.id}`, {
        doctorId,
        availableDate: schedule.availableDate,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        isAvailable: !schedule.available,
      });
      fetchSchedules();
    } catch (err) {
      alert('Failed to update availability. Please try again.');
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this schedule slot?')) return;
    setDeletingId(id);
    try {
      await client.delete(`/schedules/${id}`);
      setSchedules(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      alert('Failed to delete schedule. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  // Group by date for display
  const groupedByDate = schedules.reduce((acc, s) => {
    const d = s.availableDate;
    if (!acc[d]) acc[d] = [];
    acc[d].push(s);
    return acc;
  }, {});
  const sortedDates = Object.keys(groupedByDate).sort();

  const upcomingDates = sortedDates.filter(d => d >= todayStr);
  const pastDates = sortedDates.filter(d => d < todayStr);

  const formatDate = (dateStr) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '—';
    const [h, m] = timeStr.split(':');
    const hour = parseInt(h, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayH = hour % 12 || 12;
    return `${displayH}:${m} ${ampm}`;
  };

  return (
    <div className="space-y-6">
      {/* Header banner */}
      <div
        className="rounded-xl p-5 md:p-6 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        style={{ background: theme.gradient }}
      >
        <div>
          <h2 className="text-xl font-bold">My Schedule</h2>
          <p className="text-white/80 text-sm mt-1">
            Manage your availability so patients can book appointments with you.
          </p>
        </div>
        <button
          onClick={() => { setShowAddForm(true); setAddError(''); setAddSuccess(''); }}
          className="inline-flex items-center gap-2 bg-white text-purple-900 font-bold text-sm px-4 py-2.5 rounded-lg shadow-sm hover:bg-purple-50 transition-colors flex-shrink-0"
        >
          <Plus className="w-4 h-4" /> Add Availability
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Add Schedule Form */}
      {showAddForm && (
        <div className="card p-5 border-2" style={{ borderColor: theme.primary + '40' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              <Calendar style={{ width: 16, height: 16, color: theme.primary }} />
              Add Availability Slot
            </h3>
            <button
              onClick={() => { setShowAddForm(false); setAddError(''); setAddSuccess(''); }}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {addError && (
            <div className="flex items-center gap-2 text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm mb-4">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {addError}
            </div>
          )}
          {addSuccess && (
            <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 text-sm mb-4">
              <Check className="w-4 h-4 flex-shrink-0" />
              {addSuccess}
            </div>
          )}

          <form onSubmit={handleAddSchedule} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Date</label>
              <input
                type="date"
                value={newDate}
                min={todayStr}
                onChange={e => setNewDate(e.target.value)}
                required
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Start Time</label>
              <input
                type="time"
                value={newStart}
                onChange={e => setNewStart(e.target.value)}
                required
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">End Time</label>
              <input
                type="time"
                value={newEnd}
                onChange={e => setNewEnd(e.target.value)}
                required
                className="input-field"
              />
            </div>

            <div className="sm:col-span-3 flex justify-end gap-3 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => { setShowAddForm(false); setAddError(''); setAddSuccess(''); }}
                className="btn-secondary text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={addLoading}
                className="btn-primary text-sm"
                style={{ backgroundColor: theme.primary }}
              >
                {addLoading ? 'Saving…' : 'Save Slot'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="card p-8 text-center text-slate-400 text-sm">Loading your schedule…</div>
      )}

      {/* Upcoming schedules */}
      {!loading && (
        <>
          {upcomingDates.length === 0 && !error && (
            <div className="card p-8 text-center">
              <Calendar className="w-10 h-10 mx-auto mb-3 text-slate-300" />
              <p className="text-slate-500 font-medium">No upcoming availability set</p>
              <p className="text-slate-400 text-sm mt-1">Click "Add Availability" to set the dates and times when you are available for appointments.</p>
            </div>
          )}

          {upcomingDates.length > 0 && (
            <div className="card overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100">
                <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                  <Calendar style={{ width: 16, height: 16, color: theme.primary }} />
                  Upcoming Availability
                  <span
                    className="ml-1 text-xs font-bold px-2 py-0.5 rounded-full text-white"
                    style={{ backgroundColor: theme.primary }}
                  >
                    {upcomingDates.length} days
                  </span>
                </h3>
              </div>
              <div className="divide-y divide-slate-100">
                {upcomingDates.map(date => (
                  <div key={date} className="px-5 py-4">
                    <p className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-1.5">
                      <Calendar style={{ width: 13, height: 13, color: theme.primary }} />
                      {date === todayStr ? '📅 Today — ' : ''}{formatDate(date)}
                    </p>
                    <div className="space-y-2">
                      {groupedByDate[date].map(slot => (
                        <div
                          key={slot.id}
                          className="flex items-center justify-between bg-slate-50 rounded-lg px-4 py-3 border border-slate-100"
                        >
                          <div className="flex items-center gap-3">
                            <Clock style={{ width: 14, height: 14, color: theme.primary }} />
                            <span className="text-sm font-medium text-slate-700">
                              {formatTime(slot.startTime)} — {formatTime(slot.endTime)}
                            </span>
                            <span
                              className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                                slot.available
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-slate-200 text-slate-500'
                              }`}
                            >
                              {slot.available ? 'Available' : 'Unavailable'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {/* Toggle availability */}
                            <button
                              onClick={() => handleToggleAvailability(slot)}
                              disabled={togglingId === slot.id}
                              title={slot.available ? 'Mark unavailable' : 'Mark available'}
                              className="p-1.5 rounded-lg hover:bg-white border border-slate-200 text-slate-500 hover:text-slate-700 transition-colors"
                            >
                              {togglingId === slot.id
                                ? <Clock className="w-4 h-4 animate-spin" />
                                : slot.available
                                  ? <ToggleRight className="w-4 h-4 text-emerald-600" />
                                  : <ToggleLeft className="w-4 h-4" />
                              }
                            </button>
                            {/* Delete */}
                            <button
                              onClick={() => handleDelete(slot.id)}
                              disabled={deletingId === slot.id}
                              title="Remove this slot"
                              className="p-1.5 rounded-lg hover:bg-red-50 border border-slate-200 text-slate-400 hover:text-red-600 transition-colors"
                            >
                              {deletingId === slot.id
                                ? <Clock className="w-4 h-4 animate-spin" />
                                : <Trash2 className="w-4 h-4" />
                              }
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Past schedules (collapsible section) */}
          {pastDates.length > 0 && (
            <details className="card overflow-hidden group">
              <summary className="px-5 py-4 cursor-pointer text-sm font-semibold text-slate-500 hover:text-slate-700 flex items-center gap-2 select-none">
                <Clock style={{ width: 14, height: 14 }} />
                Past Schedule ({pastDates.length} days) — click to expand
              </summary>
              <div className="divide-y divide-slate-100 border-t border-slate-100">
                {pastDates.map(date => (
                  <div key={date} className="px-5 py-3 opacity-70">
                    <p className="text-xs font-semibold text-slate-500 mb-2">{formatDate(date)}</p>
                    <div className="space-y-1.5">
                      {groupedByDate[date].map(slot => (
                        <div key={slot.id} className="flex items-center justify-between bg-slate-50 rounded-lg px-4 py-2.5">
                          <div className="flex items-center gap-3">
                            <Clock style={{ width: 12, height: 12, color: '#94a3b8' }} />
                            <span className="text-sm text-slate-500">
                              {formatTime(slot.startTime)} — {formatTime(slot.endTime)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">Past</span>
                            <button
                              onClick={() => handleDelete(slot.id)}
                              disabled={deletingId === slot.id}
                              title="Remove this entry"
                              className="p-1 rounded hover:bg-red-50 text-slate-300 hover:text-red-500 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </details>
          )}
        </>
      )}

      {/* Tips */}
      <div
        className="rounded-xl p-4 text-sm flex items-start gap-3"
        style={{ backgroundColor: theme.light, color: theme.primary }}
      >
        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold">How availability works:</span> When you add a time slot for a date, patients can only book appointments with you during that window. If you don't add any slots, patients can still book appointments if your account is marked active — but adding explicit slots gives you full control over your calendar.
        </div>
      </div>
    </div>
  );
}
