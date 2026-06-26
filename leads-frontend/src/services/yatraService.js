import axios from "axios";

const API =
  "/api/api/yatras";

export const getYatras =
  async () => {

    const response =
      await axios.get(API);

    return response.data;

  };

export const createYatra =
  async (data) => {

    const response =
      await axios.post(
        API,
        data
      );

    return response.data;

  };

  export const getYatra =
  async (id) => {

    const response =
      await axios.get(
        `${API}/${id}`
      );

    return response.data;

  };