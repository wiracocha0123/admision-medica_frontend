import React, { useState, useContext } from 'react';
import { 
  Paper, Typography, Table, TableBody, TableCell, TableHead, TableRow, 
  Button, Box, Avatar, Alert, TableContainer, Skeleton, Chip, Pagination, 
  IconButton, Stack, Tooltip, Dialog, DialogTitle, DialogContent, 
  DialogContentText, DialogActions, List, ListItem, ListItemText, Divider,
  TextField, MenuItem, Grid, Autocomplete, InputAdornment
} from '@mui/material';
import { 
  Edit as EditIcon, Delete as DeleteIcon, Visibility as ViewIcon, 
  Add as AddIcon, Refresh as RefreshIcon, Search as SearchIcon,
  FilterList as FilterIcon, CalendarToday as CalendarTodayIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPersonalSalud, deletePersonalSalud, updatePersonalSalud, createPersonalSalud } from '../../services/personalService';
import { getEspecialidades } from '../../services/especialidadesService';
import { AuthContext } from '../../contexts/AuthContext';
import HorarioSemanalDisplay from '../../components/HorarioSemanalDisplay';
import HorarioSemanalPicker from '../../components/HorarioSemanalPicker';
import HorarioMensualPicker from '../../components/HorarioMensualPicker';
import Swal from 'sweetalert2';

export default function Personal() {
  const { user } = useContext(AuthContext);
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  // Estados para filtros
  const [filterText, setFilterText] = useState('');
  const [filterEspecialidad, setFilterEspecialidad] = useState('all');

  // Estados para modales
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // Estados para Edición/Creación
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const [formData, setFormData] = useState({
    nombres: '',
    apellidos: '',
    dni: '',
    telefono: '',
    email: '',
    especialidad_id: '',
    horario_semanal: {},
    horario_mensual: []
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['personal', page],
    queryFn: () => getPersonalSalud(page),
    enabled: !!user,
  });

  const { data: especialidadesData } = useQuery({
    queryKey: ['especialidades_all'],
    queryFn: () => getEspecialidades(1).then(res => {
      const resp = res?.data || res;
      // Normalizamos para obtener solo el array de datos
      return Array.isArray(resp.data) ? resp.data : (Array.isArray(resp) ? resp : []);
    }),
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
    enabled: !!user,
  });
  const especialidades = Array.isArray(especialidadesData) ? especialidadesData : [];

  const deleteMutation = useMutation({
    mutationFn: (id) => deletePersonalSalud(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['personal']);
      Swal.fire({
        icon: 'success',
        title: '¡Eliminado!',
        text: 'El personal ha sido eliminado correctamente.',
        timer: 1500,
        showConfirmButton: false,
        heightAuto: false
      });
    },
    onError: (err) => {
      let msg = err.response?.data?.message || err.message;
      Swal.fire({
        icon: 'error',
        title: 'Error al eliminar',
        text: msg,
        confirmButtonColor: '#3085d6',
        heightAuto: false
      });
    }
  });

  const saveMutation = useMutation({
    mutationFn: (payload) => {
      if (payload.id) {
        return updatePersonalSalud(payload.id, payload);
      }
      return createPersonalSalud(payload);
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['personal']);
      setEditDialogOpen(false);
      
      Swal.fire({
        icon: 'success',
        title: variables.id ? '¡Actualizado!' : '¡Registrado!',
        text: `Personal ${variables.id ? 'actualizado' : 'registrado'} correctamente.`,
        timer: 2000,
        showConfirmButton: false,
        heightAuto: false
      });
    },
    onError: (err) => {
      let msg = err.response?.data?.message || err.message;
      
      if (msg.includes('dni has already been taken')) {
        msg = 'Ya existe personal registrado con este DNI.';
      } else if (msg.includes('email has already been taken')) {
        msg = 'Este correo electrónico ya está en uso.';
      }

      Swal.fire({
        icon: 'error',
        title: 'Error al guardar',
        text: msg,
        confirmButtonColor: '#3085d6',
        heightAuto: false
      });
    }
  });

  const handleOpenView = (item) => {
    setSelectedItem(item);
    setViewDialogOpen(true);
  };

  const handleOpenEdit = (item = null) => {
    if (item) {
      // Normalizar el horario desde el item
      let normalizedHorario = item.horario_semanal;
      if (typeof normalizedHorario === 'string') {
        try {
          normalizedHorario = JSON.parse(normalizedHorario);
        } catch (e) {
          normalizedHorario = {};
        }
      }
      // Si es el formato [ { ... } ], extraer el objeto
      if (Array.isArray(normalizedHorario)) {
        normalizedHorario = normalizedHorario[0] || {};
      }

      let normalizedMensual = item.horario_mensual;
      if (typeof normalizedMensual === 'string') {
        try { normalizedMensual = JSON.parse(normalizedMensual); } catch (e) { normalizedMensual = []; }
      }

      setFormData({
        id: item.id,
        nombres: item.nombres || '',
        apellidos: item.apellidos || '',
        dni: item.dni || '',
        telefono: item.telefono || '',
        email: item.email || '',
        especialidad_id: item.especialidad_id || '',
        horario_semanal: normalizedHorario || {},
        horario_mensual: Array.isArray(normalizedMensual) ? normalizedMensual : []
      });
    } else {
      setFormData({
        nombres: '',
        apellidos: '',
        dni: '',
        telefono: '',
        email: '',
        especialidad_id: '',
        horario_semanal: {},
        horario_mensual: []
      });
    }
    setEditDialogOpen(true);
  };

  const handleSave = (e) => {
    e.preventDefault();

    // Validaciones manuales
    if (!formData.nombres.trim() || !formData.apellidos.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Campos requeridos',
        text: 'Los nombres y apellidos son obligatorios.',
        confirmButtonColor: '#3085d6',
        heightAuto: false
      });
      return;
    }

    if (!formData.dni || String(formData.dni).length !== 8) {
      Swal.fire({
        icon: 'warning',
        title: 'DNI inválido',
        text: 'El DNI debe tener exactamente 8 dígitos.',
        confirmButtonColor: '#3085d6',
        heightAuto: false
      });
      return;
    }

    if (!formData.especialidad_id) {
      Swal.fire({
        icon: 'warning',
        title: 'Campo requerido',
        text: 'Debe seleccionar una especialidad (UPS).',
        confirmButtonColor: '#3085d6',
        heightAuto: false
      });
      return;
    }
    
    // Intentamos enviar el horario como un objeto puro si el backend lo procesa vía JSON
    // Si esto falla con "Array to string conversion", el backend NECESITA el cast en el modelo.
    const horarioFinal = Array.isArray(formData.horario_semanal) 
      ? formData.horario_semanal 
      : [formData.horario_semanal];

    const payload = {
      ...formData,
      horario_semanal: horarioFinal,
      horario_mensual: formData.horario_mensual
    };
    
    saveMutation.mutate(payload);
  };

  const handleOpenDeleteConfirm = (id) => {
    Swal.fire({
      title: '¿Estás seguro?',
      text: "Esta acción eliminará al profesional y sus horarios asociados.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      heightAuto: false
    }).then((result) => {
      if (result.isConfirmed) {
        deleteMutation.mutate(id);
      }
    });
  };

  // Con los cambios en el backend, la estructura es directa de Laravel Pagination
  const items = Array.isArray(data?.data) ? data.data : [];
  const totalPages = data?.last_page || 1;
  
  // Aplicar filtros localmente para una respuesta inmediata
  const filteredItems = items.filter(p => {
    const matchesText = 
      (p.nombres + ' ' + p.apellidos).toLowerCase().includes(filterText.toLowerCase()) ||
      p.dni?.includes(filterText);
    
    const matchesEspecialidad = 
      filterEspecialidad === 'all' || 
      String(p.especialidad_id) === String(filterEspecialidad);
      
    return matchesText && matchesEspecialidad;
  });

  const formatHora = (val) => {
    if (!val) return '-';
    if (typeof val === 'string' && val.includes(':')) return val.substring(0, 5);
    const num = parseFloat(val);
    if (isNaN(num)) return val;
    const hours = Math.floor(num);
    const minutes = Math.round((num - hours) * 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main', display: 'flex', alignItems: 'center', gap: 2 }}>
          Personal de Salud
        </Typography>
        <Stack direction="row" spacing={2}>
          <Button 
            variant="outlined" 
            startIcon={<RefreshIcon />} 
            onClick={() => queryClient.invalidateQueries(['personal'])}
          >
            Actualizar
          </Button>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />} 
            onClick={() => handleOpenEdit()}
            sx={{ borderRadius: 2, px: 3 }}
          >
            Nuevo Personal
          </Button>
        </Stack>
      </Box>

      {/* Sección de Filtros */}
      <Box sx={{ mb: 3, p: 2, bgcolor: '#f8f9fa', borderRadius: 2, border: '1px solid #e9ecef' }}>
        <Grid container spacing={2} sx={{ alignItems: 'center' }}>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Buscar por nombre o DNI..."
              value={filterText}
              onChange={(e) => {
                setFilterText(e.target.value);
                setPage(1);
              }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="action" />
                    </InputAdornment>
                  ),
                }
              }}
              sx={{ bgcolor: 'white' }}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              select
              fullWidth
              size="small"
              label="Especialidad / UPS"
              value={filterEspecialidad}
              onChange={(e) => {
                setFilterEspecialidad(e.target.value);
                setPage(1);
              }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <FilterIcon fontSize="small" color="action" />
                    </InputAdornment>
                  ),
                }
              }}
              sx={{ bgcolor: 'white', minWidth: 220 }}
            >
              <MenuItem value="all">Todas</MenuItem>
              {especialidades.map((esp) => (
                <MenuItem key={esp.id} value={esp.id}>
                  {esp.especialidad} {esp.UPS ? `(${esp.UPS})` : ''}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, md: 2 }}>
            <Button 
              fullWidth 
              variant="text" 
              onClick={() => { 
                setFilterText(''); 
                setFilterEspecialidad('all'); 
                setPage(1);
              }}
              sx={{ textTransform: 'none' }}
            >
              Limpiar
            </Button>
          </Grid>
        </Grid>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error.message || 'Error al cargar personal'}</Alert>}
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nombres y apellidos</TableCell>
              <TableCell>DNI</TableCell>
              <TableCell>Telèfono</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Especialidad</TableCell>
              <TableCell>Horario semanal</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? [...Array(5)].map((_, i) => <TableRow key={i}><TableCell colSpan={7}><Skeleton /></TableCell></TableRow>) : 
             filteredItems.length === 0 ? <TableRow><TableCell colSpan={7} align="center">No hay personal registrado.</TableCell></TableRow> :
             filteredItems.map((p) => {
               const horario = p.horario_semanal;
               return (
                 <TableRow key={p.id} hover>
                   <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Avatar sx={{ width: 28, height: 28, fontSize: "0.75rem", bgcolor: "primary.main" }}>
                                      {p.nombres?.[0] || "P"}
                          </Avatar>
                          <Typography variant="body2">{p.nombres} {p.apellidos}</Typography>
                      </Box>
                   </TableCell>
                    <TableCell>{p.dni || '-'}</TableCell>
                   <TableCell>{p.telefono || '-'}</TableCell>
                   <TableCell>{p.email || '-'}</TableCell>
                   <TableCell><Chip label={p.especialidad?.UPS || 'Sin asignar'} size="small" /></TableCell>
                   <TableCell>
                      <Stack spacing={1}>
                        <HorarioSemanalDisplay horario={p.horario_semanal} />
                        {p.horario_mensual && Array.isArray(p.horario_mensual) && p.horario_mensual.length > 0 && (
                          <Chip 
                            label="Mes Programado" 
                            size="small" 
                            color="success" 
                            variant="outlined" 
                            icon={<CalendarTodayIcon sx={{ fontSize: '0.8rem !important' }} />}
                            sx={{ height: 20, fontSize: '0.65rem' }}
                          />
                        )}
                      </Stack>
                   </TableCell>
                   <TableCell align="right">
                      <Stack direction="row" spacing={0.5} sx={{ justifyContent: "flex-end" }}>
                        <Tooltip title="Ver Detalles">
                          <IconButton size="small" color="info" onClick={() => handleOpenView(p)}>
                            <ViewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Editar">
                          <IconButton size="small" color="primary" onClick={() => handleOpenEdit(p)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Eliminar">
                          <IconButton size="small" color="error" onClick={() => handleOpenDeleteConfirm(p.id)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                   </TableCell>
                 </TableRow>
               );
             })}
          </TableBody>
        </Table>
      </TableContainer>
      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
        <Pagination count={totalPages} page={page} onChange={(_, v) => setPage(v)} color="primary" />
      </Box>

      {/* Modal Ver Detalles */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: 'info.main', color: 'white' }}>Detalles del Personal</DialogTitle>
        <DialogContent dividers>
          {selectedItem && (
            <List>
              <ListItem>
                <ListItemText primary="Nombres y Apellidos" secondary={`${selectedItem.nombres} ${selectedItem.apellidos}`} />
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemText primary="DNI" secondary={selectedItem.dni || '-'} />
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemText primary="Especialidad / UPS" secondary={`${selectedItem.especialidad?.especialidad} ${selectedItem.especialidad?.UPS ? `- ${selectedItem.especialidad?.UPS}` : ''}`} />
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemText primary="Teléfono" secondary={selectedItem.telefono || '-'} />
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemText primary="Email" secondary={selectedItem.email || '-'} />
              </ListItem>
              <Divider />
              
              <Divider />
              <ListItem>
                <Box sx={{ width: '100%' }}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>Horario Semanal</Typography>
                  <HorarioSemanalDisplay horario={selectedItem.horario_semanal} />
                </Box>
              </ListItem>
              <Divider />
              <ListItem>
                <Box sx={{ width: '100%' }}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>Programación Mensual</Typography>
                  {selectedItem.horario_mensual && Array.isArray(selectedItem.horario_mensual) && selectedItem.horario_mensual.length > 0 ? (
                    <Box sx={{ maxHeight: 200, overflowY: 'auto', p: 1, border: '1px solid #eee', borderRadius: 1 }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell size="small">Día</TableCell>
                            <TableCell size="small">Mañana</TableCell>
                            <TableCell size="small">Tarde</TableCell>
                            <TableCell size="small">Noche</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {selectedItem.horario_mensual.map((d, index) => (
                            <TableRow key={index}>
                              <TableCell size="small">{d.dia}</TableCell>
                              <TableCell size="small">{d.manana || '-'}</TableCell>
                              <TableCell size="small">{d.tarde || '-'}</TableCell>
                              <TableCell size="small">{d.noche || '-'}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </Box>
                  ) : (
                    <Typography variant="caption" color="text.secondary">No hay programación mensual registrada.</Typography>
                  )}
                </Box>
              </ListItem>
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* Modal Crear/Editar Personal */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: formData.id ? 'primary.main' : 'success.main', color: 'white', mb: 2 }}>
          {formData.id ? 'Editar Personal de Salud' : 'Registrar Nuevo Personal'}
        </DialogTitle>
        <form onSubmit={handleSave} noValidate>
          <DialogContent>
            <Stack spacing={2.5}>
              <TextField 
                label="Nombres" fullWidth variant="outlined"
                value={formData.nombres} 
                onChange={(e) => setFormData({...formData, nombres: e.target.value})} 
              />
              <TextField 
                label="Apellidos" fullWidth variant="outlined"
                value={formData.apellidos} 
                onChange={(e) => setFormData({...formData, apellidos: e.target.value})} 
              />
              <TextField 
                label="DNI" fullWidth variant="outlined"
                value={formData.dni} 
                onChange={(e) => setFormData({...formData, dni: e.target.value})} 
              />
              <TextField 
                label="Teléfono" fullWidth variant="outlined"
                value={formData.telefono} 
                onChange={(e) => setFormData({...formData, telefono: e.target.value})} 
              />
              <TextField 
                label="Email" type="email" fullWidth variant="outlined"
                value={formData.email} 
                onChange={(e) => setFormData({...formData, email: e.target.value})} 
              />
              
              <Autocomplete
                options={especialidades}
                getOptionLabel={(option) => {
                  if (typeof option === 'string') return option;
                  return `${option.especialidad} ${option.UPS ? `- UPS: ${option.UPS}` : ''}`;
                }}
                value={especialidades.find(e => e.id === formData.especialidad_id) || null}
                onChange={(_, newValue) => {
                  setFormData({ ...formData, especialidad_id: newValue ? newValue.id : '' });
                }}
                renderInput={(params) => (
                  <TextField 
                    {...params} 
                    label="Especialidad / UPS" 
                    variant="outlined"
                    helperText="Busque y seleccione la especialidad o unidad UPS asignada"
                  />
                )}
                fullWidth
              />

              <Divider sx={{ my: 1 }}>
                <Chip label="PROGRAMACIÓN MENSUAL" size="small" color="primary" />
              </Divider>

              <Box sx={{ p: 1, border: '1px solid #e0e0e0', borderRadius: 1, bgcolor: '#fcfcfc' }}>
                <HorarioMensualPicker 
                  value={formData.horario_mensual} 
                  onChange={(newHorario) => setFormData({...formData, horario_mensual: newHorario})} 
                />
              </Box>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setEditDialogOpen(false)} color="inherit">Cancelar</Button>
            <Button type="submit" variant="contained" color="primary" disabled={saveMutation.isLoading}>
              {saveMutation.isLoading ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Paper>
  );
}