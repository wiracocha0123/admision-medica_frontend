import React from 'react';
import { Typography, Container } from '@mui/material';

export default function Forbidden() {
  return (
    <Container sx={{ mt: 12, textAlign: 'center' }}>
      <Typography variant="h3" color="error">403</Typography>
      <Typography variant="h6">Acceso denegado</Typography>
      <Typography sx={{ mt: 2 }}>No tienes permisos para ver esta página.</Typography>
    </Container>
  );
}
