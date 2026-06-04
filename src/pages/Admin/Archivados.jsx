import React, { useState, useContext } from 'react';
import { 
  Paper, Typography, Table, TableBody, TableCell, TableHead, TableRow, 
  Button, Box, Avatar, Alert, TableContainer, Skeleton, Chip, Pagination, 
  IconButton, Stack, Tooltip, TextField, InputAdornment, Grid
} from '@mui/material';
import { 
  History as HistoryIcon, Search as SearchIcon, 
  SettingsBackupRestore as RestoreIcon, PersonOff as PersonOffIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPacientes, updatePaciente, getNextHC, getAllPacientes, deletePaciente } from '../../services/pacientesService';
import { AuthContext } from '../../contexts/AuthContext';
import Swal from 'sweetalert2';

export default function Archivados() {
  const { user } = useContext(AuthContext);
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [filterText, setFilterText] = useState('');

  // Consultamos solo los archivados
  const { data, isLoading, error } = useQuery({
    queryKey: ['pacientes-archivados', page, filterText],
    queryFn: () => getPacientes(page, filterText, '', 'all', 'Archivado'),
    enabled: !!user,
  });

  const updateMutation = useMutation({
    mutationFn: (payload) => updatePaciente(payload.id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries(['pacientes-archivados']);
      queryClient.invalidateQueries(['pacientes']);
      Swal.fire({
        icon: 'success',
        title: '¡Paciente Reactivado!',
        text: 'El paciente ha vuelto a la lista de activos con una nueva HC.',
        timer: 2000,
        showConfirmButton: false,
        heightAuto: false
      });
    },
  });

  const handleReactivate = async (paciente) => {
    Swal.fire({
      title: '¿Cómo deseas reactivar este paciente?',
      text: `${paciente.nombre} ${paciente.apellido}`,
      icon: 'question',
      showCancelButton: true,
      showDenyButton: true,
      confirmButtonColor: '#3085d6',
      denyButtonColor: '#ff9800',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Buscar HC Liberada',
      denyButtonText: 'Asignar HC Nueva',
      cancelButtonText: 'Cancelar',
      heightAuto: false
    }).then(async (result) => {
      if (result.isDenied) {
        // Opción: Asignar HC nueva disponible
        try {
          Swal.fire({
            title: 'Obteniendo HC disponible...',
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading(),
            heightAuto: false
          });

          const resp = await getNextHC();
          const newHC = resp.data?.next_hc || resp.next_hc || 'H-1';

          const payload = {
            HistoriaClinica: newHC,
            estado: 'Activo'
          };

          if (paciente.dni != null && String(paciente.dni).trim() !== '') {
            payload.dni = String(paciente.dni).trim();
          }
          if (paciente.tipo_documento != null && String(paciente.tipo_documento).trim() !== '') {
            payload.tipo_documento = String(paciente.tipo_documento).trim();
          }

          await updatePaciente(paciente.id, payload);
          queryClient.invalidateQueries(['pacientes-archivados']);
          queryClient.invalidateQueries(['pacientes']);

          Swal.fire({
            icon: 'success',
            title: 'Paciente Reactivado',
            text: `${paciente.nombre} ha sido reactivado con la HC: ${newHC}`,
            timer: 2200,
            showConfirmButton: false,
            heightAuto: false
          });
        } catch (err) {
          const serverError = err.response?.data?.message ||
            (err.response?.data?.errors ? JSON.stringify(err.response.data.errors) : null) ||
            err.message || 'Error desconocido';

          Swal.fire({
            icon: 'error',
            title: 'No se pudo reactivar',
            text: serverError,
            confirmButtonColor: '#3085d6',
            heightAuto: false
          });
        }
      } else if (result.isConfirmed) {
        // Opción: Buscar HC liberada
        try {
          Swal.fire({
            title: 'Buscando HC liberadas...',
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading(),
            heightAuto: false
          });

          const all = await getAllPacientes();
          const available = (Array.isArray(all.data) ? all.data : all).filter((p) => {
            const nombre = String(p.nombre || '').trim().toUpperCase();
            const apellido = String(p.apellido || '').trim().toUpperCase();
            return (
              String(p.HistoriaClinica || '').trim() &&
              ((nombre === 'HC' && apellido === 'LIBERADA') ||
                (!nombre && !apellido))
            );
          }).sort((a, b) => {
            const aNum = Number(String(a.HistoriaClinica || '').replace(/\D/g, '')) || 0;
            const bNum = Number(String(b.HistoriaClinica || '').replace(/\D/g, '')) || 0;
            if (aNum !== bNum) return aNum - bNum;
            return String(a.HistoriaClinica || '').localeCompare(String(b.HistoriaClinica || ''));
          });

          if (available.length === 0) {
            Swal.fire({
              icon: 'warning',
              title: 'No hay HC liberadas',
              text: 'No se encontraron HC liberadas. Usa la opción de HC nueva en su lugar.',
              confirmButtonColor: '#3085d6',
              heightAuto: false
            });
            return;
          }

          const hcOptions = available.map((p) => ({
            value: p.HistoriaClinica,
            label: `${p.HistoriaClinica} (ID: ${p.id})`
          }));

          const { value: selectedHC } = await Swal.fire({
            title: 'Selecciona una HC Liberada',
            input: 'select',
            inputOptions: Object.assign({}, ...hcOptions.map(opt => ({ [opt.value]: opt.label }))),
            inputPlaceholder: 'Elige una HC...',
            showCancelButton: true,
            confirmButtonText: 'Asignar',
            cancelButtonText: 'Cancelar',
            inputValidator: (value) => {
              if (!value) return 'Debes seleccionar una HC';
            },
            heightAuto: false
          });

          if (selectedHC) {
            Swal.fire({
              title: 'Reactivando...',
              allowOutsideClick: false,
              didOpen: () => Swal.showLoading(),
              heightAuto: false
            });

            const candidateToDelete = available.find((p) => p.HistoriaClinica === selectedHC);
            if (candidateToDelete) {
              await deletePaciente(candidateToDelete.id);
            }

            const payload = {
              HistoriaClinica: selectedHC,
              estado: 'Activo'
            };

            if (paciente.dni != null && String(paciente.dni).trim() !== '') {
              payload.dni = String(paciente.dni).trim();
            }
            if (paciente.tipo_documento != null && String(paciente.tipo_documento).trim() !== '') {
              payload.tipo_documento = String(paciente.tipo_documento).trim();
            }

            await updatePaciente(paciente.id, payload);
            queryClient.invalidateQueries(['pacientes-archivados']);
            queryClient.invalidateQueries(['pacientes']);

            Swal.fire({
              icon: 'success',
              title: 'Paciente Reactivado',
              text: `${paciente.nombre} ha sido reactivado con la HC liberada: ${selectedHC}`,
              timer: 2200,
              showConfirmButton: false,
              heightAuto: false
            });
          }
        } catch (err) {
          const serverError = err.response?.data?.message ||
            (err.response?.data?.errors ? JSON.stringify(err.response.data.errors) : null) ||
            err.message || 'Error desconocido';

          Swal.fire({
            icon: 'error',
            title: 'Error en la búsqueda',
            text: serverError,
            confirmButtonColor: '#3085d6',
            heightAuto: false
          });
        }
      }
    });
  };

  const rawItems = Array.isArray(data?.data) ? data.data : [];
  const items = rawItems.filter(p => p.estado === 'Archivado');
  const totalPages = data?.last_page || 1;

  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 2 }}>
          <PersonOffIcon sx={{ fontSize: 40 }} />
          Pacientes Archivados
        </Typography>
      </Box>

      <Box sx={{ mb: 3, p: 2, bgcolor: '#f8f9fa', borderRadius: 2, border: '1px solid #e9ecef' }}>
        <Grid container spacing={2} sx={{ alignItems: 'center' }}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              size="small"
              placeholder="Buscar por nombre o DNI en el archivo..."
              value={filterText}
              onChange={(e) => {
                setFilterText(e.target.value);
                setPage(1);
              }}
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
          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="text.secondary">
              Estos pacientes fueron removidos para liberar sus números de HC originales.
            </Typography>
          </Grid>
        </Grid>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>Error al cargar archivo</Alert>}

      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Paciente</TableCell>
              <TableCell>DNI</TableCell>
              <TableCell>HC Histórica</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? [...Array(3)].map((_, i) => <TableRow key={i}><TableCell colSpan={5}><Skeleton /></TableCell></TableRow>) : 
             items.length === 0 ? <TableRow><TableCell colSpan={5} align="center">No hay pacientes archivados.</TableCell></TableRow> :
             items.map((p) => (
               <TableRow key={p.id} hover>
                 <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Avatar sx={{ width: 32, height: 32 }}>{p.nombre?.[0]}</Avatar>
                        <Typography variant="body2">{p.nombre} {p.apellido}</Typography>
                    </Box>
                 </TableCell>
                 <TableCell>{p.dni}</TableCell>
                 <TableCell>
                    <Chip label={p.HistoriaClinica} size="small" variant="outlined" icon={<HistoryIcon />} />
                 </TableCell>
                 <TableCell>
                    <Chip label="Archivado" size="small" color="default" />
                 </TableCell>
                 <TableCell align="right">
                    <Tooltip title="Reactivar con Nueva HC">
                      <Button 
                        size="small" 
                        variant="contained" 
                        color="success" 
                        startIcon={<RestoreIcon />}
                        onClick={() => handleReactivate(p)}
                        sx={{ textTransform: 'none' }}
                      >
                        Reactivar
                      </Button>
                    </Tooltip>
                 </TableCell>
               </TableRow>
             ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
        <Pagination count={totalPages} page={page} onChange={(_, v) => setPage(v)} color="primary" />
      </Box>
    </Paper>
  );
}
