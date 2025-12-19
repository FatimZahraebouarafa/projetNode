const Appointment = require('../models/Appointment');
const Professional = require('../models/Professional');

// @desc    Get professional's appointments
// @route   GET /api/professional/appointments
// @access  Private/Professional
const getAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({ 
      professionalId: req.user._id 
    })
    .populate('userId', 'firstName lastName email phone')
    .sort({ date: -1, startTime: -1 });

    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get pending appointment requests
// @route   GET /api/professional/appointments/pending
// @access  Private/Professional
const getPendingAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({ 
      professionalId: req.user._id,
      status: { $in: ['REQUESTED', 'PENDING_CONFIRMATION'] }
    })
    .populate('userId', 'firstName lastName email phone')
    .sort({ createdAt: -1 });

    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Confirm appointment
// @route   PUT /api/professional/appointments/:id/confirm
// @access  Private/Professional
const confirmAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    if (appointment.professionalId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    appointment.status = 'CONFIRMED';
    appointment.confirmedAt = new Date();

    await appointment.save();

    res.json(appointment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Cancel appointment
// @route   PUT /api/professional/appointments/:id/cancel
// @access  Private/Professional
const cancelAppointment = async (req, res) => {
  try {
    const { reason } = req.body;
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    if (appointment.professionalId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    appointment.status = 'CANCELLED';
    appointment.cancelledAt = new Date();
    appointment.cancellationReason = reason;

    await appointment.save();

    res.json(appointment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get professional profile
// @route   GET /api/professional/profile
// @access  Private/Professional
const getProfile = async (req, res) => {
  try {
    const professional = await Professional.findById(req.user._id).select('-password');
    res.json(professional);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update professional profile
// @route   PUT /api/professional/profile
// @access  Private/Professional
const updateProfile = async (req, res) => {
  try {
    const professional = await Professional.findById(req.user._id);

    if (!professional) {
      return res.status(404).json({ message: 'Professional not found' });
    }

    // Update fields
    if (req.body.description) professional.description = req.body.description;
    if (req.body.phone) professional.phone = req.body.phone;
    if (req.body.address) professional.address = req.body.address;
    if (req.body.availabilities) professional.availabilities = req.body.availabilities;
    if (req.body.pricing) professional.pricing = req.body.pricing;
    if (req.body.profileImage) professional.profileImage = req.body.profileImage;

    await professional.save();

    res.json({
      message: 'Profile updated successfully',
      professional: await Professional.findById(req.user._id).select('-password')
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAppointments,
  getPendingAppointments,
  confirmAppointment,
  cancelAppointment,
  getProfile,
  updateProfile
};
