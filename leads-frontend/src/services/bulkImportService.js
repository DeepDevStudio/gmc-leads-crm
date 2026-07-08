import api from "./api";

export const importCustomers = async (customers, skipDuplicates = true) => {
  const response = await api.post('/bulk-import', { customers, skipDuplicates });
  return response.data;
};

export const checkDuplicates = async (phones) => {
  const response = await api.post('/bulk-import/check-duplicates', { phones });
  return response.data;
};
