import axios from "axios";

const API =
  "http://localhost:5001/api/customers";

export const getCustomers =
  async () => {
    const response =
      await axios.get(API);

    return response.data;
  };

export const createCustomer =
  async (data) => {
    const response =
      await axios.post(
        API,
        data
      );

    return response.data;
  };

export const deleteCustomer =
  async (id) => {
    const response =
      await axios.delete(
        `${API}/${id}`
      );

    return response.data;
  };

  export const checkCustomer =
  async (mobile) => {

    const response =
      await axios.get(
        `${API}/check/${mobile}`
      );

    return response.data;

  };

  export const updateCustomer =
  async (id, data) => {

    const response =
      await axios.put(
        `${API}/${id}`,
        data
      );

    return response.data;

  };

  export const getCustomer =
  async (id) => {

    const response =
      await axios.get(
        `${API}/${id}`
      );

    return response.data;

  };