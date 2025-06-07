const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Send OTP to phone
router.post('/send-otp', authController.sendOTP);

// Verify OTP and get token
router.post('/verify-otp', authController.verifyOTP);

module.exports = router;
