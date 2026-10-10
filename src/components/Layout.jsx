import React, { useState } from 'react';
import { Navigate, Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LogOut, LayoutDashboard, Users, FileText,
  Pill, TestTube, CreditCard, Activity, Menu, X,
  ChevronRight, Bell, User, UserPlus, Calendar
} from 'lucide-react';

// Role navigation config
const roleNav = {
  ADMIN: [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Patients & Doctors', path: '/admin/directory', icon: Users },
    { name: 'Schedules & Appts', path: '/admin/appointments', icon: Activity },
    { name: 'Billing & Invoices', path: '/admin/billing', icon: CreditCard },
    { name: 'Pharmacy & Lab', path: '/admin/pharmacy-lab', icon: TestTube },
    { name: 'Registered Users', path: '/admin/users', icon: Users },
  ],
  DOCTOR: [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Appointments', path: '/appointments', icon: Users },
    { name: 'My Schedule', path: '/schedule', icon: Calendar },
  ],
  PATIENT: [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'My Appointments', path: '/appointments', icon: Users },
    { name: 'My Bills', path: '/billing', icon: CreditCard },
    { name: 'My Records', path: '/records', icon: FileText },
  ],
  PHARMACY: [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Inventory', path: '/inventory', icon: Pill },
    { name: 'Prescriptions', path: '/prescriptions', icon: FileText },
  ],
  LAB: [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Lab Requests', path: '/lab-requests', icon: TestTube },
  ],
};

// Each role has a distinct theme object used for inline styles
const ROLE_THEMES = {
  PATIENT: {
    primary: '#0D9488',
    light: '#CCFBF1',
    lighter: '#F0FDFA',
    label: 'Patient Portal',
    gradient: 'linear-gradient(135deg, #0D9488 0%, #0F766E 100%)',
  },
  DOCTOR: {
    primary: '#7C3AED',
    light: '#EDE9FE',
    lighter: '#F5F3FF',
    label: 'Doctor Portal',
    gradient: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)',
  },
  ADMIN: {
    primary: '#2563EB',
    light: '#DBEAFE',
    lighter: '#EFF6FF',
    label: 'Admin Portal',
    gradient: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
  },
  PHARMACY: {
    primary: '#C026D3',
    light: '#FAE8FF',
    lighter: '#FDF4FF',
    label: 'Pharmacy Portal',
    gradient: 'linear-gradient(135deg, #C026D3 0%, #A21CAF 100%)',
  },
  LAB: {
    primary: '#EA580C',
    light: '#FFEDD5',
    lighter: '#FFF7ED',
    label: 'Lab Portal',
    gradient: 'linear-gradient(135deg, #EA580C 0%, #C2410C 100%)',
  },
};

export default function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const navItems = roleNav[user.role] || [];
  const theme = ROLE_THEMES[user.role] || ROLE_THEMES.PATIENT;
  const currentPage = navItems.find(i => i.path === location.pathname)?.name || 'Dashboard';

  // Set CSS variable for global theme access
  const rootStyle = { '--color-brand': theme.primary };

  const SidebarContent = () => (
    <>
      {/* Logo / Brand */}
      <div style={{ background: theme.gradient }} className="px-6 py-5 flex items-center gap-3">
        <div className="bg-white/20 rounded-lg p-2">
          <Activity className="w-5 h-5 text-white" />
        </div>
        <div>
          <span className="text-white font-bold text-base leading-none block">Smart Hospital</span>
          <span className="text-white/70 text-xs mt-0.5 block">{theme.label}</span>
        </div>
      </div>

      {/* User info */}
      <div className="px-4 py-4 border-b border-slate-100">
        <div className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: theme.lighter }}>
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
            style={{ backgroundColor: theme.primary }}
          >
            {user.username.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-800 truncate">{user.username}</p>
            <p className="text-xs font-medium" style={{ color: theme.primary }}>{user.role}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className="px-3 mb-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Navigation
        </p>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150"
              style={
                isActive
                  ? {
                      backgroundColor: theme.lighter,
                      color: theme.primary,
                      fontWeight: 600,
                    }
                  : {
                      color: '#64748B',
                    }
              }
              onMouseEnter={e => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = '#F8FAFC';
                  e.currentTarget.style.color = '#0F172A';
                }
              }}
              onMouseLeave={e => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#64748B';
                }
              }}
            >
              {/* Active indicator */}
              <span
                className="absolute left-0 w-1 h-6 rounded-r-full transition-all"
                style={isActive ? { backgroundColor: theme.primary } : { backgroundColor: 'transparent' }}
              />
              <Icon className="w-4.5 h-4.5 flex-shrink-0" style={{ width: 18, height: 18 }} />
              <span className="flex-1">{item.name}</span>
              {isActive && <ChevronRight style={{ width: 14, height: 14, color: theme.primary }} />}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-slate-100">
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut style={{ width: 18, height: 18 }} />
          Sign Out
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex bg-mainBg" style={rootStyle}>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 flex-shrink-0 relative">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-white flex flex-col z-50">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top bar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-6 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-500"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-slate-800">{currentPage}</h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Role badge in header */}
            <span
              className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold text-white"
              style={{ backgroundColor: theme.primary }}
            >
              {user.role}
            </span>
            <div className="w-px h-6 bg-slate-200 mx-1 hidden sm:block" />
            <span className="text-sm font-medium text-slate-700 hidden sm:block">{user.username}</span>
            <button
              onClick={logout}
              className="p-2 rounded-lg hover:bg-red-50 hover:text-red-600 text-slate-400 transition-colors ml-1"
              title="Sign out"
            >
              <LogOut className="w-4.5 h-4.5" style={{ width: 18, height: 18 }} />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
