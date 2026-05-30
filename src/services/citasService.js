import api, { get, post } from '../api';
export const getCitas = (page = 1) => api.get(`/citas?page=${page}`).then(r => r.data);
export const getAllCitas = () => api.get('/citas?page=all').then(r => r.data);
export const getCita = (id) => api.get(`/citas/${id}`).then(r => r.data);
export const createCita = (payload) => post('/citas', payload).then(r => r.data);
export const updateCita = (id, payload) => api.put(`/citas/${id}`, payload).then(r => r.data);
export const deleteCita = (id) => api.delete(`/citas/${id}`).then(r => r.data);