const express = require('express');
const router = express.Router();
const {
  getAppointments,
  getPendingAppointments,
  confirmAppointment,
  cancelAppointment,
  getProfile,
  updateProfile
} = require('../controllers/professionalController');
const { protect, professionalOnly } = require('../middleware/auth');

// All routes require authentication and PROFESSIONAL role
router.use(protect);
router.use(professionalOnly);

// Appointment routes
router.get('/appointments', getAppointments);
router.get('/appointments/pending', getPendingAppointments);
router.put('/appointments/:id/confirm', confirmAppointment);
router.put('/appointments/:id/cancel', cancelAppointment);

// Profile routes
router.get('/profile', getProfile);
router.put('/profile', updateProfile);

module.exports = router;
