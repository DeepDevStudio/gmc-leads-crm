import api from "./api";

export const getBroadcasts = async () => {
    const response = await api.get('/broadcast');
    return response.data;
};

export const createBroadcast = async (data) => {
    const response = await api.post('/broadcast', data);
    return response.data;
};

export const previewBroadcast = async (data) => {
    const response = await api.post('/broadcast/preview', data);
    return response.data;
};

export const deleteBroadcast = async (id) => {
    const response = await api.delete(`/broadcast/${id}`);
    return response.data;
};

export const sendBroadcast = async (id) => {
    const response = await api.post(`/broadcast/${id}/send`);
    return response.data;
};
