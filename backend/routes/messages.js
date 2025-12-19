const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { protect } = require('../middleware/auth');

// Toutes les routes nécessitent l'authentification
router.use(protect);

// Envoyer un message
router.post('/', messageController.sendMessage);

// Récupérer les messages d'un rendez-vous
router.get('/appointment/:appointmentId', messageController.getMessages);

// Marquer les messages comme lus
router.put('/appointment/:appointmentId/read', messageController.markAsRead);

// Récupérer le nombre de messages non lus
router.get('/unread-count', messageController.getUnreadCount);

// Obtenir la liste des conversations
router.get('/conversations', messageController.getConversations);

module.exports = router;
