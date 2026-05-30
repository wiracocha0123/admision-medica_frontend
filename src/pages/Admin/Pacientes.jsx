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
import Swal from 'sweetalert2';

export default function Pacientes() {
  const { user } = useContext(AuthContext);
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);

  // Estados para filtros
  const [filterText, setFilterText] = useState('');
  const [filterHC, setFilterHC] = useState('');
  const [filterGestante, setFilterGestante] = useState('all');

  // Estados para modales
  const [editDialogOpen, setEditDialogOpen] = useState(false);

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

  // Con los cambios en el backend, la estructura es directa de Laravel Pagination
  const rawItems = Array.isArray(data?.data) ? data.data : [];
  const totalPages = data?.last_page || 1;
  
  // Aplicar filtros localmente
  const filteredItems = rawItems.filter(p => {
    const matchesText = 
      ((p.nombre || '') + ' ' + (p.apellido || '')).toLowerCase().includes(filterText.toLowerCase()) ||
      (p.dni || p.DNI || '').toLowerCase().includes(filterText.toLowerCase());

    const matchesHC = 
      (p.HistoriaClinica || '').toLowerCase().includes(filterHC.toLowerCase());
    
    const matchesGestante = 
      filterGestante === 'all' || 
      (filterGestante === 'yes' && p.gestante) || 
      (filterGestante === 'no' && !p.gestante);
      
    return matchesText && matchesHC && matchesGestante;
  });

  const items = [...filteredItems].sort((a, b) => (b.id || 0) - (a.id || 0));

  const deleteMutation = useMutation({
    mutationFn: (id) => deletePaciente(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['pacientes']);
      Swal.fire({
        icon: 'success',
        title: '¡Eliminado!',
        text: 'El paciente ha sido eliminado correctamente.',
        timer: 1500,
        showConfirmButton: false,
        heightAuto: false
      });
    },
    onError: (err) => {
      const msg = err.response?.data?.message || err.message;
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
        return updatePaciente(payload.id, payload);
      }
      return createPaciente(payload);
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['pacientes']);
      setEditDialogOpen(false);
      
      Swal.fire({
        icon: 'success',
        title: variables.id ? '¡Actualizado!' : '¡Registrado!',
        text: `Paciente ${variables.id ? 'actualizado' : 'registrado'} correctamente.`,
        timer: 2000,
        showConfirmButton: false,
        heightAuto: false
      });
    },
    onError: (err) => {
      let msg = err.response?.data?.message || err.message;
      
      if (msg.includes('dni has already been taken')) {
        msg = 'Ya existe un paciente registrado con este DNI.';
      } else if (msg.includes('HistoriaClinica has already been taken')) {
        msg = 'Este número de Historia Clínica ya está asignado.';
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
      Swal.fire({
        icon: 'warning',
        title: 'Campos requeridos',
        text: 'El nombre y el apellido son obligatorios.',
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

    if (!formData.direccion || !formData.direccion.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Campo requerido',
        text: 'La dirección es obligatoria.',
        confirmButtonColor: '#3085d6',
        heightAuto: false
      });
      return;
    }

    saveMutation.mutate(formData);
  };

  const handleOpenDeleteConfirm = (id) => {
    Swal.fire({
      title: '¿Estás seguro?',
      text: "Esta acción eliminará permanentemente el registro del paciente.",
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
        <Grid container spacing={2} sx={{ alignItems: 'center' }}>
          <Grid size={{ xs: 12, md: 4 }}>
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
          <Grid size={{ xs: 12, md: 3 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="H. Clínica (ej: H-5)..."
              value={filterHC}
              onChange={(e) => {
                setFilterHC(e.target.value);
                setPage(1);
              }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <PeopleIcon fontSize="small" color="action" />
                    </InputAdornment>
                  ),
                }
              }}
              sx={{ bgcolor: 'white' }}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <TextField
              select
              fullWidth
              size="small"
              label="Filtrar por Gestante"
              value={filterGestante}
              onChange={(e) => {
                setFilterGestante(e.target.value);
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
              sx={{ bgcolor: 'white' }}
            >
              <MenuItem value="all">Todos los registros</MenuItem>
              <MenuItem value="yes">Solo Gestantes</MenuItem>
              <MenuItem value="no">No Gestantes</MenuItem>
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, md: 2 }}>
            <Button 
              fullWidth 
              variant="text" 
              onClick={() => { 
                setFilterText(''); 
                setFilterGestante('all'); 
                setFilterHC(''); 
                setPage(1); 
              }}
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
                    <Stack direction="row" spacing={0.5} sx={{ justifyContent: 'flex-end' }}>
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
    </Paper>
  );
}