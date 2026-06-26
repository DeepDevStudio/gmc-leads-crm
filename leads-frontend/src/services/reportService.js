import axios from "axios";

const API =
  "/api/api/reports";

export const getReportStats =
  async () => {

    const response =
      await axios.get(
        `${API}/stats`
      );

    return response.data;

  };

  export const getEmployeeStats =
  async () => {

    const response =
      await axios.get(
        `${API}/employees`
      );

    return response.data;

  };

  export const getSummary =
  async () => {

    const response =
      await axios.get(
        `${API}/summary`
      );

    return response.data;

  };