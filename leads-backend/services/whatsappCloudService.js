const axios = require('axios');

class WhatsAppCloudService {
    constructor() {
        this.token = process.env.WHATSAPP_TOKEN;
        this.phoneId = process.env.WHATSAPP_PHONE_ID;
        this.apiVersion = 'v18.0';
        this.baseUrl = `https://graph.facebook.com/${this.apiVersion}/${this.phoneId}/messages`;
    }

    async sendTextMessage(to, message) {
        try {
            const response = await axios({
                method: 'POST',
                url: this.baseUrl,
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                },
                data: {
                    messaging_product: 'whatsapp',
                    to: to,
                    type: 'text',
                    text: { body: message }
                }
            });

            return {
                success: true,
                messageId: response.data.messages?.[0]?.id || null,
                to: to
            };
        } catch (error) {
            console.error('WhatsApp send error:', error.response?.data || error.message);
            return {
                success: false,
                error: error.response?.data?.error?.message || error.message,
                to: to
            };
        }
    }

    async sendBulkMessages(customers, message, onProgress) {
        const results = {
            sent: 0,
            failed: 0,
            errors: [],
            total: customers.length
        };

        const batchSize = 80;
        let index = 0;

        while (index < customers.length) {
            const batch = customers.slice(index, index + batchSize);
            
            const promises = batch.map(async (customer) => {
                const result = await this.sendTextMessage(
                    customer.mobile_number,
                    message
                );
                
                if (result.success) {
                    results.sent++;
                } else {
                    results.failed++;
                    results.errors.push({
                        customer: customer.customer_name || customer.mobile_number,
                        phone: customer.mobile_number,
                        error: result.error
                    });
                }

                if (onProgress) {
                    onProgress({
                        sent: results.sent,
                        failed: results.failed,
                        total: results.total,
                        current: Math.min(index + batch.length, results.total)
                    });
                }
            });

            await Promise.all(promises);
            index += batchSize;

            if (index < customers.length) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        return results;
    }

    async sendTemplateMessage(to, templateName, language = 'en') {
        try {
            const response = await axios({
                method: 'POST',
                url: this.baseUrl,
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                },
                data: {
                    messaging_product: 'whatsapp',
                    to: to,
                    type: 'template',
                    template: {
                        name: templateName,
                        language: { code: language }
                    }
                }
            });

            return {
                success: true,
                messageId: response.data.messages?.[0]?.id || null,
                to: to
            };
        } catch (error) {
            console.error('Template send error:', error.response?.data || error.message);
            return {
                success: false,
                error: error.response?.data?.error?.message || error.message,
                to: to
            };
        }
    }

    async checkPhoneNumber(phoneNumber) {
        try {
            const response = await axios({
                method: 'GET',
                url: `https://graph.facebook.com/${this.apiVersion}/${phoneNumber}`,
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });
            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.error?.message || error.message
            };
        }
    }

    async getMessageStatus(messageId) {
        try {
            const response = await axios({
                method: 'GET',
                url: `https://graph.facebook.com/${this.apiVersion}/${messageId}`,
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });
            return {
                success: true,
                status: response.data.status
            };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.error?.message || error.message
            };
        }
    }
}

module.exports = new WhatsAppCloudService();
