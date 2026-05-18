import React, { useState, useContext } from 'react';
import { Paper, Typography, Table, TableBody, TableCell, TableHead, TableRow, Button, Box, CircularProgress, Alert, TableContainer, Skeleton, Chip, Pagination, Stack, AlertTitle } from '@mui/material';
import { Refresh as RefreshIcon, Category as CategoryIcon } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { getEspecialidades } from '../../services/especialidadesService';
import { AuthContext } from '../../contexts/AuthContext';

export default function Especialidades() {
  const { user } = useContext(AuthContext);
  const [page, setPage] = useState(1);

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['especialidades', page],
    queryFn: () => getEspecialidades(page),
    enabled: !!user,
  });

  // Normalización técnica para objetos que PHP envía accidentalmente como asociativos (Incomplete Class)
  const getCleanItems = (raw) => {
    const d = raw?.data || raw || {};
    const items = d.data || d;
    if (Array.isArray(items)) return items;
    if (typeof items === 'object' && items !== null) return Object.values(items);
    return [];
  };

  const items = getCleanItems(data);
  const paginationData = data?.data || data || {};
  const totalPages = paginationData.last_page || 1;
  
  // Detección de error de serialización PHP
  const hasSerializationError = JSON.stringify(data || {}).includes('__PHP_Incomplete_Class_Name');

  return (
    <Paper sx={{ p: 3 }}>
      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 3 }}  sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CategoryIcon /> Especialidades {isFetching && <CircularProgress size={20} />}
        </Typography>
        <Button variant="outlined" startIcon={<RefreshIcon />} onClick={() => refetch()} disabled={isFetching}>Actualizar</Button>
      </Stack>

      {hasSerializationError && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          <AlertTitle>Error de Serialización Detectado</AlertTitle>
          El Backend está enviando objetos con <code>__PHP_Incomplete_Class_Name</code>. 
          Se recomienda al desarrollador Backend usar <code>{"->"}values()</code> en la colección antes de <code>json()</code>.
        </Alert>
      )}

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error.message || 'Error al cargar especialidades'}</Alert>}

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>UPS</TableCell>
              <TableCell>Especialidad</TableCell>
              
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              [...Array(5)].map((_, i) => <TableRow key={i}><TableCell colSpan={4}><Skeleton /></TableCell></TableRow>)
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center">No hay especialidades registradas.</TableCell>
              </TableRow>
            ) : (
              items.map((esp) => (
                <TableRow key={esp.id}>
                  <TableCell>{esp.id}</TableCell>
                  <TableCell fontWeight="bold">{esp.UPS}</TableCell>
                  <TableCell>{esp.especialidad}</TableCell>
                  
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
        <Pagination count={totalPages} page={page} onChange={(_, v) => setPage(v)} color="primary" />
      </Box>
    </Paper>
  );
}
