import {
  useEffect,
  useState,
} from "react";

import { Link } from "react-router-dom";

import {
  getCustomers,
  deleteCustomer,
  updateCustomer,
} from "../services/customerService";

function CustomersPage() {
  const [customers, setCustomers] =
    useState([]);

  const [search, setSearch] =
    useState("");

    const [editingCustomer,
  setEditingCustomer] =
  useState(null);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers =
    async () => {

      try {

        const data =
          await getCustomers();

        setCustomers(data);

      } catch (error) {

        console.error(error);

      }

    };

const handleEdit =
  async () => {

    try {

      await updateCustomer(
        editingCustomer.id,
        editingCustomer
      );

      loadCustomers();

      setEditingCustomer(
        null
      );

      alert(
        "Customer Updated"
      );

    } catch (error) {

      console.error(error);

    }

  };


  const handleDelete =
    async (id) => {

      const confirmDelete =
        window.confirm(
          "Delete Customer?"
        );

      if (!confirmDelete) {
        return;
      }

      try {

        await deleteCustomer(id);

        loadCustomers();

      } catch (error) {

        console.error(error);

      }

    };

  const filteredCustomers =
    customers.filter(
      (customer) =>
        customer.customer_name
          ?.toLowerCase()
          .includes(
            search.toLowerCase()
          ) ||
        customer.mobile_number
          ?.includes(search) ||
        customer.interests
          ?.toLowerCase()
          .includes(
            search.toLowerCase()
          )
    );

  const totalCustomers =
    customers.length;

  const dailyReach =
    customers.filter(
      (c) =>
        c.group_type ===
        "Daily Reach"
    ).length;

  const doNotReach =
    customers.filter(
      (c) =>
        c.group_type ===
        "Do Not Reach"
    ).length;

  const unsubscribed =
    customers.filter(
      (c) =>
        c.group_type ===
        "Unsubscribed"
    ).length;

  return (
    <div className="space-y-6">

      {/* Header */}

      <div className="flex justify-between items-center">

        <div>

          <h1 className="text-3xl font-bold">
            Customers
          </h1>

          <p className="text-gray-500">
            Manage CRM Customers
          </p>

        </div>

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

      </div>

      {/* Stats */}

      <div className="grid md:grid-cols-4 gap-6">

        <div className="bg-white p-6 rounded-2xl shadow border">
          <p>Total Customers</p>
          <h2 className="text-3xl font-bold">
            {totalCustomers}
          </h2>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow border">
          <p>Daily Reach</p>
          <h2 className="text-3xl font-bold text-green-600">
            {dailyReach}
          </h2>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow border">
          <p>Do Not Reach</p>
          <h2 className="text-3xl font-bold text-red-600">
            {doNotReach}
          </h2>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow border">
          <p>Unsubscribed</p>
          <h2 className="text-3xl font-bold text-gray-600">
            {unsubscribed}
          </h2>
        </div>

      </div>

      {/* Search */}

      <input
        type="text"
        placeholder="Search Name, Mobile, Interest..."
        value={search}
        onChange={(e) =>
          setSearch(
            e.target.value
          )
        }
        className="
        w-full
        border
        rounded-xl
        p-3
        bg-white
        "
      />

      {/* Table */}

      <div className="bg-white rounded-2xl shadow border overflow-hidden">

        <table className="w-full">

          <thead>

            <tr className="bg-black text-yellow-400">
              <th className="p-3 text-left">
                Mobile / Customer
              </th>
              <th className="p-3 text-left">
                Interests
              </th>

              <th className="p-3 text-left">
                Location
              </th>

              <th className="p-3 text-left">
                Group
              </th>

              <th className="p-3 text-left">
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

                <td className="p-3">

 <Link
  to={`/customers/${customer.id}`}
  className="
  font-semibold
  text-blue-600
  hover:underline
  "
>
  {customer.mobile_number}
</Link>

 <Link
  to={`/customers/${customer.id}`}
  className="
  text-sm
  text-gray-500
  hover:underline
  block
  "
>
  {customer.customer_name}
</Link>

</td>

                  <td className="p-3">
                    {
                      customer.interests
                    }
                  </td>

                  <td className="p-3">
                    {
                      customer.location_type
                    }
                  </td>

                  <td className="p-3">

                    <span
                      className={`
                      px-3
                      py-1
                      rounded-full
                      text-sm

                      ${customer.group_type ===
                          "Daily Reach"
                          ? "bg-green-100 text-green-700"
                          : customer.group_type ===
                            "Do Not Reach"
                            ? "bg-red-100 text-red-700"
                            : "bg-gray-100 text-gray-700"
                        }
                      `}
                    >
                      {
                        customer.group_type
                      }
                    </span>

                  </td>

                  <td className="p-3 flex gap-2">

  <button
    onClick={() =>
      setEditingCustomer(
        customer
      )
    }
    className="
    bg-blue-500
    hover:bg-blue-600
    text-white
    px-3
    py-1
    rounded-lg
    "
  >
    Edit
  </button>

  <button
    onClick={() =>
      handleDelete(
        customer.id
      )
    }
    className="
    bg-red-500
    hover:bg-red-600
    text-white
    px-3
    py-1
    rounded-lg
    "
  >
    Delete
  </button>

</td>

                </tr>

              )
            )}

          </tbody>

        </table>

      </div>


{
  editingCustomer && (

    <div
      className="
      fixed
      inset-0
      bg-black/50
      flex
      items-center
      justify-center
      "
    >

      <div
        className="
        bg-white
        p-6
        rounded-2xl
        w-[500px]
        "
      >

        <h2
          className="
          text-2xl
          font-bold
          mb-4
          "
        >
          Edit Customer
        </h2>

        <input
          value={
            editingCustomer.mobile_number
          }
          onChange={(e) =>
            setEditingCustomer({
              ...editingCustomer,
              mobile_number:
                e.target.value,
            })
          }
          className="
          w-full
          border
          p-3
          rounded-xl
          mb-3
          "
        />

        <input
          value={
            editingCustomer.customer_name
          }
          onChange={(e) =>
            setEditingCustomer({
              ...editingCustomer,
              customer_name:
                e.target.value,
            })
          }
          className="
          w-full
          border
          p-3
          rounded-xl
          mb-3
          "
        />

        <button
          onClick={
            handleEdit
          }
          className="
          bg-green-500
          hover:bg-green-600
          text-white
          px-5
          py-2
          rounded-xl
          "
        >
          Save
        </button>

        <button
          onClick={() =>
            setEditingCustomer(
              null
            )
          }
          className="
          ml-3
          bg-gray-500
          hover:bg-gray-600
          text-white
          px-5
          py-2
          rounded-xl
          "
        >
          Cancel
        </button>

      </div>

    </div>

  )
}
    </div>
  );
}

export default CustomersPage;