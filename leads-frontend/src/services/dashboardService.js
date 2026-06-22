import axios from "axios";

const API =
  "http://localhost:5001/api/dashboard";

export const getDashboardStats =
  async () => {

    const response =
      await axios.get(
        `${API}/stats`
      );

    return response.data;

  };