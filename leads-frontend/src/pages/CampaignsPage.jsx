import { useEffect, useState } from "react";
import { getCampaigns, createCampaign, updateCampaign, deleteCampaign, sendCampaign, duplicateCampaign, getCampaignAnalytics } from "../services/campaignService";
import { getTemplates } from "../services/templateService";
import { getInterests } from "../services/interestService";
import { createActivity } from "../services/activityService";

function CampaignsPage() {
    const [campaigns, setCampaigns] = useState([]);
    const [templates, setTemplates] = useState([]);
    const [interests, setInterests] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [message, setMessage] = useState({ text: "", type: "" });
    const [showForm, setShowForm] = useState(false);
    const [selectedInterests, setSelectedInterests] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState("");
    const [showAnalytics, setShowAnalytics] = useState(false);
    const [analyticsData, setAnalyticsData] = useState(null);
    const [audienceCount, setAudienceCount] = useState(null);
    const [isLoadingAudience, setIsLoadingAudience] = useState(false);
    
    const [formData, setFormData] = useState({
        campaign_name: "",
        message: "",
        template_id: "",
        target_groups: "Daily Reach",
        status: "Draft",
        scheduled_at: "",
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
        draft: 0,
        active: 0,
        completed: 0,
        sent: 0
    });

    useEffect(() => {
        loadCampaigns();
        loadTemplates();
        loadInterests();
    }, []);

    useEffect(() => {
        calculateStats();
    }, [campaigns]);

    const calculateStats = () => {
        const total = campaigns.length;
        const draft = campaigns.filter(c => c.status === 'Draft').length;
        const active = campaigns.filter(c => c.status === 'Active').length;
        const completed = campaigns.filter(c => c.status === 'Completed').length;
        const sent = campaigns.filter(c => c.status === 'Sent').length;
        setStats({ total, draft, active, completed, sent });
    };

    const loadCampaigns = async () => {
        setLoading(true);
        try {
            const data = await getCampaigns();
            setCampaigns(data || []);
        } catch (error) {
            console.error("Campaign Error:", error);
            showMessage("Failed to load campaigns", "error");
        } finally {
            setLoading(false);
        }
    };

    const loadTemplates = async () => {
        try {
            const data = await getTemplates();
            setTemplates(data || []);
        } catch (error) {
            console.error("Template Error:", error);
        }
    };

    const loadInterests = async () => {
        try {
            const data = await getInterests();
            setInterests(data || []);
        } catch (error) {
            console.error("Interest Error:", error);
        }
    };

    const showMessage = (text, type = "success") => {
        setMessage({ text, type });
        setTimeout(() => setMessage({ text: "", type: "" }), 3000);
    };

    const handleInterestChange = (e) => {
        const value = e.target.value;
        if (!value || selectedInterests.includes(value)) return;
        setSelectedInterests([...selectedInterests, value]);
        e.target.value = "";
    };

    const removeInterest = (interest) => {
        setSelectedInterests(selectedInterests.filter((i) => i !== interest));
    };

    const handleTemplateSelect = (e) => {
        const templateId = e.target.value;
        setFormData({ ...formData, template_id: templateId });
        if (templateId) {
            const template = templates.find(t => t.id === parseInt(templateId));
            if (template) {
                setFormData(prev => ({ ...prev, message: template.message }));
            }
        }
    };

    const handleAudiencePreview = async () => {
        if (!editingId) {
            showMessage("Please save the campaign first", "error");
            return;
        }
        setIsLoadingAudience(true);
        try {
            const response = await fetch(`/api/campaigns/${editingId}/audience-preview`, { method: 'POST' });
            const data = await response.json();
            setAudienceCount(data);
        } catch (error) {
            console.error('Error fetching audience preview:', error);
            showMessage("Failed to get audience preview", "error");
        } finally {
            setIsLoadingAudience(false);
        }
    };

    const handleViewAnalytics = async (id) => {
        setLoading(true);
        try {
            const data = await getCampaignAnalytics(id);
            setAnalyticsData(data);
            setShowAnalytics(true);
        } catch (error) {
            console.error('Error fetching analytics:', error);
            showMessage("Failed to load analytics", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.campaign_name || !formData.message) {
            showMessage("Please fill in all required fields", "error");
            return;
        }

        setActionLoading(true);
        try {
            const user = JSON.parse(localStorage.getItem('user'));
            const campaignData = {
                ...formData,
                target_interests: selectedInterests.join(", "),
            };

            if (editingId) {
                await updateCampaign(editingId, campaignData);
                await createActivity({
                    user_id: user?.id || 1,
                    username: user?.username || 'admin',
                    activity: `Updated Campaign: ${formData.campaign_name}`
                });
                showMessage("✅ Campaign updated successfully!", "success");
            } else {
                await createCampaign(campaignData);
                await createActivity({
                    user_id: user?.id || 1,
                    username: user?.username || 'admin',
                    activity: `Created Campaign: ${formData.campaign_name}`
                });
                showMessage("✅ Campaign created successfully!", "success");
            }

            resetForm();
            loadCampaigns();
        } catch (error) {
            console.error(error);
            showMessage("Failed to save campaign", "error");
        } finally {
            setActionLoading(false);
        }
    };

    const handleSend = async (id, name) => {
        if (!window.confirm(`Send campaign "${name}" now?`)) return;

        setActionLoading(true);
        try {
            await sendCampaign(id);
            const user = JSON.parse(localStorage.getItem('user'));
            await createActivity({
                user_id: user?.id || 1,
                username: user?.username || 'admin',
                activity: `Sent Campaign: ${name}`
            });
            showMessage(`✅ Campaign "${name}" sent successfully!`, "success");
            loadCampaigns();
        } catch (error) {
            console.error(error);
            showMessage("Failed to send campaign", "error");
        } finally {
            setActionLoading(false);
        }
    };

    const handleEdit = (campaign) => {
        setEditingId(campaign.id);
        setFormData({
            campaign_name: campaign.campaign_name,
            message: campaign.message,
            template_id: campaign.template_id || "",
            target_groups: campaign.target_groups || "Daily Reach",
            status: campaign.status || "Draft",
            scheduled_at: campaign.scheduled_at || "",
        });
        setSelectedInterests(campaign.target_interests ? campaign.target_interests.split(", ").filter(Boolean) : []);
        setShowForm(true);
    };

    const handleDuplicate = async (id, name) => {
        if (!window.confirm(`Duplicate campaign "${name}"?`)) return;
        setActionLoading(true);
        try {
            await duplicateCampaign(id);
            const user = JSON.parse(localStorage.getItem('user'));
            await createActivity({
                user_id: user?.id || 1,
                username: user?.username || 'admin',
                activity: `Duplicated Campaign: ${name}`
            });
            showMessage(`✅ Campaign "${name}" duplicated!`, "success");
            loadCampaigns();
        } catch (error) {
            console.error(error);
            showMessage("Failed to duplicate campaign", "error");
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async (id, name) => {
        if (!window.confirm(`Delete campaign "${name}"?`)) return;
        setActionLoading(true);
        try {
            await deleteCampaign(id);
            const user = JSON.parse(localStorage.getItem('user'));
            await createActivity({
                user_id: user?.id || 1,
                username: user?.username || 'admin',
                activity: `Deleted Campaign: ${name}`
            });
            showMessage(`🗑️ Campaign "${name}" deleted!`, "success");
            loadCampaigns();
        } catch (error) {
            console.error(error);
            showMessage("Failed to delete campaign", "error");
        } finally {
            setActionLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            campaign_name: "",
            message: "",
            template_id: "",
            target_groups: "Daily Reach",
            status: "Draft",
            scheduled_at: "",
        });
        setSelectedInterests([]);
        setEditingId(null);
        setShowForm(false);
        setAudienceCount(null);
    };

    const exportCampaigns = () => {
        if (filteredCampaigns.length === 0) {
            showMessage("No campaigns to export", "error");
            return;
        }

        const headers = ['#', 'Campaign Name', 'Target Group', 'Interests', 'Status', 'Total Recipients', 'Sent', 'Opened', 'Responded', 'Converted', 'Created At'];
        const rows = filteredCampaigns.map((campaign, index) => [
            index + 1,
            campaign.campaign_name || 'N/A',
            campaign.target_groups || 'Daily Reach',
            campaign.target_interests || 'All',
            campaign.status || 'Draft',
            campaign.total_recipients || 0,
            campaign.sent_count || 0,
            campaign.opened_count || 0,
            campaign.responded_count || 0,
            campaign.converted_count || 0,
            new Date(campaign.created_at).toLocaleDateString('en-IN')
        ]);

        let csv = headers.join(',') + '\n';
        rows.forEach(row => {
            csv += row.join(',') + '\n';
        });

        csv += '\n\n📊 SUMMARY\n';
        csv += `Total Campaigns,${filteredCampaigns.length}\n`;
        csv += `Draft,${filteredCampaigns.filter(c => c.status === 'Draft').length}\n`;
        csv += `Active,${filteredCampaigns.filter(c => c.status === 'Active').length}\n`;
        csv += `Sent,${filteredCampaigns.filter(c => c.status === 'Sent').length}\n`;
        csv += `Completed,${filteredCampaigns.filter(c => c.status === 'Completed').length}\n`;
        csv += `Exported On,${new Date().toLocaleString()}\n`;

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `campaigns_export_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        showMessage(`📥 Exported ${filteredCampaigns.length} campaigns`, "success");
    };

    const getStatusColor = (status) => {
        switch(status) {
            case 'Draft': return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600';
            case 'Active': return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700';
            case 'Sent': return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700';
            case 'Completed': return 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-700';
            default: return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
        }
    };

    const getStatusIcon = (status) => {
        switch(status) {
            case 'Draft': return '📝';
            case 'Active': return '🟢';
            case 'Sent': return '📤';
            case 'Completed': return '✅';
            default: return '📝';
        }
    };

    const filteredCampaigns = campaigns.filter(campaign => {
        const matchesSearch = campaign.campaign_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             campaign.message?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === "" || campaign.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    return (
        <div className={`p-6 max-w-7xl mx-auto ${isDarkMode ? 'dark' : ''}`}>
            {message.text && (
                <div className={`p-4 rounded-xl mb-4 ${message.type === 'error' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-700' : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-700'}`}>
                    {message.text}
                </div>
            )}

            {/* Analytics Modal */}
            {showAnalytics && analyticsData && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowAnalytics(false)}>
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-2xl w-full p-6" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-gray-800 dark:text-white">📊 Campaign Analytics</h2>
                            <button onClick={() => setShowAnalytics(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                                ✕
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Campaign</p>
                                <p className="font-medium dark:text-white">{analyticsData.campaign?.campaign_name}</p>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-center">
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
                                    <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{analyticsData.analytics?.total || 0}</p>
                                </div>
                                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-center">
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Sent</p>
                                    <p className="text-xl font-bold text-green-600 dark:text-green-400">{analyticsData.analytics?.sent || 0}</p>
                                </div>
                                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 text-center">
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Opened</p>
                                    <p className="text-xl font-bold text-purple-600 dark:text-purple-400">{analyticsData.analytics?.opened || 0}</p>
                                </div>
                                <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3 text-center">
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Responded</p>
                                    <p className="text-xl font-bold text-yellow-600 dark:text-yellow-400">{analyticsData.analytics?.responded || 0}</p>
                                </div>
                                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 text-center">
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Converted</p>
                                    <p className="text-xl font-bold text-red-600 dark:text-red-400">{analyticsData.analytics?.converted || 0}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-3">
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Open Rate</p>
                                    <p className="text-lg font-bold dark:text-white">
                                        {analyticsData.analytics?.sent > 0 ? Math.round((analyticsData.analytics.opened / analyticsData.analytics.sent) * 100) : 0}%
                                    </p>
                                </div>
                                <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-3">
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Response Rate</p>
                                    <p className="text-lg font-bold dark:text-white">
                                        {analyticsData.analytics?.sent > 0 ? Math.round((analyticsData.analytics.responded / analyticsData.analytics.sent) * 100) : 0}%
                                    </p>
                                </div>
                            </div>
                            <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-3">
                                <p className="text-xs text-gray-500 dark:text-gray-400">Conversion Rate</p>
                                <p className="text-lg font-bold dark:text-white">
                                    {analyticsData.analytics?.sent > 0 ? Math.round((analyticsData.analytics.converted / analyticsData.analytics.sent) * 100) : 0}%
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Stats Dashboard */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 border-l-4 border-blue-500">
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Total Campaigns</p>
                    <p className="text-2xl font-bold dark:text-white">{stats.total}</p>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 border-l-4 border-gray-500">
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Draft</p>
                    <p className="text-2xl font-bold text-gray-600 dark:text-gray-400">{stats.draft}</p>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 border-l-4 border-green-500">
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Active</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.active}</p>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 border-l-4 border-blue-500">
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Sent</p>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.sent}</p>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 border-l-4 border-purple-500">
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Completed</p>
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.completed}</p>
                </div>
            </div>

            {/* Header */}
            <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-white">📢 Campaigns</h1>
                    <p className="text-gray-500 dark:text-gray-400">Create and manage marketing campaigns</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={exportCampaigns}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition text-sm"
                    >
                        📥 Export
                    </button>
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
                    >
                        {showForm ? '✕ Cancel' : '+ New Campaign'}
                    </button>
                </div>
            </div>

            {/* Create/Edit Form */}
            {showForm && (
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 mb-6 border border-gray-200 dark:border-slate-700">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
                        {editingId ? '✏️ Edit Campaign' : '📝 Create New Campaign'}
                    </h2>
                    <form onSubmit={handleSubmit}>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Campaign Name *</label>
                                <input
                                    type="text"
                                    name="campaign_name"
                                    value={formData.campaign_name}
                                    onChange={(e) => setFormData({ ...formData, campaign_name: e.target.value })}
                                    className="w-full p-3 border dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                                    placeholder="Enter campaign name"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Template</label>
                                <select
                                    name="template_id"
                                    value={formData.template_id}
                                    onChange={handleTemplateSelect}
                                    className="w-full p-3 border dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                                >
                                    <option value="">Select a template...</option>
                                    {templates.filter(t => t.status === 'Active').map((template) => (
                                        <option key={template.id} value={template.id}>
                                            {template.template_name}
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
                                    <option value="Draft">Draft</option>
                                    <option value="Active">Active</option>
                                    <option value="Sent">Sent</option>
                                    <option value="Completed">Completed</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Target Group</label>
                                <select
                                    name="target_groups"
                                    value={formData.target_groups}
                                    onChange={(e) => setFormData({ ...formData, target_groups: e.target.value })}
                                    className="w-full p-3 border dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                                >
                                    <option value="Daily Reach">Daily Reach</option>
                                    <option value="Do Not Reach">Do Not Reach</option>
                                    <option value="All">All Customers</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Schedule (Optional)</label>
                                <input
                                    type="datetime-local"
                                    name="scheduled_at"
                                    value={formData.scheduled_at}
                                    onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })}
                                    className="w-full p-3 border dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Message *</label>
                                <textarea
                                    name="message"
                                    value={formData.message}
                                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                    className="w-full p-3 border dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                                    rows="4"
                                    placeholder="Enter your campaign message..."
                                    required
                                />
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                    {formData.message.length} characters
                                </p>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Target Interests</label>
                                <div className="flex gap-2 mb-2">
                                    <select
                                        onChange={handleInterestChange}
                                        className="flex-1 p-3 border dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                                        value=""
                                    >
                                        <option value="">Select an interest...</option>
                                        {interests
                                            .filter(i => !selectedInterests.includes(i.interest_name))
                                            .map((interest) => (
                                                <option key={interest.id} value={interest.interest_name}>
                                                    {interest.interest_name}
                                                </option>
                                            ))}
                                    </select>
                                    {editingId && (
                                        <button
                                            type="button"
                                            onClick={handleAudiencePreview}
                                            disabled={isLoadingAudience}
                                            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition disabled:opacity-50"
                                        >
                                            {isLoadingAudience ? 'Loading...' : '👁️ Preview Audience'}
                                        </button>
                                    )}
                                </div>
                                {selectedInterests.length > 0 && (
                                    <div className="flex flex-wrap gap-2 p-2 bg-gray-50 dark:bg-slate-700 rounded-lg border dark:border-slate-600">
                                        {selectedInterests.map((interest) => (
                                            <span
                                                key={interest}
                                                className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-3 py-1 rounded-full text-sm flex items-center gap-2"
                                            >
                                                {interest}
                                                <button
                                                    type="button"
                                                    onClick={() => removeInterest(interest)}
                                                    className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                                                >
                                                    ✕
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                )}
                                {audienceCount && (
                                    <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700">
                                        <p className="text-sm text-green-700 dark:text-green-400">
                                            🎯 This campaign will reach <strong>{audienceCount.total}</strong> customers
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="mt-4 flex gap-3">
                            <button
                                type="submit"
                                disabled={actionLoading}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition disabled:opacity-50"
                            >
                                {actionLoading ? 'Saving...' : editingId ? 'Update Campaign' : 'Create Campaign'}
                            </button>
                            <button
                                type="button"
                                onClick={resetForm}
                                className="bg-gray-300 dark:bg-slate-600 hover:bg-gray-400 dark:hover:bg-slate-500 px-6 py-2 rounded-lg transition dark:text-white"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Search and Filter */}
            <div className="flex flex-wrap gap-3 mb-4">
                <div className="flex-1 min-w-[200px]">
                    <input
                        type="text"
                        placeholder="🔍 Search campaigns..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full border border-gray-300 dark:border-slate-600 p-3 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:bg-slate-700 dark:text-white dark:placeholder-slate-400"
                    />
                </div>
                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="border border-gray-300 dark:border-slate-600 p-3 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:bg-slate-700 dark:text-white"
                >
                    <option value="">All Status</option>
                    <option value="Draft">Draft</option>
                    <option value="Active">Active</option>
                    <option value="Sent">Sent</option>
                    <option value="Completed">Completed</option>
                </select>
                <button
                    onClick={loadCampaigns}
                    className="bg-gray-200 dark:bg-slate-600 hover:bg-gray-300 dark:hover:bg-slate-700 px-4 py-3 rounded-lg transition dark:text-white"
                >
                    🔄 Refresh
                </button>
            </div>

            {/* Campaigns Grid */}
            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600 dark:text-gray-400">Loading campaigns...</p>
                    </div>
                </div>
            ) : filteredCampaigns.length === 0 ? (
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-12 text-center border border-gray-200 dark:border-slate-700">
                    <p className="text-gray-500 dark:text-gray-400 text-lg">
                        {searchTerm || filterStatus ? 'No campaigns match your filters' : 'No campaigns created yet'}
                    </p>
                    <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
                        {searchTerm || filterStatus ? 'Try adjusting your search' : 'Click "+ New Campaign" to create one'}
                    </p>
                </div>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredCampaigns.map((campaign) => (
                        <div
                            key={campaign.id}
                            className="bg-white dark:bg-slate-800 rounded-lg shadow-md border border-gray-200 dark:border-slate-700 hover:shadow-lg transition overflow-hidden"
                        >
                            <div className="p-4">
                                <div className="flex justify-between items-start">
                                    <h3 className="font-bold text-gray-800 dark:text-white flex-1">{campaign.campaign_name}</h3>
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(campaign.status)} border`}>
                                        {getStatusIcon(campaign.status)} {campaign.status}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    🎯 {campaign.target_groups || 'Daily Reach'}
                                </p>
                                <div className="mt-2 bg-gray-50 dark:bg-slate-700 rounded-lg p-2 border border-gray-100 dark:border-slate-600">
                                    <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                                        {campaign.message}
                                    </p>
                                </div>
                                {campaign.target_interests && (
                                    <div className="mt-2 flex flex-wrap gap-1">
                                        {campaign.target_interests.split(", ").slice(0, 3).map((interest, i) => (
                                            <span key={i} className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded text-xs">
                                                {interest}
                                            </span>
                                        ))}
                                        {campaign.target_interests.split(", ").length > 3 && (
                                            <span className="text-xs text-gray-400 dark:text-gray-500">
                                                +{campaign.target_interests.split(", ").length - 3} more
                                            </span>
                                        )}
                                    </div>
                                )}
                                {campaign.scheduled_at && (
                                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                        📅 Scheduled: {new Date(campaign.scheduled_at).toLocaleString()}
                                    </p>
                                )}
                                {(campaign.sent_count > 0 || campaign.opened_count > 0) && (
                                    <div className="mt-2 flex gap-2 text-xs">
                                        <span className="text-gray-500 dark:text-gray-400">📤 {campaign.sent_count || 0}</span>
                                        <span className="text-gray-500 dark:text-gray-400">👁️ {campaign.opened_count || 0}</span>
                                        <span className="text-gray-500 dark:text-gray-400">💬 {campaign.responded_count || 0}</span>
                                        <span className="text-gray-500 dark:text-gray-400">✅ {campaign.converted_count || 0}</span>
                                    </div>
                                )}
                                <div className="mt-3 flex flex-wrap gap-1 pt-2 border-t border-gray-100 dark:border-slate-700">
                                    <button
                                        onClick={() => handleViewAnalytics(campaign.id)}
                                        className="bg-purple-500 hover:bg-purple-600 text-white px-2 py-1 rounded text-xs transition"
                                    >
                                        📊 Analytics
                                    </button>
                                    <button
                                        onClick={() => handleEdit(campaign)}
                                        className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs transition"
                                    >
                                        ✏️ Edit
                                    </button>
                                    {campaign.status !== 'Sent' && campaign.status !== 'Completed' && (
                                        <button
                                            onClick={() => handleSend(campaign.id, campaign.campaign_name)}
                                            disabled={actionLoading}
                                            className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded text-xs transition disabled:opacity-50"
                                        >
                                            📤 Send
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleDuplicate(campaign.id, campaign.campaign_name)}
                                        disabled={actionLoading}
                                        className="bg-cyan-500 hover:bg-cyan-600 text-white px-2 py-1 rounded text-xs transition disabled:opacity-50"
                                    >
                                        📋 Duplicate
                                    </button>
                                    <button
                                        onClick={() => handleDelete(campaign.id, campaign.campaign_name)}
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

export default CampaignsPage;
