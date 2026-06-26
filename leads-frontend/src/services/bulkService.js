import axios from "axios";

const API =
  "/api/api/send-bulk";

export const sendBulkMessages =
  async () => {

    const response =
      await axios.get(API);

    return response.data;

  };