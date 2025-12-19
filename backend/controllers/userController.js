const Professional = require('../models/Professional');

// @desc    Get all approved professionals
// @route   GET /api/user/professionals
// @access  Public
const getApprovedProfessionals = async (req, res) => {
  try {
    const { specialty, search } = req.query;
    
    let query = { status: 'APPROVED', isValidated: true, isActive: true };

    // Filter by specialty
    if (specialty) {
      query.specialty = specialty;
    }

    // Search by name or description
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const professionals = await Professional.find(query)
      .select('-password')
      .sort({ rating: -1, reviewCount: -1 });

    res.json(professionals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get professional by ID
// @route   GET /api/user/professionals/:id
// @access  Public
const getProfessionalById = async (req, res) => {
  try {
    const professional = await Professional.findById(req.params.id)
      .select('-password');

    if (!professional) {
      return res.status(404).json({ message: 'Professional not found' });
    }

    if (professional.status !== 'APPROVED' || !professional.isValidated) {
      return res.status(403).json({ message: 'Professional not available' });
    }

    res.json(professional);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getApprovedProfessionals,
  getProfessionalById
};
