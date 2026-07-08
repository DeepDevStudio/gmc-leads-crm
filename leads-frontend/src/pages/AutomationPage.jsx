import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { getTemplates } from '../services/templateService';
import { getInterests } from '../services/interestService';

const AutomationPage = () => {
    // ===== DARK MODE =====
    const [isDarkMode, setIsDarkMode] = useState(() => {
        const saved = localStorage.getItem('automationDarkMode');
        return saved ? JSON.parse(saved) : false;
    });

    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('automationDarkMode', JSON.stringify(isDarkMode));
    }, [isDarkMode]);

    // ===== STATE =====
    const [rules, setRules] = useState([]);
    const [logs, setLogs] = useState([]);
    const [templates, setTemplates] = useState([]);
    const [interests, setInterests] = useState([]);
    const [yatras, setYatras] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showRuleForm, setShowRuleForm] = useState(false);
    const [editingRule, setEditingRule] = useState(null);
    const [message, setMessage] = useState({ text: "", type: "" });
    const [filterCategory, setFilterCategory] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [executingRule, setExecutingRule] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

    // ===== STATS =====
    const [stats, setStats] = useState({
        totalRules: 0,
        activeRules: 0,
        totalExecutions: 0,
        totalSent: 0
    });

    // ===== MEMBERS =====
    const members = ['Member 1', 'Member 2', 'Member 3', 'Member 4'];

    // ===== FORM STATE =====
    const [formData, setFormData] = useState({
        rule_name: '',
        category: 'general',
        trigger_type: 'manual',
        schedule_time: '',
        schedule_cron: '',
        delay_days: 0,
        target_group: 'Daily Reach',
        target_interest: '',
        target_yatra: '',
        template_id: '',
        custom_message: '',
        status: 'Active',
        auto_start: false,
        batch_size: 5,
        pause_minutes: 60,
        member_name: 'All Members',
        rest_minutes: 60,
        extra_rest_after: 10,
        extra_rest_minutes: 30,
        daily_limit: 250,
        distribution_type: 'balanced',
        send_strategy: 'round_robin',
        members: 'Member 1,Member 2,Member 3,Member 4',
        exclusions: []
    });

    // ===== CATEGORY OPTIONS =====
    const categoriesList = [
        { value: 'general', label: '📌 General' },
        { value: 'welcome', label: '👋 Welcome' },
        { value: 'followup', label: '🔄 Follow-up' },
        { value: 'booking', label: '📋 Booking' },
        { value: 'feedback', label: '💬 Feedback' },
        { value: 'reengagement', label: '🔄 Re-engagement' },
        { value: 'promotional', label: '📢 Promotional' },
        { value: 'reminder', label: '⏰ Reminder' }
    ];

    const triggerTypes = [
        { value: 'manual', label: '🖐️ Manual' },
        { value: 'scheduled', label: '📅 Scheduled' },
        { value: 'event', label: '⚡ Event Based' }
    ];

    const targetGroups = [
        'Daily Reach',
        'Do Not Reach',
        'Unsubscribed',
        'All'
    ];

    const distributionTypes = [
        { value: 'balanced', label: '⚖️ Balanced (Equal Split)' },
        { value: 'round_robin', label: '🔄 Round Robin (One by One)' },
        { value: 'priority', label: '⭐ Priority (Member 1 First)' }
    ];

    const sendStrategies = [
        { value: 'round_robin', label: '🔄 Round Robin - Member 1 → 2 → 3 → 4' },
        { value: 'simultaneous', label: '⚡ Simultaneous - All Members Together' }
    ];

    // ===== EFFECTS =====
    useEffect(() => {
        loadAllData();
    }, []);

    useEffect(() => {
        if (filterCategory !== 'all' || filterStatus !== 'all') {
            loadRules();
        }
    }, [filterCategory, filterStatus]);

    // ===== LOAD DATA =====
    const loadAllData = async () => {
        setLoading(true);
        try {
            await Promise.all([
                loadRules(),
                loadLogs(),
                loadTemplates(),
                loadInterests(),
                loadYatras(),
                loadStats()
            ]);
        } catch (error) {
            console.error('Error loading data:', error);
            showMessage('Failed to load data', 'error');
        } finally {
            setLoading(false);
        }
    };

    const loadRules = async () => {
        try {
            const params = new URLSearchParams();
            if (filterCategory !== 'all') params.append('category', filterCategory);
            if (filterStatus !== 'all') params.append('status', filterStatus);
            
            const response = await api.get(`/automation/rules?${params.toString()}`);
            setRules(response.data || []);
        } catch (error) {
            console.error('Error loading rules:', error);
            setRules([]);
        }
    };

    const loadLogs = async () => {
        try {
            const response = await api.get('/automation/logs?limit=50');
            setLogs(response.data || []);
        } catch (error) {
            console.error('Error loading logs:', error);
            setLogs([]);
        }
    };

    const loadTemplates = async () => {
        try {
            const data = await getTemplates();
            setTemplates(data || []);
        } catch (error) {
            console.error('Error loading templates:', error);
            setTemplates([]);
        }
    };

    const loadInterests = async () => {
        try {
            const data = await getInterests();
            setInterests(data || []);
        } catch (error) {
            console.error('Error loading interests:', error);
            setInterests([]);
        }
    };

    const loadYatras = async () => {
        try {
            const response = await api.get('/yatras');
            setYatras(response.data || []);
        } catch (error) {
            console.error('Error loading yatras:', error);
            setYatras([]);
        }
    };

    const loadStats = async () => {
        try {
            const response = await api.get('/automation/stats');
            setStats(response.data || {});
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    };

    // ===== CRUD OPERATIONS =====
    const handleCreateRule = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = {
                ...formData,
                auto_start: formData.auto_start ? 1 : 0
            };
            
            const response = await api.post('/automation/rules', payload);
            showMessage('✅ Rule created successfully!', 'success');
            setShowRuleForm(false);
            resetForm();
            await loadAllData();
        } catch (error) {
            console.error('Error creating rule:', error);
            showMessage('❌ Failed to create rule: ' + (error.response?.data?.error || error.message), 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateRule = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = {
                ...formData,
                auto_start: formData.auto_start ? 1 : 0
            };
            
            await api.put(`/automation/rules/${editingRule.id}`, payload);
            showMessage('✅ Rule updated successfully!', 'success');
            setShowRuleForm(false);
            setEditingRule(null);
            resetForm();
            await loadAllData();
        } catch (error) {
            console.error('Error updating rule:', error);
            showMessage('❌ Failed to update rule: ' + (error.response?.data?.error || error.message), 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteRule = async (id) => {
        if (!window.confirm(`Delete rule? This cannot be undone.`)) return;
        
        try {
            await api.delete(`/automation/rules/${id}`);
            showMessage('🗑️ Rule deleted!', 'success');
            setShowDeleteConfirm(null);
            await loadAllData();
        } catch (error) {
            console.error('Error deleting rule:', error);
            showMessage('❌ Failed to delete rule', 'error');
        }
    };

    const handleEditRule = (rule) => {
        setEditingRule(rule);
        setFormData({
            rule_name: rule.rule_name || '',
            category: rule.category || 'general',
            trigger_type: rule.trigger_type || 'manual',
            schedule_time: rule.schedule_time || '',
            schedule_cron: rule.schedule_cron || '',
            delay_days: rule.delay_days || 0,
            target_group: rule.target_group || 'Daily Reach',
            target_interest: rule.target_interest || '',
            target_yatra: rule.target_yatra || '',
            template_id: rule.template_id ? String(rule.template_id) : '',
            custom_message: rule.custom_message || '',
            status: rule.status || 'Active',
            auto_start: rule.auto_start === 1,
            batch_size: rule.batch_size || 5,
            pause_minutes: rule.pause_minutes || 60,
            member_name: rule.member_name || 'All Members',
            rest_minutes: rule.rest_minutes || 60,
            extra_rest_after: rule.extra_rest_after || 10,
            extra_rest_minutes: rule.extra_rest_minutes || 30,
            daily_limit: rule.daily_limit || 250,
            distribution_type: rule.distribution_type || 'balanced',
            send_strategy: rule.send_strategy || 'round_robin',
            members: rule.members || 'Member 1,Member 2,Member 3,Member 4',
            exclusions: rule.exclusions || []
        });
        setShowRuleForm(true);
    };

    const handleExecuteRule = async (id, name) => {
        if (!window.confirm(`Execute rule "${name}" now?`)) return;
        
        setExecutingRule(id);
        try {
            const response = await api.post(`/automation/rules/${id}/execute`);
            showMessage(`✅ Rule "${name}" executed! Sent: ${response.data.sent || 0}, Failed: ${response.data.failed || 0}`, 'success');
            await loadAllData();
        } catch (error) {
            console.error('Error executing rule:', error);
            showMessage('❌ Failed to execute rule: ' + (error.response?.data?.error || error.message), 'error');
        } finally {
            setExecutingRule(null);
        }
    };

    // ===== FORM HELPERS =====
    const resetForm = () => {
        setFormData({
            rule_name: '',
            category: 'general',
            trigger_type: 'manual',
            schedule_time: '',
            schedule_cron: '',
            delay_days: 0,
            target_group: 'Daily Reach',
            target_interest: '',
            target_yatra: '',
            template_id: '',
            custom_message: '',
            status: 'Active',
            auto_start: false,
            batch_size: 5,
            pause_minutes: 60,
            member_name: 'All Members',
            rest_minutes: 60,
            extra_rest_after: 10,
            extra_rest_minutes: 30,
            daily_limit: 250,
            distribution_type: 'balanced',
            send_strategy: 'round_robin',
            members: 'Member 1,Member 2,Member 3,Member 4',
            exclusions: []
        });
    };

    const handleFormChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleMemberToggle = (member) => {
        const currentMembers = formData.members.split(',').map(m => m.trim());
        if (currentMembers.includes(member)) {
            const updated = currentMembers.filter(m => m !== member);
            handleFormChange('members', updated.join(','));
        } else {
            const updated = [...currentMembers, member];
            handleFormChange('members', updated.join(','));
        }
    };

    const showMessage = (text, type = "success") => {
        setMessage({ text, type });
        setTimeout(() => setMessage({ text: "", type: "" }), 5000);
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // ===== RENDER =====
    return (
        <div className={`p-6 max-w-7xl mx-auto ${isDarkMode ? 'dark bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'}`}>
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold">🤖 Automation Rules</h1>
                    <p className="text-sm text-gray-500">Create and manage automated messaging rules for your team</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setIsDarkMode(!isDarkMode)}
                        className={`px-4 py-2 rounded-lg transition ${
                            isDarkMode 
                                ? 'bg-gray-700 hover:bg-gray-600 text-yellow-400' 
                                : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                        }`}
                    >
                        {isDarkMode ? '☀️ Light' : '🌙 Dark'}
                    </button>
                    <button
                        onClick={() => {
                            resetForm();
                            setEditingRule(null);
                            setShowRuleForm(true);
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
                    >
                        + Create Rule
                    </button>
                </div>
            </div>

            {/* Message */}
            {message.text && (
                <div className={`p-4 rounded-xl mb-4 ${
                    message.type === 'error' ? 'bg-red-100 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-400' :
                    message.type === 'info' ? 'bg-blue-100 text-blue-700 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-400' :
                    'bg-green-100 text-green-700 border border-green-200 dark:bg-green-900/20 dark:text-green-400'
                }`}>
                    {message.text}
                </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className={`rounded-lg shadow p-4 border-l-4 border-blue-500 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                    <p className="text-xs text-gray-500 uppercase">Total Rules</p>
                    <p className="text-2xl font-bold">{stats.totalRules}</p>
                </div>
                <div className={`rounded-lg shadow p-4 border-l-4 border-green-500 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                    <p className="text-xs text-gray-500 uppercase">Active Rules</p>
                    <p className="text-2xl font-bold">{stats.activeRules}</p>
                </div>
                <div className={`rounded-lg shadow p-4 border-l-4 border-purple-500 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                    <p className="text-xs text-gray-500 uppercase">Executions</p>
                    <p className="text-2xl font-bold">{stats.totalExecutions}</p>
                </div>
                <div className={`rounded-lg shadow p-4 border-l-4 border-orange-500 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                    <p className="text-xs text-gray-500 uppercase">Total Sent</p>
                    <p className="text-2xl font-bold">{stats.totalSent}</p>
                </div>
            </div>

            {/* Filters */}
            <div className={`rounded-lg shadow p-4 mb-6 border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Category Filter</label>
                        <select
                            value={filterCategory}
                            onChange={(e) => setFilterCategory(e.target.value)}
                            className={`w-full p-2 border rounded-lg ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                        >
                            <option value="all">All Categories</option>
                            {categoriesList.map(cat => (
                                <option key={cat.value} value={cat.value}>{cat.label}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Status Filter</label>
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className={`w-full p-2 border rounded-lg ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                        >
                            <option value="all">All Status</option>
                            <option value="Active">✅ Active</option>
                            <option value="Inactive">❌ Inactive</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Rules List */}
            <div className={`rounded-lg shadow overflow-hidden ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="font-bold">📋 Rules ({rules.length})</h2>
                </div>
                {rules.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        No automation rules yet. Click "Create Rule" to get started.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className={`sticky top-0 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                <tr>
                                    <th className="px-4 py-2 text-left text-sm font-medium">Name</th>
                                    <th className="px-4 py-2 text-left text-sm font-medium">Category</th>
                                    <th className="px-4 py-2 text-left text-sm font-medium">Trigger</th>
                                    <th className="px-4 py-2 text-left text-sm font-medium">Target</th>
                                    <th className="px-4 py-2 text-left text-sm font-medium">Members</th>
                                    <th className="px-4 py-2 text-center text-sm font-medium">Status</th>
                                    <th className="px-4 py-2 text-center text-sm font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {rules.map((rule) => (
                                    <tr key={rule.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                        <td className="px-4 py-2 text-sm font-medium">{rule.rule_name}</td>
                                        <td className="px-4 py-2 text-sm">
                                            <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
                                                {categoriesList.find(c => c.value === rule.category)?.label || rule.category}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2 text-sm">
                                            {rule.trigger_type === 'manual' ? '🖐️ Manual' :
                                             rule.trigger_type === 'scheduled' ? '📅 Scheduled' :
                                             '⚡ Event'}
                                        </td>
                                        <td className="px-4 py-2 text-sm">{rule.target_group || 'All'}</td>
                                        <td className="px-4 py-2 text-sm">
                                            <span className="text-xs">
                                                {rule.members ? rule.members.split(',').map(m => m.trim()).join(', ') : 'All Members'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2 text-center">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                rule.status === 'Active' 
                                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' 
                                                    : 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                                            }`}>
                                                {rule.status === 'Active' ? '✅ Active' : '❌ Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2 text-center">
                                            <div className="flex items-center justify-center gap-2 flex-wrap">
                                                <button
                                                    onClick={() => handleExecuteRule(rule.id, rule.rule_name)}
                                                    disabled={executingRule === rule.id}
                                                    className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded text-xs transition disabled:opacity-50"
                                                >
                                                    {executingRule === rule.id ? '⏳' : '▶️ Run'}
                                                </button>
                                                <button
                                                    onClick={() => handleEditRule(rule)}
                                                    className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs transition"
                                                >
                                                    ✏️
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteRule(rule.id)}
                                                    className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs transition"
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Recent Logs */}
            <div className={`rounded-lg shadow overflow-hidden mt-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                    <h2 className="font-bold">📜 Recent Execution Logs ({logs.length})</h2>
                    <button
                        onClick={() => loadLogs()}
                        className="bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded text-sm transition dark:bg-gray-700 dark:hover:bg-gray-600"
                    >
                        🔄 Refresh
                    </button>
                </div>
                {logs.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        No execution logs yet.
                    </div>
                ) : (
                    <div className="overflow-x-auto max-h-96 overflow-y-auto">
                        <table className="w-full">
                            <thead className={`sticky top-0 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                <tr>
                                    <th className="px-4 py-2 text-left text-sm font-medium">#</th>
                                    <th className="px-4 py-2 text-left text-sm font-medium">Rule</th>
                                    <th className="px-4 py-2 text-left text-sm font-medium">Status</th>
                                    <th className="px-4 py-2 text-left text-sm font-medium">Sent</th>
                                    <th className="px-4 py-2 text-left text-sm font-medium">Message</th>
                                    <th className="px-4 py-2 text-left text-sm font-medium">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {logs.slice(0, 30).map((log, index) => (
                                    <tr key={log.id || index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                        <td className="px-4 py-2 text-sm text-gray-500">{index + 1}</td>
                                        <td className="px-4 py-2 text-sm">{log.rule_name || 'Unknown'}</td>
                                        <td className="px-4 py-2 text-sm">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                log.status === 'completed' || log.status === 'Sent' ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' :
                                                log.status === 'failed' ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400' :
                                                'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'
                                            }`}>
                                                {log.status || 'Unknown'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2 text-sm">{log.sent_count || 0}</td>
                                        <td className="px-4 py-2 text-sm max-w-xs truncate">{log.message_sent || '-'}</td>
                                        <td className="px-4 py-2 text-sm">{formatDate(log.executed_at || log.sent_at)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Create/Edit Rule Modal */}
            {showRuleForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
                    <div className={`rounded-lg max-w-3xl w-full p-6 max-h-[90vh] overflow-y-auto ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold">
                                {editingRule ? '✏️ Edit Rule' : '➕ Create Rule'}
                            </h3>
                            <button
                                onClick={() => {
                                    setShowRuleForm(false);
                                    setEditingRule(null);
                                    resetForm();
                                }}
                                className="text-gray-500 hover:text-gray-700 text-xl"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={editingRule ? handleUpdateRule : handleCreateRule}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Rule Name */}
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium mb-1">Rule Name *</label>
                                    <input
                                        type="text"
                                        value={formData.rule_name}
                                        onChange={(e) => handleFormChange('rule_name', e.target.value)}
                                        className={`w-full p-2 border rounded-lg ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                                        placeholder="e.g., Daily Distribution"
                                        required
                                    />
                                </div>

                                {/* Category & Trigger */}
                                <div>
                                    <label className="block text-sm font-medium mb-1">Category</label>
                                    <select
                                        value={formData.category}
                                        onChange={(e) => handleFormChange('category', e.target.value)}
                                        className={`w-full p-2 border rounded-lg ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                                    >
                                        {categoriesList.map(cat => (
                                            <option key={cat.value} value={cat.value}>{cat.label}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">Trigger Type</label>
                                    <select
                                        value={formData.trigger_type}
                                        onChange={(e) => handleFormChange('trigger_type', e.target.value)}
                                        className={`w-full p-2 border rounded-lg ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                                    >
                                        {triggerTypes.map(t => (
                                            <option key={t.value} value={t.value}>{t.label}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Status & Schedule */}
                                <div>
                                    <label className="block text-sm font-medium mb-1">Status</label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) => handleFormChange('status', e.target.value)}
                                        className={`w-full p-2 border rounded-lg ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                                    >
                                        <option value="Active">✅ Active</option>
                                        <option value="Inactive">❌ Inactive</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">Auto Start</label>
                                    <div className="flex items-center gap-2 mt-2">
                                        <input
                                            type="checkbox"
                                            checked={formData.auto_start}
                                            onChange={(e) => handleFormChange('auto_start', e.target.checked)}
                                            className="w-4 h-4 text-blue-600"
                                        />
                                        <span className="text-sm">Enable scheduled start</span>
                                    </div>
                                </div>

                                {/* Schedule Time */}
                                <div>
                                    <label className="block text-sm font-medium mb-1">Schedule Time</label>
                                    <input
                                        type="datetime-local"
                                        value={formData.schedule_time}
                                        onChange={(e) => handleFormChange('schedule_time', e.target.value)}
                                        className={`w-full p-2 border rounded-lg ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">Cron Expression</label>
                                    <input
                                        type="text"
                                        value={formData.schedule_cron}
                                        onChange={(e) => handleFormChange('schedule_cron', e.target.value)}
                                        className={`w-full p-2 border rounded-lg ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                                        placeholder="e.g., 0 9 * * * (daily at 9 AM)"
                                    />
                                </div>

                                {/* Target Settings */}
                                <div>
                                    <label className="block text-sm font-medium mb-1">Target Group</label>
                                    <select
                                        value={formData.target_group}
                                        onChange={(e) => handleFormChange('target_group', e.target.value)}
                                        className={`w-full p-2 border rounded-lg ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                                    >
                                        {targetGroups.map(g => (
                                            <option key={g} value={g}>{g}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">Target Interest</label>
                                    <select
                                        value={formData.target_interest}
                                        onChange={(e) => handleFormChange('target_interest', e.target.value)}
                                        className={`w-full p-2 border rounded-lg ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                                    >
                                        <option value="">All Interests</option>
                                        {interests.map(i => (
                                            <option key={i.id} value={i.interest_name}>{i.interest_name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">Target Yatra</label>
                                    <select
                                        value={formData.target_yatra}
                                        onChange={(e) => handleFormChange('target_yatra', e.target.value)}
                                        className={`w-full p-2 border rounded-lg ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                                    >
                                        <option value="">All Yatras</option>
                                        {yatras.map(y => (
                                            <option key={y.id} value={y.yatra_name}>{y.yatra_name}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Template & Message */}
                                <div>
                                    <label className="block text-sm font-medium mb-1">Template</label>
                                    <select
                                        value={formData.template_id}
                                        onChange={(e) => handleFormChange('template_id', e.target.value)}
                                        className={`w-full p-2 border rounded-lg ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                                    >
                                        <option value="">None</option>
                                        {templates.map(t => (
                                            <option key={t.id} value={String(t.id)}>{t.template_name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">Delay Days</label>
                                    <input
                                        type="number"
                                        value={formData.delay_days}
                                        onChange={(e) => handleFormChange('delay_days', parseInt(e.target.value) || 0)}
                                        className={`w-full p-2 border rounded-lg ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                                        min="0"
                                        max="30"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium mb-1">Custom Message</label>
                                    <textarea
                                        value={formData.custom_message}
                                        onChange={(e) => handleFormChange('custom_message', e.target.value)}
                                        className={`w-full p-2 border rounded-lg ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                                        rows="3"
                                        placeholder="Type your message here... Use {name}, {phone}, {interest}, {yatra} for personalization"
                                    />
                                </div>

                                {/* Distribution Settings */}
                                <div>
                                    <label className="block text-sm font-medium mb-1">Distribution Type</label>
                                    <select
                                        value={formData.distribution_type}
                                        onChange={(e) => handleFormChange('distribution_type', e.target.value)}
                                        className={`w-full p-2 border rounded-lg ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                                    >
                                        {distributionTypes.map(d => (
                                            <option key={d.value} value={d.value}>{d.label}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">Send Strategy</label>
                                    <select
                                        value={formData.send_strategy}
                                        onChange={(e) => handleFormChange('send_strategy', e.target.value)}
                                        className={`w-full p-2 border rounded-lg ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                                    >
                                        {sendStrategies.map(s => (
                                            <option key={s.value} value={s.value}>{s.label}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Member Selection */}
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium mb-1">Select Members</label>
                                    <div className="flex gap-4 flex-wrap">
                                        {members.map(member => (
                                            <label key={member} className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.members.split(',').map(m => m.trim()).includes(member)}
                                                    onChange={() => handleMemberToggle(member)}
                                                    className="w-4 h-4 text-blue-600"
                                                />
                                                <span className="text-sm">{member}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Batch Settings */}
                                <div>
                                    <label className="block text-sm font-medium mb-1">Batch Size (per member)</label>
                                    <input
                                        type="number"
                                        value={formData.batch_size}
                                        onChange={(e) => handleFormChange('batch_size', parseInt(e.target.value) || 5)}
                                        className={`w-full p-2 border rounded-lg ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                                        min="1"
                                        max="50"
                                    />
                                    <p className="text-xs text-gray-400 mt-1">Messages each member sends per batch</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">Rest Minutes (between batches)</label>
                                    <input
                                        type="number"
                                        value={formData.rest_minutes}
                                        onChange={(e) => handleFormChange('rest_minutes', parseInt(e.target.value) || 60)}
                                        className={`w-full p-2 border rounded-lg ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                                        min="1"
                                        max="120"
                                    />
                                    <p className="text-xs text-gray-400 mt-1">Wait time between batches</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">Extra Rest After</label>
                                    <input
                                        type="number"
                                        value={formData.extra_rest_after}
                                        onChange={(e) => handleFormChange('extra_rest_after', parseInt(e.target.value) || 10)}
                                        className={`w-full p-2 border rounded-lg ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                                        min="1"
                                        max="50"
                                    />
                                    <p className="text-xs text-gray-400 mt-1">Extra rest after X batches</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">Extra Rest Minutes</label>
                                    <input
                                        type="number"
                                        value={formData.extra_rest_minutes}
                                        onChange={(e) => handleFormChange('extra_rest_minutes', parseInt(e.target.value) || 30)}
                                        className={`w-full p-2 border rounded-lg ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                                        min="5"
                                        max="60"
                                    />
                                    <p className="text-xs text-gray-400 mt-1">Additional rest time</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">Daily Limit (per member)</label>
                                    <input
                                        type="number"
                                        value={formData.daily_limit}
                                        onChange={(e) => handleFormChange('daily_limit', parseInt(e.target.value) || 250)}
                                        className={`w-full p-2 border rounded-lg ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                                        min="10"
                                        max="500"
                                    />
                                    <p className="text-xs text-gray-400 mt-1">Max messages per member per day</p>
                                </div>

                                {/* Exclusions */}
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium mb-1">Exclusions (comma separated customer IDs)</label>
                                    <input
                                        type="text"
                                        value={formData.exclusions.join(', ')}
                                        onChange={(e) => {
                                            const values = e.target.value.split(',').map(v => v.trim()).filter(v => v);
                                            handleFormChange('exclusions', values);
                                        }}
                                        className={`w-full p-2 border rounded-lg ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                                        placeholder="e.g., 123, 456, 789"
                                    />
                                    <p className="text-xs text-gray-400 mt-1">Customers to exclude from this rule</p>
                                </div>
                            </div>

                            <div className="mt-6 flex gap-3">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition disabled:opacity-50"
                                >
                                    {loading ? '⏳ Saving...' : (editingRule ? '💾 Update Rule' : '➕ Create Rule')}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowRuleForm(false);
                                        setEditingRule(null);
                                        resetForm();
                                    }}
                                    className="bg-gray-300 hover:bg-gray-400 px-6 py-2 rounded-lg transition dark:bg-gray-600 dark:hover:bg-gray-500"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AutomationPage;
