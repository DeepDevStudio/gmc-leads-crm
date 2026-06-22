import axios from "axios";

const API =
  "http://localhost:5001/api/automation/run";

export const runAutomation =
  async () => {
    const response =
      await axios.get(API);

    return response.data;
  };