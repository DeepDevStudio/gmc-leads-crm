import axios from "axios";

const API = "/api/reports";

export const getReportStats = async () => {
    const response = await axios.get(`${API}/stats`);
    return response.data;
};

export const getEmployeeStats = async () => {
    const response = await axios.get(`${API}/employee-stats`);
    return response.data;
};

export const getReports = async () => {
    const response = await axios.get(API);
    return response.data;
};

export const createReport = async (data) => {
    const response = await axios.post(API, data);
    return response.data;
};

export const getReportById = async (id) => {
    const response = await axios.get(`${API}/${id}`);
    return response.data;
};
