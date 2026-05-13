import api from '../api';
export const getUsers = (page = 1) => api.get(`/users?page=${page}`).then(r => r.data);