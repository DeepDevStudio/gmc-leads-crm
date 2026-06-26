import axios from "axios";

const API =
  "/api/api/automation/run";

export const runAutomation =
  async () => {
    const response =
      await axios.get(API);

    return response.data;
  };