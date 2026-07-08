import api from "./api";

export const getTrips = async () => {
  const response = await api.get('/yatra-bookings/trips');
  return response.data;
};

export const getTrip = async (id) => {
  const response = await api.get(`/yatra-bookings/trips/${id}`);
  return response.data;
};

export const createTrip = async (data) => {
  const response = await api.post('/yatra-bookings/trips', data);
  return response.data;
};

export const updateTrip = async (id, data) => {
  const response = await api.put(`/yatra-bookings/trips/${id}`, data);
  return response.data;
};

export const deleteTrip = async (id) => {
  const response = await api.delete(`/yatra-bookings/trips/${id}`);
  return response.data;
};

export const addCustomerToTrip = async (tripId, data) => {
  const response = await api.post(`/yatra-bookings/trips/${tripId}/customers`, data);
  return response.data;
};

export const updateCustomerInTrip = async (tripId, customerTripId, data) => {
  const response = await api.put(`/yatra-bookings/trips/${tripId}/customers/${customerTripId}`, data);
  return response.data;
};

export const removeCustomerFromTrip = async (tripId, customerTripId) => {
  const response = await api.delete(`/yatra-bookings/trips/${tripId}/customers/${customerTripId}`);
  return response.data;
};

export const getPickupPoints = async () => {
  const response = await api.get('/yatra-bookings/pickup-points');
  return response.data;
};
