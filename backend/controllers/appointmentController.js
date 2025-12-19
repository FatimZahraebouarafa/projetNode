const Appointment = require('../models/Appointment');
const Professional = require('../models/Professional');

// @desc    Create appointment request
// @route   POST /api/appointments
// @access  Private/User
const createAppointment = async (req, res) => {
  try {
    const { 
      professionalId, 
      date, 
      startTime, 
      endTime, 
      reason, 
      type 
    } = req.body;

    // Check if professional exists and is approved
    const professional = await Professional.findById(professionalId);
    if (!professional) {
      return res.status(404).json({ message: 'Professional not found' });
    }

    if (professional.status !== 'APPROVED') {
      return res.status(400).json({ message: 'Professional is not available' });
    }

    // Check if slot is available
    const existingAppointment = await Appointment.findOne({
      professionalId,
      date,
      startTime,
      status: { $in: ['CONFIRMED', 'REQUESTED', 'PENDING_CONFIRMATION'] }
    });

    if (existingAppointment) {
      return res.status(400).json({ message: 'This time slot is not available' });
    }

    // Calculate duration in minutes
    const start = new Date(`2000-01-01T${startTime}:00`);
    const end = new Date(`2000-01-01T${endTime}:00`);
    const duration = Math.round((end - start) / (1000 * 60));

    const appointment = new Appointment({
      userId: req.user._id,
      professionalId,
      date,
      startTime,
      endTime,
      duration,
      reason,
      type,
      status: 'REQUESTED'
    });

    await appointment.save();

    res.status(201).json({
      message: 'Appointment request sent successfully',
      appointment
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user's appointments
// @route   GET /api/appointments
// @access  Private/User
const getUserAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({ 
      userId: req.user._id 
    })
    .populate('professionalId', 'firstName lastName specialty phone email profileImage')
    .sort({ date: -1, startTime: -1 });

    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Cancel user appointment
// @route   PUT /api/appointments/:id/cancel
// @access  Private/User
const cancelUserAppointment = async (req, res) => {
  try {
    const { reason } = req.body;
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    if (appointment.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    appointment.status = 'CANCELLED';
    appointment.cancelledAt = new Date();
    appointment.cancellationReason = reason;

    await appointment.save();

    res.json({ message: 'Appointment cancelled successfully', appointment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createAppointment,
  getUserAppointments,
  cancelUserAppointment
};
