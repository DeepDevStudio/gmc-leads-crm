import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import { createActivity } from "../services/activityService";
import { useEffect, useState, useRef, useCallback } from "react";
import api from "../services/api";
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
    FaEnvelope,
    FaPhone,
    FaCalendarAlt,
    FaTicketAlt,
    FaChevronDown,
    FaChevronUp,
    FaSearch,
    FaUserCircle,
    FaUserEdit,
    FaShieldAlt,
    FaUserPlus,
    FaUsers as FaUsersIcon,
    FaCheck,
    FaUserCheck,
    FaTimesCircle,
    FaSpinner,
    FaBell,
    FaPlus,
    FaQuestionCircle,
    FaHome,
    FaChevronLeft,
    FaMoon,
    FaSun,
    FaExpand,
    FaCompress,
    FaCamera,
} from "react-icons/fa";
import { IoMdSpeedometer, IoMdPeople, IoMdMap, IoMdCalendar, IoMdRocket, IoMdPricetag, IoMdMegaphone, IoMdDocument, IoMdSettings, IoMdLogOut } from "react-icons/io";

function Layout() {
    const navigate = useNavigate();
    const location = useLocation();
    const [user, setUser] = useState(() => {
        const saved = localStorage.getItem("user");
        return saved ? JSON.parse(saved) : null;
    });
    const userRole = user?.role || 'team';
    const [counts, setCounts] = useState({
        dailyReach: 0,
        doNotReach: 0,
        unsubscribed: 0,
    });
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [currentTime, setCurrentTime] = useState('');
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const profileRef = useRef(null);
    const [openGroups, setOpenGroups] = useState({
        dashboard: true,
        customers: true,
        yatra: true,
        communication: true,
        reports: true,
        settings: true,
    });

    // ===== SEARCH STATE =====
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const searchInputRef = useRef(null);
    const searchContainerRef = useRef(null);

    // ===== DYNAMIC PROFILES STATE =====
    const [availableProfiles, setAvailableProfiles] = useState([]);
    const [profilesLoading, setProfilesLoading] = useState(true);

    // ===== NOTIFICATIONS STATE =====
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const notificationRef = useRef(null);

    // ===== KEYBOARD SHORTCUTS HELP =====
    const [showShortcuts, setShowShortcuts] = useState(false);

    // ===== LOADING STATE =====
    const [isPageLoading, setIsPageLoading] = useState(false);

    // ===== PAGE TITLE =====
    const [pageTitle, setPageTitle] = useState('Dashboard');

    // ===== ONLINE STATUS =====
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    // ===== DARK MODE =====
    const [isDarkMode, setIsDarkMode] = useState(() => {
        const saved = localStorage.getItem('darkMode');
        return saved ? JSON.parse(saved) : false;
    });

    // ===== SIDEBAR WIDTH =====
    const [isSidebarWide, setIsSidebarWide] = useState(() => {
        const saved = localStorage.getItem('sidebarWide');
        return saved ? JSON.parse(saved) : false;
    });

    // ===== LAST LOGIN =====
    const [lastLogin, setLastLogin] = useState('Loading...');

    // ===== AVATAR UPLOAD =====
    const [avatarUrl, setAvatarUrl] = useState(() => {
        return localStorage.getItem('userAvatar') || null;
    });
    const fileInputRef = useRef(null);

    // ===== FETCH USERS FROM API =====
    const fetchUsers = useCallback(async () => {
        try {
            const response = await api.get('/users');
            const users = response.data || [];
            
            const profiles = users
                .filter(u => u.is_active === 1)
                .map(u => ({
                    id: u.id,
                    username: u.username,
                    full_name: u.full_name || u.username,
                    role: u.role || 'team',
                    isActive: u.username === user?.username,
                    whatsapp_number: u.whatsapp_number || '',
                }));
            
            setAvailableProfiles(profiles);
        } catch (error) {
            console.error('Error fetching users:', error);
            setAvailableProfiles([
                { id: 1, username: 'admin', full_name: 'Admin', role: 'admin', isActive: user?.username === 'admin' },
                { id: 2, username: 'developer', full_name: 'Developer', role: 'developer', isActive: user?.username === 'developer' },
                { id: 3, username: 'team', full_name: 'Team Member', role: 'team', isActive: user?.username === 'team' },
            ]);
        } finally {
            setProfilesLoading(false);
        }
    }, [user]);

    const updateActiveProfile = useCallback((username) => {
        setAvailableProfiles(prev => prev.map(p => ({
            ...p,
            isActive: p.username === username
        })));
    }, []);

    // ===== FETCH LAST LOGIN =====
    const fetchLastLogin = useCallback(async () => {
        try {
            const response = await api.get(`/activity/user/${user?.id}/last`);
            if (response.data && response.data.created_at) {
                const date = new Date(response.data.created_at);
                setLastLogin(date.toLocaleString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                }));
            } else {
                setLastLogin('First time login');
            }
        } catch (error) {
            console.error('Error fetching last login:', error);
            setLastLogin('Not available');
        }
    }, [user]);

    // ===== FETCH NOTIFICATIONS (FIXED) =====
    const fetchNotifications = useCallback(async () => {
        try {
            const response = await api.get('/activity?limit=10');
            const data = response.data || [];
            // Ensure data is an array
            const notificationsArray = Array.isArray(data) ? data : [];
            setNotifications(notificationsArray);
            const unread = notificationsArray.filter(n => !n.read).length;
            setUnreadCount(unread);
        } catch (error) {
            console.error('Error fetching notifications:', error);
            setNotifications([]);
            setUnreadCount(0);
        }
    }, []);

    // ===== GET PAGE TITLE =====
    const getPageTitle = (path) => {
        const titles = {
            '/': 'Dashboard',
            '/daily-reach': 'Daily Reach',
            '/do-not-reach': 'Do Not Reach',
            '/unsubscribed': 'Unsubscribed',
            '/customers': 'All Customers',
            '/customers/create': 'Add Customer',
            '/bulk-import': 'Bulk Import',
            '/yatras': 'Yatra Master',
            '/yatra-bookings': 'Yatra Bookings',
            '/trips': 'Trips',
            '/templates': 'Templates',
            '/campaigns': 'Campaigns',
            '/broadcast': 'Broadcast',
            '/automation': 'Automation',
            '/interests': 'Interests',
            '/reports': 'Reports',
            '/activity': 'Activity Log',
            '/settings': 'Settings',
        };
        return titles[path] || 'Dashboard';
    };

    // ===== GET BREADCRUMBS =====
    const getBreadcrumbs = (path) => {
        const paths = path.split('/').filter(p => p);
        const breadcrumbs = [];
        let currentPath = '';
        
        paths.forEach((p, index) => {
            currentPath += '/' + p;
            const label = getPageTitle(currentPath) || p.charAt(0).toUpperCase() + p.slice(1);
            breadcrumbs.push({
                path: currentPath,
                label: label,
                isLast: index === paths.length - 1
            });
        });
        
        return breadcrumbs;
    };

    useEffect(() => {
        if (user) {
            fetchUsers();
            fetchNotifications();
            fetchLastLogin();
        }
        loadCounts();
        const interval = setInterval(loadCounts, 30000);
        const notificationInterval = setInterval(fetchNotifications, 60000);
        
        const updateTime = () => {
            setCurrentTime(new Date().toLocaleTimeString('en-IN', { 
                hour: '2-digit', 
                minute: '2-digit',
                second: '2-digit'
            }));
        };
        updateTime();
        const timeInterval = setInterval(updateTime, 1000);
        
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        
        // Online/Offline status
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        
        const handleClickOutside = (event) => {
            if (profileRef.current && !profileRef.current.contains(event.target)) {
                setIsProfileOpen(false);
            }
            if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
                setIsSearchOpen(false);
                setSearchQuery('');
            }
            if (notificationRef.current && !notificationRef.current.contains(event.target)) {
                setIsNotificationOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        
        // ===== KEYBOARD SHORTCUTS =====
        const handleKeyDown = (e) => {
            // Ctrl+K - Search
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                setIsSearchOpen(true);
                setTimeout(() => {
                    if (searchInputRef.current) {
                        searchInputRef.current.focus();
                    }
                }, 100);
            }
            // Escape - Close search
            if (e.key === 'Escape' && isSearchOpen) {
                setIsSearchOpen(false);
                setSearchQuery('');
            }
            // Ctrl+/ - Help
            if ((e.ctrlKey || e.metaKey) && e.key === '/') {
                e.preventDefault();
                setShowShortcuts(!showShortcuts);
            }
            // Ctrl+A - Quick Actions
            if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
                e.preventDefault();
                const dropdown = document.getElementById('quickActionsDropdown');
                if (dropdown) {
                    dropdown.classList.toggle('hidden');
                }
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        
        // Set page title
        setPageTitle(getPageTitle(location.pathname));
        
        // Apply dark mode
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        
        return () => {
            clearInterval(interval);
            clearInterval(notificationInterval);
            clearInterval(timeInterval);
            window.removeEventListener('resize', checkMobile);
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [user, fetchUsers, fetchNotifications, fetchLastLogin, location.pathname, isDarkMode]);

    const loadCounts = async () => {
        try {
            const [daily, doNot, unsub] = await Promise.all([
                api.get("/customers/group/Daily Reach"),
                api.get("/customers/group/Do Not Reach"),
                api.get("/customers/group/Unsubscribed"),
            ]);
            setCounts({
                dailyReach: daily.data?.length || 0,
                doNotReach: doNot.data?.length || 0,
                unsubscribed: unsub.data?.length || 0,
            });
        } catch (error) {
            console.error("Error loading counts:", error);
        }
    };

    // ===== SWITCH PROFILE =====
    const switchProfile = async (profile) => {
        if (profile.username === user?.username) {
            setIsProfileOpen(false);
            return;
        }

        try {
            await createActivity({
                user_id: user?.id || 1,
                username: user?.username || 'admin',
                activity: `Switched to ${profile.username}`,
            });
        } catch (error) {
            console.error("Error logging activity:", error);
        }

        const newUser = {
            id: profile.id,
            username: profile.username,
            full_name: profile.full_name || profile.username,
            role: profile.role,
        };

        localStorage.setItem("user", JSON.stringify(newUser));
        setUser(newUser);
        updateActiveProfile(profile.username);
        setIsProfileOpen(false);

        showMessage(`✅ Switched to ${profile.full_name || profile.username}`, 'success');

        setTimeout(() => {
            window.location.reload();
        }, 500);
    };

    const addNewProfile = () => {
        setIsProfileOpen(false);
        navigate('/settings');
        setTimeout(() => {
            showMessage('👤 Go to Settings → User Management to add new profile', 'info');
        }, 300);
    };

    // ===== HANDLE NOTIFICATION CLICK =====
    const handleNotificationClick = (notif) => {
        setIsNotificationOpen(false);
        // Mark as read
        if (!notif.read) {
            api.patch(`/activity/${notif.id}/read`).catch(console.error);
        }
        // Navigate based on notification type
        if (notif.activity && notif.activity.includes('Customer')) {
            navigate('/customers');
        } else if (notif.activity && notif.activity.includes('Trip')) {
            navigate('/trips');
        } else if (notif.activity && notif.activity.includes('Yatra')) {
            navigate('/yatras');
        } else if (notif.activity && notif.activity.includes('Broadcast')) {
            navigate('/broadcast');
        } else {
            navigate('/activity');
        }
    };

    // ===== TOAST =====
    const showMessage = (text, type = 'success') => {
        const toast = document.createElement('div');
        const colors = {
            success: 'bg-green-500',
            error: 'bg-red-500',
            info: 'bg-blue-500',
            warning: 'bg-yellow-500'
        };
        toast.className = `fixed top-4 right-4 z-50 px-6 py-3 rounded-lg text-white ${colors[type] || colors.success} shadow-lg transition-all duration-300 transform translate-y-0 opacity-100`;
        toast.textContent = text;
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(-20px)';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    };

    const handleLogout = async () => {
        if (!window.confirm("Are you sure you want to logout?")) return;
        
        setIsLoggingOut(true);
        
        try {
            await createActivity({
                user_id: user?.id || 1,
                username: user?.username || 'admin',
                activity: "Logged Out",
            });
        } catch (error) {
            console.error("Error logging activity:", error);
        }
        
        localStorage.removeItem("user");
        localStorage.removeItem("rememberedUsername");
        
        document.body.style.transition = "all 0.6s cubic-bezier(0.22, 1, 0.36, 1)";
        document.body.style.opacity = "0";
        document.body.style.transform = "scale(0.95)";
        
        setTimeout(() => {
            window.location.href = "/login";
        }, 600);
    };

    const toggleGroup = (group) => {
        setOpenGroups(prev => ({
            ...prev,
            [group]: !prev[group]
        }));
    };

    const getInitials = (name) => {
        if (!name) return 'U';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    // ===== HANDLE AVATAR UPLOAD =====
    const handleAvatarUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (event) => {
            const dataUrl = event.target.result;
            localStorage.setItem('userAvatar', dataUrl);
            setAvatarUrl(dataUrl);
            showMessage('✅ Avatar updated successfully!', 'success');
        };
        reader.readAsDataURL(file);
    };

    // ===== TOGGLE DARK MODE =====
    const toggleDarkMode = () => {
        const newMode = !isDarkMode;
        setIsDarkMode(newMode);
        localStorage.setItem('darkMode', JSON.stringify(newMode));
        if (newMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    };

    // ===== TOGGLE SIDEBAR WIDTH =====
    const toggleSidebarWidth = () => {
        const newWidth = !isSidebarWide;
        setIsSidebarWide(newWidth);
        localStorage.setItem('sidebarWide', JSON.stringify(newWidth));
    };

    // ===== QUICK ACTIONS =====
    const quickActions = [
        { label: 'Add Customer', path: '/customers/create', icon: <FaUserPlus /> },
        { label: 'Create Trip', path: '/trips', icon: <FaRoute /> },
        { label: 'Send Broadcast', path: '/broadcast', icon: <FaBullhorn /> },
        { label: 'New Yatra Booking', path: '/yatra-bookings', icon: <FaTicketAlt /> },
    ];

    const handleQuickAction = (path) => {
        setIsPageLoading(true);
        navigate(path);
        setTimeout(() => setIsPageLoading(false), 500);
        // Close dropdown
        const dropdown = document.getElementById('quickActionsDropdown');
        if (dropdown) {
            dropdown.classList.add('hidden');
        }
    };

    // ===== FILTER MENU ITEMS =====
    const getFilteredGroups = () => {
        const groups = [
            {
                id: 'dashboard',
                label: 'Dashboard',
                icon: <IoMdSpeedometer className="text-lg" />,
                items: [
                    { path: "/", label: "Dashboard", roles: ['admin', 'developer', 'team'] },
                    { path: "/daily-reach", label: "Daily Reach", roles: ['admin', 'developer', 'team'], badge: counts.dailyReach },
                    { path: "/do-not-reach", label: "Do Not Reach", roles: ['admin', 'developer', 'team'], badge: counts.doNotReach },
                    { path: "/unsubscribed", label: "Unsubscribed", roles: ['admin', 'developer', 'team'], badge: counts.unsubscribed },
                ]
            },
            {
                id: 'customers',
                label: 'Customers',
                icon: <IoMdPeople className="text-lg" />,
                items: [
                    { path: "/customers", label: "All Customers", roles: ['admin', 'developer', 'team'] },
                    { path: "/customers/create", label: "Add Customer", roles: ['admin', 'developer', 'team'] },
                    { path: "/bulk-import", label: "Bulk Import", roles: ['admin', 'developer', 'team'] },
                ]
            },
            {
                id: 'yatra',
                label: 'Yatra Management',
                icon: <IoMdMap className="text-lg" />,
                items: [
                    { path: "/yatras", label: "Yatra Master", roles: ['admin', 'developer', 'team'] },
                    { path: "/yatra-bookings", label: "Bookings", roles: ['admin', 'developer', 'team'] },
                    { path: "/trips", label: "Trips", roles: ['admin', 'developer', 'team'] },
                    { path: "/interests", label: "Interests", roles: ['admin', 'developer', 'team'] },
                ]
            },
            {
                id: 'communication',
                label: 'Communication',
                icon: <FaBullhorn className="text-lg" />,
                items: [
                    { path: "/templates", label: "Templates", roles: ['admin', 'developer', 'team'] },
                    { path: "/campaigns", label: "Campaigns", roles: ['admin', 'developer', 'team'] },
                    { path: "/broadcast", label: "Broadcast", roles: ['admin', 'developer', 'team'] },
                    { path: "/automation", label: "Automation", roles: ['admin', 'developer', 'team'] },
                ]
            },
            {
                id: 'reports',
                label: 'Reports & Activity',
                icon: <FaChartBar className="text-lg" />,
                items: [
                    { path: "/reports", label: "Reports", roles: ['admin', 'developer'] },
                    { path: "/activity", label: "Activity", roles: ['admin', 'developer'], badge: unreadCount > 0 ? unreadCount : undefined },
                ]
            },
            {
                id: 'settings',
                label: 'Settings',
                icon: <IoMdSettings className="text-lg" />,
                items: [
                    { path: "/settings", label: "Settings", roles: ['admin', 'developer'] },
                ]
            },
        ];

        let filtered = groups.map(group => ({
            ...group,
            items: group.items.filter(item => item.roles.includes(userRole))
        })).filter(group => group.items.length > 0);

        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim();
            filtered = filtered.map(group => ({
                ...group,
                items: group.items.filter(item => 
                    item.label.toLowerCase().includes(query) ||
                    group.label.toLowerCase().includes(query)
                )
            })).filter(group => group.items.length > 0);
        }

        return filtered;
    };

    const filteredGroups = getFilteredGroups();
    const breadcrumbs = getBreadcrumbs(location.pathname);
    
    // Sidebar width class
    const sidebarWidthClass = isSidebarWide ? 'w-80' : 'w-64';

    if (isLoggingOut) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600 dark:text-gray-400">Logging out...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`min-h-screen ${isDarkMode ? 'dark bg-slate-900' : 'bg-gray-50'} flex`}>
            {/* Mobile Menu Toggle */}
            <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="fixed top-4 left-4 z-50 md:hidden bg-blue-600 text-white p-2 rounded-lg shadow-lg"
            >
                {isMobileMenuOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
            </button>

            {/* Sidebar */}
            <aside className={`
                fixed md:sticky top-0 h-screen ${sidebarWidthClass} 
                ${isDarkMode ? 'bg-gradient-to-b from-slate-900 to-slate-800' : 'bg-gradient-to-b from-slate-900 to-slate-800'} 
                text-white flex flex-col
                transition-all duration-300 ease-in-out z-40 shadow-xl
                ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            `}>
                {/* Brand with Logo, Time & Controls */}
                <div className="p-4 border-b border-slate-700/50">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 to-yellow-500 flex items-center justify-center text-xl shadow-lg shadow-yellow-500/20 flex-shrink-0">
                                🚀
                            </div>
                            <div>
                                <h1 className="text-lg font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                                    GMC LEADS
                                </h1>
                                <p className="text-xs text-slate-400">CRM Management</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            {/* Toggle Sidebar Width */}
                            <button
                                onClick={toggleSidebarWidth}
                                className="text-slate-400 hover:text-white transition-colors p-1"
                                title="Toggle sidebar width"
                            >
                                {isSidebarWide ? <FaCompress size={14} /> : <FaExpand size={14} />}
                            </button>
                            <span className="text-xs text-slate-400 font-mono bg-slate-800/50 px-2 py-1 rounded-lg">
                                {currentTime}
                            </span>
                        </div>
                    </div>
                </div>

                {/* ===== PROFILE AT TOP ===== */}
                <div className="p-4 border-b border-slate-700/30 relative" ref={profileRef}>
                    <div 
                        className="flex items-center gap-3 cursor-pointer hover:bg-slate-700/30 rounded-lg p-2 transition-all duration-200"
                        onClick={() => setIsProfileOpen(!isProfileOpen)}
                    >
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-sm font-bold flex-shrink-0 relative">
                            {avatarUrl ? (
                                <img src={avatarUrl} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                            ) : (
                                getInitials(user?.full_name || user?.username)
                            )}
                            <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-800 ${isOnline ? 'bg-green-400' : 'bg-red-400'}`}></span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{user?.full_name || user?.username}</p>
                            <div className="flex items-center gap-2">
                                <span className={`text-xs px-2 py-0.5 rounded-full ${
                                    userRole === 'admin' ? 'bg-purple-500/30 text-purple-300' :
                                    userRole === 'developer' ? 'bg-blue-500/30 text-blue-300' :
                                    'bg-green-500/30 text-green-300'
                                }`}>
                                    {userRole === 'developer' ? 'Dev' : userRole}
                                </span>
                                <span className="text-xs text-slate-400 flex items-center gap-1">
                                    {isOnline ? '🟢 Online' : '🔴 Offline'}
                                </span>
                            </div>
                        </div>
                        <FaChevronDown className={`text-slate-400 text-xs transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} />
                    </div>

                    {/* Profile Dropdown */}
                    {isProfileOpen && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 rounded-lg shadow-xl border border-slate-700 py-1 z-50 mx-2 max-h-[80vh] overflow-y-auto">
                            {/* Current User Info */}
                            <div className="px-4 py-2 border-b border-slate-700/50">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-lg font-bold flex-shrink-0 relative">
                                        {avatarUrl ? (
                                            <img src={avatarUrl} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                                        ) : (
                                            getInitials(user?.full_name || user?.username)
                                        )}
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            className="absolute -bottom-1 -right-1 bg-slate-700 rounded-full p-1 hover:bg-slate-600 transition-colors"
                                            title="Change avatar"
                                        >
                                            <FaCamera size={10} />
                                        </button>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handleAvatarUpload}
                                        />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-white">{user?.full_name || user?.username}</p>
                                        <p className="text-xs text-slate-400">@{user?.username}</p>
                                    </div>
                                </div>
                                <p className="text-xs text-slate-500 mt-2">Last login: {lastLogin}</p>
                                <span className="text-xs text-green-400 flex items-center gap-1 mt-1">
                                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                                    Active
                                </span>
                            </div>

                            {/* Switch Profile Section */}
                            <div className="px-2 py-1">
                                <p className="text-xs text-slate-500 px-2 py-1 flex items-center gap-2">
                                    <FaUsersIcon className="text-slate-500" />
                                    Switch Profile
                                    {profilesLoading && <FaSpinner className="animate-spin text-slate-500 text-xs" />}
                                </p>
                                {availableProfiles.length === 0 && !profilesLoading ? (
                                    <p className="text-xs text-slate-500 px-3 py-2">No other users found</p>
                                ) : (
                                    availableProfiles.map((profile) => (
                                        <button
                                            key={profile.id}
                                            onClick={() => switchProfile(profile)}
                                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                                                profile.isActive 
                                                    ? 'bg-blue-500/20 text-blue-300 cursor-default' 
                                                    : 'text-slate-300 hover:bg-slate-700'
                                            }`}
                                            disabled={profile.isActive}
                                        >
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                                                {getInitials(profile.full_name || profile.username)}
                                            </div>
                                            <span className="flex-1 text-left">{profile.full_name || profile.username}</span>
                                            {profile.isActive && (
                                                <FaCheck className="text-blue-400 text-xs" />
                                            )}
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                                                profile.role === 'admin' ? 'bg-purple-500/30 text-purple-300' :
                                                profile.role === 'developer' ? 'bg-blue-500/30 text-blue-300' :
                                                'bg-green-500/30 text-green-300'
                                            }`}>
                                                {profile.role === 'developer' ? 'Dev' : profile.role}
                                            </span>
                                        </button>
                                    ))
                                )}
                            </div>

                            {/* Add Profile Button */}
                            <div className="border-t border-slate-700/50 mt-1 pt-1 px-2">
                                <button
                                    onClick={addNewProfile}
                                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-green-500/20 hover:text-green-400 transition-colors"
                                >
                                    <FaUserPlus className="text-green-400" />
                                    <span>Add New Profile</span>
                                </button>
                            </div>

                            {/* Edit Profile & Security */}
                            <div className="border-t border-slate-700/50 mt-1 pt-1">
                                <button
                                    onClick={() => {
                                        setIsProfileOpen(false);
                                        navigate('/settings');
                                    }}
                                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 transition-colors"
                                >
                                    <FaUserEdit className="text-slate-400" />
                                    <span>Edit Profile</span>
                                </button>
                                <button
                                    onClick={() => {
                                        setIsProfileOpen(false);
                                        navigate('/settings');
                                    }}
                                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 transition-colors"
                                >
                                    <FaShieldAlt className="text-slate-400" />
                                    <span>Security Settings</span>
                                </button>
                            </div>

                            {/* Logout */}
                            <div className="border-t border-slate-700/50 mt-1 pt-1">
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-400 hover:bg-red-500/20 transition-colors"
                                >
                                    <FaSignOutAlt className="text-red-400" />
                                    <span>Logout</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Search Bar */}
                <div className="p-3 border-b border-slate-700/30" ref={searchContainerRef}>
                    <div className="relative">
                        <div 
                            className={`flex items-center gap-2 bg-slate-800/50 rounded-lg px-3 py-2 transition-all duration-200 cursor-text ${
                                isSearchOpen ? 'ring-2 ring-blue-500 bg-slate-800' : 'hover:bg-slate-700/50'
                            }`}
                            onClick={() => {
                                setIsSearchOpen(true);
                                setTimeout(() => searchInputRef.current?.focus(), 100);
                            }}
                        >
                            <FaSearch className={`text-slate-400 text-sm transition-colors ${isSearchOpen ? 'text-blue-400' : ''}`} />
                            <input
                                ref={searchInputRef}
                                type="text"
                                placeholder="Search menu... (Ctrl+K)"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onFocus={() => setIsSearchOpen(true)}
                                className="bg-transparent text-sm text-white placeholder-slate-400 outline-none flex-1"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => {
                                        setSearchQuery('');
                                        searchInputRef.current?.focus();
                                    }}
                                    className="text-slate-400 hover:text-white transition-colors"
                                >
                                    <FaTimesCircle size={14} />
                                </button>
                            )}
                            <kbd className="hidden md:block text-[10px] text-slate-500 bg-slate-700/50 px-1.5 py-0.5 rounded font-mono">
                                ⌘K
                            </kbd>
                        </div>
                        {searchQuery && filteredGroups.length === 0 && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 rounded-lg shadow-xl border border-slate-700 py-2 px-4 z-50">
                                <p className="text-sm text-slate-400">No results found for "<span className="text-white">{searchQuery}</span>"</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Navigation with Groups */}
                <nav className="p-3 flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                    {filteredGroups.map((group) => {
                        const isOpen = openGroups[group.id] !== false;
                        const hasActiveChild = group.items.some(item => location.pathname === item.path);
                        
                        return (
                            <div key={group.id} className="mb-1">
                                <button
                                    onClick={() => toggleGroup(group.id)}
                                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200 hover:bg-slate-700/50 ${
                                        hasActiveChild ? 'text-white' : 'text-slate-400'
                                    }`}
                                >
                                    <span className="text-lg">{group.icon}</span>
                                    <span className="text-sm flex-1 text-left font-medium">{group.label}</span>
                                    {isOpen ? (
                                        <FaChevronUp className="text-xs text-slate-500" />
                                    ) : (
                                        <FaChevronDown className="text-xs text-slate-500" />
                                    )}
                                </button>

                                {isOpen && (
                                    <div className="ml-4 space-y-0.5 mt-0.5">
                                        {group.items.map((item) => {
                                            const isActive = location.pathname === item.path;
                                            const showBadge = item.badge !== undefined && item.badge > 0;
                                            
                                            return (
                                                <NavLink
                                                    key={item.path}
                                                    to={item.path}
                                                    onClick={() => {
                                                        if (isMobile) setIsMobileMenuOpen(false);
                                                        setIsPageLoading(true);
                                                        setTimeout(() => setIsPageLoading(false), 300);
                                                    }}
                                                    className={({ isActive }) => `
                                                        flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200 text-sm
                                                        ${isActive 
                                                            ? 'bg-gradient-to-r from-blue-600/40 to-purple-600/40 text-white shadow-lg shadow-blue-500/10' 
                                                            : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'
                                                        }
                                                    `}
                                                >
                                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-600"></span>
                                                    <span className="flex-1">{item.label}</span>
                                                    {showBadge && (
                                                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                                                            item.label === 'Activity' 
                                                                ? 'bg-red-500/30 text-red-300 animate-pulse' 
                                                                : 'bg-blue-500/30 text-blue-300'
                                                        }`}>
                                                            {item.badge}
                                                        </span>
                                                    )}
                                                    {isActive && (
                                                        <span className="w-1 h-6 bg-gradient-to-b from-blue-400 to-purple-400 rounded-full"></span>
                                                    )}
                                                </NavLink>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </nav>

                {/* Footer with Dark Mode Toggle */}
                <div className="p-4 border-t border-slate-700/30">
                    <button
                        onClick={toggleDarkMode}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-300 hover:bg-slate-700/50 hover:text-white transition-all duration-200 group"
                    >
                        {isDarkMode ? (
                            <>
                                <FaSun className="text-lg text-yellow-400" />
                                <span className="text-sm">Light Mode</span>
                            </>
                        ) : (
                            <>
                                <FaMoon className="text-lg text-blue-400" />
                                <span className="text-sm">Dark Mode</span>
                            </>
                        )}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className={`flex-1 min-h-screen ${isDarkMode ? 'bg-slate-900' : 'bg-gray-50'}`}>
                {/* ===== HEADER ===== */}
                <div className={`sticky top-0 z-30 ${isDarkMode ? 'bg-slate-800/80 backdrop-blur-md border-slate-700' : 'bg-white/80 backdrop-blur-md border-gray-200'} border-b px-4 md:px-6 py-3`}>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-4">
                            {/* Breadcrumbs */}
                            <div className={`flex items-center gap-2 text-sm ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>
                                <FaHome className={`${isDarkMode ? 'text-slate-500' : 'text-gray-400'} text-xs`} />
                                {breadcrumbs.map((crumb, index) => (
                                    <div key={index} className="flex items-center gap-2">
                                        {index > 0 && <FaChevronRight className={`${isDarkMode ? 'text-slate-600' : 'text-gray-300'} text-xs`} />}
                                        {crumb.isLast ? (
                                            <span className={`${isDarkMode ? 'text-white' : 'text-gray-800'} font-medium`}>{crumb.label}</span>
                                        ) : (
                                            <NavLink to={crumb.path} className={`${isDarkMode ? 'text-slate-400 hover:text-blue-400' : 'text-gray-500 hover:text-blue-600'} transition-colors`}>
                                                {crumb.label}
                                            </NavLink>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {/* Welcome Message */}
                            <span className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-600'} hidden md:inline`}>
                                Welcome back, <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{user?.full_name || user?.username}!</span>
                            </span>

                            {/* Quick Actions Button */}
                            <div className="relative group">
                                <button
                                    className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition-colors shadow-lg shadow-blue-500/20 flex items-center gap-1"
                                    onClick={() => {
                                        const dropdown = document.getElementById('quickActionsDropdown');
                                        if (dropdown) {
                                            dropdown.classList.toggle('hidden');
                                        }
                                    }}
                                >
                                    <FaPlus size={16} />
                                    <span className="hidden md:inline text-sm ml-1">Quick Actions</span>
                                    <kbd className="hidden md:inline text-[10px] text-blue-300 bg-blue-500/30 px-1.5 py-0.5 rounded font-mono ml-1">
                                        Ctrl+A
                                    </kbd>
                                </button>
                                <div 
                                    id="quickActionsDropdown"
                                    className={`absolute right-0 mt-2 w-56 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} rounded-lg shadow-xl border py-1 hidden group-hover:block z-50`}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.classList.add('hidden');
                                    }}
                                >
                                    {quickActions.map((action, index) => (
                                        <button
                                            key={index}
                                            onClick={() => handleQuickAction(action.path)}
                                            className={`w-full flex items-center gap-3 px-4 py-2 text-sm ${isDarkMode ? 'text-slate-300 hover:bg-slate-700' : 'text-gray-700 hover:bg-gray-50'} transition-colors`}
                                        >
                                            <span className="text-blue-500">{action.icon}</span>
                                            {action.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Notifications Bell */}
                            <div className="relative" ref={notificationRef}>
                                <button
                                    className={`relative p-2 rounded-lg ${isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-gray-100'} transition-colors`}
                                    onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                                >
                                    <FaBell className={`${isDarkMode ? 'text-slate-300' : 'text-gray-600'} text-lg`} />
                                    {unreadCount > 0 && (
                                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                                            {unreadCount}
                                        </span>
                                    )}
                                </button>
                                {isNotificationOpen && (
                                    <div className={`absolute right-0 mt-2 w-80 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} rounded-lg shadow-xl border py-1 z-50 max-h-96 overflow-y-auto`}>
                                        <div className={`px-4 py-2 border-b ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
                                            <p className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Notifications</p>
                                        </div>
                                        {notifications.length === 0 ? (
                                            <p className={`px-4 py-3 text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>No notifications</p>
                                        ) : (
                                            notifications.map((notif, index) => (
                                                <div 
                                                    key={index} 
                                                    className={`px-4 py-2 ${isDarkMode ? 'hover:bg-slate-700 border-slate-700' : 'hover:bg-gray-50 border-gray-100'} border-b last:border-0 cursor-pointer transition-colors`}
                                                    onClick={() => handleNotificationClick(notif)}
                                                >
                                                    <p className={`text-sm ${isDarkMode ? 'text-slate-200' : 'text-gray-800'}`}>{notif.activity || notif.message}</p>
                                                    <p className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-gray-400'} mt-0.5`}>
                                                        {notif.created_at ? new Date(notif.created_at).toLocaleString() : 'Just now'}
                                                    </p>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Keyboard Shortcuts Help Button */}
                            <button
                                className={`p-2 rounded-lg ${isDarkMode ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-gray-100 text-gray-500'} transition-colors`}
                                onClick={() => setShowShortcuts(!showShortcuts)}
                                title="Keyboard Shortcuts (Ctrl+/)"
                            >
                                <FaQuestionCircle className="text-lg" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Page Content with Loading Overlay */}
                <div className="p-4 md:p-6 relative">
                    {isPageLoading && (
                        <div className={`absolute inset-0 ${isDarkMode ? 'bg-slate-900/50' : 'bg-white/50'} flex items-center justify-center z-40`}>
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    )}
                    <Outlet />
                </div>
            </main>

            {/* ===== KEYBOARD SHORTCUTS HELP MODAL ===== */}
            {showShortcuts && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowShortcuts(false)}>
                    <div className={`${isDarkMode ? 'bg-slate-800' : 'bg-white'} rounded-xl shadow-2xl max-w-md w-full p-6`} onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>⌨️ Keyboard Shortcuts</h2>
                            <button onClick={() => setShowShortcuts(false)} className={`${isDarkMode ? 'text-slate-400 hover:text-white' : 'text-gray-400 hover:text-gray-600'}`}>
                                <FaTimes />
                            </button>
                        </div>
                        <div className="space-y-3">
                            <div className={`flex items-center justify-between py-2 border-b ${isDarkMode ? 'border-slate-700' : 'border-gray-100'}`}>
                                <span className={`${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>Search menu</span>
                                <kbd className={`${isDarkMode ? 'bg-slate-700 text-slate-300' : 'bg-gray-100 text-gray-700'} px-3 py-1 rounded text-sm font-mono`}>Ctrl + K</kbd>
                            </div>
                            <div className={`flex items-center justify-between py-2 border-b ${isDarkMode ? 'border-slate-700' : 'border-gray-100'}`}>
                                <span className={`${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>Close search / modal</span>
                                <kbd className={`${isDarkMode ? 'bg-slate-700 text-slate-300' : 'bg-gray-100 text-gray-700'} px-3 py-1 rounded text-sm font-mono`}>Esc</kbd>
                            </div>
                            <div className={`flex items-center justify-between py-2 border-b ${isDarkMode ? 'border-slate-700' : 'border-gray-100'}`}>
                                <span className={`${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>Open this help</span>
                                <kbd className={`${isDarkMode ? 'bg-slate-700 text-slate-300' : 'bg-gray-100 text-gray-700'} px-3 py-1 rounded text-sm font-mono`}>Ctrl + /</kbd>
                            </div>
                            <div className={`flex items-center justify-between py-2`}>
                                <span className={`${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>Quick Actions</span>
                                <kbd className={`${isDarkMode ? 'bg-slate-700 text-slate-300' : 'bg-gray-100 text-gray-700'} px-3 py-1 rounded text-sm font-mono`}>Ctrl + A</kbd>
                            </div>
                        </div>
                        <div className={`mt-4 pt-3 border-t ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
                            <p className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>Press any key to close</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Mobile Overlay */}
            {isMobileMenuOpen && (
                <div 
                    className="fixed inset-0 bg-black/50 z-30 md:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                ></div>
            )}
        </div>
    );
}

export default Layout;
