import axios from "axios";

const API = "/api/send-bulk";

export const sendBulkMessages = async (data) => {
    const response = await axios.post(API, data);
    return response.data;
};

export const getBulkStatus = async () => {
    const response = await axios.get(API);
    return response.data;
};
