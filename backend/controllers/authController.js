const User = require('../models/User');
const Professional = require('../models/Professional');
const generateToken = require('../utils/generateToken');

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, password } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ email });
    const professionalExists = await Professional.findOne({ email });

    if (userExists || professionalExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create user
    const user = await User.create({
      firstName,
      lastName,
      email,
      phone,
      password,
      role: 'USER'
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        token: generateToken(user._id, user.role)
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check for user
    let user = await User.findOne({ email });
    let isProfessional = false;

    // If not found in users, check professionals
    if (!user) {
      user = await Professional.findOne({ email });
      isProfessional = true;
    }

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check if professional is approved
    if (isProfessional && user.status !== 'APPROVED') {
      return res.status(403).json({ 
        message: 'Your account is pending admin approval',
        status: user.status
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    res.json({
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      status: user.status,
      token: generateToken(user._id, user.role)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Register a new professional
// @route   POST /api/auth/professional/register
// @access  Public
const registerProfessional = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      password,
      specialty,
      description,
      profileImage,
      address,
      qualifications,
      documents,
      availabilities,
      pricing
    } = req.body;

    console.log('📸 ProfileImage received:', profileImage ? 'YES (length: ' + profileImage.length + ')' : 'NO');
    console.log('📝 Registration data:', { firstName, lastName, email, specialty, hasImage: !!profileImage });

    // Check if professional exists
    const userExists = await User.findOne({ email });
    const professionalExists = await Professional.findOne({ email });

    if (userExists || professionalExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create professional
    const professional = await Professional.create({
      firstName,
      lastName,
      email,
      phone,
      password,
      specialty,
      description,
      profileImage,
      address,
      qualifications,
      documents,
      availabilities,
      pricing,
      role: 'PROFESSIONAL',
      status: 'PENDING',
      isValidated: false
    });

    if (professional) {
      res.status(201).json({
        _id: professional._id,
        firstName: professional.firstName,
        lastName: professional.lastName,
        email: professional.email,
        role: professional.role,
        status: professional.status,
        message: 'Registration successful! Your account is pending admin approval.'
      });
    } else {
      res.status(400).json({ message: 'Invalid professional data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/profile
// @access  Private
const getProfile = async (req, res) => {
  try {
    res.json(req.user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  registerProfessional,
  getProfile
};
