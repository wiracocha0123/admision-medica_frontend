import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import LoginView from './views/LoginView';
import Welcome from './views/Welcome';
import AdminLayout from './layouts/AdminLayout';
import ProtectedRoute from './components/ProtectedRoute';
import Dashboard from './pages/Admin/Dashboard';
import Users from './pages/Admin/Users';
import Citas from './pages/Admin/Citas';
import Personal from './pages/Admin/Personal';
import Operadores from './pages/Admin/Operadores';
import Especialidades from './pages/Admin/Especialidades';
import Reportes from './pages/Admin/Reportes';
import Pacientes from './pages/Admin/Pacientes';
import Archivados from './pages/Admin/Archivados';
import Forbidden from './pages/Forbidden';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginView />} />
          <Route path="/welcome" element={<Welcome />} />
          <Route path="/forbidden" element={<Forbidden />} />

          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="users" element={<ProtectedRoute requiredRoles={['supervisor','operator']}><Users /></ProtectedRoute>} />
            <Route path="citas" element={<ProtectedRoute><Citas /></ProtectedRoute>} />
            <Route path="personal" element={<ProtectedRoute><Personal /></ProtectedRoute>} />
            <Route path="reportes" element={<ProtectedRoute><Reportes /></ProtectedRoute>} />
            <Route path="pacientes" element={<ProtectedRoute><Pacientes /></ProtectedRoute>} />
            <Route path="archivados" element={<ProtectedRoute><Archivados /></ProtectedRoute>} />
            <Route path="especialidades" element={<ProtectedRoute><Especialidades /></ProtectedRoute>} />
            <Route path="operadores" element={<ProtectedRoute><Operadores /></ProtectedRoute>} />
          </Route>

          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
