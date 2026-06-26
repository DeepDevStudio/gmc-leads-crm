import axios from "axios";

const API =
  "/api/api/broadcast";

export const previewBroadcast =
  async (interest) => {

    const response =
      await axios.get(
        `${API}/preview/${interest}`
      );

    return response.data;

  };