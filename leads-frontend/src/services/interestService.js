import api from "./api";

// ===== GET ALL INTERESTS =====
export const getInterests = async () => {
    try {
        const response = await api.get('/interests');
        // API returns { data: [...], pagination: {...} }
        // Extract the data array
        if (response.data && Array.isArray(response.data.data)) {
            return response.data.data;
        }
        if (Array.isArray(response.data)) {
            return response.data;
        }
        return [];
    } catch (error) {
        console.error("Error fetching interests:", error);
        return [];
    }
};

// ===== GET INTEREST CATEGORIES =====
export const getInterestCategories = async () => {
    try {
        const response = await api.get('/interests/categories');
        return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
        console.error("Error fetching interest categories:", error);
        return [];
    }
};

// ===== CREATE INTEREST =====
export const createInterest = async (data) => {
    try {
        const response = await api.post('/interests', data);
        return response.data;
    } catch (error) {
        console.error("Error creating interest:", error);
        throw error;
    }
};

// ===== UPDATE INTEREST =====
export const updateInterest = async (id, data) => {
    try {
        const response = await api.put(`/interests/${id}`, data);
        return response.data;
    } catch (error) {
        console.error("Error updating interest:", error);
        throw error;
    }
};

// ===== DELETE INTEREST =====
export const deleteInterest = async (id) => {
    try {
        const response = await api.delete(`/interests/${id}`);
        return response.data;
    } catch (error) {
        console.error("Error deleting interest:", error);
        throw error;
    }
};
