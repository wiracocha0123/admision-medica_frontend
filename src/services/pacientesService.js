import api, { get, post } from '../api';
export const getPacientes = (page = 1, search = '', hc = '', gestante = 'all', estado = 'Activo') => {
    let url = `/pacientes?page=${page}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    if (hc) url += `&hc=${encodeURIComponent(hc)}`;
    if (gestante !== 'all') url += `&gestante=${gestante === 'yes' ? 1 : 0}`;
    if (estado !== 'todos') url += `&estado=${estado}`;
    return api.get(url).then(r => r.data);
};
export const getAllPacientes = async () => {
    let allPacientes = [];
    let page = 1;
    let totalPages = 1;
    
    try {
        // Obtener la primera página para saber el total
        const firstPageResponse = await api.get('/pacientes?page=1&per_page=100').then(r => r.data);
        
        // Extraer items y total de páginas
        let items = Array.isArray(firstPageResponse) ? firstPageResponse : (firstPageResponse?.data || []);
        totalPages = firstPageResponse?.last_page || 1;
        
        allPacientes = [...allPacientes, ...items];
        
        console.log('[getAllPacientes] Primera página - items:', items.length, 'totalPages:', totalPages);
        
        // Si hay más páginas, obtenerlas
        if (totalPages > 1) {
            for (page = 2; page <= totalPages; page++) {
                try {
                    const response = await api.get(`/pacientes?page=${page}&per_page=100`).then(r => r.data);
                    const pageItems = Array.isArray(response) ? response : (response?.data || []);
                    allPacientes = [...allPacientes, ...pageItems];
                    console.log(`[getAllPacientes] Página ${page} - items:`, pageItems.length);
                } catch (err) {
                    console.error(`Error al obtener página ${page}:`, err);
                    break;
                }
            }
        }
        
        console.log('[getAllPacientes] Total de pacientes obtenidos:', allPacientes.length);
        return allPacientes;
    } catch (err) {
        console.error('Error al obtener todos los pacientes:', err);
        return [];
    }
};
export const getPaciente = (id) => api.get(`/pacientes/${id}`).then(r => r.data);
export const getNextHC = () => api.get('/pacientes/next-hc').then(r => r.data);
export const createPaciente = (payload) => post('/pacientes', payload).then(r => r.data);
export const updatePaciente = (id, payload) => api.put(`/pacientes/${id}`, payload).then(r => r.data);
export const deletePaciente = (id) => api.delete(`/pacientes/${id}`).then(r => r.data);