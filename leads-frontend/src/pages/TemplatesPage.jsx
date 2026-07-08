import React, { useState, useEffect } from 'react';
import { getTemplates, createTemplate, updateTemplate, deleteTemplate, duplicateTemplate } from '../services/templateService';
import { getInterests } from '../services/interestService';
import { createActivity } from '../services/activityService';

function TemplatesPage() {
    const [templates, setTemplates] = useState([]);
    const [interests, setInterests] = useState([]);
    const [categories, setCategories] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [message, setMessage] = useState({ text: "", type: "" });
    const [showForm, setShowForm] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [previewTemplate, setPreviewTemplate] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterCategory, setFilterCategory] = useState("");
    const [filterStatus, setFilterStatus] = useState("");
    
    const [formData, setFormData] = useState({
        template_name: '',
        category: 'General',
        interest_name: '',
        message: '',
        variables: '',
        status: 'Active'
    });

    // ===== DARK MODE =====
    const [isDarkMode, setIsDarkMode] = useState(() => {
        const saved = localStorage.getItem('darkMode');
        return saved ? JSON.parse(saved) : false;
    });

    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [isDarkMode]);

    const [stats, setStats] = useState({
        total: 0,
        active: 0,
        inactive: 0,
        usageCount: 0
    });

    useEffect(() => {
        loadTemplates();
        loadInterests();
        loadCategories();
    }, []);

    useEffect(() => {
        calculateStats();
    }, [templates]);

    const calculateStats = () => {
        const total = templates.length;
        const active = templates.filter(t => t.status === 'Active').length;
        const inactive = templates.filter(t => t.status === 'Inactive').length;
        const usageCount = templates.reduce((sum, t) => sum + (t.usage_count || 0), 0);
        setStats({ total, active, inactive, usageCount });
    };

    const loadTemplates = async () => {
        setLoading(true);
        try {
            const data = await getTemplates();
            setTemplates(data || []);
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
            setInterests(data || []);
        } catch (error) {
            console.error('Error loading interests:', error);
        }
    };

    const loadCategories = async () => {
        try {
            const response = await fetch('/api/templates/categories');
            const data = await response.json();
            setCategories(data || []);
        } catch (error) {
            console.error('Error loading categories:', error);
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

        setActionLoading(true);
        try {
            const user = JSON.parse(localStorage.getItem('user'));
            
            if (editingId) {
                await updateTemplate(editingId, formData);
                await createActivity({
                    user_id: user?.id || 1,
                    username: user?.username || 'admin',
                    activity: `Updated Template: ${formData.template_name}`
                });
                showMessage("✅ Template updated successfully!", "success");
            } else {
                await createTemplate(formData);
                await createActivity({
                    user_id: user?.id || 1,
                    username: user?.username || 'admin',
                    activity: `Created Template: ${formData.template_name}`
                });
                showMessage("✅ Template created successfully!", "success");
            }
            
            resetForm();
            loadTemplates();
        } catch (error) {
            console.error('Error saving template:', error);
            showMessage("Failed to save template", "error");
        } finally {
            setActionLoading(false);
        }
    };

    const handleEdit = (template) => {
        setFormData({
            template_name: template.template_name,
            category: template.category || 'General',
            interest_name: template.interest_name || '',
            message: template.message || '',
            variables: template.variables || '',
            status: template.status || 'Active'
        });
        setEditingId(template.id);
        setShowForm(true);
    };

    const handleDuplicate = async (id, name) => {
        if (!window.confirm(`Duplicate template "${name}"?`)) return;
        setActionLoading(true);
        try {
            await duplicateTemplate(id);
            const user = JSON.parse(localStorage.getItem('user'));
            await createActivity({
                user_id: user?.id || 1,
                username: user?.username || 'admin',
                activity: `Duplicated Template: ${name}`
            });
            showMessage(`✅ Template "${name}" duplicated!`, "success");
            loadTemplates();
        } catch (error) {
            console.error(error);
            showMessage("Failed to duplicate template", "error");
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async (id, name) => {
        if (!window.confirm(`Delete template "${name}"?`)) return;
        setActionLoading(true);
        try {
            await deleteTemplate(id);
            const user = JSON.parse(localStorage.getItem('user'));
            await createActivity({
                user_id: user?.id || 1,
                username: user?.username || 'admin',
                activity: `Deleted Template: ${name}`
            });
            showMessage(`🗑️ Template "${name}" deleted!`, "success");
            loadTemplates();
        } catch (error) {
            console.error(error);
            showMessage("Failed to delete template", "error");
        } finally {
            setActionLoading(false);
        }
    };

    const handlePreview = (template) => {
        setPreviewTemplate(template);
        setShowPreview(true);
    };

    const resetForm = () => {
        setFormData({
            template_name: '',
            category: 'General',
            interest_name: '',
            message: '',
            variables: '',
            status: 'Active'
        });
        setEditingId(null);
        setShowForm(false);
    };

    const exportTemplates = () => {
        if (filteredTemplates.length === 0) {
            showMessage("No templates to export", "error");
            return;
        }

        const headers = ['#', 'Template Name', 'Category', 'Interest', 'Message Preview', 'Variables', 'Status', 'Usage Count', 'Created At'];
        const rows = filteredTemplates.map((template, index) => [
            index + 1,
            template.template_name || 'N/A',
            template.category || 'General',
            template.interest_name || 'All',
            (template.message || '').substring(0, 50) + '...',
            template.variables || 'None',
            template.status || 'Active',
            template.usage_count || 0,
            new Date(template.created_at).toLocaleDateString('en-IN')
        ]);

        let csv = headers.join(',') + '\n';
        rows.forEach(row => {
            csv += row.join(',') + '\n';
        });

        csv += '\n\n📊 SUMMARY\n';
        csv += `Total Templates,${filteredTemplates.length}\n`;
        csv += `Active,${filteredTemplates.filter(t => t.status === 'Active').length}\n`;
        csv += `Inactive,${filteredTemplates.filter(t => t.status === 'Inactive').length}\n`;
        csv += `Total Usage,${stats.usageCount}\n`;
        csv += `Exported On,${new Date().toLocaleString()}\n`;

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `templates_export_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        showMessage(`📥 Exported ${filteredTemplates.length} templates`, "success");
    };

    const getStatusColor = (status) => {
        return status === 'Active' 
            ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700' 
            : 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700';
    };

    const getCategoryColor = (category) => {
        const colors = {
            'Promotional': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
            'Transactional': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
            'Reminder': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
            'Welcome': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
            'Follow-up': 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
            'General': 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
        };
        return colors[category] || colors['General'];
    };

    const filteredTemplates = templates.filter(template => {
        const matchesSearch = template.template_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             template.message?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = filterCategory === "" || template.category === filterCategory;
        const matchesStatus = filterStatus === "" || template.status === filterStatus;
        return matchesSearch && matchesCategory && matchesStatus;
    });

    const templateCategories = ['General', 'Promotional', 'Transactional', 'Reminder', 'Welcome', 'Follow-up'];

    const renderVariablesPreview = (message, variables) => {
        if (!variables) return message;
        const varList = variables.split(',').map(v => v.trim());
        let preview = message;
        varList.forEach(v => {
            preview = preview.replace(`{${v}}`, `[${v}]`);
        });
        return preview;
    };

    return (
        <div className={`p-6 max-w-7xl mx-auto ${isDarkMode ? 'dark' : ''}`}>
            {/* Message */}
            {message.text && (
                <div className={`p-4 rounded-xl mb-4 ${message.type === 'error' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-700' : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-700'}`}>
                    {message.text}
                </div>
            )}

            {/* Stats Dashboard */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 border-l-4 border-blue-500">
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Total Templates</p>
                    <p className="text-2xl font-bold dark:text-white">{stats.total}</p>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 border-l-4 border-green-500">
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Active</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.active}</p>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 border-l-4 border-red-500">
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Inactive</p>
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.inactive}</p>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 border-l-4 border-purple-500">
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Total Usage</p>
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.usageCount}</p>
                </div>
            </div>

            {/* Header */}
            <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-white">📝 Message Templates</h1>
                    <p className="text-gray-500 dark:text-gray-400">Create and manage reusable message templates</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={exportTemplates}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition text-sm"
                    >
                        📥 Export
                    </button>
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
                    >
                        {showForm ? '✕ Cancel' : '+ New Template'}
                    </button>
                </div>
            </div>

            {/* Preview Modal */}
            {showPreview && previewTemplate && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowPreview(false)}>
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-2xl w-full p-6" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-gray-800 dark:text-white">📄 Template Preview</h2>
                            <button onClick={() => setShowPreview(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                                ✕
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Template Name</p>
                                <p className="font-medium dark:text-white">{previewTemplate.template_name}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Category</p>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(previewTemplate.category)}`}>
                                    {previewTemplate.category || 'General'}
                                </span>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Message</p>
                                <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-4 mt-1">
                                    <p className="text-gray-800 dark:text-white whitespace-pre-wrap">
                                        {previewTemplate.variables ? renderVariablesPreview(previewTemplate.message, previewTemplate.variables) : previewTemplate.message}
                                    </p>
                                </div>
                                {previewTemplate.variables && (
                                    <div className="mt-2">
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Variables Available:</p>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {previewTemplate.variables.split(',').map((v, i) => (
                                                <span key={i} className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded text-xs">
                                                    {`{${v.trim()}}`}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(previewTemplate.status)}`}>
                                    {previewTemplate.status}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Create/Edit Form */}
            {showForm && (
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 mb-6 border border-gray-200 dark:border-slate-700">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
                        {editingId ? '✏️ Edit Template' : '📝 Create New Template'}
                    </h2>
                    <form onSubmit={handleSubmit}>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Template Name *</label>
                                <input
                                    type="text"
                                    name="template_name"
                                    value={formData.template_name}
                                    onChange={(e) => setFormData({ ...formData, template_name: e.target.value })}
                                    className="w-full p-3 border dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                                    placeholder="Enter template name"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                                <select
                                    name="category"
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    className="w-full p-3 border dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                                >
                                    {templateCategories.map((cat) => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Interest</label>
                                <select
                                    name="interest_name"
                                    value={formData.interest_name}
                                    onChange={(e) => setFormData({ ...formData, interest_name: e.target.value })}
                                    className="w-full p-3 border dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                                >
                                    <option value="">All Interests</option>
                                    {interests.map((interest) => (
                                        <option key={interest.id} value={interest.interest_name}>
                                            {interest.interest_name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                                <select
                                    name="status"
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                    className="w-full p-3 border dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                                >
                                    <option value="Active">Active</option>
                                    <option value="Inactive">Inactive</option>
                                </select>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Variables (comma separated: name, phone, interest)</label>
                                <input
                                    type="text"
                                    name="variables"
                                    value={formData.variables}
                                    onChange={(e) => setFormData({ ...formData, variables: e.target.value })}
                                    className="w-full p-3 border dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                                    placeholder="e.g., name, phone, interest, location"
                                />
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Use {`{variable_name}`} in your message</p>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Message *</label>
                                <textarea
                                    name="message"
                                    value={formData.message}
                                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                    className="w-full p-3 border dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                                    rows="4"
                                    placeholder="Enter your template message... Use {name}, {phone}, etc."
                                    required
                                />
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                    {formData.message.length} characters
                                </p>
                            </div>
                        </div>
                        <div className="mt-4 flex gap-3">
                            <button
                                type="submit"
                                disabled={actionLoading}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition disabled:opacity-50"
                            >
                                {actionLoading ? 'Saving...' : editingId ? 'Update Template' : 'Create Template'}
                            </button>
                            <button
                                type="button"
                                onClick={resetForm}
                                className="bg-gray-300 dark:bg-slate-600 hover:bg-gray-400 dark:hover:bg-slate-500 px-6 py-2 rounded-lg transition dark:text-white"
                            >
                                Cancel
                            </button>
                            {!editingId && formData.message && (
                                <button
                                    type="button"
                                    onClick={() => handlePreview({ ...formData, template_name: formData.template_name || 'Preview' })}
                                    className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition"
                                >
                                    👁️ Preview
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            )}

            {/* Search and Filter */}
            <div className="flex flex-wrap gap-3 mb-4">
                <div className="flex-1 min-w-[200px]">
                    <input
                        type="text"
                        placeholder="🔍 Search templates..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full border border-gray-300 dark:border-slate-600 p-3 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:bg-slate-700 dark:text-white dark:placeholder-slate-400"
                    />
                </div>
                <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="border border-gray-300 dark:border-slate-600 p-3 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:bg-slate-700 dark:text-white"
                >
                    <option value="">All Categories</option>
                    {templateCategories.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                    ))}
                </select>
                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="border border-gray-300 dark:border-slate-600 p-3 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:bg-slate-700 dark:text-white"
                >
                    <option value="">All Status</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                </select>
                <button
                    onClick={loadTemplates}
                    className="bg-gray-200 dark:bg-slate-600 hover:bg-gray-300 dark:hover:bg-slate-700 px-4 py-3 rounded-lg transition dark:text-white"
                >
                    🔄 Refresh
                </button>
            </div>

            {/* Templates Grid */}
            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600 dark:text-gray-400">Loading templates...</p>
                    </div>
                </div>
            ) : filteredTemplates.length === 0 ? (
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-12 text-center border border-gray-200 dark:border-slate-700">
                    <p className="text-gray-500 dark:text-gray-400 text-lg">
                        {searchTerm || filterCategory || filterStatus ? 'No templates match your filters' : 'No templates created yet'}
                    </p>
                    <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
                        {searchTerm || filterCategory || filterStatus ? 'Try adjusting your search' : 'Click "+ New Template" to create one'}
                    </p>
                </div>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredTemplates.map((template) => (
                        <div
                            key={template.id}
                            className="bg-white dark:bg-slate-800 rounded-lg shadow-md border border-gray-200 dark:border-slate-700 hover:shadow-lg transition overflow-hidden"
                        >
                            <div className="p-4">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <h3 className="font-bold text-gray-800 dark:text-white">{template.template_name}</h3>
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${getCategoryColor(template.category)}`}>
                                            {template.category || 'General'}
                                        </span>
                                    </div>
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(template.status)} border`}>
                                        {template.status === 'Active' ? '🟢' : '🔴'} {template.status}
                                    </span>
                                </div>
                                {template.interest_name && (
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                        🎯 {template.interest_name}
                                    </p>
                                )}
                                {template.usage_count > 0 && (
                                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                        📊 Used {template.usage_count} times
                                    </p>
                                )}
                                <div className="mt-2 bg-gray-50 dark:bg-slate-700 rounded-lg p-2 border border-gray-100 dark:border-slate-600">
                                    <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3">
                                        {template.variables ? renderVariablesPreview(template.message, template.variables) : template.message}
                                    </p>
                                </div>
                                {template.variables && (
                                    <div className="mt-2 flex flex-wrap gap-1">
                                        {template.variables.split(',').slice(0, 3).map((v, i) => (
                                            <span key={i} className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded text-xs">
                                                {`{${v.trim()}}`}
                                            </span>
                                        ))}
                                        {template.variables.split(',').length > 3 && (
                                            <span className="text-xs text-gray-400 dark:text-gray-500">
                                                +{template.variables.split(',').length - 3} more
                                            </span>
                                        )}
                                    </div>
                                )}
                                <div className="mt-3 flex flex-wrap gap-1 pt-2 border-t border-gray-100 dark:border-slate-700">
                                    <button
                                        onClick={() => handlePreview(template)}
                                        className="bg-purple-500 hover:bg-purple-600 text-white px-2 py-1 rounded text-xs transition"
                                    >
                                        👁️ Preview
                                    </button>
                                    <button
                                        onClick={() => handleEdit(template)}
                                        className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs transition"
                                    >
                                        ✏️ Edit
                                    </button>
                                    <button
                                        onClick={() => handleDuplicate(template.id, template.template_name)}
                                        disabled={actionLoading}
                                        className="bg-cyan-500 hover:bg-cyan-600 text-white px-2 py-1 rounded text-xs transition disabled:opacity-50"
                                    >
                                        📋 Duplicate
                                    </button>
                                    <button
                                        onClick={() => handleDelete(template.id, template.template_name)}
                                        disabled={actionLoading}
                                        className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs transition disabled:opacity-50"
                                    >
                                        🗑️ Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default TemplatesPage;
