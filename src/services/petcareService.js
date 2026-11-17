import axios from 'axios';

const API_URL = 'http://localhost:8080/api';

// --- DUEÑOS ---
export const obtenerDuenos = async () => {
    const response = await axios.get(`${API_URL}/duenos`);
    return response.data;
};

export const crearDueno = async (dueno) => {
    const response = await axios.post(`${API_URL}/duenos`, dueno);
    return response.data;
};

// --- MASCOTAS ---
export const obtenerMascotasPorDueno = async (duenoId) => {
    const response = await axios.get(`${API_URL}/duenos/${duenoId}/mascotas`);
    return response.data;
};

export const crearMascota = async (mascota, duenoId) => {
    const response = await axios.post(`${API_URL}/mascotas?duenoId=${duenoId}`, mascota);
    return response.data;
};

// --- CITAS ---
export const obtenerCitasPorMascota = async (mascotaId) => {
    const response = await axios.get(`${API_URL}/mascotas/${mascotaId}/citas`);
    return response.data;
};

export const crearCita = async (cita, mascotaId) => {
    const response = await axios.post(`${API_URL}/citas?mascotaId=${mascotaId}`, cita);
    return response.data;
};