import React, { useState, useEffect, useRef } from 'react';
import messageService from '../services/messageService';
import './Chat.css';

const Chat = ({ appointment, currentUser }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  // Calculer les valeurs nécessaires (avant les hooks conditionnels)
  const isUser = currentUser?.role === 'USER';
  const otherParticipant = appointment && currentUser 
    ? (isUser ? appointment.professionalId : appointment.userId)
    : null;
  
  // L'ID peut être soit _id soit id
  const currentUserId = currentUser?._id || currentUser?.id;

  // Log pour debug
  useEffect(() => {
    console.log('Chat - Données initiales:', {
      appointmentId: appointment?._id,
      currentUserId: currentUserId,
      currentUserRole: currentUser?.role,
      isUser,
      otherParticipantId: otherParticipant?._id,
      otherParticipantName: otherParticipant ? `${otherParticipant.firstName} ${otherParticipant.lastName}` : 'Non défini'
    });
  }, [appointment, currentUser, isUser, otherParticipant, currentUserId]);

  useEffect(() => {
    if (!appointment?._id) return;
    
    loadMessages();
    // Rafraîchir les messages toutes les 5 secondes
    const interval = setInterval(loadMessages, 5000);
    return () => clearInterval(interval);
  }, [appointment?._id]);

  useEffect(() => {
    scrollToBottom();
    // Marquer les messages comme lus
    if (messages.length > 0 && appointment?._id) {
      messageService.markAsRead(appointment._id).catch(err => 
        console.error('Erreur lors du marquage des messages:', err)
      );
    }
  }, [messages, appointment?._id]);

  const loadMessages = async () => {
    if (!appointment?._id) return;
    
    try {
      const data = await messageService.getMessages(appointment._id);
      console.log('Messages chargés:', data.length);
      setMessages(data);
      setLoading(false);
    } catch (error) {
      console.error('Erreur lors du chargement des messages:', error);
      console.error('Détails:', error.response?.data);
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    console.log('Tentative d\'envoi - Vérifications:', {
      hasMessage: !!newMessage.trim(),
      hasOtherParticipant: !!otherParticipant,
      otherParticipantId: otherParticipant?._id,
      isUser,
      currentUserRole: currentUser?.role
    });
    
    if (!newMessage.trim() || !otherParticipant) {
      console.error('Envoi bloqué:', {
        message: newMessage,
        otherParticipant
      });
      alert('Impossible d\'envoyer le message. Vérifiez que toutes les données sont présentes.');
      return;
    }

    setSending(true);
    try {
      const messageData = {
        appointmentId: appointment._id,
        content: newMessage.trim(),
        receiverId: otherParticipant._id,
        receiverModel: isUser ? 'Professional' : 'User'
      };

      console.log('Envoi du message:', messageData);
      const sentMessage = await messageService.sendMessage(messageData);
      console.log('Message envoyé:', sentMessage);
      setNewMessage('');
      await loadMessages();
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error);
      console.error('Détails:', error.response?.data);
      alert(error.response?.data?.message || 'Erreur lors de l\'envoi du message');
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const timeString = date.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    if (date.toDateString() === today.toDateString()) {
      return `Aujourd'hui à ${timeString}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Hier à ${timeString}`;
    } else {
      return date.toLocaleDateString('fr-FR', { 
        day: '2-digit', 
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  // Vérifications après les hooks
  if (!appointment || !currentUser) {
    return (
      <div className="chat-container">
        <div className="chat-loading">Erreur: Données manquantes</div>
      </div>
    );
  }

  if (!otherParticipant) {
    return (
      <div className="chat-container">
        <div className="chat-loading">Erreur: Participant non trouvé</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="chat-container">
        <div className="chat-loading">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h3>
          {isUser 
            ? `Dr. ${otherParticipant.firstName} ${otherParticipant.lastName}` 
            : `${otherParticipant.firstName} ${otherParticipant.lastName}`}
        </h3>
        <div className="chat-appointment-info">
          <span>{new Date(appointment.date).toLocaleDateString('fr-FR')}</span>
          <span className="separator">•</span>
          <span>{appointment.startTime} - {appointment.endTime}</span>
        </div>
      </div>

      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="chat-empty">
            <p>Aucun message. Commencez la conversation !</p>
          </div>
        ) : (
          messages.map((message) => {
            // Gérer le cas où senderId est un objet ou un string
            const senderId = typeof message.senderId === 'object' 
              ? message.senderId._id 
              : message.senderId;
            
            // Convertir les deux IDs en string pour la comparaison
            const normalizedSenderId = String(senderId);
            const normalizedCurrentUserId = String(currentUserId);
            const isSentByMe = normalizedSenderId === normalizedCurrentUserId;
            
            console.log('Message:', {
              senderId: normalizedSenderId,
              currentUserId: normalizedCurrentUserId,
              isSentByMe,
              content: message.content.substring(0, 20)
            });
            
            const displayUser = isSentByMe ? currentUser : otherParticipant;
            
            return (
              <div 
                key={message._id} 
                className={`message ${isSentByMe ? 'message-sent' : 'message-received'}`}
              >
                <div className="message-avatar">
                  {displayUser.profileImage ? (
                    <img src={displayUser.profileImage} alt="Profil" />
                  ) : (
                    <div className="avatar-placeholder">
                      {displayUser.firstName?.charAt(0)}{displayUser.lastName?.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="message-bubble">
                  <div className="message-content">
                    <p>{message.content}</p>
                  </div>
                  <div className="message-info">
                    <span className="message-time">{formatTime(message.createdAt)}</span>
                    {isSentByMe && message.isRead && (
                      <span className="message-read">✓✓</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className="chat-input-form" onSubmit={handleSendMessage}>
        <input
          type="text"
          className="chat-input"
          placeholder="Écrivez votre message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          disabled={sending}
          maxLength={2000}
        />
        <button 
          type="submit" 
          className="chat-send-btn"
          disabled={sending || !newMessage.trim()}
        >
          {sending ? 'Envoi...' : 'Envoyer'}
        </button>
      </form>
    </div>
  );
};

export default Chat;
