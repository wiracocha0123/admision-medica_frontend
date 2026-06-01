import api, { get, post } from '../api';
export const getCitas = (page = 1, fecha = '') => {
  let url = `/citas?page=${page}`;
  if (fecha) url += `&fecha=${fecha}`;
  return api.get(url).then(r => r.data);
};
export const getAllCitas = (fecha = '') => {
  let url = '/citas?page=all';
  if (fecha) url += `&fecha=${fecha}`;
  return api.get(url).then(r => r.data);
};
export const getCita = (id) => api.get(`/citas/${id}`).then(r => r.data);
export const createCita = (payload) => post('/citas', payload).then(r => r.data);
export const updateCita = (id, payload) => api.put(`/citas/${id}`, payload).then(r => r.data);
export const deleteCita = (id) => api.delete(`/citas/${id}`).then(r => r.data);