import React, { useState, useContext } from 'react';
import { Paper, Typography, Table, TableBody, TableCell, TableHead, TableRow, Button, Box, Avatar, CircularProgress, TableContainer, Skeleton, Stack, Pagination, TextField, InputAdornment } from '@mui/material';
import { Refresh as RefreshIcon, Search as SearchIcon } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { getUsers } from '../../services/usersService';
import { AuthContext } from '../../contexts/AuthContext';

export default function Users() {
  const { user } = useContext(AuthContext);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['users', page],
    queryFn: () => getUsers(page),
    enabled: !!user,
  });

  // Con los cambios en el backend, la estructura es directa de Laravel Pagination
  const rawItems = Array.isArray(data?.data) ? data.data : [];
  const totalPages = data?.last_page || 1;

  // Aplicar filtrado local para búsqueda inmediata
  const items = rawItems.filter(u => {
    const text = searchTerm.toLowerCase();
    return (
      (u.name || '').toLowerCase().includes(text) ||
      (u.email || '').toLowerCase().includes(text) ||
      (u.role || '').toLowerCase().includes(text)
    );
  });

  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h5">Usuarios del Sistema {isFetching && <CircularProgress size={20} sx={{ ml: 2 }} />}</Typography>
        <Button variant="outlined" startIcon={<RefreshIcon />} onClick={() => refetch()} disabled={isFetching}>Refrescar</Button>
      </Box>

      {isError && <Typography color="error" sx={{ mb: 2 }}>{error.message || 'Error al cargar datos'}</Typography>}

      {/* Sección de Filtros */}
      <Box sx={{ mb: 3, p: 2, bgcolor: '#f8f9fa', borderRadius: 2, border: '1px solid #e9ecef', display: 'flex', gap: 2, alignItems: 'center' }}>
        <TextField
          size="small"
          placeholder="Buscar por nombre, email o rol..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setPage(1);
          }}
          sx={{ width: 400, bgcolor: 'white' }}
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

      <TableContainer sx={{ minHeight: 400 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Nombres y apellidos</TableCell>
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
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Avatar sx={{ width: 28, height: 28, fontSize: "0.75rem", bgcolor: "primary.main" }}>
                                      {u.name?.[0] || "P"}
                          </Avatar>
                          <Typography variant="body2">{u.name}</Typography>
                    </Box>
                  </TableCell>
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