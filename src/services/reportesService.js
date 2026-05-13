import api from "../api";

/**
 * Obtiene la lista de personal de salud con su conteo de pacientes únicos.
 * Corresponde a: GET /reportes/personal
 */
export const getReportePersonal = () => 
    api.get("/reportes/personal").then(r => r.data);

/**
 * Obtiene el detalle de pacientes para un personal de salud específico.
 * Corresponde a: GET /reportes/personal/{id}/pacientes
 */
export const getReportePacientesPorPersonal = (id) => 
    api.get(`/reportes/personal/${id}/pacientes`).then(r => r.data);