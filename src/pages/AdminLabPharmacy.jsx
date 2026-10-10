import React, { useEffect, useState } from 'react';
import client from '../api/client';
import { StatusBadge, EmptyState, TableSkeleton, StatCard } from '../components/shared';
import { 
  TestTube, Pill, AlertTriangle, CheckCircle2, 
  Search, Plus, RefreshCw, AlertCircle, PackageCheck 
} from 'lucide-react';

export default function AdminLabPharmacy() {
  const [tab, setTab] = useState('pharmacy'); // 'pharmacy' or 'lab'
  const [medicines, setMedicines] = useState([]);
  const [inventorySummary, setInventorySummary] = useState(null);
  const [labRequests, setLabRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [search, setSearch] = useState('');

  // Stock Adjustment Modal
  const [stockModal, setStockModal] = useState(false);
  const [selectedMed, setSelectedMed] = useState(null);
  const [stockDelta, setStockDelta] = useState(10);

  // New Medicine Modal
  const [medModal, setMedModal] = useState(false);
  const [medForm, setMedForm] = useState({
    name: '',
    category: 'Analgesics',
    unitPrice: 25.0,
    quantity: 100,
    reorderLevel: 20,
    expiryDate: '',
  });

  // Lab Enter Result Modal
  const [resultModal, setResultModal] = useState(false);
  const [selectedLab, setSelectedLab] = useState(null);
  const [labResultText, setLabResultText] = useState('');
  const [labNotesText, setLabNotesText] = useState('');

  const [actionLoading, setActionLoading] = useState(false);

  const loadData = () => {
    setLoading(true);
    Promise.all([
      client.get('/pharmacy/medicines').catch(() => ({ data: [] })),
      client.get('/pharmacy/medicines/summary').catch(() => ({ data: null })),
      client.get('/lab').catch(() => ({ data: [] })),
    ])
      .then(([medsRes, summaryRes, labRes]) => {
        setMedicines(medsRes.data || []);
        setInventorySummary(summaryRes.data);
        setLabRequests(labRes.data || []);
      })
      .catch(() => setError('Failed to load pharmacy inventory and laboratory requests.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStockAdjust = async (e) => {
    e.preventDefault();
    if (!selectedMed) return;
    setActionLoading(true);
    setError(null);
    try {
      await client.put(`/pharmacy/medicines/${selectedMed.id}/stock?change=${stockDelta}`);
      setSuccessMsg(`Stock for '${selectedMed.name}' updated by ${stockDelta > 0 ? '+' : ''}${stockDelta}.`);
      setStockModal(false);
      loadData();
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to adjust medicine stock.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddMedicine = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setError(null);
    try {
      await client.post('/pharmacy/medicines', medForm);
      setSuccessMsg(`Medicine '${medForm.name}' added to pharmacy inventory.`);
      setMedModal(false);
      loadData();
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to add medicine.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleLabStatus = async (id, status) => {
    setActionLoading(true);
    setError(null);
    try {
      await client.put(`/lab/${id}/status?status=${status}`);
      setSuccessMsg(`Lab request #${id} updated to ${status}.`);
      loadData();
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to update lab request status.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEnterResult = async (e) => {
    e.preventDefault();
    if (!selectedLab) return;
    setActionLoading(true);
    setError(null);
    try {
      await client.put(`/lab/${selectedLab.id}/result?result=${encodeURIComponent(labResultText)}&notes=${encodeURIComponent(labNotesText)}`);
      setSuccessMsg(`Result for Lab Request #${selectedLab.id} saved.`);
      setResultModal(false);
      loadData();
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to save test result.');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredMeds = medicines.filter(m =>
    (m.name && m.name.toLowerCase().includes(search.toLowerCase())) ||
    (m.category && m.category.toLowerCase().includes(search.toLowerCase()))
  );

  const filteredLab = labRequests.filter(l =>
    (l.testName && l.testName.toLowerCase().includes(search.toLowerCase())) ||
    (l.patientName && l.patientName.toLowerCase().includes(search.toLowerCase())) ||
    String(l.id).includes(search)
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Pharmacy Inventory & Diagnostic Laboratory</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Admin oversight for medicine supplies, stock reorders, and diagnostic test reports
          </p>
        </div>
        <div className="flex items-center gap-2">
          {tab === 'pharmacy' && (
            <button onClick={() => setMedModal(true)} className="btn-primary flex items-center gap-1.5">
              <Plus className="w-4 h-4" /> Add Medicine
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

      {/* Overview Cards */}
      {tab === 'pharmacy' && inventorySummary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card p-4">
            <span className="text-xs text-slate-500 font-semibold block">Total Medicines</span>
            <span className="text-2xl font-bold text-slate-800 mt-1 block">{inventorySummary.totalMedicines || medicines.length}</span>
          </div>
          <div className="card p-4">
            <span className="text-xs text-slate-500 font-semibold block">Total Units In Stock</span>
            <span className="text-2xl font-bold text-blue-600 mt-1 block">{inventorySummary.totalStockQuantity ?? '—'}</span>
          </div>
          <div className="card p-4 border-l-4 border-amber-500">
            <span className="text-xs text-amber-700 font-semibold block">Low Stock Alerts</span>
            <span className="text-2xl font-bold text-amber-700 mt-1 block">{inventorySummary.lowStockCount ?? 0}</span>
          </div>
          <div className="card p-4 border-l-4 border-red-500">
            <span className="text-xs text-red-700 font-semibold block">Expiring Within 30 Days</span>
            <span className="text-2xl font-bold text-red-700 mt-1 block">{inventorySummary.expiringSoonCount ?? 0}</span>
          </div>
        </div>
      )}

      {/* Tabs & Search */}
      <div className="card p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setTab('pharmacy'); setSearch(''); }}
            className={`px-4 py-2 rounded-lg font-bold text-sm transition-all flex items-center gap-2 ${
              tab === 'pharmacy' ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Pill className="w-4 h-4" /> Pharmacy Inventory ({medicines.length})
          </button>
          <button
            onClick={() => { setTab('lab'); setSearch(''); }}
            className={`px-4 py-2 rounded-lg font-bold text-sm transition-all flex items-center gap-2 ${
              tab === 'lab' ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <TestTube className="w-4 h-4" /> Diagnostic Lab Requests ({labRequests.length})
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

      {/* Pharmacy Table */}
      {tab === 'pharmacy' && (
        <div className="bg-white rounded-xl shadow overflow-hidden border border-slate-200">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-800 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Medicine Name</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Unit Price</th>
                  <th className="px-6 py-4">Current Stock</th>
                  <th className="px-6 py-4">Expiry Date</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Stock Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading && <TableSkeleton rows={4} cols={7} />}
                {!loading && filteredMeds.map(m => {
                  const isLow = m.quantity <= (m.reorderLevel || 10);
                  return (
                    <tr key={m.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-4 font-semibold text-slate-900">{m.name}</td>
                      <td className="px-6 py-4">
                        <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded font-medium">
                          {m.category || 'General'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-700 font-medium">₹{(m.unitPrice || 0).toFixed(2)}</td>
                      <td className="px-6 py-4">
                        <span className={`font-bold ${isLow ? 'text-red-600' : 'text-slate-800'}`}>
                          {m.quantity} units
                        </span>
                        {isLow && (
                          <span className="ml-2 text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold">
                            Low
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-slate-500 text-xs">{m.expiryDate || '—'}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          isLow ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {isLow ? 'Reorder Needed' : 'In Stock'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => { setSelectedMed(m); setStockDelta(20); setStockModal(true); }}
                          className="px-2.5 py-1 text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-lg inline-flex items-center gap-1"
                        >
                          <PackageCheck className="w-3.5 h-3.5" /> Adjust Stock
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {!loading && filteredMeds.length === 0 && (
              <div className="p-8 text-center text-slate-500">No medicines found in inventory.</div>
            )}
          </div>
        </div>
      )}

      {/* Lab Table */}
      {tab === 'lab' && (
        <div className="bg-white rounded-xl shadow overflow-hidden border border-slate-200">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-800 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Test #</th>
                  <th className="px-6 py-4">Patient</th>
                  <th className="px-6 py-4">Diagnostic Test</th>
                  <th className="px-6 py-4">Requested On</th>
                  <th className="px-6 py-4">Result / Report</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading && <TableSkeleton rows={4} cols={7} />}
                {!loading && filteredLab.map(l => (
                  <tr key={l.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs font-bold text-slate-700">#{l.id}</td>
                    <td className="px-6 py-4 font-semibold text-slate-900">{l.patientName || `Patient #${l.patientId}`}</td>
                    <td className="px-6 py-4 font-medium text-slate-800">{l.testName}</td>
                    <td className="px-6 py-4 text-slate-500 text-xs">{l.requestDate}</td>
                    <td className="px-6 py-4 text-slate-700 text-xs">
                      {l.result ? (
                        <span className="font-semibold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                          {l.result}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Pending analysis</span>
                      )}
                      {l.notes && <span className="block text-[11px] text-slate-500 mt-0.5">{l.notes}</span>}
                    </td>
                    <td className="px-6 py-4"><StatusBadge status={l.status} /></td>
                    <td className="px-6 py-4 text-right space-x-1.5 whitespace-nowrap">
                      {l.status === 'PENDING' && (
                        <button
                          onClick={() => handleLabStatus(l.id, 'SAMPLE_COLLECTED')}
                          className="px-2 py-1 text-xs font-semibold bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 rounded-lg"
                        >
                          Collect Sample
                        </button>
                      )}
                      <button
                        onClick={() => { setSelectedLab(l); setLabResultText(l.result || ''); setLabNotesText(l.notes || ''); setResultModal(true); }}
                        className="px-2.5 py-1 text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-lg"
                      >
                        Enter Result
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!loading && filteredLab.length === 0 && (
              <div className="p-8 text-center text-slate-500">No laboratory test requests found.</div>
            )}
          </div>
        </div>
      )}

      {/* Adjust Stock Modal */}
      {stockModal && selectedMed && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Adjust Inventory Stock</h3>
            <p className="text-xs text-slate-500 mb-4">{selectedMed.name} (Current: {selectedMed.quantity} units)</p>

            <form onSubmit={handleStockAdjust} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Quantity Change (+ to Restock, - to Write Off)
                </label>
                <input
                  type="number"
                  required
                  className="input-field"
                  value={stockDelta}
                  onChange={e => setStockDelta(Number(e.target.value))}
                />
              </div>

              <div className="bg-slate-50 p-2.5 rounded-xl text-xs text-slate-600">
                New Stock Balance: <strong>{selectedMed.quantity + Number(stockDelta)} units</strong>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setStockModal(false)} className="btn-secondary" disabled={actionLoading}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary bg-blue-600 hover:bg-blue-700 text-white" disabled={actionLoading}>
                  {actionLoading ? 'Updating...' : 'Confirm Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Medicine Modal */}
      {medModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-slate-900 mb-1">Add Pharmacy Medicine</h3>
            <p className="text-xs text-slate-500 mb-4">Register new pharmaceutical formulation and pricing</p>

            <form onSubmit={handleAddMedicine} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Medicine Name *</label>
                <input
                  type="text"
                  required
                  className="input-field"
                  placeholder="e.g. Amoxicillin 500mg"
                  value={medForm.name}
                  onChange={e => setMedForm({ ...medForm, name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. Antibiotics"
                    value={medForm.category}
                    onChange={e => setMedForm({ ...medForm, category: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Unit Price (₹) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    className="input-field"
                    value={medForm.unitPrice}
                    onChange={e => setMedForm({ ...medForm, unitPrice: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Initial Stock *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    className="input-field"
                    value={medForm.quantity}
                    onChange={e => setMedForm({ ...medForm, quantity: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Reorder Level *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    className="input-field"
                    value={medForm.reorderLevel}
                    onChange={e => setMedForm({ ...medForm, reorderLevel: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Expiry Date *</label>
                <input
                  type="date"
                  required
                  className="input-field"
                  value={medForm.expiryDate}
                  onChange={e => setMedForm({ ...medForm, expiryDate: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setMedModal(false)} className="btn-secondary" disabled={actionLoading}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary bg-blue-600 hover:bg-blue-700 text-white" disabled={actionLoading}>
                  {actionLoading ? 'Saving...' : 'Add Medicine'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lab Result Modal */}
      {resultModal && selectedLab && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-slate-900 mb-1">Enter Test Result</h3>
            <p className="text-xs text-slate-500 mb-4">{selectedLab.testName} for {selectedLab.patientName}</p>

            <form onSubmit={handleEnterResult} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Diagnostic Findings / Result *</label>
                <input
                  type="text"
                  required
                  className="input-field"
                  placeholder="e.g. Hemoglobin 14.2 g/dL (Normal) or Clear"
                  value={labResultText}
                  onChange={e => setLabResultText(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Pathologist / Lab Notes</label>
                <textarea
                  className="input-field"
                  rows="3"
                  placeholder="Additional diagnostic remarks or verification notes..."
                  value={labNotesText}
                  onChange={e => setLabNotesText(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setResultModal(false)} className="btn-secondary" disabled={actionLoading}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary bg-blue-600 hover:bg-blue-700 text-white" disabled={actionLoading}>
                  {actionLoading ? 'Saving...' : 'Record Test Result'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
