import React, { useState, useContext } from 'react';
import { 
  Paper, Typography, Table, TableBody, TableCell, TableHead, TableRow, 
  Button, Box, Avatar, Alert, TableContainer, Skeleton, Chip, Pagination, 
  IconButton, Stack, Tooltip, Dialog, DialogTitle, DialogContent, 
  DialogContentText, DialogActions, List, ListItem, ListItemText, Divider,
  TextField, MenuItem, Grid, Autocomplete, InputAdornment
} from '@mui/material';
import { 
  Edit as EditIcon, Delete as DeleteIcon, Visibility as ViewIcon, 
  Add as AddIcon, Refresh as RefreshIcon, Search as SearchIcon,
  FilterList as FilterIcon, CalendarToday as CalendarTodayIcon,
  FileUpload as ImportIcon, CheckCircle as CheckIcon, Warning as WarningIcon, Close as CloseIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPersonalSalud, getAllPersonalSalud, deletePersonalSalud, updatePersonalSalud, createPersonalSalud } from '../../services/personalService';
import { getEspecialidades, getAllEspecialidades, createEspecialidad, updateEspecialidad } from '../../services/especialidadesService';
import { AuthContext } from '../../contexts/AuthContext';
import HorarioSemanalDisplay from '../../components/HorarioSemanalDisplay';
import HorarioSemanalPicker from '../../components/HorarioSemanalPicker';
import HorarioMensualPicker from '../../components/HorarioMensualPicker';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';

export default function Personal() {
  const { user } = useContext(AuthContext);
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  // Estados para filtros
  const [filterText, setFilterText] = useState('');
  const [filterEspecialidad, setFilterEspecialidad] = useState('all');

  // Estados para modales
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // Estados para Edición/Creación
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // --- NUEVOS ESTADOS PARA IMPORTACIÓN ---
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importResults, setImportResults] = useState([]); // { name, staff, conflict, decision }
  const [isProcessingImport, setIsProcessingImport] = useState(false);

  const [formData, setFormData] = useState({
    nombres: '',
    apellidos: '',
    dni: '',
    telefono: '',
    email: '',
    cargo: '',
    especialidad_id: '',
    horario_semanal: {},
    horario_mensual: []
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['personal_all'],
    queryFn: () => getAllPersonalSalud(),
    enabled: !!user,
  });

  const { data: especialidadesData } = useQuery({
    queryKey: ['especialidades_all'],
    queryFn: () => getAllEspecialidades().then(res => {
      const resp = res?.data || res;
      // Normalizar respuesta para obtener el array de especialidades
      const dataArray = Array.isArray(resp.data) ? resp.data : (Array.isArray(resp) ? resp : []);
      return dataArray;
    }),
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
    enabled: !!user,
  });
  const especialidades = Array.isArray(especialidadesData) ? especialidadesData : [];

  const deleteMutation = useMutation({
    mutationFn: (id) => deletePersonalSalud(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['personal_all']);
      Swal.fire({
        icon: 'success',
        title: '¡Eliminado!',
        text: 'El personal ha sido eliminado correctamente.',
        timer: 1500,
        showConfirmButton: false,
        heightAuto: false
      });
    },
    onError: (err) => {
      let msg = err.response?.data?.message || err.message;
      Swal.fire({
        icon: 'error',
        title: 'Error al eliminar',
        text: msg,
        confirmButtonColor: '#3085d6',
        heightAuto: false
      });
    }
  });

  const saveMutation = useMutation({
    mutationFn: (payload) => {
      if (payload.id) {
        return updatePersonalSalud(payload.id, payload);
      }
      return createPersonalSalud(payload);
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['personal_all']);
      setEditDialogOpen(false);
      
      console.log("Respuesta del servidor al guardar:", data);

      Swal.fire({
        icon: 'success',
        title: variables.id ? '¡Actualizado!' : '¡Registrado!',
        text: `Personal ${variables.id ? 'actualizado' : 'registrado'} correctamente.`,
        timer: 2000,
        showConfirmButton: false,
        heightAuto: false
      });
    },
    onError: (err) => {
      console.error("Error completo al guardar:", err);
      let msg = err.response?.data?.message || err.message;
      let detailedError = "";
      
      if (err.response?.data?.errors) {
        detailedError = Object.values(err.response.data.errors).flat().join('\n');
      }

      if (msg.includes('dni has already been taken')) {
        msg = 'Ya existe personal registrado con este DNI.';
      } else if (msg.includes('email has already been taken')) {
        msg = 'Este correo electrónico ya está en uso.';
      }

      Swal.fire({
        icon: 'error',
        title: 'Error al guardar',
        text: msg,
        footer: detailedError ? `<pre style="font-size: 10px; text-align: left;">${detailedError}</pre>` : null,
        confirmButtonColor: '#3085d6',
        heightAuto: false
      });
    }
  });

  const handleOpenView = (item) => {
    // Normalizar el horario mensual antes de mostrarlo en el modal de detalles
    let normalizedMensual = item.horario_mensual;
    if (typeof normalizedMensual === 'string') {
      try { normalizedMensual = JSON.parse(normalizedMensual); } catch (e) { normalizedMensual = []; }
    }
    
    // Si viene en el formato [{lunes:..., martes:...}], es un error de guardado previo o formato semanal
    // Intentamos detectar si es el formato de 31 días (array largo)
    let finalMensual = [];
    if (Array.isArray(normalizedMensual)) {
      if (normalizedMensual.length === 1 && normalizedMensual[0].lunes) {
        // Es formato semanal guardado en mensual, no lo mostramos como mensual
        finalMensual = [];
      } else {
        finalMensual = normalizedMensual;
      }
    }

    // Asegurar que use los nombres de campos del backend para la vista también
    const mappedMensual = finalMensual.map(d => ({
      dia_numero: d.dia_numero || d.dia,
      turno_m: d.turno_m || d.manana,
      turno_t: d.turno_t || d.tarde,
      turno_n: d.turno_n || d.noche
    }));

    setSelectedItem({
      ...item,
      horario_mensual: mappedMensual
    });
    setViewDialogOpen(true);
  };

  const handleOpenEdit = (item = null) => {
    if (item) {
      console.log("Editando item:", item);
      // Normalizar el horario desde el item
      let normalizedHorario = item.horario_semanal;
      if (typeof normalizedHorario === 'string' && normalizedHorario) {
        try { normalizedHorario = JSON.parse(normalizedHorario); } catch (e) { normalizedHorario = {}; }
      }
      if (Array.isArray(normalizedHorario)) {
        normalizedHorario = normalizedHorario[0] || {};
      }

      // 2. Normalizar horario MENSUAL (Crucial para el componente HorarioMensualPicker)
      let normalizedMensual = item.horario_mensual;
      
      // Si el backend lo devuelve como String, lo parseamos
      if (typeof normalizedMensual === 'string' && normalizedMensual) {
        try { 
          normalizedMensual = JSON.parse(normalizedMensual); 
        } catch (e) { 
          console.error("Error parseando horario mensual string:", e);
          normalizedMensual = []; 
        }
      }

      // Asegurar que sea un array
      if (!Array.isArray(normalizedMensual)) {
        normalizedMensual = [];
      }
      
      const cleanMensual = normalizedMensual.map((d, idx) => {
        // Obtenemos los valores intentando todos los nombres posibles (importante tras cambios de importación)
        const diaNum = parseInt(d.dia_numero || d.dia || (idx + 1));
        const m = d.turno_m || d.manana || '';
        const t = d.turno_t || d.tarde || '';
        const n = d.turno_n || d.noche || '';
        
        return {
          dia_numero: diaNum,
          turno_m: m,
          turno_t: t,
          turno_n: n
        };
      });

      console.log("Horario mensual normalizado para Edit:", cleanMensual);

      setFormData({
        id: item.id,
        nombres: item.nombres || '',
        apellidos: item.apellidos || '',
        dni: item.dni || '',
        telefono: item.telefono || '',
        email: item.email || '',
        cargo: item.cargo || '',
        especialidad_id: item.especialidad_id || '',
        horario_semanal: normalizedHorario || {},
        horario_mensual: cleanMensual
      });
    } else {
      setFormData({
        nombres: '',
        apellidos: '',
        dni: '',
        telefono: '',
        email: '',
        cargo: '',
        especialidad_id: '',
        horario_semanal: {},
        horario_mensual: []
      });
    }
    setEditDialogOpen(true);
  };

  const handleSave = (e) => {
    e.preventDefault();

    // Validaciones manuales
    if (!formData.nombres.trim() || !formData.apellidos.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Campos requeridos',
        text: 'Los nombres y apellidos son obligatorios.',
        confirmButtonColor: '#3085d6',
        heightAuto: false
      });
      return;
    }

    if (formData.dni){
      if (!formData.dni || String(formData.dni).length !== 8) {
      Swal.fire({
        icon: 'warning',
        title: 'DNI inválido',
        text: 'El DNI debe tener exactamente 8 dígitos.',
        confirmButtonColor: '#3085d6',
        heightAuto: false
      });
      return;
    }
    }

    if (!formData.especialidad_id) {
      Swal.fire({
        icon: 'warning',
        title: 'Campo requerido',
        text: 'Debe seleccionar una especialidad (UPS).',
        confirmButtonColor: '#3085d6',
        heightAuto: false
      });
      return;
    }
    
    // Enviamos el payload. 
    // Si el backend no persiste, VERIFICAR:
    // 1. Que 'horario_mensual' esté en el $fillable del modelo PersonalSalud.php
    // 2. Que el campo en la DB sea tipo TEXT o JSON (no VARCHAR 255)
    const payload = {
      ...formData,
      // Si el horario semanal está vacío ({}), enviamos [] o lo que el backend espere
      horario_semanal: (formData.horario_semanal && Object.keys(formData.horario_semanal).length > 0)
        ? [formData.horario_semanal]
        : [],
      horario_mensual: formData.horario_mensual || []
    };

    console.log("Payload Final Enviado:", payload);
    saveMutation.mutate(payload);
  };

  const handleOpenDeleteConfirm = (id) => {
    Swal.fire({
      title: '¿Estás seguro?',
      text: "Esta acción eliminará al profesional y sus horarios asociados.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      heightAuto: false
    }).then((result) => {
      if (result.isConfirmed) {
        deleteMutation.mutate(id);
      }
    });
  };

  // Con los cambios en el backend, podemos recibir tanto un array completo como paginación
  const items = Array.isArray(data)
    ? data
    : (Array.isArray(data?.data) ? data.data : []);
  
  // Aplicar filtros localmente para una respuesta inmediata
  const filteredItems = items.filter(p => {
    const matchesText = 
      (p.nombres + ' ' + p.apellidos).toLowerCase().includes(filterText.toLowerCase()) ||
      p.dni?.includes(filterText);
    
    const matchesEspecialidad = 
      filterEspecialidad === 'all' || 
      String(p.especialidad_id) === String(filterEspecialidad);
      
    return matchesText && matchesEspecialidad;
  });

  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const pagedItems = filteredItems.slice((page - 1) * pageSize, page * pageSize);

  const handleProcessExcel = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws, { header: 1 });

      const entities = [];
      let currentSpecialty = null;
      let headerRowIndex = -1;

      const normalizeText = (value) => String(value || '').trim().toUpperCase();
      const isBlankRow = (row) => !row || row.every(cell => normalizeText(cell) === '');
      const rowText = (row) => normalizeText((row || []).join(' '));

      const ignorePatterns = [
        'PROGRAMACION',
        'PROGRAMACIÓN',
        'TURNOS',
        'MES',
        'SAN VICENTE',
        'C.S.'
      ];

      const shouldIgnoreRow = (row) => {
        const text = rowText(row);
        return ignorePatterns.some(pattern => text.includes(pattern));
      };

      const isHeaderRow = (row) => {
        if (!row || row.length === 0) return false;
        const text = rowText(row);
        // Aceptar variantes comunes de 'N°' y 'NOMBRE Y APELLIDO'
        const nroTokens = ['N°', 'Nº', 'NRO', 'NO', 'N', 'NÚMERO', 'NUM'];
        const hasNro = nroTokens.some(t => text.includes(t));
        const hasName = text.includes('NOMBRE') || text.includes('NOMBRE Y APELLIDO') || text.includes('NOMBRES') || text.includes('APELLIDO');
        const hasCargo = text.includes('CARGO') || text.includes('PUESTO');
        return hasNro && hasName && hasCargo;
      };

      const isSpecialtyRow = (row) => {
        if (!row || row.length === 0) return false;
        const text = rowText(row);
        if (shouldIgnoreRow(row) || isHeaderRow(row)) return false;
        
        // Verificar que la primera columna NO sea un número (las áreas no tienen número de orden)
        const firstCell = normalizeText(row[0] || '');
        const hasOrderNumber = /^\d+[.)]*$/.test(firstCell.trim());
        
        if (hasOrderNumber) return false; // Si tiene número de orden, es un personal, no un área
        
        // Detectar todas las variantes de áreas: servicios, módulos, departamentos, áreas, unidades, oficinas, etc.
        return text.includes('SERVICIO DE') 
          || text.includes('AREA DE') 
          || text.includes('DPTO') 
          || text.includes('DEPARTAMENTO')
          || text.includes('MODULO DE')
          || text.includes('UNIDAD DE')
          || text.includes('UNIDAD')
          || text.includes('LABORATORIO')
          || text.includes('OFICINA DE')
          || text.includes('OFICINA');
      };

      const isShiftRow = (row) => {
        if (!row || row.length === 0) return false;
        const first = normalizeText(row[0]);
        const shiftTokens = ['M', 'T', 'N', 'MAÑANA', 'MANANA', 'TARDE', 'NOCHE'];
        if (shiftTokens.includes(first)) return true;

        const text = rowText(row);
        return shiftTokens.some(token => text === token || text.startsWith(token + ' '));
      };

      const parsePersonName = (row) => {
        const name = normalizeText(row[1] || row[2] || '');
        if (name && name.split(/\s+/).filter(Boolean).length >= 2) return name;
        return normalizeText(row[2] || row[3] || row[1] || '');
      };

      const findHeaderRowIndex = (rows) => {
        for (let k = 0; k < Math.min(rows.length, 40); k++) {
          const row = rows[k];
          if (!row) continue;
          if (isHeaderRow(row)) return k;
          const normalized = row.map(cell => normalizeText(cell));
          const containsNumbers = normalized.filter(cell => ['1','2','3','4','5','6','7','8','9'].includes(cell));
          if (containsNumbers.length >= 3 && rowText(row).includes('N°')) return k;
        }
        return -1;
      };

      const dayColumns = (headerRow) => {
        if (!headerRow) return [];
        const cols = [];
        for (let idx = 0; idx < headerRow.length; idx++) {
          const raw = String(headerRow[idx] || '').trim();
          // extraer primer número disponible (acepta '1', '1.', 'DIA 1', '01')
          const m = raw.match(/(\d{1,2})/);
          if (m) {
            const n = parseInt(m[1], 10);
            if (n >= 1 && n <= 31) cols.push(idx);
          }
        }
        return cols;
      };

      const findDayIndexesFallback = (rows) => {
        // Busca cualquier fila con >=3 celdas numéricas (p. ej. 1..30) y devuelve sus índices de columna
        for (let k = 0; k < Math.min(rows.length, 60); k++) {
          const row = rows[k] || [];
          const cols = [];
          for (let idx = 0; idx < row.length; idx++) {
            const raw = String(row[idx] || '').trim();
            const m = raw.match(/(\d{1,2})/);
            if (m) {
              const n = parseInt(m[1], 10);
              if (n >= 1 && n <= 31) cols.push(idx);
            }
          }
          if (cols.length >= 3) {
            console.warn('[IMPORT DEBUG] findDayIndexesFallback used at row', k, 'cols=', cols);
            return cols;
          }
        }
        return [];
      };

      const findCargoColumnIndex = (headerRow) => {
        if (!headerRow) return -1;
        for (let idx = 0; idx < headerRow.length; idx++) {
          const raw = normalizeText(headerRow[idx] || '');
          if (raw.includes('CARGO') || raw.includes('PUESTO')) return idx;
        }
        return -1;
      };

      headerRowIndex = findHeaderRowIndex(data);
      const headerRow = headerRowIndex !== -1 ? data[headerRowIndex] : null;
      let dayIndexes = dayColumns(headerRow);
      if ((!dayIndexes || dayIndexes.length === 0) && data && data.length > 0) {
        // fallback tolerante si no se detectó la fila de cabecera
        const fb = findDayIndexesFallback(data);
        if (fb && fb.length > 0) {
          dayIndexes = fb;
          console.log('[IMPORT DEBUG] fallback dayIndexes applied =', dayIndexes);
        }
      }
      const cargoColumnIndex = findCargoColumnIndex(headerRow);
      const startIndex = headerRowIndex !== -1 ? headerRowIndex + 1 : 0;

      // DEBUG: información para diagnosticar detección de columnas de día
      console.log('[IMPORT DEBUG] headerRowIndex =', headerRowIndex);
      console.log('[IMPORT DEBUG] headerRow (raw) =', headerRow);
      console.log('[IMPORT DEBUG] dayIndexes =', dayIndexes);
      console.log('[IMPORT DEBUG] cargoColumnIndex =', cargoColumnIndex);

      for (let i = startIndex; i < data.length; i++) {
        const row = data[i];
        if (isBlankRow(row)) continue;
        if (shouldIgnoreRow(row)) continue;
        if (isHeaderRow(row)) continue;

        if (isSpecialtyRow(row)) {
          // Mantener el nombre completo del área incluyendo prefijos como SERVICIO DE, MODULO DE, etc.
          const name = rowText(row)
            .trim()
            .replace(/\s+/g, ' '); // Solo limpiar espacios múltiples

          currentSpecialty = { name: name || 'SIN ESPECIALIDAD', staff: [] };
          entities.push(currentSpecialty);
          continue;
        }

        const order = parseInt(String(row[0] || '').replace(/[.)]/g, '').trim());
        if (isNaN(order)) continue;
        if (!currentSpecialty) {
          currentSpecialty = { name: 'SIN ESPECIALIDAD', staff: [] };
          entities.push(currentSpecialty);
        }

        const nombres_completos = parsePersonName(row);
        if (!nombres_completos || nombres_completos.length <= 3) continue;

        const rowT = data[i + 1] || [];
        const rowN = data[i + 2] || [];
        const hasT = isShiftRow(rowT);
        const hasN = isShiftRow(rowN);
        const rowM = row;
        const rowTData = hasT ? rowT : [];
        const rowNData = hasT && hasN ? rowN : [];

        const monthlySchedule = dayIndexes.map((colIndex, idx) => ({
          dia_numero: idx + 1,
          turno_m: String(rowM[colIndex] || '').trim() || null,
          turno_t: (hasT ? String(rowTData[colIndex] || '').trim() : '') || null,
          turno_n: (hasN ? String(rowNData[colIndex] || '').trim() : '') || null
        }));

        // DEBUG: si no se detectaron columnas de día o el horario está vacío, registrar muestra
        try {
          if (!dayIndexes || dayIndexes.length === 0) {
            console.warn('[IMPORT DEBUG] No se detectaron columnas de día. headerRowIndex=', headerRowIndex);
          } else {
            const filled = monthlySchedule.filter(d => d.turno_m || d.turno_t || d.turno_n).length;
            if (monthlySchedule.length < 30 || filled === 0) {
              console.log('[IMPORT DEBUG] Persona:', nombres_completos, 'monthlySchedule.length=', monthlySchedule.length, 'filledShifts=', filled, 'sample=', monthlySchedule.slice(0, 6));
            }
          }
        } catch (dbgErr) {
          console.error('[IMPORT DEBUG] error al evaluar monthlySchedule debug', dbgErr);
        }

        const words = nombres_completos.split(/\s+/).filter(Boolean);
        let apellidos = '', nombres = '';
        if (words.length >= 4) {
          apellidos = `${words[words.length - 2]} ${words[words.length - 1]}`;
          nombres = words.slice(0, -2).join(' ');
        } else if (words.length === 3) {
          apellidos = `${words[1]} ${words[2]}`;
          nombres = words[0];
        } else if (words.length === 2) {
          apellidos = words[1];
          nombres = words[0];
        } else {
          apellidos = words[0];
          nombres = 'PERSONAL';
        }

        const cargoValue = cargoColumnIndex >= 0 ? String(row[cargoColumnIndex] || '').trim() : '';
        currentSpecialty.staff.push({
          nombres: nombres.toUpperCase(),
          apellidos: apellidos.toUpperCase(),
          cargo: cargoValue,
          horario_mensual: monthlySchedule
        });

        if (hasT && hasN) {
          i += 2;
        } else if (hasT) {
          i += 1;
        }
      }

      // Mantener cada sección de especialidad como independiente
      // Si hay duplicados del mismo nombre, agregar sufijo para diferenciarlas
      const mergedEntities = [];
      const nameOccurrences = {};

      for (const entity of entities) {
        const baseName = entity.name;
        if (!nameOccurrences[baseName]) {
          nameOccurrences[baseName] = 0;
        }
        nameOccurrences[baseName]++;
        
        const uniqueName = nameOccurrences[baseName] > 1 
          ? `${baseName} - Sección ${nameOccurrences[baseName]}`
          : baseName;
          
        mergedEntities.push({ 
          ...entity, 
          name: uniqueName,
          staff: [...entity.staff] 
        });
      }

      const results = mergedEntities.map(entity => {
        // Buscar especialidad por el nombre base (sin el sufijo de sección)
        const baseNameForSearch = entity.name.includes(' - Sección ') 
          ? entity.name.split(' - Sección ')[0]
          : entity.name;
        const existing = especialidades.find(e => e.especialidad.toUpperCase().includes(baseNameForSearch.toUpperCase()));
        return {
          ...entity,
          selected: true,
          conflict: !!existing,
          existingId: existing?.id,
          decision: existing ? 'update' : 'create'
        };
      });

      setImportResults(results);
      setImportDialogOpen(true);
      e.target.value = null; // Reset input
    };
    reader.readAsBinaryString(file);
  };

  const handleFinalImport = async () => {
    setIsProcessingImport(true);
    let successCount = 0;
    let errorCount = 0;
    let failedNames = [];

    // Mostrar modal de progreso con Swal
    Swal.fire({
      title: 'Importando Datos...',
      html: 'Procesando registros de personal y especialidades. Por favor espere...<br><b>0</b> registros completados.',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    try {
      const selectedEntities = importResults.filter(r => r.selected);
      for (const entity of selectedEntities) {
        let specialtyId = entity.existingId;

        if (!specialtyId || entity.decision === 'rename') {
          // Crear nueva especialidad
          const respEsp = await createEspecialidad({ 
            especialidad: entity.name.toUpperCase(),
            UPS: entity.name.substring(0, 5).toUpperCase() 
          });
          specialtyId = respEsp?.id || respEsp?.data?.id;
        }

        if (!specialtyId) {
          failedNames.push(`Especialidad: ${entity.name} (Error ID)`);
          errorCount += entity.staff.length;
          continue;
        }

        // Importar personal
        // let tempDniBase = Math.floor(Math.random() * 90000000) + 10000000;
        for (let s of entity.staff) {
          try {
            // const tempDni = String(tempDniBase++);

            // Asegurar que `horario_mensual` tenga al menos 30 entradas requeridas por el backend
            const horario = Array.isArray(s.horario_mensual) ? s.horario_mensual.slice() : [];
            const requiredDays = 30;
            if (horario.length < requiredDays) {
              for (let dd = horario.length + 1; dd <= requiredDays; dd++) {
                horario.push({
                  dia_numero: dd,
                  turno_m: null,
                  turno_t: null,
                  turno_n: null
                });
              }
            }

            const payload = {
              nombres: s.nombres,
              apellidos: s.apellidos,
              especialidad_id: specialtyId,
              dni: null,
              email: ``,
              // Email ALEATORIO -> ${s.nombres.toLowerCase().replace(/[^a-z]/g, '').substring(0, 5)}${tempDni.substring(4)}@hosp.gob.pe
              telefono: 'N/A',
              cargo: s.cargo || '',
              horario_semanal: [],
              horario_mensual: horario
            };

            await createPersonalSalud(payload);
            successCount++;

            if (Swal.isVisible()) {
              Swal.getHtmlContainer().querySelector('b').textContent = `${successCount}`;
            }
          } catch (e) {
            console.error("Error en fila:", s.nombres, e.response?.data || e.message);
            errorCount++;
            failedNames.push(`${s.nombres} ${s.apellidos} (${e.response?.data?.message || 'Error técnico'})`);
          }
        }
      }

      Swal.fire({
        icon: successCount > 0 ? 'success' : 'info',
        title: 'Importación Finalizada',
        html: `<b>Éxitos:</b> ${successCount}<br/><b>Fallidos:</b> ${errorCount}`,
        footer: failedNames.length > 0 ? 
          `<div style="max-height: 100px; overflow-y: auto; font-size: 10px; text-align: left; width: 100%">
            <b>Errores:</b><br/>${failedNames.join('<br/>')}
           </div>` : null,
        confirmButtonColor: '#3085d6'
      });
      queryClient.invalidateQueries(['personal_all']);
      setImportResults([]);
      setImportDialogOpen(false);
    } catch (error) {
      console.error("Error crítico en importación:", error);
      Swal.fire('Error', 'Ocurrió un error crítico durante la importación.', 'error');
    } finally {
      setIsProcessingImport(false);
    }
  };

  const formatHora = (val) => {
    if (!val) return '-';
    if (typeof val === 'string' && val.includes(':')) return val.substring(0, 5);
    const num = parseFloat(val);
    if (isNaN(num)) return val;
    const hours = Math.floor(num);
    const minutes = Math.round((num - hours) * 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main', display: 'flex', alignItems: 'center', gap: 2 }}>
          Personal de Salud
        </Typography>
        <Stack direction="row" spacing={2}>
          <input
            type="file"
            accept=".xlsx, .xls"
            style={{ display: 'none' }}
            id="import-rol-input"
            onChange={(e) => handleProcessExcel(e)}
          />
          <Button 
            variant="outlined" 
            startIcon={<ImportIcon />}
            color="success"
            onClick={() => document.getElementById('import-rol-input').click()}
          >
            Importar Rol Mensual
          </Button>
          <Button 
            variant="outlined" 
            startIcon={<RefreshIcon />} 
            onClick={() => queryClient.invalidateQueries(['personal_all'])}
          >
            Actualizar
          </Button>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />} 
            onClick={() => handleOpenEdit()}
            sx={{ borderRadius: 2, px: 3 }}
          >
            Nuevo Personal
          </Button>
        </Stack>
      </Box>

      {/* Sección de Filtros */}
      <Box sx={{ mb: 3, p: 2, bgcolor: '#f8f9fa', borderRadius: 2, border: '1px solid #e9ecef' }}>
        <Grid container spacing={2} sx={{ alignItems: 'center' }}>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Buscar por nombre o DNI..."
              value={filterText}
              onChange={(e) => {
                setFilterText(e.target.value);
                setPage(1);
              }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="action" />
                    </InputAdornment>
                  ),
                }
              }}
              sx={{ bgcolor: 'white' }}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              select
              fullWidth
              size="small"
              label="Especialidad / UPS"
              value={filterEspecialidad}
              onChange={(e) => {
                setFilterEspecialidad(e.target.value);
                setPage(1);
              }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <FilterIcon fontSize="small" color="action" />
                    </InputAdornment>
                  ),
                }
              }}
              sx={{ bgcolor: 'white', minWidth: 220, maxWidth: 320, width: '100%' }}
              SelectProps={{
                MenuProps: {
                  PaperProps: {
                    sx: { maxWidth: 420 }
                  }
                }
              }}
            >
              <MenuItem value="all">Todas</MenuItem>
              {especialidades.map((esp) => (
                <MenuItem
                  key={esp.id}
                  value={esp.id}
                  sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 400 }}
                >
                  {esp.especialidad} {esp.UPS ? `(${esp.UPS})` : ''}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, md: 2 }}>
            <Button 
              fullWidth 
              variant="text" 
              onClick={() => { 
                setFilterText(''); 
                setFilterEspecialidad('all'); 
                setPage(1);
              }}
              sx={{ textTransform: 'none' }}
            >
              Limpiar
            </Button>
          </Grid>
        </Grid>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error.message || 'Error al cargar personal'}</Alert>}
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nombres y apellidos</TableCell>
              <TableCell>DNI</TableCell>
              <TableCell>Telèfono</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Especialidad</TableCell>
              <TableCell>Cargo</TableCell>
              <TableCell>Horario Mensual</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? [...Array(5)].map((_, i) => <TableRow key={i}><TableCell colSpan={7}><Skeleton /></TableCell></TableRow>) : 
             filteredItems.length === 0 ? <TableRow><TableCell colSpan={7} align="center">No hay personal registrado.</TableCell></TableRow> :
             pagedItems.map((p) => {
               return (
                 <TableRow key={p.id} hover>
                   <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Avatar sx={{ width: 28, height: 28, fontSize: "0.75rem", bgcolor: "primary.main" }}>
                                      {p.nombres?.[0] || "P"}
                          </Avatar>
                          <Typography variant="body2">{p.nombres} {p.apellidos}</Typography>
                      </Box>
                   </TableCell>
                    <TableCell>{p.dni || '-'}</TableCell>
                   <TableCell>{p.telefono || '-'}</TableCell>
                   <TableCell>{p.email || '-'}</TableCell>
                   <TableCell><Chip label={p.especialidad?.especialidad || 'Sin asignar'} size="small" /></TableCell>
                   <TableCell>{p.cargo || '-'}</TableCell>
                   <TableCell>
                      <Stack spacing={1}>
                        {p.horario_mensual && (Array.isArray(p.horario_mensual) ? p.horario_mensual.length > 0 : String(p.horario_mensual).length > 2) ? (
                          <Button 
                            size="small" 
                            variant="outlined" 
                            startIcon={<CalendarTodayIcon />}
                            onClick={() => handleOpenView(p)}
                            color="success"
                            sx={{ textTransform: 'none', borderRadius: 2 }}
                          >
                            Ver Programación
                          </Button>
                        ) : (
                          <Chip 
                            label="Sin Programación" 
                            size="small" 
                            variant="outlined" 
                            sx={{ height: 24, fontSize: '0.75rem' }}
                          />
                        )}
                      </Stack>
                   </TableCell>
                   <TableCell align="right">
                      <Stack direction="row" spacing={0.5} sx={{ justifyContent: "flex-end" }}>
                        <Tooltip title="Ver Detalles">
                          <IconButton size="small" color="info" onClick={() => handleOpenView(p)}>
                            <ViewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Editar">
                          <IconButton size="small" color="primary" onClick={() => handleOpenEdit(p)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Eliminar">
                          <IconButton size="small" color="error" onClick={() => handleOpenDeleteConfirm(p.id)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                   </TableCell>
                 </TableRow>
               );
             })}
          </TableBody>
        </Table>
      </TableContainer>
      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
        <Pagination count={totalPages} page={page} onChange={(_, v) => setPage(v)} color="primary" />
      </Box>

      {/* Modal Ver Detalles */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: 'info.main', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          Detalles del Personal
          <IconButton size="small" onClick={() => setViewDialogOpen(false)} sx={{ color: 'white' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {selectedItem && (
            <List>
              <ListItem>
                <ListItemText primary="Nombres y Apellidos" secondary={`${selectedItem.nombres} ${selectedItem.apellidos}`} />
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemText primary="DNI" secondary={selectedItem.dni || '-'} />
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemText primary="Especialidad / UPS" secondary={`${selectedItem.especialidad?.especialidad} ${selectedItem.especialidad?.UPS ? `- ${selectedItem.especialidad?.UPS}` : ''}`} />
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemText primary="Teléfono" secondary={selectedItem.telefono || '-'} />
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemText primary="Email" secondary={selectedItem.email || '-'} />
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemText primary="Cargo" secondary={selectedItem.cargo || '-'} />
              </ListItem>
              <Divider />
              
              <ListItem>
                <Box sx={{ width: '100%' }}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, fontWeight: 'bold' }}>Programación Mensual</Typography>
                  {selectedItem.horario_mensual && Array.isArray(selectedItem.horario_mensual) && selectedItem.horario_mensual.length > 0 ? (
                    <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 350, overflowY: 'auto' }}>
                      <Table size="small" stickyHeader>
                        <TableHead>
                          <TableRow>
                            <TableCell size="small" sx={{ bgcolor: 'grey.100', fontWeight: 'bold' }}>Día</TableCell>
                            <TableCell size="small" sx={{ bgcolor: 'grey.100', fontWeight: 'bold' }}>Mañana</TableCell>
                            <TableCell size="small" sx={{ bgcolor: 'grey.100', fontWeight: 'bold' }}>Tarde</TableCell>
                            <TableCell size="small" sx={{ bgcolor: 'grey.100', fontWeight: 'bold' }}>Noche</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {selectedItem.horario_mensual.map((d, index) => (
                            <TableRow key={index} hover>
                              <TableCell size="small" sx={{ fontWeight: 'medium' }}>
                                Día {d.dia_numero}
                              </TableCell>
                              <TableCell size="small">
                                {d.turno_m ? (
                                  <Chip label={d.turno_m} size="small" color="primary" sx={{ minWidth: 40, height: 20, fontSize: '0.65rem' }} />
                                ) : '-'}
                              </TableCell>
                              <TableCell size="small">
                                {d.turno_t ? (
                                  <Chip label={d.turno_t} size="small" color="secondary" sx={{ minWidth: 40, height: 20, fontSize: '0.65rem' }} />
                                ) : '-'}
                              </TableCell>
                              <TableCell size="small">
                                {d.turno_n ? (
                                  <Chip label={d.turno_n} size="small" color="warning" sx={{ minWidth: 40, height: 20, fontSize: '0.65rem' }} />
                                ) : '-'}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Alert severity="info" size="small">No hay programación mensual registrada para este profesional.</Alert>
                  )}
                </Box>
              </ListItem>
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* Modal Crear/Editar Personal */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: formData.id ? 'primary.main' : 'success.main', color: 'white', mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {formData.id ? 'Editar Personal de Salud' : 'Registrar Nuevo Personal'}
          <IconButton size="small" onClick={() => setEditDialogOpen(false)} sx={{ color: 'white' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <form onSubmit={handleSave} noValidate>
          <DialogContent>
            <Stack spacing={2.5}>
              <TextField 
                label="Nombres" fullWidth variant="outlined"
                value={formData.nombres} 
                onChange={(e) => setFormData({...formData, nombres: e.target.value})} 
              />
              <TextField 
                label="Apellidos" fullWidth variant="outlined"
                value={formData.apellidos} 
                onChange={(e) => setFormData({...formData, apellidos: e.target.value})} 
              />
              <TextField 
                label="DNI" fullWidth variant="outlined"
                value={formData.dni} 
                onChange={(e) => setFormData({...formData, dni: e.target.value})} 
              />
              <TextField 
                label="Teléfono" fullWidth variant="outlined"
                value={formData.telefono} 
                onChange={(e) => setFormData({...formData, telefono: e.target.value})} 
              />
              <TextField 
                label="Email" type="email" fullWidth variant="outlined"
                value={formData.email} 
                onChange={(e) => setFormData({...formData, email: e.target.value})} 
              />
              <TextField 
                label="Cargo" fullWidth variant="outlined"
                value={formData.cargo} 
                onChange={(e) => setFormData({...formData, cargo: e.target.value})} 
              />
              
              <Autocomplete
                options={especialidades}
                getOptionLabel={(option) => {
                  if (typeof option === 'string') return option;
                  return `${option.especialidad} ${option.UPS ? `- UPS: ${option.UPS}` : ''}`;
                }}
                value={especialidades.find(e => e.id === formData.especialidad_id) || null}
                onChange={(_, newValue) => {
                  setFormData({ ...formData, especialidad_id: newValue ? newValue.id : '' });
                }}
                renderInput={(params) => (
                  <TextField 
                    {...params} 
                    label="Especialidad / UPS" 
                    variant="outlined"
                    helperText="Busque y seleccione la especialidad o unidad UPS asignada"
                  />
                )}
                fullWidth
              />

              <Divider sx={{ my: 1 }}>
                <Chip label="PROGRAMACIÓN MENSUAL" size="small" color="primary" />
              </Divider>

              <Box sx={{ p: 1, border: '1px solid #e0e0e0', borderRadius: 1, bgcolor: '#fcfcfc' }}>
                <HorarioMensualPicker 
                  value={formData.horario_mensual} 
                  onChange={(newHorario) => setFormData({...formData, horario_mensual: newHorario})} 
                />
              </Box>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setEditDialogOpen(false)} color="inherit">Cancelar</Button>
            <Button type="submit" variant="contained" color="primary" disabled={saveMutation.isLoading}>
              {saveMutation.isLoading ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
      {/* Modal de Revisión de Importación */}
      <Dialog open={importDialogOpen} onClose={() => !isProcessingImport && setImportDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: 'success.dark', color: 'white' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ImportIcon /> Revisión de Importación de Rol
          </Box>
          <IconButton size="small" onClick={() => !isProcessingImport && setImportDialogOpen(false)} sx={{ color: 'white' }} disabled={isProcessingImport}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Se han detectado las siguientes áreas y personal en el archivo Excel. 
            Seleccione cuáles desea importar y cómo manejar los que ya existen.
          </Typography>

          <TableContainer component={Paper} variant="outlined" sx={{ mt: 2 }}>
            <Table size="small">
              <TableHead sx={{ bgcolor: 'grey.100' }}>
                <TableRow>
                  <TableCell padding="checkbox"></TableCell>
                  <TableCell>Área / Especialidad Detectada</TableCell>
                  <TableCell align="center">Personal</TableCell>
                  <TableCell>Estado / Conflicto</TableCell>
                  <TableCell>Acción</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {importResults.map((res, idx) => (
                  <TableRow key={idx} hover selected={res.selected}>
                    <TableCell padding="checkbox">
                      <input 
                        type="checkbox" 
                        checked={res.selected} 
                        onChange={(e) => {
                          const newResults = [...importResults];
                          newResults[idx].selected = e.target.checked;
                          setImportResults(newResults);
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>{res.name}</TableCell>
                    <TableCell align="center">{res.staff.length}</TableCell>
                    <TableCell>
                      {res.conflict ? (
                        <Chip icon={<WarningIcon />} label="Ya existe" color="warning" size="small" variant="outlined" />
                      ) : (
                        <Chip icon={<CheckIcon />} label="Nuevo" color="success" size="small" variant="outlined" />
                      )}
                    </TableCell>
                    <TableCell>
                      {res.conflict && (
                        <TextField
                          select
                          size="small"
                          value={res.decision}
                          onChange={(e) => {
                            const newResults = [...importResults];
                            newResults[idx].decision = e.target.value;
                            setImportResults(newResults);
                          }}
                          sx={{ fontSize: '0.75rem', minWidth: 150 }}
                        >
                          <MenuItem value="update">Usar Existente</MenuItem>
                          <MenuItem value="rename">Crear como Nuevo</MenuItem>
                        </TextField>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {isProcessingImport && (
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Skeleton variant="rectangular" height={10} sx={{ mb: 1 }} />
              <Typography variant="caption">Procesando registros, por favor espere...</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setImportDialogOpen(false)} disabled={isProcessingImport}>Cancelar</Button>
          <Button 
            variant="contained" 
            color="success" 
            onClick={handleFinalImport} 
            disabled={isProcessingImport || !importResults.some(r => r.selected)}
          >
            {isProcessingImport ? 'Importando...' : `Importar ${importResults.filter(r => r.selected).length} Áreas`}
          </Button>
        </DialogActions>
      </Dialog>

    </Paper>
  );
}