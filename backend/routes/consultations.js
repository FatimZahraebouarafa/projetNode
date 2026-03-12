const express = require('express');
const router = express.Router();
const {
  startConsultation,
  joinConsultation,
  endConsultation,
  getConsultationHistory
} = require('../controllers/consultationController');
const { protect } = require('../middleware/auth');

// All routes are protected
router.use(protect);

// Start consultation (Professional only)
router.post('/:appointmentId/start', startConsultation);

// Join consultation room
router.get('/:appointmentId/join', joinConsultation);

// End consultation (Professional only)
router.put('/:appointmentId/end', endConsultation);

// Get consultation history
router.get('/:appointmentId/history', getConsultationHistory);

module.exports = router;
