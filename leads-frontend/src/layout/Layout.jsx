import { Outlet, NavLink } from "react-router-dom";
import { createActivity } from "../services/activityService";
import { useEffect, useState } from "react";
import axios from "axios";
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
    FaRoute,
    FaChartBar,
    FaClipboardList,
    FaRobot,
    FaTags,
    FaFileImport,
    FaChevronRight,
    FaBars,
    FaTimes,
} from "react-icons/fa";
import { IoMdSpeedometer, IoMdPeople, IoMdMap, IoMdCalendar, IoMdRocket, IoMdPricetag, IoMdMegaphone, IoMdDocument, IoMdSettings, IoMdLogOut } from "react-icons/io";

function Layout() {
    const user = JSON.parse(localStorage.getItem("user"));
    const userRole = user?.role || 'employee';
    const [counts, setCounts] = useState({
        dailyReach: 0,
        doNotReach: 0,
        unsubscribed: 0,
    });
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        loadCounts();
        const interval = setInterval(loadCounts, 30000);
        
        // Check if mobile
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        
        return () => {
            clearInterval(interval);
            window.removeEventListener('resize', checkMobile);
        };
    }, []);

    const loadCounts = async () => {
        try {
            const [daily, doNot, unsub] = await Promise.all([
                axios.get("/api/customers/group/daily-reach"),
                axios.get("/api/customers/group/do-not-reach"),
                axios.get("/api/customers/group/unsubscribed"),
            ]);
            setCounts({
                dailyReach: daily.data.length,
                doNotReach: doNot.data.length,
                unsubscribed: unsub.data.length,
            });
        } catch (error) {
            console.error("Error loading counts:", error);
        }
    };

    const handleLogout = async () => {
        if (!window.confirm("Are you sure you want to logout?")) return;
        
        setIsLoggingOut(true);
        
        try {
            await createActivity({
                user_id: user.id,
                username: user.username,
                activity: "Logged Out",
            });
        } catch (error) {
            console.error("Error logging activity:", error);
        }
        
        localStorage.removeItem("user");
        
        document.body.style.transition = "all 0.6s cubic-bezier(0.22, 1, 0.36, 1)";
        document.body.style.opacity = "0";
        document.body.style.transform = "scale(0.95)";
        
        setTimeout(() => {
            window.location.href = "/login";
        }, 600);
    };

    // Define all menu items with role restrictions
    const allMenuItems = [
        { path: "/", icon: <IoMdSpeedometer className="text-lg" />, label: "Dashboard", roles: ['admin', 'manager', 'employee'] },
        { path: "/customers", icon: <IoMdPeople className="text-lg" />, label: "Customers", roles: ['admin', 'manager', 'employee'] },
        { path: "/yatras", icon: <IoMdMap className="text-lg" />, label: "Yatra Master", roles: ['admin', 'manager', 'employee'] },
        { path: "/yatra-bookings", icon: <IoMdCalendar className="text-lg" />, label: "Bookings", roles: ['admin', 'manager', 'employee'] },
        { path: "/trips", icon: <IoMdRocket className="text-lg" />, label: "Trips", roles: ['admin', 'manager', 'employee'] },
        { path: "/interests", icon: <IoMdPricetag className="text-lg" />, label: "Interests", roles: ['admin', 'manager', 'employee'] },
        { 
            path: "/daily-reach", 
            icon: <IoMdMegaphone className="text-lg" />, 
            label: "Daily Reach",
            roles: ['admin', 'manager', 'employee'],
            badge: { count: counts.dailyReach, color: "bg-emerald-500" }
        },
        { 
            path: "/do-not-reach", 
            icon: <FaUserSlash className="text-lg" />, 
            label: "Do Not Reach",
            roles: ['admin', 'manager', 'employee'],
            badge: { count: counts.doNotReach, color: "bg-rose-500" }
        },
        { 
            path: "/unsubscribed", 
            icon: <FaUserSlash className="text-lg" />, 
            label: "Unsubscribed",
            roles: ['admin', 'manager', 'employee'],
            badge: { count: counts.unsubscribed, color: "bg-slate-500" }
        },
        { path: "/campaigns", icon: <IoMdMegaphone className="text-lg" />, label: "Campaigns", roles: ['admin', 'manager', 'employee'] },
        { path: "/templates", icon: <IoMdDocument className="text-lg" />, label: "Templates", roles: ['admin', 'manager', 'employee'] },
        { path: "/automation", icon: <FaRobot className="text-lg" />, label: "Automation", roles: ['admin', 'manager', 'employee'] },
        { path: "/broadcast", icon: <FaWhatsapp className="text-lg" />, label: "Broadcast", roles: ['admin', 'manager', 'employee'] },
        { path: "/reports", icon: <FaChartBar className="text-lg" />, label: "Reports", roles: ['admin', 'manager', 'employee'] },
        { path: "/activity", icon: <FaClipboardList className="text-lg" />, label: "Activity", roles: ['admin', 'manager', 'employee'] },
        { path: "/bulk-import", icon: <FaFileImport className="text-lg" />, label: "Bulk Import", roles: ['admin', 'manager', 'employee'] },
        { path: "/settings", icon: <IoMdSettings className="text-lg" />, label: "Settings", roles: ['admin', 'manager'] },
    ];

    // Filter menu items based on user role
    const menuItems = allMenuItems.filter(item => 
        item.roles.includes(userRole)
    );

    if (isLoggingOut) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
                <div className="text-center">
                    <div className="relative w-20 h-20 mx-auto">
                        <div className="absolute inset-0 border-4 border-yellow-400/20 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-yellow-400 rounded-full border-t-transparent animate-spin"></div>
                    </div>
                    <p className="text-white text-lg font-medium mt-6">Logging out...</p>
                    <p className="text-slate-400 text-sm mt-1">See you soon!</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex bg-gradient-to-br from-slate-50 via-white to-slate-100/50">
            {/* Mobile Menu Toggle */}
            <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden fixed top-4 left-4 z-50 bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-white/10"
            >
                {isMobileMenuOpen ? <FaTimes className="text-xl" /> : <FaBars className="text-xl" />}
            </button>

            {/* Overlay */}
            {isMobileMenuOpen && (
                <div 
                    className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
                    onClick={() => setIsMobileMenuOpen(false)}
                ></div>
            )}

            {/* Sidebar */}
            <aside className={`
                w-[280px] min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 shadow-2xl flex flex-col fixed h-full z-50
                transition-transform duration-300 ease-in-out
                ${isMobile ? (isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full') : 'translate-x-0'}
            `}>
                {/* Animated Gradient Border Top */}
                <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-400 animate-pulse"></div>
                
                {/* Header */}
                <div className="p-6 border-b border-slate-700/30 relative">
                    <div className="absolute -top-20 -right-20 w-48 h-48 bg-yellow-400/5 rounded-full blur-2xl"></div>
                    <div className="absolute -bottom-20 -left-20 w-32 h-32 bg-purple-400/5 rounded-full blur-2xl"></div>
                    
                    <div className="flex items-center gap-3 relative z-10">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-yellow-400 to-yellow-500 flex items-center justify-center text-2xl shadow-lg shadow-yellow-500/30 hover:scale-105 transition-transform duration-300">
                            🚀
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-300 bg-clip-text text-transparent tracking-tight">
                                GMC LEADS
                            </h1>
                            <p className="text-[10px] text-slate-500 tracking-[0.2em] uppercase">CRM Management</p>
                        </div>
                    </div>
                    
                    {/* User Profile */}
                    <div className="mt-5 bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/5 hover:border-yellow-400/20 transition-all duration-300 group relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 to-yellow-500 flex items-center justify-center text-sm font-bold text-black shadow-lg shadow-yellow-500/20 group-hover:scale-110 transition-transform duration-300">
                                    {user?.full_name?.charAt(0).toUpperCase() || 'U'}
                                </div>
                                <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-400 border-2 border-slate-800 rounded-full animate-pulse"></span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-white font-semibold text-sm truncate">{user?.full_name || 'User'}</p>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] text-yellow-400 uppercase tracking-wider">{user?.role || 'Employee'}</span>
                                    <span className="w-1 h-1 rounded-full bg-slate-600"></span>
                                    <span className="text-[10px] text-emerald-400">● Online</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="p-3 space-y-0.5 flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                    {menuItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.path === "/"}
                            onClick={() => isMobile && setIsMobileMenuOpen(false)}
                            className={({ isActive }) => `
                                group relative flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-300 text-sm font-medium
                                ${isActive 
                                    ? "bg-gradient-to-r from-yellow-400 to-yellow-500 text-black shadow-lg shadow-yellow-500/30" 
                                    : "text-slate-400 hover:text-white hover:bg-white/5"
                                }
                            `}
                        >
                            {({ isActive }) => (
                                <>
                                    {/* Active Indicator Glow */}
                                    {isActive && (
                                        <>
                                            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full shadow-lg shadow-white/50"></span>
                                            <span className="absolute inset-0 bg-yellow-400/10 blur-xl rounded-xl"></span>
                                        </>
                                    )}
                                    
                                    {/* Icon */}
                                    <span className={`relative z-10 ${isActive ? 'text-black' : 'text-slate-400 group-hover:text-white'} transition-colors duration-300`}>
                                        {item.icon}
                                    </span>
                                    
                                    {/* Label */}
                                    <span className={`flex-1 relative z-10 ${isActive ? 'text-black font-semibold' : ''}`}>
                                        {item.label}
                                    </span>
                                    
                                    {/* Badge */}
                                    {item.badge && (
                                        <span className={`${item.badge.color} text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full min-w-[22px] text-center shadow-lg relative z-10 animate-pulse`}>
                                            {item.badge.count}
                                        </span>
                                    )}
                                    
                                    {/* Hover Arrow */}
                                    <span className={`relative z-10 opacity-0 group-hover:opacity-100 transition-all duration-300 transform -translate-x-2 group-hover:translate-x-0 ${isActive ? 'text-black' : 'text-slate-400'}`}>
                                        <FaChevronRight className="text-[10px]" />
                                    </span>
                                </>
                            )}
                        </NavLink>
                    ))}
                </nav>

                {/* Footer / Logout */}
                <div className="p-4 border-t border-slate-700/30 relative">
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-700/50 to-transparent"></div>
                    
                    {/* System Status */}
                    <div className="flex items-center justify-between mb-3 px-1">
                        <span className="text-[10px] text-slate-500">System</span>
                        <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                            <span className="text-[10px] text-emerald-400">Online</span>
                        </div>
                    </div>
                    
                    <button
                        onClick={handleLogout}
                        className="group relative w-full bg-gradient-to-r from-rose-500/10 to-rose-600/10 hover:from-rose-500 hover:to-rose-600 text-rose-400 hover:text-white py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2.5 transition-all duration-300 border border-rose-500/20 hover:border-rose-500/50 overflow-hidden"
                    >
                        <span className="absolute inset-0 bg-gradient-to-r from-rose-500 to-rose-600 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out"></span>
                        <span className="absolute inset-0 bg-white/10 translate-x-full group-hover:translate-x-0 transition-transform duration-700 ease-out"></span>
                        <span className="relative z-10 flex items-center gap-2.5">
                            <IoMdLogOut className="text-lg" />
                            Logout
                        </span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 ml-0 md:ml-[280px] overflow-y-auto p-4 md:p-8 bg-gradient-to-br from-slate-50 via-white to-slate-100/50 min-h-screen">
                <div className="max-w-7xl mx-auto">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}

export default Layout;
