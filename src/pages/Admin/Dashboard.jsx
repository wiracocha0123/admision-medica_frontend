import React from 'react';
import { Typography, Paper, Grid, Box, CircularProgress, Stack, Skeleton } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { getPersonalSalud } from '../../services/personalService';
import { getOperadores } from '../../services/operadoresService';
import { getPacientes } from '../../services/pacientesService';
import { getCitas } from '../../services/citasService';

function StatCard({ title, value, loading, color = 'primary', icon = '👥' }) {
  return (
    <Paper
      elevation={0}
      sx={(theme) => ({
        p: 3,
        display: 'flex',
        alignItems: 'center',
        borderRadius: 2,
        boxShadow: '0 6px 18px rgba(15,23,42,0.08)',
        background: `linear-gradient(135deg, ${theme.palette[color].light}22, ${theme.palette.background.paper})`,
        transition: 'transform 200ms ease',
        '&:hover': { transform: 'translateY(-4px)' },
      })}
    >
      <Box
        sx={(theme) => ({
          width: 56,
          height: 56,
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 24,
          mr: 2,
          background: `${theme.palette[color].main}11`,
          color: theme.palette[color].main,
        })}
      >
        {icon}
      </Box>
      <Box flex={1}>
        <Typography variant="subtitle2" color="text.secondary">{title}</Typography>
        {loading ? <Skeleton width="40%" height={32} /> : <Typography variant="h5" fontWeight={700}>{value}</Typography>}
      </Box>
    </Paper>
  );
}

export default function Dashboard() {
  const { data: staff, isLoading: l1 } = useQuery({ queryKey: ['stat-staff'], queryFn: () => getPersonalSalud(1), retry: 1 });
  const { data: operators, isLoading: l2 } = useQuery({ queryKey: ['stat-ops'], queryFn: () => getOperadores(1), retry: 1 });
  const { data: patients, isLoading: l3 } = useQuery({ queryKey: ['stat-patients'], queryFn: () => getPacientes(1), retry: 1 });
  const { data: appointments, isLoading: l4 } = useQuery({ queryKey: ['stat-citas'], queryFn: () => getCitas(1), retry: 1 });

  const getCount = (res) => {
    const val = res?.data || res;
    if (val?.total !== undefined) return val.total;
    if (Array.isArray(val?.data)) return val.data.length;
    if (Array.isArray(val)) return val.length;
    return 0;
  };

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} sx={{ mb: 4 }}>Panel de Control</Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Total Personal" value={getCount(staff)} loading={l1} color="primary" icon="👨‍⚕️" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Operadores" value={getCount(operators)} loading={l2} color="secondary" icon="💻" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Pacientes" value={getCount(patients)} loading={l3} color="success" icon="🏥" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Citas Hoy" value={getCount(appointments)} loading={l4} color="info" icon="📅" />
        </Grid>
      </Grid>

      <Paper sx={{ mt: 4, p: 3, borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom>Actividad Reciente</Typography>
        <Typography variant="body2" color="text.secondary">Estás visualizando un resumen rápido de la gestión médica actual.</Typography>
      </Paper>
    </Box>
  );
}