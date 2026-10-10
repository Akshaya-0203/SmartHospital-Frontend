import React, { useEffect, useState } from 'react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import { AlertCircle, Search, ShieldCheck, UserCheck, UserX, RefreshCw } from 'lucide-react';

export default function AdminUsers() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [updatingId, setUpdatingId] = useState(null);

  const loadUsers = () => {
    setLoading(true);
    client.get('/admin/users')
      .then(res => setUsers(res.data || []))
      .catch(() => setError('Failed to load users. Please check server connection.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleStatusToggle = async (user) => {
    if (user.username === currentUser?.username) {
      setError('Safety Guard: You cannot deactivate or lock your own administrator account.');
      return;
    }

    const newStatus = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const confirmPrompt = `Are you sure you want to change status of ${user.username} to ${newStatus}?`;
    if (!window.confirm(confirmPrompt)) return;

    setUpdatingId(user.id);
    setError(null);
    setSuccessMsg('');

    try {
      await client.put(`/admin/users/${user.id}/status?status=${newStatus}`);
      setSuccessMsg(`User '${user.username}' status successfully changed to ${newStatus}.`);
      loadUsers();
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to update user account status.');
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = 
      (u.name && u.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (u.username && u.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (u.email && u.email.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Registered Users & Account Access</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            View, audit, and manage user credentials across all 5 hospital roles
          </p>
        </div>
        <button
          onClick={loadUsers}
          className="btn-secondary self-start sm:self-auto flex items-center gap-2"
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="card p-4 bg-red-50 border-red-200 flex items-center gap-3 text-red-700 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" /> {error}
        </div>
      )}
      {successMsg && (
        <div className="card p-4 bg-emerald-50 border-emerald-200 flex items-center gap-3 text-emerald-700 text-sm">
          <ShieldCheck className="w-5 h-5 flex-shrink-0 text-emerald-600" /> {successMsg}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="card p-4 flex flex-col md:flex-row items-center gap-4 justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            className="input-field pl-9"
            placeholder="Search by name, username, or email..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
          <span className="text-xs font-semibold text-slate-500">Filter Role:</span>
          {['ALL', 'PATIENT', 'DOCTOR', 'ADMIN', 'PHARMACY', 'LAB'].map(role => (
            <button
              key={role}
              onClick={() => setRoleFilter(role)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                roleFilter === role
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {role}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="card p-8 text-center text-slate-500">Loading user accounts from database...</div>
      ) : (
        <div className="bg-white rounded-xl shadow overflow-hidden border border-slate-200">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-800 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Username</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Registered On</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map(u => {
                  const isCurrent = u.username === currentUser?.username;
                  const isActive = (u.status || 'ACTIVE') === 'ACTIVE';
                  return (
                    <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-4 font-semibold text-slate-900">
                        {u.name || '—'}
                        {isCurrent && (
                          <span className="ml-2 text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-bold">
                            You
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-slate-700 font-mono text-xs">{u.username}</td>
                      <td className="px-6 py-4 text-slate-600">{u.email || '—'}</td>
                      <td className="px-6 py-4">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          u.role === 'ADMIN' ? 'bg-blue-100 text-blue-800' :
                          u.role === 'DOCTOR' ? 'bg-purple-100 text-purple-800' :
                          u.role === 'PHARMACY' ? 'bg-fuchsia-100 text-fuchsia-800' :
                          u.role === 'LAB' ? 'bg-amber-100 text-amber-800' :
                          'bg-teal-100 text-teal-800'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-red-500'}`} />
                          {u.status || 'ACTIVE'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {isCurrent ? (
                          <span className="text-xs text-slate-400 italic">Protected</span>
                        ) : (
                          <button
                            onClick={() => handleStatusToggle(u)}
                            disabled={updatingId === u.id}
                            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                              isActive
                                ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
                                : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200'
                            }`}
                          >
                            {updatingId === u.id ? 'Updating...' : isActive ? 'Deactivate' : 'Activate'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredUsers.length === 0 && !loading && (
              <div className="p-8 text-center text-slate-500">
                No users found matching your search and role criteria.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
