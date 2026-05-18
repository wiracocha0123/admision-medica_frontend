import React, { useState, useContext } from 'react';
import { 
  Paper, Typography, Table, TableBody, TableCell, TableHead, TableRow, 
  Button, Box, Avatar, Alert, TableContainer, Skeleton, Chip, Pagination, 
  IconButton, Stack, Tooltip, Dialog, DialogTitle, DialogContent, 
  DialogContentText, DialogActions, TextField, Divider, FormControlLabel, Checkbox,
  InputAdornment, MenuItem, Grid
} from '@mui/material';
import { 
  Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon, Refresh as RefreshIcon,
  People as PeopleIcon, Search as SearchIcon, FilterList as FilterIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPacientes, createPaciente, updatePaciente, deletePaciente, getNextHC } from '../../services/pacientesService';
import { AuthContext } from '../../contexts/AuthContext';

export default function Pacientes() {
  const { user } = useContext(AuthContext);
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);

  // Estados para filtros
  const [filterText, setFilterText] = useState('');
  const [filterHC, setFilterHC] = useState('');
  const [filterGestante, setFilterGestante] = useState('all');

  // Estados para modales
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  
  // Estado para modal de error/validación
  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    dni: '',
    HistoriaClinica: '',
    telefono: '',
    email: '',
    direccion: '',
    gestante: false
  });

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['pacientes', page],
    queryFn: () => getPacientes(page),
    enabled: !!user,
  });

  const paginationData = data?.data || data || {};
  const rawItems = Array.isArray(paginationData.data) ? paginationData.data : (Array.isArray(paginationData) ? paginationData : []);
  
  // Aplicar filtros localmente
  const filteredItems = rawItems.filter(p => {
    const matchesText = 
      (p.nombre + ' ' + p.apellido).toLowerCase().includes(filterText.toLowerCase()) ||
      p.dni?.toLowerCase().includes(filterText.toLowerCase());

    const matchesHC = 
      p.HistoriaClinica?.toLowerCase().includes(filterHC.toLowerCase());
    
    const matchesGestante = 
      filterGestante === 'all' || 
      (filterGestante === 'yes' && p.gestante) || 
      (filterGestante === 'no' && !p.gestante);
      
    return matchesText && matchesHC && matchesGestante;
  });

  const items = [...filteredItems].sort((a, b) => b.id - a.id);
  const totalPages = paginationData.last_page || 1;

  const deleteMutation = useMutation({
    mutationFn: (id) => deletePaciente(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['pacientes']);
      setDeleteConfirmOpen(false);
      setItemToDelete(null);
    },
    onError: (err) => {
      const msg = err.response?.data?.message || err.message;
      setErrorMessage('Error al eliminar: ' + msg);
      setErrorModalOpen(true);
    }
  });

  const saveMutation = useMutation({
    mutationFn: (payload) => {
      if (payload.id) {
        return updatePaciente(payload.id, payload);
      }
      return createPaciente(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['pacientes']);
      setEditDialogOpen(false);
    },
    onError: (err) => {
      let msg = err.response?.data?.message || err.message;
      
      // Traducir mensajes comunes de error del servidor
      if (msg.includes('dni has already been taken')) {
        msg = 'Ya existe un paciente registrado con este DNI.';
      } else if (msg.includes('HistoriaClinica has already been taken')) {
        msg = 'Este número de Historia Clínica ya está asignado.';
      } else if (msg.includes('email has already been taken')) {
        msg = 'Este correo electrónico ya está en uso.';
      }

      setErrorMessage(msg);
      setErrorModalOpen(true);
    }
  });

  const handleOpenEdit = (item = null) => {
    if (item) {
      setFormData({
        id: item.id,
        nombre: item.nombre || '',
        apellido: item.apellido || '',
        dni: item.dni || '',
        HistoriaClinica: item.HistoriaClinica || '',
        telefono: item.telefono || '',
        email: item.email || '',
        direccion: item.direccion || '',
        gestante: !!item.gestante
      });
    } else {
      setFormData({
        nombre: '',
        apellido: '',
        dni: '',
        HistoriaClinica: '',
        telefono: '',
        email: '',
        direccion: '',
        gestante: false
      });
    }
    setEditDialogOpen(true);
  };

  const handleOpenCreate = async () => {
    setFormData({
      nombre: '',
      apellido: '',
      dni: '',
      HistoriaClinica: 'Cargando...',
      telefono: '',
      email: '',
      direccion: '',
      gestante: false
    });
    setEditDialogOpen(true);

    try {
      // Usar directamente el servicio importado en lugar de 'api'
      const resp = await getNextHC();
      console.log("Respuesta completa del servicio:", resp);
      
      const nextHC = resp.data?.next_hc || resp.next_hc || (typeof resp === 'string' ? resp : 'H-1');
      console.log("HC Extraído:", nextHC);
      
      setFormData(prev => ({ ...prev, HistoriaClinica: nextHC }));
    } catch (err) {
      console.error("Error al obtener siguiente HC:", err);
      setFormData(prev => ({ ...prev, HistoriaClinica: 'H-1' }));
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    
    // Validaciones manuales antes de enviar
    if (!formData.nombre.trim() || !formData.apellido.trim()) {
      setErrorMessage('El nombre y el apellido son obligatorios.');
      setErrorModalOpen(true);
      return;
    }
    
    if (!formData.dni || formData.dni.length !== 8) {
      setErrorMessage('El DNI debe tener exactamente 8 dígitos.');
      setErrorModalOpen(true);
      return;
    }

    if (!formData.direccion || !formData.direccion.trim()) {
      setErrorMessage('La dirección es un campo requerido.');
      setErrorModalOpen(true);
      return;
    }

    saveMutation.mutate(formData);
  };

  const handleOpenDeleteConfirm = (id) => {
    setItemToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      deleteMutation.mutate(itemToDelete);
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main', display: 'flex', alignItems: 'center', gap: 2 }}>
          <PeopleIcon sx={{ fontSize: 40 }} />
          Pacientes
        </Typography>
        <Stack direction="row" spacing={2}>
          <Button 
            variant="outlined" 
            startIcon={<RefreshIcon />} 
            onClick={() => queryClient.invalidateQueries(['pacientes'])}
          >
            Actualizar
          </Button>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />} 
            onClick={handleOpenCreate}
            sx={{ borderRadius: 2, px: 3 }}
          >
            Nuevo Paciente
          </Button>
        </Stack>
      </Box>

      <Box sx={{ mb: 3, p: 2, bgcolor: '#f8f9fa', borderRadius: 2, border: '1px solid #e9ecef' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              placeholder="Buscar por nombre o DNI..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
              }}
              sx={{ bgcolor: 'white' }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              size="small"
              placeholder="H. Clínica (ej: H-5)..."
              value={filterHC}
              onChange={(e) => setFilterHC(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PeopleIcon fontSize="small" color="action" />
                  </InputAdornment>
                ),
              }}
              sx={{ bgcolor: 'white' }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              select
              fullWidth
              size="small"
              label="Filtrar por Gestante"
              value={filterGestante}
              onChange={(e) => setFilterGestante(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <FilterIcon fontSize="small" color="action" />
                  </InputAdornment>
                ),
              }}
              sx={{ bgcolor: 'white' }}
            >
              <MenuItem value="all">Todos los registros</MenuItem>
              <MenuItem value="yes">Solo Gestantes</MenuItem>
              <MenuItem value="no">No Gestantes</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} md={2}>
            <Button 
              fullWidth 
              variant="text" 
              onClick={() => { setFilterText(''); setFilterGestante('all'); setFilterHC(''); }}
              sx={{ textTransform: 'none' }}
            >
              Limpiar
            </Button>
          </Grid>
        </Grid>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error.message || 'Error al cargar pacientes'}</Alert>}

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Paciente</TableCell>
              <TableCell>DNI</TableCell>
              <TableCell>H. Clínica</TableCell>
              <TableCell>Teléfono</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? [...Array(5)].map((_, i) => <TableRow key={i}><TableCell colSpan={7}><Skeleton /></TableCell></TableRow>) : 
             items.length === 0 ? <TableRow><TableCell colSpan={7} align="center">No hay pacientes registrados.</TableCell></TableRow> :
             items.map((p) => (
               <TableRow key={p.id} hover>
                 <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: "primary.light" }}>
                          {p.nombre?.[0] || "P"}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{p.nombre} {p.apellido}</Typography>
                          <Typography variant="caption" color="text.secondary" component="span">{p.direccion || 'Sin dirección'}</Typography>
                        </Box>
                    </Box>
                 </TableCell>
                 <TableCell>{p.dni}</TableCell>
                 <TableCell>{p.HistoriaClinica || '-'}</TableCell>
                 <TableCell>{p.telefono || '-'}</TableCell>
                 <TableCell>{p.email || '-'}</TableCell>
                 <TableCell>
                    {p.gestante && (
                      <Chip label="Gestante" size="small" color="secondary" />
                    )}
                 </TableCell>
                 <TableCell align="right">
                    <Stack direction="row" spacing={0.5} justifyContent="flex-end">
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
             ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
        <Pagination count={totalPages} page={page} onChange={(_, v) => setPage(v)} color="primary" />
      </Box>

      {/* Modal Crear/Editar Paciente */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: formData.id ? 'primary.main' : 'success.main', color: 'white', mb: 2 }}>
          {formData.id ? 'Editar Paciente' : 'Registrar Nuevo Paciente'}
        </DialogTitle>
        <form onSubmit={handleSave} noValidate>
          <DialogContent>
            <Stack spacing={2.5}>
              <TextField 
                label="Nombres" fullWidth variant="outlined"
                value={formData.nombre} 
                onChange={(e) => setFormData({...formData, nombre: e.target.value})} 
              />
              <TextField 
                label="Apellidos" fullWidth variant="outlined"
                value={formData.apellido} 
                onChange={(e) => setFormData({...formData, apellido: e.target.value})} 
              />
              <TextField 
                label="DNI" fullWidth variant="outlined"
                value={formData.dni} 
                onChange={(e) => setFormData({...formData, dni: e.target.value})} 
              />
              <TextField 
                label="Historia Clínica" fullWidth variant="outlined"
                value={formData.HistoriaClinica} 
                onChange={(e) => setFormData({...formData, HistoriaClinica: e.target.value})}
                helperText="Se autogenera el siguiente número 'H-X', pero puede modificarlo si es necesario."
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
              <TextField 
                label="Dirección" fullWidth variant="outlined"
                value={formData.direccion} 
                onChange={(e) => setFormData({...formData, direccion: e.target.value})} 
              />
              <FormControlLabel
                control={
                  <Checkbox 
                    checked={formData.gestante} 
                    onChange={(e) => setFormData({...formData, gestante: e.target.checked})} 
                  />
                }
                label="¿Es gestante?"
              />
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

      {/* Modal Confirmar Eliminación */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Estás seguro de que deseas eliminar permanentemente a este paciente? Esta acción no se puede deshacer.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)} color="inherit">Cancelar</Button>
          <Button onClick={confirmDelete} color="error" variant="contained" autoFocus disabled={deleteMutation.isLoading}>
            {deleteMutation.isLoading ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de Alerta/Error */}
      <Dialog 
        open={errorModalOpen} 
        onClose={() => setErrorModalOpen(false)}
      >
        <DialogTitle sx={{ bgcolor: 'error.main', color: 'white', fontWeight: 'bold' }}>
          Información Requerida
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <DialogContentText>
            {errorMessage}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button 
            onClick={() => setErrorModalOpen(false)} 
            variant="contained" 
            color="error"
            fullWidth
          >
            Entendido
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}