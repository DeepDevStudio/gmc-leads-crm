import {
  useEffect,
  useState,
} from "react";

import {
  getCampaigns,
  createCampaign,
  deleteCampaign,
} from "../services/campaignService";

import {
  getInterests,
} from "../services/interestService";

function CampaignsPage() {

  const [campaigns, setCampaigns] =
    useState([]);

  const [interests, setInterests] =
    useState([]);

  const [selectedInterests,
    setSelectedInterests] =
    useState([]);

  const [formData, setFormData] =
    useState({
      campaign_name: "",
      message: "",
      target_groups:
        "Daily Reach",
      status: "Draft",
    });

  useEffect(() => {
    loadCampaigns();
    loadInterests();
  }, []);

  const loadCampaigns =
    async () => {
      try {

        const data =
          await getCampaigns();

        setCampaigns(data);

      } catch (error) {

        console.error(
          "Campaign Error:",
          error
        );

      }
    };

  const loadInterests =
    async () => {
      try {

        const data =
          await getInterests();

        setInterests(data);

      } catch (error) {

        console.error(
          "Interest Error:",
          error
        );

      }
    };

  const handleInterestChange =
    (e) => {

      const value =
        e.target.value;

      if (
        !value ||
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

  const handleSubmit =
    async (e) => {

      e.preventDefault();

      try {

        await createCampaign({
          ...formData,
          target_interests:
            selectedInterests.join(", "),
        });

        alert(
          "Campaign Created"
        );

        setFormData({
          campaign_name: "",
          message: "",
          target_groups:
            "Daily Reach",
          status: "Draft",
        });

        setSelectedInterests([]);

        loadCampaigns();

      } catch (error) {

        console.error(error);

        alert(
          "Failed To Create Campaign"
        );

      }

    };

  const handleDelete =
    async (id) => {

      const confirmDelete =
        window.confirm(
          "Delete Campaign?"
        );

      if (!confirmDelete)
        return;

      try {

        await deleteCampaign(id);

        loadCampaigns();

      } catch (error) {

        console.error(error);

      }

    };

  return (
    <div className="space-y-6">

      {/* Header */}

      <div>

        <h1 className="text-3xl font-bold">
          Campaigns
        </h1>

        <p className="text-gray-500">
          Create Marketing Campaigns
        </p>

      </div>

      {/* Create Campaign */}

      <div
        className="
        bg-white
        p-6
        rounded-2xl
        shadow
        border
        "
      >

        <form
          onSubmit={
            handleSubmit
          }
          className="space-y-4"
        >

          <input
            placeholder="Campaign Name"
            value={
              formData.campaign_name
            }
            onChange={(e) =>
              setFormData({
                ...formData,
                campaign_name:
                  e.target.value,
              })
            }
            className="
            w-full
            border
            p-3
            rounded-xl
            "
            required
          />

          <textarea
            placeholder="Campaign Message"
            value={
              formData.message
            }
            onChange={(e) =>
              setFormData({
                ...formData,
                message:
                  e.target.value,
              })
            }
            className="
            w-full
            border
            p-3
            rounded-xl
            "
            rows="5"
            required
          />

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

            {Array.isArray(
              interests
            ) &&
              interests.map(
                (interest) => (

                  <option
                    key={
                      interest.id
                    }
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

          <div className="flex flex-wrap gap-2">

            {selectedInterests.map(
              (interest) => (

                <div
                  key={interest}
                  className="
                  bg-yellow-100
                  px-3
                  py-1
                  rounded-full
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
                    className="ml-2"
                  >
                    ✕
                  </button>

                </div>

              )
            )}

          </div>

          <select
            value={
              formData.target_groups
            }
            onChange={(e) =>
              setFormData({
                ...formData,
                target_groups:
                  e.target.value,
              })
            }
            className="
            w-full
            border
            p-3
            rounded-xl
            "
          >

            <option>
              Daily Reach
            </option>

            <option>
              Do Not Reach
            </option>

            <option>
              Unsubscribed
            </option>

          </select>

          <button
            type="submit"
            className="
            bg-yellow-400
            hover:bg-yellow-500
            px-6
            py-3
            rounded-xl
            font-semibold
            "
          >
            Create Campaign
          </button>

        </form>

      </div>

      {/* Campaign List */}

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

            <tr className="bg-black text-yellow-400">

              <th className="p-3 text-left">
                Campaign
              </th>

              <th className="p-3 text-left">
                Interests
              </th>

              <th className="p-3 text-left">
                Group
              </th>

              <th className="p-3 text-left">
                Status
              </th>

              <th className="p-3 text-left">
                Action
              </th>

            </tr>

          </thead>

          <tbody>

            {campaigns.map(
              (campaign) => (

                <tr
                  key={
                    campaign.id
                  }
                  className="
                  border-b
                  hover:bg-gray-50
                  "
                >

                  <td className="p-3">
                    {
                      campaign.campaign_name
                    }
                  </td>

                  <td className="p-3">
                    {
                      campaign.target_interests
                    }
                  </td>

                  <td className="p-3">
                    {
                      campaign.target_groups
                    }
                  </td>

                  <td className="p-3">
                    {
                      campaign.status
                    }
                  </td>

                  <td className="p-3">

                    <button
                      onClick={() =>
                        handleDelete(
                          campaign.id
                        )
                      }
                      className="
                      bg-red-500
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

    </div>
  );
}

export default CampaignsPage;