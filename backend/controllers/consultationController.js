const Appointment = require('../models/Appointment');
const Professional = require('../models/Professional');
const User = require('../models/User');
const crypto = require('crypto');

// Generate unique room ID for consultation
const generateRoomId = (appointmentId) => {
  return `consultation_${appointmentId}_${crypto.randomBytes(4).toString('hex')}`;
};

// @desc    Start online consultation (generate room)
// @route   POST /api/consultations/:appointmentId/start
// @access  Private (Professional)
const startConsultation = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.appointmentId)
      .populate('userId', 'firstName lastName email')
      .populate('professionalId', 'firstName lastName email specialty');

    if (!appointment) {
      return res.status(404).json({ message: 'Rendez-vous non trouvé' });
    }

    // Verify the professional owns this appointment
    if (appointment.professionalId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    // Check appointment is confirmed
    if (appointment.status !== 'CONFIRMED') {
      return res.status(400).json({ message: 'Le rendez-vous doit être confirmé pour démarrer une consultation' });
    }

    // Generate room ID if not exists
    if (!appointment.onlineConsultation || !appointment.onlineConsultation.roomId) {
      const roomId = generateRoomId(appointment._id);
      appointment.onlineConsultation = {
        ...appointment.onlineConsultation,
        roomId,
        meetingPlatform: 'WEBRTC',
        status: 'ACTIVE',
        startedAt: new Date()
      };
      await appointment.save();
    } else {
      // Reactivate if already exists
      appointment.onlineConsultation.status = 'ACTIVE';
      appointment.onlineConsultation.startedAt = new Date();
      await appointment.save();
    }

    res.json({
      message: 'Consultation démarrée',
      roomId: appointment.onlineConsultation.roomId,
      appointment: {
        _id: appointment._id,
        date: appointment.date,
        startTime: appointment.startTime,
        endTime: appointment.endTime,
        user: appointment.userId,
        professional: appointment.professionalId
      }
    });
  } catch (error) {
    console.error('Error starting consultation:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Join consultation (get room info)
// @route   GET /api/consultations/:appointmentId/join
// @access  Private (User or Professional)
const joinConsultation = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.appointmentId)
      .populate('userId', 'firstName lastName email')
      .populate('professionalId', 'firstName lastName email specialty profileImage');

    if (!appointment) {
      return res.status(404).json({ message: 'Rendez-vous non trouvé' });
    }

    // Verify participant
    const isUser = appointment.userId._id.toString() === req.user._id.toString();
    const isProfessional = appointment.professionalId._id.toString() === req.user._id.toString();

    if (!isUser && !isProfessional) {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    if (!appointment.onlineConsultation || !appointment.onlineConsultation.roomId) {
      return res.status(400).json({ message: 'La consultation n\'a pas encore été démarrée par le professionnel' });
    }

    if (appointment.onlineConsultation.status === 'ENDED') {
      return res.status(400).json({ message: 'Cette consultation est terminée' });
    }

    res.json({
      roomId: appointment.onlineConsultation.roomId,
      status: appointment.onlineConsultation.status,
      appointment: {
        _id: appointment._id,
        date: appointment.date,
        startTime: appointment.startTime,
        endTime: appointment.endTime,
        reason: appointment.reason,
        type: appointment.type
      },
      user: {
        _id: appointment.userId._id,
        firstName: appointment.userId.firstName,
        lastName: appointment.userId.lastName
      },
      professional: {
        _id: appointment.professionalId._id,
        firstName: appointment.professionalId.firstName,
        lastName: appointment.professionalId.lastName,
        specialty: appointment.professionalId.specialty,
        profileImage: appointment.professionalId.profileImage
      }
    });
  } catch (error) {
    console.error('Error joining consultation:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    End consultation
// @route   PUT /api/consultations/:appointmentId/end
// @access  Private (Professional)
const endConsultation = async (req, res) => {
  try {
    const { notes, prescription } = req.body;
    const appointment = await Appointment.findById(req.params.appointmentId);

    if (!appointment) {
      return res.status(404).json({ message: 'Rendez-vous non trouvé' });
    }

    // Only professional can end consultation
    if (appointment.professionalId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    appointment.onlineConsultation.status = 'ENDED';
    appointment.onlineConsultation.endedAt = new Date();
    
    // Calculate duration
    if (appointment.onlineConsultation.startedAt) {
      const duration = Math.round(
        (new Date() - new Date(appointment.onlineConsultation.startedAt)) / (1000 * 60)
      );
      appointment.onlineConsultation.duration = duration;
    }

    // Save consultation notes
    if (notes) {
      appointment.onlineConsultation.notes = notes;
    }
    if (prescription) {
      appointment.onlineConsultation.prescription = prescription;
    }

    // Mark appointment as completed
    appointment.status = 'COMPLETED';
    appointment.completedAt = new Date();

    await appointment.save();

    // Notify via Socket.IO
    const io = req.app.get('io');
    if (io && appointment.onlineConsultation.roomId) {
      io.to(appointment.onlineConsultation.roomId).emit('consultation-ended', {
        message: 'La consultation est terminée'
      });
    }

    res.json({
      message: 'Consultation terminée',
      duration: appointment.onlineConsultation.duration,
      appointment
    });
  } catch (error) {
    console.error('Error ending consultation:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get consultation history for an appointment
// @route   GET /api/consultations/:appointmentId/history
// @access  Private
const getConsultationHistory = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.appointmentId)
      .populate('userId', 'firstName lastName')
      .populate('professionalId', 'firstName lastName specialty');

    if (!appointment) {
      return res.status(404).json({ message: 'Rendez-vous non trouvé' });
    }

    // Verify participant
    const isUser = appointment.userId._id.toString() === req.user._id.toString();
    const isProfessional = appointment.professionalId._id.toString() === req.user._id.toString();

    if (!isUser && !isProfessional) {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    res.json({
      consultation: appointment.onlineConsultation || null,
      appointment: {
        _id: appointment._id,
        date: appointment.date,
        status: appointment.status,
        reason: appointment.reason
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  startConsultation,
  joinConsultation,
  endConsultation,
  getConsultationHistory
};
