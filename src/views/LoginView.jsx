import React, { useContext } from 'react';
import LoginForm from '../components/LoginView';
import { useLocation, Navigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import '../styles/login.css';

export default function LoginView() {
  const { isAuthenticated, loading } = useContext(AuthContext);
  const location = useLocation();
  const from = location.state?.from?.pathname || '/welcome';

  if (!loading && isAuthenticated) {
    return <Navigate to="/admin" replace />;
  }

  return (
    <div className="login-page">
      <div className="login-box">
        <div className="login-left" aria-hidden="true"></div>
        <div className="login-right">
          <h1>Admisión Médica</h1>
          <p style={{ color: '#64748b', fontSize: '0.95rem', marginBottom: '24px', marginTop: 0 }}>
            Ingrese sus credenciales para continuar
          </p>
          <div className="login-form">
            <LoginForm redirectTo={from} />
          </div>
        </div>
      </div>
    </div>
  );
}