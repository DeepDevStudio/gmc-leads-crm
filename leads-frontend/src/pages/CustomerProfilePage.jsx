import {
  useEffect,
  useState,
} from "react";

import {
  useParams,
} from "react-router-dom";

import {
  getCustomer,
} from "../services/customerService";

function CustomerProfilePage() {

  const { id } =
    useParams();

  const [customer,
    setCustomer] =
    useState(null);

  useEffect(() => {
    loadCustomer();
  }, []);

  const loadCustomer =
    async () => {

      try {

        const data =
          await getCustomer(id);

        setCustomer(data);

      } catch (error) {

        console.error(error);

      }

    };

  if (!customer) {

    return (
      <p>
        Loading...
      </p>
    );

  }

  return (

    <div className="space-y-6">

      <div
        className="
        bg-white
        rounded-2xl
        shadow
        border
        p-6
        "
      >

        <h1
          className="
          text-3xl
          font-bold
          "
        >
          {customer.customer_name}
        </h1>

        <p className="text-gray-500">
          {customer.mobile_number}
        </p>

      </div>

      <div
        className="
        grid
        md:grid-cols-2
        gap-6
        "
      >

        <div
          className="
          bg-white
          p-6
          rounded-2xl
          shadow
          border
          "
        >

          <h2
            className="
            font-bold
            mb-4
            "
          >
            Customer Details
          </h2>

          <p>
            <strong>
              Location:
            </strong>
            {" "}
            {
              customer.location_type
            }
          </p>

          <p>
            <strong>
              Group:
            </strong>
            {" "}
            {
              customer.group_type
            }
          </p>

          <p>
            <strong>
              Interests:
            </strong>
            {" "}
            {
              customer.interests
            }
          </p>

        </div>

        <div
          className="
          bg-white
          p-6
          rounded-2xl
          shadow
          border
          "
        >

          <h2
            className="
            font-bold
            mb-4
            "
          >
            Travel Summary
          </h2>

          <p>
            Total Trips:
            0
          </p>

          <p>
            Lifetime Revenue:
            ₹0
          </p>

          <p>
            Pending Balance:
            ₹0
          </p>

        </div>

      </div>

    </div>

  );

}

export default CustomerProfilePage;