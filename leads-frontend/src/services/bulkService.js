import axios from "axios";

const API =
  "http://localhost:5001/api/send-bulk";

export const sendBulkMessages =
  async () => {

    const response =
      await axios.get(API);

    return response.data;

  };