import api, { get, post } from '../api';
export const getEspecialidades = (page = 1, search = "") => 
    api.get('/especialidades', { params: { page, search } }).then(r => r.data);
export const createEspecialidad = (payload) => post('/especialidades', payload).then(r => r.data);
export const updateEspecialidad = (id, payload) => api.put(`/especialidades/${id}`, payload).then(r => r.data);
export const deleteEspecialidad = (id) => api.delete(`/especialidades/${id}`).then(r => r.data);