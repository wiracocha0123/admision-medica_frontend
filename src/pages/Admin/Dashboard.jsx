import React, { useState, useMemo } from 'react';
import { 
  Typography, Paper, Grid, Box, Stack, Skeleton, 
  FormControl, InputLabel, Select, MenuItem, List, ListItem, ListItemText, 
  ListItemAvatar, Avatar, Divider, Chip, Tooltip, IconButton,
  Table, TableBody, TableCell, TableHead, TableRow, TableContainer
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import InfoIcon from '@mui/icons-material/Info';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { es } from 'date-fns/locale/es';
import { startOfMonth, endOfMonth } from 'date-fns';
import { getAllPersonalSalud } from '../../services/personalService';
import { getDashboardStats } from '../../services/dashboardService';
import { XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';

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
  const [filterDate, setFilterDate] = useState(new Date());
  
  // Consulta unificada para el Dashboard
  const { data: stats, isLoading: statsLoading } = useQuery({ 
    queryKey: ['dashboard-stats'], 
    queryFn: getDashboardStats,
    refetchInterval: 10000 
  });

  // Solo traemos el personal para la tabla de turnos si es necesario
  const { data: staffData, isLoading: staffLoading } = useQuery({ 
    queryKey: ['stat-staff-all'], 
    queryFn: async () => {
      const resp = await getAllPersonalSalud();
      if (resp && resp.data && Array.isArray(resp.data.data)) return resp.data.data;
      if (Array.isArray(resp?.data)) return resp.data;
      return resp || [];
    }, 
    retry: 1,
    refetchInterval: 60000 
  });

  const staffList = useMemo(() => Array.isArray(staffData) ? staffData : [], [staffData]);
  const appointmentsList = useMemo(() => stats?.appointments_all || [], [stats]);
  const recentPatients = useMemo(() => stats?.recent_patients || [], [stats]);

  const staffAlerts = useMemo(() => {
    if (!stats?.staff_by_specialty) return [];
    return stats.staff_by_specialty.map(item => ({
      name: item.especialidad,
      count: item.count,
      status: item.count === 0 ? 'error' : item.count < 2 ? 'warning' : 'success',
      message: item.count === 0 ? 'Sin personal' : item.count < 2 ? 'Bajo' : 'Óptimo'
    }));
  }, [stats]);

  const workingStaffToday = useMemo(() => {
    if (!staffList.length) return [];
    const daysMap = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
    const selectedDayName = daysMap[filterDate.getDay()];
    
    return staffList.filter(s => {
      let schedule = s.horario_semanal;
      if (typeof schedule === 'string') try { schedule = JSON.parse(schedule); } catch (e) { schedule = null; }
      if (Array.isArray(schedule) && schedule.length > 0) schedule = schedule[0];
      return schedule && schedule[selectedDayName] && Object.keys(schedule[selectedDayName]).length > 0;
    }).map(s => {
      let schedule = s.horario_semanal;
      if (typeof schedule === 'string') try { schedule = JSON.parse(schedule); } catch (e) {}
      if (Array.isArray(schedule) && schedule.length > 0) schedule = schedule[0];
      const dayData = schedule[selectedDayName] || {};
      const turnosStr = Object.entries(dayData).map(([turno, horas]) => `${turno}: ${horas}`).join(' | ');
      return { ...s, turnosDisplay: turnosStr || 'Sin turnos' };
    });
  }, [staffList, filterDate]);

  const filteredCitas = useMemo(() => {
    if (selectedStaff === 'all') return appointmentsList;
    return appointmentsList.filter(c => String(c.personal_salud_id) === String(selectedStaff));
  }, [appointmentsList, selectedStaff]);

  const chartData = useMemo(() => {
    const counts = {};
    filteredCitas.forEach(c => {
      const dateRaw = c.fecha || c.date;
      if (!dateRaw) return;
      const date = dateRaw.split('T')[0];
      counts[date] = (counts[date] || 0) + 1;
    });

    return Object.keys(counts).sort().map(date => {
      const parts = date.split('-').map(Number);
      const dateObj = new Date(parts[0], parts[1] - 1, parts[2]);
      return { 
        date, 
        cantidad: counts[date],
        displayDate: dateObj.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
      };
    });
  }, [filteredCitas]);

  const pieData = useMemo(() => {
    if (stats?.specialties_summary && selectedStaff === 'all') {
      return stats.specialties_summary.map(s => ({ name: s.nombre, value: s.count }));
    }
    const counts = {};
    filteredCitas.forEach(c => {
      const specId = c.especialidad_id;
      if (!specId) return;
      counts[specId] = (counts[specId] || 0) + 1;
    });
    return Object.keys(counts).map(id => {
      const spec = staffList.find(s => String(s.especialidad_id) === String(id))?.especialidad;
      return { name: spec?.especialidad || `Esp. ${id}`, value: counts[id] };
    }).sort((a, b) => b.value - a.value);
  }, [filteredCitas, stats, staffList]);

  const hourlyData = useMemo(() => {
    const hours = Array.from({ length: 14 }, (_, i) => ({ hour: i + 7, label: `${i + 7}:00`, cantidad: 0 }));
    filteredCitas.forEach(c => {
      const hour = parseInt((c.hora || "").split(':')[0]);
      const slot = hours.find(h => h.hour === hour);
      if (slot) slot.cantidad += 1;
    });
    return hours;
  }, [filteredCitas]);

  return (
    <Box sx={{ pb: 5 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" fontWeight={700}>Panel de Control</Typography>
      </Box>

      <Box sx={{ mb: 4 }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard title="Total Personal" value={stats?.counts?.personal || 0} loading={statsLoading} color="primary" icon="👨‍⚕️" />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard title="Operadores" value={stats?.counts?.operadores || 0} loading={statsLoading} color="secondary" icon="💻" />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard title="Pacientes" value={stats?.counts?.pacientes || 0} loading={statsLoading} color="success" icon="🏥" />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard title="Citas Hoy" value={stats?.counts?.citas_hoy || 0} loading={statsLoading} color="info" icon="📅" />
          </Grid>
        </Grid>
      </Box>

      <Paper sx={{ mb: 4, p: 3, borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom>Resumen de Gestión</Typography>
        <Typography variant="body2" color="text.secondary">
          {selectedStaff === 'all' 
            ? "Visualizando estadísticas globales de todos los especialistas." 
            : `Visualizando historial de citas del médico seleccionado.`}
        </Typography>
      </Paper>

      <Box sx={{ mb: 4 }}>
        <Paper sx={{ p: 3, borderRadius: 2, borderLeft: '6px solid', borderLeftColor: 'warning.main', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
            <WarningIcon color="warning" />
            <Typography variant="h6" fontWeight={700}>Estado de Disponibilidad de Personal</Typography>
            <Tooltip title="Muestra las especialidades con poco o sin personal asignado (Mínimo requerido: 2)">
              <IconButton size="small"><InfoIcon fontSize="small" /></IconButton>
            </Tooltip>
          </Box>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
            {statsLoading ? (
              <Skeleton variant="rectangular" width="100%" height={40} sx={{ borderRadius: 1 }} />
            ) : (
              staffAlerts.map((alert, i) => (
                <Tooltip key={i} title={`${alert.count} médicos en esta área`}>
                  <Chip 
                    icon={alert.status === 'success' ? <CheckCircleIcon /> : <WarningIcon />} 
                    label={`${alert.name}: ${alert.message}`} 
                    color={alert.status} 
                    variant={alert.status === 'success' ? 'outlined' : 'filled'}
                    sx={{ fontWeight: 600 }}
                  />
                </Tooltip>
              ))
            )}
          </Box>
        </Paper>
      </Box>

      <Box sx={{ mb: 4 }}>
        <Paper sx={{ p: 4, borderRadius: 3, boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' }, mb: 3, gap: 2 }}>
            <Box>
              <Typography variant="h6" fontWeight={700}>Personal en Turno</Typography>
              <Typography variant="caption" color="text.secondary">Visualizando especialistas laborando el día seleccionado</Typography>
            </Box>
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
              <DatePicker
                label="Seleccionar Fecha"
                value={filterDate}
                onChange={(newValue) => setFilterDate(newValue)}
                slotProps={{ textField: { size: 'small', sx: { minWidth: 200 } } }}
              />
            </LocalizationProvider>
          </Box>

          <TableContainer sx={{ maxHeight: 400 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, bgcolor: 'background.default' }}>Especialista</TableCell>
                  <TableCell sx={{ fontWeight: 700, bgcolor: 'background.default' }}>Especialidad</TableCell>
                  <TableCell sx={{ fontWeight: 700, bgcolor: 'background.default' }}>Horarios / Turnos</TableCell>
                  <TableCell sx={{ fontWeight: 700, bgcolor: 'background.default' }} align="center">Estado</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {staffLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton variant="text" /></TableCell>
                      <TableCell><Skeleton variant="text" /></TableCell>
                      <TableCell><Skeleton variant="text" /></TableCell>
                      <TableCell><Skeleton variant="text" /></TableCell>
                    </TableRow>
                  ))
                ) : workingStaffToday.length > 0 ? (
                  workingStaffToday.map((staff) => (
                    <TableRow key={staff.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar sx={{ width: 32, height: 32, fontSize: '0.8rem', bgcolor: 'primary.main' }}>
                            {(staff.nombres || 'P')[0]}
                          </Avatar>
                          <Typography variant="body2" fontWeight={500}>
                            {staff.nombres} {staff.apellidos}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={staff.especialidad?.especialidad || staff.especialidad_nombre || 'General'} 
                          size="small" 
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <AccessTimeIcon sx={{ fontSize: 14 }} />
                          {staff.turnosDisplay}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip label="En Turno" color="success" size="small" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700 }} />
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                      <Typography variant="body2" color="text.secondary">No hay personal programado para esta fecha.</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>

      <Grid container spacing={3}>
        <Grid size={12}>
          <Paper sx={{ p: 4, borderRadius: 3, minHeight: 400 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
              <Box>
                <Typography variant="h6" fontWeight={700}>Volumen de Citas</Typography>
                <Typography variant="caption" color="text.secondary">Datos actualizados en tiempo real</Typography>
              </Box>
              <Select size="small" value={selectedStaff} onChange={(e) => setSelectedStaff(e.target.value)} sx={{ minWidth: 200 }}>
                <MenuItem value="all">Todos los Médicos</MenuItem>
                {staffList.map(s => <MenuItem key={s.id} value={s.id}>{s.nombres} {s.apellidos}</MenuItem>)}
              </Select>
            </Box>
            <Box sx={{ height: 350 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                  <XAxis dataKey="displayDate" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis allowDecimals={false} fontSize={12} tickLine={false} axisLine={false} />
                  <ChartTooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                  <Bar dataKey="cantidad" fill="#3f51b5" radius={[4, 4, 0, 0]} barSize={45} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        <Grid size={12}>
          <Paper sx={{ p: 4, borderRadius: 3, minHeight: 400 }}>
            <Typography variant="h6" fontWeight={700}>Demanda por Especialidad</Typography>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 3 }}>Distribución de citas según especialidad médica</Typography>
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, height: 300 }}>
              <Box sx={{ flex: 1, height: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                      {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <ChartTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', pl: { sm: 4 }, overflowY: 'auto' }}>
                <Stack spacing={1}>
                  {pieData.map((entry, index) => (
                    <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: COLORS[index % COLORS.length] }} />
                      <Typography variant="caption" fontWeight={500}>{entry.name}: <strong>{entry.value}</strong></Typography>
                    </Box>
                  ))}
                </Stack>
              </Box>
            </Box>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 8 }}>
          <Paper sx={{ p: 4, borderRadius: 3, height: '100%', minHeight: 400 }}>
            <Typography variant="h6" fontWeight={700}>Distribución Horaria de Afluencia</Typography>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 3 }}>Citas agendadas por hora</Typography>
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={hourlyData}>
                  <defs>
                    <linearGradient id="colorQty" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                  <XAxis dataKey="label" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis allowDecimals={false} fontSize={12} tickLine={false} axisLine={false} />
                  <ChartTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                  <Area type="monotone" dataKey="cantidad" stroke="#8884d8" fillOpacity={1} fill="url(#colorQty)" strokeWidth={3} name="Citas" />
                </AreaChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 4, borderRadius: 3, height: '100%', minHeight: 400 }}>
            <Typography variant="h6" fontWeight={700}>Últimos Pacientes</Typography>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>Recientemente registrados</Typography>
            <List sx={{ p: 0 }}>
              {recentPatients.map((p, i) => (
                <React.Fragment key={p.id}>
                  <ListItem sx={{ px: 0, py: 1.5 }}>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: COLORS[i % COLORS.length] }}>{(p.nombre || 'P')[0]}</Avatar>
                    </ListItemAvatar>
                    <ListItemText 
                      primary={<Typography variant="body2" fontWeight={600}>{p.nombre} {p.apellido}</Typography>} 
                      secondary={<Typography variant="caption" color="text.secondary">DNI: {p.dni || p.documento}</Typography>} 
                    />
                  </ListItem>
                  {i < recentPatients.length - 1 && <Divider component="li" />}
                </React.Fragment>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}