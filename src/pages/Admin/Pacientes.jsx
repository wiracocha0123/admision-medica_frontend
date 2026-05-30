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
    tipo_documento: 'DNI',
    dni: '',
    HistoriaClinica: '',
    telefono: '',
    email: '',
    direccion: '',
    gestante: false,
    etapa_vida: 'Adulto',
    detalle_gestante: ''
  });

  // Lógica de etapa de vida y gestante
  React.useEffect(() => {
    if (formData.etapa_vida === 'Gestante') {
      if (!formData.gestante) {
        setFormData(prev => ({ ...prev, gestante: true }));
      }
    } else {
      if (formData.gestante) {
        setFormData(prev => ({ ...prev, gestante: false, detalle_gestante: '' }));
      }
    }
  }, [formData.etapa_vida]);

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
      console.error("DEBUG - Error completo del servidor:", err.response?.data);
      
      let msg = "Ocurrió un error inesperado al guardar el paciente.";
      const serverData = err.response?.data;

      // 1. Manejo de errores de validación (Laravel) - Siempre priorizar si serverData es objeto
      if (serverData && typeof serverData === 'object' && serverData.errors) {
        const errorList = Object.values(serverData.errors).flat();
        msg = errorList[0];
      } 
      // 2. Errores de Base de Datos (SQLSTATE) - Capturar incluso si viene en un objeto "message" largo
      else {
        const errorText = typeof serverData === 'string' ? serverData : (serverData?.message || "");
        
        if (errorText.includes('SQLSTATE')) {
          if (errorText.includes('23505')) {
            msg = "Ya existe un paciente con este número de documento o Historia Clínica.";
          } else if (errorText.includes('22001') || errorText.toLowerCase().includes('too long') || errorText.toLowerCase().includes('truncated')) {
            msg = "El número ingresado es muy largo. Por favor, registre solo el número del documento sin incluir letras como 'CE' o 'DNI'.";
          } else if (errorText.includes('23503')) {
            msg = "Error de vinculación: Uno de los datos seleccionados no es válido en el sistema.";
          } else {
            msg = "Error de base de datos: Los datos ingresados no son compatibles con el sistema.";
          }
        } else if (serverData?.message) {
          msg = serverData.message;
        }
      }

      // Traducciones finales de limpieza
      if (msg.includes('dni has already been taken')) msg = 'Ya existe un paciente registrado con este número de documento.';
      if (msg.includes('HistoriaClinica has already been taken')) msg = 'Este número de Historia Clínica ya está asignado.';

      Swal.fire({
        icon: 'error',
        title: 'No se pudo guardar',
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
        tipo_documento: item.tipo_documento || 'DNI',
        dni: item.dni || '',
        HistoriaClinica: item.HistoriaClinica || '',
        telefono: item.telefono || '',
        email: item.email || '',
        direccion: item.direccion || '',
        gestante: !!item.gestante,
        etapa_vida: item.etapa_vida || 'Adulto',
        detalle_gestante: item.detalle_gestante || ''
      });
    } else {
      setFormData({
        nombre: '',
        apellido: '',
        tipo_documento: 'DNI',
        dni: '',
        HistoriaClinica: '',
        telefono: '',
        email: '',
        direccion: '',
        gestante: false,
        etapa_vida: 'Adulto',
        detalle_gestante: ''
      });
    }
    setEditDialogOpen(true);
  };

  const handleOpenCreate = async () => {
    setFormData({
      nombre: '',
      apellido: '',
      tipo_documento: 'DNI',
      dni: '',
      HistoriaClinica: 'Cargando...',
      telefono: '',
      email: '',
      direccion: '',
      gestante: false,
      etapa_vida: 'Adulto',
      detalle_gestante: ''
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
    
    if (formData.tipo_documento === 'DNI' && (!formData.dni || String(formData.dni).length !== 8)) {
      Swal.fire({
        icon: 'warning',
        title: 'DNI inválido',
        text: 'El DNI debe tener exactamente 8 dígitos.',
        confirmButtonColor: '#3085d6',
        heightAuto: false
      });
      return;
    }

    if (formData.tipo_documento !== 'DNI' && (!formData.dni || String(formData.dni).length < 5 || String(formData.dni).length > 15)) {
      Swal.fire({
        icon: 'warning',
        title: 'Documento inválido',
        text: `El número de ${formData.tipo_documento} debe tener entre 5 y 15 caracteres.`,
        confirmButtonColor: '#3085d6',
        heightAuto: false
      });
      return;
    }

    if (formData.etapa_vida === 'Gestante' && !formData.detalle_gestante) {
      Swal.fire({
        icon: 'warning',
        title: 'Detalle requerido',
        text: 'Debe seleccionar un nivel de gestación (A1, A2 o A3).',
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
              <TableCell>Documento</TableCell>
              <TableCell>H. Clínica</TableCell>
              <TableCell>Etapa Vida</TableCell>
              <TableCell>Contacto</TableCell>
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
                 <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                      {p.tipo_documento === 'CE' ? `CE: ${p.dni}` : p.dni}
                    </Typography>
                    {p.tipo_documento && p.tipo_documento !== 'DNI' && p.tipo_documento !== 'CE' && (
                      <Typography variant="caption" color="text.secondary">{p.tipo_documento}</Typography>
                    )}
                 </TableCell>
                 <TableCell>{p.HistoriaClinica || '-'}</TableCell>
                 <TableCell>
                    <Chip 
                      label={p.etapa_vida || 'Adulto'} 
                      size="small" 
                      variant="outlined" 
                      color="primary"
                      sx={{ fontSize: '0.75rem' }}
                    />
                 </TableCell>
                 <TableCell>
                    <Typography variant="body2">{p.telefono || '-'}</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>{p.email || '-'}</Typography>
                 </TableCell>
                 <TableCell>
                    {p.gestante && (
                      <Tooltip title={p.detalle_gestante ? `Detalle: ${p.detalle_gestante}` : "Paciente gestante"}>
                        <Box>
                          <Chip label="Gestante" size="small" color="secondary" />
                          {p.detalle_gestante && (
                            <Typography variant="caption" sx={{ display: 'block', mt: 0.5, fontWeight: 'bold' }}>
                              Nivel: {p.detalle_gestante}
                            </Typography>
                          )}
                        </Box>
                      </Tooltip>
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
          <DialogContent dividers>
            <Stack spacing={2.5}>
              <Grid container spacing={2}>
                <Grid size={6}>
                  <TextField 
                    label="Nombres" fullWidth variant="outlined" required
                    value={formData.nombre} 
                    onChange={(e) => setFormData({...formData, nombre: e.target.value})} 
                  />
                </Grid>
                <Grid size={6}>
                  <TextField 
                    label="Apellidos" fullWidth variant="outlined" required
                    value={formData.apellido} 
                    onChange={(e) => setFormData({...formData, apellido: e.target.value})} 
                  />
                </Grid>
              </Grid>

              <Grid container spacing={2}>
                <Grid size={4}>
                  <TextField
                    select
                    label="Tipo de Doc."
                    fullWidth
                    value={formData.tipo_documento}
                    onChange={(e) => setFormData({...formData, tipo_documento: e.target.value})}
                  >
                    <MenuItem value="DNI">DNI</MenuItem>
                    <MenuItem value="CE">CE (Extranjería)</MenuItem>
                    <MenuItem value="Pasaporte">Pasaporte</MenuItem>
                  </TextField>
                </Grid>
                <Grid size={8}>
                  <TextField 
                    label={formData.tipo_documento === 'DNI' ? "DNI" : "Número de Documento"} 
                    fullWidth variant="outlined" required
                    value={formData.dni} 
                    onChange={(e) => {
                      const val = e.target.value;
                      // Mantenemos una longitud razonable en el front (ej. 15), 
                      // la base de datos es la que restringirá el máximo a 8 si no se ha migrado.
                      if (val.length <= 15) {
                        if (formData.tipo_documento === 'DNI') {
                          if (/^\d*$/.test(val) && val.length <= 8) {
                            setFormData({...formData, dni: val});
                          }
                        } else {
                          setFormData({...formData, dni: val});
                        }
                      }
                    }} 
                    helperText={formData.tipo_documento === 'DNI' ? "8 dígitos" : "Ingrese el número sin prefijos (ej: 87451236)"}
                  />
                </Grid>
              </Grid>

              <Grid container spacing={2}>
                <Grid size={6}>
                  <TextField
                    select
                    label="Etapa de Vida"
                    fullWidth
                    value={formData.etapa_vida}
                    onChange={(e) => setFormData({...formData, etapa_vida: e.target.value})}
                  >
                    <MenuItem value="RN">RN (Recién Nacido)</MenuItem>
                    <MenuItem value="Niño">Niño</MenuItem>
                    <MenuItem value="Adolescente">Adolescente</MenuItem>
                    <MenuItem value="Adulto">Adulto</MenuItem>
                    <MenuItem value="Adulto Mayor">Adulto Mayor</MenuItem>
                    <MenuItem value="Gestante">Gestante</MenuItem>
                  </TextField>
                </Grid>
                <Grid size={6}>
                  {formData.etapa_vida === 'Gestante' && (
                    <TextField
                      select
                      label="Detalle de Gestación"
                      fullWidth
                      value={formData.detalle_gestante}
                      onChange={(e) => setFormData({...formData, detalle_gestante: e.target.value})}
                      sx={{ animation: 'fadeIn 0.5s' }}
                    >
                      <MenuItem value="">Seleccione sector...</MenuItem>
                      <MenuItem value="A1">Sector A1</MenuItem>
                      <MenuItem value="A2">Sector A2</MenuItem>
                      <MenuItem value="A3">Sector A3</MenuItem>
                    </TextField>
                  )}
                </Grid>
              </Grid>

              <TextField 
                label="Historia Clínica" fullWidth variant="outlined"
                value={formData.HistoriaClinica} 
                onChange={(e) => setFormData({...formData, HistoriaClinica: e.target.value})}
                helperText="Se autogenera el siguiente número 'H-X', pero puede modificarlo si es necesario."
              />
              
              <Grid container spacing={2}>
                <Grid size={6}>
                  <TextField 
                    label="Teléfono" fullWidth variant="outlined"
                    value={formData.telefono} 
                    onChange={(e) => setFormData({...formData, telefono: e.target.value})} 
                  />
                </Grid>
                <Grid size={6}>
                  <TextField 
                    label="Email" type="email" fullWidth variant="outlined"
                    value={formData.email} 
                    onChange={(e) => setFormData({...formData, email: e.target.value})} 
                  />
                </Grid>
              </Grid>

              <TextField 
                label="Dirección" fullWidth variant="outlined" required
                value={formData.direccion} 
                onChange={(e) => setFormData({...formData, direccion: e.target.value})} 
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