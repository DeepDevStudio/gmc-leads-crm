import { Outlet, NavLink } from "react-router-dom";
import {
    createActivity,
} from "../services/activityService";
import {
    FaTachometerAlt,
    FaUsers,
    FaBullhorn,
    FaWhatsapp,
    FaFileAlt,
    FaCog,
    FaUserSlash,
    FaSignOutAlt,
    FaMapMarkedAlt,
} from "react-icons/fa";

function Layout() {

    const user =
        JSON.parse(
            localStorage.getItem("user")
        );

    const handleLogout =
        async () => {

            await createActivity({

                user_id:
                    user.id,

                username:
                    user.username,

                activity:
                    "Logged Out",

            });

            localStorage.removeItem(
                "user"
            );

            window.location.href =
                "/login";

        };

    const menuClass = ({ isActive }) =>
        `
    flex
    items-center
    gap-3
    px-4
    py-3
    rounded-xl
    transition
    ${isActive
            ? "bg-yellow-400 text-black font-semibold"
            : "text-white hover:bg-gray-800"
        }
  `;

    return (
        <div className="min-h-screen flex bg-gray-100">

            {/* Sidebar */}

            <aside
                className="
                w-72
                bg-black
                text-white
                min-h-screen
                shadow-xl
                flex
                flex-col
                "
            >

                {/* Header */}

                <div className="p-6 border-b border-gray-800">

                    <h1 className="text-3xl font-bold text-yellow-400">
                        GMC LEADS
                    </h1>

                    <p className="text-gray-400 mt-2">
                        CRM Management
                    </p>

                    {/* User Card */}

                    <div
                        className="
                        mt-5
                        bg-gray-900
                        rounded-xl
                        p-4
                        border
                        border-gray-800
                        "
                    >

                        <p
                            className="
                            text-white
                            font-semibold
                            "
                        >
                            {user?.full_name}
                        </p>

                        <p
                            className="
                            text-xs
                            text-gray-400
                            mt-1
                            uppercase
                            "
                        >
                            {user?.role}
                        </p>

                    </div>

                </div>

                {/* Menu */}

                <nav
                    className="
                    p-4
                    space-y-2
                    flex-1
                    "
                >

                    <NavLink
                        to="/"
                        end
                        className={menuClass}
                    >
                        <FaTachometerAlt />
                        Dashboard
                    </NavLink>

                    <NavLink
                        to="/customers"
                        className={menuClass}
                    >
                        <FaUsers />
                        Customers
                    </NavLink>

                    <NavLink
                        to="/yatras"
                        className={menuClass}
                    >
                        <FaMapMarkedAlt />
                        Yatra Master
                    </NavLink>

                    <NavLink
                        to="/yatra-bookings"
                        className={menuClass}
                    >
                        Yatra Bookings
                    </NavLink>


                    <NavLink
                        to="/interests"
                        className={menuClass}
                    >
                        Interests
                    </NavLink>

                    <NavLink
                        to="/daily-reach"
                        className={menuClass}
                    >
                        <FaBullhorn />
                        Daily Reach
                    </NavLink>

                    <NavLink
                        to="/do-not-reach"
                        className={menuClass}
                    >
                        <FaUserSlash />
                        Do Not Reach
                    </NavLink>

                    <NavLink
                        to="/unsubscribed"
                        className={menuClass}
                    >
                        <FaUserSlash />
                        Unsubscribed
                    </NavLink>

                    <NavLink
                        to="/campaigns"
                        className={menuClass}
                    >
                        <FaBullhorn />
                        Campaigns
                    </NavLink>

                    <NavLink
                        to="/templates"
                        className={menuClass}
                    >
                        <FaFileAlt />
                        Templates
                    </NavLink>

                    <NavLink
                        to="/automation"
                        className={menuClass}
                    >
                        Automation
                    </NavLink>

                    <NavLink
                        to="/broadcast"
                        className={menuClass}
                    >
                        <FaWhatsapp />
                        WhatsApp Broadcast
                    </NavLink>

                    <NavLink
                        to="/reports"
                        className={menuClass}
                    >
                        <FaFileAlt />
                        Reports
                    </NavLink>

                    <NavLink
                        to="/activity"
                        className={menuClass}
                    >
                        Activity
                    </NavLink>

                    <NavLink
                        to="/settings"
                        className={menuClass}
                    >
                        <FaCog />
                        Settings
                    </NavLink>

                </nav>

                {/* Logout */}

                <div className="p-4">

                    <button
                        onClick={
                            handleLogout
                        }
                        className="
                        w-full
                        bg-red-500
                        hover:bg-red-600
                        text-white
                        py-3
                        rounded-xl
                        font-semibold
                        flex
                        items-center
                        justify-center
                        gap-2
                        "
                    >
                        <FaSignOutAlt />
                        Logout
                    </button>

                </div>

            </aside>

            {/* Main Content */}

            <main
                className="
                flex-1
                overflow-y-auto
                p-8
                "
            >
                <Outlet />
            </main>

        </div>
    );
}

export default Layout;