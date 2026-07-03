import axios from "axios";

const API = "/api/receipts";

export const generateReceipt = async (bookingId, data) => {
    const response = await axios.post(`${API}/generate/${bookingId}`, data);
    return response.data;
};

export const getReceiptByBooking = async (bookingId) => {
    const response = await axios.get(`${API}/booking/${bookingId}`);
    return response.data;
};

export const getReceipt = async (id) => {
    const response = await axios.get(`${API}/${id}`);
    return response.data;
};

export const getAllReceipts = async () => {
    const response = await axios.get(API);
    return response.data;
};
