import axios from "axios";

const API = "/api/customers";

// Get all interests for a customer
export const getCustomerInterests = async (customerId) => {
    const response = await axios.get(`${API}/${customerId}/interests`);
    return response.data;
};

// Add interest to customer
export const addCustomerInterest = async (customerId, interestId) => {
    const response = await axios.post(`${API}/${customerId}/interests`, {
        interest_id: interestId
    });
    return response.data;
};

// Remove interest from customer
export const removeCustomerInterest = async (customerId, interestId) => {
    const response = await axios.delete(`${API}/${customerId}/interests/${interestId}`);
    return response.data;
};
