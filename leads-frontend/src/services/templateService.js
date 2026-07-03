import axios from "axios";

const API = "/api/templates";

// Get all templates
export const getTemplates = async () => {
    const response = await axios.get(API);
    return response.data;
};

// Get template by ID
export const getTemplate = async (id) => {
    const response = await axios.get(`${API}/${id}`);
    return response.data;
};

// Create new template
export const createTemplate = async (data) => {
    const response = await axios.post(API, data);
    return response.data;
};

// Update template
export const updateTemplate = async (id, data) => {
    const response = await axios.put(`${API}/${id}`, data);
    return response.data;
};

// Delete template
export const deleteTemplate = async (id) => {
    const response = await axios.delete(`${API}/${id}`);
    return response.data;
};

// Toggle template status (Active/Inactive)
export const toggleTemplateStatus = async (id, status) => {
    const response = await axios.patch(`${API}/${id}/status`, { status });
    return response.data;
};
