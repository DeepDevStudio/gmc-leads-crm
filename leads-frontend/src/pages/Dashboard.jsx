import {
  useEffect,
  useState,
} from "react";

import {
  getDashboardStats,
} from "../services/dashboardService";

import {
  getActivities,
} from "../services/activityService";

import { Link } from "react-router-dom";
function Dashboard() {

  const [stats, setStats] =
    useState({
      customers: 0,
      templates: 0,
      activities: 0,
      messages: 0,
    });

    const [activities,
  setActivities] =
  useState([]);

 
  useEffect(() => {

  loadStats();
  loadActivities();

}, []);

  const loadStats =
    async () => {

      try {

        const data =
          await getDashboardStats();

        setStats(data);

      } catch (error) {

        console.error(error);

      }

    };


const loadActivities =
  async () => {

    try {

      const data =
        await getActivities();

      setActivities(
        data.slice(0, 5)
      );

    } catch (error) {

      console.error(error);

    }

  };

    
  const cards = [

    {
      title:
        "Total Customers",
      value:
        stats.customers,
    },

    {
      title:
        "Templates",
      value:
        stats.templates,
    },

    {
      title:
        "Activities",
      value:
        stats.activities,
    },

    {
      title:
        "Messages Sent",
      value:
        stats.messages,
    },

  ];

  return (

    <div className="space-y-8">

      <div>

        <h1 className="text-4xl font-bold">
          Dashboard
        </h1>

        <p className="text-gray-500 mt-2">
          GMC Leads CRM Overview
        </p>

      </div>

      <div className="grid md:grid-cols-4 gap-6">

        {cards.map(
          (item, index) => (

            <div
              key={index}
              className="
              bg-white
              rounded-2xl
              shadow
              border
              p-6
              "
            >

              <p className="text-gray-500 text-sm">
                {item.title}
              </p>

              <h2
                className="
                text-4xl
                font-bold
                mt-2
                text-yellow-500
                "
              >
                {item.value}
              </h2>

            </div>

          )
        )}

      </div>


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
          mb-4
          "
        >
          Quick Actions
        </h2>

      <div className="flex flex-wrap gap-4">

  <Link
    to="/customers/create"
    className="
    bg-yellow-400
    hover:bg-yellow-500
    px-5
    py-3
    rounded-xl
    font-semibold
    "
  >
    + Add Customer
  </Link>

  <Link
    to="/templates"
    className="
    bg-black
    text-white
    hover:bg-gray-800
    px-5
    py-3
    rounded-xl
    "
  >
    + Create Template
  </Link>

  <Link
    to="/automation"
    className="
    bg-green-500
    text-white
    hover:bg-green-600
    px-5
    py-3
    rounded-xl
    "
  >
    Run Automation
  </Link>

  <Link
    to="/customers"
    className="
    bg-blue-500
    text-white
    hover:bg-blue-600
    px-5
    py-3
    rounded-xl
    "
  >
    View Customers
  </Link>

</div>
      </div>


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
          mb-4
          "
        >
          Today's Overview
        </h2>

        <div
          className="
          grid
          md:grid-cols-2
          gap-6
          "
        >

          <div
            className="
            bg-yellow-50
            border
            border-yellow-200
            rounded-xl
            p-5
            "
          >

            <h3 className="font-semibold">
              Total Activities
            </h3>

            <p
              className="
              text-3xl
              font-bold
              mt-2
              "
            >
              {stats.activities}
            </p>

          </div>

          <div
            className="
            bg-green-50
            border
            border-green-200
            rounded-xl
            p-5
            "
          >

            <h3 className="font-semibold">
              Messages Sent
            </h3>

            <p
              className="
              text-3xl
              font-bold
              mt-2
              "
            >
              {stats.messages}
            </p>

          </div>

        </div>

      </div>

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
          mb-4
          "
        >
          Recent Activities
        </h2>

        <div className="space-y-4">

  {activities.map(
    (item) => (

      <div
        key={item.id}
        className="
        border-b
        pb-3
        "
      >

        <p className="font-semibold">
          {item.username}
        </p>

        <p className="text-gray-500">
          {item.activity}
        </p>

      </div>

    )
  )}

</div>

      </div>

    

    </div>

  );

}

export default Dashboard;