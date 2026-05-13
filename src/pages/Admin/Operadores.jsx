import React, { useState, useContext } from 'react';
import { Paper, Typography, Table, TableBody, TableCell, TableHead, TableRow, Button, Box, CircularProgress, TableContainer, Dialog, DialogTitle, DialogContent, DialogActions, TextField, IconButton, Tooltip, Stack, Skeleton, Pagination } from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Visibility as VisibilityIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getOperadores, createOperador, updateOperador, deleteOperador } from '../../services/operadoresService';
import { AuthContext } from '../../contexts/AuthContext';
import HorarioSemanalPicker from '../../components/HorarioSemanalPicker';
import HorarioSemanalDisplay from '../../components/HorarioSemanalDisplay';

export default function Operadores() {
  const { user } = useContext(AuthContext);
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
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

  const paginationData = data?.data || data || {};
  const items = Array.isArray(paginationData.data) ? paginationData.data : (Array.isArray(paginationData) ? paginationData : []);
  const totalPages = paginationData.last_page || 1;

  const saveMutation = useMutation({
    mutationFn: (payload) => {
      if (dialogMode === 'create') return createOperador(payload);
      return updateOperador(current.id || current.pk || current.operador_id, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operadores'] });
      setDialogOpen(false);
    },
    onError: (err) => {
      if (err.response?.status === 422) {
        setFieldErrors(err.response.data.errors || {});
        setSaveError(err.response.data.message || 'Errores de validación');
      } else {
        setSaveError('Error al guardar operador.');
      }
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteOperador(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['operadores'] })
  });

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

    // Aseguramos que el horario semanal se envíe como string JSON si el backend lo espera así
    const payload = {
      ...form,
      dni: form.DNI,
      password: form.contraseña,
      horario_semanal: typeof form.horario_semanal === 'object' 
        ? JSON.stringify(form.horario_semanal) 
        : form.horario_semanal
    };
    
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

      <TableContainer sx={{ minHeight: 400 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Nombre</TableCell>
              <TableCell>Apellido</TableCell>
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
                  <TableCell>{it.nombre || it.name}</TableCell>
                  <TableCell>{it.apellido || it.apellidos || '-'}</TableCell>
                  <TableCell>{it.usuario || it.user}</TableCell>
                  <TableCell><HorarioSemanalDisplay horario={it.horario_semanal} /></TableCell>
                  <TableCell align="right">
                    <Tooltip title="Ver"><IconButton size="small" onClick={() => openView(it)}><VisibilityIcon fontSize="small" /></IconButton></Tooltip>
                    <Tooltip title="Editar"><IconButton size="small" onClick={() => openEdit(it)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                    <Tooltip title="Eliminar"><IconButton size="small" color="error" onClick={() => { if (window.confirm('¿Eliminar?')) deleteMutation.mutate(it.id || it.pk || it.operador_id); }}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
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

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{dialogMode === 'create' ? 'Nuevo Operador' : dialogMode === 'edit' ? 'Editar Operador' : 'Detalles del Operador'}</DialogTitle>
        <DialogContent>
          {saveError && <Typography color="error" sx={{ mb: 1, mt: 1 }}>{saveError}</Typography>}
          <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField label="Nombre" value={form.nombre} onChange={(e) => setForm(s => ({ ...s, nombre: e.target.value }))} disabled={dialogMode === 'view'} error={!!fieldErrors.nombre} helperText={fieldErrors.nombre?.[0]} />
            <TextField label="Apellido" value={form.apellido} onChange={(e) => setForm(s => ({ ...s, apellido: e.target.value }))} disabled={dialogMode === 'view'} error={!!fieldErrors.apellido} helperText={fieldErrors.apellido?.[0]} />
            <TextField label="DNI" value={form.DNI} onChange={(e) => setForm(s => ({ ...s, DNI: e.target.value }))} disabled={dialogMode === 'view'} error={!!fieldErrors.dni || !!fieldErrors.DNI} helperText={fieldErrors.dni?.[0] || fieldErrors.DNI?.[0]} />
            <TextField label="Email" value={form.email} onChange={(e) => setForm(s => ({ ...s, email: e.target.value }))} disabled={dialogMode === 'view'} error={!!fieldErrors.email} helperText={fieldErrors.email?.[0]} />
            <TextField label="Usuario" value={form.usuario} onChange={(e) => setForm(s => ({ ...s, usuario: e.target.value }))} disabled={dialogMode === 'view' || dialogMode === 'edit'} error={!!fieldErrors.usuario} helperText={fieldErrors.usuario?.[0]} />
            {(dialogMode === 'create' || dialogMode === 'edit') && (
              <TextField label="Contraseña (opcional en edición)" type="password" value={form.contraseña} onChange={(e) => setForm(s => ({ ...s, contraseña: e.target.value }))} error={!!fieldErrors.password || !!fieldErrors.contrasena} helperText={fieldErrors.password?.[0] || fieldErrors.contrasena?.[0]} />
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