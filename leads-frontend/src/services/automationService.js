y
import axios from "axios";

const API = "/api/automation/run";

export const runAutomation = async (data) => {
    const response = await axios.post(API, data);
    return response.data;
};
