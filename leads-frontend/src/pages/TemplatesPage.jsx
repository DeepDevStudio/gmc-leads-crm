import React, { useState, useEffect } from 'react';
import { getTemplates, createTemplate, updateTemplate, deleteTemplate, toggleTemplateStatus } from '../services/templateService';
import { getInterests } from '../services/interestService';
import { createActivity } from '../services/activityService';

function TemplatesPage() {
    const [templates, setTemplates] = useState([]);
    const [interests, setInterests] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ text: "", type: "" });
    const [showForm, setShowForm] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterInterest, setFilterInterest] = useState("");
    const [filterStatus, setFilterStatus] = useState("");
    
    const [formData, setFormData] = useState({
        template_name: '',
        interest_name: '',
        message: '',
        status: 'Active'
    });

    useEffect(() => {
        loadTemplates();
        loadInterests();
    }, []);

    const loadTemplates = async () => {
        setLoading(true);
        try {
            const data = await getTemplates();
            setTemplates(data);
        } catch (error) {
            console.error('Error loading templates:', error);
            showMessage("Failed to load templates", "error");
        } finally {
            setLoading(false);
        }
    };

    const loadInterests = async () => {
        try {
            const data = await getInterests();
            setInterests(data);
        } catch (error) {
            console.error('Error loading interests:', error);
        }
    };

    const showMessage = (text, type = "success") => {
        setMessage({ text, type });
        setTimeout(() => setMessage({ text: "", type: "" }), 3000);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.template_name || !formData.message) {
            showMessage("Please fill in all required fields", "error");
            return;
        }

        setLoading(true);
        try {
            const user = JSON.parse(localStorage.getItem('user'));
            
            if (editingId) {
                await updateTemplate(editingId, formData);
                await createActivity({
                    user_id: user.id,
                    username: user.username,
                    activity: `Updated Template: ${formData.template_name}`
                });
                showMessage("Template updated successfully!", "success");
            } else {
                await createTemplate(formData);
                await createActivity({
                    user_id: user.id,
                    username: user.username,
                    activity: `Created Template: ${formData.template_name}`
                });
                showMessage("Template created successfully!", "success");
            }
            
            setFormData({ template_name: '', interest_name: '', message: '', status: 'Active' });
            setEditingId(null);
            setShowForm(false);
            loadTemplates();
        } catch (error) {
            console.error('Error saving template:', error);
            showMessage("Failed to save template", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (template) => {
        setFormData({
            template_name: template.template_name,
            interest_name: template.interest_name || '',
            message: template.message,
            status: template.status || 'Active'
        });
        setEditingId(template.id);
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id, name) => {
        if (!window.confirm(`Delete template "${name}"?`)) return;

        try {
            await deleteTemplate(id);
            const user = JSON.parse(localStorage.getItem('user'));
            await createActivity({
                user_id: user.id,
                username: user.username,
                activity: `Deleted Template: ${name}`
            });
            showMessage(`Template "${name}" deleted!`, "success");
            loadTemplates();
        } catch (error) {
            console.error('Error deleting template:', error);
            showMessage("Failed to delete template", "error");
        }
    };

    const handleToggleStatus = async (id, currentStatus) => {
        const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
        try {
            await toggleTemplateStatus(id, newStatus);
            const user = JSON.parse(localStorage.getItem('user'));
            await createActivity({
                user_id: user.id,
                username: user.username,
                activity: `${newStatus} Template`
            });
            showMessage(`Template ${newStatus}`, "success");
            loadTemplates();
        } catch (error) {
            console.error('Error toggling status:', error);
            showMessage("Failed to update status", "error");
        }
    };

    const cancelEdit = () => {
        setShowForm(false);
        setEditingId(null);
        setFormData({ template_name: '', interest_name: '', message: '', status: 'Active' });
    };

    const filteredTemplates = templates.filter(template => {
        if (searchTerm && !template.template_name?.toLowerCase().includes(searchTerm.toLowerCase())) {
            return false;
        }
        if (filterInterest && template.interest_name !== filterInterest) {
            return false;
        }
        if (filterStatus && template.status !== filterStatus) {
            return false;
        }
        return true;
    });

    return (
        <div className="space-y-6 p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">📄 Templates</h1>
                    <p className="text-gray-500">Manage WhatsApp message templates</p>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="bg-yellow-400 hover:bg-yellow-500 px-5 py-2 rounded-xl font-semibold transition"
                >
                    {showForm ? "✕ Cancel" : "+ New Template"}
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

            {/* Template Form */}
            {showForm && (
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                    <h2 className="text-xl font-semibold mb-4">
                        {editingId ? "✏️ Edit Template" : "📝 Create Template"}
                    </h2>
                    <form onSubmit={handleSubmit}>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Template Name *</label>
                                <input
                                    type="text"
                                    value={formData.template_name}
                                    onChange={(e) => setFormData({...formData, template_name: e.target.value})}
                                    className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-yellow-400 outline-none"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Interest</label>
                                <select
                                    value={formData.interest_name}
                                    onChange={(e) => setFormData({...formData, interest_name: e.target.value})}
                                    className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-yellow-400 outline-none"
                                >
                                    <option value="">No Specific Interest</option>
                                    {interests.map((interest) => (
                                        <option key={interest.id} value={interest.interest_name}>
                                            {interest.interest_name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Message *</label>
                                <textarea
                                    value={formData.message}
                                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                                    rows="4"
                                    className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-yellow-400 outline-none"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                                    className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-yellow-400 outline-none"
                                >
                                    <option value="Active">Active</option>
                                    <option value="Inactive">Inactive</option>
                                </select>
                            </div>
                        </div>
                        <div className="mt-4 flex gap-3">
                            <button
                                type="submit"
                                disabled={loading}
                                className="bg-yellow-400 hover:bg-yellow-500 px-6 py-3 rounded-xl font-semibold transition disabled:opacity-50"
                            >
                                {loading ? "Saving..." : editingId ? "Update Template" : "Create Template"}
                            </button>
                            <button
                                type="button"
                                onClick={cancelEdit}
                                className="bg-gray-300 hover:bg-gray-400 px-6 py-3 rounded-xl font-semibold transition"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
                <input
                    type="text"
                    placeholder="🔍 Search templates..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="border border-gray-300 rounded-xl p-2 text-sm flex-1 min-w-[150px] focus:ring-2 focus:ring-yellow-400 outline-none"
                />
                <select
                    value={filterInterest}
                    onChange={(e) => setFilterInterest(e.target.value)}
                    className="border border-gray-300 rounded-xl p-2 text-sm focus:ring-2 focus:ring-yellow-400 outline-none"
                >
                    <option value="">All Interests</option>
                    {interests.map((interest) => (
                        <option key={interest.id} value={interest.interest_name}>
                            {interest.interest_name}
                        </option>
                    ))}
                </select>
                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="border border-gray-300 rounded-xl p-2 text-sm focus:ring-2 focus:ring-yellow-400 outline-none"
                >
                    <option value="">All Status</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                </select>
                {(searchTerm || filterInterest || filterStatus) && (
                    <button
                        onClick={() => {
                            setSearchTerm("");
                            setFilterInterest("");
                            setFilterStatus("");
                        }}
                        className="bg-red-100 hover:bg-red-200 text-red-600 px-4 py-2 rounded-xl text-sm transition"
                    >
                        ✕ Clear Filters
                    </button>
                )}
            </div>

            {/* Templates Table */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gradient-to-r from-gray-800 to-gray-900 text-white">
                                <th className="p-3 text-left text-sm font-medium">#</th>
                                <th className="p-3 text-left text-sm font-medium">Template</th>
                                <th className="p-3 text-left text-sm font-medium">Interest</th>
                                <th className="p-3 text-left text-sm font-medium">Message</th>
                                <th className="p-3 text-left text-sm font-medium">Status</th>
                                <th className="p-3 text-center text-sm font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="p-8 text-center text-gray-500">Loading...</td>
                                </tr>
                            ) : filteredTemplates.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="p-8 text-center text-gray-500">No templates found</td>
                                </tr>
                            ) : (
                                filteredTemplates.map((template, index) => (
                                    <tr key={template.id} className="border-b hover:bg-gray-50 transition">
                                        <td className="p-3 text-gray-500">{index + 1}</td>
                                        <td className="p-3 font-medium text-gray-800">{template.template_name}</td>
                                        <td className="p-3 text-gray-600">{template.interest_name || 'All'}</td>
                                        <td className="p-3 max-w-xs truncate text-gray-600">{template.message}</td>
                                        <td className="p-3">
                                            <button
                                                onClick={() => handleToggleStatus(template.id, template.status)}
                                                className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                                                    template.status === 'Active' 
                                                        ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                                }`}
                                            >
                                                {template.status || 'Active'}
                                            </button>
                                        </td>
                                        <td className="p-3 text-center">
                                            <div className="flex gap-2 justify-center">
                                                <button
                                                    onClick={() => handleEdit(template)}
                                                    className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-lg text-sm transition"
                                                >
                                                    ✏️
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(template.id, template.template_name)}
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
        </div>
    );
}

export default TemplatesPage;
