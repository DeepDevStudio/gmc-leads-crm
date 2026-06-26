import { Link } from "react-router-dom";

function TripCard({ trip }) {

  return (

    <div
      className="
      bg-white
      rounded-2xl
      border
      shadow-sm
      hover:shadow-xl
      transition
      p-6
      "
    >

      <div className="flex justify-between">

        <div>

          <h2
            className="
            text-2xl
            font-bold
            "
          >
            {trip.name}
          </h2>

          <p className="text-gray-500 mt-1">
            {trip.startDate} → {trip.endDate}
          </p>

        </div>

        <span
          className={`
          px-3
          py-1
          rounded-full
          text-sm
          font-semibold

          ${
            trip.status === "Upcoming"
              ? "bg-green-100 text-green-700"
              : "bg-gray-200 text-gray-700"
          }
          `}
        >
          {trip.status}
        </span>

      </div>

      <div
        className="
        grid
        grid-cols-3
        gap-4
        mt-8
        "
      >

        <div>

          <p className="text-gray-500 text-sm">
            Passengers
          </p>

          <h3
            className="
            text-2xl
            font-bold
            "
          >
            {trip.passengers}
          </h3>

        </div>

        <div>

          <p className="text-gray-500 text-sm">
            Revenue
          </p>

          <h3
            className="
            text-2xl
            font-bold
            text-green-600
            "
          >
            ₹
            {trip.revenue.toLocaleString()}
          </h3>

        </div>

        <div>

          <p className="text-gray-500 text-sm">
            Balance
          </p>

          <h3
            className="
            text-2xl
            font-bold
            text-red-500
            "
          >
            ₹
            {trip.balance.toLocaleString()}
          </h3>

        </div>

      </div>

      <Link
        to={`/trip-ledger/${trip.id}`}
        className="
        block
        mt-8
        text-center
        bg-yellow-400
        hover:bg-yellow-500
        text-black
        font-semibold
        py-3
        rounded-xl
        "
      >
        Open Ledger
      </Link>

    </div>

  );

}

export default TripCard;