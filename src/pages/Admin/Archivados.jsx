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
import { getPacientes, updatePaciente, getNextHC } from '../../services/pacientesService';
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
    try {
      Swal.fire({
        title: 'Reactivar Paciente',
        text: `Se le asignará una nueva Historia Clínica automática a ${paciente.nombre}. ¿Continuar?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sí, reactivar',
        cancelButtonText: 'Cancelar',
        showLoaderOnConfirm: true,
        heightAuto: false,
        preConfirm: async () => {
          const resp = await getNextHC();
          const nextHC = resp.data?.next_hc || resp.next_hc || 'H-1';
          return nextHC;
        }
      }).then((result) => {
        if (result.isConfirmed) {
          const newHC = result.value;
          const payload = {
            ...paciente,
            HistoriaClinica: newHC,
            estado: 'Activo'
          };
          updateMutation.mutate(payload);
        }
      });
    } catch (err) {
      Swal.fire('Error', 'No se pudo obtener una nueva HC', 'error');
    }
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
