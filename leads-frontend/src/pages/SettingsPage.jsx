import React, { useState, useEffect } from 'react';
import axios from 'axios';

const SettingsPage = () => {
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
    const [message, setMessage] = useState({ text: '', type: '' });
    const [users, setUsers] = useState([]);
    const [showUserForm, setShowUserForm] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [userFormData, setUserFormData] = useState({
        username: '',
        password: '',
        full_name: '',
        role: 'employee',
        whatsapp_number: '',
        is_active: 1
    });
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        loadSettings();
        loadUsers();
    }, []);

    const loadSettings = () => {
        const savedSettings = localStorage.getItem('companySettings');
        if (savedSettings) {
            const parsed = JSON.parse(savedSettings);
            setSettings({
                ...settings,
                ...parsed
            });
        }
    };

    const loadUsers = async () => {
        try {
            const response = await axios.get('/api/users');
            setUsers(response.data);
        } catch (error) {
            console.error('Error loading users:', error);
            showMessage('Failed to load users', 'error');
        }
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ text: '', type: '' });

        try {
            localStorage.setItem('companySettings', JSON.stringify(settings));
            showMessage('✅ Settings saved successfully!', 'success');
        } catch (error) {
            console.error('Error saving settings:', error);
            showMessage('❌ Failed to save settings.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleUserChange = (e) => {
        const { name, value, type, checked } = e.target;
        setUserFormData({
            ...userFormData,
            [name]: type === 'checkbox' ? checked : value,
        });
    };

    const handleUserSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            let response;
            if (editingUser) {
                response = await axios.put(`/api/users/${editingUser.id}`, userFormData);
                showMessage('✅ User updated successfully!', 'success');
            } else {
                response = await axios.post('/api/users', userFormData);
                showMessage('✅ User created successfully!', 'success');
            }
            
            setShowUserForm(false);
            setEditingUser(null);
            setUserFormData({
                username: '',
                password: '',
                full_name: '',
                role: 'employee',
                whatsapp_number: '',
                is_active: 1
            });
            loadUsers();
        } catch (error) {
            console.error('Error saving user:', error);
            showMessage(error.response?.data?.message || '❌ Failed to save user.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleEditUser = (user) => {
        setEditingUser(user);
        setUserFormData({
            username: user.username,
            password: '',
            full_name: user.full_name || '',
            role: user.role || 'employee',
            whatsapp_number: user.whatsapp_number || '',
            is_active: user.is_active !== undefined ? user.is_active : 1
        });
        setShowUserForm(true);
    };

    const handleDeleteUser = async (id, name) => {
        if (!window.confirm(`Delete user "${name}"?`)) return;

        try {
            await axios.delete(`/api/users/${id}`);
            showMessage(`✅ User "${name}" deleted!`, 'success');
            loadUsers();
        } catch (error) {
            console.error('Error deleting user:', error);
            showMessage('❌ Failed to delete user.', 'error');
        }
    };

    const handleToggleStatus = async (id, currentStatus) => {
        const newStatus = currentStatus === 1 ? 0 : 1;
        try {
            await axios.patch(`/api/users/${id}/status`, { is_active: newStatus });
            showMessage(`✅ User ${newStatus === 1 ? 'activated' : 'deactivated'}!`, 'success');
            loadUsers();
        } catch (error) {
            console.error('Error toggling user status:', error);
            showMessage('❌ Failed to update user status.', 'error');
        }
    };

    const getRoleBadge = (role) => {
        switch(role) {
            case 'admin': return 'bg-red-100 text-red-700';
            case 'manager': return 'bg-blue-100 text-blue-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    return (
        <div className="space-y-6 p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">⚙️ Settings</h1>
                    <p className="text-gray-500">Manage company settings and users</p>
                </div>
                <button
                    onClick={() => {
                        setShowUserForm(!showUserForm);
                        setEditingUser(null);
                        if (!showUserForm) {
                            setUserFormData({
                                username: '',
                                password: '',
                                full_name: '',
                                role: 'employee',
                                whatsapp_number: '',
                                is_active: 1
                            });
                        }
                    }}
                    className="bg-yellow-400 hover:bg-yellow-500 px-5 py-2 rounded-xl font-semibold transition"
                >
                    {showUserForm ? "✕ Cancel" : "+ Add User"}
                </button>
            </div>

            {/* Message */}
            {message.text && (
                <div className={`p-4 rounded-xl ${
                    message.type === "success" 
                        ? "bg-green-100 text-green-700 border border-green-200" 
                        : "bg-red-100 text-red-700 border border-red-200"
                }`}>
                    {message.text}
                </div>
            )}

            {/* User Form */}
            {showUserForm && (
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                    <h2 className="text-xl font-semibold mb-4">
                        {editingUser ? "✏️ Edit User" : "👤 Add New User"}
                    </h2>
                    <form onSubmit={handleUserSubmit}>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Username *</label>
                                <input
                                    type="text"
                                    name="username"
                                    value={userFormData.username}
                                    onChange={handleUserChange}
                                    className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-yellow-400 outline-none"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                                <input
                                    type="text"
                                    name="full_name"
                                    value={userFormData.full_name}
                                    onChange={handleUserChange}
                                    className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-yellow-400 outline-none"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {editingUser ? "New Password (leave blank to keep current)" : "Password *"}
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        name="password"
                                        value={userFormData.password}
                                        onChange={handleUserChange}
                                        className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-yellow-400 outline-none"
                                        required={!editingUser}
                                        minLength="6"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                                    >
                                        {showPassword ? "👁️" : "👁️‍🗨️"}
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                                <select
                                    name="role"
                                    value={userFormData.role}
                                    onChange={handleUserChange}
                                    className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-yellow-400 outline-none"
                                >
                                    <option value="admin">Admin</option>
                                    <option value="manager">Manager</option>
                                    <option value="employee">Employee</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp Number</label>
                                <input
                                    type="text"
                                    name="whatsapp_number"
                                    value={userFormData.whatsapp_number}
                                    onChange={handleUserChange}
                                    className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-yellow-400 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                <select
                                    name="is_active"
                                    value={userFormData.is_active}
                                    onChange={handleUserChange}
                                    className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-yellow-400 outline-none"
                                >
                                    <option value={1}>Active</option>
                                    <option value={0}>Inactive</option>
                                </select>
                            </div>
                        </div>
                        <div className="mt-4 flex gap-3">
                            <button
                                type="submit"
                                disabled={loading}
                                className="bg-yellow-400 hover:bg-yellow-500 px-6 py-3 rounded-xl font-semibold transition disabled:opacity-50"
                            >
                                {loading ? "Saving..." : editingUser ? "Update User" : "Create User"}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowUserForm(false);
                                    setEditingUser(null);
                                }}
                                className="bg-gray-300 hover:bg-gray-400 px-6 py-3 rounded-xl font-semibold transition"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Users Table */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                    <h2 className="font-semibold text-gray-800">👥 Users</h2>
                    <span className="text-sm text-gray-500">Total: {users.length}</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gradient-to-r from-gray-800 to-gray-900 text-white">
                                <th className="p-3 text-left text-sm font-medium">#</th>
                                <th className="p-3 text-left text-sm font-medium">Username</th>
                                <th className="p-3 text-left text-sm font-medium">Full Name</th>
                                <th className="p-3 text-left text-sm font-medium">Role</th>
                                <th className="p-3 text-left text-sm font-medium">WhatsApp</th>
                                <th className="p-3 text-left text-sm font-medium">Status</th>
                                <th className="p-3 text-center text-sm font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="p-8 text-center text-gray-500">No users found</td>
                                </tr>
                            ) : (
                                users.map((user, index) => (
                                    <tr key={user.id} className="border-b hover:bg-gray-50 transition">
                                        <td className="p-3 text-gray-500">{index + 1}</td>
                                        <td className="p-3 font-medium text-gray-800">{user.username}</td>
                                        <td className="p-3 text-gray-600">{user.full_name}</td>
                                        <td className="p-3">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleBadge(user.role)}`}>
                                                {user.role || 'employee'}
                                            </span>
                                        </td>
                                        <td className="p-3 text-gray-600">{user.whatsapp_number || '-'}</td>
                                        <td className="p-3">
                                            <button
                                                onClick={() => handleToggleStatus(user.id, user.is_active)}
                                                className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                                                    user.is_active === 1 
                                                        ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                                }`}
                                            >
                                                {user.is_active === 1 ? 'Active' : 'Inactive'}
                                            </button>
                                        </td>
                                        <td className="p-3 text-center">
                                            <div className="flex gap-2 justify-center">
                                                <button
                                                    onClick={() => handleEditUser(user)}
                                                    className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-lg text-sm transition"
                                                >
                                                    ✏️
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteUser(user.id, user.full_name)}
                                                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg text-sm transition"
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

            {/* Company Settings */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                <h2 className="text-xl font-semibold mb-4">🏢 Company Settings</h2>
                <form onSubmit={handleSubmit}>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                            <input
                                type="text"
                                name="companyName"
                                value={settings.companyName}
                                onChange={handleChange}
                                className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-yellow-400 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <input
                                type="email"
                                name="email"
                                value={settings.email}
                                onChange={handleChange}
                                className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-yellow-400 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                            <input
                                type="text"
                                name="phone"
                                value={settings.phone}
                                onChange={handleChange}
                                className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-yellow-400 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
                            <input
                                type="text"
                                name="contactNumber"
                                value={settings.contactNumber}
                                onChange={handleChange}
                                className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-yellow-400 outline-none"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                            <input
                                type="text"
                                name="address"
                                value={settings.address}
                                onChange={handleChange}
                                className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-yellow-400 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp Number</label>
                            <input
                                type="text"
                                name="whatsappNumber"
                                value={settings.whatsappNumber}
                                onChange={handleChange}
                                className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-yellow-400 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Auto Reply</label>
                            <select
                                name="autoReply"
                                value={settings.autoReply ? "true" : "false"}
                                onChange={(e) => setSettings({...settings, autoReply: e.target.value === "true"})}
                                className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-yellow-400 outline-none"
                            >
                                <option value="true">Enabled</option>
                                <option value="false">Disabled</option>
                            </select>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Auto Reply Message</label>
                            <textarea
                                name="autoReplyMessage"
                                value={settings.autoReplyMessage}
                                onChange={handleChange}
                                rows="3"
                                className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-yellow-400 outline-none"
                            />
                        </div>
                    </div>
                    <div className="mt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-yellow-400 hover:bg-yellow-500 px-6 py-3 rounded-xl font-semibold transition disabled:opacity-50"
                        >
                            {loading ? "Saving..." : "💾 Save Settings"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SettingsPage;
