import React, { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { CircularProgress, Box, Typography } from '@mui/material';

export default function ProtectedRoute({ children, requiredRole = null, requiredRoles = null }) {
  const { user, loading, hasRole } = useContext(AuthContext);
  const location = useLocation();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // support single role (requiredRole) or multiple roles (requiredRoles)
  if (requiredRoles && Array.isArray(requiredRoles)) {
    const allowed = requiredRoles.some((r) => hasRole(r));
    if (!allowed) return <Navigate to="/forbidden" replace />;
  } else if (requiredRole) {
    if (!hasRole(requiredRole)) return <Navigate to="/forbidden" replace />;
  }

  return children;
}
