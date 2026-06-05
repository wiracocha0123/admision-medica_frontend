import React, { useState, useContext } from 'react';
import { Paper, Typography, Table, TableBody, TableCell, TableHead, TableRow, Button, Box, Avatar, CircularProgress, TableContainer, Dialog, DialogTitle, DialogContent, DialogActions, TextField, IconButton, Tooltip, Stack, Skeleton, Pagination, InputAdornment } from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Visibility as VisibilityIcon, Refresh as RefreshIcon, Search as SearchIcon, Close as CloseIcon } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getOperadores, createOperador, updateOperador, deleteOperador } from '../../services/operadoresService';
import { AuthContext } from '../../contexts/AuthContext';
import HorarioSemanalPicker from '../../components/HorarioSemanalPicker';
import HorarioSemanalDisplay from '../../components/HorarioSemanalDisplay';
import Swal from 'sweetalert2';

export default function Operadores() {
  const { user } = useContext(AuthContext);
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState('create');
  const [current, setCurrent] = useState(null);
  const emptyWeek = { lunes: {}, martes: {}, miercoles: {}, jueves: {}, viernes: {}, sabado: {}, domingo: {} };
  const [form, setForm] = useState({ nombre: '', apellido: '', email: '', usuario: '', contraseña: '', DNI: '', horario_semanal: emptyWeek });
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
    setForm({ nombre: '', apellido: '', email: '', usuario: '', contraseña: '', DNI: '', horario_semanal: emptyWeek });
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
      horario_semanal: typeof it.horario_semanal === 'string' && it.horario_semanal.trim().startsWith('{') 
        ? JSON.parse(it.horario_semanal) 
        : (it.horario_semanal || emptyWeek)
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
      horario_semanal: typeof it.horario_semanal === 'string' && it.horario_semanal.trim().startsWith('{') 
        ? JSON.parse(it.horario_semanal) 
        : (it.horario_semanal || emptyWeek)
    });
    setFieldErrors({});
    setSaveError('');
    setDialogOpen(true);
  };

  const handleSave = () => {
    setSaveError('');
    setFieldErrors({});

    const dataToSend = { ...form };
    
    // Nos aseguramos que los días vacíos sean objetos {} y no arrays [] antes de enviar
    const cleanHorario = {};
    if (dataToSend.horario_semanal) {
      Object.keys(dataToSend.horario_semanal).forEach(dia => {
        const valor = dataToSend.horario_semanal[dia];
        // Si el valor es una lista [] o null, lo forzamos a objeto {}
        if (Array.isArray(valor) || !valor) {
          cleanHorario[dia] = {};
        } else {
          cleanHorario[dia] = valor;
        }
      });
    }

    const payload = { 
      ...dataToSend,
      horario_semanal: cleanHorario 
    };

    console.log("DEBUG - Payload a enviar (Objeto Raw):", payload);
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
                  <TableCell><HorarioSemanalDisplay horario={it.horario_semanal} /></TableCell>
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
            <HorarioSemanalPicker value={form.horario_semanal} onChange={(v) => setForm(s => ({ ...s, horario_semanal: v }))} disabled={dialogMode === 'view'} />
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