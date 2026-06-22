import { useState } from "react";
import { login } from "../services/authService";
import {
  createActivity,
} from "../services/activityService";

function LoginPage() {

  const [username,
    setUsername] =
    useState("");

  const [password,
    setPassword] =
    useState("");

  const handleLogin =
    async () => {

      try {

        const response =
          await login({
            username,
            password,
          });

        localStorage.setItem(
          "user",
          JSON.stringify(
            response.user
          )
        );


        await createActivity({
  user_id:
    response.user.id,

  username:
    response.user.username,

  activity:
    "Logged In",
});

        window.location.href =
          "/";

      } catch (error) {

        alert(
          "Invalid Credentials"
        );

      }

    };

  return (
    <div
      className="
      min-h-screen
      flex
      items-center
      justify-center
      bg-gray-100
      "
    >
      <div
        className="
        bg-white
        p-8
        rounded-2xl
        shadow-lg
        w-full
        max-w-md
        "
      >

        <h1
          className="
          text-3xl
          font-bold
          mb-6
          "
        >
          GMC Login
        </h1>

        <input
          placeholder="Username"
          value={username}
          onChange={(e) =>
            setUsername(
              e.target.value
            )
          }
          className="
          w-full
          border
          p-3
          rounded-xl
          mb-4
          "
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) =>
            setPassword(
              e.target.value
            )
          }
          className="
          w-full
          border
          p-3
          rounded-xl
          mb-4
          "
        />

        <button
          onClick={
            handleLogin
          }
          className="
          w-full
          bg-yellow-400
          hover:bg-yellow-500
          py-3
          rounded-xl
          font-semibold
          "
        >
          Login
        </button>

      </div>
    </div>
  );
}

export default LoginPage;