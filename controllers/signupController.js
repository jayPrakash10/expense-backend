const User = require('../models/User');
const OTP = require('../models/OTP');
const jwt = require('jsonwebtoken');
const emailService = require('../services/emailService');

// Step 1: Generate OTP for signup
exports.generateSignupOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists'
      });
    }

    // Generate OTP
    const otp = await OTP.generateOTP(email);

    // Send OTP via email
    await emailService.sendOTP(email, otp.code);

    res.status(200).json({
      success: true,
      message: 'OTP sent successfully for signup verification'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Step 2: Verify OTP and create user
exports.verifyOTPAndCreateUser = async (req, res) => {
  try {
    const { email, otp, name, phone, profile_img } = req.body;

    if (!email || !otp || !name) {
      return res.status(400).json({
        success: false,
        message: 'Email, OTP, and name are required'
      });
    }

    // Verify OTP
    const validOTP = await OTP.verifyOTP(email, otp);
    if (!validOTP) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP'
      });
    }

    // Create user
    const user = new User({
      name,
      email,
      phone: phone || null, // Phone is optional
      profile_img: profile_img || ''
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          profile_img: user.profile_img
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
