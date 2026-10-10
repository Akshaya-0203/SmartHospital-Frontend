import React from 'react';
import { useAuth } from '../context/AuthContext';
import PatientDashboard from './PatientDashboard';
import DoctorDashboard from './DoctorDashboard';
import AdminDashboard from './AdminDashboard';
import PharmacyDashboard from './PharmacyDashboard';
import LabDashboard from './LabDashboard';

export default function DashboardRouter() {
  const { user } = useAuth();

  switch (user?.role) {
    case 'PATIENT': return <PatientDashboard />;
    case 'DOCTOR': return <DoctorDashboard />;
    case 'ADMIN': return <AdminDashboard />;
    case 'PHARMACY': return <PharmacyDashboard />;
    case 'LAB': return <LabDashboard />;
    default: return <div className="p-4">Unknown Role</div>;
  }
}
