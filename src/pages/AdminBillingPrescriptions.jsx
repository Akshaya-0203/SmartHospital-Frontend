import React, { useEffect, useState } from 'react';
import client from '../api/client';
import { StatusBadge, EmptyState, TableSkeleton } from '../components/shared';
import { 
  CreditCard, Plus, UploadCloud, FileText, CheckCircle2, 
  AlertCircle, DollarSign, Clock, Search, Info 
} from 'lucide-react';

export default function AdminBillingPrescriptions() {
  const [tab, setTab] = useState('billing'); // 'billing' or 'prescriptions'
  const [bills, setBills] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // New Bill Modal State
  const [showBillModal, setShowBillModal] = useState(false);
  const [billForm, setBillForm] = useState({
    patientId: '',
    appointmentId: '',
    consultationCharge: 500,
    laboratoryCharge: 0,
    medicineCharge: 0,
    otherCharges: 0,
  });

  // Upload Prescription Modal State
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [prescPatientId, setPrescPatientId] = useState('');
  const [prescDoctorId, setPrescDoctorId] = useState('');
  const [prescMedicine, setPrescMedicine] = useState('Digital Prescription Rx');
  const [prescNotes, setPrescNotes] = useState('');
  const [prescFile, setPrescFile] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  const loadData = () => {
    setLoading(true);
    Promise.all([
      client.get('/billing').catch(() => ({ data: [] })),
      client.get('/prescriptions').catch(() => ({ data: [] })),
      client.get('/patients').catch(() => ({ data: [] })),
      client.get('/doctors').catch(() => ({ data: [] })),
    ])
      .then(([bRes, pRes, patRes, docRes]) => {
        setBills(bRes.data || []);
        setPrescriptions(pRes.data || []);
        setPatients(patRes.data || []);
        setDoctors(docRes.data || []);
        if (patRes.data && patRes.data.length > 0) {
          setBillForm(prev => ({ ...prev, patientId: patRes.data[0].id }));
          setPrescPatientId(patRes.data[0].id);
        }
        if (docRes.data && docRes.data.length > 0) {
          setPrescDoctorId(docRes.data[0].id);
        }
      })
      .catch(() => setError('Failed to load billing and prescription records.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleBillStatusUpdate = async (id, status) => {
    setError(null);
    try {
      await client.put(`/billing/${id}/status?status=${status}`);
      setSuccessMsg(`Bill #${id} marked as ${status} (Simulated Demo Payment).`);
      loadData();
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to update billing status.');
    }
  };

  const handleCreateBill = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    setError(null);
    try {
      const payload = {
        patientId: Number(billForm.patientId),
        appointmentId: billForm.appointmentId ? Number(billForm.appointmentId) : null,
        consultationCharge: Number(billForm.consultationCharge),
        laboratoryCharge: Number(billForm.laboratoryCharge),
        medicineCharge: Number(billForm.medicineCharge),
        otherCharges: Number(billForm.otherCharges),
      };
      await client.post('/billing', payload);
      setSuccessMsg('New invoice generated successfully.');
      setShowBillModal(false);
      loadData();
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to create bill.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleUploadPrescription = async (e) => {
    e.preventDefault();
    if (!prescFile) {
      setError('Please select an image or PDF document to attach.');
      return;
    }
    setModalLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('patientId', prescPatientId);
    if (prescDoctorId) formData.append('doctorId', prescDoctorId);
    formData.append('medicineName', prescMedicine);
    formData.append('notes', prescNotes);
    formData.append('file', prescFile);

    try {
      await client.post('/prescriptions/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSuccessMsg(`Prescription document '${prescFile.name}' uploaded and linked successfully.`);
      setShowPrescriptionModal(false);
      setPrescFile(null);
      setPrescNotes('');
      loadData();
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to upload prescription document.');
    } finally {
      setModalLoading(false);
    }
  };

  const filteredBills = bills.filter(b => {
    const pName = b.patientName || `Patient #${b.patientId}`;
    return pName.toLowerCase().includes(searchTerm.toLowerCase()) || String(b.id).includes(searchTerm);
  });

  const filteredPrescriptions = prescriptions.filter(p => {
    const pName = p.patientName || `Patient #${p.patientId}`;
    const med = p.medicineName || '';
    return pName.toLowerCase().includes(searchTerm.toLowerCase()) || med.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Hospital Billing & Digital Prescriptions</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Administer invoices, itemized fee accounting, and doctor prescription uploads
          </p>
        </div>
        <div className="flex items-center gap-2">
          {tab === 'billing' ? (
            <button onClick={() => setShowBillModal(true)} className="btn-primary flex items-center gap-1.5">
              <Plus className="w-4 h-4" /> Create Bill
            </button>
          ) : (
            <button onClick={() => setShowPrescriptionModal(true)} className="btn-primary flex items-center gap-1.5">
              <UploadCloud className="w-4 h-4" /> Upload Prescription
            </button>
          )}
        </div>
      </div>

      {/* Simulated notice */}
      <div className="card p-3.5 bg-blue-50 border-blue-200 flex items-start gap-2.5 text-blue-800 text-xs">
        <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-blue-600" />
        <span>
          <strong>Notice:</strong> Payments marked in this portal update hospital ledger balances for demonstration and academic reporting. Real banking gateway integrations are simulated.
        </span>
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

      {/* Tabs & Search */}
      <div className="card p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setTab('billing'); setSearchTerm(''); }}
            className={`px-4 py-2 rounded-lg font-bold text-sm transition-all flex items-center gap-2 ${
              tab === 'billing' ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <CreditCard className="w-4 h-4" /> Patient Invoices ({bills.length})
          </button>
          <button
            onClick={() => { setTab('prescriptions'); setSearchTerm(''); }}
            className={`px-4 py-2 rounded-lg font-bold text-sm transition-all flex items-center gap-2 ${
              tab === 'prescriptions' ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" /> Digital Prescriptions ({prescriptions.length})
          </button>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            className="input-field pl-9"
            placeholder={`Search ${tab}...`}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Billing Tab */}
      {tab === 'billing' && (
        <div className="bg-white rounded-xl shadow overflow-hidden border border-slate-200">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-800 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Bill #</th>
                  <th className="px-6 py-4">Patient</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Consultation</th>
                  <th className="px-6 py-4">Lab</th>
                  <th className="px-6 py-4">Medicines</th>
                  <th className="px-6 py-4">Total Amount</th>
                  <th className="px-6 py-4">Payment</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading && <TableSkeleton rows={4} cols={9} />}
                {!loading && filteredBills.map(b => (
                  <tr key={b.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs font-bold text-slate-700">#{b.id}</td>
                    <td className="px-6 py-4 font-semibold text-slate-900">
                      {b.patientName || `Patient #${b.patientId}`}
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-xs">{b.billDate}</td>
                    <td className="px-6 py-4 text-slate-600">₹{(b.consultationCharge || 0).toFixed(2)}</td>
                    <td className="px-6 py-4 text-slate-600">₹{(b.laboratoryCharge || 0).toFixed(2)}</td>
                    <td className="px-6 py-4 text-slate-600">₹{(b.medicineCharge || 0).toFixed(2)}</td>
                    <td className="px-6 py-4 font-bold text-slate-900 text-base">
                      ₹{(b.totalAmount || 0).toFixed(2)}
                    </td>
                    <td className="px-6 py-4"><StatusBadge status={b.paymentStatus} /></td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      {b.paymentStatus === 'PENDING' ? (
                        <button
                          onClick={() => handleBillStatusUpdate(b.id, 'PAID')}
                          className="px-2.5 py-1 text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg"
                        >
                          Mark Paid
                        </button>
                      ) : (
                        <button
                          onClick={() => handleBillStatusUpdate(b.id, 'PENDING')}
                          className="px-2.5 py-1 text-xs font-semibold bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 rounded-lg"
                        >
                          Revert Pending
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!loading && filteredBills.length === 0 && (
              <div className="p-8 text-center text-slate-500">No invoices found.</div>
            )}
          </div>
        </div>
      )}

      {/* Prescriptions Tab */}
      {tab === 'prescriptions' && (
        <div className="bg-white rounded-xl shadow overflow-hidden border border-slate-200">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-800 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Rx ID</th>
                  <th className="px-6 py-4">Patient</th>
                  <th className="px-6 py-4">Prescribed By</th>
                  <th className="px-6 py-4">Medicine / Document</th>
                  <th className="px-6 py-4">Dosage / Details</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading && <TableSkeleton rows={4} cols={7} />}
                {!loading && filteredPrescriptions.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs font-bold text-slate-700">#{p.id}</td>
                    <td className="px-6 py-4 font-semibold text-slate-900">
                      {p.patientName || `Patient #${p.patientId}`}
                    </td>
                    <td className="px-6 py-4 text-slate-700">
                      {p.doctorName ? `Dr. ${p.doctorName}` : (p.doctorId ? `Doctor #${p.doctorId}` : 'Hospital Staff')}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-900">{p.medicineName}</td>
                    <td className="px-6 py-4 text-slate-600 text-xs">
                      {p.dosage} • {p.frequency}
                      {p.instructions && (
                        <span className="block text-[11px] text-slate-400 mt-0.5 truncate max-w-xs">
                          {p.instructions}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-xs">{p.prescriptionDate}</td>
                    <td className="px-6 py-4"><StatusBadge status={p.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!loading && filteredPrescriptions.length === 0 && (
              <div className="p-8 text-center text-slate-500">No prescriptions found.</div>
            )}
          </div>
        </div>
      )}

      {/* Create Bill Modal */}
      {showBillModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-slate-900 mb-1">Create Patient Invoice</h3>
            <p className="text-xs text-slate-500 mb-4">Itemize hospital, laboratory, and pharmacy charges</p>

            <form onSubmit={handleCreateBill} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Patient *</label>
                <select
                  required
                  className="input-field"
                  value={billForm.patientId}
                  onChange={e => setBillForm({ ...billForm, patientId: e.target.value })}
                >
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>{p.name} (#{p.id})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Consultation Fee (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="input-field"
                    value={billForm.consultationCharge}
                    onChange={e => setBillForm({ ...billForm, consultationCharge: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Laboratory Charge (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="input-field"
                    value={billForm.laboratoryCharge}
                    onChange={e => setBillForm({ ...billForm, laboratoryCharge: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Medicine Charges (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="input-field"
                    value={billForm.medicineCharge}
                    onChange={e => setBillForm({ ...billForm, medicineCharge: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Other Hospital Fees (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="input-field"
                    value={billForm.otherCharges}
                    onChange={e => setBillForm({ ...billForm, otherCharges: e.target.value })}
                  />
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex justify-between items-center text-sm font-bold text-slate-800">
                <span>Calculated Total:</span>
                <span className="text-emerald-600 text-base">
                  ₹{(
                    (Number(billForm.consultationCharge) || 0) +
                    (Number(billForm.laboratoryCharge) || 0) +
                    (Number(billForm.medicineCharge) || 0) +
                    (Number(billForm.otherCharges) || 0)
                  ).toFixed(2)}
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowBillModal(false)}
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
                  {modalLoading ? 'Generating...' : 'Save & Issue Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upload Prescription Modal */}
      {showPrescriptionModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-slate-900 mb-1">Upload Digital Prescription</h3>
            <p className="text-xs text-slate-500 mb-4">Attach image or PDF document and link to patient record</p>

            <form onSubmit={handleUploadPrescription} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Patient *</label>
                <select
                  required
                  className="input-field"
                  value={prescPatientId}
                  onChange={e => setPrescPatientId(e.target.value)}
                >
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>{p.name} (#{p.id})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Attending Doctor</label>
                <select
                  className="input-field"
                  value={prescDoctorId}
                  onChange={e => setPrescDoctorId(e.target.value)}
                >
                  <option value="">Hospital Clinic General</option>
                  {doctors.map(d => (
                    <option key={d.id} value={d.id}>Dr. {d.name} ({d.specialization})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Document Title / Medicine Summary *</label>
                <input
                  type="text"
                  required
                  className="input-field"
                  value={prescMedicine}
                  onChange={e => setPrescMedicine(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Upload File (PDF / JPG / PNG) *</label>
                <input
                  type="file"
                  required
                  accept=".pdf,.png,.jpg,.jpeg"
                  className="input-field"
                  onChange={e => setPrescFile(e.target.files[0])}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Doctor Notes / Instructions</label>
                <textarea
                  className="input-field"
                  rows="2"
                  placeholder="Special clinical dosage, duration, or diagnostic notes..."
                  value={prescNotes}
                  onChange={e => setPrescNotes(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPrescriptionModal(false)}
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
                  {modalLoading ? 'Uploading...' : 'Upload & Link Document'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
