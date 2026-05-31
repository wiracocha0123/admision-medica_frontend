import api, { get, post } from '../api';
export const getPacientes = (page = 1, search = '', hc = '', gestante = 'all') => {
    let url = `/pacientes?page=${page}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    if (hc) url += `&hc=${encodeURIComponent(hc)}`;
    if (gestante !== 'all') url += `&gestante=${gestante === 'yes' ? 1 : 0}`;
    return api.get(url).then(r => r.data);
};
export const getAllPacientes = () => api.get('/pacientes?page=all').then(r => r.data);
export const getPaciente = (id) => api.get(`/pacientes/${id}`).then(r => r.data);
export const getNextHC = () => api.get('/pacientes/next-hc').then(r => r.data);
export const createPaciente = (payload) => post('/pacientes', payload).then(r => r.data);
export const updatePaciente = (id, payload) => api.put(`/pacientes/${id}`, payload).then(r => r.data);
export const deletePaciente = (id) => api.delete(`/pacientes/${id}`).then(r => r.data);