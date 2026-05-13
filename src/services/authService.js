import api from "../api";

export const getMe = () => api.get("/me").then(r => r.data);
export const getOperadorMe = () => api.get("/operadores/me").then(r => r.data);