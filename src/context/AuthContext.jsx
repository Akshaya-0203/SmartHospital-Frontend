import React, { createContext, useContext, useState, useEffect } from 'react';
import client from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const resolveProfile = async (userData, token) => {
    const updated = { ...userData };
    const authHeader = token ? { Authorization: `Bearer ${token}` } : undefined;

    if (userData.role === 'PATIENT' && !userData.patientId) {
      try {
        const profileRes = await client.get('/patients/me', { headers: authHeader });
        if (profileRes.data && profileRes.data.id) {
          updated.patientId = profileRes.data.id;
          updated.patientName = profileRes.data.name;
        }
      } catch (err) {
        console.warn("Could not fetch patient profile", err);
      }
    } else if (userData.role === 'DOCTOR' && !userData.doctorId) {
      try {
        const docRes = await client.get('/doctors/me', { headers: authHeader });
        if (docRes.data && docRes.data.id) {
          updated.doctorId = docRes.data.id;
          updated.doctorName = docRes.data.name;
        }
      } catch (err) {
        console.warn("Could not fetch doctor profile", err);
      }
    }

    return updated;
  };

  useEffect(() => {
    const initAuth = async () => {
      const storedUser = localStorage.getItem('user');
      const token = localStorage.getItem('token');
      if (storedUser && token) {
        let parsed = JSON.parse(storedUser);
        if ((parsed.role === 'PATIENT' && !parsed.patientId) || (parsed.role === 'DOCTOR' && !parsed.doctorId)) {
          parsed = await resolveProfile(parsed, token);
          localStorage.setItem('user', JSON.stringify(parsed));
        }
        setUser(parsed);
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (username, password) => {
    const res = await client.post('/auth/login', { username, password });
    const { token, role, username: resUser, patientId, patientName, doctorId, doctorName } = res.data;

    let userData = { username: resUser, role };
    if (patientId) {
      userData.patientId = patientId;
      userData.patientName = patientName;
    }
    if (doctorId) {
      userData.doctorId = doctorId;
      userData.doctorName = doctorName;
    }

    // Store token FIRST so all subsequent Axios requests carry Authorization
    localStorage.setItem('token', token);

    // Resolve profile via /me as fallback if not directly provided in login response
    if ((role === 'PATIENT' && !userData.patientId) || (role === 'DOCTOR' && !userData.doctorId)) {
      userData = await resolveProfile(userData, token);
    }

    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    // Navigate to /login is handled by ProtectedRoute detecting user === null
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex items-center gap-3 text-slate-600 font-medium">
          <div className="w-5 h-5 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
          Loading Smart Hospital session...
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
