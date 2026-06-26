import axios from "axios";

const API = "/api/dashboard";

export const getDashboardStats = async () => {
  const response = await axios.get(`${API}/stats`);
  return response.data;
};
