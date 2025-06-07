const express = require('express');
const router = express.Router();
const signupController = require('../controllers/signupController');

// Generate OTP for signup
router.post('/generate-otp', signupController.generateSignupOTP);

// Verify OTP and create user
router.post('/verify-otp', signupController.verifyOTPAndCreateUser);

module.exports = router;
