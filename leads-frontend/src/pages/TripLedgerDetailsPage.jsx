import { Link } from "react-router-dom";

import TripSummary from "../components/tripLedger/TripSummary";
import BookingTable from "../components/tripLedger/BookingTable";
import PaymentTable from "../components/tripLedger/PaymentTable";
import ExpenseTable from "../components/tripLedger/ExpenseTable";
import ReceiptTable from "../components/tripLedger/ReceiptTable";

function TripLedgerDetailsPage() {

  return (

    <div className="space-y-8">

      {/* Header */}

      <div className="flex justify-between items-center">

        <div>

          <Link
            to="/trip-ledger"
            className="
            text-blue-600
            font-semibold
            "
          >
            ← Back To Trips
          </Link>

          <h1
            className="
            text-4xl
            font-bold
            mt-4
            "
          >
            Rishikesh Camping
          </h1>

          <p className="text-gray-500 mt-2">

            21 June 2026
            →
            23 June 2026

          </p>

        </div>

        <span
          className="
          bg-green-100
          text-green-700
          px-5
          py-2
          rounded-full
          font-semibold
          "
        >
          Upcoming
        </span>

      </div>

      {/* Summary */}

      <TripSummary />

      {/* Tabs */}

      <div
        className="
        flex
        gap-4
        border-b
        pb-4
        "
      >

        <button
          className="
          bg-yellow-400
          px-5
          py-2
          rounded-xl
          font-semibold
          "
        >
          Bookings
        </button>

        <button
          className="
          bg-gray-100
          px-5
          py-2
          rounded-xl
          "
        >
          Payments
        </button>

        <button
          className="
          bg-gray-100
          px-5
          py-2
          rounded-xl
          "
        >
          Expenses
        </button>

        <button
          className="
          bg-gray-100
          px-5
          py-2
          rounded-xl
          "
        >
          Receipts
        </button>

      </div>

      {/* Default */}

      <BookingTable />

    </div>

  );

}

export default TripLedgerDetailsPage;