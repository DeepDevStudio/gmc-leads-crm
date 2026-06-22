import {
  useEffect,
  useState,
} from "react";

import {
  getReportStats,
  getEmployeeStats,
} from "../services/reportService";

function Reports() {

  const [report,
    setReport] =
    useState({
      totalMessages: 0,
      templateStats: [],
      recentMessages: [],
    });

const [employees,
  setEmployees] =
  useState([]);

 
useEffect(() => {

  loadReport();
  loadEmployees();

}, []);

  const loadReport =
    async () => {

      try {

        const data =
          await getReportStats();

        setReport(data);

      } catch (error) {

        console.error(error);

      }

    };

const loadEmployees =
  async () => {

    try {

      const data =
        await getEmployeeStats();

      setEmployees(data);

    } catch (error) {

      console.error(error);

    }

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
          Reports
        </h1>

        <p className="text-gray-500">
          WhatsApp Campaign Analytics
        </p>

      </div>

      {/* Cards */}

      <div
        className="
        grid
        md:grid-cols-3
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

          <p>Total Messages</p>

          <h2
            className="
            text-4xl
            font-bold
            text-yellow-500
            "
          >
            {report.totalMessages}
          </h2>

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

          <p>Templates Used</p>

          <h2
            className="
            text-4xl
            font-bold
            text-green-600
            "
          >
            {report.templateStats.length}
          </h2>

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

          <p>Recent Logs</p>

          <h2
            className="
            text-4xl
            font-bold
            text-blue-600
            "
          >
            {report.recentMessages.length}
          </h2>

        </div>

      </div>

      {/* Template Performance */}

      <div
        className="
        bg-white
        rounded-2xl
        shadow
        border
        overflow-hidden
        "
      >

        <div className="p-6">

          <h2
            className="
            text-2xl
            font-bold
            "
          >
            Template Performance
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
                Template
              </th>

              <th className="p-3 text-left">
                Messages Sent
              </th>

            </tr>

          </thead>

          <tbody>

            {report.templateStats.map(
              (item, index) => (

                <tr
                  key={index}
                  className="border-b"
                >

                  <td className="p-3">
                    {item.template_name}
                  </td>

                  <td className="p-3">
                    {item.total}
                  </td>

                </tr>

              )
            )}

          </tbody>

        </table>

      </div>


      {/* Employee Performance */}

<div
  className="
  bg-white
  rounded-2xl
  shadow
  border
  overflow-hidden
  "
>

  <div className="p-6">

    <h2
      className="
      text-2xl
      font-bold
      "
    >
      Employee Performance
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
          Employee
        </th>

        <th className="p-3 text-left">
          Activities
        </th>

      </tr>

    </thead>

    <tbody>

      {employees.map(
        (employee, index) => (

          <tr
            key={index}
            className="border-b"
          >

            <td className="p-3">
              {employee.username}
            </td>

            <td className="p-3">
              {employee.total}
            </td>

          </tr>

        )
      )}

    </tbody>

  </table>

</div>

      {/* Message Logs */}

      <div
        className="
        bg-white
        rounded-2xl
        shadow
        border
        overflow-hidden
        "
      >

        <div className="p-6">

          <h2
            className="
            text-2xl
            font-bold
            "
          >
            Recent Messages
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
                Template
              </th>

              <th className="p-3 text-left">
                Status
              </th>

            </tr>

          </thead>

          <tbody>

            {report.recentMessages.map(
              (item) => (

                <tr
                  key={item.id}
                  className="border-b"
                >

                  <td className="p-3">
                    {item.customer_name}
                  </td>

                  <td className="p-3">
                    {item.mobile_number}
                  </td>

                  <td className="p-3">
                    {item.template_name}
                  </td>

                  <td className="p-3">

                    <span
                      className="
                      bg-green-100
                      text-green-700
                      px-3
                      py-1
                      rounded-full
                      "
                    >
                      {item.status}
                    </span>

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

export default Reports;