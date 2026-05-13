import React, { useState, useContext } from "react";
import { 
  Paper, Typography, Table, TableBody, TableCell, TableHead, TableRow, Button, Box, 
  CircularProgress, Alert, TableContainer, Skeleton, Chip, Pagination, Stack, Avatar, 
  IconButton, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions, TextField, 
  MenuItem, Grid, FormControl, InputLabel, Select, Divider
} from "@mui/material";
import { 
  Refresh as RefreshIcon, CalendarMonth as CalendarIcon, Edit as EditIcon, 
  Delete as DeleteIcon, Visibility as VisibilityIcon, Add as AddIcon 
} from "@mui/icons-material";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCitas, createCita, updateCita, deleteCita } from "../../services/citasService";
import { getPacientes } from "../../services/pacientesService";
import { getPersonalSalud } from "../../services/personalService";
import { getEspecialidades } from "../../services/especialidadesService";
import { AuthContext } from "../../contexts/AuthContext";

export default function Citas() {
  const { user } = useContext(AuthContext);
  const [currentPage, setCurrentPage] = useState(1);
  const queryClient = useQueryClient();

  const [openModal, setOpenModal] = useState(false);
  const [viewMode, setViewMode] = useState(false); 
  const [selectedCita, setSelectedCita] = useState(null);

  const [formData, setFormData] = useState({
    paciente_id: "",
    personal_salud_id: "",
    especialidad_id: "",
    fecha: "",
    hora: "",
    estado: "pendiente",
    observaciones: "",
    nro_ticket: ""
  });

  const { data: citasData, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["citas", currentPage],
    queryFn: () => getCitas(currentPage),
    enabled: !!user,
  });

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

  const { data: especialidadesData } = useQuery({
    queryKey: ["especialidades_all"],
    queryFn: () => getEspecialidades(1).then(res => {
      const resp = res?.data || res;
      return Array.isArray(resp.data) ? resp.data : (Array.isArray(resp) ? resp : []);
    }),
    enabled: !!user && openModal,
  });

  const mutationCreate = useMutation({
    mutationFn: createCita,
    onSuccess: () => {
      queryClient.invalidateQueries(["citas"]);
      handleCloseModal();
    }
  });

  const mutationUpdate = useMutation({
    mutationFn: (data) => updateCita(selectedCita.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["citas"]);
      handleCloseModal();
    }
  });

  const mutationDelete = useMutation({
    mutationFn: deleteCita,
    onSuccess: () => {
      queryClient.invalidateQueries(["citas"]);
    }
  });

  const handleOpenCreate = () => {
    setSelectedCita(null);
    setViewMode(false);
    setFormData({
      paciente_id: "",
      personal_salud_id: "",
      especialidad_id: "",
      fecha: "",
      hora: "",
      estado: "pendiente",
      observaciones: "",
      nro_ticket: ""
    });
    setOpenModal(true);
  };

  const handleOpenEdit = (cita) => {
    setSelectedCita(cita);
    setViewMode(false);
    setFormData({
      paciente_id: cita.paciente_id || "",
      personal_salud_id: cita.personal_salud_id || "",
      especialidad_id: cita.especialidad_id || "",
      fecha: cita.fecha ? cita.fecha.split("T")[0] : "",
      hora: cita.hora || "",
      estado: cita.estado || "pendiente",
      observaciones: cita.observaciones || "",
      nro_ticket: cita.nro_ticket || ""
    });
    setOpenModal(true);
  };

  const handleOpenView = (cita) => {
    setSelectedCita(cita);
    setViewMode(true);
    setFormData({
      paciente_id: cita.paciente_id || "",
      personal_salud_id: cita.personal_salud_id || "",
      especialidad_id: cita.especialidad_id || "",
      fecha: cita.fecha ? cita.fecha.split("T")[0] : "",
      hora: cita.hora || "",
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
    if (window.confirm("¿Está seguro de eliminar esta cita?")) {
      mutationDelete.mutate(id);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      operador_id: user?.id,
      estado: formData.estado.toLowerCase()
    };
    if (selectedCita) {
      mutationUpdate.mutate(payload);
    } else {
      mutationCreate.mutate(payload);
    }
  };

  const paginationData = citasData?.data || citasData || {};
  const items = Array.isArray(paginationData.data) ? paginationData.data : (Array.isArray(paginationData) ? paginationData : []);
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
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={() => refetch()} disabled={isFetching}>Actualizar</Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate} color="primary">Nueva Cita</Button>
        </Box>
      </Stack>

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
                      {cita.fecha ? new Date(cita.fecha).toLocaleDateString() : "-"}
                      <Box component="span" sx={{ display: "block", fontSize: "0.75rem", color: "text.secondary", fontWeight: "normal" }}>
                         {cita.hora || "-"}
                      </Box>
                    </Typography>
                  </TableCell>
                  <TableCell><Typography variant="body2">{cita.operador?.nombre || cita.operador?.name || "Admin"} </Typography></TableCell>
                  <TableCell>
                    <Chip label={cita.estado || "pendiente"} color={getEstadoColor(cita.estado)} size="small" sx={{ minWidth: 80, fontSize: "0.7rem", textTransform: "capitalize" }} />
                  </TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={0.5} justifyContent="center">
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
        <form onSubmit={handleSubmit}>
          <DialogTitle sx={{ bgcolor: viewMode ? "info.main" : (selectedCita ? "primary.main" : "success.main"), color: "white", py: 2, display: "flex", alignItems: "center", gap: 1 }}>
            <CalendarIcon />
            {viewMode ? "Detalles de la Cita" : (selectedCita ? "Modificar Cita" : "Programar Nueva Cita")}
          </DialogTitle>
          <DialogContent dividers sx={{ bgcolor: "#f8f9fa", p: 4 }}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
              
              <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
                <Typography variant="subtitle2" color="primary" sx={{ fontWeight: "bold", mb: 3, borderBottom: "2px solid #primary.main", pb: 1, textTransform: "uppercase", letterSpacing: 1 }}>DATOS DEL PACIENTE Y REGISTRO</Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <FormControl sx={{ width: "100%", maxWidth: 650, minWidth: 220 }} required>
                      <InputLabel>Paciente</InputLabel>
                      <Select 
                        value={formData.paciente_id} 
                        label="Paciente" 
                        disabled={viewMode} 
                        onChange={(e) => setFormData({ ...formData, paciente_id: e.target.value })}
                        sx={{ 
                          width: "100%",
                          ".MuiSelect-select": { py: 2 } 
                        }}
                      >
                        {Array.isArray(pacientesData) && pacientesData.map(p => (
                          <MenuItem key={p.id} value={p.id} sx={{ py: 1.5 }}>
                            {p.nombre} {p.apellido} — DNI: {p.dni || p.documento}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField 
                      fullWidth 
                      label="Operador del Sistema" 
                      value={user ? `${user.nombre || user.name || ""} ${user.apellido || ""}` : "Sistema"} 
                      disabled 
                      slotProps={{ input: { readOnly: true, sx: { bgcolor: "#f5f5f5" } } }} 
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField 
                      fullWidth 
                      label="N° Ticket de Atención" 
                      value={formData.nro_ticket} 
                      disabled={viewMode} 
                      onChange={(e) => setFormData({ ...formData, nro_ticket: e.target.value })} 
                    />
                  </Grid>
                </Grid>
              </Paper>

              <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
                <Typography variant="subtitle2" color="primary" sx={{ fontWeight: "bold", mb: 3, borderBottom: "2px solid #primary.main", pb: 1, textTransform: "uppercase", letterSpacing: 1 }}>ASIGNACIÓN MÉDICA</Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <FormControl sx={{ width: "100%", maxWidth: 650, minWidth: 220 }} required>
                      <InputLabel>Médico Tratante</InputLabel>
                      <Select 
                        value={formData.personal_salud_id} 
                        label="Médico Tratante" 
                        disabled={viewMode} 
                        onChange={(e) => setFormData({ ...formData, personal_salud_id: e.target.value })}
                        sx={{ 
                          width: "100%",
                          ".MuiSelect-select": { py: 2 } 
                        }}
                      >
                        {Array.isArray(personalData) && personalData.map(p => (
                          <MenuItem key={p.id} value={p.id} sx={{ py: 1.5 }}>{p.nombres} {p.apellidos}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <FormControl sx={{ width: "100%", maxWidth: 650, minWidth: 220 }} required>
                      <InputLabel>Especialidad</InputLabel>
                      <Select 
                        value={formData.especialidad_id} 
                        label="Especialidad"
                        disabled={viewMode} 
                        onChange={(e) => setFormData({ ...formData, especialidad_id: e.target.value })}
                        sx={{ 
                          width: "100%",
                          ".MuiSelect-select": { py: 2 } 
                        }}
                      >
                        {Array.isArray(especialidadesData) && especialidadesData.map(esp => (
                          <MenuItem key={esp.id} value={esp.id} sx={{ py: 1.5 }}>{esp.UPS} — {esp.nombre_especialidad}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </Paper>

              <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
                <Typography variant="subtitle2" color="primary" sx={{ fontWeight: "bold", mb: 3, borderBottom: "2px solid #primary.main", pb: 1, textTransform: "uppercase", letterSpacing: 1 }}>PROGRAMACIÓN DE CITA</Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <TextField 
                      fullWidth 
                      label="Fecha de la Cita" 
                      type="date" 
                      required 
                      slotProps={{ inputLabel: { shrink: true } }} 
                      value={formData.fecha} 
                      disabled={viewMode} 
                      onChange={(e) => setFormData({ ...formData, fecha: e.target.value })} 
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField 
                      fullWidth 
                      label="Hora de Atención" 
                      type="time" 
                      required 
                      slotProps={{ inputLabel: { shrink: true } }} 
                      value={formData.hora} 
                      disabled={viewMode} 
                      onChange={(e) => setFormData({ ...formData, hora: e.target.value })} 
                    />
                  </Grid>
                  <Grid item xs={12}>
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
