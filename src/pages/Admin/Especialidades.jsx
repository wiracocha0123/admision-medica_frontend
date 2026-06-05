import React, { useState, useContext } from 'react';
import { 
  Paper, Typography, Table, TableBody, TableCell, TableHead, TableRow, 
  Button, Box, CircularProgress, Alert, TableContainer, Skeleton, 
  Pagination, Stack, Dialog, DialogTitle, DialogContent, 
  DialogActions, TextField, IconButton, InputAdornment 
} from '@mui/material';
import { 
  Refresh as RefreshIcon, 
  Category as CategoryIcon, 
  Add as AddIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon,
  Search as SearchIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getEspecialidades, 
  createEspecialidad, 
  updateEspecialidad, 
  deleteEspecialidad 
} from '../../services/especialidadesService';
import { AuthContext } from '../../contexts/AuthContext';
import Swal from 'sweetalert2';

const initialForm = {
  UPS: '',
  especialidad: ''
};

export default function Especialidades() {
  const { user } = useContext(AuthContext);
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [searchTerm, setSearchTerm] = useState('');

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['especialidades', page],
    queryFn: () => getEspecialidades(page),
    enabled: !!user,
  });

  const mutation = useMutation({
    mutationFn: (payload) => editingId ? updateEspecialidad(editingId, payload) : createEspecialidad(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['especialidades'] });
      Swal.fire({ icon: 'success', title: editingId ? 'Actualizado' : 'Creado', timer: 1500, showConfirmButton: false });
      handleClose();
    },
    onError: (err) => {
      Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.message || 'Error al procesar' });
    }
  });

  const mutationDelete = useMutation({
    mutationFn: deleteEspecialidad,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['especialidades'] });
      Swal.fire({ icon: 'success', title: 'Eliminado', timer: 1500, showConfirmButton: false });
    }
  });

  const handleOpen = (esp = null) => {
    if (esp) {
      setEditingId(esp.id);
      setForm({ UPS: esp.UPS, especialidad: esp.especialidad });
    } else {
      setEditingId(null);
      setForm(initialForm);
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingId(null);
    setForm(initialForm);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate(form);
  };

  const handleDelete = (id) => {
    Swal.fire({
      title: '¿Eliminar?',
      text: 'No podrás revertir esto',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
    }).then(r => r.isConfirmed && mutationDelete.mutate(id));
  };

  // Con el backend corregido, la respuesta es el objeto de paginación directo
  const paginationData = data || {};
  
  // Extraemos los items: Soporta tanto si vienen en .data (estándar) como si vienen directo
  const rawItems = Array.isArray(paginationData.data) 
    ? paginationData.data 
    : (Array.isArray(data) ? data : []);
    
  const totalPages = paginationData.last_page || 1;

  // Mapeo flexible para nombres de columnas
  const items = rawItems.map(it => ({
    ...it,
    id: it.id || it.pk || it.especialidad_id,
    UPS: it.UPS || it.ups || it.codigo || '',
    especialidad: it.especialidad || it.nombre || it.name || it.description || ''
  }));

  // Filtrado local de seguridad
  const filteredItems = items.filter(esp => {
    const term = searchTerm.toLowerCase();
    return (
      String(esp.UPS || "").toLowerCase().includes(term) ||
      String(esp.especialidad || "").toLowerCase().includes(term)
    );
  });

  return (
    <Paper sx={{ p: 3 }}>
      {/* Cabecera Principal */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CategoryIcon color="primary" /> Especialidades {isFetching && <CircularProgress size={20} />}
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={() => refetch()}>
            Actualizar
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen()} color="primary">
            Nueva Especialidad
          </Button>
        </Stack>
      </Box>

      {/* Fila de Filtros (Debajo de la cabecera) */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: 2 }}>
        <TextField
          size="small"
          placeholder="Buscar por UPS o especialidad..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setPage(1);
          }}
          sx={{ width: 350 }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" fontSize="small" />
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

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error.message}</Alert>}

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'action.hover' }}>
              <TableCell>ID</TableCell>
              <TableCell>UPS</TableCell>
              <TableCell>Especialidad</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              [...Array(5)].map((_, i) => <TableRow key={i}><TableCell colSpan={4}><Skeleton /></TableCell></TableRow>)
            ) : filteredItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                  <Typography variant="body2" color="text.secondary">
                    No se encontraron especialidades. {searchTerm && `(Búsqueda: "${searchTerm}")`}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredItems.map(esp => (
                <TableRow key={esp.id} hover>
                  <TableCell>{esp.id}</TableCell>
                  <TableCell><b>{esp.UPS || esp.ups}</b></TableCell>
                  <TableCell>{esp.especialidad || esp.nombre}</TableCell>
                  <TableCell align="right">
                    <IconButton color="primary" onClick={() => handleOpen(esp)} size="small">
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton color="error" onClick={() => handleDelete(esp.id)} size="small">
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
        <Pagination count={totalPages} page={page} onChange={(_, v) => setPage(v)} color="primary" />
      </Box>

      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="xs">
        <form onSubmit={handleSubmit}>
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {editingId ? 'Editar' : 'Nueva'} Especialidad
            <IconButton size="small" onClick={handleClose}>
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField label="Código UPS" value={form.UPS} onChange={e => setForm({...form, UPS: e.target.value})} required fullWidth />
              <TextField label="Especialidad" value={form.especialidad} onChange={e => setForm({...form, especialidad: e.target.value})} fullWidth multiline rows={2} />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancelar</Button>
            <Button type="submit" variant="contained" disabled={mutation.isPending}>Guardar</Button>
          </DialogActions>
        </form>
      </Dialog>
    </Paper>
  );
}
