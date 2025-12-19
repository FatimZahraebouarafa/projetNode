const express = require('express');
const router = express.Router();
const {
  getApprovedProfessionals,
  getProfessionalById
} = require('../controllers/userController');

// Public routes
router.get('/professionals', getApprovedProfessionals);
router.get('/professionals/:id', getProfessionalById);

module.exports = router;
