import api, { get, post } from '../api';
export const getPacientes = (page = 1) => api.get(`/pacientes?page=${page}`).then(r => r.data);
export const getPaciente = (id) => api.get(`/pacientes/${id}`).then(r => r.data);
export const getNextHC = () => api.get('/pacientes/next-hc').then(r => r.data);
export const createPaciente = (payload) => post('/pacientes', payload).then(r => r.data);
export const updatePaciente = (id, payload) => api.put(`/pacientes/${id}`, payload).then(r => r.data);
export const deletePaciente = (id) => api.delete(`/pacientes/${id}`).then(r => r.data);