import api from '../api';

export const getUsers = (page = 1) => api.get(`/users?page=${page}`).then(r => r.data);

export const getUserProfile = () => api.get(`/user/profile`).then(r => r.data?.data || r.data);

export const updateUserProfile = (data) => api.put(`/user/profile`, data).then(r => r.data?.data || r.data);

export const changePassword = (data) => api.post(`/user/change-password`, data).then(r => r.data);