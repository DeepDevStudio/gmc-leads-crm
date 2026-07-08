import api from "./api";

export const createActivity = async (data) => {
  const response = await api.post('/activity/create', data);
  return response.data;
};

export const getActivities = async () => {
  const response = await api.get('/activity/all');
  return response.data;
};
