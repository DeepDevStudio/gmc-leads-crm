import axios from "axios";

const API = "/api/customers";

// Get all customers
export const getCustomers = async () => {
  const response = await axios.get(API);
  return response.data;
};

// Get single customer by ID
export const getCustomer = async (id) => {
  const response = await axios.get(`${API}/${id}`);
  return response.data;
};

// Create new customer
export const createCustomer = async (data) => {
  const response = await axios.post(API, data);
  return response.data;
};

// Update customer
export const updateCustomer = async (id, data) => {
  const response = await axios.put(`${API}/${id}`, data);
  return response.data;
};

// Delete customer
export const deleteCustomer = async (id) => {
  const response = await axios.delete(`${API}/${id}`);
  return response.data;
};

// Check if customer exists (for duplicate check)
export const checkCustomer = async (mobileNumber) => {
  const response = await axios.get(`${API}/check/${mobileNumber}`);
  return response.data;
};

// Update customer group
export const updateCustomerGroup = async (id, group) => {
  const response = await axios.patch(`${API}/${id}/group`, { group });
  return response.data;
};

// Get customers by group (daily-reach, do-not-reach, unsubscribed)
export const getCustomersByGroup = async (group) => {
  const response = await axios.get(`${API}/group/${group}`);
  return response.data;
};
