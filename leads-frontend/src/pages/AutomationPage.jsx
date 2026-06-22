import { useState } from "react";

import {
  createActivity,
} from "../services/activityService";

import {
  runAutomation,
} from "../services/automationService";

import {
  sendBulkMessages,
} from "../services/bulkService";

function AutomationPage() {

  const [results, setResults] =
    useState([]);

  const [loading, setLoading] =
    useState(false);

const [sending, setSending] =
  useState(false);

  const handleRun =
    async () => {

      try {

        setLoading(true);

        const data =
          await runAutomation();

        setResults(data);

      } catch (error) {

        console.error(error);

        alert(
          "Automation Failed"
        );

      } finally {

        setLoading(false);

      }

    };

    const handleSend =
  async () => {

    try {

      const confirmSend =
        window.confirm(
          `Send WhatsApp to ${results.length} customers?`
        );

      if (!confirmSend)
        return;

      setSending(true);

      const response =
        await sendBulkMessages();

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
          `Sent ${response.total} WhatsApp Messages`,

      });

      alert(
        `${response.total} Messages Sent`
      );

    } catch (error) {

      console.error(error);

      alert(
        "Send Failed"
      );

    } finally {

      setSending(false);

    }

  };

  return (
    <div className="space-y-6">

      <div>

        <h1 className="text-3xl font-bold">
          Automation Engine
        </h1>

        <p className="text-gray-500">
          Match Customers With Templates
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

        <button
          onClick={handleRun}
          disabled={loading}
          className="
          bg-green-500
          hover:bg-green-600
          text-white
          px-8
          py-4
          rounded-xl
          font-semibold
          "
        >
          {loading
            ? "Running..."
            : "RUN NOW"}
        </button>

<button
  onClick={handleSend}
  disabled={
    sending ||
    results.length === 0
  }
  className="
  bg-blue-500
  hover:bg-blue-600
  text-white
  px-8
  py-4
  rounded-xl
  font-semibold
  ml-4
  "
>
  {sending
    ? "Sending..."
    : "SEND WHATSAPP"}
</button>

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

        <div className="p-4 border-b">

          <h2 className="font-bold">

            Total Matches:
            {" "}
            {results.length}

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

              <th className="p-3 text-left">
                Template
              </th>

            </tr>

          </thead>

          <tbody>

            {results.map(
              (item, index) => (

                <tr
                  key={index}
                  className="border-b"
                >

                  <td className="p-3">
                    {
                      item.customer_name
                    }
                  </td>

                  <td className="p-3">
                    {
                      item.mobile_number
                    }
                  </td>

                  <td className="p-3">
                    {
                      item.interest
                    }
                  </td>

                  <td className="p-3">
                    {
                      item.template_name
                    }
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

export default AutomationPage;