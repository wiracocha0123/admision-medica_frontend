import React, { useState, useContext, useEffect, useMemo } from "react";
import { 
  Paper, Typography, Table, TableBody, TableCell, TableHead, TableRow, Button, Box, 
  CircularProgress, Alert, TableContainer, Skeleton, Chip, Pagination, Stack, Avatar, 
  IconButton, Tooltip, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, TextField, 
  MenuItem, Grid, FormControl, InputLabel, Select, Divider, Autocomplete, InputAdornment
} from "@mui/material";
import { 
  Refresh as RefreshIcon, CalendarMonth as CalendarIcon, Edit as EditIcon, 
  Delete as DeleteIcon, Visibility as VisibilityIcon, Add as AddIcon,
  Search as SearchIcon, FilterList as FilterIcon, Settings as SettingsIcon,
  PictureAsPdf as PdfIcon, Clear as ClearIcon, Close as CloseIcon
} from "@mui/icons-material";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCitas, createCita, updateCita, deleteCita } from "../../services/citasService";
import api from "../../api"; // Asegúrate de importar la instancia configurada de api
import { getPacientes, getAllPacientes } from "../../services/pacientesService";
import { getPersonalSalud, getAllPersonalSalud } from "../../services/personalService";
import { getEspecialidades, getAllEspecialidades } from "../../services/especialidadesService";
import { AuthContext } from "../../contexts/AuthContext";
import Swal from "sweetalert2";
import { jsPDF } from "jspdf";
import "jspdf-autotable";

export default function Citas() {
  const { user } = useContext(AuthContext);
  const [currentPage, setCurrentPage] = useState(1);
  const queryClient = useQueryClient();

  const [openModal, setOpenModal] = useState(false);
  const [viewMode, setViewMode] = useState(false); 
  const [selectedCita, setSelectedCita] = useState(null);

  // Usar una función para obtener hoy en formato Local de Perú/Sistema para evitar saltos de día por UTC
  const getTodayStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const hoyStr = getTodayStr();

  // Estados para búsqueda y filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [filterEstado, setFilterEstado] = useState("todos");
  const [filterFecha, setFilterFecha] = useState(hoyStr); // Filtrar por hoy por defecto
  const [filterEspecialidad, setFilterEspecialidad] = useState("todas");

  const [formData, setFormData] = useState({
    paciente_id: "",
    personal_salud_id: "",
    especialidad_id: "",
    fecha: new Date().toLocaleDateString('en-CA'),
    hora: "",
    estado: "pendiente",
    observaciones: "",
    nro_ticket: "",
    total_tickets_dia: 16
  });

  const [globalTotalTickets, setGlobalTotalTickets] = useState(16);

  // 1. Obtener última capacidad configurada para hoy (para persistencia)
  const { data: initialCapacidad } = useQuery({
    queryKey: ["capacidad-inicial", hoyStr],
    queryFn: async () => {
      try {
        const res = await api.get(`/citas?page=all&fecha=${hoyStr}`);
        const responseData = res.data?.data || res.data || [];
        const itemsList = Array.isArray(responseData) ? responseData : (Array.isArray(responseData.data) ? responseData.data : []);
        if (itemsList.length > 0) {
          // Si hay citas, tomamos el total_tickets_dia de la primera
          return parseInt(itemsList[0].total_tickets_dia) || 16;
        }
        return 16;
      } catch (err) { return 16; }
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (initialCapacidad) {
      setGlobalTotalTickets(initialCapacidad);
    }
  }, [initialCapacidad]);

  // Consulta para verificar si ya hay citas hoy y bloquear la edición del límite
  const { data: hasCitasHoyServer, refetch: refetchCheckHoy } = useQuery({
    queryKey: ["check-citas-hoy", hoyStr],
    queryFn: async () => {
      try {
        const res = await api.get(`/citas?page=all&fecha=${hoyStr}`);
        const responseData = res.data?.data || res.data || [];
        const itemsList = Array.isArray(responseData) ? responseData : (Array.isArray(responseData.data) ? responseData.data : []);
        return itemsList.length > 0;
      } catch (err) { return false; }
    },
    enabled: !!user,
    staleTime: 0
  });

  // Usamos una variable local para el estado de bloqueo
  const isLocked = hasCitasHoyServer || false;

  // Efecto para reiniciar a la página 1 cuando cambian los filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterEstado, filterFecha, filterEspecialidad]);

  const { data: citasData, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["citas", currentPage, filterFecha, searchTerm, filterEstado, filterEspecialidad],
    queryFn: () => getCitas(currentPage, filterFecha, searchTerm, filterEstado, filterEspecialidad),
    enabled: !!user,
  });

  const { data: especialidadesData } = useQuery({
    queryKey: ["especialidades_all"],
    queryFn: () => getAllEspecialidades().then(res => {
      const resp = res?.data || res;
      // Normalizamos para obtener solo el array de datos
      return Array.isArray(resp.data) ? resp.data : (Array.isArray(resp) ? resp : []);
    }),
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
  });
  const especialidadesList = Array.isArray(especialidadesData) ? especialidadesData : [];

  const { data: pacientesData } = useQuery({
    queryKey: ["pacientes_all"],
    queryFn: () => getAllPacientes(),
    enabled: !!user && openModal,
    staleTime: 5 * 60 * 1000,
  });

  const { data: personalData } = useQuery({
    queryKey: ["personal_all"],
    queryFn: () => getAllPersonalSalud().then(res => {
      const resp = res?.data || res;
      return Array.isArray(resp) ? resp : (Array.isArray(resp.data) ? resp.data : []);
    }),
    enabled: !!user && openModal,
    staleTime: 5 * 60 * 1000,
  });

  const isPersonalInShift = (personal, fecha) => {
    if (!fecha || !personal || !personal.horario_mensual) return false;
    
    try {
      const dateObj = new Date(fecha + 'T00:00:00');
      const diaDelMes = dateObj.getDate();
      
      let horarios = personal.horario_mensual;
      if (typeof horarios === 'string') {
        horarios = JSON.parse(horarios);
      }
      
      if (!Array.isArray(horarios)) return false;
      
      const horarioDelDia = horarios.find(h => parseInt(h.dia_numero) === diaDelMes);
      if (!horarioDelDia) return false;
      
      // Verificar si tiene al menos un turno ese día
      return !!(horarioDelDia.turno_m || horarioDelDia.turno_t || horarioDelDia.turno_n);
    } catch (e) {
      console.error('Error verificando turno:', e);
      return false;
    }
  };

  const getPersonalTurnoDetails = (personal, fecha) => {
    if (!fecha || !personal || !personal.horario_mensual) return null;
    
    try {
      const dateObj = new Date(fecha + 'T00:00:00');
      const diaDelMes = dateObj.getDate();
      
      let horarios = personal.horario_mensual;
      if (typeof horarios === 'string') {
        horarios = JSON.parse(horarios);
      }
      
      if (!Array.isArray(horarios)) return null;
      
      const horarioDelDia = horarios.find(h => parseInt(h.dia_numero) === diaDelMes);
      if (!horarioDelDia) return null;
      
      const turnos = [];
      if (horarioDelDia.turno_m) turnos.push({ tipo: 'M', codigo: horarioDelDia.turno_m });
      if (horarioDelDia.turno_t) turnos.push({ tipo: 'T', codigo: horarioDelDia.turno_t });
      if (horarioDelDia.turno_n) turnos.push({ tipo: 'N', codigo: horarioDelDia.turno_n });
      
      return turnos.length > 0 ? turnos : null;
    } catch (e) {
      console.error('Error obteniendo detalles del turno:', e);
      return null;
    }
  };

  const getTurnoColor = (tipo) => {
    switch(tipo) {
      case 'M': return '#FFD700'; // Amarillo para Mañana
      case 'T': return '#FF6B6B'; // Rojo para Tarde
      case 'N': return '#4A90E2'; // Azul para Noche
      default: return '#9E9E9E'; // Gris por defecto
    }
  };

  const filteredPacientes = useMemo(() => {
    const list = Array.isArray(pacientesData) ? pacientesData : [];
    // Excluir pacientes con historia clínica liberada
    return list.filter(p => {
      const hasOnlyHistoria =
        String(p.HistoriaClinica || '').trim().length > 0 &&
        !String(p.nombre || '').trim() &&
        !String(p.apellido || '').trim();
      const isLiberada = hasOnlyHistoria || (
        String(p.nombre || '').trim() === 'HC' &&
        String(p.apellido || '').trim() === 'LIBERADA'
      );
      return !isLiberada; // Excluir los liberados
    });
  }, [pacientesData]);

  const filteredPersonal = useMemo(() => {
    const list = Array.isArray(personalData) ? personalData : [];
    if (!formData.especialidad_id) return list;
    
    return list.filter(p => 
      String(p.especialidad_id) === String(formData.especialidad_id) || 
      (p.especialidad && String(p.especialidad.id) === String(formData.especialidad_id))
    );
  }, [personalData, formData.especialidad_id]);

  const mutationCreate = useMutation({
    mutationFn: createCita,
    onSuccess: () => {
      // Invalidamos inmediatamente para que el usuario vea el cambio
      queryClient.invalidateQueries({ queryKey: ["citas"] });
      queryClient.invalidateQueries({ queryKey: ["tickets-dia"] });
      queryClient.invalidateQueries({ queryKey: ["check-citas-hoy"] }); // Re-identificamos que hoy ya tiene actividad
      handleCloseModal();

      setTimeout(() => {
        Swal.fire({
          icon: 'success',
          title: '¡Cita Creada!',
          text: 'La cita se ha registrado correctamente en el sistema.',
          timer: 2000,
          showConfirmButton: false,
          heightAuto: false
        });
      }, 100);
    },
    onError: (err) => {
      console.error("DEBUG - Error completo del servidor:", err.response?.data);
      
      let msg = "Ocurrió un error inesperado. Por favor, intente de nuevo.";
      const serverData = err.response?.data;
      const status = err.response?.status;

      // 1. Errores de validación específicos (Campos obligatorios, duplicados, etc.)
      if (serverData?.errors) {
        const errorList = Object.values(serverData.errors).flat();
        msg = errorList[0]; // Mostrar el primer error de validación de forma clara
      } 
      // 2. Errores de Base de Datos (SQLSTATE) - Traducir a lenguaje humano
      else if (typeof serverData === 'string' && serverData.includes('SQLSTATE')) {
        if (serverData.includes('23503')) {
          msg = "Error de vinculación: El médico o el paciente seleccionado no son válidos en el sistema.";
        } else if (serverData.includes('23505')) {
          msg = "Este registro ya existe (DNI o Ticket duplicado).";
        } else {
          msg = "Error de base de datos: Los datos enviados no son compatibles.";
        }
      }
      // 3. Mensaje directo del servidor
      else if (serverData?.message) {
        msg = serverData.message;
      }

      // Traducciones comunes para la admisionista
      if (msg.includes('already been taken')) msg = "El número de ticket ya está ocupado para esta fecha.";
      if (msg.includes('paciente_id')) msg = "Debe seleccionar un paciente válido de la lista.";
      if (msg.includes('personal_salud_id')) msg = "Debe seleccionar un médico de la lista.";

      Swal.fire({
        icon: 'error',
        title: 'No se pudo registrar la cita',
        text: msg,
        confirmButtonColor: '#3085d6',
        heightAuto: false
      });
    }
  });

  const mutationUpdate = useMutation({
    mutationFn: (data) => updateCita(selectedCita.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["citas"] });
      queryClient.invalidateQueries({ queryKey: ["tickets-dia"] });
      handleCloseModal();

      setTimeout(() => {
        Swal.fire({
          icon: 'success',
          title: '¡Cita Actualizada!',
          text: 'Los cambios se han guardado correctamente.',
          timer: 2000,
          showConfirmButton: false,
          heightAuto: false
        });
      }, 100);
    },
    onError: (err) => {
      let msg = err.response?.data?.message || err.message;
      if (msg.includes('already been taken')) {
        msg = 'Este número de ticket ya está ocupado para esta fecha.';
      }

      Swal.fire({
        icon: 'error',
        title: 'Error al actualizar',
        text: msg,
        confirmButtonColor: '#3085d6',
        heightAuto: false
      });
    }
  });

  const mutationDelete = useMutation({
    mutationFn: deleteCita,
    onSuccess: async () => {
      // Invalida todas las consultas para asegurar que no quede nada en cache
      await queryClient.invalidateQueries({ queryKey: ["citas"] });
      await queryClient.invalidateQueries({ queryKey: ["tickets-dia"] });
      await queryClient.invalidateQueries({ queryKey: ["check-citas-hoy"] });
      
      // Forzar un refetch real y esperar a que complete
      await refetch();
      
      // Limpiar el estado de eliminación
      setDeleteConfirmOpen(false);
      setCitaToDelete(null);

      Swal.fire({
        icon: 'success',
        title: 'Eliminada',
        text: 'La cita ha sido eliminada correctamente.',
        timer: 1500,
        showConfirmButton: false,
        heightAuto: false
      });
    },
    onError: (err) => {
      setDeleteConfirmOpen(false);
      setCitaToDelete(null);

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: "No se pudo eliminar la cita: " + (err.response?.data?.message || err.message),
        confirmButtonColor: '#3085d6',
        heightAuto: false
      });
    }
  });

  const handleOpenCreate = () => {
    setSelectedCita(null);
    setViewMode(false);
    setFormData({
      paciente_id: "",
      personal_salud_id: "",
      especialidad_id: "",
      fecha: getTodayStr(),
      hora: "",
      estado: "pendiente",
      observaciones: "",
      nro_ticket: "",
      total_tickets_dia: globalTotalTickets
    });
    setOpenModal(true);
  };

  // Obtener tickets del día para autoincrementar real
  const { data: infoTicketsDia = { ocupados: [], total: 16, sugerido: 1 }, isLoading: isLoadingTickets } = useQuery({
    queryKey: ["tickets-dia", formData.fecha], // Quitamos personal_salud_id de la dependencia
    queryFn: async () => {
      if (!formData.fecha) {
        return { ocupados: [], total: 16, sugerido: 1 };
      }
      try {
        const res = await api.get(`/citas/next-ticket?fecha=${formData.fecha}`);
        const data = res.data?.data || {};
        
        return { 
          ocupados: [],
          total: data.total_tickets_dia || 16,
          sugerido: data.next_ticket || 1
        };
      } catch (err) {
        console.error("Error obteniendo siguiente ticket:", err);
        return { ocupados: [], total: 16, sugerido: 1 };
      }
    },
    enabled: !!formData.fecha && openModal,
    refetchOnWindowFocus: true,
    staleTime: 0
  });

  // Efecto para sincronizar el nro_ticket cuando infoTicketsDia cambie
  useEffect(() => {
    if (openModal && !selectedCita && infoTicketsDia?.sugerido) {
      setFormData(prev => ({ 
        ...prev, 
        nro_ticket: infoTicketsDia.sugerido,
        total_tickets_dia: infoTicketsDia.total
      }));
    }
  }, [infoTicketsDia?.sugerido, infoTicketsDia?.total, openModal, selectedCita]);

  const handleOpenEdit = (cita) => {
    setSelectedCita(cita);
    setViewMode(false);
    
    // Aseguramos que la hora solo tenga HH:mm para cumplir con la regex del backend
    let horaInput = cita.hora || "";
    if (horaInput.length > 5) {
      horaInput = horaInput.substring(0, 5);
    }

    setFormData({
      paciente_id: cita.paciente?.id || cita.paciente_id || "",
      personal_salud_id: cita.personal?.id || cita.personal_salud_id || "",
      especialidad_id: cita.especialidad?.id || cita.especialidad_id || "",
      fecha: cita.fecha ? cita.fecha.split("T")[0] : "",
      hora: horaInput,
      estado: cita.estado || "pendiente",
      observaciones: cita.observaciones || "",
      nro_ticket: cita.nro_ticket || ""
    });
    setOpenModal(true);
  };

  const handleOpenView = (cita) => {
    setSelectedCita(cita);
    setViewMode(true);

    let horaInput = cita.hora || "";
    if (horaInput.length > 5) {
      horaInput = horaInput.substring(0, 5);
    }

    setFormData({
      paciente_id: cita.paciente?.id || cita.paciente_id || "",
      personal_salud_id: cita.personal?.id || cita.personal_salud_id || "",
      especialidad_id: cita.especialidad?.id || cita.especialidad_id || "",
      fecha: cita.fecha ? cita.fecha.split("T")[0] : "",
      hora: horaInput,
      estado: cita.estado || "pendiente",
      observaciones: cita.observaciones || "",
      nro_ticket: cita.nro_ticket || ""
    });
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setSelectedCita(null);
  };

  const handleDelete = (id) => {
    Swal.fire({
      title: '¿Eliminar cita?',
      text: "Esta acción no se puede deshacer y liberará el número de ticket.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      heightAuto: false
    }).then((result) => {
      if (result.isConfirmed) {
        mutationDelete.mutate(id);
      }
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validaciones manuales antes de enviar
    if (!formData.paciente_id) {
      Swal.fire({
        icon: 'warning',
        title: 'Campo requerido',
        text: 'Debe seleccionar un paciente para la cita.',
        confirmButtonColor: '#3085d6',
        heightAuto: false
      });
      return;
    }

    if (!formData.fecha) {
      Swal.fire({
        icon: 'warning',
        title: 'Campo requerido',
        text: 'La fecha de la cita es obligatoria.',
        confirmButtonColor: '#3085d6',
        heightAuto: false
      });
      return;
    }

    if (!formData.especialidad_id) {
      Swal.fire({
        icon: 'warning',
        title: 'Campo requerido',
        text: 'Debe seleccionar la especialidad (UPS).',
        confirmButtonColor: '#3085d6',
        heightAuto: false
      });
      return;
    }

    if (!formData.nro_ticket) {
      Swal.fire({
        icon: 'warning',
        title: 'Error de Ticket',
        text: 'El número de ticket es obligatorio.',
        confirmButtonColor: '#3085d6',
        heightAuto: false
      });
      return;
    }
    
    // El backend requiere estrictamente HH:mm según su regex
    let formattedHora = formData.hora;
    if (formattedHora && formattedHora.length > 5) {
      formattedHora = formattedHora.substring(0, 5);
    }

    // Si el ticket no es un número, intentar usar el sugerido de la query como último recurso
    let ticketValue = parseInt(formData.nro_ticket);
    const totalValue = parseInt(globalTotalTickets);

    if (isNaN(ticketValue) && infoTicketsDia?.sugerido) {
      ticketValue = parseInt(infoTicketsDia.sugerido);
    }

    if (isNaN(ticketValue)) {
      Swal.fire({
        icon: 'error',
        title: 'Error de Ticket',
        text: 'El número de ticket no se ha generado correctamente. Por favor, asegúrese de seleccionar una fecha.',
        confirmButtonColor: '#3085d6',
        heightAuto: false
      });
      return;
    }

    const payload = {
      paciente_id: parseInt(formData.paciente_id),
      personal_salud_id: formData.personal_salud_id ? parseInt(formData.personal_salud_id) : null,
      especialidad_id: formData.especialidad_id ? parseInt(formData.especialidad_id) : null,
      fecha: formData.fecha,
      hora: formattedHora || null,
      estado: formData.estado.toLowerCase(),
      observaciones: formData.observaciones || "",
      nro_ticket: parseInt(ticketValue),
      total_tickets_dia: parseInt(totalValue),
      operador_id: user?.operador_id ? parseInt(user.operador_id) : null
    };

    console.log("DEBUG - Payload a enviar:", JSON.stringify(payload, null, 2));

    if (selectedCita) {
      mutationUpdate.mutate(payload);
    } else {
      mutationCreate.mutate(payload);
    }
  };

  const handleDownloadPDF = (cita) => {
    const doc = new jsPDF({
      unit: 'mm',
      format: [80, 140] // Aumentamos un poco el largo para incluir más datos
    });

    const centroSalud = "CENTRO DE SALUD DE SAN VICENTE DE CAÑETE";
    const fechaActual = new Date().toLocaleString();

    // Formatear fecha de la cita (quitar T05:00:00...)
    const fechaLimpia = cita.fecha ? cita.fecha.split('T')[0] : 'No definida';

    // Cabecera
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    // Dividir título largo si es necesario
    const splitTitle = doc.splitTextToSize(centroSalud, 70);
    doc.text(splitTitle, 40, 10, { align: "center" });
    
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("COMPROBANTE DE CITA MÉDICA", 40, 20, { align: "center" });
    doc.line(5, 22, 75, 22);

    // TICKET (Grande)
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(`TICKET N°: ${cita.nro_ticket}`, 40, 30, { align: "center" });
    
    // Cuerpo del ticket
    doc.setFontSize(9);
    doc.text(`ESPECIALIDAD:`, 5, 40);
    doc.setFont("helvetica", "normal");
    doc.text(`${cita.especialidad?.especialidad || cita.especialidad?.nombre || 'General'}`, 5, 45);

    doc.setFont("helvetica", "bold");
    doc.text(`PACIENTE:`, 5, 55);
    doc.setFont("helvetica", "normal");
    const pacienteNombre = `${cita.paciente?.apellido || ''}, ${cita.paciente?.nombre || ''}`;
    doc.text(pacienteNombre.length > 35 ? pacienteNombre.substring(0,35) + "..." : pacienteNombre, 5, 60);
    doc.text(`DNI: ${cita.paciente?.dni || cita.paciente?.DNI || '-'}`, 5, 65);
    doc.text(`H.C.: ${cita.paciente?.HistoriaClinica || cita.paciente?.historia_clinica || 'Sin registro'}`, 5, 70);

    doc.setFont("helvetica", "bold");
    doc.text(`FECHA CITA:`, 5, 80);
    doc.setFont("helvetica", "normal");
    doc.text(`${fechaLimpia}`, 5, 85);

    doc.setFont("helvetica", "bold");
    doc.text(`HORA:`, 45, 80);
    doc.setFont("helvetica", "normal");
    doc.text(`${cita.hora || '--:--'}`, 45, 85);

    doc.setFont("helvetica", "bold");
    doc.text(`MÉDICO / CONSULTORIO:`, 5, 95);
    doc.setFont("helvetica", "normal");
    const medicoNombre = `${cita.personal_salud?.nombres} ${cita.personal_salud?.apellidos}`  || 'POR ASIGNAR';
    doc.text(medicoNombre, 5, 100);

    doc.setFont("helvetica", "bold");
    doc.text(`ADMISIONISTA:`, 5, 110);
    doc.setFont("helvetica", "normal");
    doc.text(`${cita.operador?.nombre} ${cita.operador?.apellido || 'Admisión'}`, 5, 115);

    doc.line(5, 120, 75, 120);
    doc.setFontSize(7);
    doc.text("Por favor estar 15 minutos antes de su cita.", 40, 125, { align: "center" });
    doc.text(`Emitido: ${fechaActual}`, 40, 130, { align: "center" });

    doc.save(`Ticket_Cita_${cita.nro_ticket}.pdf`);
    
    Swal.fire({
      icon: 'success',
      title: 'PDF Generado',
      text: 'El ticket se ha descargado.',
      timer: 1500,
      showConfirmButton: false,
      heightAuto: false
    });
  };

  // Con los cambios en el backend, la estructura es directa de Laravel Pagination
  const items = Array.isArray(citasData?.data) ? citasData.data : [];
  const totalPages = citasData?.last_page || 1;
  
  const getEstadoColor = (estado) => {
    switch (estado?.toString().toLowerCase()) {
      case "pendiente": return "warning";
      case "completada": return "success";
      case "cancelada": return "error";
      default: return "default";
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h5" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <CalendarIcon /> Gestión de Citas {isFetching && <CircularProgress size={20} />}
        </Typography>
        <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
          <Tooltip title={isLocked ? "No se puede cambiar el límite porque ya se emitieron tickets hoy" : "Establecer límite de atención para hoy"}>
            <TextField
              label="Capacidad Diaria"
              type="number"
              size="small"
              value={globalTotalTickets}
              onChange={(e) => setGlobalTotalTickets(parseInt(e.target.value) || 1)}
              disabled={isLocked}
              sx={{ 
                width: 150,
                "& .MuiInputBase-input.Mui-disabled": {
                  WebkitTextFillColor: "#d32f2f",
                  fontWeight: "bold"
                }
              }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SettingsIcon fontSize="small" color={isLocked ? "error" : "action"} />
                    </InputAdornment>
                  ),
                }
              }}
            />
          </Tooltip>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={() => refetch()} disabled={isFetching}>Actualizar</Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate} color="primary">Nueva Cita</Button>
        </Box>
      </Stack>

      <Paper variant="outlined" sx={{ p: 2, mb: 3, bgcolor: "#fcfcfc" }}>
        <Grid container spacing={2} sx={{ alignItems: "center" }}>
          <Grid size={{ xs: 12, md: 3 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Buscar por paciente o DNI..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: <SearchIcon sx={{ color: "action.active", mr: 1 }} fontSize="small" />,
                }
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <TextField
              select
              fullWidth
              size="small"
              label="Estado"
              value={filterEstado}
              onChange={(e) => setFilterEstado(e.target.value)}
            >
              <MenuItem value="todos">Todos los estados</MenuItem>
              <MenuItem value="pendiente">Pendiente</MenuItem>
              <MenuItem value="completada">Completada</MenuItem>
              <MenuItem value="cancelada">Cancelada</MenuItem>
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              fullWidth
              size="small"
              type="date"
              label="Filtrar por Fecha"
              value={filterFecha}
              onChange={(e) => setFilterFecha(e.target.value)}
              slotProps={{ 
                inputLabel: { shrink: true },
                input: {
                  endAdornment: filterFecha && (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={() => setFilterFecha("")}
                        edge="end"
                      >
                        <ClearIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  )
                }
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              select
              fullWidth
              size="small"
              label="Especialidad"
              value={filterEspecialidad}
              onChange={(e) => setFilterEspecialidad(e.target.value)}
            >
              <MenuItem value="todas">Todas las especialidades</MenuItem>
              {especialidadesList.map((esp) => (
                <MenuItem key={esp.id} value={esp.id}>
                  {esp.especialidad}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, md: 1 }}>
            <Button 
              fullWidth 
              variant="text" 
              size="small" 
              color="inherit" 
              onClick={() => { 
                setSearchTerm(""); 
                setFilterEstado("todos"); 
                setFilterFecha(hoyStr); 
                setFilterEspecialidad("todas");
                setCurrentPage(1);
              }}
              startIcon={<FilterIcon />}
              sx={{ minWidth: 0 }}
            >
              Limpiar
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error.message || "Error al cargar citas"}</Alert>}

      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Paciente</TableCell>
              <TableCell>Personal</TableCell>
              <TableCell>Especialidad</TableCell>
              <TableCell>Fecha y Hora</TableCell>
              <TableCell>Operador</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>N° de ticket</TableCell>
              <TableCell>Observaciones</TableCell>
              <TableCell align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              [...Array(5)].map((_, i) => <TableRow key={i}><TableCell colSpan={7}><Skeleton height={40} /></TableCell></TableRow>)
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                  <Typography variant="body1" color="textSecondary">No hay citas registradas para mostrar.</Typography>
                </TableCell>
              </TableRow>
            ) : (
              items.map((cita) => (
                <TableRow key={cita.id} hover>
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Avatar sx={{ width: 28, height: 28, fontSize: "0.75rem", bgcolor: "primary.main" }}>
                        {cita.paciente?.nombre?.[0] || "P"}
                      </Avatar>
                      <Box>
                        <Typography variant="body2">{cita.paciente?.nombre} {cita.paciente?.apellido}</Typography>
                        {cita.paciente?.estado === 'Archivado' && (
                          <Chip 
                            label="Historial Archivado" 
                            size="small" 
                            color="error"
                            variant="outlined"
                            sx={{ 
                              height: 16, 
                              fontSize: '0.6rem', 
                              mt: 0.2, 
                              fontWeight: 'bold',
                              borderColor: 'error.main'
                            }} 
                          />
                        )}
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{cita.personal_salud?.nombres} {cita.personal_salud?.apellidos}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={cita.personal_salud?.cargo || "General"} size="small" variant="outlined" sx={{ fontSize: "0.7rem" }} />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">
                      {(() => {
                        if (!cita.fecha) return "-";
                        // Limpiamos la fecha por si viene con la parte de la hora (ISO string)
                        const cleanDate = cita.fecha.split("T")[0];
                        const dateObj = new Date(cleanDate + "T00:00:00");
                        return isNaN(dateObj) ? cita.fecha : dateObj.toLocaleDateString();
                      })()}
                      <Box component="span" sx={{ display: "block", fontSize: "0.75rem", color: "text.secondary", fontWeight: "normal" }}>
                         {cita.hora || "-"}
                      </Box>
                    </Typography>
                  </TableCell>
                  <TableCell><Typography variant="body2">{cita.operador?.nombre || cita.operador?.name} {cita.operador?.apellido}</Typography></TableCell>
                  <TableCell>
                    <Chip label={cita.estado || "pendiente"} color={getEstadoColor(cita.estado)} size="small" sx={{ minWidth: 80, fontSize: "0.7rem", textTransform: "capitalize" }} />
                  </TableCell>
                  <TableCell>
                      <Chip label={cita.nro_ticket}/>
                  </TableCell>
                  <TableCell>
                      <Chip label={cita.observaciones  || "Ninguna observación" } />
                  </TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={0.5} sx={{ justifyContent: "center" }}>
                      <Tooltip title="Imprimir Ticket">
                        <IconButton size="small" color="secondary" onClick={() => handleDownloadPDF(cita)}>
                          <PdfIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <IconButton size="small" color="info" onClick={() => handleOpenView(cita)}><VisibilityIcon fontSize="small" /></IconButton>
                      <IconButton size="small" color="primary" onClick={() => handleOpenEdit(cita)}><EditIcon fontSize="small" /></IconButton>
                      <IconButton size="small" color="error" onClick={() => handleDelete(cita.id)}><DeleteIcon fontSize="small" /></IconButton>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ mt: 3, display: "flex", justifyContent: "center" }}>
        <Pagination count={totalPages} page={currentPage} onChange={(_, v) => setCurrentPage(v)} color="primary" disabled={isFetching} size="small" />
      </Box>

      <Dialog 
        open={openModal} 
        onClose={handleCloseModal} 
        maxWidth="md" 
        fullWidth
        disableEnforceFocus // Evita conflictos de foco con SweetAlert2
        disableRestoreFocus // Evita conflictos de foco con SweetAlert2
      >
        <form onSubmit={handleSubmit} noValidate>
          <DialogTitle sx={{ bgcolor: viewMode ? "info.main" : (selectedCita ? "primary.main" : "success.main"), color: "white", py: 2, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <CalendarIcon />
              {viewMode ? "Detalles de la Cita" : (selectedCita ? "Modificar Cita" : "Programar Nueva Cita")}
            </Box>
            <IconButton size="small" onClick={handleCloseModal} sx={{ color: "white" }}>
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers sx={{ bgcolor: "#f8f9fa", p: 4 }}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
              
              <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
                <Typography variant="subtitle2" color="primary" sx={{ fontWeight: "bold", mb: 3, borderBottom: "2px solid #primary.main", pb: 1, textTransform: "uppercase", letterSpacing: 1 }}>DATOS DEL PACIENTE Y REGISTRO</Typography>
                <Grid container spacing={3}>
                  <Grid size={12}>
                    <Autocomplete
                      sx={{ minWidth: 230 }}
                      options={filteredPacientes}
                      getOptionLabel={(p) => `${p.nombre || ''} ${p.apellido || ''} — DNI: ${p.dni || p.DNI || p.documento || ''}`}
                      value={filteredPacientes.find(p => String(p.id) === String(formData.paciente_id)) || null}
                      disabled={viewMode}
                      onChange={(event, newValue) => {
                        console.log("Paciente seleccionado:", newValue);
                        setFormData({ ...formData, paciente_id: newValue ? newValue.id : "" });
                      }}
                      renderInput={(params) => (
                        <TextField 
                          {...params}
                          label="Buscar Paciente" 
                          placeholder="Escriba nombre o DNI..."
                          required
                          error={!formData.paciente_id && !viewMode}
                          helperText={!formData.paciente_id && !viewMode ? "Debe seleccionar un paciente de la lista" : ""}
                        />
                      )}
                      noOptionsText="No se encontraron pacientes"
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField 
                      fullWidth 
                      label="Operador del Sistema" 
                      value={user ? `${user.nombre || user.name || ""} ${user.apellido || ""}` : "Sistema"} 
                      disabled 
                      slotProps={{ input: { readOnly: true, sx: { bgcolor: "#f5f5f5" } } }} 
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField 
                      fullWidth
                      label="N° Ticket Asignado"
                      value={formData.fecha ? `Ticket ${formData.nro_ticket} / ${globalTotalTickets}` : "Seleccione fecha..."}
                      disabled
                      slotProps={{ input: { readOnly: true, sx: { bgcolor: "#e3f2fd", fontWeight: "bold", color: "primary.dark" } } }}
                      helperText={formData.nro_ticket > globalTotalTickets ? "¡Aviso: Cupo extra!" : "Asignación automática"}
                    />
                  </Grid>
                </Grid>
              </Paper>

              <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
                <Typography variant="subtitle2" color="primary" sx={{ fontWeight: "bold", mb: 3, borderBottom: "2px solid #primary.main", pb: 1, textTransform: "uppercase", letterSpacing: 1 }}>PROGRAMACIÓN DE CITA</Typography>
                <Grid container spacing={3}>
                  <Grid size={12}>
                    <TextField 
                      fullWidth 
                      label="Fecha de la Cita" 
                      type="date" 
                      slotProps={{ inputLabel: { shrink: true } }} 
                      value={formData.fecha} 
                      disabled={viewMode} 
                      onChange={(e) => setFormData({ ...formData, fecha: e.target.value })} 
                    />
                  </Grid>
                  <Grid size={12}>
                    <TextField 
                      fullWidth 
                      label="Hora de Atención" 
                      type="time" 
                      slotProps={{ inputLabel: { shrink: true } }} 
                      value={formData.hora} 
                      disabled={viewMode} 
                      onChange={(e) => setFormData({ ...formData, hora: e.target.value })} 
                    />
                  </Grid>
                  <Grid size={12}>
                    <FormControl fullWidth>
                      <InputLabel>Estado de la Cita</InputLabel>
                      <Select 
                        value={formData.estado} 
                        label="Estado de la Cita" 
                        disabled={viewMode} 
                        onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                      >
                        <MenuItem value="pendiente">Pendiente</MenuItem>
                        <MenuItem value="completada">Completada</MenuItem>
                        <MenuItem value="cancelada">Cancelada</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </Paper>

              <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
                <Typography variant="subtitle2" color="primary" sx={{ fontWeight: "bold", mb: 3, borderBottom: "2px solid #primary.main", pb: 1, textTransform: "uppercase", letterSpacing: 1 }}>ASIGNACIÓN MÉDICA</Typography>
                <Grid container spacing={3}>
                  <Grid size={12}>
                    <Autocomplete
                      sx={{ minWidth: 230 }}
                      options={Array.isArray(especialidadesData) ? especialidadesData : []}
                      getOptionLabel={(esp) => `${esp.especialidad || esp.nombre || ''}`}
                      value={Array.isArray(especialidadesData) ? especialidadesData.find(esp => String(esp.id) === String(formData.especialidad_id)) || null : null}
                      disabled={viewMode}
                      onChange={(event, newValue) => {
                        console.log("Especialidad seleccionada:", newValue);
                        setFormData({ 
                          ...formData, 
                          especialidad_id: newValue ? newValue.id : "",
                          personal_salud_id: "" // Limpiar médico al cambiar especialidad
                        });
                      }}
                      renderInput={(params) => (
                        <TextField 
                          {...params} 
                          label="1. Seleccionar Especialidad (UPS)" 
                          placeholder="Filtra por especialidad primero..."
                        />
                      )}
                      noOptionsText="No se encontraron especialidades"
                    />
                  </Grid>
                  <Grid size={12}>
                    <Autocomplete
                      sx={{ minWidth: 230 }}
                      options={filteredPersonal}
                      getOptionLabel={(p) => {
                        const cargo = p.cargo ? `(${p.cargo})` : '';
                        return `${p.nombres || ''} ${p.apellidos || ''} ${cargo}`;
                      }}
                      isOptionEqualToValue={(option, value) => option.id === value.id}
                      value={filteredPersonal.find(p => String(p.id) === String(formData.personal_salud_id)) || null}
                      disabled={viewMode || (!formData.especialidad_id && filteredPersonal.length === 0)}
                      onChange={(event, newValue) => {
                        console.log("Médico seleccionado:", newValue);
                        setFormData({ ...formData, personal_salud_id: newValue ? newValue.id : "" });
                      }}
                      renderOption={(props, option) => {
                        const turnoDetails = getPersonalTurnoDetails(option, formData.fecha);
                        return (
                          <li {...props} key={option.id}>
                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", gap: 2 }}>
                              <Typography>
                                {option.nombres || ''} {option.apellidos || ''} {option.cargo ? `(${option.cargo})` : ''}
                              </Typography>
                              {turnoDetails && (
                                <Box sx={{ display: "flex", gap: 0.5 }}>
                                  {turnoDetails.map((turno, idx) => (
                                    <Chip
                                      key={idx}
                                      size="small"
                                      label={`${turno.tipo}: ${turno.codigo}`}
                                      sx={{
                                        backgroundColor: getTurnoColor(turno.tipo),
                                        color: turno.tipo === 'M' ? "#333" : "#fff",
                                        fontWeight: 500,
                                        borderRadius: 1
                                      }}
                                    />
                                  ))}
                                </Box>
                              )}
                            </Box>
                          </li>
                        );
                      }}
                      renderInput={(params) => (
                        <TextField 
                          {...params} 
                          label="2. Buscar Médico Tratante" 
                          placeholder={formData.especialidad_id ? "Seleccione especialista..." : "Seleccione especialidad primero"}
                          helperText={!formData.especialidad_id ? "Seleccione una especialidad para ver los médicos disponibles" : ""}
                        />
                      )}
                      noOptionsText={formData.especialidad_id ? "No hay médicos en esta especialidad" : "Seleccione una especialidad"}
                    />
                  </Grid>
                </Grid>
              </Paper>
              
              <TextField 
                fullWidth 
                label="Observaciones Médicas" 
                multiline 
                rows={4} 
                value={formData.observaciones} 
                disabled={viewMode} 
                onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })} 
                placeholder="Añadir notas relevantes sobre la cita..." 
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ py: 3, px: 4, bgcolor: "#f8f9fa" }}>
            <Button onClick={handleCloseModal} color="inherit" sx={{ px: 4 }}>{viewMode ? "Cerrar" : "Cancelar"}</Button>
            {!viewMode && <Button type="submit" variant="contained" color={selectedCita ? "primary" : "success"} sx={{ px: 4 }}>{selectedCita ? "Actualizar Cita" : "Guardar Cita"}</Button>}
          </DialogActions>
        </form>
      </Dialog>
    </Paper>
  );
}
