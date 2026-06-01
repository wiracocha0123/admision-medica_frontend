import React, { useMemo, useEffect } from 'react';
import { 
  Table, TableBody, TableCell, TableHead, TableRow, 
  TextField, Typography, Box, Paper, TableContainer
} from '@mui/material';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDate } from 'date-fns';
import { es } from 'date-fns/locale/es';

/**
 * HorarioMensualPicker
 * Props:
 * - value: Array de objetos [{ dia: 1, mañana: 'AD', tarde: 'C' }, ...]
 * - onChange: Función para actualizar el estado superior
 */
export default function HorarioMensualPicker({ value, onChange }) {
  const diasDelMes = useMemo(() => {
    const now = new Date();
    const start = startOfMonth(now);
    const end = endOfMonth(now);
    return eachDayOfInterval({ start, end });
  }, []);

  // Inicializar si el value está vacío o no tiene la longitud correcta
  useEffect(() => {
    if (!Array.isArray(value) || value.length !== diasDelMes.length) {
      const initialHorario = diasDelMes.map((date) => ({
        dia_numero: getDate(date),
        turno_m: '',
        turno_t: '',
        turno_n: ''
      }));
      onChange(initialHorario);
    }
  }, [diasDelMes, value, onChange]);

  const handleInputChange = (index, field, newValue) => {
    const updatedHorario = [...value];
    if (!updatedHorario[index]) {
        updatedHorario[index] = { 
          dia_numero: index + 1, 
          turno_m: '', 
          turno_t: '', 
          turno_n: '' 
        };
    }
    
    // Mapear el nombre del campo interno al que espera el backend
    let backendField = field;
    if (field === 'manana') backendField = 'turno_m';
    if (field === 'tarde') backendField = 'turno_t';
    if (field === 'noche') backendField = 'turno_n';

    updatedHorario[index] = {
      ...updatedHorario[index],
      [backendField]: newValue.toUpperCase()
    };
    onChange(updatedHorario);
  };

  const getFieldValue = (index, field) => {
    if (Array.isArray(value) && value[index]) {
      // Intentar ambos nombres por compatibilidad
      if (field === 'manana') return value[index].turno_m || value[index].manana || '';
      if (field === 'tarde') return value[index].turno_t || value[index].tarde || '';
      if (field === 'noche') return value[index].turno_n || value[index].noche || '';
      return value[index][field] || '';
    }
    return '';
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold' }}>
        Programación Mensual - {format(new Date(), 'MMMM yyyy', { locale: es })}
      </Typography>
      
      <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 400, borderRadius: 2 }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', bgcolor: 'primary.main', color: 'white' }}>Día</TableCell>
              <TableCell sx={{ fontWeight: 'bold', bgcolor: 'primary.main', color: 'white' }}>Turno Mañana</TableCell>
              <TableCell sx={{ fontWeight: 'bold', bgcolor: 'primary.main', color: 'white' }}>Turno Tarde</TableCell>
              <TableCell sx={{ fontWeight: 'bold', bgcolor: 'primary.main', color: 'white' }}>Turno Noche</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {diasDelMes.map((date, index) => (
              <TableRow key={index} hover>
                <TableCell sx={{ minWidth: 120 }}>
                  <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                    {format(date, 'eeee dd', { locale: es })}
                  </Typography>
                </TableCell>
                <TableCell>
                  <TextField
                    size="small"
                    placeholder="Ej: AD, C, V"
                    value={getFieldValue(index, 'manana')}
                    onChange={(e) => handleInputChange(index, 'manana', e.target.value)}
                    fullWidth
                    slotProps={{
                      htmlInput: { 
                        style: { textTransform: 'uppercase', textAlign: 'center' } 
                      }
                    }}
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    size="small"
                    placeholder="Ej: AD, C, V"
                    value={getFieldValue(index, 'tarde')}
                    onChange={(e) => handleInputChange(index, 'tarde', e.target.value)}
                    fullWidth
                    slotProps={{
                      htmlInput: { 
                        style: { textTransform: 'uppercase', textAlign: 'center' } 
                      }
                    }}
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    size="small"
                    placeholder="Ej: N"
                    value={getFieldValue(index, 'noche')}
                    onChange={(e) => handleInputChange(index, 'noche', e.target.value)}
                    fullWidth
                    slotProps={{
                      htmlInput: { 
                        style: { textTransform: 'uppercase', textAlign: 'center' } 
                      }
                    }}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
        * Ingrese los códigos de actividad para cada turno (AD: Administrativo, C: Consulta, V: Vacaciones, etc.)
      </Typography>
    </Box>
  );
}