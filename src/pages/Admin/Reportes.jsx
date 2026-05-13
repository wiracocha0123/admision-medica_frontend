import React, { useState } from 'react';
import { 
    Paper, Typography, Table, TableBody, TableCell, TableHead, TableRow, 
    Button, Box, CircularProgress, Alert, TableContainer, Skeleton, 
    Chip, Stack, Modal, Fade, List, ListItem, 
    ListItemText, Divider, Avatar
} from '@mui/material';
import { 
    Assessment as ReportIcon, 
    Visibility as ViewIcon, 
    Refresh as RefreshIcon,
    Person as PersonIcon,
    FileDownload as DownloadIcon
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import * as XLSX from 'xlsx';
import { getReportePersonal, getReportePacientesPorPersonal } from '../../services/reportesService';

const modalStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: { xs: '90%', md: 500 },
    bgcolor: 'background.paper',
    boxShadow: 24,
    p: 4,
    borderRadius: 2,
    maxHeight: '80vh',
    overflowY: 'auto'
};

export default function Reportes() {
    const [selectedId, setSelectedId] = useState(null);
    const [open, setOpen] = useState(false);

    const { data: listData, isLoading, error, refetch, isFetching } = useQuery({
        queryKey: ['reporte-personal'],
        queryFn: getReportePersonal
    });

    const { data: detailData, isLoading: loadingDetail, error: detailError } = useQuery({
        queryKey: ['reporte-detalle', selectedId],
        queryFn: () => getReportePacientesPorPersonal(selectedId),
        enabled: !!selectedId && open
    });

    const handleOpenDetail = (id) => {
        setSelectedId(id);
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };

    const handleExportExcel = async (personal) => {
        try {
            // Obtenemos los pacientes para este personal (todos los que devuelva el endpoint)
            const res = await getReportePacientesPorPersonal(personal.id);
            const pacientes = res?.data?.pacientes?.data || [];

            if (pacientes.length === 0) {
                alert('Este personal no tiene pacientes registrados para exportar.');
                return;
            }

            // Mapeamos los datos para el formato de Excel
            const dataToExport = pacientes.map(p => ({
                'Apellido': p.apellido || '',
                'Nombre': p.nombre || '',
                'DNI': p.dni || '',
                'H.C.': p.HistoriaClinica || '',
                'Teléfono': p.telefono || '',
                'Email': p.email || '',
                'Dirección': p.direccion || '',
                'Gestante': p.gestante && p.gestante !== '0' ? 'SÍ' : 'NO'
            }));

            // Creamos el libro de Excel
            const ws = XLSX.utils.json_to_sheet(dataToExport);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Pacientes');

            // Descargamos el archivo
            XLSX.writeFile(wb, `Reporte_Pacientes_${personal.apellidos}_${personal.nombres}.xlsx`);
        } catch (err) {
            console.error('Error exportando Excel:', err);
            alert('Error al generar el archivo Excel.');
        }
    };

    const items = listData?.data || [];
    const patientsList = detailData?.data?.pacientes?.data || [];

    return (
        <Paper sx={{ p: 3 }}>
            <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ReportIcon color="primary" /> Reporte de Productividad
                </Typography>
                <Button 
                    variant="outlined" 
                    startIcon={<RefreshIcon />} 
                    onClick={() => refetch()} 
                    disabled={isFetching}
                >
                    Actualizar
                </Button>
            </Stack>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error.message || 'Error al cargar reporte'}</Alert>}

            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow sx={{ bgcolor: 'grey.50' }}>
                            <TableCell>Personal de Salud</TableCell>
                            <TableCell>Especialidad / UPS</TableCell>
                            <TableCell align="center">Pacientes</TableCell>
                            <TableCell align="right">Acciones</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {isLoading ? (
                            [...Array(5)].map((_, i) => <TableRow key={i}><TableCell colSpan={4}><Skeleton /></TableCell></TableRow>)
                        ) : items.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                                    No hay datos disponibles.
                                </TableCell>
                            </TableRow>
                        ) : (
                            items.map((it) => (
                                <TableRow key={it.id} hover>
                                    <TableCell>
                                        <Typography variant="body2" fontWeight="bold">
                                            {it.nombres} {it.apellidos}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2">{it.especialidad?.especialidad || 'General'}</Typography>
                                        <Typography variant="caption" color="textSecondary">
                                            {it.especialidad?.UPS ? `UPS: ${it.especialidad.UPS}` : ''}
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="center">
                                        <Chip label={it.pacientes_count || 0} size="small" color="info" />
                                    </TableCell>
                                    <TableCell align="right">
                                        <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end' }}>
                                            <Button 
                                                size="small" 
                                                variant="contained" 
                                                startIcon={<ViewIcon />}
                                                onClick={() => handleOpenDetail(it.id)}
                                            >
                                                Ver
                                            </Button>
                                            <Button
                                                size="small"
                                                variant="contained"
                                                color="success"
                                                startIcon={<DownloadIcon />}
                                                onClick={() => handleExportExcel(it)}
                                            >
                                                Excel
                                            </Button>
                                        </Stack>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            <Modal open={open} onClose={handleClose} closeAfterTransition>
                <Fade in={open}>
                    <Box sx={modalStyle}>
                        {loadingDetail ? (
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
                                <CircularProgress size={40} />
                                <Typography sx={{ mt: 2 }}>Cargando lista...</Typography>
                            </Box>
                        ) : detailError ? (
                            <Box sx={{ py: 2 }}>
                                <Alert severity="error">
                                    Error al cargar pacientes. Verifica la conexión con el servidor.
                                </Alert>
                                <Button fullWidth sx={{ mt: 2 }} onClick={handleClose} variant="contained">Cerrar</Button>
                            </Box>
                        ) : (
                            <>
                                <Typography variant="h6" gutterBottom>
                                    Pacientes Atendidos - {detailData?.data?.personal?.nombres} {detailData?.data?.personal?.apellidos}
                                </Typography>
                                <Typography variant="caption" display="block" sx={{ mb: 2 }}>
                                    Especialidad: {detailData?.data?.personal?.especialidad || 'General'} | UPS: {detailData?.data?.personal?.UPS || 'N/A'}
                                </Typography>
                                <Divider />
                                <List sx={{ mt: 1 }}>
                                    {patientsList.length === 0 ? (
                                        <ListItem><ListItemText primary="Sin pacientes registrados." /></ListItem>
                                    ) : (
                                        patientsList.map((p) => (
                                            <React.Fragment key={p.id}>
                                                <ListItem alignItems="flex-start" sx={{ px: 0 }}>
                                                    <Avatar sx={{ mr: 2, bgcolor: 'primary.main', width: 45, height: 45 }}>
                                                        <PersonIcon />
                                                    </Avatar>
                                                    <ListItemText 
                                                        primary={
                                                            <Typography variant="subtitle1" fontWeight="bold" color="primary">
                                                                {p.apellido || ''}, {p.nombre || ''}
                                                            </Typography>
                                                        } 
                                                        secondary={
                                                            <Box sx={{ mt: 0.5 }}>
                                                                <Stack direction="row" spacing={1} sx={{ mb: 1, flexWrap: 'wrap', gap: 1 }}>
                                                                    <Chip label={`DNI: ${p.dni || 'N/A'}`} size="small" variant="outlined" />
                                                                    <Chip label={`HC: ${p.HistoriaClinica || 'N/A'}`} size="small" color="secondary" variant="outlined" />
                                                                    {p.gestante && p.gestante !== '0' && <Chip label="Gestante" size="small" color="error" />}
                                                                </Stack>
                                                                <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                                    <strong>Tel:</strong> {p.telefono || 'No registrado'}
                                                                </Typography>
                                                                {p.email && (
                                                                    <Typography variant="body2" color="text.secondary">
                                                                        <strong>Email:</strong> {p.email}
                                                                    </Typography>
                                                                )}
                                                                <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 0.5 }}>
                                                                    📍 {p.direccion || 'Sin dirección registrada'}
                                                                </Typography>
                                                            </Box>
                                                        } 
                                                    />
                                                </ListItem>
                                                <Divider variant="inset" component="li" />
                                            </React.Fragment>
                                        ))
                                    )}
                                </List>
                                {detailData?.data?.pacientes?.last_page > 1 && (
                                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center', bgcolor: 'grey.50', p: 1, borderRadius: 1 }}>
                                        <Typography variant="caption" color="text.secondary" fontWeight="medium">
                                            Mostrando los mejores 15 resultados (Página 1 de {detailData.data.pacientes.last_page})
                                        </Typography>
                                    </Box>
                                )}
                                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                                    <Button onClick={handleClose} variant="outlined">Cerrar</Button>
                                </Box>
                            </>
                        )}
                    </Box>
                </Fade>
            </Modal>
        </Paper>
    );
}