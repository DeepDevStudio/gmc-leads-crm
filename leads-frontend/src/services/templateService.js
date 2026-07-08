import api from './api';

export const getTemplates = async () => {
    try {
        const response = await api.get('/templates');
        return response.data;
    } catch (error) {
        console.error('Error fetching templates:', error);
        throw error;
    }
};

export const createTemplate = async (data) => {
    try {
        const response = await api.post('/templates', data);
        return response.data;
    } catch (error) {
        console.error('Error creating template:', error);
        throw error;
    }
};

export const updateTemplate = async (id, data) => {
    try {
        const response = await api.put(`/templates/${id}`, data);
        return response.data;
    } catch (error) {
        console.error('Error updating template:', error);
        throw error;
    }
};

export const deleteTemplate = async (id) => {
    try {
        const response = await api.delete(`/templates/${id}`);
        return response.data;
    } catch (error) {
        console.error('Error deleting template:', error);
        throw error;
    }
};

export const duplicateTemplate = async (id) => {
    try {
        const response = await api.post(`/templates/${id}/duplicate`);
        return response.data;
    } catch (error) {
        console.error('Error duplicating template:', error);
        throw error;
    }
};

export const toggleTemplateStatus = async (id, status) => {
    try {
        const response = await api.put(`/templates/${id}`, { status });
        return response.data;
    } catch (error) {
        console.error('Error toggling template status:', error);
        throw error;
    }
};
