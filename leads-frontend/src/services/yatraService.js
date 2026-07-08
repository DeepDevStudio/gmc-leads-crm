import api from "./api";

export const getYatras = async () => {
  const response = await api.get('/yatras');
  return response.data;
};

export const createYatra = async (data) => {
  const response = await api.post('/yatras', data);
  return response.data;
};

export const getYatra = async (id) => {
  const response = await api.get(`/yatras/${id}`);
  return response.data;
};

export const updateYatra = async (id, data) => {
  const response = await api.put(`/yatras/${id}`, data);
  return response.data;
};

export const deleteYatra = async (id) => {
  const response = await api.delete(`/yatras/${id}`);
  return response.data;
};
