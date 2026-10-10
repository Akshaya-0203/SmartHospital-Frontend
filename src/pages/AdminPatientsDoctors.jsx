import React, { useEffect, useState } from 'react';
import client from '../api/client';
import { ROLE_THEMES, StatusBadge, EmptyState, TableSkeleton } from '../components/shared';
import { Users, Search, Stethoscope, Phone, Mail, CheckCircle2, XCircle, Plus, Edit2, AlertCircle } from 'lucide-react';

export default function AdminPatientsDoctors() {
  const [tab, setTab] = useState('patients'); // 'patients' or 'doctors'
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [search, setSearch] = useState('');

  // Doctor Edit / Create Modal State
  const [showDoctorModal, setShowDoctorModal] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState(null);
  const [doctorForm, setDoctorForm] = useState({
    name: '',
    specialization: '',
    phone: '',
    email: '',
    available: true,
  });
  const [modalLoading, setModalLoading] = useState(false);

  const loadData = () => {
    setLoading(true);
    Promise.all([
      client.get('/patients').catch(() => ({ data: [] })),
      client.get('/doctors').catch(() => ({ data: [] })),
    ])
      .then(([patRes, docRes]) => {
        setPatients(patRes.data || []);
        setDoctors(docRes.data || []);
      })
      .catch(() => setError('Failed to load patient and doctor records.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const openNewDoctorModal = () => {
    setEditingDoctor(null);
    setDoctorForm({
      name: '',
      specialization: 'General Physician',
      phone: '',
      email: '',
      available: true,
    });
    setShowDoctorModal(true);
  };

  const openEditDoctorModal = (doc) => {
    setEditingDoctor(doc);
    setDoctorForm({
      name: doc.name || '',
      specialization: doc.specialization || '',
      phone: doc.phone || '',
      email: doc.email || '',
      available: doc.available ?? true,
    });
    setShowDoctorModal(true);
  };

  const handleDoctorSubmit = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    setError(null);
    try {
      if (editingDoctor) {
        await client.put(`/doctors/${editingDoctor.id}`, doctorForm);
        setSuccessMsg(`Dr. ${doctorForm.name} updated successfully.`);
      } else {
        await client.post('/doctors', doctorForm);
        setSuccessMsg(`Dr. ${doctorForm.name} added to hospital staff.`);
      }
      setShowDoctorModal(false);
      loadData();
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to save doctor details.');
    } finally {
      setModalLoading(false);
    }
  };

  const filteredPatients = patients.filter(p =>
    (p.name && p.name.toLowerCase().includes(search.toLowerCase())) ||
    (p.email && p.email.toLowerCase().includes(search.toLowerCase())) ||
    (p.phone && p.phone.includes(search))
  );

  const filteredDoctors = doctors.filter(d =>
    (d.name && d.name.toLowerCase().includes(search.toLowerCase())) ||
    (d.specialization && d.specialization.toLowerCase().includes(search.toLowerCase())) ||
    (d.email && d.email.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Hospital Directory & Management</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage registered patients, clinical doctors, specialties, and contact rosters
          </p>
        </div>
        {tab === 'doctors' && (
          <button onClick={openNewDoctorModal} className="btn-primary flex items-center gap-2 self-start sm:self-auto">
            <Plus className="w-4 h-4" /> Add Doctor
          </button>
        )}
      </div>

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

      {/* Tabs & Search */}
      <div className="card p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            onClick={() => { setTab('patients'); setSearch(''); }}
            className={`px-4 py-2 rounded-lg font-bold text-sm transition-all flex items-center gap-2 ${
              tab === 'patients'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Users className="w-4 h-4" /> Patients ({patients.length})
          </button>
          <button
            onClick={() => { setTab('doctors'); setSearch(''); }}
            className={`px-4 py-2 rounded-lg font-bold text-sm transition-all flex items-center gap-2 ${
              tab === 'doctors'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Stethoscope className="w-4 h-4" /> Doctors & Specialists ({doctors.length})
          </button>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            className="input-field pl-9"
            placeholder={`Search ${tab}...`}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Patients Tab Content */}
      {tab === 'patients' && (
        <div className="bg-white rounded-xl shadow overflow-hidden border border-slate-200">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-800 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">ID</th>
                  <th className="px-6 py-4">Full Name</th>
                  <th className="px-6 py-4">Age / Gender</th>
                  <th className="px-6 py-4">Contact Phone</th>
                  <th className="px-6 py-4">Email</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading && <TableSkeleton rows={4} cols={5} />}
                {!loading && filteredPatients.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-slate-400">#{p.id}</td>
                    <td className="px-6 py-4 font-semibold text-slate-900">{p.name}</td>
                    <td className="px-6 py-4 text-slate-600">
                      {p.age ? `${p.age} yrs` : '—'} • {p.gender || '—'}
                    </td>
                    <td className="px-6 py-4 text-slate-700 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" /> {p.phone || '—'}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      <span className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-400" /> {p.email || '—'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!loading && filteredPatients.length === 0 && (
              <div className="p-8 text-center text-slate-500">No patient records found.</div>
            )}
          </div>
        </div>
      )}

      {/* Doctors Tab Content */}
      {tab === 'doctors' && (
        <div className="bg-white rounded-xl shadow overflow-hidden border border-slate-200">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-800 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Doctor Name</th>
                  <th className="px-6 py-4">Specialization</th>
                  <th className="px-6 py-4">Phone</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading && <TableSkeleton rows={4} cols={6} />}
                {!loading && filteredDoctors.map(doc => (
                  <tr key={doc.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-900">Dr. {doc.name}</td>
                    <td className="px-6 py-4">
                      <span className="bg-purple-100 text-purple-800 text-xs font-bold px-2.5 py-0.5 rounded-full">
                        {doc.specialization}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{doc.phone || '—'}</td>
                    <td className="px-6 py-4 text-slate-600">{doc.email || '—'}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                        doc.available ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {doc.available ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <XCircle className="w-3 h-3 text-slate-400" />}
                        {doc.available ? 'Available' : 'On Leave'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => openEditDoctorModal(doc)}
                        className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg inline-flex items-center gap-1.5 transition-colors"
                      >
                        <Edit2 className="w-3 h-3" /> Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!loading && filteredDoctors.length === 0 && (
              <div className="p-8 text-center text-slate-500">No doctor records found.</div>
            )}
          </div>
        </div>
      )}

      {/* Doctor Modal */}
      {showDoctorModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-slate-900 mb-1">
              {editingDoctor ? `Edit Dr. ${editingDoctor.name}` : 'Add New Doctor'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              {editingDoctor ? 'Update doctor specialty and availability' : 'Register a new doctor to the roster'}
            </p>

            <form onSubmit={handleDoctorSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Doctor Name *</label>
                <input
                  type="text"
                  required
                  className="input-field"
                  placeholder="e.g. Sarah Connor"
                  value={doctorForm.name}
                  onChange={e => setDoctorForm({ ...doctorForm, name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Specialization *</label>
                <input
                  type="text"
                  required
                  className="input-field"
                  placeholder="e.g. Cardiology, Neurology, Pediatrics"
                  value={doctorForm.specialization}
                  onChange={e => setDoctorForm({ ...doctorForm, specialization: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    className="input-field"
                    placeholder="e.g. 9876543210"
                    value={doctorForm.phone}
                    onChange={e => setDoctorForm({ ...doctorForm, phone: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    className="input-field"
                    placeholder="doctor@hospital.com"
                    value={doctorForm.email}
                    onChange={e => setDoctorForm({ ...doctorForm, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="docAvail"
                  checked={doctorForm.available}
                  onChange={e => setDoctorForm({ ...doctorForm, available: e.target.checked })}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="docAvail" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  Currently active and accepting appointments
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowDoctorModal(false)}
                  className="btn-secondary"
                  disabled={modalLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={modalLoading}
                >
                  {modalLoading ? 'Saving...' : editingDoctor ? 'Save Changes' : 'Create Doctor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
