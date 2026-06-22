import axios from "axios";

const API =
  "http://localhost:5001/api/auth";

export const login =
  async (data) => {

    const response =
      await axios.post(
        `${API}/login`,
        data
      );

    return response.data;

  };