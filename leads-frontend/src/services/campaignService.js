import api from './api';

export const getCampaigns = async () => {
    try {
        const response = await api.get('/campaigns');
        return response.data;
    } catch (error) {
        console.error('Error fetching campaigns:', error);
        throw error;
    }
};

export const createCampaign = async (data) => {
    try {
        const response = await api.post('/campaigns', data);
        return response.data;
    } catch (error) {
        console.error('Error creating campaign:', error);
        throw error;
    }
};

export const updateCampaign = async (id, data) => {
    try {
        const response = await api.put(`/campaigns/${id}`, data);
        return response.data;
    } catch (error) {
        console.error('Error updating campaign:', error);
        throw error;
    }
};

export const deleteCampaign = async (id) => {
    try {
        const response = await api.delete(`/campaigns/${id}`);
        return response.data;
    } catch (error) {
        console.error('Error deleting campaign:', error);
        throw error;
    }
};

export const sendCampaign = async (id) => {
    try {
        const response = await api.post(`/campaigns/${id}/send`);
        return response.data;
    } catch (error) {
        console.error('Error sending campaign:', error);
        throw error;
    }
};

export const duplicateCampaign = async (id) => {
    try {
        const response = await api.post(`/campaigns/${id}/duplicate`);
        return response.data;
    } catch (error) {
        console.error('Error duplicating campaign:', error);
        throw error;
    }
};

export const getCampaignAnalytics = async (id) => {
    try {
        const response = await api.get(`/campaigns/${id}/analytics`);
        return response.data;
    } catch (error) {
        console.error('Error fetching campaign analytics:', error);
        throw error;
    }
};

export const getAudiencePreview = async (id) => {
    try {
        const response = await api.post(`/campaigns/${id}/audience-preview`);
        return response.data;
    } catch (error) {
        console.error('Error fetching audience preview:', error);
        throw error;
    }
};
