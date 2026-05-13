import React from 'react';
import { Box, Typography, TextField, Checkbox, FormControlLabel, Grid, Paper } from '@mui/material';

const DIAS = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
const TURNOS = ['Mañana', 'Tarde', 'Noche'];

/**
 * value: {
 *   "lunes": { "Mañana": "08:00-11:00", "Tarde": "14:00-18:00" },
 *   "martes": {}
 * }
 */
export default function HorarioSemanalPicker({ value, onChange, disabled = false }) {
  // Normalizar el valor de entrada: si es un array [ { lunes: {...} } ], extraer el objeto.
  // También manejamos si viene como string.
  let normalizedValue = value;
  if (typeof value === 'string') {
    try {
      normalizedValue = JSON.parse(value);
    } catch (e) {
      normalizedValue = {};
    }
  }
  if (Array.isArray(normalizedValue)) {
    normalizedValue = normalizedValue[0] || {};
  }
  
  // Aseguramos que siempre sea un objeto y que las propiedades de día sean objetos, no strings.
  const safeValue = { ...normalizedValue };
  DIAS.forEach(dia => {
    if (safeValue[dia] && typeof safeValue[dia] !== 'object') {
       // Si era un string antiguo como "08:00-14:00", lo movemos a "Mañana" por defecto o limpiamos
       safeValue[dia] = { "Mañana": safeValue[dia] };
    } else if (!safeValue[dia]) {
       safeValue[dia] = {};
    }
  });

  const handleTurnoChange = (dia, turno, isChecked) => {
    if (disabled) return;
    const newValue = { ...safeValue };
    // Aseguramos que el día sea un objeto antes de asignar
    if (!newValue[dia] || typeof newValue[dia] !== 'object') {
      newValue[dia] = {};
    }

    if (isChecked) {
      newValue[dia][turno] = "08:00-14:00"; 
    } else {
      const dayObj = { ...newValue[dia] };
      delete dayObj[turno];
      newValue[dia] = dayObj;
    }
    onChange(newValue);
  };

  const handleTimeChange = (dia, turno, type, timeValue) => {
    if (disabled) return;
    const newValue = { ...safeValue };
    if (!newValue[dia]) newValue[dia] = {};
    
    let currentStr = newValue[dia][turno] || "00:00-00:00";
    let [start, end] = currentStr.split('-');
    if (!start) start = "00:00";
    if (!end) end = "00:00";

    if (type === 'start') start = timeValue;
    if (type === 'end') end = timeValue;

    newValue[dia][turno] = `${start}-${end}`;
    onChange(newValue);
  };

  const hasTurno = (dia, turno) => {
    return safeValue[dia] && Object.prototype.hasOwnProperty.call(safeValue[dia], turno);
  };

  const getTimes = (dia, turno) => {
    if (!hasTurno(dia, turno)) return { start: '', end: '' };
    const [start, end] = (safeValue[dia][turno] || "").split('-');
    return { start: start || '', end: end || '' };
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>Horario Semanal por Turnos</Typography>
      {DIAS.map((dia) => (
        <Paper key={dia} variant="outlined" sx={{ p: 1.5, mb: 1.5, borderRadius: 2 }}>
          <Typography sx={{ textTransform: 'capitalize', fontWeight: 600, mb: 1, color: 'primary.main' }}>
            {dia}
          </Typography>
          <Grid container spacing={2}>
            {TURNOS.map((turno) => {
              const checked = hasTurno(dia, turno);
              const times = getTimes(dia, turno);
              
              return (
                <Grid size={{ xs: 12, md: 4 }} key={turno}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, p: 1, border: '1px dashed #e0e0e0', borderRadius: 1, bgcolor: checked ? 'rgba(2, 136, 209, 0.03)' : 'transparent' }}>
                    <FormControlLabel
                      control={
                        <Checkbox 
                          size="small" 
                          checked={checked} 
                          disabled={disabled}
                          onChange={(e) => handleTurnoChange(dia, turno, e.target.checked)} 
                        />
                      }
                      label={<Typography variant="body2">{turno}</Typography>}
                    />
                    {checked && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, pl: 3 }}>
                        <TextField 
                          type="time" 
                          size="small" 
                          variant="standard"
                          disabled={disabled}
                          value={times.start}
                          onChange={(e) => handleTimeChange(dia, turno, 'start', e.target.value)}
                          slotProps={{ htmlInput: { style: { fontSize: '0.85rem' } } }}
                        />
                        <Typography variant="caption" color="text.secondary">a</Typography>
                        <TextField 
                          type="time" 
                          size="small" 
                          variant="standard"
                          disabled={disabled}
                          value={times.end}
                          onChange={(e) => handleTimeChange(dia, turno, 'end', e.target.value)}
                          slotProps={{ htmlInput: { style: { fontSize: '0.85rem' } } }}
                        />
                      </Box>
                    )}
                  </Box>
                </Grid>
              );
            })}
          </Grid>
        </Paper>
      ))}
    </Box>
  );
}
