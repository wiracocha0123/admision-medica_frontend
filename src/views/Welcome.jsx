import React, { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

export default function Welcome() {
  const { user, isAuthenticated } = useContext(AuthContext);

  if (!isAuthenticated) {
    return (
      <div style={{ padding: 24 }}>
        <h2>No autenticado</h2>
        <p>Por favor inicia sesión.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <h2>Bienvenido{user?.name ? `, ${user.name}` : ''}!</h2>
      <pre style={{ background: '#000000', padding: 12 }}>{JSON.stringify(user, null, 2)}</pre>
    </div>
  );
}
