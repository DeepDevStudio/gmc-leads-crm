import axios from "axios";

const API =
  "http://localhost:5001/api/interests";

export const getInterests =
  async () => {
    const response =
      await axios.get(API);

    return response.data;
  };

export const createInterest =
  async (data) => {
    const response =
      await axios.post(
        API,
        data
      );

    return response.data;
  };