import React, { useState, useMemo } from 'react';
import { Typography, Paper, Grid, Box, CircularProgress, Stack, Skeleton, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { getPersonalSalud } from '../../services/personalService';
import { getOperadores } from '../../services/operadoresService';
import { getPacientes } from '../../services/pacientesService';
import { getEspecialidades } from '../../services/especialidadesService';
import { getCitas } from '../../services/citasService';
import { XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend, LineChart, Line, AreaChart, Area } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

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
  
  const { data: staffData, isLoading: l1 } = useQuery({ 
    queryKey: ['stat-staff'], 
    queryFn: () => getPersonalSalud(1), 
    retry: 1,
    refetchInterval: 30000 
  });
  const { data: operators, isLoading: l2 } = useQuery({ 
    queryKey: ['stat-ops'], 
    queryFn: () => getOperadores(1), 
    retry: 1,
    refetchInterval: 30000
  });
  const { data: patients, isLoading: l3 } = useQuery({ 
    queryKey: ['stat-patients'], 
    queryFn: () => getPacientes(1), 
    retry: 1,
    refetchInterval: 30000
  });
  const { data: allAppointments, isLoading: l4 } = useQuery({ 
    queryKey: ['stat-citas-all'], 
    queryFn: async () => {
      const resp = await getCitas(1);
      return resp?.data?.data || resp?.data || resp || [];
    }, 
    retry: 1,
    refetchInterval: 5000
  });
  const { data: specialtiesData } = useQuery({ 
    queryKey: ['stat-specialties'], 
    queryFn: () => getEspecialidades(1), 
    retry: 1,
    refetchInterval: 5000 // Sincronizado con las citas
  });

  const specialtiesList = useMemo(() => {
    const data = specialtiesData?.data?.data || specialtiesData?.data || specialtiesData || [];
    return Array.isArray(data) ? data : [];
  }, [specialtiesData]);

  const staffList = useMemo(() => {
    const data = staffData?.data?.data || staffData?.data || staffData || [];
    return Array.isArray(data) ? data : [];
  }, [staffData]);

  const appointmentsList = useMemo(() => {
    // Ya lo normalizamos en la queryFn, pero por seguridad:
    return Array.isArray(allAppointments) ? allAppointments : [];
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

  const pieData = useMemo(() => {
    const counts = {};
    filteredCitas.forEach(c => {
      // Intentar obtener el ID de la especialidad de múltiples campos comunes
      const specId = c.especialidad_id || c.especialidad?.id || c.id_especialidad || c.especialidad_atencion_id;
      if (!specId) return;
      counts[specId] = (counts[specId] || 0) + 1;
    });

    const data = Object.keys(counts).map(id => {
      const specialty = specialtiesList.find(s => String(s.id) === String(id));
      const name = specialty 
        ? (specialty.especialidad || specialty.nombre || specialty.ups || specialty.descripcion || `ID: ${id}`)
        : `ID: ${id}`;
        
      return {
        name: name,
        value: counts[id]
      };
    });

    // Ordenar de mayor a menor para una mejor visualización
    return data.sort((a, b) => b.value - a.value);
  }, [filteredCitas, specialtiesList]);

  const hourlyData = useMemo(() => {
    const hours = Array.from({ length: 14 }, (_, i) => {
      const h = i + 7; // De 7 AM a 8 PM
      return {
        hour: h,
        label: `${h}:00`,
        cantidad: 0
      };
    });

    filteredCitas.forEach(c => {
      const timeRaw = c.hora || c.time || c.hora_cita || c.hora_atencion;
      if (!timeRaw) return;

      // Extraer la hora (asumiendo formato HH:mm:ss o similar)
      const hour = parseInt(timeRaw.split(':')[0]);
      const hourSlot = hours.find(h => h.hour === hour);
      if (hourSlot) {
        hourSlot.cantidad += 1;
      }
    });

    return hours;
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
        <Grid container spacing={3}>
          {/* Gráfico de Barras - Volumen de Citas */}
          <Grid size={12}>
            <Paper sx={{ p: 4, borderRadius: 3, boxShadow: '0 10px 30px rgba(0,0,0,0.05)', minHeight: 450 }}>
              <Box sx={{ 
                display: 'flex', 
                flexDirection: { xs: 'column', sm: 'row' }, 
                justifyContent: 'space-between', 
                alignItems: { xs: 'stretch', sm: 'flex-start' }, 
                mb: 3,
                gap: 2
              }}>
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

                <FormControl sx={{ minWidth: { xs: '100%', sm: 240 } }} size="small">
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
          </Grid>

          {/* Gráfico Circular - Especialidades */}
          <Grid size={12}>
            <Paper sx={{ p: 4, borderRadius: 3, boxShadow: '0 10px 30px rgba(0,0,0,0.05)', minHeight: 450 }}>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                Demanda por Especialidad
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
                Distribución de citas según especialidad médica
              </Typography>
              
              <Box sx={{ width: '100%', height: { xs: 'auto', sm: 350 }, display: 'flex', flexDirection: { xs: 'column', sm: 'row' } }}>
                {pieData.length > 0 ? (
                  <>
                    <Box sx={{ width: { xs: '100%', sm: '50%' }, height: { xs: 250, sm: '100%' } }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {pieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <ChartTooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </Box>
                    <Box sx={{ 
                      width: { xs: '100%', sm: '50%' }, 
                      height: '100%', 
                      display: 'flex', 
                      flexDirection: 'column', 
                      justifyContent: 'center',
                      pl: { xs: 0, sm: 2 },
                      mt: { xs: 2, sm: 0 },
                      overflowY: 'auto',
                      maxHeight: { xs: 200, sm: '100%' }
                    }}>
                      <Stack spacing={1}>
                        {pieData.map((entry, index) => (
                          <Box key={`legend-${index}`} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ 
                              width: 12, 
                              height: 12, 
                              borderRadius: '50%', 
                              bgcolor: COLORS[index % COLORS.length],
                              flexShrink: 0 
                            }} />
                            <Typography variant="caption" sx={{ 
                              fontWeight: 500,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis' 
                            }}>
                              {entry.name}: <strong>{entry.value}</strong>
                            </Typography>
                          </Box>
                        ))}
                      </Stack>
                    </Box>
                  </>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 2 }}>
                    <Typography variant="h2" sx={{ opacity: 0.2 }}>🍰</Typography>
                    <Typography color="text.secondary" variant="h6">Sin datos</Typography>
                  </Box>
                )}
              </Box>
            </Paper>
          </Grid>

          {/* Gráfico de Líneas - Distribución Horaria */}
          <Grid size={12}>
            <Paper sx={{ p: 4, borderRadius: 3, boxShadow: '0 10px 30px rgba(0,0,0,0.05)', minHeight: 400 }}>
              <Typography variant="h6" fontWeight={700}>
                Distribución Horaria de Afluencia
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 3 }}>
                Horas con mayor volumen de pacientes (Citas agendadas por hora)
              </Typography>

              <Box sx={{ width: '100%', height: 350 }}>
                {l4 ? (
                  <Skeleton variant="rectangular" width="100%" height={350} sx={{ borderRadius: 2 }} />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={hourlyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorQty" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                      <XAxis 
                        dataKey="label" 
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
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="cantidad" 
                        stroke="#8884d8" 
                        fillOpacity={1} 
                        fill="url(#colorQty)" 
                        strokeWidth={3}
                        name="Citas"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </Box>
            </Paper>
          </Grid>
        </Grid>
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