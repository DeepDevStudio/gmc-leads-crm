import {
  useEffect,
  useState,
} from "react";

import {
  useParams,
} from "react-router-dom";

// import {
//   getCustomer,
// } from "../services/customerService";

import {
  getCustomer,
  updateCustomerGroup,
} from "../services/customerService";

function CustomerProfilePage() {

  const { id } = useParams();

  const [data, setData] =
    useState(null);

  useEffect(() => {
    loadCustomer();
  }, []);

  const changeGroup = async (group) => {

    try {

     await updateCustomerGroup(
  id,
  group
);

      loadCustomer();

    } catch (error) {

      console.error(error);

    }

  };

  const loadCustomer =
    async () => {

      try {

        const response =
          await getCustomer(id);

        setData(response);

      } catch (error) {

        console.error(error);

      }

    };

  if (!data) {
    return (
      <div className="p-6">
        Loading...
      </div>
    );
  }

  const {
    customer,
    totalTrips,
    lifetimeRevenue,
    bookings,
  } = data;

  return (

    <div className="space-y-6">

      {/* Header */}

      <div
        className="
      bg-white
      rounded-2xl
      shadow
      border
      p-6
      "
      >

        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-6">

          <div>

            <h1
              className="
            text-4xl
            font-bold
            "
            >
              {customer.customer_name}
            </h1>

            <p className="text-gray-500 mt-2">
              {customer.mobile_number}
            </p>

            <div className="mt-3 flex gap-2">

              <span
                className="
              px-3
              py-1
              rounded-full
              text-sm
              font-medium
              bg-blue-100
              text-blue-700
              "
              >
                {customer.group_type}
              </span>

              <span
                className="
              px-3
              py-1
              rounded-full
              text-sm
              font-medium
              bg-green-100
              text-green-700
              "
              >
                {customer.location_type}
              </span>

            </div>

          </div>

          <div className="flex flex-wrap gap-3">

            <button
              className="
            bg-green-500
            hover:bg-green-600
            text-white
            px-5
            py-3
            rounded-xl
            font-semibold
            transition
            "
            >
              WhatsApp
            </button>

            <button
              className="
            bg-blue-500
            hover:bg-blue-600
            text-white
            px-5
            py-3
            rounded-xl
            font-semibold
            transition
            "
            >
              Edit
            </button>

            <button
  onClick={() =>
    changeGroup(
      "Daily Reach"
    )
  }
  className="
  bg-green-700
  hover:bg-green-800
  text-white
  px-5
  py-3
  rounded-xl
  font-semibold
  transition
  "
>
  Move To Daily Reach
</button>

<button
  onClick={() =>
    changeGroup(
      "Do Not Reach"
    )
  }
  className="
  bg-red-500
  hover:bg-red-600
  text-white
  px-5
  py-3
  rounded-xl
  font-semibold
  transition
  "
>
  Move To Do Not Reach
</button>

<button
  onClick={() =>
    changeGroup(
      "Unsubscribed"
    )
  }
  className="
  bg-yellow-400
  hover:bg-yellow-500
  text-black
  px-5
  py-3
  rounded-xl
  font-semibold
  transition
  "
>
  Unsubscribe
</button>

          </div>

        </div>

      </div>

      {/* Stats */}
      <div
        className="
        grid
        md:grid-cols-3
        gap-6
        "
      >

        <div
          className="
          bg-yellow-50
          border
          border-yellow-200
          rounded-2xl
          p-6
          "
        >

          <p className="text-gray-500">
            Total Trips
          </p>

          <h2
            className="
            text-4xl
            font-bold
            mt-2
            "
          >
            {totalTrips}
          </h2>

        </div>

        <div
          className="
          bg-green-50
          border
          border-green-200
          rounded-2xl
          p-6
          "
        >

          <p className="text-gray-500">
            Lifetime Revenue
          </p>

          <h2
            className="
            text-4xl
            font-bold
            mt-2
            "
          >
            ₹{lifetimeRevenue}
          </h2>

        </div>

        <div
          className="
          bg-blue-50
          border
          border-blue-200
          rounded-2xl
          p-6
          "
        >

          <p className="text-gray-500">
            Customer Group
          </p>

          <h2
            className="
            text-2xl
            font-bold
            mt-2
            "
          >
            {customer.group_type}
          </h2>

        </div>

      </div>

      {/* Customer Details */}

      <div
        className="
        bg-white
        rounded-2xl
        shadow
        border
        p-6
        "
      >

        <h2
          className="
          text-2xl
          font-bold
          mb-5
          "
        >
          Customer Details
        </h2>

        <div className="grid md:grid-cols-2 gap-4">

          <p>
            <strong>Name:</strong>
            {" "}
            {customer.customer_name}
          </p>

          <p>
            <strong>Mobile:</strong>
            {" "}
            {customer.mobile_number}
          </p>

          <p>
            <strong>Location:</strong>
            {" "}
            {customer.location_type}
          </p>

          <p>
            <strong>Group:</strong>
            {" "}
            {customer.group_type}
          </p>

          <p>
            <strong>Interests:</strong>
            {" "}
            {customer.interests}
          </p>

        </div>

      </div>

      {/* Booking History */}

      <div
        className="
        bg-white
        rounded-2xl
        shadow
        border
        overflow-hidden
        "
      >

        <div className="p-6 border-b">

          <h2
            className="
            text-2xl
            font-bold
            "
          >
            Booking History
          </h2>

        </div>

        <table className="w-full">

          <thead
            className="
            bg-gray-100
            "
          >

            <tr>

              <th className="p-4 text-left">
                Yatra
              </th>

              <th className="p-4 text-left">
                Start Date
              </th>

              <th className="p-4 text-left">
                End Date
              </th>

              <th className="p-4 text-left">
                Amount
              </th>

            </tr>

          </thead>

          <tbody>

            {bookings?.length > 0 ? (

              bookings.map(
                (booking) => (

                  <tr
                    key={booking.id}
                    className="border-b"
                  >

                    <td className="p-4">
                      {booking.yatra_name}
                    </td>

                    <td className="p-4">
                      {booking.start_date}
                    </td>

                    <td className="p-4">
                      {booking.end_date}
                    </td>

                    <td className="p-4">
                      ₹
                      {booking.total_amount}
                    </td>

                  </tr>

                )
              )

            ) : (

              <tr>

                <td
                  colSpan="4"
                  className="
                  p-8
                  text-center
                  text-gray-500
                  "
                >
                  No bookings found
                </td>

              </tr>

            )}

          </tbody>

        </table>

      </div>

    </div>

  );

}

export default CustomerProfilePage;