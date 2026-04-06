import React, { useState, useEffect } from 'react';
import './App.css';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Toaster } from 'sonner';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Sales from './components/Sales';
import Services from './components/Services';
import VehicleStock from './components/VehicleStock';
import SpareParts from './components/SpareParts';
import BackupManagement from './components/BackupManagement';
import DataImport from './components/DataImport';
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';
import { AuthContext } from './contexts/AuthContext';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Axios interceptor — attach token to every request
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Axios response interceptor — handle 401 globally
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Inner component so useNavigate works inside BrowserRouter
function AppRoutes() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.get(`${API}/auth/me`)
        .then(response => setUser(response.data))
        .catch(() => localStorage.removeItem('token'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  // FIX: use navigate() instead of window.location.href to avoid full page reload
  const login = (userData, token) => {
    setUser(userData);
    localStorage.setItem('token', token);
    navigate('/dashboard');
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('token');
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
        <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Navigate to="/login" />} />
        <Route path="/dashboard" element={user ? <Layout><Dashboard /></Layout> : <Navigate to="/login" />} />
        <Route path="/sales/*" element={user ? <Layout><Sales /></Layout> : <Navigate to="/login" />} />
        <Route path="/services/*" element={user ? <Layout><Services /></Layout> : <Navigate to="/login" />} />
        <Route path="/vehicles/*" element={user ? <Layout><VehicleStock /></Layout> : <Navigate to="/login" />} />
        <Route path="/spare-parts/*" element={user ? <Layout><SpareParts /></Layout> : <Navigate to="/login" />} />
        <Route path="/backup" element={user ? <Layout><BackupManagement /></Layout> : <Navigate to="/login" />} />
        <Route path="/data-import" element={user ? <Layout><DataImport /></Layout> : <Navigate to="/login" />} />
      </Routes>
    </AuthContext.Provider>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <div className="App">
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
        <Toaster position="top-right" />
      </div>
    </ErrorBoundary>
  );
}

export { AuthContext };
export default App;

