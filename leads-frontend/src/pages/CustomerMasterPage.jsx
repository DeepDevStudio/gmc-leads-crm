import {
  useState,
  useEffect,
} from "react";

import {
  createActivity,
} from "../services/activityService";

import {
  createCustomer,
   checkCustomer,
} from "../services/customerService";
// import { useState } from "react";


import {
  getInterests,
} from "../services/interestService";

function CustomerMasterPage() {
  const [formData, setFormData] =
    useState({
      customer_name: "",
      mobile_number: "",
      interests: "",
      location_type: "Delhi NCR",
      group_type: "Daily Reach",
    });


  const [interests, setInterests] =
    useState([]);

  const [selectedInterests, setSelectedInterests] =
    useState([]);

    const [existingCustomer,
  setExistingCustomer] =
  useState(null);

  const handleChange = (e) => {
    const { name, value } =
      e.target;

    if (
      name === "location_type" &&
      value === "Outside Delhi NCR"
    ) {
      setFormData({
        ...formData,
        location_type: value,
        group_type:
          "Do Not Reach",
      });

      return;
    }

    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleInterestChange =
    (e) => {

      const value =
        e.target.value;

      if (!value) return;

      if (
        selectedInterests.includes(
          value
        )
      ) {
        return;
      }

      setSelectedInterests([
        ...selectedInterests,
        value,
      ]);
    };

  const removeInterest =
    (interest) => {

      setSelectedInterests(
        selectedInterests.filter(
          (i) => i !== interest
        )
      );

    };


const handleMobileChange =
  async (e) => {

    const mobile =
      e.target.value;

    setFormData({

      ...formData,

      mobile_number:
        mobile,

    });

    if (
      mobile.length < 10
    ) {

      setExistingCustomer(
        null
      );

      return;

    }

    try {

      const result =
        await checkCustomer(
          mobile
        );

      if (
        result.exists
      ) {

        setExistingCustomer(
          result.customer
        );

      } else {

        setExistingCustomer(
          null
        );

      }

    } catch (error) {

      console.error(error);

    }

  };

  const handleSubmit =
    async () => {

if (
  existingCustomer
) {

  alert(
    "Customer Already Exists"
  );

  return;

}

      try {

        await createCustomer({

          ...formData,

          interests:
            selectedInterests.join(", "),

        });

        const user =
          JSON.parse(
            localStorage.getItem(
              "user"
            )
          );

        await createActivity({

          user_id:
            user.id,

          username:
            user.username,

          activity:
            `Added Customer: ${formData.customer_name}`,

        });

        alert(
          "Customer Saved Successfully"
        );

        setFormData({

          customer_name: "",
          mobile_number: "",
          interests: "",
          location_type:
            "Delhi NCR",
          group_type:
            "Daily Reach",
        

        });

        setSelectedInterests([]);

      } catch (error) {

        console.error(error);

        alert(
          "Failed To Save Customer"
        );

      }

    };

  useEffect(() => {
    loadInterests();
  }, []);

  const loadInterests =
    async () => {

      try {

        const data =
          await getInterests();

        setInterests(data);

      } catch (error) {

        console.error(error);

      }

    };

  return (
    <div className="max-w-6xl mx-auto p-6">

      <div className="bg-white rounded-2xl shadow border p-6">

        <h1 className="text-3xl font-bold">
          Customer Master
        </h1>

        <p className="text-gray-500 mt-2">
          Add CRM Customers
        </p>

        <form className="grid md:grid-cols-2 gap-5 mt-6">

         <div>
  <label>
    Mobile Number
  </label>
<input
  name="mobile_number"
  value={
    formData.mobile_number
  }
  onChange={
    handleMobileChange
  }
  className="
  w-full
  border
  p-3
  rounded-xl
  "
/>
  
</div>

<div>
  <label>
    Customer Name
  </label>
{
  existingCustomer && (

    <div
      className="
      md:col-span-2
      bg-red-50
      border
      border-red-300
      rounded-xl
      p-4
      "
    >

      <h3
        className="
        text-red-700
        font-semibold
        "
      >
        ⚠ Existing Customer Found
      </h3>

      <p>
        Name:
        {" "}
        {
          existingCustomer.customer_name
        }
      </p>

      <p>
        Interests:
        {" "}
        {
          existingCustomer.interests
        }
      </p>

      <p>
        Group:
        {" "}
        {
          existingCustomer.group_type
        }
      </p>

    </div>

  )
}

  <input
    name="customer_name"
    value={
      formData.customer_name
    }
    onChange={
      handleChange
    }
    className="w-full border p-3 rounded-xl"
  />
</div>
          <div>

            <label className="block mb-2">
              Interests
            </label>

            <select
              onChange={
                handleInterestChange
              }
              className="
      w-full
      border
      p-3
      rounded-xl
    "
            >

              <option value="">
                Select Interest
              </option>

              {interests.map(
                (interest) => (

                  <option
                    key={interest.id}
                    value={
                      interest.interest_name
                    }
                  >
                    {
                      interest.interest_name
                    }
                  </option>

                )
              )}

            </select>

            <div className="flex flex-wrap gap-2 mt-3">

              {selectedInterests.map(
                (interest) => (

                  <div
                    key={interest}
                    className="
            bg-yellow-100
            text-yellow-800
            px-3
            py-1
            rounded-full
            flex
            items-center
            gap-2
          "
                  >

                    {interest}

                    <button
                      type="button"
                      onClick={() =>
                        removeInterest(
                          interest
                        )
                      }
                    >
                      ✕
                    </button>

                  </div>

                )
              )}

            </div>

          </div>

          <div>
            <label>
              Location
            </label>

            <select
              name="location_type"
              value={
                formData.location_type
              }
              onChange={
                handleChange
              }
              className="w-full border p-3 rounded-xl"
            >
              <option>
                Delhi NCR
              </option>

              <option>
                Outside Delhi NCR
              </option>
            </select>
          </div>

          <div>
            <label>
              Group
            </label>

            <input
              value={
                formData.group_type
              }
              readOnly
              className="w-full border p-3 rounded-xl bg-gray-100"
            />
          </div>

         

          <div className="md:col-span-2">

            <button
              type="button"
              onClick={handleSubmit}
              className="
              bg-yellow-400
              hover:bg-yellow-500
              px-6 py-3
              rounded-xl
              font-semibold
              "
            >
              Save Customer
            </button>

          </div>

        </form>

      </div>

    </div>
  );
}

export default CustomerMasterPage;