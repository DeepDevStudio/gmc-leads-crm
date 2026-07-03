import axios from "axios";

const API = "/api/auth";

export const login = async (data) => {
    const response = await axios.post(`${API}/login`, data);
    return response.data;
};
