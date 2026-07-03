import axios from "axios";

const API = "/api/activity";

export const createActivity = async (data) => {
    const response = await axios.post(`${API}/create`, data);
    return response.data;
};

export const getActivities = async () => {
    const response = await axios.get(`${API}/all`);
    return response.data;
};
