import React, { useState, useContext } from 'react';
import { 
  Paper, Typography, Table, TableBody, TableCell, TableHead, TableRow, Button, Box, 
  CircularProgress, Alert, TableContainer, Skeleton, Chip, Pagination, Stack, Avatar, 
  IconButton, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions, TextField, 
  MenuItem, Grid, FormControl, InputLabel, Select, Divider
} from '@mui/material';
import { 
  Refresh as RefreshIcon, CalendarMonth as CalendarIcon, Edit as EditIcon, 
  Delete as DeleteIcon, Visibility as VisibilityIcon, Add as AddIcon 
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCitas, createCita, updateCita, deleteCita } from '../../services/citasService';
import { getPacientes } from '../../services/pacientesService';
import { getPersonalSalud } from '../../services/personalService';
import { getEspecialidades } from '../../services/especialidadesService';
import { AuthContext } from '../../contexts/AuthContext';

export default function Citas() {
  const { user } = useContext(AuthContext);
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  // Estados para el Modal
  const [openModal, setOpenModal] = useState(false);
  const [viewMode, setViewMode] = useState(false); // true: ver, false: crear/editar
  const [selectedCita, setSelectedCita] = useState(null);

  const [formData, setFormData] = useState({
    paciente_id: '',
    personal_salud_id: '',
    especialidad_id: '',
    fecha: '',
    hora: '',
    estado: 'pendiente',
    motivo: '',
    observaciones: '',
    nro_ticket: ''
  });

  // Consultas de datos para el formulario
  const { data: citasData, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['citas', page],
    queryFn: () => getCitas(page),
    enabled: !!user,
  });

  const { data: pacientesData } = useQuery({
    queryKey: ['pacientes_all'],
    queryFn: () => getPacientes(1).then(res => res?.data || res || []),
    enabled: !!user, // Habilitar siempre que el usuario esté logueado
  });

  const { data: personalData } = useQuery({
    queryKey: ['personal_all'],
    queryFn: () => getPersonalSalud(1).then(res => res?.data || res || []),
    enabled: !!user,
  });

  const { data: especialidadesData } = useQuery({
    queryKey: ['especialidades_all'],
    queryFn: () => getEspecialidades(1).then(res => res?.data || res || []),
    enabled: !!user,
  });

  // Mutaciones
  const mutationCreate = useMutation({
    mutationFn: createCita,
    onSuccess: () => {
      queryClient.invalidateQueries(['citas']);
      handleCloseModal();
    }
  });

  const mutationUpdate = useMutation({
    mutationFn: (data) => updateCita(selectedCita.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['citas']);
      handleCloseModal();
    }
  });

  const mutationDelete = useMutation({
    mutationFn: deleteCita,
    onSuccess: () => {
      queryClient.invalidateQueries(['citas']);
    }
  });

  // Handlers
  const handleOpenCreate = () => {
    setSelectedCita(null);
    setViewMode(false);
    setFormData({
      paciente_id: '',
      personal_salud_id: '',
      especialidad_id: '',
      fecha: '',
      hora: '',
      estado: 'pendiente',
      motivo: '',
      observaciones: '',
      nro_ticket: ''
    });
    setOpenModal(true);
  };

  const handleOpenEdit = (cita) => {
    setSelectedCita(cita);
    setViewMode(false);
    
    // Normalización de fecha (ISO a YYYY-MM-DD)
    const fechaLimpia = cita.fecha && cita.fecha.includes('T') 
      ? cita.fecha.split('T')[0] 
      : cita.fecha || '';

    setFormData({
      paciente_id: cita.paciente_id || '',
      personal_salud_id: cita.personal_salud_id || '',
      especialidad_id: cita.especialidad_id || '',
      fecha: fechaLimpia,
      hora: cita.hora || cita.hora_cita || '',
      estado: cita.estado?.toLowerCase() || 'pendiente',
      motivo: cita.motivo || '',
      observaciones: cita.observaciones || '',
      nro_ticket: cita.nro_ticket || ''
    });
    setOpenModal(true);
  };

  const handleOpenView = (cita) => {
    setSelectedCita(cita);
    setViewMode(true);
    
    const fechaLimpia = cita.fecha && cita.fecha.includes('T') 
      ? cita.fecha.split('T')[0] 
      : cita.fecha || '';

    setFormData({
      paciente_id: cita.paciente_id || '',
      personal_salud_id: cita.personal_salud_id || '',
      especialidad_id: cita.especialidad_id || '',
      fecha: fechaLimpia,
      hora: cita.hora || cita.hora_cita || '',
      estado: cita.estado?.toLowerCase() || 'pendiente',
      motivo: cita.motivo || '',
      observaciones: cita.observaciones || '',
      nro_ticket: cita.nro_ticket || ''
    });
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setSelectedCita(null);
  };

  const handleDelete = (id) => {
    if (window.confirm('¿Está seguro de eliminar esta cita?')) {
      mutationDelete.mutate(id);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      operador_id: user.id,
      estado: formData.estado.toLowerCase()
    };
    
    if (selectedCita) {
      mutationUpdate.mutate(payload);
    } else {
      mutationCreate.mutate(payload);
    }
  };

  // Normalización multinivel
  const paginationData = citasData?.data || citasData || {};
  const items = Array.isArray(paginationData.data) ? paginationData.data : (Array.isArray(paginationData) ? paginationData : []);
  const totalPages = paginationData.last_page || 1;

  const getEstadoColor = (estado) => {
    switch (estado?.toString().toLowerCase()) {
      case 'pendiente': return 'warning';
      case 'completada': return 'success';
      case 'cancelada': return 'error';
      default: return 'default';
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CalendarIcon /> Gestión de Citas {isFetching && <CircularProgress size={20} />}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={() => refetch()} disabled={isFetching}>Actualizar</Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate} color="primary">Nueva Cita</Button>
        </Box>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error.message || 'Error al cargar citas'}</Alert>}

      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Paciente</TableCell>
              <TableCell>Personal</TableCell>
              <TableCell>Especialidad</TableCell>
              <TableCell>Fecha y Hora</TableCell>
              <TableCell>Operador</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              [...Array(5)].map((_, i) => <TableRow key={i}><TableCell colSpan={7}><Skeleton height={40} /></TableCell></TableRow>)
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                  <Typography variant="body1" color="textSecondary">No hay citas registradas para mostrar.</Typography>
                </TableCell>
              </TableRow>
            ) : (
              items.map((cita) => (
                <TableRow key={cita.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar sx={{ width: 28, height: 28, fontSize: '0.75rem', bgcolor: 'primary.main' }}>
                        {cita.paciente?.nombre?.[0] || 'P'}
                      </Avatar>
                      <Typography variant="body2">{cita.paciente?.nombre} {cita.paciente?.apellido}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{cita.personal?.nombres || cita.personal_salud?.nombres} {cita.personal?.apellidos || cita.personal_salud?.apellidos}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={cita.especialidad?.UPS || 'General'} size="small" variant="outlined" sx={{ fontSize: '0.7rem' }} />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">
                      {cita.fecha ? new Date(cita.fecha).toLocaleDateString() : '-'}
                      <Box component="span" sx={{ display: 'block', fontSize: '0.75rem', color: 'text.secondary', fontWeight: 'normal' }}>
                         {cita.hora || cita.hora_cita || '-'}
                      </Box>
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{cita.operador?.nombre || 'Admin'} </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={cita.estado || 'pendiente'} 
                      color={getEstadoColor(cita.estado)} 
                      size="small" 
                      sx={{ minWidth: 80, fontSize: '0.7rem', textTransform: 'capitalize' }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                      <Tooltip title="Ver detalles">
                        <IconButton size="small" color="info" onClick={() => handleOpenView(cita)}>
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Editar cita">
                        <IconButton size="small" color="primary" onClick={() => handleOpenEdit(cita)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Eliminar cita">
                        <IconButton size="small" color="error" onClick={() => handleDelete(cita.id)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
        <Pagination count={totalPages} page={page} onChange={(_, v) => setPage(v)} color="primary" disabled={isFetching} size="small" />
      </Box>

      {/* MODAL DE CREACIÓN / EDICIÓN / VISTA */}
      <Dialog open={openModal} onClose={handleCloseModal} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle sx={{ 
            bgcolor: viewMode ? 'info.main' : (selectedCita ? 'primary.main' : 'success.main'), 
            color: 'white', 
            py: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}>
            <CalendarIcon />
            {viewMode ? 'Detalles de la Cita' : (selectedCita ? 'Modificar Cita' : 'Programar Nueva Cita')}
          </DialogTitle>
          <DialogContent dividers>
            <Grid container spacing={2.5} sx={{ mt: 0.5 }}>
              
              {/* SECCIÓN 1: CABECERA Y TICKET */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 'bold' }}>Referencia de Cita</Typography>
                  {!viewMode && <Chip label="Nuevo Registro" size="small" color="success" variant="outlined" />}
                </Box>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={8}>
                    <FormControl fullWidth size="small" required>
                      <InputLabel>Paciente</InputLabel>
                      <Select
                        value={formData.paciente_id}
                        label="Paciente"
                        disabled={viewMode}
                        onChange={(e) => setFormData({ ...formData, paciente_id: e.target.value })}
                      >
                        {Array.isArray(pacientesData) && pacientesData.map(p => (
                          <MenuItem key={p.id} value={p.id}>
                            {p.nombre} {p.apellido} — DNI: {p.dni || p.documento}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="N° Ticket"
                      size="small"
                      placeholder="Opcional"
                      value={formData.nro_ticket}
                      disabled={viewMode}
                      onChange={(e) => setFormData({ ...formData, nro_ticket: e.target.value })}
                    />
                  </Grid>
                </Grid>
              </Grid>

              {/* SECCIÓN 2: ASIGNACIÓN MÉDICA */}
              <Grid item xs={12}>
                <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 'bold', display: 'block', mb: 1 }}>Servicio y Especialista</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth size="small" required>
                      <InputLabel>Especialidad</InputLabel>
                      <Select
                        value={formData.especialidad_id}
                        label="Especialidad"
                        disabled={viewMode}
                        onChange={(e) => setFormData({ ...formData, especialidad_id: e.target.value })}
                      >
                        {Array.isArray(especialidadesData) && especialidadesData.map(e => (
                          <MenuItem key={e.id} value={e.id}>{e.nombre_especialidad} ({e.UPS})</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth size="small" required>
                      <InputLabel>Médico / Personal</InputLabel>
                      <Select
                        value={formData.personal_salud_id}
                        label="Médico / Personal"
                        disabled={viewMode}
                        onChange={(e) => setFormData({ ...formData, personal_salud_id: e.target.value })}
                      >
                        {Array.isArray(personalData) && personalData.map(p => (
                          <MenuItem key={p.id} value={p.id}>{p.nombres} {p.apellidos}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </Grid>

              {/* SECCIÓN 3: FECHA, HORA Y ESTADO */}
              <Grid item xs={12}>
                <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 'bold', display: 'block', mb: 1 }}>Programación</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6} sm={4}>
                    <TextField
                      fullWidth
                      label="Fecha"
                      type="date"
                      size="small"
                      required
                      InputLabelProps={{ shrink: true }}
                      value={formData.fecha}
                      disabled={viewMode}
                      onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={6} sm={4}>
                    <TextField
                      fullWidth
                      label="Hora"
                      type="time"
                      size="small"
                      required
                      InputLabelProps={{ shrink: true }}
                      value={formData.hora}
                      disabled={viewMode}
                      onChange={(e) => setFormData({ ...formData, hora: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Estado</InputLabel>
                      <Select
                        value={formData.estado}
                        label="Estado"
                        disabled={viewMode}
                        onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                      >
                        <MenuItem value="pendiente">⚠️ Pendiente</MenuItem>
                        <MenuItem value="completada">✅ Completada</MenuItem>
                        <MenuItem value="cancelada">❌ Cancelada</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </Grid>

              {/* SECCIÓN 4: DETALLES ADICIONALES */}
              <Grid item xs={12}>
                <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 'bold', display: 'block', mb: 1 }}>Notas Médicas</Typography>
                <TextField
                  fullWidth
                  label="Observaciones"
                  multiline
                  rows={3}
                  size="small"
                  value={formData.observaciones}
                  disabled={viewMode}
                  placeholder="Escriba aquí los detalles adicionales o indicaciones..."
                  onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                />
              </Grid>

              {viewMode && selectedCita?.operador && (
                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="caption" color="text.secondary">
                    Registro gestionado por: <strong>{selectedCita.operador.nombre}</strong>
                  </Typography>
                </Grid>
              )}
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2.5, bgcolor: '#f8f9fa' }}>
            <Button onClick={handleCloseModal} variant="outlined" color="inherit">
              {viewMode ? 'Cerrar' : 'Cancelar'}
            </Button>
            {!viewMode && (
              <Button 
                type="submit" 
                variant="contained" 
                color={selectedCita ? "primary" : "success"}
                disabled={mutationCreate.isPending || mutationUpdate.isPending}
                startIcon={selectedCita ? <EditIcon /> : <AddIcon />}
              >
                {selectedCita ? 'Actualizar Cita' : 'Confirmar Cita'}
              </Button>
            )}
          </DialogActions>
        </form>
      </Dialog>
    </Paper>
  );
}
