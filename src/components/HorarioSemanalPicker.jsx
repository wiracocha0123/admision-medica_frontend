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
  // Aseguramos que siempre haya un objeto base
  const safeValue = value || {};

  const handleTurnoChange = (dia, turno, isChecked) => {
    if (disabled) return;
    const newValue = { ...safeValue };
    if (!newValue[dia]) newValue[dia] = {};

    if (isChecked) {
      // Default times for convenience, or just empty
      newValue[dia][turno] = "00:00-00:00"; 
    } else {
      delete newValue[dia][turno];
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
