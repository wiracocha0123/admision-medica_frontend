import React, { useState, useContext } from 'react';
import { 
  Paper, Typography, Table, TableBody, TableCell, TableHead, TableRow, 
  Button, Box, Avatar, Alert, TableContainer, Skeleton, Chip, Pagination, 
  IconButton, Stack, Tooltip, Dialog, DialogTitle, DialogContent, 
  DialogContentText, DialogActions, TextField, Divider, FormControlLabel, Checkbox,
  InputAdornment, MenuItem, Grid
} from '@mui/material';
import { 
  Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon, Refresh as RefreshIcon,
  People as PeopleIcon, Search as SearchIcon, FilterList as FilterIcon,
  FileUpload as ImportIcon, Archive as ArchiveIcon, History as HistoryIcon, Replay as ReplayIcon, Close as CloseIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPacientes, createPaciente, updatePaciente, deletePaciente, getNextHC, getAllPacientes } from '../../services/pacientesService';
import { AuthContext } from '../../contexts/AuthContext';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';

export default function Pacientes() {
  const { user } = useContext(AuthContext);
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);

  // Estados para filtros
  const [filterText, setFilterText] = useState('');
  const [filterHC, setFilterHC] = useState('');
  const [filterGestante, setFilterGestante] = useState('all');
  const [filterLiberadas, setFilterLiberadas] = useState('all');
  const [filterEstado, setFilterEstado] = useState('Activo'); // Nuevo filtro de estado por defecto en Activo

  // Estados para modales
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    tipo_documento: 'DNI',
    dni: '',
    HistoriaClinica: '',
    telefono: '',
    email: '',
    direccion: '',
    gestante: false,
    etapa_vida: 'Adulto',
    detalle_gestante: ''
  });

  // Lógica de etapa de vida y gestante
  React.useEffect(() => {
    if (formData.etapa_vida === 'Gestante') {
      if (!formData.gestante) {
        setFormData(prev => ({ ...prev, gestante: true }));
      }
    } else {
      if (formData.gestante) {
        setFormData(prev => ({ ...prev, gestante: false, detalle_gestante: '' }));
      }
    }
  }, [formData.etapa_vida]);

  // Detectar si hay filtros locales activos
  const hasActiveLocalFilters = filterText || filterHC || filterGestante !== 'all' || filterLiberadas !== 'all';

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['pacientes', hasActiveLocalFilters ? 'all' : page, filterText, filterHC, filterGestante, filterEstado],
    queryFn: () => {
      // Si hay filtros locales activos, obtener todos los pacientes de una sola vez
      if (hasActiveLocalFilters) {
        return getAllPacientes();
      }
      // Si no, usar paginación normal del backend
      return getPacientes(page, filterText, filterHC, filterGestante, filterEstado);
    },
    enabled: !!user,
  });

  // Con los cambios en el backend, la estructura es directa de Laravel Pagination
  let rawItems = [];
  let backendTotalPages = 1;

  if (hasActiveLocalFilters) {
    // Cuando hay filtros y se obtienen todos los pacientes sin paginación
    if (Array.isArray(data)) {
      rawItems = data;
    } else if (data?.data) {
      rawItems = Array.isArray(data.data) ? data.data : [];
    } else if (typeof data === 'object' && data !== null) {
      // Si data es un objeto pero no tiene .data, intentar extraer items
      rawItems = Object.values(data).filter(item => typeof item === 'object' && item.id);
    }
  } else {
    // Paginación normal del backend
    rawItems = Array.isArray(data?.data) ? data.data : [];
    backendTotalPages = data?.last_page || 1;
  }
  
  // Aplicar filtros localmente
  const filteredItems = rawItems.filter(p => {
    const matchesText = 
      ((p.nombre || '') + ' ' + (p.apellido || '')).toLowerCase().includes(filterText.toLowerCase()) ||
      (p.dni || p.DNI || '').toString().toLowerCase().includes(filterText.toLowerCase());

    const matchesHC = 
      (p.HistoriaClinica || '').toLowerCase().includes(filterHC.toLowerCase());
    
    // Normalizar el valor de gestante (puede venir como '1', 1, true o boolean)
    const isGestante = p.gestante === true || p.gestante === 1 || p.gestante === '1' || p.etapa_vida === 'Gestante';

    const matchesGestante = 
      filterGestante === 'all' || 
      (filterGestante === 'yes' && isGestante) || 
      (filterGestante === 'no' && !isGestante);
    
    // Filtro por estado
    const matchesEstado = 
      filterEstado === 'todos' || 
      (filterEstado === 'Activo' && (p.estado === 'Activo' || !p.estado)) || 
      (p.estado === filterEstado);

    const hasOnlyHistoria =
      String(p.HistoriaClinica || '').trim().length > 0 &&
      !String(p.nombre || '').trim() &&
      !String(p.apellido || '').trim();
    const isLiberada = hasOnlyHistoria || (
      String(p.nombre || '').trim() === 'HC' &&
      String(p.apellido || '').trim() === 'LIBERADA'
    );
    const matchesLiberadas =
      filterLiberadas === 'all' ||
      (filterLiberadas === 'liberadas' && isLiberada) ||
      (filterLiberadas === 'no-liberadas' && !isLiberada);
      
    return matchesText && matchesHC && matchesGestante && matchesEstado && matchesLiberadas;
  });

  const items = [...filteredItems].sort((a, b) => (b.id || 0) - (a.id || 0));

  // Calcular totalPages basado en filtros
  const itemsPerPage = 10; // Items mostrados por página (10 items para que haya más paginación)
  const totalPages = hasActiveLocalFilters 
    ? Math.ceil(items.length / itemsPerPage) 
    : backendTotalPages;

  // Si hay filtros activos, hacer paginación local en el frontend
  const displayItems = hasActiveLocalFilters
    ? items.slice((page - 1) * itemsPerPage, page * itemsPerPage)
    : items;

  const deleteMutation = useMutation({
    mutationFn: (id) => deletePaciente(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['pacientes']);
      Swal.fire({
        icon: 'success',
        title: '¡Eliminado!',
        text: 'El paciente ha sido eliminado correctamente.',
        timer: 1500,
        showConfirmButton: false,
        heightAuto: false
      });
    },
    onError: (err) => {
      const msg = err.response?.data?.message || err.message;
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
        return updatePaciente(payload.id, payload);
      }
      return createPaciente(payload);
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['pacientes']);
      setEditDialogOpen(false);
      
      Swal.fire({
        icon: 'success',
        title: variables.id ? '¡Actualizado!' : '¡Registrado!',
        text: `Paciente ${variables.id ? 'actualizado' : 'registrado'} correctamente.`,
        timer: 2000,
        showConfirmButton: false,
        heightAuto: false
      });
    },
    onError: (err) => {
      console.error("DEBUG - Error completo del servidor:", err.response?.data);
      
      let msg = "Ocurrió un error inesperado al guardar el paciente.";
      const serverData = err.response?.data;

      // 1. Manejo de errores de validación (Laravel) - Siempre priorizar si serverData es objeto
      if (serverData && typeof serverData === 'object' && serverData.errors) {
        const errorList = Object.values(serverData.errors).flat();
        msg = errorList[0];
      } 
      // 2. Errores de Base de Datos (SQLSTATE) - Capturar incluso si viene en un objeto "message" largo
      else {
        const errorText = typeof serverData === 'string' ? serverData : (serverData?.message || "");
        
        if (errorText.includes('SQLSTATE')) {
          if (errorText.includes('23505')) {
            msg = "Ya existe un paciente con este número de documento o Historia Clínica.";
          } else if (errorText.includes('22001') || errorText.toLowerCase().includes('too long') || errorText.toLowerCase().includes('truncated')) {
            msg = "El número ingresado es muy largo. Por favor, registre solo el número del documento sin incluir letras como 'CE' o 'DNI'.";
          } else if (errorText.includes('23503')) {
            msg = "Error de vinculación: Uno de los datos seleccionados no es válido en el sistema.";
          } else {
            msg = "Error de base de datos: Los datos ingresados no son compatibles con el sistema.";
          }
        } else if (serverData?.message) {
          msg = serverData.message;
        }
      }

      // Traducciones finales de limpieza
      if (msg.includes('dni has already been taken')) msg = 'Ya existe un paciente registrado con este número de documento.';
      if (msg.includes('HistoriaClinica has already been taken')) msg = 'Este número de Historia Clínica ya está asignado.';

      Swal.fire({
        icon: 'error',
        title: 'No se pudo guardar',
        text: msg,
        confirmButtonColor: '#3085d6',
        heightAuto: false
      });
    }
  });

  const handleOpenEdit = (item = null) => {
    if (item) {
      let docType = item.tipo_documento || 'DNI';
      
      // Normalizar tipo_documento: mapear valores largos del backend a abreviaturas
      if (docType.toUpperCase().includes('EXTRANJERÍA') || docType.toUpperCase() === 'CE') {
        docType = 'CE';
      } else if (docType.toUpperCase().includes('DNI') || docType.toUpperCase() === 'DNI') {
        docType = 'DNI';
      }
      // Si no coincide con nada, mantener como está
      
      let dniValue = item.dni || '';
      
      // Normalizar DNI según tipo de documento: truncar si es muy largo
      if (docType === 'DNI' && String(dniValue).length > 8) {
        dniValue = String(dniValue).slice(0, 8);
      } else if (docType === 'CE' && String(dniValue).length > 9) {
        dniValue = String(dniValue).slice(0, 9);
      }
      
      setFormData({
        id: item.id,
        nombre: item.nombre || '',
        apellido: item.apellido || '',
        tipo_documento: docType,
        dni: dniValue,
        HistoriaClinica: item.HistoriaClinica || '',
        telefono: item.telefono || '',
        email: item.email || '',
        direccion: item.direccion || '',
        gestante: !!item.gestante,
        etapa_vida: item.etapa_vida || 'Adulto',
        detalle_gestante: item.detalle_gestante || '',
        estado: item.estado || 'Activo'
      });
    } else {
      setFormData({
        nombre: '',
        apellido: '',
        tipo_documento: 'DNI',
        dni: '',
        HistoriaClinica: '',
        telefono: '',
        email: '',
        direccion: '',
        gestante: false,
        etapa_vida: 'Adulto',
        detalle_gestante: '',
        estado: 'Activo'
      });
    }
    setEditDialogOpen(true);
  };

  const handleOpenCreate = async (manualHC = null) => {
    setFormData({
      nombre: '',
      apellido: '',
      tipo_documento: 'DNI',
      dni: '',
      HistoriaClinica: manualHC || 'Cargando...',
      telefono: '',
      email: '',
      direccion: '',
      gestante: false,
      etapa_vida: 'Adulto',
      detalle_gestante: '',
      estado: 'Activo'
    });
    setEditDialogOpen(true);

    if (manualHC) return; // Si ya pasamos una HC (manual o liberada), no buscamos otra

    try {
      const resp = await getNextHC();
      console.log("Respuesta completa del servicio:", resp);
      
      const nextHC = resp.data?.next_hc || resp.next_hc || (typeof resp === 'string' ? resp : 'H-1');
      console.log("HC Extraído:", nextHC);
      
      setFormData(prev => ({ ...prev, HistoriaClinica: nextHC }));
    } catch (err) {
      console.error("Error al obtener siguiente HC:", err);
      setFormData(prev => ({ ...prev, HistoriaClinica: 'H-1' }));
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    
    // Validaciones manuales antes de enviar
    if (!formData.nombre.trim() || !formData.apellido.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Campos requeridos',
        text: 'El nombre y el apellido son obligatorios.',
        confirmButtonColor: '#3085d6',
        heightAuto: false
      });
      return;
    }
    
    const rawDni = String(formData.dni || '').trim();
    if (rawDni) {
      if (formData.tipo_documento === 'DNI') {
        if (rawDni.length !== 8) {
          Swal.fire({
            icon: 'warning',
            title: 'DNI inválido',
            text: 'El DNI debe tener exactamente 8 dígitos.',
            confirmButtonColor: '#3085d6',
            heightAuto: false
          });
          return;
        }
      } else if (formData.tipo_documento === 'CE') {
        if (rawDni.length !== 9) {
          Swal.fire({
            icon: 'warning',
            title: 'Número CE inválido',
            text: 'El número de CE debe tener exactamente 9 dígitos.',
            confirmButtonColor: '#3085d6',
            heightAuto: false
          });
          return;
        }
      } else {
        if (rawDni.length < 5 || rawDni.length > 15) {
          Swal.fire({
            icon: 'warning',
            title: 'Documento inválido',
            text: `El número de ${formData.tipo_documento} debe tener entre 5 y 15 caracteres.`,
            confirmButtonColor: '#3085d6',
            heightAuto: false
          });
          return;
        }
      }
    }

    if (formData.etapa_vida === 'Gestante' && !formData.detalle_gestante) {
      Swal.fire({
        icon: 'warning',
        title: 'Detalle requerido',
        text: 'Debe ingresar el detalle de la gestación.',
        confirmButtonColor: '#3085d6',
        heightAuto: false
      });
      return;
    }

    // Validar email solo si tiene contenido (debe contener @)
    if (formData.email && String(formData.email).trim()) {
      if (!String(formData.email).includes('@')) {
        Swal.fire({
          icon: 'warning',
          title: 'Email inválido',
          text: 'El correo debe contener un "@". Si no deseas agregar correo, déjalo en blanco.',
          confirmButtonColor: '#3085d6',
          heightAuto: false
        });
        return;
      }
    }

    // Quitar validación estricta de dirección (se maneja como nullable en backend)
    // Rellenar valores por defecto para evitar campos en blanco en la base de datos
    // IMPORTANTE: email se envía como null cuando está vacío (para que el backend no lo valide)
    // Normalizar DNI según tipo de documento antes de enviar (truncar si excede límite)
    let dniToSend = formData.dni ? String(formData.dni).trim() : '';
    if (formData.tipo_documento === 'DNI' && dniToSend.length > 8) {
      dniToSend = dniToSend.slice(0, 8);
    } else if (formData.tipo_documento === 'CE' && dniToSend.length > 9) {
      dniToSend = dniToSend.slice(0, 9);
    }
    
    // Normalizar tipo_documento a abreviatura antes de enviar
    let docTypeToSend = formData.tipo_documento || 'DNI';
    if (docTypeToSend.toUpperCase().includes('EXTRANJERÍA') || docTypeToSend.toUpperCase() === 'CE') {
      docTypeToSend = 'CE';
    } else if (docTypeToSend.toUpperCase().includes('DNI') || docTypeToSend.toUpperCase() === 'DNI') {
      docTypeToSend = 'DNI';
    }
    
    const payload = {
      ...formData,
      tipo_documento: docTypeToSend,
      telefono: formData.telefono && String(formData.telefono).trim() ? formData.telefono : 'N/A',
      direccion: formData.direccion && String(formData.direccion).trim() ? formData.direccion : 'N/A',
      email: formData.email && String(formData.email).trim() ? formData.email : null
    };

    // Solo incluir DNI si tiene valor, de lo contrario omitir del payload
    if (dniToSend) {
      payload.dni = dniToSend;
    } else {
      delete payload.dni;
    }

    // DEBUG: Log para verificar qué se está enviando
    console.log('[PACIENTES DEBUG] Payload a enviar:', {
      tiene_dni: 'dni' in payload,
      dni: payload.dni,
      tipo_documento: payload.tipo_documento
    });

    saveMutation.mutate(payload);
  };

  const handleImportExcel = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        if (data.length === 0) {
          Swal.fire({ icon: 'error', title: 'Error', text: 'El archivo está vacío', heightAuto: false });
          return;
        }

        Swal.fire({
          title: 'Importación Masiva detectada',
          html: `Se han detectado <b>${data.length.toLocaleString()}</b> registros.<br/><br/>` +
                `Para proteger la RAM y evitar errores, procesaremos de forma optimizada.<br/>` +
                `<b>Tiempo estimado:</b> 15 - 30 minutos.`,
          icon: 'info',
          showCancelButton: true,
          confirmButtonText: 'Iniciar Importación',
          cancelButtonText: 'Cancelar',
          heightAuto: false
        }).then(async (result) => {
          if (result.isConfirmed) {
            Swal.fire({
              title: 'Procesando...',
              html: `Progreso: <b>0</b> / ${data.length.toLocaleString()}<br/>` +
                    `<small>Omitidos (duplicados): 0 | Errores: 0</small>`,
              allowOutsideClick: false,
              didOpen: () => Swal.showLoading(),
              heightAuto: false
            });

            let successCount = 0;
            let skippedDetails = []; // Para duplicados
            let errorDetails = [];   // Para errores técnicos
            const CHUNK_SIZE = 50; 

            for (let i = 0; i < data.length; i += CHUNK_SIZE) {
              const chunk = data.slice(i, i + CHUNK_SIZE);
              
              const promises = chunk.map(async (row) => {
                const dniKey = Object.keys(row).find(k => k.toUpperCase() === 'DNI');
                const dni = (row[dniKey] || '').toString().trim();
                
                // Si no hay DNI, lo contamos como error técnico de datos
                if (!dni) {
                  errorDetails.push({ 
                    info: `Fila ${i + data.indexOf(row) + 1}`, 
                    reason: 'DNI ausente o vacío' 
                  });
                  return;
                }

                const fullNameKey = Object.keys(row).find(k => k.toUpperCase().includes('NOMBRE'));
                const fullName = (row[fullNameKey] || '').toString().trim();
                const words = fullName.split(/\s+/).filter(Boolean);
                
                let apellido = '', nombre = '';
                if (words.length === 0) { 
                  apellido = 'PACIENTE'; 
                  nombre = 'SIN NOMBRE'; 
                }
                else if (words.length >= 2) { 
                  apellido = words[0] + ' ' + words[1]; 
                  nombre = words.slice(2).join(' ') || words[0]; 
                } else {
                  apellido = words[0]; nombre = '-';
                }

                const payload = {
                  nombre, apellido, tipo_documento: 'DNI', dni,
                  HistoriaClinica: (row['HCL'] || row['HISTORIA'] || '').toString().trim(),
                  direccion: (row['DIRECCION'] || 'No especificada').toString().trim(),
                  estado: 'Activo'
                };

                try {
                  await createPaciente(payload);
                  successCount++;
                } catch (err) {
                  const errorMsg = err.response?.data?.errors 
                    ? JSON.stringify(err.response.data.errors) 
                    : (err.response?.data?.message || err.message || 'Error desconocido');
                  
                  const patientInfo = `${dni} | ${nombre} ${apellido}`;

                  // Si el error es 422 (Unprocessable Content) o indica duplicado
                  if (err.response?.status === 422 || errorMsg.toLowerCase().includes('taken')) {
                    skippedDetails.push({ info: patientInfo, reason: 'DNI o HC duplicado' });
                  } else {
                    errorDetails.push({ info: patientInfo, reason: errorMsg });
                  }
                }
              });

              await Promise.all(promises);
              
              // Actualizar el progreso en el modal sin cerrarlo
              const progressHtml = `Progreso: <b>${Math.min(i + CHUNK_SIZE, data.length).toLocaleString()}</b> / ${data.length.toLocaleString()}<br/>` +
                                   `<small>Omitidos (duplicados): ${skippedDetails.length} | Errores: ${errorDetails.length}</small>`;
              Swal.update({ html: progressHtml });
              
              // Pequeña pausa cada 500 registros para liberar el hilo principal
              if (i % 500 === 0) {
                await new Promise(resolve => setTimeout(resolve, 50));
              }
            }

            queryClient.invalidateQueries(['pacientes']);
            
            const totalFails = skippedDetails.length + errorDetails.length;

            Swal.fire({
              icon: totalFails > 0 ? 'warning' : 'success',
              title: 'Importación terminada',
              html: `<b>Nuevos registrados:</b> ${successCount}<br/>` +
                    `<b>Omitidos (duplicados):</b> ${skippedDetails.length}<br/>` +
                    `<b>Errores técnicos:</b> ${errorDetails.length}`,
              footer: totalFails > 0 ? '<button id="btnVerDetalles" class="swal2-confirm swal2-styled" style="background-color: #7c4dff">Ver Detalle de Errores</button>' : null,
              didOpen: () => {
                const btn = document.getElementById('btnVerDetalles');
                if (btn) {
                  btn.onclick = () => {
                    const errorRows = errorDetails.map(d => `<tr><td>${d.info}</td><td style="color:red">${d.reason}</td></tr>`).join('');
                    const skippedRows = skippedDetails.map(d => `<tr><td>${d.info}</td><td style="color:orange">${d.reason}</td></tr>`).join('');
                    
                    Swal.fire({
                      title: 'Detalle de Fallos',
                      width: '800px',
                      html: `
                        <div style="max-height: 400px; overflow-y: auto; text-align: left; font-size: 0.8rem">
                          <table style="width: 100%; border-collapse: collapse;">
                            <thead>
                              <tr style="border-bottom: 2px solid #ccc">
                                <th>Paciente/DNI</th>
                                <th>Motivo</th>
                              </tr>
                            </thead>
                            <tbody>
                              ${errorRows}
                              ${skippedRows}
                            </tbody>
                          </table>
                        </div>
                      `,
                      confirmButtonText: 'Cerrar',
                      heightAuto: false
                    });
                  };
                }
              },
              heightAuto: false
            });
          }
        });

      } catch (err) {
        console.error(err);
        Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo leer el archivo Excel', heightAuto: false });
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = null;
  };

  const handleOpenDeleteConfirm = (id) => {
    Swal.fire({
      title: '¿Estás seguro?',
      text: "Esta acción eliminará permanentemente el registro del paciente.",
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

  const handleArchiveAndReleaseHC = (paciente) => {
    const originalHC = paciente.HistoriaClinica;

    Swal.fire({
      title: `Liberar HC: ${originalHC}`,
      html: `¿Qué acción desea realizar con <b>${paciente.nombre} ${paciente.apellido}</b>?<br/><br/>` +
            `• Se archivará como: <b>${originalHC}-OLD</b><br/>` +
            `• El número <b>${originalHC}</b> quedará libre.`,
      icon: 'warning',
      showCancelButton: true,
      showDenyButton: true,
      confirmButtonColor: '#ff9800', // Naranja para Solo Liberar
      denyButtonColor: '#3085d6',    // Azul para Liberar y Crear
      cancelButtonColor: '#d33',
      confirmButtonText: 'Solo Liberar HC',
      denyButtonText: 'Liberar y Asignar a Nuevo',
      cancelButtonText: 'Cancelar',
      heightAuto: false
    }).then(async (result) => {
      if (result.isConfirmed || result.isDenied) {
        const updatePayload = {
          HistoriaClinica: `${originalHC}-OLD`,
          estado: 'Archivado'
        };

        if (paciente.dni != null && String(paciente.dni).trim() !== '') {
          updatePayload.dni = String(paciente.dni).trim();
        }
        if (paciente.tipo_documento != null && String(paciente.tipo_documento).trim() !== '') {
          updatePayload.tipo_documento = String(paciente.tipo_documento).trim();
        }

        const isAssigningNew = result.isDenied;

        try {
          await updatePaciente(paciente.id, updatePayload);
          queryClient.invalidateQueries(['pacientes']);

          if (isAssigningNew) {
            // El paciente se archivó y la HC quedó libre para asignar de inmediato.
            setTimeout(() => {
              handleOpenCreate(originalHC);
            }, 500);
          } else {
            const placeholderPayload = {
              nombre: 'HC',
              apellido: 'LIBERADA',
              tipo_documento: null,
              HistoriaClinica: originalHC,
              telefono: null,
              email: null,
              direccion: null,
              gestante: false,
              etapa_vida: null,
              detalle_gestante: null,
              estado: 'Activo'
            };

            await createPaciente(placeholderPayload);
            queryClient.invalidateQueries(['pacientes']);

            Swal.fire({
              icon: 'success',
              title: 'HC liberada',
              text: `La historia clínica ${originalHC} quedó libre y se creó el registro de HC liberada.`,
              timer: 2000,
              showConfirmButton: false,
              heightAuto: false
            });
          }
        } catch (err) {
          console.error('Error al liberar HC:', err.response?.data || err.message || err);
          const serverError = err.response?.data?.message ||
            (err.response?.data?.errors ? JSON.stringify(err.response.data.errors) : null) ||
            err.message ||
            'Ocurrió un problema al archivar el paciente o liberar la historia clínica.';

          Swal.fire({
            icon: 'error',
            title: 'Error al liberar HC',
            text: serverError,
            confirmButtonColor: '#3085d6',
            heightAuto: false
          });
        }
      }
    });
  };

  const getAvailableReleasedHCs = async () => {
    try {
      const all = await getAllPacientes();
      return (Array.isArray(all.data) ? all.data : all).filter((p) => {
        const nombre = String(p.nombre || '').trim().toUpperCase();
        const apellido = String(p.apellido || '').trim().toUpperCase();
        return (
          String(p.HistoriaClinica || '').trim() &&
          ((nombre === 'HC' && apellido === 'LIBERADA') ||
            (!nombre && !apellido))
        );
      }).sort((a, b) => {
        const aNum = Number(String(a.HistoriaClinica || '').replace(/\D/g, '')) || 0;
        const bNum = Number(String(b.HistoriaClinica || '').replace(/\D/g, '')) || 0;
        if (aNum !== bNum) return aNum - bNum;
        return String(a.HistoriaClinica || '').localeCompare(String(b.HistoriaClinica || ''));
      });
    } catch (err) {
      console.error('Error al buscar HC liberadas:', err);
      return [];
    }
  };

  const handleReactivateWithAvailableHC = async (paciente) => {
    Swal.fire({
      title: 'Buscando HC disponible...',
      html: 'Espere un momento mientras buscamos historias clínicas liberadas.',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
      heightAuto: false
    });

    try {
      const available = await getAvailableReleasedHCs();
      let assignedHC = null;

      if (available.length > 0) {
        const candidate = available[0];
        assignedHC = candidate.HistoriaClinica;
        await deletePaciente(candidate.id);
      } else {
        const nextHCResponse = await getNextHC();
        assignedHC = nextHCResponse.data?.next_hc || nextHCResponse.next_hc || 'H-1';
      }

      await updatePaciente(paciente.id, {
        HistoriaClinica: assignedHC,
        estado: 'Activo'
      });

      queryClient.invalidateQueries(['pacientes']);

      Swal.fire({
        icon: 'success',
        title: 'Paciente reactivado',
        text: `Se reasignó la historia clínica ${assignedHC} y el paciente volvió a Activo.`,
        timer: 2200,
        showConfirmButton: false,
        heightAuto: false
      });
    } catch (err) {
      console.error('Error al reactivar paciente:', err);
      const serverError = err.response?.data?.message ||
        (err.response?.data?.errors ? JSON.stringify(err.response.data.errors) : null) ||
        err.message ||
        'Ocurrió un problema al reactivar el paciente.';

      Swal.fire({
        icon: 'error',
        title: 'No se pudo reactivar',
        text: serverError,
        confirmButtonColor: '#3085d6',
        heightAuto: false
      });
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main', display: 'flex', alignItems: 'center', gap: 2 }}>
          <PeopleIcon sx={{ fontSize: 40 }} />
          Pacientes
        </Typography>
        <Stack direction="row" spacing={2}>          <input
            type="file"
            accept=".xlsx, .xls, .csv"
            style={{ display: 'none' }}
            id="import-excel-input"
            onChange={handleImportExcel}
          />
          <label htmlFor="import-excel-input">
            <Button 
              variant="outlined" 
              component="span"
              startIcon={<ImportIcon />}
              color="success"
            >
              Importar Excel
            </Button>
          </label>          <Button 
            variant="outlined" 
            startIcon={<RefreshIcon />} 
            onClick={() => queryClient.invalidateQueries(['pacientes'])}
          >
            Actualizar
          </Button>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />} 
            onClick={() => handleOpenCreate()}
            sx={{ borderRadius: 2, px: 3 }}
          >
            Nuevo Paciente
          </Button>
        </Stack>
      </Box>

      <Box sx={{ mb: 3, p: 2, bgcolor: '#f8f9fa', borderRadius: 2, border: '1px solid #e9ecef' }}>
        <Grid container spacing={2} sx={{ alignItems: 'center' }}>
          <Grid size={{ xs: 12, md: 4 }}>
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
          <Grid size={{ xs: 12, md: 3 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="H. Clínica (ej: H-5)..."
              value={filterHC}
              onChange={(e) => {
                setFilterHC(e.target.value);
                setPage(1);
              }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <PeopleIcon fontSize="small" color="action" />
                    </InputAdornment>
                  ),
                }
              }}
              sx={{ bgcolor: 'white' }}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <TextField
              select
              fullWidth
              size="small"
              label="Filtrar por Gestante"
              value={filterGestante}
              onChange={(e) => {
                setFilterGestante(e.target.value);
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
              sx={{ bgcolor: 'white' }}
            >
              <MenuItem value="all">Todos los registros</MenuItem>
              <MenuItem value="yes">Solo Gestantes</MenuItem>
              <MenuItem value="no">No Gestantes</MenuItem>
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <TextField
              select
              fullWidth
              size="small"
              label="HC Liberadas"
              value={filterLiberadas}
              onChange={(e) => {
                setFilterLiberadas(e.target.value);
                setPage(1);
              }}
              sx={{ bgcolor: 'white' }}
            >
              <MenuItem value="all">Todas las historias</MenuItem>
              <MenuItem value="liberadas">Solo HC liberadas (solo historia clínica)</MenuItem>
              <MenuItem value="no-liberadas">No liberadas</MenuItem>
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <TextField
              select
              fullWidth
              size="small"
              label="Estado"
              value={filterEstado}
              onChange={(e) => {
                setFilterEstado(e.target.value);
                setPage(1);
              }}
              sx={{ bgcolor: 'white' }}
            >
              <MenuItem value="Activo">Solo Activos</MenuItem>
              <MenuItem value="Archivado">Archivados / Quitados</MenuItem>
              <MenuItem value="todos">Ver Todos</MenuItem>
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, md: 2 }}>
            <Button 
              fullWidth 
              variant="text" 
              onClick={() => { 
                setFilterText(''); 
                setFilterGestante('all'); 
                setFilterHC(''); 
                setFilterLiberadas('all');
                setFilterEstado('Activo');
                setPage(1); 
              }}
              sx={{ textTransform: 'none' }}
            >
              Limpiar
            </Button>
          </Grid>
        </Grid>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error.message || 'Error al cargar pacientes'}</Alert>}

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Paciente</TableCell>
              <TableCell>Documento</TableCell>
              <TableCell>H. Clínica</TableCell>
              <TableCell>Etapa Vida</TableCell>
              <TableCell>Contacto</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? [...Array(5)].map((_, i) => <TableRow key={i}><TableCell colSpan={7}><Skeleton /></TableCell></TableRow>) : 
             items.length === 0 ? <TableRow><TableCell colSpan={7} align="center">No hay pacientes registrados.</TableCell></TableRow> :
             displayItems.map((p) => (
               <TableRow key={p.id} hover>
                 <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: "primary.light" }}>
                          {p.nombre?.[0] || "P"}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{p.nombre} {p.apellido}</Typography>
                          <Typography variant="caption" color="text.secondary" component="span">{p.direccion || 'Sin dirección'}</Typography>
                        </Box>
                    </Box>
                 </TableCell>
                 <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                      {p.tipo_documento === 'CE' ? `CE: ${p.dni}` : p.dni}
                    </Typography>
                    {p.tipo_documento && p.tipo_documento !== 'DNI' && p.tipo_documento !== 'CE' && (
                      <Typography variant="caption" color="text.secondary">{p.tipo_documento}</Typography>
                    )}
                 </TableCell>
                 <TableCell>{p.HistoriaClinica || '-'}</TableCell>
                 <TableCell>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      <Chip 
                        label={p.etapa_vida || 'Adulto'} 
                        size="small" 
                        variant="outlined" 
                        color="primary"
                        sx={{ fontSize: '0.75rem', width: 'fit-content' }}
                      />
                      {(p.gestante || p.etapa_vida === 'Gestante') && (
                        <Tooltip title={p.detalle_gestante ? `Detalle: ${p.detalle_gestante}` : "Paciente gestante"}>
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              color: 'secondary.main', 
                              fontWeight: 'bold',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 0.5
                            }}
                          >
                            {p.detalle_gestante && `(${p.detalle_gestante})`}
                          </Typography>
                        </Tooltip>
                      )}
                    </Box>
                 </TableCell>
                 <TableCell>
                    <Typography variant="body2">{p.telefono || '-'}</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>{p.email || '-'}</Typography>
                 </TableCell>
                 <TableCell>
                    <Chip 
                      label={p.estado || 'Activo'} 
                      size="small" 
                      color={p.estado === 'Archivado' ? 'default' : 'success'}
                      variant={p.estado === 'Archivado' ? 'outlined' : 'filled'}
                      sx={{ fontSize: '0.7rem', height: 20 }}
                    />
                 </TableCell>
                 <TableCell align="right">
                    <Stack direction="row" spacing={0.5} sx={{ justifyContent: 'flex-end' }}>
                      {(!p.estado || p.estado === 'Activo') && (
                        <Tooltip title="Quitar y Liberar HC">
                          <IconButton size="small" color="warning" onClick={() => handleArchiveAndReleaseHC(p)}>
                            <HistoryIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      {p.estado === 'Archivado' && (
                        <Tooltip title="Reactivar con HC disponible">
                          <IconButton size="small" color="success" onClick={() => handleReactivateWithAvailableHC(p)}>
                            <ReplayIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
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
             ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
        <Pagination count={totalPages} page={page} onChange={(_, v) => setPage(v)} color="primary" />
      </Box>

      {/* Modal Crear/Editar Paciente */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: formData.id ? 'primary.main' : 'success.main', color: 'white', mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {formData.id ? 'Editar Paciente' : 'Registrar Nuevo Paciente'}
          <IconButton size="small" onClick={() => setEditDialogOpen(false)} sx={{ color: 'white' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <form onSubmit={handleSave} noValidate>
          <DialogContent dividers>
            <Stack spacing={2.5}>
              <Grid container spacing={2}>
                <Grid size={6}>
                  <TextField 
                    label="Nombres" fullWidth variant="outlined" required
                    value={formData.nombre} 
                    onChange={(e) => setFormData({...formData, nombre: e.target.value})} 
                  />
                </Grid>
                <Grid size={6}>
                  <TextField 
                    label="Apellidos" fullWidth variant="outlined" required
                    value={formData.apellido} 
                    onChange={(e) => setFormData({...formData, apellido: e.target.value})} 
                  />
                </Grid>
              </Grid>

              <Grid container spacing={2}>
                <Grid size={4}>
                  <TextField
                    select
                    label="Tipo de Doc."
                    fullWidth
                    value={formData.tipo_documento}
                    onChange={(e) => {
                      const newDocType = e.target.value;
                      // Normalizar documento cuando cambia el tipo
                      let normalizedDni = formData.dni ? String(formData.dni).trim() : '';
                      if (newDocType === 'DNI' && normalizedDni.length > 8) {
                        normalizedDni = normalizedDni.slice(0, 8);
                      } else if (newDocType === 'CE' && normalizedDni.length > 9) {
                        normalizedDni = normalizedDni.slice(0, 9);
                      }
                      setFormData({...formData, tipo_documento: newDocType, dni: normalizedDni});
                    }}
                  >
                    <MenuItem value="DNI">DNI</MenuItem>
                    <MenuItem value="CE">CE (Extranjería)</MenuItem>
                    
                  </TextField>
                </Grid>
                <Grid size={8}>
                  <TextField 
                    label={formData.tipo_documento === 'DNI' ? "DNI" : "Número de Documento"} 
                    fullWidth variant="outlined" required
                    value={formData.dni} 
                    onChange={(e) => {
                      const val = e.target.value;
                      // En el front limitamos según tipo: DNI=8 dígitos, CE=9 dígitos
                      if (formData.tipo_documento === 'DNI') {
                        if (/^\d*$/.test(val) && val.length <= 8) setFormData({...formData, dni: val});
                      } else if (formData.tipo_documento === 'CE') {
                        if (/^\d*$/.test(val) && val.length <= 9) setFormData({...formData, dni: val});
                      } else {
                        if (val.length <= 15) setFormData({...formData, dni: val});
                      }
                    }} 
                    helperText={formData.tipo_documento === 'DNI' ? "8 dígitos" : (formData.tipo_documento === 'CE' ? '9 dígitos' : 'Ingrese el número sin prefijos (ej: 87451236)')}
                  />
                </Grid>
              </Grid>

              <Grid container spacing={2}>
                <Grid size={6}>
                  <TextField
                    select
                    label="Etapa de Vida"
                    fullWidth
                    value={formData.etapa_vida}
                    onChange={(e) => setFormData({...formData, etapa_vida: e.target.value})}
                  >
                    <MenuItem value="RN">RN (Recién Nacido)</MenuItem>
                    <MenuItem value="Niño">Niño</MenuItem>
                    <MenuItem value="Adolescente">Adolescente</MenuItem>
                    <MenuItem value="Adulto">Adulto</MenuItem>
                    <MenuItem value="Adulto Mayor">Adulto Mayor</MenuItem>
                    <MenuItem value="Gestante">Gestante</MenuItem>
                  </TextField>
                </Grid>
                <Grid size={6}>
                  {formData.etapa_vida === 'Gestante' && (
                    <TextField
                      label="Detalle de Gestación"
                      placeholder="Ej: A1, 38 semanas, embarazo de alto riesgo..."
                      fullWidth
                      value={formData.detalle_gestante}
                      onChange={(e) => setFormData({...formData, detalle_gestante: e.target.value})}
                      sx={{ animation: 'fadeIn 0.5s' }}
                    />
                  )}
                </Grid>
              </Grid>

              <TextField 
                label="Historia Clínica" fullWidth variant="outlined"
                value={formData.HistoriaClinica} 
                onChange={(e) => setFormData({...formData, HistoriaClinica: e.target.value})}
                helperText="Se autogenera el siguiente número 'H-X', pero puede modificarlo si es necesario."
              />
              
              <Grid container spacing={2}>
                <Grid size={6}>
                  <TextField 
                    label="Teléfono" fullWidth variant="outlined"
                    value={formData.telefono} 
                    onChange={(e) => setFormData({...formData, telefono: e.target.value})} 
                  />
                </Grid>
                <Grid size={6}>
                  <TextField 
                    label="Email" type="email" fullWidth variant="outlined"
                    value={formData.email} 
                    onChange={(e) => setFormData({...formData, email: e.target.value})} 
                  />
                </Grid>
              </Grid>

              <TextField 
                label="Dirección" fullWidth variant="outlined" required
                value={formData.direccion} 
                onChange={(e) => setFormData({...formData, direccion: e.target.value})} 
              />

              {formData.id && (
                <TextField
                  select
                  label="Estado"
                  fullWidth
                  value={formData.estado || 'Activo'}
                  onChange={(e) => setFormData({...formData, estado: e.target.value})}
                >
                  <MenuItem value="Activo">Activo</MenuItem>
                  <MenuItem value="Archivado">Archivado / Dado de Baja</MenuItem>
                </TextField>
              )}
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
    </Paper>
  );
}