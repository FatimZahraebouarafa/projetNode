const Message = require('../models/Message');
const Appointment = require('../models/Appointment');

// Vérifier qu'un rendez-vous confirmé existe entre l'utilisateur et le professionnel
const verifyConfirmedAppointment = async (userId, professionalId, appointmentId) => {
  const appointment = await Appointment.findOne({
    _id: appointmentId,
    userId,
    professionalId,
    status: 'CONFIRMED'
  });
  
  return appointment;
};

// Envoyer un message
exports.sendMessage = async (req, res) => {
  try {
    const { appointmentId, content, receiverId, receiverModel } = req.body;
    const senderId = req.user.id;
    const senderModel = req.user.role === 'USER' ? 'User' : 'Professional';

    console.log('Tentative d\'envoi de message:', {
      senderId,
      senderModel,
      receiverId,
      receiverModel,
      appointmentId
    });

    // Vérifier que le rendez-vous existe et est confirmé
    let appointment;
    if (senderModel === 'User') {
      appointment = await verifyConfirmedAppointment(senderId, receiverId, appointmentId);
    } else {
      appointment = await verifyConfirmedAppointment(receiverId, senderId, appointmentId);
    }

    if (!appointment) {
      console.error('Rendez-vous non trouvé ou non confirmé:', { senderId, receiverId, appointmentId, senderModel });
      return res.status(403).json({ 
        message: 'Vous ne pouvez envoyer des messages que pour des rendez-vous confirmés' 
      });
    }

    console.log('Rendez-vous confirmé trouvé:', appointment._id);

    const message = new Message({
      appointmentId,
      senderId,
      senderModel,
      receiverId,
      receiverModel,
      content
    });

    await message.save();

    // Peupler les informations de l'expéditeur et du destinataire
    await message.populate({ path: 'senderId', select: 'firstName lastName' });
    await message.populate({ path: 'receiverId', select: 'firstName lastName' });

    console.log('Message envoyé avec succès:', message._id);
    res.status(201).json(message);
  } catch (error) {
    console.error('Erreur lors de l\'envoi du message:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Récupérer les messages d'un rendez-vous
exports.getMessages = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Vérifier que l'utilisateur est impliqué dans ce rendez-vous
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ message: 'Rendez-vous non trouvé' });
    }

    // Vérifier les permissions
    const isUser = userRole === 'USER' && appointment.userId.toString() === userId;
    const isProfessional = userRole === 'PROFESSIONAL' && appointment.professionalId.toString() === userId;

    if (!isUser && !isProfessional) {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    // Vérifier que le rendez-vous est confirmé
    if (appointment.status !== 'CONFIRMED') {
      return res.status(403).json({ 
        message: 'Le chat n\'est accessible que pour les rendez-vous confirmés' 
      });
    }

    const messages = await Message.find({ 
      appointmentId,
      isDeleted: false 
    })
    .populate({ path: 'senderId', select: 'firstName lastName' })
    .populate({ path: 'receiverId', select: 'firstName lastName' })
    .sort({ createdAt: 1 });

    console.log(`Messages récupérés pour rendez-vous ${appointmentId}:`, messages.length);
    res.json(messages);
  } catch (error) {
    console.error('Erreur lors de la récupération des messages:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Marquer les messages comme lus
exports.markAsRead = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const userId = req.user.id;

    await Message.updateMany(
      { 
        appointmentId,
        receiverId: userId,
        isRead: false 
      },
      { 
        isRead: true,
        readAt: new Date()
      }
    );

    res.json({ message: 'Messages marqués comme lus' });
  } catch (error) {
    console.error('Erreur lors du marquage des messages:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Récupérer le nombre de messages non lus
exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;

    const count = await Message.countDocuments({
      receiverId: userId,
      isRead: false,
      isDeleted: false
    });

    res.json({ unreadCount: count });
  } catch (error) {
    console.error('Erreur lors du comptage des messages non lus:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Obtenir la liste des conversations (rendez-vous avec messages)
exports.getConversations = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    // Trouver tous les rendez-vous confirmés de l'utilisateur
    let query = { status: 'CONFIRMED' };
    if (userRole === 'USER') {
      query.userId = userId;
    } else {
      query.professionalId = userId;
    }

    const appointments = await Appointment.find(query)
      .populate('userId', 'firstName lastName')
      .populate('professionalId', 'firstName lastName specialty')
      .sort({ date: -1 });

    // Pour chaque rendez-vous, récupérer le dernier message et le nombre de non lus
    const conversations = await Promise.all(
      appointments.map(async (appointment) => {
        const lastMessage = await Message.findOne({ 
          appointmentId: appointment._id,
          isDeleted: false 
        })
        .sort({ createdAt: -1 })
        .limit(1);

        const unreadCount = await Message.countDocuments({
          appointmentId: appointment._id,
          receiverId: userId,
          isRead: false,
          isDeleted: false
        });

        return {
          appointment,
          lastMessage,
          unreadCount
        };
      })
    );

    res.json(conversations);
  } catch (error) {
    console.error('Erreur lors de la récupération des conversations:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};
