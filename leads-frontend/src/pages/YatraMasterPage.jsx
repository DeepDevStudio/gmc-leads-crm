import {
  useEffect,
  useState,
} from "react";

import {
  getYatras,
  createYatra,
} from "../services/yatraService";

function YatraMasterPage() {

  const [yatras, setYatras] =
    useState([]);

  const [formData,
    setFormData] =
    useState({

      yatra_name: "",
      start_date: "",
      end_date: "",
      rate_per_seat: "",

    });

  useEffect(() => {
    loadYatras();
  }, []);

  const loadYatras =
    async () => {

      const data =
        await getYatras();

      setYatras(data);

    };

  const handleSubmit =
    async () => {

      await createYatra(
        formData
      );

      loadYatras();

      setFormData({

        yatra_name: "",
        start_date: "",
        end_date: "",
        rate_per_seat: "",

      });

    };

  return (

    <div className="space-y-6">

      <div>

        <h1 className="text-3xl font-bold">
          Yatra Master
        </h1>

        <p className="text-gray-500">
          Manage Yatras
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

        <div
          className="
          grid
          md:grid-cols-4
          gap-4
          "
        >

          <input
            placeholder="Yatra Name"
            value={
              formData.yatra_name
            }
            onChange={(e) =>
              setFormData({
                ...formData,
                yatra_name:
                  e.target.value,
              })
            }
            className="
            border
            p-3
            rounded-xl
            "
          />

          <input
            type="date"
            value={
              formData.start_date
            }
            onChange={(e) =>
              setFormData({
                ...formData,
                start_date:
                  e.target.value,
              })
            }
            className="
            border
            p-3
            rounded-xl
            "
          />

          <input
            type="date"
            value={
              formData.end_date
            }
            onChange={(e) =>
              setFormData({
                ...formData,
                end_date:
                  e.target.value,
              })
            }
            className="
            border
            p-3
            rounded-xl
            "
          />

          <input
            placeholder="Rate"
            value={
              formData.rate_per_seat
            }
            onChange={(e) =>
              setFormData({
                ...formData,
                rate_per_seat:
                  e.target.value,
              })
            }
            className="
            border
            p-3
            rounded-xl
            "
          />

        </div>

        <button
          onClick={
            handleSubmit
          }
          className="
          mt-5
          bg-yellow-400
          hover:bg-yellow-500
          px-6
          py-3
          rounded-xl
          font-semibold
          "
        >
          Save Yatra
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

        <table className="w-full">

          <thead>

            <tr
              className="
              bg-black
              text-yellow-400
              "
            >

              <th className="p-3 text-left">
                Yatra
              </th>

              <th className="p-3 text-left">
                Start
              </th>

              <th className="p-3 text-left">
                End
              </th>

              <th className="p-3 text-left">
                Rate
              </th>

            </tr>

          </thead>

          <tbody>

            {yatras.map(
              (item) => (

                <tr
                  key={item.id}
                  className="border-b"
                >

                  <td className="p-3">
                    {item.yatra_name}
                  </td>

                  <td className="p-3">
                    {item.start_date}
                  </td>

                  <td className="p-3">
                    {item.end_date}
                  </td>

                  <td className="p-3">
                    ₹
                    {
                      item.rate_per_seat
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

export default YatraMasterPage;