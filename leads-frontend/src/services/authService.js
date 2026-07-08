import api from "./api";

export const login = async (credentials) => {
  const response = await api.post('/auth/login', credentials);
  return response.data;
};

export const verify = async () => {
  const token = localStorage.getItem("token");
  if (!token) return null;
  const response = await api.get('/auth/verify', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};
