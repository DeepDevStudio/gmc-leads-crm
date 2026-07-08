import api from "./api";

export const getReportStats = async () => {
  const response = await api.get('/reports');
  return response.data;
};

export const getEmployeeStats = async () => {
  const response = await api.get('/reports/employees');
  return response.data;
};
