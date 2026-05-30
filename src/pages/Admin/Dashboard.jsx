import React, { useState, useMemo } from 'react';
import { Typography, Paper, Grid, Box, CircularProgress, Stack, Skeleton, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { getPersonalSalud } from '../../services/personalService';
import { getOperadores } from '../../services/operadoresService';
import { getPacientes } from '../../services/pacientesService';
import { getCitas } from '../../services/citasService';
import { XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

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
  const [selectedStaff, setSelectedStaff] = useState('all');
  
  const { data: staffData, isLoading: l1 } = useQuery({ queryKey: ['stat-staff'], queryFn: () => getPersonalSalud(1), retry: 1 });
  const { data: operators, isLoading: l2 } = useQuery({ queryKey: ['stat-ops'], queryFn: () => getOperadores(1), retry: 1 });
  const { data: patients, isLoading: l3 } = useQuery({ queryKey: ['stat-patients'], queryFn: () => getPacientes(1), retry: 1 });
  const { data: allAppointments, isLoading: l4 } = useQuery({ queryKey: ['stat-citas-all'], queryFn: () => getCitas(1), retry: 1 });

  const staffList = useMemo(() => {
    const data = staffData?.data?.data || staffData?.data || staffData || [];
    return Array.isArray(data) ? data : [];
  }, [staffData]);

  const appointmentsList = useMemo(() => {
    const rawData = allAppointments?.data?.data || allAppointments?.data || allAppointments || [];
    return Array.isArray(rawData) ? rawData : (Array.isArray(rawData.data) ? rawData.data : []);
  }, [allAppointments]);

  const filteredCitas = useMemo(() => {
    if (selectedStaff === 'all') return appointmentsList;
    return appointmentsList.filter(c => {
      const staffId = c.personal_salud_id || c.personal?.id || c.id_personal;
      return String(staffId) === String(selectedStaff);
    });
  }, [appointmentsList, selectedStaff]);

  const chartData = useMemo(() => {
    const counts = {};
    filteredCitas.forEach(c => {
      const dateRaw = c.fecha || c.date || c.fecha_cita || c.fecha_atencion;
      if (!dateRaw) return;
      
      const date = dateRaw.split('T')[0];
      counts[date] = (counts[date] || 0) + 1;
    });

    return Object.keys(counts)
      .sort()
      .map(date => {
        const parts = date.split('-').map(Number);
        const dateObj = parts.length === 3 ? new Date(parts[0], parts[1] - 1, parts[2]) : new Date(date);
        
        return { 
          date, 
          cantidad: counts[date],
          displayDate: dateObj.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
        };
      });
  }, [filteredCitas]);

  const getCount = (res) => {
    const val = res?.data || res;
    if (val?.total !== undefined) return val.total;
    if (Array.isArray(val?.data)) return val.data.length;
    if (Array.isArray(val)) return val.length;
    return 0;
  };

  const getCitasHoyCount = () => {
    const hoy = new Date().toLocaleDateString('en-CA');
    return filteredCitas.filter(c => {
      const dateRaw = c.fecha || c.date || c.fecha_cita || c.fecha_atencion;
      return dateRaw?.split('T')[0] === hoy;
    }).length;
  };

  return (
    <Box sx={{ pb: 5 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" fontWeight={700}>Panel de Control</Typography>
      </Box>
      
      <Box sx={{ mb: 4 }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard title="Total Personal" value={getCount(staffData)} loading={l1} color="primary" icon="👨‍⚕️" />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard title="Operadores" value={getCount(operators)} loading={l2} color="secondary" icon="💻" />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard title="Pacientes" value={getCount(patients)} loading={l3} color="success" icon="🏥" />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard title="Citas Hoy" value={getCitasHoyCount()} loading={l4} color="info" icon="📅" />
          </Grid>
        </Grid>
      </Box>

      <Box sx={{ mb: 4 }}>
        <Paper sx={{ p: 4, borderRadius: 3, boxShadow: '0 10px 30px rgba(0,0,0,0.05)', minHeight: 450 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
            <Box>
              <Typography variant="h6" fontWeight={700}>
                Volumen de Citas por Fecha
              </Typography>
              {chartData.length > 0 && (
                <Typography variant="caption" color="text.secondary">
                  Datos actualizados en tiempo real
                </Typography>
              )}
            </Box>

            <FormControl sx={{ minWidth: 240 }} size="small">
              <InputLabel>Filtrar por Médico</InputLabel>
              <Select
                value={selectedStaff}
                label="Filtrar por Médico"
                onChange={(e) => setSelectedStaff(e.target.value)}
                sx={{ borderRadius: 2, bgcolor: 'background.paper' }}
              >
                <MenuItem value="all">Todos los Médicos</MenuItem>
                {staffList.map((p) => (
                  <MenuItem key={p.id} value={p.id}>{p.nombres} {p.apellidos}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          
          <Box sx={{ width: '100%', height: 400, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            {l4 ? (
              <Skeleton variant="rectangular" width="100%" height={400} sx={{ borderRadius: 2 }} />
            ) : chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={chartData} 
                  margin={{ top: 20, right: 30, left: 10, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                  <XAxis 
                    dataKey="displayDate" 
                    fontSize={12}
                    tick={{ fill: '#666' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    fontSize={12}
                    tick={{ fill: '#666' }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <ChartTooltip 
                    cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Bar 
                    dataKey="cantidad" 
                    fill="#3f51b5"
                    radius={[4, 4, 0, 0]}
                    barSize={45}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 2 }}>
                <Typography variant="h2" sx={{ opacity: 0.2 }}>📊</Typography>
                <Typography color="text.secondary" variant="h6">Sin datos para graficar</Typography>
              </Box>
            )}
          </Box>
        </Paper>
      </Box>

      <Paper sx={{ mt: 4, p: 3, borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom>Resumen de Gestión</Typography>
        <Typography variant="body2" color="text.secondary">
          {selectedStaff === 'all' 
            ? "Visualizando estadísticas globales de todos los especialistas." 
            : `Visualizando historial de citas del médico seleccionado.`}
        </Typography>
      </Paper>
    </Box>
  );
}