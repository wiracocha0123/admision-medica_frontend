import React, { useState, useContext } from "react";
import {
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Grid,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
  Divider,
  Stack,
} from "@mui/material";
import {
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Close as CloseIcon,
  Lock as LockIcon,
} from "@mui/icons-material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AuthContext } from "../../contexts/AuthContext";
import { getUserProfile, updateUserProfile, changePassword } from "../../services/usersService";
import Swal from "sweetalert2";

export default function Perfil() {
  const { user } = useContext(AuthContext);
  const queryClient = useQueryClient();
  const [editMode, setEditMode] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    telefono: user?.telefono || "",
  });

  const [passwordData, setPasswordData] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  // Obtener datos completos del perfil
  const { data: profileData, isLoading } = useQuery({
    queryKey: ["user-profile"],
    queryFn: () => getUserProfile(),
    enabled: !!user,
  });

  // Función para segmentar nombre y apellido
  const segmentarNombre = (nombreCompleto) => {
    if (!nombreCompleto) return { nombre: "", apellido: "" };
    const partes = nombreCompleto.trim().split(" ");
    if (partes.length === 1) {
      return { nombre: partes[0], apellido: "" };
    }
    const nombre = partes[0];
    const apellido = partes.slice(1).join(" ");
    return { nombre, apellido };
  };

  // Función para combinar nombre y apellido
  const combinarNombre = (nombre, apellido) => {
    return [nombre, apellido].filter(Boolean).join(" ");
  };

  React.useEffect(() => {
    if (profileData) {
      const { nombre, apellido } = segmentarNombre(profileData.name);
      setFormData({
        name: profileData.name || "",
        email: profileData.email || "",
        telefono: profileData.telefono || "",
        nombre: nombre || "",
        apellido: apellido || "",
      });
    }
  }, [profileData]);

  // Mutation para actualizar perfil
  const mutationUpdate = useMutation({
    mutationFn: (data) => updateUserProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
      setEditMode(false);

      Swal.fire({
        icon: "success",
        title: "¡Perfil Actualizado!",
        text: "Tus datos se han guardado correctamente.",
        timer: 2000,
        showConfirmButton: false,
        heightAuto: false,
      });
    },
    onError: (err) => {
      const msg = err.response?.data?.message || err.message || "Error al actualizar perfil";
      Swal.fire({
        icon: "error",
        title: "Error",
        text: msg,
        confirmButtonColor: "#3085d6",
        heightAuto: false,
      });
    },
  });

  // Mutation para cambiar contraseña
  const mutationChangePassword = useMutation({
    mutationFn: (data) => changePassword(data),
    onSuccess: () => {
      setPasswordData({
        current_password: "",
        new_password: "",
        confirm_password: "",
      });

      Swal.fire({
        icon: "success",
        title: "¡Contraseña Actualizada!",
        text: "Tu contraseña se ha cambiado exitosamente.",
        timer: 2000,
        showConfirmButton: false,
        heightAuto: false,
      });
    },
    onError: (err) => {
      const msg = err.response?.data?.message || err.message || "Error al cambiar contraseña";
      Swal.fire({
        icon: "error",
        title: "Error",
        text: msg,
        confirmButtonColor: "#3085d6",
        heightAuto: false,
      });
    },
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData({ ...passwordData, [name]: value });
  };

  const handleSaveProfile = () => {
    if (!formData.nombre || !formData.email) {
      Swal.fire({
        icon: "warning",
        title: "Campos Requeridos",
        text: "El nombre y correo son obligatorios.",
        confirmButtonColor: "#3085d6",
        heightAuto: false,
      });
      return;
    }

    // Combinar nombre y apellido para enviar al backend
    const nombreCompleto = combinarNombre(formData.nombre, formData.apellido);
    const dataToSend = {
      name: nombreCompleto,
      email: formData.email,
      telefono: formData.telefono,
    };

    mutationUpdate.mutate(dataToSend);
  };

  const handleChangePassword = () => {
    if (!passwordData.current_password || !passwordData.new_password || !passwordData.confirm_password) {
      Swal.fire({
        icon: "warning",
        title: "Campos Requeridos",
        text: "Todos los campos de contraseña son obligatorios.",
        confirmButtonColor: "#3085d6",
        heightAuto: false,
      });
      return;
    }

    if (passwordData.new_password !== passwordData.confirm_password) {
      Swal.fire({
        icon: "warning",
        title: "Contraseñas No Coinciden",
        text: "La nueva contraseña y su confirmación no coinciden.",
        confirmButtonColor: "#3085d6",
        heightAuto: false,
      });
      return;
    }

    if (passwordData.new_password.length < 8) {
      Swal.fire({
        icon: "warning",
        title: "Contraseña Débil",
        text: "La contraseña debe tener al menos 8 caracteres.",
        confirmButtonColor: "#3085d6",
        heightAuto: false,
      });
      return;
    }

    mutationChangePassword.mutate({
      current_password: passwordData.current_password,
      new_password: passwordData.new_password,
    });
  };

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 900, mx: "auto" }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: "bold", display: "flex", alignItems: "center", gap: 1 }}>
        <EditIcon /> Mi Perfil
      </Typography>

      {/* Tarjeta de Información de Perfil */}
      <Card sx={{ mb: 3, borderRadius: 2, boxShadow: 2 }}>
        <CardContent>
          <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: "bold" }}>
              Información Personal
            </Typography>
            {!editMode && (
              <Button
                variant="outlined"
                color="primary"
                startIcon={<EditIcon />}
                onClick={() => setEditMode(true)}
              >
                Editar
              </Button>
            )}
          </Stack>

          <Divider sx={{ mb: 3 }} />

          {editMode ? (
            <Box>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Nombre"
                    name="nombre"
                    value={formData.name}
                    onChange={handleInputChange}
                  />
                </Grid>
                {/* <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Apellido"
                    name="apellido"
                    value={formData.apellido}
                    onChange={handleInputChange}
                  />
                </Grid> */}
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Correo Electrónico"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Teléfono"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleInputChange}
                  />
                </Grid>
              </Grid>

              <Stack direction="row" spacing={2}>
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<SaveIcon />}
                  onClick={handleSaveProfile}
                  disabled={mutationUpdate.isPending}
                >
                  {mutationUpdate.isPending ? "Guardando..." : "Guardar Cambios"}
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<CloseIcon />}
                  onClick={() => {
                    setEditMode(false);
                    if (profileData) {
                      const { nombre, apellido } = segmentarNombre(profileData.name);
                      setFormData({
                        name: profileData.name || "",
                        email: profileData.email || "",
                        telefono: profileData.telefono || "",
                        nombre: nombre || "",
                        apellido: apellido || "",
                      });
                    }
                  }}
                >
                  Cancelar
                </Button>
              </Stack>
            </Box>
          ) : (
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="subtitle2" color="textSecondary">
                  Nombre
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {formData.nombre}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="subtitle2" color="textSecondary">
                  Apellido
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {formData.apellido || "-"}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="subtitle2" color="textSecondary">
                  Correo Electrónico
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {formData.email}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="subtitle2" color="textSecondary">
                  Teléfono
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {formData.telefono || "-"}
                </Typography>
              </Grid>
            </Grid>
          )}
        </CardContent>
      </Card>

      {/* Tarjeta de Cambio de Contraseña */}
      <Card sx={{ borderRadius: 2, boxShadow: 2 }}>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
            <LockIcon /> Cambiar Contraseña
          </Typography>

          <Divider sx={{ mb: 3 }} />

          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Contraseña Actual"
                name="current_password"
                type={showCurrentPassword ? "text" : "password"}
                value={passwordData.current_password}
                onChange={handlePasswordChange}
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          size="small"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          edge="end"
                        >
                          {showCurrentPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Nueva Contraseña"
                name="new_password"
                type={showNewPassword ? "text" : "password"}
                value={passwordData.new_password}
                onChange={handlePasswordChange}
                helperText="Mínimo 8 caracteres"
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          size="small"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          edge="end"
                        >
                          {showNewPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Confirmar Contraseña"
                name="confirm_password"
                type={showConfirmPassword ? "text" : "password"}
                value={passwordData.confirm_password}
                onChange={handlePasswordChange}
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          size="small"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          edge="end"
                        >
                          {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />
            </Grid>
          </Grid>

          <Button
            variant="contained"
            color="primary"
            startIcon={<LockIcon />}
            onClick={handleChangePassword}
            disabled={mutationChangePassword.isPending}
          >
            {mutationChangePassword.isPending ? "Actualizando..." : "Actualizar Contraseña"}
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
}
