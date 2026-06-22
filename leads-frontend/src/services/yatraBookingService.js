import axios from "axios";

const API =
  "http://localhost:5001/api/yatra-bookings";

export const getBookings =
  async () => {
    const response =
      await axios.get(API);

    return response.data;
  };

export const createBooking =
  async (data) => {
    const response =
      await axios.post(
        API,
        data
      );

    return response.data;
  };