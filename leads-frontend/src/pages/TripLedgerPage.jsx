import { useState } from "react";

import TripCard from "../components/tripLedger/TripCard";
import CreateTripModal from "../components/tripLedger/CreateTripModal";

function TripLedgerPage() {

  const [openModal, setOpenModal] =
    useState(false);

  const trips = [

    {
      id: 1,
      name: "Rishikesh Camping",
      startDate: "21 Jun 2026",
      endDate: "23 Jun 2026",
      passengers: 42,
      revenue: 252000,
      balance: 48000,
      expenses: 126000,
      profit: 126000,
      status: "Upcoming",
    },

    {
      id: 2,
      name: "Rishikesh Camping",
      startDate: "14 Jun 2026",
      endDate: "16 Jun 2026",
      passengers: 31,
      revenue: 186000,
      balance: 22000,
      expenses: 91000,
      profit: 95000,
      status: "Completed",
    },

    {
      id: 3,
      name: "Kasol Adventure",
      startDate: "05 Jul 2026",
      endDate: "08 Jul 2026",
      passengers: 28,
      revenue: 198000,
      balance: 67000,
      expenses: 82000,
      profit: 116000,
      status: "Upcoming",
    },

    {
      id: 4,
      name: "Manali Snow Trip",
      startDate: "12 Jul 2026",
      endDate: "17 Jul 2026",
      passengers: 37,
      revenue: 314000,
      balance: 91000,
      expenses: 154000,
      profit: 160000,
      status: "Upcoming",
    },

  ];

  return (

    <div className="space-y-8">

      {/* Header */}

      <div className="flex justify-between items-center">

        <div>

          <h1
            className="
            text-4xl
            font-bold
            "
          >
            Trip Ledger
          </h1>

          <p className="text-gray-500 mt-2">

            Manage every trip,
            bookings,
            collections,
            expenses
            and profits.

          </p>

        </div>

        <button
          onClick={() =>
            setOpenModal(true)
          }
          className="
          bg-yellow-400
          hover:bg-yellow-500
          text-black
          px-6
          py-3
          rounded-xl
          font-semibold
          shadow
          "
        >
          + Create Trip
        </button>

      </div>

      {/* Summary */}

      <div
        className="
        grid
        sm:grid-cols-2
        xl:grid-cols-4
        gap-6
        "
      >

        <div
          className="
          bg-white
          rounded-2xl
          border
          shadow
          p-6
          "
        >

          <p className="text-gray-500">
            Active Trips
          </p>

          <h2
            className="
            text-5xl
            font-bold
            mt-3
            "
          >
            6
          </h2>

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

          <p className="text-gray-500">
            Total Revenue
          </p>

          <h2
            className="
            text-5xl
            font-bold
            text-green-600
            mt-3
            "
          >
            ₹9.5L
          </h2>

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

          <p className="text-gray-500">
            Pending Collection
          </p>

          <h2
            className="
            text-5xl
            font-bold
            text-red-500
            mt-3
            "
          >
            ₹2.1L
          </h2>

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

          <p className="text-gray-500">
            Net Profit
          </p>

          <h2
            className="
            text-5xl
            font-bold
            text-blue-600
            mt-3
            "
          >
            ₹5.8L
          </h2>

        </div>

      </div>

      {/* Trips */}

      <div
        className="
        grid
        md:grid-cols-2
        xl:grid-cols-3
        gap-7
        "
      >

        {

          trips.map((trip) => (

            <TripCard
              key={trip.id}
              trip={trip}
            />

          ))

        }

      </div>

      <CreateTripModal
        open={openModal}
        onClose={() =>
          setOpenModal(false)
        }
      />

    </div>

  );

}

export default TripLedgerPage;