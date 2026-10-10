import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Layout from './components/Layout';
import DashboardRouter from './pages/DashboardRouter';
import ComingSoon from './pages/ComingSoon';

import PatientRecords from './pages/PatientRecords';
import MyAppointments from './pages/MyAppointments';
import MyBills from './pages/MyBills';
import AdminStaffCreate from './pages/AdminStaffCreate';
import AdminUsers from './pages/AdminUsers';
import AdminPatientsDoctors from './pages/AdminPatientsDoctors';
import AdminSchedulesAppointments from './pages/AdminSchedulesAppointments';
import AdminBillingPrescriptions from './pages/AdminBillingPrescriptions';
import AdminLabPharmacy from './pages/AdminLabPharmacy';
import AllPrescriptions from './pages/AllPrescriptions';
import DoctorSchedule from './pages/DoctorSchedule';

// ─── Guards ──────────────────────────────────────────────────────────────────

/** Requires any authenticated user */
const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
};

/** Requires ADMIN role */
const AdminRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'ADMIN') return <Navigate to="/" replace />;
  return children;
};

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* ── Public auth routes ── */}
        <Route path="/login"    element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* ── Authenticated app routes ── */}
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<DashboardRouter />} />

          {/* Patient routes */}
          <Route path="appointments" element={<MyAppointments />} />
          <Route path="billing"      element={<MyBills />} />
          <Route path="records"      element={<PatientRecords />} />

          {/* Doctor schedule management */}
          <Route path="schedule" element={<ProtectedRoute><DoctorSchedule /></ProtectedRoute>} />

          {/* Pharmacy routes */}
          <Route path="inventory"    element={<ComingSoon title="Pharmacy Inventory" />} />
          <Route path="prescriptions" element={<AllPrescriptions />} />

          {/* Lab routes */}
          <Route path="lab-requests" element={<ComingSoon title="Lab Requests" />} />

          {/* Admin routes — enforced on frontend and backend */}
          <Route path="admin/directory" element={<AdminRoute><AdminPatientsDoctors /></AdminRoute>} />
          <Route path="admin/appointments" element={<AdminRoute><AdminSchedulesAppointments /></AdminRoute>} />
          <Route path="admin/billing" element={<AdminRoute><AdminBillingPrescriptions /></AdminRoute>} />
          <Route path="admin/pharmacy-lab" element={<AdminRoute><AdminLabPharmacy /></AdminRoute>} />
          <Route path="admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />

          {/* Backward compatibility for admin staff creation */}
          <Route path="admin/staff/create" element={<AdminRoute><AdminStaffCreate /></AdminRoute>} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}
