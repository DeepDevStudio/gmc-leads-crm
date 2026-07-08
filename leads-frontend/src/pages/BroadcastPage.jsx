import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { getTemplates } from '../services/templateService';
import { getInterests } from '../services/interestService';

const BroadcastPage = () => {
    // ===== DARK MODE =====
    const [isDarkMode, setIsDarkMode] = useState(() => {
        const saved = localStorage.getItem('broadcastDarkMode');
        return saved ? JSON.parse(saved) : false;
    });

    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('broadcastDarkMode', JSON.stringify(isDarkMode));
    }, [isDarkMode]);

    // ===== TEST MODE =====
    const [testMode, setTestMode] = useState(true);

    // ===== TEAM MEMBERS STATE =====
    const [teamMembers, setTeamMembers] = useState([
        { id: 1, name: 'Member 1', role: 'employee', dailyLimit: 250, todaySent: 0, isConnected: false, whatsappNumber: '' },
        { id: 2, name: 'Member 2', role: 'employee', dailyLimit: 250, todaySent: 0, isConnected: false, whatsappNumber: '' },
        { id: 3, name: 'Member 3', role: 'employee', dailyLimit: 250, todaySent: 0, isConnected: false, whatsappNumber: '' },
        { id: 4, name: 'Member 4', role: 'employee', dailyLimit: 250, todaySent: 0, isConnected: false, whatsappNumber: '' },
    ]);
    const [editingMember, setEditingMember] = useState(null);
    const [showEditMember, setShowEditMember] = useState(false);
    const [editMemberName, setEditMemberName] = useState('');
    const [editMemberId, setEditMemberId] = useState(null);

    // ===== NUMBER ASSIGNMENT =====
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [assignMember, setAssignMember] = useState('Member 1');
    const [assignPhone, setAssignPhone] = useState('');
    const [assignLoading, setAssignLoading] = useState(false);

    // ===== WHATSAPP STATE =====
    const [qrCodes, setQrCodes] = useState({});
    const [memberStatus, setMemberStatus] = useState({});
    const [statusMessage, setStatusMessage] = useState('Connecting...');
    const wsRef = useRef(null);

    // ===== BROADCAST STATE =====
    const [loading, setLoading] = useState(false);
    const [templates, setTemplates] = useState([]);
    const [interests, setInterests] = useState([]);
    const [yatras, setYatras] = useState([]);
    const [selectedInterests, setSelectedInterests] = useState([]);
    const [selectedYatra, setSelectedYatra] = useState('');
    const [selectedTemplate, setSelectedTemplate] = useState('');
    const [customMessage, setCustomMessage] = useState('');
    const [targetGroup, setTargetGroup] = useState('Daily Reach');
    const [previewCount, setPreviewCount] = useState(0);
    const [previewCustomers, setPreviewCustomers] = useState([]);
    const [showPreview, setShowPreview] = useState(false);
    const [message, setMessage] = useState({ text: "", type: "" });
    const [selectedMember, setSelectedMember] = useState('Member 1');
    const [memberTodaySent, setMemberTodaySent] = useState(0);
    const [messageLogs, setMessageLogs] = useState([]);
    const [selectedPreset, setSelectedPreset] = useState('');
    const [attachmentFile, setAttachmentFile] = useState(null);
    const [attachmentName, setAttachmentName] = useState('');
    const [attachmentBase64, setAttachmentBase64] = useState('');
    const [attachmentType, setAttachmentType] = useState('');
    const [attachmentPreview, setAttachmentPreview] = useState('');

    // ===== PRESET MANAGEMENT STATE =====
    const [presetMessages, setPresetMessages] = useState([]);
    const [showPresetModal, setShowPresetModal] = useState(false);
    const [editingPreset, setEditingPreset] = useState(null);
    const [presetFormData, setPresetFormData] = useState({ name: '', message: '' });
    const [presetLoading, setPresetLoading] = useState(false);

    // ===== AUTOMATION RULES STATE =====
    const [automationRules, setAutomationRules] = useState([]);
    const [selectedRule, setSelectedRule] = useState('');
    const [useRule, setUseRule] = useState(false);

    // ===== AUTOMATION RULES FOR BROADCAST =====
    const [automationRulesList, setAutomationRulesList] = useState([]);
    const [selectedAutomationRule, setSelectedAutomationRule] = useState('');
    const [isAutomationRunning, setIsAutomationRunning] = useState(false);
    const [automationJobId, setAutomationJobId] = useState(null);
    const [automationProgress, setAutomationProgress] = useState(0);
    const [automationStatusDetails, setAutomationStatusDetails] = useState(null);

    // ===== AUTO BROADCAST STATE =====
    const [autoMode, setAutoMode] = useState(false);
    const [autoStatus, setAutoStatus] = useState(null);
    const [broadcastId, setBroadcastId] = useState(null);
    const [memberStats, setMemberStats] = useState([]);
    const [sendingProgress, setSendingProgress] = useState(0);
    const [batchQueue, setBatchQueue] = useState([]);
    const [isPaused, setIsPaused] = useState(false);

    // ===== RECENT BROADCASTS FILTERS =====
    const [filterDate, setFilterDate] = useState('');
    const [filterMember, setFilterMember] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredLogs, setFilteredLogs] = useState([]);

    // ===== STATS =====
    const [stats, setStats] = useState({
        totalMessages: 0,
        todaySent: 0,
        dailyLimit: 1000,
        connectedMembers: 0,
        successRate: 0,
        failedCount: 0
    });

    // ===== EFFECTS =====
    useEffect(() => {
        loadAllData();
        connectWhatsApp();
        loadMemberStats();
        loadMessageLogs();
        loadAutomationRulesList();
        
        const interval = setInterval(() => {
            loadMessageLogs();
            if (isAutomationRunning) {
                checkAutomationStatus();
            }
        }, 30000);
        
        return () => {
            if (wsRef.current) {
                wsRef.current.close();
            }
            clearInterval(interval);
        };
    }, []);

    useEffect(() => {
        calculateStats();
        filterLogs();
    }, [messageLogs, teamMembers]);

    useEffect(() => {
        filterLogs();
    }, [filterDate, filterMember, filterStatus, searchTerm]);

    // ===== FILTER LOGS =====
    const filterLogs = () => {
        let filtered = [...messageLogs];
        
        if (filterDate) {
            filtered = filtered.filter(log => {
                const logDate = new Date(log.created_at).toDateString();
                const filterDateObj = new Date(filterDate).toDateString();
                return logDate === filterDateObj;
            });
        }
        
        if (filterMember !== 'all') {
            filtered = filtered.filter(log => log.team_member === filterMember);
        }
        
        if (filterStatus !== 'all') {
            filtered = filtered.filter(log => log.status === filterStatus);
        }
        
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(log => 
                log.recipient?.includes(term) ||
                log.message?.toLowerCase().includes(term) ||
                log.team_member?.toLowerCase().includes(term)
            );
        }
        
        setFilteredLogs(filtered);
    };

    // ===== LOAD AUTOMATION RULES FOR BROADCAST =====
    const loadAutomationRulesList = async () => {
        try {
            const response = await api.get('/automation/rules?status=Active');
            setAutomationRulesList(response.data || []);
            console.log('📥 Automation rules loaded:', response.data?.length || 0);
        } catch (error) {
            console.error('Error loading automation rules:', error);
            setAutomationRulesList([]);
        }
    };

    // ===== CHECK AUTOMATION STATUS =====
    const checkAutomationStatus = async () => {
        if (!automationJobId) return;
        
        try {
            const response = await api.get(`/automation/rules/${selectedAutomationRule}/status`);
            if (response.data) {
                setAutomationStatusDetails(response.data);
                setAutomationProgress(response.data.progress || 0);
                
                if (response.data.status === 'completed' || response.data.status === 'stopped') {
                    setIsAutomationRunning(false);
                    showMessage(`✅ Automation ${response.data.status === 'completed' ? 'completed' : 'stopped'}!`, 'success');
                    await loadMessageLogs();
                }
            }
        } catch (error) {
            console.error('Error checking automation status:', error);
        }
    };

    // ===== APPLY AUTOMATION RULE =====
    const applyAutomationRule = (ruleId) => {
        const rule = automationRulesList.find(r => r.id === parseInt(ruleId));
        if (!rule) {
            showMessage('Rule not found', 'error');
            return;
        }
        
        setTargetGroup(rule.target_group || 'Daily Reach');
        setSelectedInterests(rule.target_interest ? [rule.target_interest] : []);
        setSelectedYatra(rule.target_yatra || '');
        setSelectedTemplate(rule.template_id ? String(rule.template_id) : '');
        setCustomMessage(rule.custom_message || '');
        
        if (rule.members) {
            const memberList = rule.members.split(',').map(m => m.trim());
            if (memberList.length > 0) {
                setSelectedMember(memberList[0]);
            }
        }
        
        showMessage(`✅ Applied rule: ${rule.rule_name}`, 'success');
    };

    // ===== START AUTOMATION WITH SELECTED RULE =====
    const startAutomationWithRule = async () => {
        if (!selectedAutomationRule) {
            showMessage('Please select a rule first!', 'error');
            return;
        }
        
        if (previewCount === 0) {
            showMessage('Please preview customers first!', 'error');
            return;
        }
        
        const rule = automationRulesList.find(r => r.id === parseInt(selectedAutomationRule));
        if (!rule) {
            showMessage('Rule not found', 'error');
            return;
        }
        
        const connectedMembers = teamMembers.filter(m => m.isConnected);
        if (!testMode && connectedMembers.length === 0) {
            showMessage('No members connected! Please connect a WhatsApp member first.', 'error');
            return;
        }
        
        const customers = previewCustomers.map(c => ({
            id: c.id,
            customer_name: c.customer_name,
            mobile_number: c.mobile_number,
            interests: c.interests,
            group_type: c.group_type
        }));
        
        if (!window.confirm(`Start automation with rule "${rule.rule_name}" for ${customers.length} customers?`)) return;
        
        setLoading(true);
        setIsAutomationRunning(true);
        setAutomationProgress(0);
        
        try {
            const response = await api.post(`/automation/rules/${rule.id}/start`, {
                customers: customers
            });
            
            if (response.data.success) {
                setAutomationJobId(response.data.jobId);
                setSelectedAutomationRule(rule.id);
                showMessage(`✅ Automation started! ${response.data.totalCustomers} customers will be processed.`, 'success');
                
                const statusInterval = setInterval(async () => {
                    try {
                        const statusRes = await api.get(`/automation/rules/${rule.id}/status`);
                        if (statusRes.data) {
                            setAutomationStatusDetails(statusRes.data);
                            setAutomationProgress(statusRes.data.progress || 0);
                            
                            if (statusRes.data.status === 'completed' || statusRes.data.status === 'stopped') {
                                clearInterval(statusInterval);
                                setIsAutomationRunning(false);
                                showMessage(`✅ Automation ${statusRes.data.status === 'completed' ? 'completed' : 'stopped'}!`, 'success');
                                await loadMessageLogs();
                                loadMemberStats();
                            }
                        }
                    } catch (err) {
                        console.error('Error polling status:', err);
                    }
                }, 10000);
                
                setPreviewCount(0);
                setPreviewCustomers([]);
                setShowPreview(false);
            } else {
                showMessage('❌ Failed to start automation: ' + (response.data.message || 'Unknown error'), 'error');
                setIsAutomationRunning(false);
            }
        } catch (error) {
            console.error('Error starting automation:', error);
            showMessage('❌ Failed to start automation: ' + (error.response?.data?.error || error.message), 'error');
            setIsAutomationRunning(false);
        } finally {
            setLoading(false);
        }
    };

    // ===== STOP AUTOMATION =====
    const stopAutomation = async () => {
        if (!selectedAutomationRule) return;
        
        if (!window.confirm('Stop the current automation?')) return;
        
        try {
            await api.post(`/automation/rules/${selectedAutomationRule}/stop`);
            setIsAutomationRunning(false);
            setAutomationJobId(null);
            showMessage('🛑 Automation stopped', 'info');
        } catch (error) {
            console.error('Error stopping automation:', error);
            showMessage('❌ Failed to stop automation', 'error');
        }
    };

    // ===== LOAD ALL DATA =====
    const loadAllData = async () => {
        await Promise.all([
            loadTemplates(),
            loadInterests(),
            loadYatras(),
            loadPresets(),
            loadAutomationRules()
        ]);
    };

    const loadTemplates = async () => {
        try {
            const data = await getTemplates();
            setTemplates(data.filter(t => t.status === 'Active') || []);
        } catch (error) {
            console.error('Error loading templates:', error);
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

    const loadYatras = async () => {
        try {
            const response = await api.get('/yatras');
            setYatras(response.data || []);
        } catch (error) {
            console.error('Error loading yatras:', error);
            setYatras([]);
        }
    };

    const loadMessageLogs = async () => {
        try {
            console.log('📤 Fetching message logs...');
            const response = await api.get('/whatsapp/logs');
            console.log('📥 Logs loaded:', response.data?.length || 0, 'entries');
            setMessageLogs(response.data || []);
        } catch (error) {
            console.error('❌ Error loading message logs:', error);
            setMessageLogs([]);
        }
    };

    const loadPresets = async () => {
        try {
            const response = await api.get('/presets');
            setPresetMessages(response.data || []);
        } catch (error) {
            console.error('Error loading presets:', error);
            setPresetMessages([]);
        }
    };

    const loadAutomationRules = async () => {
        try {
            const response = await api.get('/automation/rules');
            setAutomationRules(response.data || []);
        } catch (error) {
            console.error('Error loading automation rules:', error);
            setAutomationRules([]);
        }
    };

    const loadMemberStats = async () => {
        try {
            console.log('📤 Loading member stats...');
            const response = await api.get('/auto-broadcast/members/stats');
            console.log('📥 Member stats loaded:', response.data);
            setMemberStats(response.data || []);
        } catch (error) {
            console.error('❌ Error loading member stats:', error.message);
            setMemberStats([
                { memberName: 'Member 1', todaySent: 0, dailyLimit: 250, remaining: 250 },
                { memberName: 'Member 2', todaySent: 0, dailyLimit: 250, remaining: 250 },
                { memberName: 'Member 3', todaySent: 0, dailyLimit: 250, remaining: 250 },
                { memberName: 'Member 4', todaySent: 0, dailyLimit: 250, remaining: 250 }
            ]);
        }
    };

    const calculateStats = () => {
        const totalMessages = messageLogs.length;
        const todaySent = messageLogs.filter(log => {
            const today = new Date().toDateString();
            return new Date(log.created_at).toDateString() === today;
        }).length;
        const connectedMembers = teamMembers.filter(m => m.isConnected).length;
        const failedCount = messageLogs.filter(log => log.status === 'Failed').length;
        const successRate = totalMessages > 0 ? ((totalMessages - failedCount) / totalMessages * 100) : 0;
        
        setStats({ 
            totalMessages, 
            todaySent, 
            dailyLimit: 1000, 
            connectedMembers,
            failedCount,
            successRate
        });
    };

    // ===== ASSIGN NUMBER TO MEMBER =====
    const handleAssignNumber = async () => {
        if (!assignPhone || assignPhone.length < 10) {
            showMessage('Please enter a valid 10-digit phone number', 'error');
            return;
        }

        setAssignLoading(true);
        try {
            await api.post('/broadcast/assign-number', {
                memberName: assignMember,
                phoneNumber: assignPhone
            });
            showMessage(`✅ Number ${assignPhone} assigned to ${assignMember}`, 'success');
            setShowAssignModal(false);
            setAssignPhone('');
            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                wsRef.current.send(JSON.stringify({ type: 'get_all_status' }));
            }
        } catch (error) {
            console.error('Error assigning number:', error);
            showMessage('Failed to assign number', 'error');
        } finally {
            setAssignLoading(false);
        }
    };

    // ===== CONNECT WHATSAPP VIA WEBSOCKET =====
    const connectWhatsApp = () => {
        if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
            console.log('WebSocket already connected or connecting');
            return;
        }

        try {
            const wsUrl = `ws://31.97.62.121:6001`;
            console.log('Connecting to WebSocket:', wsUrl);
            const ws = new WebSocket(wsUrl);
            wsRef.current = ws;

            ws.onopen = () => {
                setStatusMessage('Connected to WhatsApp service...');
                ws.send(JSON.stringify({ type: 'get_all_status' }));
            };

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    console.log('WhatsApp event:', data);

                    if (data.type === 'qr') {
                        console.log(`📱 QR for ${data.member}`);
                        setQrCodes(prev => ({ ...prev, [data.member]: data.qr }));
                        setMemberStatus(prev => ({ ...prev, [data.member]: 'qr' }));
                        showMessage(`📱 ${data.member}: Scan QR code to connect`, 'info');
                    } else if (data.type === 'authenticated') {
                        setQrCodes(prev => ({ ...prev, [data.member]: null }));
                        setMemberStatus(prev => ({ ...prev, [data.member]: 'connected' }));
                        setTeamMembers(prev => prev.map(m => 
                            m.name === data.member 
                                ? { ...m, isConnected: true, whatsappNumber: data.whatsapp_number }
                                : m
                        ));
                        showMessage(`✅ ${data.member} connected!`, 'success');
                        loadMemberStats();
                    } else if (data.type === 'disconnected') {
                        setMemberStatus(prev => ({ ...prev, [data.member]: 'disconnected' }));
                        setTeamMembers(prev => prev.map(m => 
                            m.name === data.member 
                                ? { ...m, isConnected: false }
                                : m
                        ));
                    } else if (data.type === 'logged_out') {
                        setMemberStatus(prev => ({ ...prev, [data.member]: 'disconnected' }));
                        setTeamMembers(prev => prev.map(m => 
                            m.name === data.member 
                                ? { ...m, isConnected: false, whatsappNumber: '' }
                                : m
                        ));
                        setQrCodes(prev => ({ ...prev, [data.member]: null }));
                        showMessage(`🔄 ${data.member} logged out. Click Connect to login again.`, 'info');
                    } else if (data.type === 'qr_ready') {
                        showMessage(`📱 ${data.member}: Click Connect to get new QR code`, 'info');
                    } else if (data.type === 'message_sent') {
                        showMessage(`✅ ${data.member}: Message sent to ${data.recipient}`, 'success');
                        loadMessageLogs();
                    } else if (data.type === 'status' || data.type === 'all_status') {
                        if (data.members) {
                            data.members.forEach(member => {
                                if (member.status === 'connected') {
                                    setTeamMembers(prev => prev.map(m => 
                                        m.name === member.member 
                                            ? { ...m, isConnected: true, whatsappNumber: member.whatsapp_number }
                                            : m
                                    ));
                                    setMemberStatus(prev => ({ ...prev, [member.member]: 'connected' }));
                                    setQrCodes(prev => ({ ...prev, [member.member]: null }));
                                } else if (member.status === 'qr' && member.qr) {
                                    setQrCodes(prev => ({ ...prev, [member.member]: member.qr }));
                                    setMemberStatus(prev => ({ ...prev, [member.member]: 'qr' }));
                                } else {
                                    setMemberStatus(prev => ({ ...prev, [member.member]: 'disconnected' }));
                                }
                            });
                        }
                    } else if (data.type === 'error') {
                        showMessage(`❌ Error: ${data.message}`, 'error');
                    }
                } catch (error) {
                    console.error('Error parsing WebSocket message:', error);
                }
            };

            ws.onerror = () => {
                setStatusMessage('⚠️ Connection error');
            };

            ws.onclose = () => {
                console.log('WebSocket closed');
                setTimeout(() => connectWhatsApp(), 3000);
            };
        } catch (error) {
            console.error('WebSocket connection error:', error);
            setStatusMessage('❌ Could not connect to WhatsApp service');
        }
    };

    // ===== LOGOUT SINGLE MEMBER =====
    const handleLogoutMember = (memberName) => {
        if (!window.confirm(`Logout "${memberName}" from WhatsApp?`)) return;
        
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ 
                type: 'logout_member', 
                memberName: memberName 
            }));
            setMemberStatus(prev => ({ ...prev, [memberName]: 'disconnected' }));
            setTeamMembers(prev => prev.map(m => 
                m.name === memberName 
                    ? { ...m, isConnected: false, whatsappNumber: '' }
                    : m
            ));
            setQrCodes(prev => ({ ...prev, [memberName]: null }));
            showMessage(`🔄 ${memberName} logged out. New QR will be generated.`, 'info');
        }
    };

    // ===== LOGIN SINGLE MEMBER =====
    const handleLoginMember = (memberName) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            setQrCodes(prev => ({ ...prev, [memberName]: null }));
            setMemberStatus(prev => ({ ...prev, [memberName]: 'connecting' }));
            
            wsRef.current.send(JSON.stringify({ 
                type: 'login_member', 
                memberName: memberName 
            }));
            showMessage(`🔄 Connecting ${memberName}...`, 'info');
        }
    };

    // ===== EDIT MEMBER NAME =====
    const handleEditMember = (member) => {
        setEditMemberId(member.id);
        setEditMemberName(member.name);
        setEditingMember(member);
        setShowEditMember(true);
    };

    const handleSaveMemberName = () => {
        if (!editMemberName.trim()) {
            showMessage('Please enter a name', 'error');
            return;
        }
        const oldName = editingMember?.name;
        const updatedMembers = teamMembers.map(member => {
            if (member.id === editMemberId) {
                return { ...member, name: editMemberName.trim() };
            }
            return member;
        });
        setTeamMembers(updatedMembers);
        
        if (selectedMember === oldName) {
            setSelectedMember(editMemberName.trim());
        }
        
        setShowEditMember(false);
        setEditingMember(null);
        setEditMemberName('');
        setEditMemberId(null);
        showMessage(`✅ Member name updated to "${editMemberName.trim()}"`, 'success');
    };

    // ===== PRESET MANAGEMENT =====
    const handleCreatePreset = async (e) => {
        e.preventDefault();
        setPresetLoading(true);
        try {
            await api.post('/presets', presetFormData);
            showMessage('✅ Preset created successfully!', 'success');
            loadPresets();
            setPresetFormData({ name: '', message: '' });
            setShowPresetModal(false);
        } catch (error) {
            console.error('Error creating preset:', error);
            showMessage('Failed to create preset', 'error');
        } finally {
            setPresetLoading(false);
        }
    };

    const handleUpdatePreset = async (e) => {
        e.preventDefault();
        setPresetLoading(true);
        try {
            await api.put(`/presets/${editingPreset.id}`, presetFormData);
            showMessage('✅ Preset updated successfully!', 'success');
            loadPresets();
            setPresetFormData({ name: '', message: '' });
            setShowPresetModal(false);
            setEditingPreset(null);
        } catch (error) {
            console.error('Error updating preset:', error);
            showMessage('Failed to update preset', 'error');
        } finally {
            setPresetLoading(false);
        }
    };

    const handleDeletePreset = async (id, name) => {
        if (!window.confirm(`Delete preset "${name}"?`)) return;
        try {
            await api.delete(`/presets/${id}`);
            showMessage(`🗑️ "${name}" deleted!`, 'success');
            loadPresets();
            if (selectedPreset === String(id)) {
                setSelectedPreset('');
            }
        } catch (error) {
            console.error('Error deleting preset:', error);
            showMessage('Failed to delete preset', 'error');
        }
    };

    // ===== APPLY AUTOMATION RULE =====
    const applyRule = (ruleId) => {
        const rule = automationRules.find(r => r.id === parseInt(ruleId));
        if (!rule) return;
        
        setTargetGroup(rule.target_group || 'Daily Reach');
        setSelectedInterests(rule.target_interest ? [rule.target_interest] : []);
        setSelectedYatra(rule.target_yatra || '');
        setSelectedTemplate(rule.template_id || '');
        setCustomMessage(rule.custom_message || '');
        
        showMessage(`✅ Applied rule: ${rule.rule_name}`, 'success');
    };

    // ===== CLEAR FORM =====
    const clearForm = () => {
        setSelectedTemplate('');
        setCustomMessage('');
        setSelectedPreset('');
        setTargetGroup('Daily Reach');
        setSelectedInterests([]);
        setSelectedYatra('');
        setSelectedMember('Member 1');
        setPreviewCount(0);
        setPreviewCustomers([]);
        setShowPreview(false);
        removeAttachment();
    };

    // ===== ATTACHMENT HANDLER =====
    const handleAttachmentUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 10 * 1024 * 1024) {
            showMessage('❌ File size must be less than 10MB', 'error');
            e.target.value = '';
            return;
        }

        const isPDF = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
        const isImage = file.type.startsWith('image/') || 
                        file.name.toLowerCase().endsWith('.jpg') || 
                        file.name.toLowerCase().endsWith('.jpeg') || 
                        file.name.toLowerCase().endsWith('.png') || 
                        file.name.toLowerCase().endsWith('.gif') || 
                        file.name.toLowerCase().endsWith('.webp');

        if (!isPDF && !isImage) {
            showMessage('❌ Only PDF and Image files allowed', 'error');
            e.target.value = '';
            return;
        }

        showMessage(`📤 Uploading ${isPDF ? 'PDF' : 'Image'}...`, 'info');

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const base64 = event.target.result;
                const base64Data = base64.split(',')[1];
                
                setAttachmentBase64(base64Data);
                setAttachmentName(file.name);
                setAttachmentFile(file);
                setAttachmentType(isPDF ? 'pdf' : 'image');
                
                if (isImage) {
                    setAttachmentPreview(base64);
                } else {
                    setAttachmentPreview('');
                }
                
                const sizeKB = (file.size / 1024).toFixed(1);
                showMessage(`✅ "${file.name}" attached (${sizeKB} KB)`, 'success');
                e.target.value = '';
            } catch (error) {
                console.error('Error reading file:', error);
                showMessage('❌ Failed to read file', 'error');
            }
        };
        
        reader.onerror = () => {
            showMessage('❌ Error reading file', 'error');
        };
        
        reader.readAsDataURL(file);
    };

    const removeAttachment = () => {
        setAttachmentBase64('');
        setAttachmentName('');
        setAttachmentFile(null);
        setAttachmentType('');
        setAttachmentPreview('');
        document.getElementById('fileInput').value = '';
    };

    // ===== GET COMBINED MESSAGE =====
    const getCombinedMessage = () => {
        let parts = [];
        
        if (selectedTemplate) {
            const template = templates.find(t => t.id === parseInt(selectedTemplate));
            if (template?.message) parts.push(template.message);
        }
        
        if (customMessage.trim()) {
            parts.push(customMessage.trim());
        }
        
        if (selectedPreset) {
            const preset = presetMessages.find(p => p.id === parseInt(selectedPreset));
            if (preset?.message) parts.push(preset.message);
        }
        
        return parts.join('\n\n---\n\n');
    };

    // ===== PREVIEW =====
    const handlePreview = async () => {
        try {
            setLoading(true);
            const payload = {
                target_group: targetGroup,
                interests: selectedInterests,
                yatra: selectedYatra
            };
            
            console.log('📤 Preview payload:', payload);
            const response = await api.post('/broadcast/preview', payload);
            
            console.log('📥 Preview response status:', response.status);
            console.log('📥 Customers count:', response.data?.count || 0);
            
            setPreviewCustomers(response.data.customers || []);
            setPreviewCount(response.data.count || 0);
            setShowPreview(true);
            
            if (response.data.count === 0) {
                showMessage('No customers found matching the criteria', 'info');
            } else {
                showMessage(`✅ Found ${response.data.count} customers`, 'success');
            }
        } catch (error) {
            console.error('❌ Error previewing:', error);
            showMessage('Failed to preview customers: ' + (error.response?.data?.error || error.message), 'error');
        } finally {
            setLoading(false);
        }
    };

    // ===== SEND MANUAL =====
    const handleSendManual = async () => {
        const combinedMessage = getCombinedMessage();
        
        if (!combinedMessage) {
            showMessage('Please compose a message first!', 'error');
            return;
        }

        if (previewCount === 0) {
            showMessage('Please preview customers first!', 'error');
            return;
        }

        const member = teamMembers.find(m => m.name === selectedMember);
        if (!member) {
            showMessage('Please select a valid member', 'error');
            return;
        }

        if (!testMode && !member.isConnected) {
            showMessage(`⚠️ ${member.name} is not connected to WhatsApp!`, 'error');
            return;
        }

        const parts = [];
        if (selectedTemplate) parts.push('Template');
        if (customMessage.trim()) parts.push('Custom');
        if (selectedPreset) parts.push('Preset');
        
        let confirmMessage = `Send combined message (${parts.join(' + ')}) to ${previewCount} customers?`;
        if (attachmentName) {
            const fileType = attachmentType === 'pdf' ? '📄 PDF' : '🖼️ Image';
            confirmMessage += `\n${fileType} Attachment: ${attachmentName}`;
        }
        
        if (!window.confirm(confirmMessage)) return;

        setLoading(true);
        setSendingProgress(0);
        try {
            let response;
            
            if (testMode) {
                const total = previewCount;
                for (let i = 0; i < total; i += 15) {
                    setSendingProgress(((i + 15) / total) * 100);
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
                response = { data: { sent: previewCount, failed: 0 } };
                showMessage(`🧪 TEST MODE: ${previewCount} messages would be sent!${attachmentName ? ` (with attachment: ${attachmentName})` : ''}`, 'success');
            } else {
                const payload = {
                    target_group: targetGroup,
                    interests: selectedInterests,
                    yatra: selectedYatra,
                    message: combinedMessage,
                    team_member: member.name,
                    attachment: attachmentBase64 || null,
                    attachment_name: attachmentName || null,
                    attachment_type: attachmentType || null,
                    message_parts: parts.join(' + ')
                };
                
                response = await api.post('/broadcast/send', payload);
                showMessage(`✅ ${response.data.sent || previewCount} messages sent by ${member.name}!${attachmentName ? ` (with attachment: ${attachmentName})` : ''}`, 'success');
            }
            
            await loadMessageLogs();
            
            if (!testMode && response.data.sent) {
                setTeamMembers(prev => prev.map(m => 
                    m.name === member.name 
                        ? { ...m, todaySent: m.todaySent + response.data.sent }
                        : m
                ));
            }
            
            clearForm();
            setSendingProgress(100);
            setTimeout(() => setSendingProgress(0), 3000);
            showMessage('✅ Form cleared! Ready for next broadcast.', 'info');
            
        } catch (error) {
            console.error('Error sending broadcast:', error);
            showMessage('Failed to send broadcast: ' + (error.response?.data?.error || error.message), 'error');
        } finally {
            setLoading(false);
        }
    };

    // ===== AUTO SEND =====
    const handleAutoSend = async () => {
        const combinedMessage = getCombinedMessage();
        
        if (!combinedMessage) {
            showMessage('Please compose a message first!', 'error');
            return;
        }

        if (previewCount === 0) {
            showMessage('Please preview customers first!', 'error');
            return;
        }

        const connectedMembers = teamMembers.filter(m => m.isConnected && m.todaySent < m.dailyLimit);
        if (!testMode && connectedMembers.length === 0) {
            showMessage('No connected members available to send messages!', 'error');
            return;
        }

        const totalCustomers = previewCount;
        const availableMembers = connectedMembers.length;
        const perMember = Math.ceil(totalCustomers / availableMembers);
        
        let distributionMsg = `Auto-send ${totalCustomers} customers to ${availableMembers} members:\n`;
        connectedMembers.forEach((m, i) => {
            const count = Math.min(perMember, totalCustomers - (i * perMember));
            if (count > 0) {
                distributionMsg += `  • ${m.name}: ${count} customers\n`;
            }
        });
        distributionMsg += attachmentName ? `\n📎 Attachment: ${attachmentName}` : '';
        
        if (!window.confirm(distributionMsg)) return;

        setLoading(true);
        setSendingProgress(0);
        try {
            let response;
            
            if (testMode) {
                const total = previewCount;
                for (let i = 0; i < total; i += 15) {
                    setSendingProgress(((i + 15) / total) * 100);
                    await new Promise(resolve => setTimeout(resolve, 300));
                }
                response = { data: { sent: previewCount, failed: 0 } };
                showMessage(`🧪 TEST MODE: ${previewCount} messages would be sent across ${availableMembers} members!${attachmentName ? ` (with attachment: ${attachmentName})` : ''}`, 'success');
            } else {
                const payload = {
                    target_group: targetGroup,
                    interests: selectedInterests,
                    yatra: selectedYatra,
                    message: combinedMessage,
                    attachment: attachmentBase64 || null,
                    attachment_name: attachmentName || null,
                    attachment_type: attachmentType || null,
                    members: connectedMembers.map(m => m.name)
                };
                
                response = await api.post('/broadcast/auto-send-balanced', payload);
                showMessage(`✅ ${response.data.sent || previewCount} messages sent across ${availableMembers} members!${attachmentName ? ` (with attachment: ${attachmentName})` : ''}`, 'success');
            }
            
            await loadMessageLogs();
            
            clearForm();
            setSendingProgress(100);
            setTimeout(() => setSendingProgress(0), 3000);
            showMessage('✅ Form cleared! Ready for next broadcast.', 'info');
            
        } catch (error) {
            console.error('Error auto-sending:', error);
            showMessage('Failed to auto-send: ' + (error.response?.data?.error || error.message), 'error');
        } finally {
            setLoading(false);
        }
    };

    // ===== AUTO BROADCAST =====
    const handleAutoBroadcast = async () => {
        const combinedMessage = getCombinedMessage();
        
        if (!combinedMessage) {
            showMessage('Please compose a message first!', 'error');
            return;
        }

        if (previewCount === 0) {
            showMessage('Please preview customers first!', 'error');
            return;
        }

        const member = teamMembers.find(m => m.name === selectedMember);
        if (!member) {
            showMessage('Please select a valid member', 'error');
            return;
        }

        if (!testMode && !member.isConnected) {
            showMessage(`⚠️ ${member.name} is not connected to WhatsApp!`, 'error');
            return;
        }

        const memberStat = memberStats.find(s => s.memberName === selectedMember);
        if (!testMode && memberStat && memberStat.remaining <= 0) {
            showMessage(`⚠️ ${selectedMember} has reached daily limit!`, 'error');
            return;
        }

        const customersToSend = Math.min(previewCount, testMode ? previewCount : (memberStat?.remaining || 250));
        const batchSize = 15;
        const totalBatches = Math.ceil(customersToSend / batchSize);
        
        let confirmMsg = `Start auto-broadcast for ${selectedMember}?\n\n`;
        confirmMsg += `📊 Customers: ${customersToSend}\n`;
        confirmMsg += `📦 Batch Size: ${batchSize} messages\n`;
        confirmMsg += `📦 Total Batches: ${totalBatches}\n`;
        confirmMsg += `⏰ Pause: 30 seconds between batches\n`;
        if (attachmentName) {
            confirmMsg += `\n📎 Attachment: ${attachmentName}`;
        }
        confirmMsg += `\n${testMode ? '🧪 TEST MODE - No actual messages will be sent' : `📈 Daily Limit: ${memberStat?.remaining || 250} remaining today`}`;
        
        if (!window.confirm(confirmMsg)) return;

        setLoading(true);
        try {
            let response;
            
            if (testMode) {
                await new Promise(resolve => setTimeout(resolve, 1500));
                response = { 
                    data: { 
                        success: true, 
                        totalCustomers: customersToSend, 
                        totalBatches: totalBatches, 
                        estimatedHours: Math.ceil((totalBatches * 30) / 3600)
                    } 
                };
            } else {
                const payload = {
                    memberId: member.id,
                    memberName: member.name,
                    filters: {
                        target_group: targetGroup,
                        target_interest: selectedInterests[0] || '',
                        target_yatra: selectedYatra || ''
                    },
                    message: combinedMessage,
                    attachment: attachmentBase64 || null,
                    attachment_name: attachmentName || null,
                    attachment_type: attachmentType || null,
                    batchSize: batchSize,
                    pauseSeconds: 30
                };

                response = await api.post('/auto-broadcast/start-queue', payload);
            }
            
            if (response.data.success) {
                setBroadcastId(response.data.broadcastId || 'test_' + Date.now());
                setAutoStatus({
                    status: 'running',
                    totalCustomers: response.data.totalCustomers || customersToSend,
                    totalBatches: response.data.totalBatches || totalBatches,
                    currentBatch: 0,
                    sentCount: 0,
                    failedCount: 0,
                    batchSize: batchSize,
                    pauseSeconds: 30,
                    estimatedHours: response.data.estimatedHours || Math.ceil((totalBatches * 30) / 3600)
                });
                setAutoMode(true);
                
                showMessage(`✅ Auto-broadcast started! ${customersToSend} customers, ${totalBatches} batches${attachmentName ? ` (with attachment: ${attachmentName})` : ''}`, 'success');
                
                clearForm();
                showMessage('✅ Form cleared! Auto-broadcast running in background.', 'info');
            } else {
                showMessage('Failed to start: ' + response.data.message, 'error');
            }
        } catch (error) {
            console.error('Error starting auto-broadcast:', error);
            showMessage('Failed to start auto-broadcast', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handlePauseResume = () => {
        setIsPaused(!isPaused);
        if (isPaused) {
            showMessage('▶️ Auto-broadcast resumed', 'success');
        } else {
            showMessage('⏸️ Auto-broadcast paused', 'info');
        }
    };

    const handleStopAuto = async () => {
        if (!broadcastId) return;
        if (!window.confirm('Stop the auto-broadcast?')) return;
        
        try {
            if (!testMode) {
                await api.post(`/auto-broadcast/stop/${broadcastId}`);
            }
            showMessage('🛑 Auto-broadcast stopped', 'info');
            setAutoMode(false);
            setAutoStatus(null);
            setBroadcastId(null);
            setBatchQueue([]);
            setSendingProgress(0);
            loadMemberStats();
        } catch (error) {
            console.error('Error stopping auto-broadcast:', error);
            showMessage('Failed to stop auto-broadcast', 'error');
        }
    };

    // ===== RETRY FAILED MESSAGES =====
    const retryFailedMessages = async () => {
        const failedLogs = messageLogs.filter(log => log.status === 'Failed');
        if (failedLogs.length === 0) {
            showMessage('No failed messages to retry', 'info');
            return;
        }
        
        if (!window.confirm(`Retry ${failedLogs.length} failed messages?`)) return;
        
        setLoading(true);
        try {
            const response = await api.post('/broadcast/retry', {
                logs: failedLogs.map(log => log.id)
            });
            showMessage(`✅ ${response.data.sent || 0} messages retried successfully!`, 'success');
            await loadMessageLogs();
        } catch (error) {
            console.error('Error retrying messages:', error);
            showMessage('❌ Failed to retry messages: ' + (error.response?.data?.error || error.message), 'error');
        } finally {
            setLoading(false);
        }
    };

    const showMessage = (text, type = "success") => {
        setMessage({ text, type });
        setTimeout(() => setMessage({ text: "", type: "" }), 5000);
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // ===== EXPORT LOGS =====
    const exportLogs = () => {
        if (messageLogs.length === 0) {
            showMessage('No logs to export', 'error');
            return;
        }

        const headers = ['#', 'Member', 'Recipient', 'Message', 'Status', 'Date', 'Parts'];
        const rows = messageLogs.map((log, index) => [
            index + 1,
            log.team_member || 'Unknown',
            log.recipient || 'N/A',
            log.message || 'N/A',
            log.status || 'Sent',
            new Date(log.created_at).toLocaleString(),
            log.message_parts || 'Single'
        ]);

        let csv = headers.join(',') + '\n';
        rows.forEach(row => {
            csv += row.join(',') + '\n';
        });

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `broadcast_logs_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        showMessage('📥 Logs exported successfully!', 'success');
    };

    // ===== RENDER =====
    return (
        <div className={`p-6 max-w-7xl mx-auto ${isDarkMode ? 'dark bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'}`}>
            {/* Dark Mode Toggle */}
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold">📢 Broadcast & WhatsApp</h1>
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
            </div>

            {/* Test Mode Banner */}
            {testMode && (
                <div className="mb-4 p-3 bg-yellow-100 border border-yellow-400 rounded-lg text-yellow-800 text-center">
                    🧪 <strong>TEST MODE</strong> - No actual messages will be sent.
                    <button 
                        onClick={() => setTestMode(false)}
                        className="ml-3 px-3 py-1 bg-yellow-500 hover:bg-yellow-600 text-white rounded text-xs"
                    >
                        Switch to Live Mode
                    </button>
                </div>
            )}

            {/* Message */}
            {message.text && (
                <div className={`p-4 rounded-xl mb-4 ${
                    message.type === 'error' ? 'bg-red-100 text-red-700 border border-red-200' :
                    message.type === 'info' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                    'bg-green-100 text-green-700 border border-green-200'
                }`}>
                    {message.text}
                </div>
            )}

            {/* Stats Dashboard */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
                <div className={`rounded-lg shadow p-4 border-l-4 border-blue-500 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                    <p className="text-xs text-gray-500 uppercase">Connected</p>
                    <p className="text-2xl font-bold">{stats.connectedMembers}/4</p>
                </div>
                <div className={`rounded-lg shadow p-4 border-l-4 border-green-500 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                    <p className="text-xs text-gray-500 uppercase">Total Sent</p>
                    <p className="text-2xl font-bold text-green-600">{stats.totalMessages}</p>
                </div>
                <div className={`rounded-lg shadow p-4 border-l-4 border-yellow-500 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                    <p className="text-xs text-gray-500 uppercase">Today</p>
                    <p className="text-2xl font-bold text-yellow-600">{stats.todaySent}</p>
                </div>
                <div className={`rounded-lg shadow p-4 border-l-4 border-red-500 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                    <p className="text-xs text-gray-500 uppercase">Failed</p>
                    <p className="text-2xl font-bold text-red-600">{stats.failedCount}</p>
                </div>
                <div className={`rounded-lg shadow p-4 border-l-4 border-purple-500 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                    <p className="text-xs text-gray-500 uppercase">Success Rate</p>
                    <p className="text-2xl font-bold text-purple-600">{stats.successRate.toFixed(1)}%</p>
                </div>
                <div className={`rounded-lg shadow p-4 border-l-4 border-orange-500 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                    <p className="text-xs text-gray-500 uppercase">Auto Batch</p>
                    <p className="text-2xl font-bold text-orange-600">
                        {autoMode ? '🟢 Running' : '⚪ Idle'}
                    </p>
                </div>
            </div>

            {/* Team Members */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {teamMembers.map((member) => {
                    const stat = memberStats.find(s => s.memberName === member.name);
                    const qrData = qrCodes[member.name];
                    
                    return (
                        <div 
                            key={member.id} 
                            className={`rounded-lg shadow p-4 border-2 ${member.name === selectedMember ? 'border-blue-500' : 'border-gray-200'} ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}
                            onClick={() => {
                                setSelectedMember(member.name);
                                setMemberTodaySent(member.todaySent);
                            }}
                            style={{ cursor: 'pointer' }}
                        >
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-medium">{member.name}</p>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleEditMember(member);
                                            }}
                                            className="text-xs text-blue-500 hover:text-blue-700"
                                        >
                                            ✏️
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${member.isConnected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {member.isConnected ? '🟢 Online' : '🔴 Offline'}
                                        </span>
                                        {member.whatsappNumber && (
                                            <span className="text-xs text-gray-400">📱 {member.whatsappNumber}</span>
                                        )}
                                    </div>
                                </div>
                                <span className={`px-2 py-0.5 rounded-full text-xs ${member.todaySent >= member.dailyLimit ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                    {stat?.remaining || member.dailyLimit}/{member.dailyLimit}
                                </span>
                            </div>
                            <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
                                <div 
                                    className={`h-1.5 rounded-full ${member.todaySent >= member.dailyLimit ? 'bg-red-500' : 'bg-blue-500'}`}
                                    style={{ width: `${Math.min((member.todaySent / member.dailyLimit) * 100, 100)}%` }}
                                ></div>
                            </div>
                            <p className="text-xs text-gray-400 mt-1">
                                {member.dailyLimit - member.todaySent} remaining
                            </p>
                            
                            {/* QR Code Display - FIXED */}
                            {qrData && !member.isConnected && (
                                <div className="mt-3 p-2 bg-gray-50 rounded-lg text-center dark:bg-gray-700">
                                    {qrData.startsWith('data:image') ? (
                                        <img 
                                            src={qrData}
                                            alt={`${member.name} QR`} 
                                            className="mx-auto w-32 h-32 border border-gray-200 rounded-lg dark:border-gray-600"
                                        />
                                    ) : (
                                        <img 
                                            src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrData)}`}
                                            alt={`${member.name} QR`} 
                                            className="mx-auto w-32 h-32 border border-gray-200 rounded-lg dark:border-gray-600"
                                            onError={(e) => {
                                                console.error('QR image failed to load for', member.name);
                                                e.target.style.display = 'none';
                                                const parent = e.target.parentElement;
                                                const fallback = document.createElement('div');
                                                fallback.className = 'text-xs text-gray-500 p-2 bg-gray-100 rounded dark:bg-gray-600 dark:text-gray-300';
                                                fallback.textContent = '📱 Scan QR with WhatsApp';
                                                parent.appendChild(fallback);
                                            }}
                                        />
                                    )}
                                    <p className="text-xs text-gray-500 mt-1 dark:text-gray-400">📱 Scan with WhatsApp</p>
                                    <p className="text-xs text-blue-500 mt-1 dark:text-blue-400">Open WhatsApp → Settings → Linked Devices</p>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleLoginMember(member.name);
                                        }}
                                        className="mt-2 bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs transition"
                                    >
                                        🔄 Refresh QR
                                    </button>
                                </div>
                            )}
                            
                            <div className="mt-3 flex gap-2">
                                {!member.isConnected && !qrData && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleLoginMember(member.name);
                                        }}
                                        className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-xs transition flex-1"
                                    >
                                        🔌 Connect
                                    </button>
                                )}
                                {member.isConnected && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleLogoutMember(member.name);
                                        }}
                                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs transition flex-1"
                                    >
                                        🚪 Logout
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Assign Number Modal */}
            {showAssignModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className={`rounded-lg max-w-md w-full p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold">📞 Assign WhatsApp Number</h3>
                            <button
                                onClick={() => setShowAssignModal(false)}
                                className="text-gray-500 hover:text-gray-700 text-xl"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Select Member</label>
                                <select
                                    value={assignMember}
                                    onChange={(e) => setAssignMember(e.target.value)}
                                    className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                                >
                                    {teamMembers.map((m) => (
                                        <option key={m.id} value={m.name}>{m.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">WhatsApp Number</label>
                                <input
                                    type="text"
                                    value={assignPhone}
                                    onChange={(e) => setAssignPhone(e.target.value)}
                                    className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                                    placeholder="e.g., 919311310550"
                                />
                                <p className="text-xs text-gray-400 mt-1">Enter with country code</p>
                            </div>
                        </div>
                        <div className="mt-6 flex gap-3">
                            <button
                                onClick={handleAssignNumber}
                                disabled={assignLoading}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition disabled:opacity-50"
                            >
                                {assignLoading ? '⏳ Assigning...' : '💾 Assign Number'}
                            </button>
                            <button
                                onClick={() => setShowAssignModal(false)}
                                className="bg-gray-300 hover:bg-gray-400 px-6 py-2 rounded-lg transition"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Member Modal */}
            {showEditMember && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className={`rounded-lg max-w-md w-full p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                        <h3 className="text-xl font-bold mb-4">✏️ Edit Member Name</h3>
                        <input
                            type="text"
                            value={editMemberName}
                            onChange={(e) => setEditMemberName(e.target.value)}
                            className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                            placeholder="Enter new name"
                        />
                        <div className="mt-4 flex gap-3">
                            <button
                                onClick={handleSaveMemberName}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition"
                            >
                                💾 Save
                            </button>
                            <button
                                onClick={() => {
                                    setShowEditMember(false);
                                    setEditingMember(null);
                                }}
                                className="bg-gray-300 hover:bg-gray-400 px-6 py-2 rounded-lg transition"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Broadcast Form - Split into Manual & Automatic Sections */}
            
            {/* ============================================ */}
            {/* SECTION 1: AUTOMATIC BROADCAST */}
            {/* ============================================ */}
            <div className={`rounded-lg shadow p-6 mb-6 border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <div className="flex items-center gap-3 mb-4">
                    <span className="text-2xl">🤖</span>
                    <h2 className="text-xl font-bold text-purple-600">Automatic Broadcast</h2>
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">AI Powered</span>
                </div>
                <p className="text-sm text-gray-500 mb-4">Select a rule and let the system automatically distribute messages to all connected members</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Select Automation Rule</label>
                        <select
                            value={selectedAutomationRule}
                            onChange={(e) => {
                                setSelectedAutomationRule(e.target.value);
                                if (e.target.value) {
                                    applyAutomationRule(e.target.value);
                                }
                            }}
                            className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-purple-500 ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                        >
                            <option value="">Select a rule...</option>
                            {automationRulesList.map((rule) => (
                                <option key={rule.id} value={rule.id}>
                                    {rule.rule_name} ({rule.target_group || 'All'} | {rule.members || 'All Members'})
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-end gap-2">
                        <button
                            onClick={startAutomationWithRule}
                            disabled={loading || isAutomationRunning || previewCount === 0 || !selectedAutomationRule}
                            className={`w-full px-6 py-2 rounded-lg transition ${isAutomationRunning ? 'bg-yellow-500 text-white' : 'bg-purple-600 hover:bg-purple-700 text-white'} disabled:opacity-50`}
                        >
                            {isAutomationRunning ? '⏳ Running...' : '🚀 Start Automation'}
                        </button>
                        {isAutomationRunning && (
                            <button
                                onClick={stopAutomation}
                                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
                            >
                                🛑 Stop
                            </button>
                        )}
                    </div>
                </div>
                
                {isAutomationRunning && automationStatusDetails && (
                    <div className="mt-4 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">Progress: {automationProgress}%</span>
                            <span className="text-sm text-gray-500">
                                {automationStatusDetails.sentCount || 0}/{automationStatusDetails.totalCustomers || 0} sent
                            </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-2 dark:bg-gray-700">
                            <div 
                                className="bg-purple-600 h-2 rounded-full transition-all duration-500"
                                style={{ width: `${automationProgress}%` }}
                            ></div>
                        </div>
                        {automationStatusDetails.members && (
                            <div className="mt-2 flex gap-4 text-xs text-gray-500 flex-wrap">
                                {automationStatusDetails.members.map((m, i) => (
                                    <span key={i}>{m.name}: {m.sent || 0}/{m.total || 0}</span>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* ============================================ */}
            {/* SECTION 2: MANUAL BROADCAST */}
            {/* ============================================ */}
            <div className={`rounded-lg shadow p-6 mb-6 border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <div className="flex items-center gap-3 mb-4">
                    <span className="text-2xl">🖐️</span>
                    <h2 className="text-xl font-bold text-blue-600">Manual Broadcast</h2>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">Manual Control</span>
                </div>
                <p className="text-sm text-gray-500 mb-4">Manually compose and send messages to selected customers</p>
                
                <div className="flex justify-between items-center mb-4">
                    <button
                        onClick={() => setShowAssignModal(true)}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm transition"
                    >
                        📞 Assign Number
                    </button>
                </div>
                
                <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Select Team Member</label>
                    <select
                        value={selectedMember}
                        onChange={(e) => {
                            setSelectedMember(e.target.value);
                            const member = teamMembers.find(m => m.name === e.target.value);
                            if (member) {
                                setMemberTodaySent(member.todaySent);
                            }
                        }}
                        className={`w-full md:w-1/2 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                    >
                        {teamMembers.map((member) => (
                            <option key={member.id} value={member.name}>
                                {member.name} ({member.isConnected ? '🟢 Connected' : '🔴 Offline'} | {member.dailyLimit - member.todaySent} remaining)
                            </option>
                        ))}
                    </select>
                    {!teamMembers.find(m => m.name === selectedMember)?.isConnected && !testMode && (
                        <p className="text-xs text-red-500 mt-1">⚠️ Selected member is not connected</p>
                    )}
                </div>

                {/* Template Rules (Existing) */}
                <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200 dark:bg-blue-900/20 dark:border-blue-800">
                    <div className="flex items-center gap-4 flex-wrap">
                        <input
                            type="checkbox"
                            checked={useRule}
                            onChange={(e) => {
                                setUseRule(e.target.checked);
                                if (!e.target.checked) {
                                    setSelectedRule('');
                                    setTargetGroup('Daily Reach');
                                    setSelectedInterests([]);
                                    setSelectedYatra('');
                                    setSelectedTemplate('');
                                    setCustomMessage('');
                                }
                            }}
                            className="w-4 h-4 text-blue-600"
                        />
                        <label className="text-sm font-medium">Use Template Rule</label>
                        <select
                            value={selectedRule}
                            onChange={(e) => {
                                setSelectedRule(e.target.value);
                                if (e.target.value) applyRule(e.target.value);
                            }}
                            disabled={!useRule}
                            className={`flex-1 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 disabled:opacity-50 ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                        >
                            <option value="">Select a template...</option>
                            {automationRules.filter(r => r.status === 'Active').map((rule) => (
                                <option key={rule.id} value={rule.id}>
                                    {rule.rule_name} ({rule.target_group || 'All'})
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {!useRule && (
                    <div className="grid md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Target Group</label>
                            <select
                                value={targetGroup}
                                onChange={(e) => setTargetGroup(e.target.value)}
                                className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                            >
                                <option value="Daily Reach">Daily Reach</option>
                                <option value="Do Not Reach">Do Not Reach</option>
                                <option value="Unsubscribed">Unsubscribed</option>
                                <option value="All">All Customers</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Interest Filter</label>
                            <select
                                value={selectedInterests[0] || ''}
                                onChange={(e) => setSelectedInterests(e.target.value ? [e.target.value] : [])}
                                className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
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
                            <label className="block text-sm font-medium mb-1">Yatra Filter</label>
                            <select
                                value={selectedYatra}
                                onChange={(e) => setSelectedYatra(e.target.value)}
                                className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
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
                )}

                {/* Message Section */}
                <div className="mt-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 dark:bg-blue-900/20 dark:border-blue-800">
                        <p className="text-sm text-blue-700 font-medium dark:text-blue-300">💡 Compose Your Message</p>
                        <p className="text-xs text-blue-600 dark:text-blue-400">Select a preset, template, or type your own message.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4">
                        <div className={`border rounded-lg p-3 ${selectedPreset ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' : isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                            <label className="text-sm font-medium">📋 Preset</label>
                            <select
                                value={selectedPreset}
                                onChange={(e) => setSelectedPreset(e.target.value)}
                                className={`w-full p-2 border rounded-lg text-sm mt-1 ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                            >
                                <option value="">Select a preset...</option>
                                {presetMessages.map((preset) => (
                                    <option key={preset.id} value={String(preset.id)}>
                                        {preset.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className={`border rounded-lg p-3 ${selectedTemplate ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                            <label className="text-sm font-medium">📌 Template</label>
                            <select
                                value={selectedTemplate}
                                onChange={(e) => setSelectedTemplate(e.target.value)}
                                className={`w-full p-2 border rounded-lg text-sm mt-1 ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                            >
                                <option value="">Select a template...</option>
                                {templates.map((template) => (
                                    <option key={template.id} value={template.id}>
                                        {template.template_name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className={`border rounded-lg p-3 ${customMessage.trim() ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                            <label className="text-sm font-medium">✏️ Custom Message</label>
                            <textarea
                                value={customMessage}
                                onChange={(e) => setCustomMessage(e.target.value)}
                                className={`w-full p-2 border rounded-lg text-sm mt-1 ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                                rows="3"
                                placeholder="Type your message..."
                            />
                        </div>
                    </div>
                </div>

                {/* Combined Message Preview */}
                {getCombinedMessage() && (
                    <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200 dark:from-blue-900/20 dark:to-purple-900/20 dark:border-blue-800">
                        <div className="flex justify-between items-start">
                            <div className="flex-1">
                                <p className="text-xs font-medium text-gray-700 mb-1 dark:text-gray-300">📝 Message Preview:</p>
                                <div className={`p-3 rounded-lg border shadow-sm ${isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'}`}>
                                    <p className="text-sm whitespace-pre-wrap break-words dark:text-gray-300">
                                        {getCombinedMessage()}
                                    </p>
                                    {attachmentName && (
                                        <div className="mt-2 flex items-center gap-2 text-xs text-gray-500 border-t border-gray-100 pt-2 dark:border-gray-700">
                                            <span>📎 {attachmentName}</span>
                                            <span className="text-gray-300">|</span>
                                            <span>{attachmentType === 'pdf' ? '📄 PDF' : '🖼️ Image'}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(getCombinedMessage());
                                    showMessage('📋 Message copied to clipboard!', 'success');
                                }}
                                className="ml-4 text-blue-600 hover:text-blue-800 text-sm dark:text-blue-400"
                                title="Copy message"
                            >
                                📋 Copy
                            </button>
                        </div>
                    </div>
                )}

                {/* Attachment Section */}
                <div className="mt-4">
                    <label className="block text-sm font-medium mb-1">
                        📎 Attach File (PDF or Image)
                        <span className="text-xs text-gray-400 ml-2">(Max 10MB)</span>
                    </label>
                    <div className="flex flex-wrap items-center gap-3">
                        <input
                            id="fileInput"
                            type="file"
                            accept=".pdf,application/pdf,.jpg,.jpeg,.png,.gif,.webp,image/*"
                            onChange={handleAttachmentUpload}
                            className="hidden"
                        />
                        <button
                            onClick={() => document.getElementById('fileInput').click()}
                            className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg transition text-sm flex items-center gap-2 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                        >
                            <span className="text-lg">📄</span>
                            Choose File
                        </button>
                        {attachmentName ? (
                            <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2 dark:bg-green-900/20 dark:border-green-800">
                                <span className="text-green-600 text-lg dark:text-green-400">
                                    {attachmentType === 'pdf' ? '📄' : '🖼️'}
                                </span>
                                <span className="text-sm text-green-700 font-medium truncate max-w-xs dark:text-green-400">
                                    {attachmentName}
                                </span>
                                <span className="text-xs text-green-500 dark:text-green-400">
                                    ({(attachmentFile?.size / 1024 || 0).toFixed(1)} KB)
                                </span>
                                <button
                                    onClick={removeAttachment}
                                    className="text-red-500 hover:text-red-700 text-sm ml-2"
                                >
                                    ✕
                                </button>
                            </div>
                        ) : (
                            <span className="text-xs text-gray-400">No file selected</span>
                        )}
                    </div>
                    
                    {attachmentPreview && attachmentType === 'image' && (
                        <div className="mt-2 p-2 bg-gray-50 border border-gray-200 rounded-lg dark:bg-gray-700 dark:border-gray-600">
                            <p className="text-xs text-gray-600 mb-1 dark:text-gray-400">📷 Image Preview:</p>
                            <img 
                                src={attachmentPreview} 
                                alt="Attachment preview" 
                                className="max-w-xs max-h-32 rounded border border-gray-300 dark:border-gray-600"
                            />
                        </div>
                    )}
                    
                    {attachmentName && attachmentType === 'pdf' && (
                        <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg dark:bg-blue-900/20 dark:border-blue-800">
                            <p className="text-xs text-blue-700 dark:text-blue-400">📄 PDF will be attached to all messages</p>
                        </div>
                    )}
                    
                    {attachmentName && attachmentType === 'image' && (
                        <div className="mt-2 p-2 bg-purple-50 border border-purple-200 rounded-lg dark:bg-purple-900/20 dark:border-purple-800">
                            <p className="text-xs text-purple-700 dark:text-purple-400">🖼️ Image will be sent with all messages</p>
                        </div>
                    )}
                </div>

                {/* Manual Buttons */}
                <div className="mt-4 flex flex-wrap gap-3">
                    <button
                        onClick={handlePreview}
                        disabled={loading}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition disabled:opacity-50"
                    >
                        {loading ? '⏳ Loading...' : '🔍 Preview'}
                    </button>
                    <button
                        onClick={handleSendManual}
                        disabled={loading || previewCount === 0 || (!testMode && !teamMembers.find(m => m.name === selectedMember)?.isConnected)}
                        className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition disabled:opacity-50"
                    >
                        {loading ? '⏳ Sending...' : `📤 Manual Send (${previewCount})`}
                    </button>
                    <button
                        onClick={handleAutoSend}
                        disabled={loading || previewCount === 0 || (!testMode && !teamMembers.some(m => m.isConnected))}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition disabled:opacity-50"
                    >
                        🤖 Auto-Send (All Members)
                    </button>
                    <button
                        onClick={handleAutoBroadcast}
                        disabled={loading || previewCount === 0 || autoMode || (!testMode && !teamMembers.find(m => m.name === selectedMember)?.isConnected)}
                        className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded-lg transition disabled:opacity-50"
                    >
                        {autoMode ? '⏳ Running...' : `📦 Auto Batch (${selectedMember})`}
                    </button>
                    {autoMode && (
                        <>
                            <button
                                onClick={handlePauseResume}
                                className={`${isPaused ? 'bg-green-600 hover:bg-green-700' : 'bg-yellow-600 hover:bg-yellow-700'} text-white px-6 py-2 rounded-lg transition`}
                            >
                                {isPaused ? '▶️ Resume' : '⏸️ Pause'}
                            </button>
                            <button
                                onClick={handleStopAuto}
                                className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition"
                            >
                                🛑 Stop
                            </button>
                        </>
                    )}
                    {!teamMembers.some(m => m.isConnected) && !testMode && (
                        <span className="text-sm text-red-500 self-center">⚠️ No members connected</span>
                    )}
                    {teamMembers.find(m => m.name === selectedMember)?.isConnected && previewCount > 0 && !testMode && (
                        <span className="text-sm text-green-500 self-center">✅ {selectedMember} connected - {previewCount} customers ready</span>
                    )}
                    {testMode && previewCount > 0 && (
                        <span className="text-sm text-yellow-500 self-center">🧪 Test Mode - {previewCount} customers ready</span>
                    )}
                </div>

                {/* Sending Progress Bar */}
                {sendingProgress > 0 && (
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200 dark:bg-blue-900/20 dark:border-blue-800">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium text-blue-700 dark:text-blue-400">
                                {loading || autoMode ? '⏳ Processing...' : '✅ Complete!'}
                            </span>
                            <span className="text-sm text-blue-600 dark:text-blue-400">
                                {Math.round(sendingProgress)}%
                            </span>
                        </div>
                        <div className="w-full bg-blue-200 rounded-full h-2.5 dark:bg-blue-800">
                            <div 
                                className="bg-blue-600 h-2.5 rounded-full transition-all duration-500 dark:bg-blue-500"
                                style={{ width: `${sendingProgress}%` }}
                            ></div>
                        </div>
                        <p className="text-xs text-blue-600 mt-1 dark:text-blue-400">
                            {autoMode ? `Batch ${autoStatus?.currentBatch || 0}/${autoStatus?.totalBatches || 0}` : 'Sending in batches of 15 messages...'}
                        </p>
                    </div>
                )}

                {/* Auto Broadcast Status */}
                {autoMode && autoStatus && (
                    <div className="mt-4 p-4 bg-orange-50 rounded-lg border border-orange-200 dark:bg-orange-900/20 dark:border-orange-800">
                        <h4 className="font-semibold text-orange-800 mb-2 dark:text-orange-400">📦 Auto Broadcast Status</h4>
                        <div className="grid grid-cols-4 gap-4 text-sm">
                            <div>
                                <span className="text-gray-500">Status:</span>
                                <span className="ml-2 font-medium text-green-600 dark:text-green-400">
                                    {isPaused ? '⏸️ Paused' : '● Running'}
                                </span>
                            </div>
                            <div>
                                <span className="text-gray-500">Progress:</span>
                                <span className="ml-2 font-medium">
                                    {autoStatus.currentBatch || 0}/{autoStatus.totalBatches} batches
                                </span>
                            </div>
                            <div>
                                <span className="text-gray-500">Sent:</span>
                                <span className="ml-2 font-medium">{autoStatus.sentCount || 0}/{autoStatus.totalCustomers}</span>
                            </div>
                            <div>
                                <span className="text-gray-500">Next Batch:</span>
                                <span className="ml-2 font-medium">In {autoStatus.pauseSeconds || 30}s</span>
                            </div>
                        </div>
                        <div className="mt-2 w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                            <div 
                                className="h-2 rounded-full bg-orange-600 transition-all dark:bg-orange-500"
                                style={{ 
                                    width: `${((autoStatus.sentCount || 0) / (autoStatus.totalCustomers || 1)) * 100}%` 
                                }}
                            ></div>
                        </div>
                        <p className="text-xs text-gray-400 mt-1 dark:text-gray-500">
                            Estimated completion: ~{autoStatus.estimatedHours || 0} hours
                        </p>
                    </div>
                )}

                {/* Batch Queue Status */}
                {autoMode && batchQueue.length > 0 && (
                    <div className="mt-4">
                        <h4 className="text-sm font-medium mb-2">📦 Batch Queue</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            <div className="bg-blue-50 p-2 rounded-lg border border-blue-200 dark:bg-blue-900/20 dark:border-blue-800">
                                <p className="text-xs text-blue-600">Total</p>
                                <p className="text-lg font-bold text-blue-700">{batchQueue.length}</p>
                            </div>
                            <div className="bg-green-50 p-2 rounded-lg border border-green-200 dark:bg-green-900/20 dark:border-green-800">
                                <p className="text-xs text-green-600">Completed</p>
                                <p className="text-lg font-bold text-green-700">
                                    {batchQueue.filter(b => b.status === 'completed').length}
                                </p>
                            </div>
                            <div className="bg-yellow-50 p-2 rounded-lg border border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800">
                                <p className="text-xs text-yellow-600">Pending</p>
                                <p className="text-lg font-bold text-yellow-700">
                                    {batchQueue.filter(b => b.status === 'pending').length}
                                </p>
                            </div>
                            <div className="bg-red-50 p-2 rounded-lg border border-red-200 dark:bg-red-900/20 dark:border-red-800">
                                <p className="text-xs text-red-600">Failed</p>
                                <p className="text-lg font-bold text-red-700">
                                    {batchQueue.filter(b => b.status === 'failed').length}
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Preview */}
            {showPreview && (
                <div className={`rounded-lg shadow p-4 mb-6 border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="font-bold">📊 Preview ({previewCount} customers)</h3>
                        <div className="flex gap-2">
                            <span className="text-sm text-gray-500">
                                {selectedMember}: {memberTodaySent}/{teamMembers.find(m => m.name === selectedMember)?.dailyLimit || 250}
                            </span>
                            <button
                                onClick={() => setShowPreview(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                ✕
                            </button>
                        </div>
                    </div>
                    {previewCustomers.length === 0 ? (
                        <p className="text-gray-500 text-center py-4">No customers match the criteria</p>
                    ) : (
                        <div className="max-h-60 overflow-y-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-100 sticky top-0 dark:bg-gray-700">
                                    <tr>
                                        <th className="px-3 py-1 text-left">#</th>
                                        <th className="px-3 py-1 text-left">Name</th>
                                        <th className="px-3 py-1 text-left">Phone</th>
                                        <th className="px-3 py-1 text-left">Group</th>
                                        <th className="px-3 py-1 text-left">Interest</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {previewCustomers.slice(0, 20).map((customer, index) => (
                                        <tr key={customer.id || index}>
                                            <td className="px-3 py-1">{index + 1}</td>
                                            <td className="px-3 py-1">{customer.customer_name || 'Unknown'}</td>
                                            <td className="px-3 py-1">{customer.mobile_number}</td>
                                            <td className="px-3 py-1">
                                                <span className={`px-2 py-0.5 rounded-full text-xs ${customer.group_type === 'Daily Reach' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                    {customer.group_type || 'Daily Reach'}
                                                </span>
                                            </td>
                                            <td className="px-3 py-1 text-xs truncate max-w-xs">{customer.interests || 'None'}</td>
                                        </tr>
                                    ))}
                                    {previewCustomers.length > 20 && (
                                        <tr>
                                            <td colSpan="5" className="px-3 py-2 text-center text-gray-500">
                                                ... and {previewCustomers.length - 20} more
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Recent Broadcasts with Filters */}
            <div className={`rounded-lg shadow overflow-hidden ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="font-bold">📜 Recent Broadcasts ({filteredLogs.length})</h2>
                        <div className="flex gap-2">
                            <button
                                onClick={retryFailedMessages}
                                className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded text-sm transition"
                            >
                                🔄 Retry Failed
                            </button>
                            <button
                                onClick={exportLogs}
                                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm transition"
                            >
                                📥 Export
                            </button>
                            <button
                                onClick={async () => {
                                    showMessage('🔄 Refreshing logs...', 'info');
                                    await loadMessageLogs();
                                    showMessage(`✅ ${messageLogs.length} logs loaded`, 'success');
                                }}
                                className="bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded text-sm transition dark:bg-gray-700 dark:hover:bg-gray-600"
                            >
                                🔄 Refresh
                            </button>
                        </div>
                    </div>
                    
                    {/* Filters */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <div>
                            <input
                                type="date"
                                value={filterDate}
                                onChange={(e) => setFilterDate(e.target.value)}
                                className={`w-full p-2 border rounded-lg text-sm ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                            />
                        </div>
                        <div>
                            <select
                                value={filterMember}
                                onChange={(e) => setFilterMember(e.target.value)}
                                className={`w-full p-2 border rounded-lg text-sm ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                            >
                                <option value="all">All Members</option>
                                {teamMembers.map((m) => (
                                    <option key={m.id} value={m.name}>{m.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className={`w-full p-2 border rounded-lg text-sm ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                            >
                                <option value="all">All Status</option>
                                <option value="Sent">✅ Sent</option>
                                <option value="Failed">❌ Failed</option>
                                <option value="Pending">⏳ Pending</option>
                            </select>
                        </div>
                        <div>
                            <input
                                type="text"
                                placeholder="🔍 Search by phone, message..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className={`w-full p-2 border rounded-lg text-sm ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                            />
                        </div>
                    </div>
                </div>
                
                {!filteredLogs || filteredLogs.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        {messageLogs.length === 0 ? 'No broadcast logs yet' : 'No logs match the filters'}
                    </div>
                ) : (
                    <div className="overflow-x-auto max-h-96 overflow-y-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 sticky top-0 dark:bg-gray-700">
                                <tr>
                                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-600 dark:text-gray-300">#</th>
                                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-600 dark:text-gray-300">Member</th>
                                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-600 dark:text-gray-300">Recipient</th>
                                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-600 dark:text-gray-300">Message</th>
                                    <th className="px-4 py-2 text-center text-sm font-medium text-gray-600 dark:text-gray-300">Status</th>
                                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-600 dark:text-gray-300">Date</th>
                                    <th className="px-4 py-2 text-center text-sm font-medium text-gray-600 dark:text-gray-300">Parts</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {filteredLogs.slice(0, 50).map((log, index) => (
                                    <tr key={log.id || index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                        <td className="px-4 py-2 text-sm text-gray-500">{index + 1}</td>
                                        <td className="px-4 py-2 text-sm font-medium">
                                            <span className={`px-2 py-0.5 rounded-full text-xs ${
                                                log.team_member === 'Deepanshu' ? 'bg-purple-100 text-purple-700' :
                                                log.team_member === 'Sanjeev' ? 'bg-blue-100 text-blue-700' :
                                                log.team_member === 'Rajeev' ? 'bg-green-100 text-green-700' :
                                                log.team_member === 'Muskan' ? 'bg-pink-100 text-pink-700' :
                                                'bg-gray-100 text-gray-700'
                                            } dark:bg-opacity-20`}>
                                                {log.team_member || 'Unknown'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2 text-sm">{log.recipient || 'N/A'}</td>
                                        <td className="px-4 py-2 text-sm max-w-xs truncate">{log.message || 'N/A'}</td>
                                        <td className="px-4 py-2 text-center">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                log.status === 'Sent' ? 'bg-green-100 text-green-700' : 
                                                log.status === 'Failed' ? 'bg-red-100 text-red-700' : 
                                                'bg-yellow-100 text-yellow-700'
                                            } dark:bg-opacity-20`}>
                                                {log.status || 'Sent'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2 text-sm">{formatDate(log.created_at)}</td>
                                        <td className="px-4 py-2 text-center">
                                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded dark:bg-blue-900/20 dark:text-blue-400">
                                                {log.message_parts || 'Single'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BroadcastPage;
