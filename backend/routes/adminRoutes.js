const express = require('express');
const router = express.Router();
const {
  getPendingProfessionals,
  getAllProfessionals,
  approveProfessional,
  rejectProfessional,
  getStats
} = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/auth');

// All routes are protected and admin-only
router.use(protect);
router.use(adminOnly);

router.get('/professionals/pending', getPendingProfessionals);
router.get('/professionals', getAllProfessionals);
router.put('/professionals/:id/approve', approveProfessional);
router.put('/professionals/:id/reject', rejectProfessional);
router.get('/stats', getStats);

module.exports = router;
