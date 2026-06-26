import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

function DailyReach() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      const res = await axios.get(
        "http://localhost:5001/api/customers/group/daily-reach"
      );

      setCustomers(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const filteredCustomers = customers.filter((customer) =>
    customer.customer_name
      ?.toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">

      {/* Header */}

      <div className="flex justify-between items-center">

        <div>

          <h1 className="text-4xl font-bold">
            Daily Reach Customers
          </h1>

          <p className="text-gray-500 mt-2">
            Total Customers : {customers.length}
          </p>

        </div>

        <input
          type="text"
          placeholder="Search customer..."
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
          className="
          border
          rounded-xl
          px-4
          py-3
          w-72
          outline-none
          focus:ring-2
          focus:ring-yellow-400
          "
        />

      </div>

      {/* Stats Card */}

      <div
        className="
        bg-green-50
        border
        border-green-200
        rounded-2xl
        p-6
        "
      >

        <h3
          className="
          text-green-700
          font-semibold
          "
        >
          Daily Reach Group
        </h3>

        <p
          className="
          text-4xl
          font-bold
          mt-3
          "
        >
          {customers.length}
        </p>

      </div>

      {/* Table */}

      <div
        className="
        bg-white
        rounded-2xl
        shadow
        border
        overflow-hidden
        "
      >

        <table className="w-full">

          <thead
            className="
            bg-yellow-400
            text-black
            "
          >
            <tr>

              <th className="p-4 text-left">
                Name
              </th>

              <th className="p-4 text-left">
                Mobile
              </th>

              <th className="p-4 text-left">
                Interests
              </th>

              <th className="p-4 text-left">
                Action
              </th>

            </tr>
          </thead>

          <tbody>

            {filteredCustomers.map(
              (customer) => (

                <tr
                  key={customer.id}
                  className="
                  border-b
                  hover:bg-gray-50
                  "
                >

                  <td className="p-4">
                    {customer.customer_name}
                  </td>

                  <td className="p-4">
                    {customer.mobile_number}
                  </td>

                  <td className="p-4">
                    {customer.interests}
                  </td>

                  <td className="p-4">

                    <Link
                      to={`/customers/${customer.id}`}
                      className="
                      bg-blue-500
                      hover:bg-blue-600
                      text-white
                      px-4
                      py-2
                      rounded-lg
                      "
                    >
                      View Profile
                    </Link>

                  </td>

                </tr>

              )
            )}

            {filteredCustomers.length === 0 && (
              <tr>
                <td
                  colSpan="4"
                  className="
                  p-8
                  text-center
                  text-gray-500
                  "
                >
                  No customers found
                </td>
              </tr>
            )}

          </tbody>

        </table>

      </div>

    </div>
  );
}

export default DailyReach;