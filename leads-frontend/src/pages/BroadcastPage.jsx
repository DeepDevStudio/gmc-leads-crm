import {
  useEffect,
  useState,
} from "react";

import {
  getInterests,
} from "../services/interestService";

import {
  getTemplates,
} from "../services/templateService";

import {
  previewBroadcast,
} from "../services/broadcastService";

function BroadcastPage() {

  const [interests, setInterests] =
    useState([]);

  const [templates, setTemplates] =
    useState([]);

  const [customers, setCustomers] =
    useState([]);

  const [selectedInterest,
    setSelectedInterest] =
    useState("");

  const [selectedTemplate,
    setSelectedTemplate] =
    useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData =
    async () => {

      try {

        const interestsData =
          await getInterests();

        const templatesData =
          await getTemplates();

        setInterests(
          interestsData
        );

        setTemplates(
          templatesData
        );

      } catch (error) {

        console.error(error);

      }

    };

  const handlePreview =
    async () => {

      try {

        if (
          !selectedInterest
        ) {
          alert(
            "Select Interest"
          );
          return;
        }

        const data =
          await previewBroadcast(
            selectedInterest
          );

        setCustomers(data);

      } catch (error) {

        console.error(error);

      }

    };

  return (
    <div className="space-y-6">

      <div>

        <h1 className="text-3xl font-bold">
          WhatsApp Broadcast
        </h1>

        <p className="text-gray-500">
          Send Manual Campaigns
        </p>

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

        <div className="grid md:grid-cols-2 gap-5">

          <div>

            <label className="block mb-2">
              Campaign Name
            </label>

            <input
              className="
              w-full
              border
              p-3
              rounded-xl
              "
              placeholder="Char Dham June Campaign"
            />

          </div>

          <div>

            <label className="block mb-2">
              Select Interest
            </label>

            <select
              value={
                selectedInterest
              }
              onChange={(e) =>
                setSelectedInterest(
                  e.target.value
                )
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

          </div>

        </div>

        <div className="mt-5">

          <label className="block mb-2">
            Select Template
          </label>

          <select
            value={
              selectedTemplate
            }
            onChange={(e) =>
              setSelectedTemplate(
                e.target.value
              )
            }
            className="
            w-full
            border
            p-3
            rounded-xl
            "
          >

            <option value="">
              Select Template
            </option>

            {templates
              .filter(
                (template) =>
                  template.interest_name ===
                  selectedInterest
              )
              .map(
                (template) => (

                  <option
                    key={template.id}
                    value={
                      template.id
                    }
                  >
                    {
                      template.template_name
                    }
                  </option>

                )
              )}

          </select>

        </div>

        <div className="flex gap-4 mt-6">

          <button
            onClick={
              handlePreview
            }
            className="
            bg-yellow-400
            hover:bg-yellow-500
            px-6
            py-3
            rounded-xl
            font-semibold
            "
          >
            Preview Customers
          </button>

          <button
            className="
            bg-green-500
            hover:bg-green-600
            text-white
            px-6
            py-3
            rounded-xl
            font-semibold
            "
          >
            Send Campaign
          </button>

        </div>

      </div>

      {customers.length > 0 && (

        <div
          className="
          bg-white
          rounded-2xl
          shadow
          border
          overflow-hidden
          "
        >

          <div className="p-4 border-b">

            <h2 className="font-bold">
              Customers Found:
              {" "}
              {customers.length}
            </h2>

          </div>

          <table className="w-full">

            <thead>

              <tr
                className="
                bg-black
                text-yellow-400
                "
              >

                <th className="p-3 text-left">
                  Customer
                </th>

                <th className="p-3 text-left">
                  Mobile
                </th>

                <th className="p-3 text-left">
                  Interest
                </th>

              </tr>

            </thead>

            <tbody>

              {customers.map(
                (customer) => (

                  <tr
                    key={customer.id}
                    className="border-b"
                  >

                    <td className="p-3">
                      {
                        customer.customer_name
                      }
                    </td>

                    <td className="p-3">
                      {
                        customer.mobile_number
                      }
                    </td>

                    <td className="p-3">
                      {
                        customer.interests
                      }
                    </td>

                  </tr>

                )
              )}

            </tbody>

          </table>

        </div>

      )}

    </div>
  );
}

export default BroadcastPage;