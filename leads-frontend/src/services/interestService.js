import axios from "axios";

const API = "/api/interests";

// Get all interests
export const getInterests = async () => {
    const response = await axios.get(API);
    return response.data;
};

// Get single interest by ID
export const getInterest = async (id) => {
    const response = await axios.get(`${API}/${id}`);
    return response.data;
};

// Create new interest
export const createInterest = async (data) => {
    const response = await axios.post(API, data);
    return response.data;
};

// Update interest by ID
export const updateInterest = async (id, data) => {
    const response = await axios.put(`${API}/${id}`, data);
    return response.data;
};

// Delete interest by ID
export const deleteInterest = async (id) => {
    const response = await axios.delete(`${API}/${id}`);
    return response.data;
};
