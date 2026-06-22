import axios from "axios";

const API =
  "http://localhost:5001/api/broadcast";

export const previewBroadcast =
  async (interest) => {

    const response =
      await axios.get(
        `${API}/preview/${interest}`
      );

    return response.data;

  };