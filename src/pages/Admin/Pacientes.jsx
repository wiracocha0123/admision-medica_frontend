import React, { useState, useContext } from 'react';
import { Paper, Typography, Table, TableBody, TableCell, TableHead, TableRow, Button, Box, CircularProgress, TableContainer, Dialog, DialogTitle, DialogContent, DialogActions, TextField, IconButton, Tooltip, Stack, Skeleton, Pagination } from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPacientes, createPaciente, updatePaciente, deletePaciente } from '../../services/pacientesService';
import { AuthContext } from '../../contexts/AuthContext';

export default function Pacientes() {
  const { user } = useContext(AuthContext);
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState('create');
  const [current, setCurrent] = useState(null);
  const [form, setForm] = useState({ nombres: '', apellidos: '', dni: '', telefono: '', email: '', direccion: '' });
  const [fieldErrors, setFieldErrors] = useState({});

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['pacientes', page],
    queryFn: () => getPacientes(page),
    enabled: !!user,
  });

  const paginationData = data?.data || data || {};
  const items = Array.isArray(paginationData.data) ? paginationData.data : (Array.isArray(paginationData) ? paginationData : []);
  const totalPages = paginationData.last_page || 1;

  const saveMutation = useMutation({
    mutationFn: (payload) => dialogMode === 'create' ? createPaciente(payload) : updatePaciente(current.id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pacientes'] });
      setDialogOpen(false);
    },
    onError: (err) => { if (err.response?.status === 422) setFieldErrors(err.response.data.errors || {}); }
  });

  const openCreate = () => {
    setDialogMode('create');
    setForm({ nombres: '', apellidos: '', dni: '', telefono: '', email: '', direccion: '' });
    setFieldErrors({});
    setDialogOpen(true);
  };

  const handleSave = () => saveMutation.mutate(form);

  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h5">Pacientes {isFetching && <CircularProgress size={20} sx={{ ml: 2 }} />}</Typography>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={() => refetch()}>Refrescar</Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>Nuevo Paciente</Button>
        </Stack>
      </Box>

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Nombres y apellidos</TableCell>
              <TableCell>Gestante</TableCell>
              <TableCell>DNI</TableCell>
              <TableCell>Historia clinica</TableCell>
              <TableCell>Teléfono</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Direcciòn</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? [...Array(5)].map((_, i) => <TableRow key={i}><TableCell colSpan={7}><Skeleton /></TableCell></TableRow>) : 
             items.length === 0 ? <TableRow><TableCell colSpan={7} align="center">No hay pacientes registrados.</TableCell></TableRow> :
             items.map((it) => (
              <TableRow key={it.id}>
                <TableCell>{it.id}</TableCell>
                <TableCell>{it.nombre} {it.apellido}</TableCell>
                <TableCell>{it.gestante ? 'Sí' : 'No'}</TableCell>
                <TableCell>{it.dni}</TableCell>
                <TableCell>{it.HistoriaClinica || '-'}</TableCell>
                <TableCell>{it.telefono || '-'}</TableCell>
                <TableCell>{it.email || '-'}</TableCell>
                <TableCell>{it.direccion || '-'}</TableCell>
                <TableCell align="right">
                  <IconButton color="error" onClick={() => window.confirm('¿Eliminar?') && deletePaciente(it.id).then(() => refetch())}><DeleteIcon fontSize="small" /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
        <Pagination count={totalPages} page={page} onChange={(_, v) => setPage(v)} color="primary" />
      </Box>
    </Paper>
  );
}