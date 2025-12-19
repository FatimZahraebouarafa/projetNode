import api from './api';

const messageService = {
  // Envoyer un message
  sendMessage: async (messageData) => {
    const response = await api.post('/messages', messageData);
    return response.data;
  },

  // Récupérer les messages d'un rendez-vous
  getMessages: async (appointmentId) => {
    const response = await api.get(`/messages/appointment/${appointmentId}`);
    return response.data;
  },

  // Marquer les messages comme lus
  markAsRead: async (appointmentId) => {
    const response = await api.put(`/messages/appointment/${appointmentId}/read`);
    return response.data;
  },

  // Récupérer le nombre de messages non lus
  getUnreadCount: async () => {
    const response = await api.get('/messages/unread-count');
    return response.data;
  },

  // Obtenir la liste des conversations
  getConversations: async () => {
    const response = await api.get('/messages/conversations');
    return response.data;
  }
};

export default messageService;
