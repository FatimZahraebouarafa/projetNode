const express = require('express');
const router = express.Router();
const {
  createAppointment,
  getUserAppointments,
  cancelUserAppointment
} = require('../controllers/appointmentController');
const { protect, userOnly } = require('../middleware/auth');

// All routes require authentication and USER role
router.use(protect);
router.use(userOnly);

router.post('/', createAppointment);
router.get('/', getUserAppointments);
router.put('/:id/cancel', cancelUserAppointment);

module.exports = router;
