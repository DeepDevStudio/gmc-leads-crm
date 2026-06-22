import axios from "axios";

const API =
  "http://localhost:5001/api/templates";

export const getTemplates =
  async () => {
    const response =
      await axios.get(API);

    return response.data;
  };

export const createTemplate =
  async (data) => {
    const response =
      await axios.post(
        API,
        data
      );

    return response.data;
  };

export const deleteTemplate =
  async (id) => {
    const response =
      await axios.delete(
        `${API}/${id}`
      );

    return response.data;
  };