import { useEffect, useState } from "react";
import { getCampaigns, createCampaign, updateCampaign, deleteCampaign, sendCampaign } from "../services/campaignService";
import { getInterests } from "../services/interestService";
import { createActivity } from "../services/activityService";

function CampaignsPage() {
    const [campaigns, setCampaigns] = useState([]);
    const [interests, setInterests] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ text: "", type: "" });
    const [showForm, setShowForm] = useState(false);
    const [selectedInterests, setSelectedInterests] = useState([]);
    const [formData, setFormData] = useState({
        campaign_name: "",
        message: "",
        target_groups: "Daily Reach",
        status: "Draft",
    });

    useEffect(() => {
        loadCampaigns();
        loadInterests();
    }, []);

    const loadCampaigns = async () => {
        setLoading(true);
        try {
            const data = await getCampaigns();
            setCampaigns(data);
        } catch (error) {
            console.error("Campaign Error:", error);
            showMessage("Failed to load campaigns", "error");
        } finally {
            setLoading(false);
        }
    };

    const loadInterests = async () => {
        try {
            const data = await getInterests();
            setInterests(data);
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
    };

    const removeInterest = (interest) => {
        setSelectedInterests(selectedInterests.filter((i) => i !== interest));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.campaign_name || !formData.message) {
            showMessage("Please fill in all required fields", "error");
            return;
        }

        setLoading(true);
        try {
            const user = JSON.parse(localStorage.getItem('user'));
            const campaignData = {
                ...formData,
                target_interests: selectedInterests.join(", "),
            };

            if (editingId) {
                await updateCampaign(editingId, campaignData);
                await createActivity({
                    user_id: user.id,
                    username: user.username,
                    activity: `Updated Campaign: ${formData.campaign_name}`
                });
                showMessage("Campaign updated successfully!", "success");
            } else {
                await createCampaign(campaignData);
                await createActivity({
                    user_id: user.id,
                    username: user.username,
                    activity: `Created Campaign: ${formData.campaign_name}`
                });
                showMessage("Campaign created successfully!", "success");
            }

            resetForm();
            loadCampaigns();
        } catch (error) {
            console.error(error);
            showMessage("Failed to save campaign", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleSend = async (id, name) => {
        if (!window.confirm(`Send campaign "${name}"?`)) return;

        setLoading(true);
        try {
            const result = await sendCampaign(id);
            showMessage(`Campaign sent to ${result.total_recipients} customers!`, "success");
            loadCampaigns();
        } catch (error) {
            console.error(error);
            showMessage("Failed to send campaign", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id, name) => {
        if (!window.confirm(`Delete campaign "${name}"?`)) return;

        try {
            await deleteCampaign(id);
            const user = JSON.parse(localStorage.getItem('user'));
            await createActivity({
                user_id: user.id,
                username: user.username,
                activity: `Deleted Campaign: ${name}`
            });
            showMessage("Campaign deleted!", "success");
            loadCampaigns();
        } catch (error) {
            console.error(error);
            showMessage("Failed to delete campaign", "error");
        }
    };

    const handleEdit = (campaign) => {
        setEditingId(campaign.id);
        setFormData({
            campaign_name: campaign.campaign_name,
            message: campaign.message || "",
            target_groups: campaign.target_groups || "Daily Reach",
            status: campaign.status || "Draft",
        });
        setSelectedInterests(campaign.target_interests ? campaign.target_interests.split(", ") : []);
        setShowForm(true);
    };

    const resetForm = () => {
        setEditingId(null);
        setFormData({
            campaign_name: "",
            message: "",
            target_groups: "Daily Reach",
            status: "Draft",
        });
        setSelectedInterests([]);
        setShowForm(false);
    };

    const getStatusColor = (status) => {
        switch(status) {
            case 'Sent': return 'bg-green-100 text-green-700';
            case 'Active': return 'bg-blue-100 text-blue-700';
            case 'Draft': return 'bg-gray-100 text-gray-700';
            default: return 'bg-gray-100 text-gray-600';
        }
    };

    return (
        <div className="space-y-6 p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">📢 Campaigns</h1>
                    <p className="text-gray-500">Create and manage marketing campaigns</p>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="bg-yellow-400 hover:bg-yellow-500 px-5 py-2 rounded-xl font-semibold transition"
                >
                    {showForm ? "✕ Cancel" : "+ New Campaign"}
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

            {/* Campaign Form */}
            {showForm && (
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                    <h2 className="text-xl font-semibold mb-4">
                        {editingId ? "✏️ Edit Campaign" : "📝 Create Campaign"}
                    </h2>
                    <form onSubmit={handleSubmit}>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Campaign Name *</label>
                                <input
                                    type="text"
                                    value={formData.campaign_name}
                                    onChange={(e) => setFormData({...formData, campaign_name: e.target.value})}
                                    className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-yellow-400 outline-none"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Target Group</label>
                                <select
                                    value={formData.target_groups}
                                    onChange={(e) => setFormData({...formData, target_groups: e.target.value})}
                                    className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-yellow-400 outline-none"
                                >
                                    <option value="Daily Reach">Daily Reach</option>
                                    <option value="Do Not Reach">Do Not Reach</option>
                                    <option value="Unsubscribed">Unsubscribed</option>
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
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Target Interests</label>
                                <div className="flex gap-2">
                                    <select
                                        onChange={handleInterestChange}
                                        className="flex-1 border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-yellow-400 outline-none"
                                    >
                                        <option value="">Select Interest</option>
                                        {interests.map((interest) => (
                                            <option key={interest.id} value={interest.interest_name}>
                                                {interest.interest_name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {selectedInterests.map((interest) => (
                                        <div key={interest} className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full flex items-center gap-2 text-sm">
                                            {interest}
                                            <button
                                                type="button"
                                                onClick={() => removeInterest(interest)}
                                                className="hover:text-red-600"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                                    className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-yellow-400 outline-none"
                                >
                                    <option value="Draft">Draft</option>
                                    <option value="Active">Active</option>
                                </select>
                            </div>
                        </div>
                        <div className="mt-4 flex gap-3">
                            <button
                                type="submit"
                                disabled={loading}
                                className="bg-yellow-400 hover:bg-yellow-500 px-6 py-3 rounded-xl font-semibold transition disabled:opacity-50"
                            >
                                {loading ? "Saving..." : editingId ? "Update Campaign" : "Create Campaign"}
                            </button>
                            <button
                                type="button"
                                onClick={resetForm}
                                className="bg-gray-300 hover:bg-gray-400 px-6 py-3 rounded-xl font-semibold transition"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Campaigns Table */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gradient-to-r from-gray-800 to-gray-900 text-white">
                                <th className="p-3 text-left text-sm font-medium">#</th>
                                <th className="p-3 text-left text-sm font-medium">Campaign</th>
                                <th className="p-3 text-left text-sm font-medium">Target Group</th>
                                <th className="p-3 text-left text-sm font-medium">Interests</th>
                                <th className="p-3 text-left text-sm font-medium">Recipients</th>
                                <th className="p-3 text-left text-sm font-medium">Status</th>
                                <th className="p-3 text-center text-sm font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="p-8 text-center text-gray-500">Loading...</td>
                                </tr>
                            ) : campaigns.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="p-8 text-center text-gray-500">No campaigns found</td>
                                </tr>
                            ) : (
                                campaigns.map((campaign, index) => (
                                    <tr key={campaign.id} className="border-b hover:bg-gray-50 transition">
                                        <td className="p-3 text-gray-500">{index + 1}</td>
                                        <td className="p-3 font-medium text-gray-800">{campaign.campaign_name}</td>
                                        <td className="p-3 text-gray-600">{campaign.target_groups || '-'}</td>
                                        <td className="p-3 text-gray-600 max-w-xs truncate">
                                            {campaign.target_interests || 'All'}
                                        </td>
                                        <td className="p-3 font-bold text-gray-700">{campaign.total_recipients || 0}</td>
                                        <td className="p-3">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(campaign.status)}`}>
                                                {campaign.status || 'Draft'}
                                            </span>
                                        </td>
                                        <td className="p-3 text-center">
                                            <div className="flex gap-2 justify-center">
                                                {campaign.status !== 'Sent' && (
                                                    <button
                                                        onClick={() => handleSend(campaign.id, campaign.campaign_name)}
                                                        className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-lg text-sm transition"
                                                    >
                                                        📤 Send
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleEdit(campaign)}
                                                    className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-lg text-sm transition"
                                                >
                                                    ✏️
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(campaign.id, campaign.campaign_name)}
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

export default CampaignsPage;
