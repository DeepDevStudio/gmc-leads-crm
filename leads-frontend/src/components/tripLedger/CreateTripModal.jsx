import { useState } from "react";
import { X } from "lucide-react";

function CreateTripModal({
  open,
  onClose,
}) {

  const [form, setForm] =
    useState({

      tripName: "",

      startDate: "",

      endDate: "",

      pickupLocation: "",

      totalSeats: "",

      ticketPrice: "",

      tripManager: "Rajeev",

      status: "Upcoming",

      notes: "",

    });

  if (!open) return null;

  const handleChange = (e) => {

    setForm({

      ...form,

      [e.target.name]:
        e.target.value,

    });

  };

  const handleSubmit = (e) => {

    e.preventDefault();

    console.log(form);

    onClose();

  };

  return (

    <div
      className="
      fixed
      inset-0
      bg-black/50
      flex
      justify-center
      items-center
      z-50
      p-5
      "
    >

      <div
        className="
        bg-white
        rounded-3xl
        shadow-2xl
        w-full
        max-w-4xl
        overflow-hidden
        "
      >

        {/* Header */}

        <div
          className="
          bg-yellow-400
          flex
          justify-between
          items-center
          px-8
          py-5
          "
        >

          <div>

            <h2
              className="
              text-3xl
              font-bold
              "
            >
              Create New Trip
            </h2>

            <p className="mt-1">

              Create a new departure.

            </p>

          </div>

          <button
            onClick={onClose}
          >

            <X size={28} />

          </button>

        </div>

        {/* Form */}

        <form
          onSubmit={handleSubmit}
          className="p-8"
        >

          <div
            className="
            grid
            md:grid-cols-2
            gap-6
            "
          >

            <div>

              <label className="font-semibold">

                Trip Name

              </label>

              <input
                type="text"
                name="tripName"
                value={form.tripName}
                onChange={handleChange}
                placeholder="Rishikesh Camping"
                className="
                w-full
                mt-2
                border
                rounded-xl
                p-3
                "
              />

            </div>

            <div>

              <label className="font-semibold">

                Pickup Location

              </label>

              <input
                type="text"
                name="pickupLocation"
                value={form.pickupLocation}
                onChange={handleChange}
                placeholder="Delhi"
                className="
                w-full
                mt-2
                border
                rounded-xl
                p-3
                "
              />

            </div>

            <div>

              <label className="font-semibold">

                Departure Date

              </label>

              <input
                type="date"
                name="startDate"
                value={form.startDate}
                onChange={handleChange}
                className="
                w-full
                mt-2
                border
                rounded-xl
                p-3
                "
              />

            </div>

            <div>

              <label className="font-semibold">

                Return Date

              </label>

              <input
                type="date"
                name="endDate"
                value={form.endDate}
                onChange={handleChange}
                className="
                w-full
                mt-2
                border
                rounded-xl
                p-3
                "
              />

            </div>

            <div>

              <label className="font-semibold">

                Total Seats

              </label>

              <input
                type="number"
                name="totalSeats"
                value={form.totalSeats}
                onChange={handleChange}
                placeholder="50"
                className="
                w-full
                mt-2
                border
                rounded-xl
                p-3
                "
              />

            </div>

            <div>

              <label className="font-semibold">

                Ticket Price

              </label>

              <input
                type="number"
                name="ticketPrice"
                value={form.ticketPrice}
                onChange={handleChange}
                placeholder="6500"
                className="
                w-full
                mt-2
                border
                rounded-xl
                p-3
                "
              />

            </div>

            <div>

              <label className="font-semibold">

                Trip Manager

              </label>

              <select
                name="tripManager"
                value={form.tripManager}
                onChange={handleChange}
                className="
                w-full
                mt-2
                border
                rounded-xl
                p-3
                "
              >

                <option>
                  Rajeev
                </option>

                <option>
                  Sanjeev
                </option>

              </select>

            </div>

            <div>

              <label className="font-semibold">

                Status

              </label>

              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                className="
                w-full
                mt-2
                border
                rounded-xl
                p-3
                "
              >

                <option>
                  Upcoming
                </option>

                <option>
                  Completed
                </option>

                <option>
                  Cancelled
                </option>

              </select>

            </div>

          </div>

          <div className="mt-6">

            <label className="font-semibold">

              Notes

            </label>

            <textarea
              rows="4"
              name="notes"
              value={form.notes}
              onChange={handleChange}
              placeholder="Any important information..."
              className="
              w-full
              mt-2
              border
              rounded-xl
              p-3
              "
            />

          </div>

          <div
            className="
            flex
            justify-end
            gap-4
            mt-8
            "
          >

            <button
              type="button"
              onClick={onClose}
              className="
              border
              px-6
              py-3
              rounded-xl
              "
            >

              Cancel

            </button>

            <button
              type="submit"
              className="
              bg-yellow-400
              hover:bg-yellow-500
              px-8
              py-3
              rounded-xl
              font-semibold
              "
            >

              Create Trip

            </button>

          </div>

        </form>

      </div>

    </div>

  );

}

export default CreateTripModal;