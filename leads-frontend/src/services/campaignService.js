import axios from "axios";

const API =
  "http://localhost:5001/api/campaigns";

export const getCampaigns =
  async () => {
    const response =
      await axios.get(API);

    return response.data;
  };

export const createCampaign =
  async (data) => {
    const response =
      await axios.post(
        API,
        data
      );

    return response.data;
  };

export const deleteCampaign =
  async (id) => {
    const response =
      await axios.delete(
        `${API}/${id}`
      );

    return response.data;
  };