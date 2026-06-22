import {
  useEffect,
  useState,
} from "react";

import {
  getInterests,
  createInterest,
} from "../services/interestService";

function InterestMasterPage() {
  const [interests, setInterests] =
    useState([]);

  const [interestName,
    setInterestName] =
    useState("");

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

  const handleSubmit =
    async (e) => {

      e.preventDefault();

      try {

        await createInterest({
          interest_name:
            interestName,
        });

        setInterestName("");

        loadInterests();

      } catch (error) {

        console.error(error);

      }

    };

  return (
    <div className="space-y-6">

      <div>

        <h1 className="text-3xl font-bold">
          Interest Master
        </h1>

        <p className="text-gray-500">
          Manage Travel Interests
        </p>

      </div>

      <div className="bg-white p-6 rounded-2xl shadow border">

        <form
          onSubmit={
            handleSubmit
          }
          className="flex gap-3"
        >

          <input
            value={
              interestName
            }
            onChange={(e) =>
              setInterestName(
                e.target.value
              )
            }
            placeholder="Interest Name"
            className="
            flex-1
            border
            rounded-xl
            p-3
            "
            required
          />

          <button
            type="submit"
            className="
            bg-yellow-400
            hover:bg-yellow-500
            px-6
            rounded-xl
            font-semibold
            "
          >
            Add
          </button>

        </form>

      </div>

      <div className="bg-white rounded-2xl shadow border overflow-hidden">

        <table className="w-full">

          <thead>

            <tr className="bg-black text-yellow-400">

              <th className="p-3 text-left">
                ID
              </th>

              <th className="p-3 text-left">
                Interest
              </th>

            </tr>

          </thead>

          <tbody>

            {interests.map(
              (interest) => (

                <tr
                  key={interest.id}
                  className="border-b"
                >

                  <td className="p-3">
                    {interest.id}
                  </td>

                  <td className="p-3">
                    {
                      interest.interest_name
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

export default InterestMasterPage;