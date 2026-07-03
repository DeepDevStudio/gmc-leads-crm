import axios from "axios";

const API = "/api/campaigns";

export const getCampaigns = async () => {
    const response = await axios.get(API);
    return response.data;
};

export const createCampaign = async (data) => {
    const response = await axios.post(API, data);
    return response.data;
};

export const updateCampaign = async (id, data) => {
    const response = await axios.put(`${API}/${id}`, data);
    return response.data;
};

export const deleteCampaign = async (id) => {
    const response = await axios.delete(`${API}/${id}`);
    return response.data;
};

export const sendCampaign = async (id) => {
    const response = await axios.post(`${API}/${id}/send`);
    return response.data;
};
