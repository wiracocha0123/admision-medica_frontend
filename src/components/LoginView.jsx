import React, { useContext, useState } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { useNavigate, Navigate } from 'react-router-dom';
import { Box, TextField, Button, Checkbox, FormControlLabel, Backdrop, CircularProgress, Typography, Alert, InputAdornment } from '@mui/material';
import { PersonOutlined, KeyOutlined } from '@mui/icons-material';

function validateEmail(email) {
  return /\S+@\S+\.\S+/.test(email);
}

export default function LoginView({ redirectTo = '/welcome', onLogin }) {
  const { login, isAuthenticated, loading: authLoading } = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const loading = authLoading || submitting;

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!email || !password) return setError('Email y contraseña son obligatorios');
    if (!validateEmail(email)) return setError('Email inválido');

    setSubmitting(true);
    try {
      const result = await login(email, password, remember);
      if (onLogin) onLogin(result?.token || result?.access_token || null);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      if (err.response) {
        if (err.response.status === 401) setError('Credenciales inválidas');
        else if (err.response.status === 422) {
          const data = err.response.data || {};
          const messages = data.errors ? Object.values(data.errors).flat().join(' ') : data.message || 'Error de validación';
          setError(messages);
        } else {
          setError(err.response.data?.message || 'Error del servidor');
        }
      } else {
        setError('Error de conexión');
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (!authLoading && isAuthenticated) {
    return <Navigate to="/admin" replace />;
  }

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ maxWidth: 460, mx: 'auto', px: 2, py: 1 }}>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <TextField
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        fullWidth
        sx={{ 
          mb: 2.5,
          '& .MuiOutlinedInput-root': {
            borderRadius: '8px',
            backgroundColor: '#ffffff'
          }
        }}
        size="medium"
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start" sx={{ pr: 1.5, mr: 1, borderRight: '1px solid #e0e0e0' }}>
                <PersonOutlined sx={{ color: '#0288d1' }} />
              </InputAdornment>
            ),
          }
        }}
      />

      <TextField
        label="Contraseña"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        fullWidth
        sx={{ 
          mb: 1.5,
          '& .MuiOutlinedInput-root': {
            borderRadius: '8px',
            backgroundColor: '#ffffff'
          }
        }}
        size="medium"
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start" sx={{ pr: 1.5, mr: 1, borderRight: '1px solid #e0e0e0' }}>
                <KeyOutlined sx={{ color: '#0288d1' }} />
              </InputAdornment>
            ),
          }
        }}
      />

      <FormControlLabel
        control={<Checkbox checked={remember} onChange={(e) => setRemember(e.target.checked)} sx={{ color: '#0288d1', '&.Mui-checked': { color: '#01579b' } }} />}
        label={<Typography sx={{ fontSize: '0.9rem', color: '#64748b' }}>Recordarme</Typography>}
        sx={{ mb: 2 }}
      />

      <Button 
        type="submit" 
        variant="contained" 
        fullWidth 
        disabled={loading} 
        sx={{ 
          py: 1.4, 
          fontWeight: 600, 
          fontSize: '1rem',
          borderRadius: 2,
          background: '#0288d1', /* Azul sólido institucional */
          boxShadow: '0 4px 14px rgba(2, 136, 209, 0.4)',
          mt: 2,
          textTransform: 'none',
          '&:hover': {
            background: '#01579b',
            boxShadow: '0 6px 20px rgba(1, 87, 155, 0.5)',
          }
        }}
      >
        Entrar al Sistema
      </Button>

      <Backdrop
        open={loading}
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          bgcolor: 'rgba(0,0,0,0.25)',
        }}
      >
        <Box sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          bgcolor: 'background.paper',
          color: 'text.primary',
          p: 3,
          borderRadius: 2,
          boxShadow: 6,
          minWidth: 220,
        }}>
          <CircularProgress color="primary" />
          <Typography sx={{ mt: 2 }}>Iniciando sesión...</Typography>
        </Box>
      </Backdrop>
    </Box>
  );
}
