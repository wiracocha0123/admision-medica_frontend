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
  Search as SearchIcon, FilterList as FilterIcon, Settings as SettingsIcon
} from "@mui/icons-material";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCitas, createCita, updateCita, deleteCita } from "../../services/citasService";
import api from "../../api"; // Asegúrate de importar la instancia configurada de api
import { getPacientes } from "../../services/pacientesService";
import { getPersonalSalud } from "../../services/personalService";
import { getEspecialidades } from "../../services/especialidadesService";
import { AuthContext } from "../../contexts/AuthContext";
import Swal from "sweetalert2";

export default function Citas() {
  const { user } = useContext(AuthContext);
  const [currentPage, setCurrentPage] = useState(1);
  const queryClient = useQueryClient();

  const [openModal, setOpenModal] = useState(false);
  const [viewMode, setViewMode] = useState(false); 
  const [selectedCita, setSelectedCita] = useState(null);

  // Estados para búsqueda y filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [filterEstado, setFilterEstado] = useState("todos");
  const [filterFecha, setFilterFecha] = useState("");
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
  
  // Usar una función para obtener hoy en formato Local de Perú/Sistema para evitar saltos de día por UTC
  const getTodayStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const hoyStr = getTodayStr();

  // 1. Obtener última capacidad configurada para hoy (para persistencia)
  const { data: initialCapacidad } = useQuery({
    queryKey: ["capacidad-inicial", hoyStr],
    queryFn: async () => {
      try {
        const res = await api.get(`/citas?page=all&fecha=${hoyStr}`);
        const responseData = res.data?.data?.data || res.data?.data || res.data || [];
        const itemsList = Array.isArray(responseData) ? responseData : [];
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
        const responseData = res.data?.data?.data || res.data?.data || res.data || [];
        const itemsList = Array.isArray(responseData) ? responseData : [];
        return itemsList.length > 0;
      } catch (err) { return false; }
    },
    enabled: !!user,
    staleTime: 0
  });

  // Usamos una variable local para el estado de bloqueo
  const isLocked = hasCitasHoyServer || false;

  const { data: citasData, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["citas", currentPage],
    queryFn: () => getCitas(currentPage),
    enabled: !!user,
  });

  const { data: especialidadesData } = useQuery({
    queryKey: ["especialidades_all"],
    queryFn: () => getEspecialidades(1).then(res => {
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
    queryFn: () => getPacientes(1).then(res => {
      const resp = res?.data || res;
      return Array.isArray(resp.data) ? resp.data : (Array.isArray(resp) ? resp : []);
    }),
    enabled: !!user && openModal,
  });

  const { data: personalData } = useQuery({
    queryKey: ["personal_all"],
    queryFn: () => getPersonalSalud(1).then(res => {
      const resp = res?.data || res;
      return Array.isArray(resp.data) ? resp.data : (Array.isArray(resp) ? resp : []);
    }),
    enabled: !!user && openModal,
  });

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
      let msg = err.response?.data?.message || err.message;
      if (msg.includes('already been taken')) {
        msg = 'Este número de ticket ya está ocupado para esta fecha.';
      } else if (msg.includes('paciente_id')) {
        msg = 'Debe seleccionar un paciente válido.';
      }
      
      Swal.fire({
        icon: 'error',
        title: 'Error al crear cita',
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

    // Si es edición, permitimos que algunos campos sean opcionales si ya tenían datos
    const payload = {
      paciente_id: formData.paciente_id,
      personal_salud_id: formData.personal_salud_id || null,
      especialidad_id: formData.especialidad_id || null,
      fecha: formData.fecha,
      hora: formattedHora || null,
      estado: formData.estado.toLowerCase(),
      observaciones: formData.observaciones,
      nro_ticket: ticketValue,
      total_tickets_dia: totalValue,
      operador_id: user?.id
    };
    if (selectedCita) {
      mutationUpdate.mutate(payload);
    } else {
      mutationCreate.mutate(payload);
    }
  };

  const paginationData = citasData?.data || citasData || {};
  const allItems = Array.isArray(paginationData.data) ? paginationData.data : (Array.isArray(paginationData) ? paginationData : []);
  
  // Filtrado local (Considerando que el backend no soporta filtros por ahora)
  const items = allItems.filter(cita => {
    const matchesSearch = 
      (cita.paciente?.nombre?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (cita.paciente?.apellido?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (cita.paciente?.dni?.includes(searchTerm));
    
    const matchesEstado = filterEstado === "todos" || cita.estado?.toLowerCase() === filterEstado.toLowerCase();
    
    const matchesFecha = !filterFecha || (cita.fecha && cita.fecha.startsWith(filterFecha));

    const matchesEspecialidad = filterEspecialidad === "todas" || cita.especialidad_id?.toString() === filterEspecialidad.toString();

    return matchesSearch && matchesEstado && matchesFecha && matchesEspecialidad;
  });

  const totalPages = paginationData.last_page || 1;

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
              slotProps={{ inputLabel: { shrink: true } }}
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
                  {esp.UPS}
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
                setFilterFecha(""); 
                setFilterEspecialidad("todas");
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
                      <Typography variant="body2">{cita.paciente?.nombre} {cita.paciente?.apellido}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{cita.personal_salud?.nombres} {cita.personal_salud?.apellidos}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={cita.especialidad?.UPS || "General"} size="small" variant="outlined" sx={{ fontSize: "0.7rem" }} />
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

      <Dialog open={openModal} onClose={handleCloseModal} maxWidth="md" fullWidth>
        <form onSubmit={handleSubmit} noValidate>
          <DialogTitle sx={{ bgcolor: viewMode ? "info.main" : (selectedCita ? "primary.main" : "success.main"), color: "white", py: 2, display: "flex", alignItems: "center", gap: 1 }}>
            <CalendarIcon />
            {viewMode ? "Detalles de la Cita" : (selectedCita ? "Modificar Cita" : "Programar Nueva Cita")}
          </DialogTitle>
          <DialogContent dividers sx={{ bgcolor: "#f8f9fa", p: 4 }}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
              
              <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
                <Typography variant="subtitle2" color="primary" sx={{ fontWeight: "bold", mb: 3, borderBottom: "2px solid #primary.main", pb: 1, textTransform: "uppercase", letterSpacing: 1 }}>DATOS DEL PACIENTE Y REGISTRO</Typography>
                <Grid container spacing={3}>
                  <Grid size={12}>
                    <Autocomplete
                      sx={{ minWidth: 230 }}
                      options={Array.isArray(pacientesData) ? pacientesData : []}
                      getOptionLabel={(p) => `${p.nombre} ${p.apellido} — DNI: ${p.dni || p.documento}`}
                      value={Array.isArray(pacientesData) ? pacientesData.find(p => p.id === formData.paciente_id) || null : null}
                      disabled={viewMode}
                      onChange={(event, newValue) => {
                        setFormData({ ...formData, paciente_id: newValue ? newValue.id : "" });
                      }}
                      renderInput={(params) => (
                        <TextField 
                          {...params}
                          label="Buscar Paciente" 
                          placeholder="Escriba nombre o DNI..."
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
                <Typography variant="subtitle2" color="primary" sx={{ fontWeight: "bold", mb: 3, borderBottom: "2px solid #primary.main", pb: 1, textTransform: "uppercase", letterSpacing: 1 }}>ASIGNACIÓN MÉDICA</Typography>
                <Grid container spacing={3}>
                  <Grid size={12}>
                    <Autocomplete
                      sx={{ minWidth: 230 }}
                      options={Array.isArray(especialidadesData) ? especialidadesData : []}
                      getOptionLabel={(esp) => `${esp.UPS} — ${esp.especialidad}`}
                      value={Array.isArray(especialidadesData) ? especialidadesData.find(esp => esp.id === formData.especialidad_id) || null : null}
                      disabled={viewMode}
                      onChange={(event, newValue) => {
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
                      getOptionLabel={(p) => `${p.nombres} ${p.apellidos}${p.especialidad ? ` (${p.especialidad.UPS || p.especialidad.especialidad})` : ""}`}
                      value={filteredPersonal.find(p => p.id === formData.personal_salud_id) || null}
                      disabled={viewMode || (!formData.especialidad_id && filteredPersonal.length === 0)}
                      onChange={(event, newValue) => {
                        setFormData({ ...formData, personal_salud_id: newValue ? newValue.id : "" });
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
