const axios = require('axios');
const { logger } = require('./logger');

class WhatsAppService {
  constructor() {
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    this.apiVersion = process.env.WHATSAPP_API_VERSION || 'v18.0';
    this.baseUrl = `https://graph.facebook.com/${this.apiVersion}`;
  }

  async sendArrivalNotification(parentName, studentName, schoolName, phoneNumber, time) {
    const message = this.formatArrivalMessage(parentName, studentName, schoolName, time);
    return await this.sendMessage(phoneNumber, message);
  }

  async sendDepartureNotification(parentName, studentName, schoolName, phoneNumber, time) {
    const message = this.formatDepartureMessage(parentName, studentName, schoolName, time);
    return await this.sendMessage(phoneNumber, message);
  }

  formatArrivalMessage(parentName, studentName, schoolName, time) {
    return `School Attendance Alert\n\nHello ${parentName},\n\nYour child ${studentName} has arrived at ${schoolName} at ${time}.\n\nThank you.`;
  }

  formatDepartureMessage(parentName, studentName, schoolName, time) {
    return `School Attendance Alert\n\nHello ${parentName},\n\nYour child ${studentName} has departed from ${schoolName} at ${time}.\n\nThank you.`;
  }

  async sendMessage(phoneNumber, message) {
    try {
      const url = `${this.baseUrl}/${this.phoneNumberId}/messages`;
      
      const payload = {
        messaging_product: 'whatsapp',
        to: phoneNumber,
        type: 'text',
        text: {
          body: message
        }
      };

      const headers = {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json'
      };

      const response = await axios.post(url, payload, { headers });
      
      logger.info('WhatsApp message sent successfully', {
        phoneNumber,
        messageId: response.data.messages[0].id
      });

      return {
        success: true,
        messageId: response.data.messages[0].id
      };
    } catch (error) {
      logger.error('WhatsApp message failed', {
        error: error.message,
        phoneNumber,
        response: error.response?.data
      });

      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new WhatsAppService();
