import api from './api';

const consultationService = {
  // Start consultation (professional only)
  startConsultation: async (appointmentId) => {
    const response = await api.post(`/consultations/${appointmentId}/start`);
    return response.data;
  },

  // Join consultation room
  joinConsultation: async (appointmentId) => {
    const response = await api.get(`/consultations/${appointmentId}/join`);
    return response.data;
  },

  // End consultation (professional only)
  endConsultation: async (appointmentId, data = {}) => {
    const response = await api.put(`/consultations/${appointmentId}/end`, data);
    return response.data;
  },

  // Get consultation history
  getConsultationHistory: async (appointmentId) => {
    const response = await api.get(`/consultations/${appointmentId}/history`);
    return response.data;
  }
};

export default consultationService;
