import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getTemplates } from '../services/templateService';
import { getInterests } from '../services/interestService';

function AutomationPage() {
  const [rules, setRules] = useState([]);
  const [logs, setLogs] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [interests, setInterests] = useState([]);
  const [yatras, setYatras] = useState([]);
  const [showRuleForm, setShowRuleForm] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [formData, setFormData] = useState({
    rule_name: '',
    trigger_type: 'manual',
    target_group: 'Daily Reach',
    target_interest: '',
    target_yatra: '',
    template_id: '',
    custom_message: '',
    status: 'Active'
  });

  useEffect(() => {
    loadRules();
    loadLogs();
    loadTemplates();
    loadInterests();
    loadYatras();
  }, []);

  const loadRules = async () => {
    try {
      const response = await axios.get('/api/automation/rules');
      setRules(response.data);
    } catch (error) {
      console.error('Error loading rules:', error);
    }
  };

  const loadLogs = async () => {
    try {
      const response = await axios.get('/api/automation/logs');
      setLogs(response.data);
    } catch (error) {
      console.error('Error loading logs:', error);
    }
  };

  const loadTemplates = async () => {
    try {
      const data = await getTemplates();
      setTemplates(data.filter(t => t.status === 'Active'));
    } catch (error) {
      console.error('Error loading templates:', error);
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

  const loadYatras = async () => {
    try {
      const response = await axios.get('/api/yatras');
      setYatras(response.data);
    } catch (error) {
      console.error('Error loading yatras:', error);
    }
  };

  const showMessage = (text, type = "success") => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), 3000);
  };

  const handleRun = async () => {
    setLoading(true);
    try {
      const response = await axios.post('/api/automation/run', {
        rule_id: formData.rule_id || null
      });
      setResults(response.data);
      if (response.data.length > 0) {
        setShowConfirmModal(true);
      } else {
        showMessage('No customers matched the criteria', "error");
      }
    } catch (error) {
      console.error(error);
      showMessage('Automation Failed', "error");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmSend = async () => {
    setShowConfirmModal(false);
    if (results.length === 0) {
      showMessage('No customers to send to', "error");
      return;
    }

    setSending(true);
    try {
      const response = await axios.post('/api/send-bulk', {
        customers: results.map(r => ({
          id: r.customer_id,
          phone: r.mobile_number,
          message: r.message
        }))
      });
      showMessage(`${response.data.total} Messages Sent`, "success");
      loadLogs();
      setResults([]);
    } catch (error) {
      console.error(error);
      showMessage('Send Failed', "error");
    } finally {
      setSending(false);
    }
  };

  const handleSubmitRule = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('/api/automation/rules', formData);
      showMessage('Rule created successfully!', "success");
      setShowRuleForm(false);
      setFormData({
        rule_name: '',
        trigger_type: 'manual',
        target_group: 'Daily Reach',
        target_interest: '',
        target_yatra: '',
        template_id: '',
        custom_message: '',
        status: 'Active'
      });
      loadRules();
    } catch (error) {
      console.error(error);
      showMessage('Failed to create rule', "error");
    }
  };

  const handleDeleteRule = async (id) => {
    if (!window.confirm('Delete this automation rule?')) return;
    try {
      await axios.delete(`/api/automation/rules/${id}`);
      showMessage('Rule deleted', "success");
      loadRules();
    } catch (error) {
      console.error(error);
      showMessage('Failed to delete rule', "error");
    }
  };

  const handleToggleRule = async (id, currentStatus) => {
    const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
    try {
      await axios.patch(`/api/automation/rules/${id}/status`, { status: newStatus });
      showMessage(`Rule ${newStatus}`, "success");
      loadRules();
    } catch (error) {
      console.error(error);
      showMessage('Failed to update status', "error");
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Active': return 'bg-green-100 text-green-700';
      case 'Inactive': return 'bg-gray-200 text-gray-700';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  // Confirmation Modal
  const ConfirmModal = () => {
    if (!showConfirmModal) return null;
    
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-2xl">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold">📨 Confirm Send</h2>
            <p className="text-gray-500 mt-1">
              You are about to send WhatsApp messages to {results.length} customers
            </p>
          </div>
          
          <div className="p-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4">
              <p className="text-yellow-800 text-sm font-medium">
                ⚠️ Please review the list below before sending
              </p>
            </div>
            
            <div className="max-h-60 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="p-2 text-left font-semibold">#</th>
                    <th className="p-2 text-left font-semibold">Customer</th>
                    <th className="p-2 text-left font-semibold">Phone</th>
                    <th className="p-2 text-left font-semibold">Interest</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {results.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="p-2">{index + 1}</td>
                      <td className="p-2 font-medium">{item.customer_name}</td>
                      <td className="p-2">{item.mobile_number}</td>
                      <td className="p-2">
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                          {item.interest || 'All'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="mt-4 p-3 bg-gray-50 rounded-xl">
              <p className="text-sm text-gray-600">
                <strong>Message Preview:</strong>
              </p>
              <p className="text-sm text-gray-700 mt-1 p-2 bg-white rounded border">
                {results[0]?.message || 'No message set'}
              </p>
            </div>
          </div>
          
          <div className="p-6 border-t border-gray-200 flex gap-3 justify-end">
            <button
              onClick={() => setShowConfirmModal(false)}
              className="bg-gray-300 hover:bg-gray-400 px-6 py-2 rounded-xl font-semibold transition"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmSend}
              disabled={sending}
              className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-xl font-semibold transition disabled:opacity-50"
            >
              {sending ? 'Sending...' : `Send to ${results.length} Customers`}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Message Toast */}
      {message.text && (
        <div className={`p-4 rounded-xl mb-4 ${
          message.type === "success" 
            ? "bg-green-100 text-green-700 border border-green-200" 
            : "bg-red-100 text-red-700 border border-red-200"
        }`}>
          {message.text}
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal />

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">🤖 Automation Engine</h1>
          <p className="text-gray-500 mt-1">Match customers with templates and send automatically</p>
        </div>
        <button
          onClick={() => setShowRuleForm(!showRuleForm)}
          className="bg-yellow-400 hover:bg-yellow-500 text-black px-6 py-3 rounded-xl font-semibold transition"
        >
          {showRuleForm ? "✕ Cancel" : "+ New Rule"}
        </button>
      </div>

      {/* Rule Form */}
      {showRuleForm && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">📝 Create Automation Rule</h2>
          <form onSubmit={handleSubmitRule} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block font-medium text-gray-700 mb-1">Rule Name *</label>
                <input
                  type="text"
                  value={formData.rule_name}
                  onChange={(e) => setFormData({...formData, rule_name: e.target.value})}
                  className="w-full border border-gray-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  placeholder="e.g., Yatra Follow-up"
                  required
                />
              </div>
              <div>
                <label className="block font-medium text-gray-700 mb-1">Trigger Type</label>
                <select
                  value={formData.trigger_type}
                  onChange={(e) => setFormData({...formData, trigger_type: e.target.value})}
                  className="w-full border border-gray-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                >
                  <option value="manual">Manual</option>
                  <option value="interest_match">Interest Match</option>
                  <option value="group_added">Group Added</option>
                </select>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block font-medium text-gray-700 mb-1">Target Group</label>
                <select
                  value={formData.target_group}
                  onChange={(e) => setFormData({...formData, target_group: e.target.value})}
                  className="w-full border border-gray-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                >
                  <option value="Daily Reach">Daily Reach</option>
                  <option value="Do Not Reach">Do Not Reach</option>
                  <option value="Unsubscribed">Unsubscribed</option>
                </select>
              </div>
              <div>
                <label className="block font-medium text-gray-700 mb-1">Interest</label>
                <select
                  value={formData.target_interest}
                  onChange={(e) => setFormData({...formData, target_interest: e.target.value})}
                  className="w-full border border-gray-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-yellow-400"
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
                <label className="block font-medium text-gray-700 mb-1">Yatra</label>
                <select
                  value={formData.target_yatra}
                  onChange={(e) => setFormData({...formData, target_yatra: e.target.value})}
                  className="w-full border border-gray-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                >
                  <option value="">All Yatras</option>
                  {yatras.map((yatra) => (
                    <option key={yatra.id} value={yatra.yatra_name}>
                      {yatra.yatra_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block font-medium text-gray-700 mb-1">Template</label>
                <select
                  value={formData.template_id}
                  onChange={(e) => setFormData({...formData, template_id: e.target.value})}
                  className="w-full border border-gray-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                >
                  <option value="">Select Template</option>
                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.template_name} {template.interest_name ? `(${template.interest_name})` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  className="w-full border border-gray-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-medium text-gray-700 mb-1">Custom Message</label>
              <textarea
                value={formData.custom_message}
                onChange={(e) => setFormData({...formData, custom_message: e.target.value})}
                rows="3"
                className="w-full border border-gray-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                placeholder="Optional: Custom message (overrides template)"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold transition"
              >
                Create Rule
              </button>
              <button
                type="button"
                onClick={() => setShowRuleForm(false)}
                className="bg-gray-300 hover:bg-gray-400 px-6 py-3 rounded-xl font-semibold transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Run Automation */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl shadow-lg border border-green-200 p-6 mb-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-800">▶️ Run Automation</h2>
            <p className="text-gray-600 text-sm">Select a rule and click Run to find matching customers</p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <select
              value={formData.rule_id || ''}
              onChange={(e) => setFormData({...formData, rule_id: e.target.value})}
              className="border border-gray-300 rounded-xl p-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-green-400"
            >
              <option value="">All Rules</option>
              {rules.filter(r => r.status === 'Active').map((rule) => (
                <option key={rule.id} value={rule.id}>
                  {rule.rule_name}
                </option>
              ))}
            </select>
            <button
              onClick={handleRun}
              disabled={loading}
              className="bg-green-500 hover:bg-green-600 text-white px-8 py-2.5 rounded-xl font-semibold disabled:opacity-50 transition flex items-center gap-2"
            >
              {loading ? (
                <>
                  <span className="animate-spin">⏳</span> Running...
                </>
              ) : (
                '🚀 RUN NOW'
              )}
            </button>
          </div>
        </div>
        {results.length > 0 && (
          <div className="mt-4 p-3 bg-white rounded-xl border border-green-200">
            <div className="flex items-center justify-between">
              <span className="font-medium text-green-700">
                ✅ Matched {results.length} customers
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowConfirmModal(true)}
                  disabled={sending || results.length === 0}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-1.5 rounded-lg font-medium text-sm transition disabled:opacity-50"
                >
                  {sending ? 'Sending...' : `📤 Send (${results.length})`}
                </button>
                <button
                  onClick={() => setResults([])}
                  className="bg-gray-300 hover:bg-gray-400 px-4 py-1.5 rounded-lg text-sm font-medium transition"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results Table */}
      {results.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden mb-6">
          <div className="p-4 border-b bg-green-50">
            <h2 className="font-bold text-green-700">✅ Matched Customers ({results.length})</h2>
          </div>
          <div className="overflow-x-auto max-h-64 overflow-y-auto">
            <table className="w-full">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="p-3 text-left text-sm font-semibold text-gray-600">#</th>
                  <th className="p-3 text-left text-sm font-semibold text-gray-600">Customer</th>
                  <th className="p-3 text-left text-sm font-semibold text-gray-600">Phone</th>
                  <th className="p-3 text-left text-sm font-semibold text-gray-600">Interest</th>
                  <th className="p-3 text-left text-sm font-semibold text-gray-600">Template/Message</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {results.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="p-3 text-sm text-gray-500">{index + 1}</td>
                    <td className="p-3 text-sm font-medium text-gray-800">{item.customer_name}</td>
                    <td className="p-3 text-sm text-gray-600">{item.mobile_number}</td>
                    <td className="p-3">
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                        {item.interest || 'All'}
                      </span>
                    </td>
                    <td className="p-3 text-sm text-gray-600 max-w-xs truncate">
                      {item.template_name || 'Custom Message'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Rules Table */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden mb-6">
        <div className="p-4 border-b bg-gray-50">
          <h2 className="font-bold text-gray-800">📋 Automation Rules</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-800 text-white">
                <th className="p-3 text-left text-sm">Rule Name</th>
                <th className="p-3 text-left text-sm">Trigger</th>
                <th className="p-3 text-left text-sm">Group</th>
                <th className="p-3 text-left text-sm">Interest</th>
                <th className="p-3 text-left text-sm">Yatra</th>
                <th className="p-3 text-left text-sm">Status</th>
                <th className="p-3 text-center text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rules.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-gray-500">
                    No rules created yet. Click "+ New Rule" to create one.
                  </td>
                </tr>
              ) : (
                rules.map((rule) => (
                  <tr key={rule.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-medium text-gray-800">{rule.rule_name}</td>
                    <td className="p-3">
                      <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700">
                        {rule.trigger_type}
                      </span>
                    </td>
                    <td className="p-3 text-gray-600">{rule.target_group}</td>
                    <td className="p-3 text-gray-600">{rule.target_interest || 'All'}</td>
                    <td className="p-3 text-gray-600">{rule.target_yatra || 'All'}</td>
                    <td className="p-3">
                      <button
                        onClick={() => handleToggleRule(rule.id, rule.status)}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition ${getStatusColor(rule.status)}`}
                      >
                        {rule.status}
                      </button>
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => handleDeleteRule(rule.id)}
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg text-sm transition"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Logs */}
      {logs.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="p-4 border-b bg-gray-50">
            <h2 className="font-bold text-gray-800">📜 Recent Activity Logs</h2>
          </div>
          <div className="overflow-x-auto max-h-64 overflow-y-auto">
            <table className="w-full">
              <thead className="bg-gray-700 text-white sticky top-0">
                <tr>
                  <th className="p-3 text-left text-sm">Rule</th>
                  <th className="p-3 text-left text-sm">Customer</th>
                  <th className="p-3 text-left text-sm">Status</th>
                  <th className="p-3 text-left text-sm">Sent At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.slice(0, 20).map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="p-3 text-gray-800">{log.rule_name || 'Manual'}</td>
                    <td className="p-3 text-gray-600">{log.customer_name || 'Unknown'}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        log.status === 'Sent' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="p-3 text-gray-500 text-sm">
                      {new Date(log.sent_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default AutomationPage;
