import api from "./api";

// ===== SAFE ARRAY HELPER =====
const safeArray = (data) => {
    if (Array.isArray(data)) return data;
    if (data && typeof data === 'object') {
        if (Array.isArray(data.data)) return data.data;
        if (Array.isArray(data.customers)) return data.customers;
        if (Array.isArray(data.results)) return data.results;
        if (Array.isArray(data.items)) return data.items;
    }
    return [];
};

// ===== GET ALL CUSTOMERS =====
export const getCustomers = async () => {
    try {
        const response = await api.get("/customers");
        return safeArray(response.data);
    } catch (error) {
        console.error("Error fetching customers:", error);
        return [];
    }
};

// ===== GET CUSTOMER BY ID =====
export const getCustomer = async (id) => {
    try {
        const response = await api.get(`/customers/${id}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching customer:", error);
        throw error;
    }
};

// ===== GET CUSTOMER BY ID (alias) =====
export const getCustomerById = async (id) => {
    try {
        const response = await api.get(`/customers/${id}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching customer:", error);
        throw error;
    }
};

// ===== CREATE CUSTOMER =====
export const createCustomer = async (data) => {
    try {
        const response = await api.post("/customers", data);
        return response.data;
    } catch (error) {
        console.error("Error creating customer:", error);
        throw error;
    }
};

// ===== UPDATE CUSTOMER =====
export const updateCustomer = async (id, data) => {
    try {
        const response = await api.put(`/customers/${id}`, data);
        return response.data;
    } catch (error) {
        console.error("Error updating customer:", error);
        throw error;
    }
};

// ===== DELETE CUSTOMER =====
export const deleteCustomer = async (id) => {
    try {
        const response = await api.delete(`/customers/${id}`);
        return response.data;
    } catch (error) {
        console.error("Error deleting customer:", error);
        throw error;
    }
};

// ===== CHECK IF CUSTOMER EXISTS =====
export const checkCustomer = async (mobile) => {
    try {
        const response = await api.get(`/customers/check/${mobile}`);
        return response.data;
    } catch (error) {
        console.error("Error checking customer:", error);
        throw error;
    }
};

// ===== UPDATE CUSTOMER GROUP =====
export const updateCustomerGroup = async (id, group_type) => {
    try {
        const response = await api.patch(`/customers/${id}/group`, { group_type });
        return response.data;
    } catch (error) {
        console.error("Error updating customer group:", error);
        throw error;
    }
};

// ===== BULK UPDATE CUSTOMER GROUP =====
export const bulkUpdateCustomerGroup = async (ids, group_type) => {
    try {
        const response = await api.put("/customers/bulk/group", { ids, group_type });
        return response.data;
    } catch (error) {
        console.error("Error bulk updating customer group:", error);
        throw error;
    }
};

// ===== GET CUSTOMERS BY GROUP =====
export const getCustomersByGroup = async (group) => {
    try {
        const response = await api.get(`/customers/group/${group}`);
        return safeArray(response.data);
    } catch (error) {
        console.error("Error fetching customers by group:", error);
        return [];
    }
};
