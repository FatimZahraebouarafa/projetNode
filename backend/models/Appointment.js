const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  professionalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Professional',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  startTime: {
    type: String,
    required: true
  },
  endTime: {
    type: String,
    required: true
  },
  duration: {
    type: Number,
    required: false
  },
  type: {
    type: String,
    enum: ['CONSULTATION', 'FOLLOW_UP', 'URGENT'],
    default: 'CONSULTATION'
  },
  status: {
    type: String,
    enum: ['REQUESTED', 'PENDING_CONFIRMATION', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW', 'RESCHEDULED'],
    default: 'REQUESTED'
  },
  reason: {
    type: String,
    required: true
  },
  notes: String,
  symptoms: String,
  onlineConsultation: {
    meetingPlatform: {
      type: String,
      enum: ['ZOOM', 'TEAMS', 'GOOGLE_MEET', 'CUSTOM', 'WEBRTC']
    },
    meetingLink: String,
    meetingId: String,
    password: String,
    joinInstructions: String,
    roomId: String,
    status: {
      type: String,
      enum: ['PENDING', 'ACTIVE', 'ENDED'],
      default: 'PENDING'
    },
    startedAt: Date,
    endedAt: Date,
    duration: Number, // in minutes
    notes: String,
    prescription: String
  },
  paymentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment'
  },
  confirmedAt: Date,
  cancelledAt: Date,
  cancellationReason: String,
  completedAt: Date,
  reminderSent: {
    type: Boolean,
    default: false
  },
  reminderSentAt: Date
}, {
  timestamps: true
});

module.exports = mongoose.model('Appointment', appointmentSchema);
