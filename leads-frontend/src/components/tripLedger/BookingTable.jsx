function BookingTable() {

  const bookings = [

    {
      id: 1,
      customer: "Deepanshu",
      mobile: "9311310550",
      passengers: 5,
      ticketPrice: 6500,
      discount: 1000,
      total: 31500,
      advance: 10000,
      balance: 21500,
    },

    {
      id: 2,
      customer: "Rahul",
      mobile: "9876543210",
      passengers: 1,
      ticketPrice: 6500,
      discount: 0,
      total: 6500,
      advance: 6500,
      balance: 0,
    },

    {
      id: 3,
      customer: "Aman",
      mobile: "9988776655",
      passengers: 3,
      ticketPrice: 6500,
      discount: 1500,
      total: 18000,
      advance: 10000,
      balance: 8000,
    },

  ];

  return (

    <div className="space-y-5">

      {

        bookings.map((booking) => (

          <div
            key={booking.id}
            className="
            bg-white
            border
            rounded-2xl
            shadow
            p-6
            "
          >

            <div className="flex justify-between">

              <div>

                <h2 className="text-2xl font-bold">

                  {booking.customer}

                </h2>

                <p className="text-gray-500">

                  {booking.mobile}

                </p>

              </div>

              <div>

                {

                  booking.balance === 0 ?

                  <span
                    className="
                    bg-green-100
                    text-green-700
                    px-4
                    py-2
                    rounded-full
                    font-semibold
                    "
                  >

                    Paid

                  </span>

                  :

                  <span
                    className="
                    bg-red-100
                    text-red-700
                    px-4
                    py-2
                    rounded-full
                    font-semibold
                    "
                  >

                    Pending

                  </span>

                }

              </div>

            </div>

            <div
              className="
              grid
              md:grid-cols-6
              gap-6
              mt-8
              "
            >

              <div>

                <p className="text-gray-500">
                  Passengers
                </p>

                <h3 className="font-bold text-xl">

                  {booking.passengers}

                </h3>

              </div>

              <div>

                <p className="text-gray-500">
                  Ticket
                </p>

                <h3 className="font-bold text-xl">

                  ₹{booking.ticketPrice}

                </h3>

              </div>

              <div>

                <p className="text-gray-500">
                  Discount
                </p>

                <h3 className="font-bold text-xl text-red-500">

                  ₹{booking.discount}

                </h3>

              </div>

              <div>

                <p className="text-gray-500">
                  Total
                </p>

                <h3 className="font-bold text-xl text-blue-600">

                  ₹{booking.total}

                </h3>

              </div>

              <div>

                <p className="text-gray-500">
                  Advance
                </p>

                <h3 className="font-bold text-xl text-green-600">

                  ₹{booking.advance}

                </h3>

              </div>

              <div>

                <p className="text-gray-500">
                  Balance
                </p>

                <h3 className="font-bold text-xl text-orange-500">

                  ₹{booking.balance}

                </h3>

              </div>

            </div>

            <div className="flex gap-3 mt-8">

              <button
                className="
                bg-yellow-400
                hover:bg-yellow-500
                px-5
                py-2
                rounded-xl
                font-semibold
                "
              >

                Collect Balance

              </button>

              <button
                className="
                bg-blue-500
                hover:bg-blue-600
                text-white
                px-5
                py-2
                rounded-xl
                "
              >

                Receipt

              </button>

              <button
                className="
                bg-gray-700
                hover:bg-black
                text-white
                px-5
                py-2
                rounded-xl
                "
              >

                Edit

              </button>

            </div>

          </div>

        ))

      }

    </div>

  );

}

export default BookingTable;