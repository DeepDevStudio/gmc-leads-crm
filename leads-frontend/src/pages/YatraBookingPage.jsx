import { useEffect, useState } from "react";

import {
  getCustomers,
} from "../services/customerService";

import {
  getYatras,
} from "../services/yatraService";


import {
  createBooking,
} from "../services/yatraBookingService";


function YatraBookingPage() {

  const [customers, setCustomers] =
    useState([]);

  const [yatras, setYatras] =
    useState([]);

  const [selectedCustomer,
    setSelectedCustomer] =
    useState("");

  const [selectedYatra,
    setSelectedYatra] =
    useState("");

  const [ratePerSeat, setRatePerSeat] =
    useState(0);

  const [advanceAmount, setAdvanceAmount] =
    useState("");

  const [totalAmount, setTotalAmount] =
    useState(0);

  const [balanceAmount, setBalanceAmount] =
    useState(0);


  const [remarks,
    setRemarks] =
    useState("");

  const [travelers,
    setTravelers] =
    useState([
      {
        traveler_name: "",
        age: "",
        gender: "Male",
        mobile_number: "",
      },
    ]);

  useEffect(() => {

    loadData();

  }, []);


  useEffect(() => {

    const seats =
      travelers.length;

    const total =
      seats * ratePerSeat;

    const advance =
      Number(advanceAmount) || 0;

    setTotalAmount(total);

    setBalanceAmount(
      total - advance
    );

  }, [
    travelers,
    ratePerSeat,
    advanceAmount,
  ]);


  const loadData =
    async () => {

      const customerData =
        await getCustomers();

      const yatraData =
        await getYatras();

      setCustomers(
        customerData
      );

      setYatras(
        yatraData
      );

    };

  const addTraveler =
    () => {

      setTravelers([
        ...travelers,
        {
          traveler_name: "",
          age: "",
          gender: "Male",
          mobile_number: "",
        },
      ]);

    };

  const updateTraveler =
    (
      index,
      field,
      value
    ) => {

      const updated =
        [...travelers];

      updated[index][field] =
        value;

      setTravelers(
        updated
      );

    };

  const handleSaveBooking =
    async () => {

      try {

        if (!selectedCustomer) {

          alert(
            "Select Customer"
          );

          return;

        }

        if (!selectedYatra) {

          alert(
            "Select Yatra"
          );

          return;

        }

        const validTravelers =
          travelers.filter(
            (t) =>
              t.traveler_name
          );

        if (
          validTravelers.length === 0
        ) {

          alert(
            "Add Traveler"
          );

          return;

        }

        await createBooking({

          customer_id:
            selectedCustomer,

          yatra_id:
            selectedYatra,

          advance_amount:
            advanceAmount,

          remarks,

          booked_by:
            "Admin",

          travelers:
            validTravelers,

        });

        alert(
          "Booking Created Successfully"
        );

        setSelectedCustomer("");

        setSelectedYatra("");

        setRatePerSeat(0);

        setAdvanceAmount("");

        setRemarks("");

        setTravelers([
          {
            traveler_name: "",
            age: "",
            gender: "Male",
            mobile_number: "",
          },
        ]);

      } catch (error) {

        console.log(error);

        alert(
          "Failed To Create Booking"
        );

      }

    };

  return (
    <div className="space-y-6">

      <div>

        <h1
          className="
          text-3xl
          font-bold
          "
        >
          Yatra Bookings
        </h1>

        <p
          className="
          text-gray-500
          "
        >
          Create Travel Booking
        </p>

      </div>

      <div
        className="
        bg-white
        rounded-2xl
        border
        shadow
        p-6
        "
      >

        <div
          className="
          grid
          md:grid-cols-2
          gap-4
          "
        >

          <div>

            <label>
              Customer
            </label>

            <select
              value={
                selectedCustomer
              }
              onChange={(e) =>
                setSelectedCustomer(
                  e.target.value
                )
              }
              className="
              w-full
              border
              p-3
              rounded-xl
              mt-2
              "
            >

              <option value="">
                Select Customer
              </option>

              {customers.map(
                (
                  customer
                ) => (

                  <option
                    key={
                      customer.id
                    }
                    value={
                      customer.id
                    }
                  >
                    {
                      customer.customer_name
                    }
                  </option>

                )
              )}

            </select>

          </div>

          <div>

            <label>
              Yatra
            </label>

            <select
              value={
                selectedYatra
              }

              onChange={(e) => {

                const yatraId =
                  e.target.value;

                setSelectedYatra(
                  yatraId
                );

                const selected =
                  yatras.find(
                    (y) =>
                      y.id ==
                      yatraId
                  );

                if (selected) {

                  setRatePerSeat(
                    Number(
                      selected.rate_per_seat
                    )
                  );

                }

              }}

              className="
              w-full
              border
              p-3
              rounded-xl
              mt-2
              "
            >

              <option value="">
                Select Yatra
              </option>

              {yatras.map(
                (
                  yatra
                ) => (

                  <option
                    key={
                      yatra.id
                    }
                    value={
                      yatra.id
                    }
                  >
                    {
                      yatra.yatra_name
                    }
                  </option>

                )
              )}

            </select>

          </div>

        </div>

      </div>

      <div
        className="
        bg-white
        rounded-2xl
        border
        shadow
        p-6
        "
      >

        <div
          className="
          flex
          justify-between
          items-center
          mb-5
          "
        >

          <h2
            className="
            text-xl
            font-semibold
            "
          >
            Travelers
          </h2>

          <button
            onClick={
              addTraveler
            }
            className="
            bg-yellow-400
            px-4
            py-2
            rounded-xl
            font-semibold
            "
          >
            + Add Traveler
          </button>

        </div>

        {travelers.map(
          (
            traveler,
            index
          ) => (

            <div
              key={index}
              className="
              grid
              md:grid-cols-4
              gap-3
              mb-4
              "
            >

              <input
                placeholder="Name"
                value={
                  traveler.traveler_name
                }
                onChange={(e) =>
                  updateTraveler(
                    index,
                    "traveler_name",
                    e.target.value
                  )
                }
                className="
                border
                p-3
                rounded-xl
                "
              />

              <input
                placeholder="Age"
                value={
                  traveler.age
                }
                onChange={(e) =>
                  updateTraveler(
                    index,
                    "age",
                    e.target.value
                  )
                }
                className="
                border
                p-3
                rounded-xl
                "
              />

              <select
                value={
                  traveler.gender
                }
                onChange={(e) =>
                  updateTraveler(
                    index,
                    "gender",
                    e.target.value
                  )
                }
                className="
                border
                p-3
                rounded-xl
                "
              >
                <option>
                  Male
                </option>

                <option>
                  Female
                </option>

              </select>

              <input
                placeholder="Mobile"
                value={
                  traveler.mobile_number
                }
                onChange={(e) =>
                  updateTraveler(
                    index,
                    "mobile_number",
                    e.target.value
                  )
                }
                className="
                border
                p-3
                rounded-xl
                "
              />

            </div>

          )
        )}

      </div>
      <div
        className="
  bg-white
  rounded-2xl
  border
  shadow
  p-6
  "
      >

        <h2
          className="
    text-xl
    font-semibold
    mb-4
    "
        >
          Booking Summary
        </h2>

        <div
          className="
    grid
    md:grid-cols-2
    gap-4
    "
        >

          <div>
            <label>Total Seats</label>

            <input
              value={travelers.length}
              readOnly
              className="
        w-full
        border
        p-3
        rounded-xl
        mt-2
        bg-gray-100
        "
            />
          </div>

          <div>
            <label>Rate Per Seat</label>

            <input
              value={ratePerSeat}
              readOnly
              className="
        w-full
        border
        p-3
        rounded-xl
        mt-2
        bg-gray-100
        "
            />
          </div>

          <div>
            <label>Total Amount</label>

            <input
              value={totalAmount}
              readOnly
              className="
        w-full
        border
        p-3
        rounded-xl
        mt-2
        bg-gray-100
        "
            />
          </div>

          <div>
            <label>Advance Amount</label>

            <input
              type="number"
              value={advanceAmount}
              onChange={(e) =>
                setAdvanceAmount(
                  e.target.value
                )
              }
              className="
        w-full
        border
        p-3
        rounded-xl
        mt-2
        "
            />
          </div>

          <div>
            <label>Balance Amount</label>

            <input
              value={balanceAmount}
              readOnly
              className="
        w-full
        border
        p-3
        rounded-xl
        mt-2
        bg-gray-100
        "
            />
          </div>

          <div className="md:col-span-2">

            <label>
              Remarks
            </label>

            <textarea
              value={remarks}
              onChange={(e) =>
                setRemarks(
                  e.target.value
                )
              }
              rows="3"
              className="
    w-full
    border
    p-3
    rounded-xl
    mt-2
    "
            />

          </div>

          <div className="mt-6">

            <button
              onClick={handleSaveBooking}
              className="
    bg-green-600
    hover:bg-green-700
    text-white
    px-6
    py-3
    rounded-xl
    font-semibold
    "
            >
              Save Booking
            </button>

          </div>



        </div>
      </div>

    </div>

    // </div>

    // </div>


  );
}

export default YatraBookingPage;