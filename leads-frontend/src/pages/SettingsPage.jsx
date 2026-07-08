import React, { useState, useEffect } from 'react';
import api from '../services/api';

const SettingsPage = () => {
    const [user, setUser] = useState(() => {
        const saved = localStorage.getItem('user');
        return saved ? JSON.parse(saved) : null;
    });

    const [settings, setSettings] = useState({
        companyName: 'Get Me Cab',
        email: 'info@getmecab.com',
        phone: '+91 9876543210',
        contactNumber: '+91 9015430550',
        address: 'Delhi, India',
        whatsappNumber: '',
        autoReply: false,
        autoReplyMessage: 'Thank you for your message! We will get back to you shortly.',
    });
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });
    const [users, setUsers] = useState([]);
    const [showUserForm, setShowUserForm] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [userFormData, setUserFormData] = useState({
        username: '',
        password: '',
        full_name: '',
        role: 'team',
        whatsapp_number: '',
        is_active: 1
    });
    const [showPassword, setShowPassword] = useState(false);

    // ===== CHANGE PASSWORD STATE =====
    const [showChangePassword, setShowChangePassword] = useState(false);
    const [passwordData, setPasswordData] = useState({
        current_password: '',
        new_password: '',
        confirm_password: ''
    });
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [passwordLoading, setPasswordLoading] = useState(false);

    // ===== DARK MODE PREFERENCE =====
    const [darkModePref, setDarkModePref] = useState(() => {
        const saved = localStorage.getItem('darkMode');
        return saved ? JSON.parse(saved) : false;
    });

    // ===== MY PROFILE STATE =====
    const [showEditProfile, setShowEditProfile] = useState(false);
    const [profileData, setProfileData] = useState({
        full_name: user?.full_name || '',
        whatsapp_number: user?.whatsapp_number || '',
    });
    const [profileLoading, setProfileLoading] = useState(false);

    // Stats
    const [stats, setStats] = useState({
        totalUsers: 0,
        activeUsers: 0,
        inactiveUsers: 0,
        admins: 0,
        developers: 0,
        teams: 0
    });

    // ===== LOAD SETTINGS FROM API =====
    const loadSettings = async () => {
        try {
            const response = await api.get('/settings');
            if (response.data) {
                setSettings({
                    ...settings,
                    ...response.data
                });
            }
        } catch (error) {
            console.error('Error loading settings:', error);
            // Fallback to localStorage
            const savedSettings = localStorage.getItem('companySettings');
            if (savedSettings) {
                const parsed = JSON.parse(savedSettings);
                setSettings({
                    ...settings,
                    ...parsed
                });
            }
        }
    };

    const loadUsers = async () => {
        setLoading(true);
        try {
            const response = await api.get('/users');
            setUsers(response.data || []);
        } catch (error) {
            console.error('Error loading users:', error);
            showMessage('Failed to load users', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSettings();
        loadUsers();
        // Apply dark mode preference
        if (darkModePref) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        // Set profile data
        if (user) {
            setProfileData({
                full_name: user.full_name || '',
                whatsapp_number: user.whatsapp_number || '',
            });
        }
    }, []);

    useEffect(() => {
        calculateStats();
    }, [users]);

    const calculateStats = () => {
        const totalUsers = users.length;
        const activeUsers = users.filter(u => u.is_active).length;
        const inactiveUsers = users.filter(u => !u.is_active).length;
        const admins = users.filter(u => u.role === 'admin').length;
        const developers = users.filter(u => u.role === 'developer').length;
        const teams = users.filter(u => u.role === 'team').length;

        setStats({ totalUsers, activeUsers, inactiveUsers, admins, developers, teams });
    };

    const showMessage = (text, type = 'success') => {
        setMessage({ text, type });
        setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setSettings({
            ...settings,
            [name]: type === 'checkbox' ? checked : value,
        });
    };

    // ===== SAVE SETTINGS TO API =====
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await api.put('/settings', settings);
            if (response.data.success) {
                // Also save to localStorage as backup
                localStorage.setItem('companySettings', JSON.stringify(settings));
                showMessage('✅ Settings saved successfully!', 'success');
            }
        } catch (error) {
            console.error('Error saving settings:', error);
            // Fallback to localStorage
            localStorage.setItem('companySettings', JSON.stringify(settings));
            showMessage('✅ Settings saved locally! (API unavailable)', 'warning');
        } finally {
            setLoading(false);
        }
    };

    // ===== CHANGE PASSWORD =====
    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswordData({
            ...passwordData,
            [name]: value
        });
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        
        if (passwordData.new_password !== passwordData.confirm_password) {
            showMessage('❌ New passwords do not match!', 'error');
            return;
        }

        if (passwordData.new_password.length < 6) {
            showMessage('❌ Password must be at least 6 characters!', 'error');
            return;
        }

        setPasswordLoading(true);
        try {
            await api.post('/users/change-password', {
                user_id: user?.id,
                current_password: passwordData.current_password,
                new_password: passwordData.new_password
            });
            showMessage('✅ Password changed successfully!', 'success');
            setPasswordData({
                current_password: '',
                new_password: '',
                confirm_password: ''
            });
            setShowChangePassword(false);
        } catch (error) {
            console.error('Error changing password:', error);
            showMessage('❌ ' + (error.response?.data?.message || 'Failed to change password'), 'error');
        } finally {
            setPasswordLoading(false);
        }
    };

    // ===== TOGGLE DARK MODE =====
    const toggleDarkMode = () => {
        const newMode = !darkModePref;
        setDarkModePref(newMode);
        localStorage.setItem('darkMode', JSON.stringify(newMode));
        if (newMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        showMessage(`🌓 Dark mode ${newMode ? 'enabled' : 'disabled'}`, 'success');
    };

    // ===== UPDATE PROFILE =====
    const handleProfileChange = (e) => {
        const { name, value } = e.target;
        setProfileData({
            ...profileData,
            [name]: value
        });
    };

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        setProfileLoading(true);

        try {
            await api.put(`/users/${user.id}`, {
                ...user,
                full_name: profileData.full_name,
                whatsapp_number: profileData.whatsapp_number
            });
            // Update local storage
            const updatedUser = {
                ...user,
                full_name: profileData.full_name,
                whatsapp_number: profileData.whatsapp_number
            };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            setUser(updatedUser);
            showMessage('✅ Profile updated successfully!', 'success');
            setShowEditProfile(false);
        } catch (error) {
            console.error('Error updating profile:', error);
            showMessage('❌ Failed to update profile', 'error');
        } finally {
            setProfileLoading(false);
        }
    };

    const handleUserChange = (e) => {
        const { name, value, type, checked } = e.target;
        setUserFormData({
            ...userFormData,
            [name]: type === 'checkbox' ? (checked ? 1 : 0) : value,
        });
    };

    const handleUserSubmit = async (e) => {
        e.preventDefault();
        setActionLoading(true);

        try {
            if (editingUser) {
                await api.put(`/users/${editingUser.id}`, userFormData);
                showMessage('✅ User updated successfully!', 'success');
            } else {
                if (!userFormData.password) {
                    showMessage('Password is required for new users', 'error');
                    setActionLoading(false);
                    return;
                }
                await api.post('/users', userFormData);
                showMessage('✅ User created successfully!', 'success');
            }
            
            resetUserForm();
            loadUsers();
        } catch (error) {
            console.error('Error saving user:', error);
            showMessage('❌ Failed to save user: ' + (error.response?.data?.error || error.message), 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const handleEditUser = (user) => {
        setEditingUser(user);
        setUserFormData({
            username: user.username,
            password: '',
            full_name: user.full_name || '',
            role: user.role || 'team',
            whatsapp_number: user.whatsapp_number || '',
            is_active: user.is_active !== undefined ? user.is_active : 1
        });
        setShowUserForm(true);
    };

    const handleDeleteUser = async (id, username) => {
        if (!window.confirm(`Delete user "${username}"? This cannot be undone.`)) return;

        setActionLoading(true);
        try {
            await api.delete(`/users/${id}`);
            showMessage(`🗑️ User "${username}" deleted!`, 'success');
            loadUsers();
        } catch (error) {
            console.error('Error deleting user:', error);
            showMessage('❌ Failed to delete user', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const resetUserForm = () => {
        setUserFormData({
            username: '',
            password: '',
            full_name: '',
            role: 'team',
            whatsapp_number: '',
            is_active: 1
        });
        setEditingUser(null);
        setShowUserForm(false);
        setShowPassword(false);
    };

    const exportUsers = () => {
        if (users.length === 0) {
            showMessage('No users to export', 'error');
            return;
        }

        const headers = ['#', 'Username', 'Full Name', 'Role', 'WhatsApp', 'Status'];
        const rows = users.map((user, index) => [
            index + 1,
            user.username,
            user.full_name || user.username,
            user.role || 'team',
            user.whatsapp_number || 'N/A',
            user.is_active ? 'Active' : 'Inactive'
        ]);

        let csv = headers.join(',') + '\n';
        rows.forEach(row => {
            csv += row.join(',') + '\n';
        });

        csv += '\n\n📊 SUMMARY\n';
        csv += `Total Users,${users.length}\n`;
        csv += `Active Users,${stats.activeUsers}\n`;
        csv += `Inactive Users,${stats.inactiveUsers}\n`;
        csv += `Admins,${stats.admins}\n`;
        csv += `Developers,${stats.developers}\n`;
        csv += `Team Members,${stats.teams}\n`;
        csv += `Exported On,${new Date().toLocaleString()}\n`;

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `users_export_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        showMessage('📥 Users exported successfully!', 'success');
    };

    const getRoleBadge = (role) => {
        switch(role) {
            case 'admin': return 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-700';
            case 'developer': return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700';
            case 'team': return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700';
            default: return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
        }
    };

    return (
        <div className="space-y-6 p-6 max-w-7xl mx-auto">
            <div>
                <h1 className="text-4xl font-bold text-gray-800 dark:text-white">⚙️ Settings</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-2">Manage company settings and user accounts</p>
            </div>

            {/* Stats Dashboard */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-3 border-l-4 border-blue-500">
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Total Users</p>
                    <p className="text-xl font-bold dark:text-white">{stats.totalUsers}</p>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-3 border-l-4 border-green-500">
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Active</p>
                    <p className="text-xl font-bold text-green-600 dark:text-green-400">{stats.activeUsers}</p>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-3 border-l-4 border-red-500">
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Inactive</p>
                    <p className="text-xl font-bold text-red-600 dark:text-red-400">{stats.inactiveUsers}</p>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-3 border-l-4 border-purple-500">
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Admins</p>
                    <p className="text-xl font-bold text-purple-600 dark:text-purple-400">{stats.admins}</p>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-3 border-l-4 border-blue-500">
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Developers</p>
                    <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{stats.developers}</p>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-3 border-l-4 border-green-500">
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Team Members</p>
                    <p className="text-xl font-bold text-green-600 dark:text-green-400">{stats.teams}</p>
                </div>
            </div>

            {/* Message */}
            {message.text && (
                <div className={`p-4 rounded-xl ${message.type === 'error' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-700' : message.type === 'warning' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-700' : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-700'}`}>
                    {message.text}
                </div>
            )}

            {/* ===== MY PROFILE SECTION ===== */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6 border border-gray-200 dark:border-slate-700">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white">👤 My Profile</h2>
                    <button
                        onClick={() => setShowEditProfile(!showEditProfile)}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium"
                    >
                        {showEditProfile ? '✕ Cancel' : '✏️ Edit Profile'}
                    </button>
                </div>
                {!showEditProfile ? (
                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Full Name</p>
                            <p className="text-gray-800 dark:text-white font-medium">{user?.full_name || 'Not set'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Username</p>
                            <p className="text-gray-800 dark:text-white font-medium">@{user?.username}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Role</p>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadge(user?.role)} border`}>
                                {user?.role || 'team'}
                            </span>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">WhatsApp Number</p>
                            <p className="text-gray-800 dark:text-white font-medium">{user?.whatsapp_number || 'Not set'}</p>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleProfileSubmit}>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                                <input
                                    type="text"
                                    name="full_name"
                                    value={profileData.full_name}
                                    onChange={handleProfileChange}
                                    className="w-full p-3 border dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">WhatsApp Number</label>
                                <input
                                    type="text"
                                    name="whatsapp_number"
                                    value={profileData.whatsapp_number}
                                    onChange={handleProfileChange}
                                    placeholder="+91 9876543210"
                                    className="w-full p-3 border dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                                />
                            </div>
                        </div>
                        <div className="mt-4">
                            <button
                                type="submit"
                                disabled={profileLoading}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition disabled:opacity-50"
                            >
                                {profileLoading ? 'Saving...' : '💾 Update Profile'}
                            </button>
                        </div>
                    </form>
                )}
            </div>

            {/* ===== CHANGE PASSWORD ===== */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6 border border-gray-200 dark:border-slate-700">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white">🔐 Change Password</h2>
                    <button
                        onClick={() => setShowChangePassword(!showChangePassword)}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium"
                    >
                        {showChangePassword ? '✕ Cancel' : '✏️ Change Password'}
                    </button>
                </div>
                {showChangePassword && (
                    <form onSubmit={handlePasswordSubmit}>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Current Password *</label>
                                <div className="flex gap-2">
                                    <input
                                        type={showCurrentPassword ? 'text' : 'password'}
                                        name="current_password"
                                        value={passwordData.current_password}
                                        onChange={handlePasswordChange}
                                        className="flex-1 p-3 border dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                        className="bg-gray-200 dark:bg-slate-600 hover:bg-gray-300 dark:hover:bg-slate-500 px-3 rounded-lg text-sm dark:text-white"
                                    >
                                        {showCurrentPassword ? '🙈' : '👁️'}
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">New Password *</label>
                                <div className="flex gap-2">
                                    <input
                                        type={showNewPassword ? 'text' : 'password'}
                                        name="new_password"
                                        value={passwordData.new_password}
                                        onChange={handlePasswordChange}
                                        className="flex-1 p-3 border dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                                        required
                                        minLength="6"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                        className="bg-gray-200 dark:bg-slate-600 hover:bg-gray-300 dark:hover:bg-slate-500 px-3 rounded-lg text-sm dark:text-white"
                                    >
                                        {showNewPassword ? '🙈' : '👁️'}
                                    </button>
                                </div>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirm New Password *</label>
                                <div className="flex gap-2">
                                    <input
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        name="confirm_password"
                                        value={passwordData.confirm_password}
                                        onChange={handlePasswordChange}
                                        className="flex-1 p-3 border dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="bg-gray-200 dark:bg-slate-600 hover:bg-gray-300 dark:hover:bg-slate-500 px-3 rounded-lg text-sm dark:text-white"
                                    >
                                        {showConfirmPassword ? '🙈' : '👁️'}
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="mt-4">
                            <button
                                type="submit"
                                disabled={passwordLoading}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition disabled:opacity-50"
                            >
                                {passwordLoading ? 'Updating...' : '🔑 Update Password'}
                            </button>
                        </div>
                    </form>
                )}
            </div>

            {/* ===== DARK MODE ===== */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6 border border-gray-200 dark:border-slate-700">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">🎨 Appearance</h2>
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-gray-700 dark:text-gray-300 font-medium">Dark Mode</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Toggle dark/light theme</p>
                    </div>
                    <button
                        onClick={toggleDarkMode}
                        className={`relative w-14 h-8 rounded-full transition-colors ${darkModePref ? 'bg-blue-600' : 'bg-gray-300 dark:bg-slate-600'}`}
                    >
                        <span className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${darkModePref ? 'translate-x-6' : 'translate-x-0'} flex items-center justify-center`}>
                            {darkModePref ? '🌙' : '☀️'}
                        </span>
                    </button>
                </div>
            </div>

            {/* ===== COMPANY SETTINGS ===== */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6 border border-gray-200 dark:border-slate-700">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">🏢 Company Settings</h2>
                <form onSubmit={handleSubmit}>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Company Name</label>
                            <input
                                type="text"
                                name="companyName"
                                value={settings.companyName}
                                onChange={handleChange}
                                className="w-full p-3 border dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                            <input
                                type="email"
                                name="email"
                                value={settings.email}
                                onChange={handleChange}
                                className="w-full p-3 border dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
                            <input
                                type="text"
                                name="phone"
                                value={settings.phone}
                                onChange={handleChange}
                                className="w-full p-3 border dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contact Number</label>
                            <input
                                type="text"
                                name="contactNumber"
                                value={settings.contactNumber}
                                onChange={handleChange}
                                className="w-full p-3 border dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Address</label>
                            <input
                                type="text"
                                name="address"
                                value={settings.address}
                                onChange={handleChange}
                                className="w-full p-3 border dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">WhatsApp Number</label>
                            <input
                                type="text"
                                name="whatsappNumber"
                                value={settings.whatsappNumber}
                                onChange={handleChange}
                                placeholder="+91 9876543210"
                                className="w-full p-3 border dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                            />
                        </div>
                        <div className="flex items-center">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    name="autoReply"
                                    checked={settings.autoReply}
                                    onChange={handleChange}
                                    className="w-4 h-4 text-blue-600 dark:bg-slate-700"
                                />
                                <span className="text-sm text-gray-700 dark:text-gray-300">Enable Auto-Reply</span>
                            </label>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Auto-Reply Message</label>
                            <textarea
                                name="autoReplyMessage"
                                value={settings.autoReplyMessage}
                                onChange={handleChange}
                                rows="3"
                                className="w-full p-3 border dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                                disabled={!settings.autoReply}
                            />
                        </div>
                    </div>
                    <div className="mt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition disabled:opacity-50"
                        >
                            {loading ? 'Saving...' : '💾 Save Settings'}
                        </button>
                    </div>
                </form>
            </div>

            {/* ===== USER MANAGEMENT ===== */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6 border border-gray-200 dark:border-slate-700">
                <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white">👥 User Management</h2>
                    <div className="flex gap-2">
                        <button
                            onClick={exportUsers}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition text-sm"
                        >
                            📥 Export Users
                        </button>
                        <button
                            onClick={() => {
                                resetUserForm();
                                setShowUserForm(!showUserForm);
                            }}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
                        >
                            {showUserForm ? '✕ Cancel' : '+ Add User'}
                        </button>
                    </div>
                </div>

                {/* User Form */}
                {showUserForm && (
                    <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4 mb-4 border border-gray-200 dark:border-slate-600">
                        <h3 className="font-semibold text-gray-800 dark:text-white mb-3">
                            {editingUser ? '✏️ Edit User' : '📝 Create New User'}
                        </h3>
                        <form onSubmit={handleUserSubmit}>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Username *</label>
                                    <input
                                        type="text"
                                        name="username"
                                        value={userFormData.username}
                                        onChange={handleUserChange}
                                        className="w-full p-2 border dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                                        required
                                        disabled={!!editingUser}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        {editingUser ? 'New Password (leave blank to keep)' : 'Password *'}
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            name="password"
                                            value={userFormData.password}
                                            onChange={handleUserChange}
                                            className="flex-1 p-2 border dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                                            required={!editingUser}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="bg-gray-200 dark:bg-slate-600 hover:bg-gray-300 dark:hover:bg-slate-500 px-3 rounded-lg text-sm dark:text-white"
                                        >
                                            {showPassword ? '🙈' : '👁️'}
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                                    <input
                                        type="text"
                                        name="full_name"
                                        value={userFormData.full_name}
                                        onChange={handleUserChange}
                                        className="w-full p-2 border dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
                                    <select
                                        name="role"
                                        value={userFormData.role}
                                        onChange={handleUserChange}
                                        className="w-full p-2 border dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                                    >
                                        <option value="admin">Admin</option>
                                        <option value="developer">Developer</option>
                                        <option value="team">Team Member</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">WhatsApp Number</label>
                                    <input
                                        type="text"
                                        name="whatsapp_number"
                                        value={userFormData.whatsapp_number}
                                        onChange={handleUserChange}
                                        placeholder="+91 9876543210"
                                        className="w-full p-2 border dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                                    />
                                </div>
                                <div className="flex items-center">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            name="is_active"
                                            checked={userFormData.is_active === 1}
                                            onChange={handleUserChange}
                                            className="w-4 h-4 text-blue-600 dark:bg-slate-700"
                                        />
                                        <span className="text-sm text-gray-700 dark:text-gray-300">Active</span>
                                    </label>
                                </div>
                            </div>
                            <div className="mt-4 flex gap-3">
                                <button
                                    type="submit"
                                    disabled={actionLoading}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition disabled:opacity-50"
                                >
                                    {actionLoading ? 'Saving...' : editingUser ? 'Update User' : 'Create User'}
                                </button>
                                <button
                                    type="button"
                                    onClick={resetUserForm}
                                    className="bg-gray-300 dark:bg-slate-600 hover:bg-gray-400 dark:hover:bg-slate-500 px-6 py-2 rounded-lg transition dark:text-white"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Users Table */}
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-slate-700/50">
                            <tr>
                                <th className="px-4 py-2 text-left text-sm font-medium text-gray-600 dark:text-gray-400">#</th>
                                <th className="px-4 py-2 text-left text-sm font-medium text-gray-600 dark:text-gray-400">Username</th>
                                <th className="px-4 py-2 text-left text-sm font-medium text-gray-600 dark:text-gray-400">Full Name</th>
                                <th className="px-4 py-2 text-left text-sm font-medium text-gray-600 dark:text-gray-400">Role</th>
                                <th className="px-4 py-2 text-left text-sm font-medium text-gray-600 dark:text-gray-400">WhatsApp</th>
                                <th className="px-4 py-2 text-center text-sm font-medium text-gray-600 dark:text-gray-400">Status</th>
                                <th className="px-4 py-2 text-center text-sm font-medium text-gray-600 dark:text-gray-400">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="p-4 text-center text-gray-500 dark:text-gray-400">Loading users...</td>
                                </tr>
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="p-4 text-center text-gray-500 dark:text-gray-400">No users found</td>
                                </tr>
                            ) : (
                                users.map((user, index) => (
                                    <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition">
                                        <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">{index + 1}</td>
                                        <td className="px-4 py-2 text-sm font-medium text-gray-800 dark:text-white">@{user.username}</td>
                                        <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300">{user.full_name || '-'}</td>
                                        <td className="px-4 py-2">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadge(user.role)} border`}>
                                                {user.role || 'team'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300">{user.whatsapp_number || '-'}</td>
                                        <td className="px-4 py-2 text-center">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.is_active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                                                {user.is_active ? '🟢 Active' : '🔴 Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2 text-center">
                                            <div className="flex gap-1 justify-center">
                                                <button
                                                    onClick={() => handleEditUser(user)}
                                                    className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs transition"
                                                >
                                                    ✏️
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteUser(user.id, user.username)}
                                                    disabled={actionLoading}
                                                    className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs transition disabled:opacity-50"
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;
