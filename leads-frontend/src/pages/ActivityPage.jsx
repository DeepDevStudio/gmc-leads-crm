import {
  useEffect,
  useState,
} from "react";

import {
  getActivities,
} from "../services/activityService";

function ActivityPage() {

  const [activities,
    setActivities] =
    useState([]);

  useEffect(() => {

    loadActivities();

  }, []);

  const loadActivities =
    async () => {

      const data =
        await getActivities();

      setActivities(data);

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
          Employee Activity
        </h1>

        <p
          className="
          text-gray-500
          "
        >
          Track Employee Work
        </p>

      </div>

      <div
        className="
        bg-white
        rounded-2xl
        shadow
        border
        overflow-hidden
        "
      >

        <table
          className="
          w-full
          "
        >

          <thead>

            <tr
              className="
              bg-black
              text-yellow-400
              "
            >

              <th className="p-3 text-left">
                Employee
              </th>

              <th className="p-3 text-left">
                Activity
              </th>

              <th className="p-3 text-left">
                Date
              </th>

            </tr>

          </thead>

          <tbody>

            {activities.map(
              (item) => (

                <tr
                  key={item.id}
                  className="
                  border-b
                  "
                >

                  <td className="p-3">
                    {item.username}
                  </td>

                  <td className="p-3">
                    {item.activity}
                  </td>

                  <td className="p-3">
                    {new Date(
                      item.created_at
                    ).toLocaleString()}
                  </td>

                </tr>

              )
            )}

          </tbody>

        </table>

      </div>

    </div>
  );
}

export default ActivityPage;