import React, { useState, useEffect } from 'react';
import axios from 'axios';

const TeamStats = () => {
    const [teamStats, setTeamStats] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadTeamStats();
    }, []);

    const loadTeamStats = async () => {
        try {
            const response = await axios.get('/api/broadcast/team-stats');
            setTeamStats(response.data);
        } catch (error) {
            console.error('Error loading team stats:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="text-center py-4">Loading team stats...</div>;

    if (teamStats.length === 0) {
        return (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                <h3 className="text-lg font-bold mb-4">👥 Team Activity</h3>
                <p className="text-gray-500 text-center py-4">No messages sent yet</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">👥 Team Activity (Last 7 Days)</h3>
                <button
                    onClick={loadTeamStats}
                    className="text-sm text-blue-500 hover:text-blue-700"
                >
                    🔄 Refresh
                </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {teamStats.map((member) => (
                    <div key={member.team_member} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                        <h4 className="font-bold text-gray-800">{member.team_member}</h4>
                        <div className="mt-2 space-y-1 text-sm">
                            <p>📤 Total: <strong>{member.total_sent}</strong></p>
                            <p>✅ Sent: <span className="text-green-600">{member.successful}</span></p>
                            <p>❌ Failed: <span className="text-red-600">{member.failed}</span></p>
                            <p className="text-xs text-gray-400">
                                Last: {member.last_sent ? new Date(member.last_sent).toLocaleString() : 'Never'}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TeamStats;
