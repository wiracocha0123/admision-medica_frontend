import React, { useState, useContext } from 'react';
import { Paper, Typography, Table, TableBody, TableCell, TableHead, TableRow, Button, Box, Avatar, CircularProgress, TableContainer, Dialog, DialogTitle, DialogContent, DialogActions, TextField, IconButton, Tooltip, Stack, Skeleton, Pagination, InputAdornment } from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Visibility as VisibilityIcon, Refresh as RefreshIcon, Search as SearchIcon, Close as CloseIcon, CalendarMonth as CalendarMonthIcon } from '@mui/icons-material';
import { Chip } from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getOperadores, createOperador, updateOperador, deleteOperador } from '../../services/operadoresService';
import { AuthContext } from '../../contexts/AuthContext';
import HorarioMensualPicker from '../../components/HorarioMensualPicker';
import Swal from 'sweetalert2';

const getSafeDiaNumero = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const buildFullMonthHorario = (items = []) => {
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const byDia = new Map();

  (Array.isArray(items) ? items : []).forEach((item) => {
    const dia = getSafeDiaNumero(item?.dia_numero ?? item?.dia, 0);
    if (!dia) return;

    byDia.set(dia, {
      dia_numero: dia,
      turno_m: item?.turno_m ?? item?.manana ?? '',
      turno_t: item?.turno_t ?? item?.tarde ?? '',
      turno_n: item?.turno_n ?? item?.noche ?? ''
    });
  });

  return Array.from({ length: daysInMonth }, (_, index) => {
    const dia = index + 1;
    const existing = byDia.get(dia) || {};
    return {
      dia_numero: dia,
      turno_m: existing.turno_m ?? '',
      turno_t: existing.turno_t ?? '',
      turno_n: existing.turno_n ?? ''
    };
  });
};

const getOperadorHorarioMensual = (item) => {
  if (!item || typeof item !== 'object') return [];
  return item.horario_mensual ?? item.horario ?? item.horarioMensual ?? item.schedule_mensual ?? item.scheduleMonthly ?? [];
};

const normalizeMonthlyHorario = (value) => {
  let normalized = value;

  if (typeof normalized === 'string') {
    try {
      normalized = JSON.parse(normalized);
    } catch (e) {
      normalized = [];
    }
  }

  if (Array.isArray(normalized)) {
    return buildFullMonthHorario(normalized);
  }

  if (normalized && typeof normalized === 'object') {
    return buildFullMonthHorario(Object.keys(normalized).map((dia) => ({
      dia_numero: getSafeDiaNumero(dia, 1),
      turno_m: normalized[dia]?.turno_m || normalized[dia]?.manana || '',
      turno_t: normalized[dia]?.turno_t || normalized[dia]?.tarde || '',
      turno_n: normalized[dia]?.turno_n || normalized[dia]?.noche || ''
    })));
  }

  return buildFullMonthHorario([]);
};

const hasMonthlyHorario = (value) => {
  if (value === null || value === undefined || value === '') return false;

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed || trimmed === '[]' || trimmed === '{}') return false;

    try {
      const parsed = JSON.parse(trimmed);
      return hasMonthlyHorario(parsed);
    } catch {
      return false;
    }
  }

  if (Array.isArray(value)) {
    return value.some((item) => {
      if (!item || typeof item !== 'object') return false;
      const turnoM = item.turno_m ?? item.manana ?? '';
      const turnoT = item.turno_t ?? item.tarde ?? '';
      const turnoN = item.turno_n ?? item.noche ?? '';
      return [turnoM, turnoT, turnoN].some((turno) => String(turno ?? '').trim() !== '');
    });
  }

  if (typeof value === 'object') {
    return Object.values(value).some((day) => {
      if (!day || typeof day !== 'object') return false;
      const turnoM = day.turno_m ?? day.manana ?? '';
      const turnoT = day.turno_t ?? day.tarde ?? '';
      const turnoN = day.turno_n ?? day.noche ?? '';
      return [turnoM, turnoT, turnoN].some((turno) => String(turno ?? '').trim() !== '');
    });
  }

  return false;
};

export default function Operadores() {
  const { user } = useContext(AuthContext);
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState('create');
  const [current, setCurrent] = useState(null);
  const [form, setForm] = useState({ nombre: '', apellido: '', email: '', usuario: '', contraseña: '', DNI: '', horario_mensual: [] });
  const [saveError, setSaveError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['operadores', page],
    queryFn: () => getOperadores(page),
    enabled: !!user,
  });

  // Con los cambios en el backend, la estructura es directa de Laravel Pagination
  const rawItems = Array.isArray(data?.data) ? data.data : [];
  const totalPages = data?.last_page || 1;

  // Filtrado local para búsqueda inmediata
  const items = rawItems.filter(it => {
    const text = searchTerm.toLowerCase();
    return (
      (it.nombre || '').toLowerCase().includes(text) ||
      (it.apellido || '').toLowerCase().includes(text) ||
      (it.usuario || it.user || '').toLowerCase().includes(text) ||
      (it.DNI || it.dni || '').includes(text)
    );
  });

  const saveMutation = useMutation({
    mutationFn: (payload) => {
      const id = current?.id || current?.pk || current?.operador_id;
      if (dialogMode === 'create') return createOperador(payload);
      return updateOperador(id, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operadores'] });
      setDialogOpen(false);
      
      // Delay breve para que el Backdrop de MUI desaparezca antes de lanzar Swal
      setTimeout(() => {
        Swal.fire({
          icon: 'success',
          title: dialogMode === 'create' ? 'Creado' : 'Actualizado',
          text: `Operador ${dialogMode === 'create' ? 'registrado' : 'actualizado'} correctamente`,
          timer: 1500,
          showConfirmButton: false,
          heightAuto: false,
        });
      }, 100);
    },
    onError: (err) => {
      const validationErrors = err.response?.data?.errors;
      const errorMessage = err.response?.data?.message || 'No se pudo guardar la información';
      
      if (err.response?.status === 422 && validationErrors) {
        setFieldErrors(validationErrors);
        
        const errorMessages = Object.values(validationErrors).flat();
        
        Swal.fire({
          icon: 'error',
          title: 'Errores de validación',
          html: `<ul>${errorMessages.map(m => `<li>${m}</li>`).join('')}</ul>`,
          confirmButtonColor: '#3085d6',
          heightAuto: false,
        });
      } else {
        setSaveError(errorMessage);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: errorMessage,
          confirmButtonColor: '#3085d6',
          heightAuto: false,
        });
      }
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteOperador(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operadores'] });
      Swal.fire({
        icon: 'success',
        title: 'Eliminado',
        text: 'El operador ha sido eliminado',
        timer: 1500,
        showConfirmButton: false,
        heightAuto: false,
        customClass: {
          container: 'swal2-container-high-z'
        }
      });
    }
  });

  const handleDelete = (id) => {
    Swal.fire({
      title: '¿Estás seguro?',
      text: "No podrás revertir esta acción",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      heightAuto: false,
      customClass: {
        container: 'swal2-container-high-z'
      }
    }).then((result) => {
      if (result.isConfirmed) {
        deleteMutation.mutate(id);
      }
    });
  };

  const openCreate = () => {
    setDialogMode('create');
    setForm({ nombre: '', apellido: '', email: '', usuario: '', contraseña: '', DNI: '', horario_mensual: buildFullMonthHorario([]) });
    setCurrent(null);
    setFieldErrors({});
    setSaveError('');
    setDialogOpen(true);
  };

  const openView = (it) => {
    setDialogMode('view');
    setCurrent(it);
    setForm({
      nombre: it.nombre || it.name || it.nombres || '',
      apellido: it.apellido || it.apellidos || '',
      email: it.email || '',
      usuario: it.usuario || it.user || '',
      contraseña: '',
      DNI: it.DNI || it.dni || it.documento || '',
      horario_mensual: normalizeMonthlyHorario(getOperadorHorarioMensual(it) || it.horario_semanal || [])
    });
    setFieldErrors({});
    setSaveError('');
    setDialogOpen(true);
  };

  const openEdit = (it) => {
    setDialogMode('edit');
    setCurrent(it);
    setForm({
      nombre: it.nombre || it.name || it.nombres || '',
      apellido: it.apellido || it.apellidos || '',
      email: it.email || '',
      usuario: it.usuario || it.user || '',
      contraseña: '',
      DNI: it.DNI || it.dni || it.documento || '',
      horario_mensual: normalizeMonthlyHorario(getOperadorHorarioMensual(it) || it.horario_semanal || [])
    });
    setFieldErrors({});
    setSaveError('');
    setDialogOpen(true);
  };

  const handleSave = () => {
    setSaveError('');
    setFieldErrors({});

    const dataToSend = { ...form };

    const cleanHorario = buildFullMonthHorario(dataToSend.horario_mensual || []);

    const payload = {
      ...dataToSend,
      horario_mensual: cleanHorario,
      horario_semanal: {}
    };

    console.log("DEBUG - Payload a enviar (Horario Mensual):", payload);
    console.log("DEBUG - ID del operador:", current?.id || current?.pk || current?.operador_id);

    if (dialogMode === 'edit') {
      if (!dataToSend.contraseña || dataToSend.contraseña.trim() === '') {
        delete payload.contraseña;
      } else {
        payload.password = dataToSend.contraseña;
      }
    } else {
      payload.password = dataToSend.contraseña;
    }
    
    saveMutation.mutate(payload);
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h5">Operadores {isFetching && <CircularProgress size={20} sx={{ ml: 2 }} />}</Typography>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={() => refetch()} disabled={isFetching}>Refrescar</Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>Nuevo</Button>
        </Stack>
      </Box>

      {isError && <Typography color="error">{error?.message || 'Error al cargar datos'}</Typography>}

      {/* Sección de Filtros */}
      <Box sx={{ mb: 3, p: 2, bgcolor: '#f8f9fa', borderRadius: 2, border: '1px solid #e9ecef', display: 'flex', gap: 2, alignItems: 'center' }}>
        <TextField
          size="small"
          placeholder="Buscar por nombre, usuario o DNI..."
          value={searchTerm || ''}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setPage(1);
          }}
          sx={{ width: 400, bgcolor: 'white' }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            }
          }}
        />
        <Button 
          variant="text" 
          onClick={() => {
            setSearchTerm('');
            setPage(1);
          }}
          sx={{ textTransform: 'none' }}
        >
          Limpiar
        </Button>
      </Box>

      <TableContainer sx={{ minHeight: 400 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Nombres y apellios</TableCell>
              
              <TableCell>Usuario</TableCell>
              <TableCell>Horario</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <TableRow key={i}><TableCell colSpan={6}><Skeleton /></TableCell></TableRow>
              ))
            ) : items.length === 0 ? (
              <TableRow><TableCell colSpan={6} align="center">No hay operadores registrados.</TableCell></TableRow>
            ) : (
              items.map((it) => (
                <TableRow key={it.id || it.pk || it.operador_id} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                  <TableCell>{it.id || it.pk || it.operador_id}</TableCell>
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Avatar sx={{ width: 28, height: 28, fontSize: "0.75rem", bgcolor: "primary.main" }}>
                                      {it.nombre?.[0] || "P"}
                          </Avatar>
                          <Typography variant="body2">{it.nombre} {it.apellido}</Typography>
                    </Box>
                  </TableCell>
                  
                  <TableCell>{it.usuario || it.user}</TableCell>
                  <TableCell>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<CalendarMonthIcon />}
                      onClick={() => openView(it)}
                      disabled={!hasMonthlyHorario(getOperadorHorarioMensual(it) || it.horario_semanal)}
                      color={hasMonthlyHorario(getOperadorHorarioMensual(it) || it.horario_semanal) ? 'primary' : 'inherit'}
                      sx={{ textTransform: 'none', borderRadius: 2 }}
                    >
                      {hasMonthlyHorario(getOperadorHorarioMensual(it) || it.horario_semanal) ? 'Ver horario' : 'Sin horario'}
                    </Button>
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Ver"><IconButton size="small" onClick={() => openView(it)}><VisibilityIcon fontSize="small" /></IconButton></Tooltip>
                    <Tooltip title="Editar"><IconButton size="small" onClick={() => openEdit(it)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                    <Tooltip title="Eliminar"><IconButton size="small" color="error" onClick={() => handleDelete(it.id || it.pk || it.operador_id)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
        <Pagination count={totalPages} page={page} onChange={(_, v) => setPage(v)} color="primary" disabled={isFetching} />
      </Box>

      <Dialog 
        open={dialogOpen} 
        onClose={() => setDialogOpen(false)} 
        fullWidth 
        maxWidth="sm"
        disableEnforceFocus
        disableRestoreFocus
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {dialogMode === 'create' ? 'Nuevo Operador' : dialogMode === 'edit' ? 'Editar Operador' : 'Detalles del Operador'}
          <IconButton size="small" onClick={() => setDialogOpen(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {saveError && <Typography color="error" sx={{ mb: 1, mt: 1 }}>{saveError}</Typography>}
          <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField 
              label="Nombre" 
              value={form.nombre} 
              onChange={(e) => setForm(s => ({ ...s, nombre: e.target.value }))} 
              disabled={dialogMode === 'view'} 
              error={!!fieldErrors.nombre} 
              helperText={fieldErrors.nombre?.[0]} 
            />
            <TextField 
              label="Apellido" 
              value={form.apellido} 
              onChange={(e) => setForm(s => ({ ...s, apellido: e.target.value }))} 
              disabled={dialogMode === 'view'} 
              error={!!fieldErrors.apellido} 
              helperText={fieldErrors.apellido?.[0]} 
            />
            <TextField 
              label="DNI" 
              value={form.DNI} 
              onChange={(e) => setForm(s => ({ ...s, DNI: e.target.value }))} 
              disabled={dialogMode === 'view'} 
              error={!!fieldErrors.dni || !!fieldErrors.DNI} 
              helperText={fieldErrors.dni?.[0] || fieldErrors.DNI?.[0]} 
            />
            <TextField 
              label="Email" 
              value={form.email} 
              onChange={(e) => setForm(s => ({ ...s, email: e.target.value }))} 
              disabled={dialogMode === 'view'} 
              error={!!fieldErrors.email} 
              helperText={fieldErrors.email?.[0]} 
            />
            <TextField 
              label="Usuario" 
              value={form.usuario} 
              onChange={(e) => setForm(s => ({ ...s, usuario: e.target.value }))} 
              disabled={dialogMode === 'view' || dialogMode === 'edit'} 
              error={!!fieldErrors.usuario} 
              helperText={fieldErrors.usuario?.[0]} 
            />
            {(dialogMode === 'create' || dialogMode === 'edit') && (
              <TextField 
                label="Contraseña (opcional en edición)" 
                type="password" 
                value={form.contraseña} 
                onChange={(e) => setForm(s => ({ ...s, contraseña: e.target.value }))} 
                error={!!fieldErrors.password || !!fieldErrors.contrasena || !!fieldErrors.contraseña} 
                helperText={fieldErrors.password?.[0] || fieldErrors.contrasena?.[0] || fieldErrors.contraseña?.[0]} 
                autoComplete="new-password"
              />
            )}
            {dialogMode === 'view' ? (
              <Box sx={{ mt: 1 }}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>Programación Mensual</Typography>
                {form.horario_mensual && form.horario_mensual.length > 0 ? (
                  <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 350, overflowY: 'auto' }}>
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell size="small" sx={{ bgcolor: 'grey.100', fontWeight: 'bold' }}>Día</TableCell>
                          <TableCell size="small" sx={{ bgcolor: 'grey.100', fontWeight: 'bold' }}>Mañana</TableCell>
                          <TableCell size="small" sx={{ bgcolor: 'grey.100', fontWeight: 'bold' }}>Tarde</TableCell>
                          <TableCell size="small" sx={{ bgcolor: 'grey.100', fontWeight: 'bold' }}>Noche</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {form.horario_mensual.map((d, index) => (
                          <TableRow key={index} hover>
                            <TableCell size="small" sx={{ fontWeight: 'medium' }}>Día {d.dia_numero}</TableCell>
                            <TableCell size="small">
                              {d.turno_m ? (
                                <Chip label={d.turno_m} size="small" color="primary" sx={{ minWidth: 40, height: 20, fontSize: '0.65rem' }} />
                              ) : '-'}
                            </TableCell>
                            <TableCell size="small">
                              {d.turno_t ? (
                                <Chip label={d.turno_t} size="small" color="secondary" sx={{ minWidth: 40, height: 20, fontSize: '0.65rem' }} />
                              ) : '-'}
                            </TableCell>
                            <TableCell size="small">
                              {d.turno_n ? (
                                <Chip label={d.turno_n} size="small" color="warning" sx={{ minWidth: 40, height: 20, fontSize: '0.65rem' }} />
                              ) : '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Typography variant="body2" color="text.secondary">No hay programación mensual registrada.</Typography>
                )}
              </Box>
            ) : (
              <HorarioMensualPicker value={form.horario_mensual} onChange={(v) => setForm(s => ({ ...s, horario_mensual: v }))} />
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cerrar</Button>
          {dialogMode !== 'view' && (
            <Button variant="contained" onClick={handleSave} disabled={saveMutation.isPending}>{saveMutation.isPending ? 'Guardando...' : 'Guardar'}</Button>
          )}
        </DialogActions>
      </Dialog>
    </Paper>
  );
}