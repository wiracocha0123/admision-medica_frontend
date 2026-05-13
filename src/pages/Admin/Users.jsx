import React, { useState, useContext } from 'react';
import { Paper, Typography, Table, TableBody, TableCell, TableHead, TableRow, Button, Box, CircularProgress, TableContainer, Skeleton, Stack, Pagination } from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { getUsers } from '../../services/usersService';
import { AuthContext } from '../../contexts/AuthContext';

export default function Users() {
  const { user } = useContext(AuthContext);
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['users', page],
    queryFn: () => getUsers(page),
    enabled: !!user,
  });

  const paginationData = data?.data || data || {};
  const items = Array.isArray(paginationData.data) ? paginationData.data : (Array.isArray(paginationData) ? paginationData : []);
  const totalPages = paginationData.last_page || 1;

  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h5">Usuarios del Sistema {isFetching && <CircularProgress size={20} sx={{ ml: 2 }} />}</Typography>
        <Button variant="outlined" startIcon={<RefreshIcon />} onClick={() => refetch()} disabled={isFetching}>Refrescar</Button>
      </Box>

      {isError && <Typography color="error" sx={{ mb: 2 }}>{error.message || 'Error al cargar datos'}</Typography>}

      <TableContainer sx={{ minHeight: 400 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Nombre</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Rol</TableCell>
              <TableCell>Registrado</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <TableRow key={i}><TableCell colSpan={5}><Skeleton /></TableCell></TableRow>
              ))
            ) : items.length === 0 ? (
              <TableRow><TableCell colSpan={5} align="center">No hay usuarios registrados.</TableCell></TableRow>
            ) : (
              items.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>{u.id}</TableCell>
                  <TableCell>{u.name}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell sx={{ textTransform: 'capitalize' }}>
                    {u.role || (u.roles && (Array.isArray(u.roles) ? u.roles[0]?.name : u.roles)) || '-'}
                  </TableCell>
                  <TableCell>{u.created_at ? new Date(u.created_at).toLocaleDateString() : '-'}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
        <Pagination count={totalPages} page={page} onChange={(_, v) => setPage(v)} color="primary" disabled={isFetching} />
      </Box>
    </Paper>
  );
}