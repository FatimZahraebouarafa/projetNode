const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  registerProfessional,
  getProfile
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// Public routes
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/professional/register', registerProfessional);

// Protected routes
router.get('/profile', protect, getProfile);

module.exports = router;
