import axios from "axios";

const API = "/api/bulk-import";

export const importCustomers = async (customers, skipDuplicates = true) => {
    const response = await axios.post(API, { 
        customers, 
        skipDuplicates 
    });
    return response.data;
};

export const checkDuplicates = async (phones) => {
    const response = await axios.post(`${API}/check-duplicates`, { phones });
    return response.data;
};
