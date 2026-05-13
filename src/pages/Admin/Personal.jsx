import React, { useState, useContext } from 'react';
import { 
  Paper, Typography, Table, TableBody, TableCell, TableHead, TableRow, 
  Button, Box, Alert, TableContainer, Skeleton, Chip, Pagination, 
  IconButton, Stack, Tooltip, Dialog, DialogTitle, DialogContent, 
  DialogContentText, DialogActions, List, ListItem, ListItemText, Divider,
  TextField, MenuItem, Grid
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Visibility as ViewIcon, Add as AddIcon } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPersonalSalud, deletePersonalSalud, updatePersonalSalud, createPersonalSalud } from '../../services/personalService';
import { getEspecialidades } from '../../services/especialidadesService';
import { AuthContext } from '../../contexts/AuthContext';
import HorarioSemanalDisplay from '../../components/HorarioSemanalDisplay';
import HorarioSemanalPicker from '../../components/HorarioSemanalPicker';

export default function Personal() {
  const { user } = useContext(AuthContext);
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  // Estados para modales
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  // Estados para Edición/Creación
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    nombres: '',
    apellidos: '',
    dni: '',
    telefono: '',
    email: '',
    especialidad_id: '',
    horario_semanal: {}
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['personal', page],
    queryFn: () => getPersonalSalud(page),
    enabled: !!user,
  });

  const { data: especialidadesData } = useQuery({
    queryKey: ['especialidades_all'],
    queryFn: () => getEspecialidades(1), // Asumiendo que trae la mayoría o que el service maneja paginación
  });
  const especialidades = especialidadesData?.data?.data || especialidadesData?.data || [];

  const deleteMutation = useMutation({
    mutationFn: (id) => deletePersonalSalud(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['personal']);
      setDeleteConfirmOpen(false);
      setItemToDelete(null);
    },
    onError: (err) => {
      alert('Error al eliminar: ' + (err.response?.data?.message || err.message));
    }
  });

  const saveMutation = useMutation({
    mutationFn: (payload) => {
      if (payload.id) {
        return updatePersonalSalud(payload.id, payload);
      }
      return createPersonalSalud(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['personal']);
      setEditDialogOpen(false);
      alert('Guardado correctamente');
    },
    onError: (err) => {
      alert('Error al guardar: ' + (err.response?.data?.message || err.message));
    }
  });

  const handleOpenView = (item) => {
    setSelectedItem(item);
    setViewDialogOpen(true);
  };

  const handleOpenEdit = (item = null) => {
    if (item) {
      setFormData({
        id: item.id,
        nombres: item.nombres || '',
        apellidos: item.apellidos || '',
        dni: item.dni || '',
        telefono: item.telefono || '',
        email: item.email || '',
        especialidad_id: item.especialidad_id || '',
        horario_semanal: typeof item.horario_semanal === 'string' ? JSON.parse(item.horario_semanal) : (item.horario_semanal || {})
      });
    } else {
      setFormData({
        nombres: '',
        apellidos: '',
        dni: '',
        telefono: '',
        email: '',
        especialidad_id: '',
        horario_semanal: {}
      });
    }
    setEditDialogOpen(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    
    // Aseguramos que el horario semanal se envíe como string JSON si el backend lo espera así
    const payload = {
      ...formData,
      horario_semanal: typeof formData.horario_semanal === 'object' 
        ? JSON.stringify(formData.horario_semanal) 
        : formData.horario_semanal
    };
    
    saveMutation.mutate(payload);
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

  const paginationData = data?.data || data || {};
  const items = Array.isArray(paginationData.data) ? paginationData.data : (Array.isArray(paginationData) ? paginationData : []);
  const totalPages = paginationData.last_page || 1;

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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5">Personal de Salud</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenEdit()}>
          Nuevo Personal
        </Button>
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
             items.length === 0 ? <TableRow><TableCell colSpan={7} align="center">No hay personal registrado.</TableCell></TableRow> :
             items.map((p) => {
               const horario = p.horario_semanal;
               return (
                 <TableRow key={p.id} hover>
                   <TableCell>{p.nombres} {p.apellidos}</TableCell>
                    <TableCell>{p.dni || '-'}</TableCell>
                   <TableCell>{p.telefono || '-'}</TableCell>
                   <TableCell>{p.email || '-'}</TableCell>
                   <TableCell><Chip label={p.especialidad?.UPS || 'Sin asignar'} size="small" /></TableCell>
                   <TableCell>
                      <HorarioSemanalDisplay horario={horario} />
                   </TableCell>
                   <TableCell align="right">
                      <Stack direction="row" spacing={0.5} justifyContent="flex-end">
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
                <ListItemText primary="Especialidad / UPS" secondary={selectedItem.especialidad?.especialidad || selectedItem.especialidad?.UPS || 'Sin asignar'} />
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
              <ListItem>
                <ListItemText primary="Colegiatura" secondary={selectedItem.colegiatura || '-'} />
              </ListItem>
              <Divider />
              <ListItem>
                <Box sx={{ width: '100%' }}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>Horario Semanal</Typography>
                  <HorarioSemanalDisplay horario={selectedItem.horario_semanal} />
                </Box>
              </ListItem>
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* Modal Confirmar Eliminación */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Estás seguro de que deseas eliminar permanentemente a este personal de salud? Esta acción no se puede deshacer.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)} color="inherit">Cancelar</Button>
          <Button onClick={confirmDelete} color="error" variant="contained" autoFocus disabled={deleteMutation.isLoading}>
            {deleteMutation.isLoading ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal Crear/Editar Personal */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{formData.id ? 'Editar Personal' : 'Nuevo Personal'}</DialogTitle>
        <form onSubmit={handleSave}>
          <DialogContent dividers>
            <Grid container spacing={2}>
              {/* Primera Fila: Nombres y Apellidos */}
              <Grid item xs={12} sm={6}>
                <TextField 
                  label="Nombres" fullWidth required variant="outlined"
                  value={formData.nombres} 
                  onChange={(e) => setFormData({...formData, nombres: e.target.value})} 
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField 
                  label="Apellidos" fullWidth required variant="outlined"
                  value={formData.apellidos} 
                  onChange={(e) => setFormData({...formData, apellidos: e.target.value})} 
                />
              </Grid>

              {/* Segunda Fila: DNI, Teléfono y Email */}
              <Grid item xs={12} sm={4}>
                <TextField 
                  label="DNI" fullWidth required variant="outlined"
                  value={formData.dni} 
                  onChange={(e) => setFormData({...formData, dni: e.target.value})} 
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField 
                  label="Teléfono" fullWidth variant="outlined"
                  value={formData.telefono} 
                  onChange={(e) => setFormData({...formData, telefono: e.target.value})} 
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField 
                  label="Email" type="email" fullWidth variant="outlined"
                  value={formData.email} 
                  onChange={(e) => setFormData({...formData, email: e.target.value})} 
                />
              </Grid>

              {/* Tercera Fila: Especialidad */}
              <Grid item xs={12}>
                <TextField 
                  select label="Especialidad" fullWidth required variant="outlined"
                  value={formData.especialidad_id} 
                  onChange={(e) => setFormData({...formData, especialidad_id: e.target.value})}
                  helperText="Seleccione la especialidad o UPS asignada"
                >
                  {especialidades.map((esp) => (
                    <MenuItem key={esp.id} value={esp.id}>
                      {esp.especialidad} {esp.UPS ? `- UPS: ${esp.UPS}` : ''}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              {/* Sección de Horario */}
              <Grid item xs={12}>
                <Box sx={{ mt: 1, p: 2, border: '1px solid #e0e0e0', borderRadius: 1, bgcolor: '#f9f9f9' }}>
                  <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                    Configuración de Horario Semanal
                  </Typography>
                  <HorarioSemanalPicker 
                    value={formData.horario_semanal} 
                    onChange={(newHorario) => setFormData({...formData, horario_semanal: newHorario})} 
                  />
                </Box>
              </Grid>
            </Grid>
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