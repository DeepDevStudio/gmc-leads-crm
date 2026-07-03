import axios from "axios";

const API = "/api/broadcast";

export const getBroadcasts = async () => {
    const response = await axios.get(API);
    return response.data;
};

export const createBroadcast = async (data) => {
    const response = await axios.post(API, data);
    return response.data;
};

export const previewBroadcast = async (data) => {
    const response = await axios.post(`${API}/preview`, data);
    return response.data;
};

export const deleteBroadcast = async (id) => {
    const response = await axios.delete(`${API}/${id}`);
    return response.data;
};

export const sendBroadcast = async (id) => {
    const response = await axios.post(`${API}/${id}/send`);
    return response.data;
};
