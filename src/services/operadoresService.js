import api, { get, post } from '../api';
export const getOperadores = (page = 1) => api.get(`/operadores?page=${page}`).then(r => r.data);
export const createOperador = (payload) => post('/operadores', payload).then(r => r.data);
export const updateOperador = (id, payload) => api.put(`/operadores/${id}`, payload).then(r => r.data);
export const deleteOperador = (id) => api.delete(`/operadores/${id}`).then(r => r.data);