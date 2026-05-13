import api from "../api";

export const getPersonalSalud = (page = 1) => api.get(`/personal_salud?page=${page}`).then(r => r.data);
export const createPersonalSalud = (payload) => api.post("/personal_salud", payload).then(r => r.data);
export const updatePersonalSalud = (id, payload) => api.put(`/personal_salud/${id}`, payload).then(r => r.data);
export const deletePersonalSalud = (id) => api.delete(`/personal_salud/${id}`).then(r => r.data);