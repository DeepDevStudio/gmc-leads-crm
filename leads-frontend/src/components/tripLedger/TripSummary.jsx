function TripSummary() {

  const cards = [

    {
      title: "Passengers",
      value: 42,
      color: "text-blue-600",
    },

    {
      title: "Revenue",
      value: "₹2,52,000",
      color: "text-green-600",
    },

    {
      title: "Advance",
      value: "₹1,98,000",
      color: "text-yellow-600",
    },

    {
      title: "Pending",
      value: "₹54,000",
      color: "text-red-600",
    },

    {
      title: "Expenses",
      value: "₹1,26,000",
      color: "text-purple-600",
    },

    {
      title: "Profit",
      value: "₹1,26,000",
      color: "text-emerald-600",
    },

  ];

  return (

    <div
      className="
      grid
      md:grid-cols-3
      xl:grid-cols-6
      gap-5
      "
    >

      {

        cards.map((card) => (

          <div
            key={card.title}
            className="
            bg-white
            rounded-2xl
            border
            shadow
            p-5
            "
          >

            <p className="text-gray-500">

              {card.title}

            </p>

            <h2
              className={`
              text-3xl
              font-bold
              mt-3
              ${card.color}
              `}
            >

              {card.value}

            </h2>

          </div>

        ))

      }

    </div>

  );

}

export default TripSummary;