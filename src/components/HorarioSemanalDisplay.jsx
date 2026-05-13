import React, { useState } from 'react';
import { Box, Chip, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions, List, ListItem, Divider } from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';

const diasMap = {
  lunes: 'Lunes',
  martes: 'Martes',
  miercoles: 'Miércoles',
  jueves: 'Jueves',
  viernes: 'Viernes',
  sabado: 'Sábado',
  domingo: 'Domingo'
};

const formatHora = (val) => {
  if (!val) return '-';
  // Si ya viene formateado como HH:mm (por strings del backend) o es una cadena con ":" 
  if (typeof val === 'string' && val.includes(':')) {
    // Si la cadena es muy larga o tiene carácteres extraños, limpiarla
    const normalized = val.trim();
    return normalized.length > 5 ? normalized.substring(0, 5) : normalized;
  }
  // Si parece ser un número (manejo de decimales ej: 7.5 -> 07:30)
  const num = parseFloat(val);
  if (!isNaN(num) && isFinite(val) && String(val).trim() !== "") {
    const hours = Math.floor(num);
    const minutes = Math.round((num - hours) * 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }
  return val;
};

export default function HorarioSemanalDisplay({ horario }) {
  const [open, setOpen] = useState(false);

  // Intentar parsear si el horario viene como string JSON
  let parsed = horario;
  if (typeof horario === 'string') {
    const trimmed = horario.trim();
    if (trimmed.startsWith('{')) {
      try {
        parsed = JSON.parse(trimmed);
      } catch (e) {
        console.error("Error parsing horario string:", e);
        parsed = {};
      }
    } else if (trimmed === "" || trimmed === "[]" || trimmed === "null") {
      parsed = {};
    } else {
      // Intento de fallback: Si no es JSON pero tiene contenido, 
      // podría ser el formato antiguo plano que queremos soportar.
      parsed = {}; 
    }
  }

  // Si no es un objeto, lo tratamos como vacío
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    parsed = {};
  }

  // Obtenemos los días que tienen algún tipo de dato real (ignora objetos vacíos {})
  const daysWithShifts = Object.keys(diasMap).filter(d => {
    // Si el día no está en nuestro mapa oficial, lo ignoramos
    if (!diasMap[d]) return false;
    
    const dayData = parsed[d];
    if (!dayData) return false;

    // Si es un string directo: "08:00-14:00"
    if (typeof dayData === 'string') {
      const val = dayData.trim();
      return val !== '' && val !== '00:00-00:00';
    }
    // Si es un objeto de turnos: { "Mañana": "04:28-10:30" }
    if (typeof dayData === 'object') {
      return Object.values(dayData).some(v => v !== null && v !== undefined && v !== '' && v !== '00:00-00:00');
    }
    return false;
  });

  // El botón será habilitado siempre que haya datos que mostrar
  const hasData = daysWithShifts.length > 0;

  return (
    <>
      <Button 
        size="small" 
        variant="outlined" 
        startIcon={<CalendarMonthIcon />}
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        disabled={!hasData}
        color={hasData ? "primary" : "inherit"}
        sx={{ 
          textTransform: 'none', 
          borderRadius: 2,
        }}
      >
        {hasData ? "Ver horario" : "Sin horario"}
      </Button>

      {hasData && (
        <Dialog 
          open={open} 
          onClose={(e) => {
            if (e) e.stopPropagation();
            setOpen(false);
          }} 
          maxWidth="xs" 
          fullWidth
          onClick={(e) => e.stopPropagation()}
        >
          <DialogTitle sx={{ color: '#01579b', fontWeight: 'bold' }}>Horario Semanal asignado</DialogTitle>
          <DialogContent dividers>
            <List disablePadding>
              {daysWithShifts.map((d, index) => {
                const turnos = parsed[d];
                return (
                  <React.Fragment key={d}>
                    <ListItem disablePadding sx={{ py: 1.5, flexDirection: 'column', alignItems: 'flex-start' }}>
                      <Typography variant="subtitle2" sx={{ textTransform: 'capitalize', color: 'text.primary', mb: 1, fontWeight: 'bold' }} component="span">
                        {diasMap[d]}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {typeof turnos === 'string' ? (
                          <Chip 
                            size="small" 
                            label={String(turnos).includes('-') ? turnos.split('-').map(h => formatHora(h.trim())).join(' - ') : formatHora(turnos)} 
                            sx={{ backgroundColor: '#e1f5fe', color: '#0277bd', fontWeight: 500, borderRadius: 1 }} 
                          />
                        ) : (
                          Object.entries(turnos)
                            .filter(([_, horas]) => horas && horas !== '00:00-00:00') // Filtrar turnos vacíos dentro del día
                            .map(([turnoName, horas]) => {
                              const horasStr = String(horas);
                              const separable = horasStr.includes('-') ? '-' : (horasStr.includes(' ') ? ' ' : null);
                              let horasFormateadas;
                              if (separable) {
                                horasFormateadas = horasStr.split(separable).map(h => formatHora(h.trim())).join(' - ');
                              } else {
                                horasFormateadas = formatHora(horasStr);
                              }
                              return (
                                <Chip 
                                  key={turnoName} 
                                  size="small" 
                                  label={`${turnoName}: ${horasFormateadas}`} 
                                  sx={{ backgroundColor: '#e1f5fe', color: '#0277bd', fontWeight: 500, borderRadius: 1 }} 
                                />
                              );
                            })
                        )}
                      </Box>
                    </ListItem>
                    {index < daysWithShifts.length - 1 && <Divider />}
                  </React.Fragment>
                );
              })}
            </List>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpen(false)} sx={{ fontWeight: 'bold' }}>Cerrar</Button>
          </DialogActions>
        </Dialog>
      )}
    </>
  );
}
