import api from "./api";

export const runAutomation = async (data) => {
    const response = await api.post('/automation/run', data);
    return response.data;
};

export const getAutomationRules = async () => {
    const response = await api.get('/automation/rules');
    return response.data;
};

export const getAutomationLogs = async () => {
    const response = await api.get('/automation/logs');
    return response.data;
};

export const createAutomationRule = async (data) => {
    const response = await api.post('/automation/rules', data);
    return response.data;
};

export const updateAutomationRule = async (id, data) => {
    const response = await api.put(`/automation/rules/${id}`, data);
    return response.data;
};

export const deleteAutomationRule = async (id) => {
    const response = await api.delete(`/automation/rules/${id}`);
    return response.data;
};

export const toggleAutomationRule = async (id, status) => {
    const response = await api.patch(`/automation/rules/${id}/status`, { status });
    return response.data;
};
