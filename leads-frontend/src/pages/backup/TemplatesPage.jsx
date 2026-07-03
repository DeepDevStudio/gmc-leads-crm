import React, { useState, useEffect } from 'react';
import { getTemplates, createTemplate, deleteTemplate } from '../services/templateService';
import { getInterests } from '../services/interestService';
import { createActivity } from '../services/activityService';

function TemplatesPage() {
    const [templates, setTemplates] = useState([]);
    const [interests, setInterests] = useState([]);
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
        try {
            const data = await getTemplates();
            setTemplates(data);
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await createTemplate(formData);
            const user = JSON.parse(localStorage.getItem('user'));
            await createActivity({
                user_id: user.id,
                username: user.username,
                activity: `Created Template: ${formData.template_name}`
            });
            setFormData({
                template_name: '',
                interest_name: '',
                message: '',
                status: 'Active'
            });
            loadTemplates();
        } catch (error) {
            console.error('Error creating template:', error);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Delete Template?')) {
            try {
                await deleteTemplate(id);
                loadTemplates();
            } catch (error) {
                console.error('Error deleting template:', error);
            }
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Templates</h1>
                <p className="text-gray-500">WhatsApp Message Templates</p>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow border">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                        placeholder="Template Name"
                        value={formData.template_name}
                        onChange={(e) => setFormData({ ...formData, template_name: e.target.value })}
                        className="w-full border p-3 rounded-xl"
                        required
                    />
                    <select
                        value={formData.interest_name}
                        onChange={(e) => setFormData({ ...formData, interest_name: e.target.value })}
                        className="w-full border p-3 rounded-xl"
                        required
                    >
                        <option value="">Select Interest</option>
                        {interests.map((interest) => (
                            <option key={interest.id} value={interest.interest_name}>
                                {interest.interest_name}
                            </option>
                        ))}
                    </select>
                    <textarea
                        placeholder="WhatsApp Message"
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        rows="6"
                        className="w-full border p-3 rounded-xl"
                        required
                    />
                    <button
                        type="submit"
                        className="bg-yellow-400 hover:bg-yellow-500 px-6 py-3 rounded-xl font-semibold"
                    >
                        Save Template
                    </button>
                </form>
            </div>

            <div className="bg-white rounded-2xl shadow border overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="bg-black text-yellow-400">
                            <th className="p-3 text-left">Template</th>
                            <th className="p-3 text-left">Interest</th>
                            <th className="p-3 text-left">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {templates.map((template) => (
                            <tr key={template.id} className="border-b">
                                <td className="p-3">{template.template_name}</td>
                                <td className="p-3">{template.interest_name}</td>
                                <td className="p-3">
                                    <button
                                        onClick={() => handleDelete(template.id)}
                                        className="bg-red-500 text-white px-3 py-1 rounded-lg"
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default TemplatesPage;
