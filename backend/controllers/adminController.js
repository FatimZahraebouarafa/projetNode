const Professional = require('../models/Professional');

// @desc    Get all pending professionals
// @route   GET /api/admin/professionals/pending
// @access  Private/Admin
const getPendingProfessionals = async (req, res) => {
  try {
    const professionals = await Professional.find({ status: 'PENDING' })
      .select('-password')
      .sort({ createdAt: -1 });

    console.log('🔍 Pending professionals count:', professionals.length);
    if (professionals.length > 0) {
      console.log('📸 First professional has image:', !!professionals[0].profileImage);
      if (professionals[0].profileImage) {
        console.log('📏 Image length:', professionals[0].profileImage.length);
      }
    }

    res.json(professionals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all professionals (any status)
// @route   GET /api/admin/professionals
// @access  Private/Admin
const getAllProfessionals = async (req, res) => {
  try {
    const professionals = await Professional.find()
      .select('-password')
      .sort({ createdAt: -1 });

    res.json(professionals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Approve professional
// @route   PUT /api/admin/professionals/:id/approve
// @access  Private/Admin
const approveProfessional = async (req, res) => {
  try {
    const professional = await Professional.findById(req.params.id);

    if (!professional) {
      return res.status(404).json({ message: 'Professional not found' });
    }

    professional.status = 'APPROVED';
    professional.isValidated = true;
    professional.validationDate = new Date();

    await professional.save();

    res.json({
      message: 'Professional approved successfully',
      professional: {
        _id: professional._id,
        firstName: professional.firstName,
        lastName: professional.lastName,
        email: professional.email,
        status: professional.status
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Reject professional
// @route   PUT /api/admin/professionals/:id/reject
// @access  Private/Admin
const rejectProfessional = async (req, res) => {
  try {
    const { reason } = req.body;
    const professional = await Professional.findById(req.params.id);

    if (!professional) {
      return res.status(404).json({ message: 'Professional not found' });
    }

    professional.status = 'REJECTED';
    professional.isValidated = false;
    professional.rejectionReason = reason || 'Not specified';

    await professional.save();

    res.json({
      message: 'Professional rejected',
      professional: {
        _id: professional._id,
        firstName: professional.firstName,
        lastName: professional.lastName,
        email: professional.email,
        status: professional.status,
        rejectionReason: professional.rejectionReason
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get admin statistics
// @route   GET /api/admin/stats
// @access  Private/Admin
const getStats = async (req, res) => {
  try {
    const User = require('../models/User');
    const Appointment = require('../models/Appointment');

    const totalUsers = await User.countDocuments();
    const totalProfessionals = await Professional.countDocuments();
    const pendingProfessionals = await Professional.countDocuments({ status: 'PENDING' });
    const approvedProfessionals = await Professional.countDocuments({ status: 'APPROVED' });
    const totalAppointments = await Appointment.countDocuments();

    res.json({
      totalUsers,
      totalProfessionals,
      pendingProfessionals,
      approvedProfessionals,
      totalAppointments
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getPendingProfessionals,
  getAllProfessionals,
  approveProfessional,
  rejectProfessional,
  getStats
};
