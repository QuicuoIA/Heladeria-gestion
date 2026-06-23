import axios from 'axios';

const clienteAxios = axios.create({
    baseURL: 'http://localhost:3000/api' // La URL base de tu backend
});

export default clienteAxios;