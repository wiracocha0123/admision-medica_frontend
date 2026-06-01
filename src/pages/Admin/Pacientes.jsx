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
  People as PeopleIcon, Search as SearchIcon, FilterList as FilterIcon,
  FileUpload as ImportIcon, Archive as ArchiveIcon, History as HistoryIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPacientes, createPaciente, updatePaciente, deletePaciente, getNextHC, getAllPacientes } from '../../services/pacientesService';
import { AuthContext } from '../../contexts/AuthContext';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';

export default function Pacientes() {
  const { user } = useContext(AuthContext);
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);

  // Estados para filtros
  const [filterText, setFilterText] = useState('');
  const [filterHC, setFilterHC] = useState('');
  const [filterGestante, setFilterGestante] = useState('all');
  const [filterEstado, setFilterEstado] = useState('Activo'); // Nuevo filtro de estado por defecto en Activo

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
    queryKey: ['pacientes', page, filterText, filterHC, filterGestante, filterEstado],
    queryFn: () => getPacientes(page, filterText, filterHC, filterGestante, filterEstado),
    enabled: !!user,
  });

  // Con los cambios en el backend, la estructura es directa de Laravel Pagination
  const rawItems = Array.isArray(data?.data) ? data.data : [];
  const totalPages = data?.last_page || 1;
  
  // Aplicar filtros localmente
  const filteredItems = rawItems.filter(p => {
    const matchesText = 
      ((p.nombre || '') + ' ' + (p.apellido || '')).toLowerCase().includes(filterText.toLowerCase()) ||
      (p.dni || p.DNI || '').toString().toLowerCase().includes(filterText.toLowerCase());

    const matchesHC = 
      (p.HistoriaClinica || '').toLowerCase().includes(filterHC.toLowerCase());
    
    // Normalizar el valor de gestante (puede venir como '1', 1, true o boolean)
    const isGestante = p.gestante === true || p.gestante === 1 || p.gestante === '1' || p.etapa_vida === 'Gestante';

    const matchesGestante = 
      filterGestante === 'all' || 
      (filterGestante === 'yes' && isGestante) || 
      (filterGestante === 'no' && !isGestante);
    
    // Filtro por estado
    const matchesEstado = 
      filterEstado === 'todos' || 
      (filterEstado === 'Activo' && (p.estado === 'Activo' || !p.estado)) || 
      (p.estado === filterEstado);
      
    return matchesText && matchesHC && matchesGestante && matchesEstado;
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
        detalle_gestante: item.detalle_gestante || '',
        estado: item.estado || 'Activo'
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
        detalle_gestante: '',
        estado: 'Activo'
      });
    }
    setEditDialogOpen(true);
  };

  const handleOpenCreate = async (manualHC = null) => {
    setFormData({
      nombre: '',
      apellido: '',
      tipo_documento: 'DNI',
      dni: '',
      HistoriaClinica: manualHC || 'Cargando...',
      telefono: '',
      email: '',
      direccion: '',
      gestante: false,
      etapa_vida: 'Adulto',
      detalle_gestante: '',
      estado: 'Activo'
    });
    setEditDialogOpen(true);

    if (manualHC) return; // Si ya pasamos una HC (manual o liberada), no buscamos otra

    try {
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

  const handleImportExcel = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        if (data.length === 0) {
          Swal.fire({ icon: 'error', title: 'Error', text: 'El archivo está vacío', heightAuto: false });
          return;
        }

        Swal.fire({
          title: 'Procesando archivo...',
          text: `Se han detectado ${data.length} registros. ¿Desea importarlos?`,
          icon: 'question',
          showCancelButton: true,
          confirmButtonText: 'Sí, importar',
          cancelButtonText: 'Cancelar',
          heightAuto: false
        }).then(async (result) => {
          if (result.isConfirmed) {
            Swal.fire({
              title: 'Optimizando importación...',
              text: 'Buscando pacientes existentes para evitar duplicados...',
              allowOutsideClick: false,
              didOpen: () => Swal.showLoading(),
              heightAuto: false
            });

            // 1. Obtener lista actual para deduplicación local
            const existingDnis = new Set();
            const existingHcs = new Set();
            try {
              const currentPacientes = await getAllPacientes();
              const list = Array.isArray(currentPacientes) ? currentPacientes : (currentPacientes?.data || []);
              list.forEach(p => {
                if (p.dni) existingDnis.add(p.dni.toString().trim());
                if (p.HistoriaClinica) existingHcs.add(p.HistoriaClinica.toString().trim());
              });
            } catch (e) { console.error("Error precargando pacientes:", e); }

            // 2. Filtrar los que ya existen para no perder tiempo en red
            const toImport = data.filter(row => {
              const dniKey = Object.keys(row).find(k => k.toUpperCase() === 'DNI');
              const hclKey = Object.keys(row).find(k => k.toUpperCase().includes('HCL') || k.toUpperCase().includes('HISTORIA'));
              const dni = (row[dniKey] || '').toString().trim();
              const hcl = (row[hclKey] || '').toString().trim();
              const formattedHcl = hcl ? (hcl.startsWith('H-') ? hcl : `H-${hcl}`) : '';
              
              return !existingDnis.has(dni) && (!formattedHcl || !existingHcs.has(formattedHcl));
            });

            const skippedCount = data.length - toImport.length;

            if (toImport.length === 0) {
              Swal.fire({
                icon: 'info',
                title: 'Nada nuevo que importar',
                text: `${skippedCount} registros ya existen en la base de datos.`,
                heightAuto: false
              });
              return;
            }

            Swal.fire({
              title: 'Importando...',
              html: `Progreso: <b>0</b> / ${toImport.length}<br/><small>Omitidos (ya existen): ${skippedCount}</small>`,
              allowOutsideClick: false,
              didOpen: () => Swal.showLoading(),
              heightAuto: false
            });

            let successCount = 0;
            let errorCount = 0;
            const CHUNK_SIZE = 100; // Lotes más grandes para mayor velocidad

            for (let i = 0; i < toImport.length; i += CHUNK_SIZE) {
              const chunk = toImport.slice(i, i + CHUNK_SIZE);
              
              const promises = chunk.map(async (row) => {
                // Lógica de nombres y apellidos
                const fullNameKey = Object.keys(row).find(k => k.toUpperCase().includes('NOMBRE'));
                const fullName = (row[fullNameKey] || '').toString().trim();
                const words = fullName.split(/\s+/).filter(Boolean);
                
                let apellido = '', nombre = '';
                if (words.length === 0) { apellido = 'DESCONOCIDO'; nombre = 'PACIENTE'; }
                else if (words.length === 1) { apellido = words[0]; nombre = '-'; }
                else if (words.length === 2) { apellido = words[0]; nombre = words[1]; }
                else { apellido = words[0] + ' ' + words[1]; nombre = words.slice(2).join(' '); }

                const dniKey = Object.keys(row).find(k => k.toUpperCase() === 'DNI');
                const hclKey = Object.keys(row).find(k => k.toUpperCase().includes('HCL') || k.toUpperCase().includes('HISTORIA'));
                const telKey = Object.keys(row).find(k => k.toUpperCase().includes('TELEFONO'));
                const dni = (row[dniKey] || '').toString().trim();
                const hcl = (row[hclKey] || '').toString().trim();
                const tel = (row[telKey] || '').toString().trim();
                
                const dirKey = Object.keys(row).find(k => k.toUpperCase().includes('DIRECCION'));
                const distKey = Object.keys(row).find(k => k.toUpperCase().includes('DISTRITO'));
                const provKey = Object.keys(row).find(k => k.toUpperCase().includes('PROVINCIA'));
                const direccionCompleta = [row[dirKey], row[distKey], row[provKey]].filter(Boolean).join(' - ');

                const gestKey = Object.keys(row).find(k => k.toUpperCase().includes('GESTANTE'));
                const gestVal = row[gestKey];
                const esGestante = !!gestVal;

                const payload = {
                  nombre, apellido, tipo_documento: 'DNI', dni,
                  HistoriaClinica: hcl ? (hcl.startsWith('H-') ? hcl : `H-${hcl}`) : '',
                  telefono: tel, email: '',
                  direccion: direccionCompleta || 'No especificada',
                  gestante: esGestante, etapa_vida: esGestante ? 'Gestante' : 'Adulto',
                  detalle_gestante: esGestante ? (gestVal.toString().substring(0, 10)) : ''
                };

                try {
                  await createPaciente(payload);
                  successCount++;
                } catch (err) { errorCount++; }
              });

              await Promise.all(promises);
              
              const progressB = Swal.getHtmlContainer()?.querySelector('b');
              if (progressB) progressB.textContent = Math.min(i + CHUNK_SIZE, toImport.length);
            }

            queryClient.invalidateQueries(['pacientes']);
            Swal.fire({
              icon: 'success',
              title: 'Importación terminada',
              html: `<b>Nuevos registrados:</b> ${successCount}<br/>` +
                    `<b>Ya existían (omitidos):</b> ${skippedCount}<br/>` +
                    `<b>Errores técnicos:</b> ${errorCount}`,
              heightAuto: false
            });
          }
        });

      } catch (err) {
        console.error(err);
        Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo leer el archivo Excel', heightAuto: false });
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = null;
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

  const handleArchiveAndReleaseHC = (paciente) => {
    const originalHC = paciente.HistoriaClinica;

    Swal.fire({
      title: `Liberar HC: ${originalHC}`,
      html: `¿Qué acción desea realizar con <b>${paciente.nombre} ${paciente.apellido}</b>?<br/><br/>` +
            `• Se archivará como: <b>${originalHC}-OLD</b><br/>` +
            `• El número <b>${originalHC}</b> quedará libre.`,
      icon: 'warning',
      showCancelButton: true,
      showDenyButton: true,
      confirmButtonColor: '#ff9800', // Naranja para Solo Liberar
      denyButtonColor: '#3085d6',    // Azul para Liberar y Crear
      cancelButtonColor: '#d33',
      confirmButtonText: 'Solo Liberar HC',
      denyButtonText: 'Liberar y Asignar a Nuevo',
      cancelButtonText: 'Cancelar',
      heightAuto: false
    }).then((result) => {
      if (result.isConfirmed || result.isDenied) {
        const payload = {
          ...paciente,
          HistoriaClinica: `${originalHC}-OLD`,
          estado: 'Archivado'
        };

        const isAssigningNew = result.isDenied;

        saveMutation.mutate(payload, {
          onSuccess: () => {
            if (isAssigningNew) {
              // Pequeña espera para que cierre el modal anterior si fuera necesario
              setTimeout(() => {
                handleOpenCreate(originalHC);
              }, 500);
            }
          }
        });
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
        <Stack direction="row" spacing={2}>          <input
            type="file"
            accept=".xlsx, .xls, .csv"
            style={{ display: 'none' }}
            id="import-excel-input"
            onChange={handleImportExcel}
          />
          <label htmlFor="import-excel-input">
            <Button 
              variant="outlined" 
              component="span"
              startIcon={<ImportIcon />}
              color="success"
            >
              Importar Excel
            </Button>
          </label>          <Button 
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
          <Grid size={{ xs: 12, md: 3 }}>
            <TextField
              select
              fullWidth
              size="small"
              label="Estado"
              value={filterEstado}
              onChange={(e) => {
                setFilterEstado(e.target.value);
                setPage(1);
              }}
              sx={{ bgcolor: 'white' }}
            >
              <MenuItem value="Activo">Solo Activos</MenuItem>
              <MenuItem value="Archivado">Archivados / Quitados</MenuItem>
              <MenuItem value="todos">Ver Todos</MenuItem>
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
                setFilterEstado('Activo');
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
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      <Chip 
                        label={p.etapa_vida || 'Adulto'} 
                        size="small" 
                        variant="outlined" 
                        color="primary"
                        sx={{ fontSize: '0.75rem', width: 'fit-content' }}
                      />
                      {(p.gestante || p.etapa_vida === 'Gestante') && (
                        <Tooltip title={p.detalle_gestante ? `Detalle: ${p.detalle_gestante}` : "Paciente gestante"}>
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              color: 'secondary.main', 
                              fontWeight: 'bold',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 0.5
                            }}
                          >
                            {p.detalle_gestante && `(${p.detalle_gestante})`}
                          </Typography>
                        </Tooltip>
                      )}
                    </Box>
                 </TableCell>
                 <TableCell>
                    <Typography variant="body2">{p.telefono || '-'}</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>{p.email || '-'}</Typography>
                 </TableCell>
                 <TableCell>
                    <Chip 
                      label={p.estado || 'Activo'} 
                      size="small" 
                      color={p.estado === 'Archivado' ? 'default' : 'success'}
                      variant={p.estado === 'Archivado' ? 'outlined' : 'filled'}
                      sx={{ fontSize: '0.7rem', height: 20 }}
                    />
                 </TableCell>
                 <TableCell align="right">
                    <Stack direction="row" spacing={0.5} sx={{ justifyContent: 'flex-end' }}>
                      {(!p.estado || p.estado === 'Activo') && (
                        <Tooltip title="Quitar y Liberar HC">
                          <IconButton size="small" color="warning" onClick={() => handleArchiveAndReleaseHC(p)}>
                            <HistoryIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
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

              {formData.id && (
                <TextField
                  select
                  label="Estado"
                  fullWidth
                  value={formData.estado || 'Activo'}
                  onChange={(e) => setFormData({...formData, estado: e.target.value})}
                >
                  <MenuItem value="Activo">Activo</MenuItem>
                  <MenuItem value="Archivado">Archivado / Dado de Baja</MenuItem>
                </TextField>
              )}
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