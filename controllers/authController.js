const User = require("../models/User");
const UserSettings = require("../models/UserSettings");
const OTP = require("../models/OTP");
const jwt = require("jsonwebtoken");
const emailService = require("../services/emailService");

// Send OTP to email
exports.sendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    // Find user by email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Generate new OTP
    const otp = await OTP.generateOTP(email);

    // Send OTP via email
    await emailService.sendOTP(email, otp.code);

    res.status(200).json({
      success: true,
      message: "OTP sent successfully",
      data: {
        email,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Verify OTP and generate JWT token
exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required",
      });
    }

    // Find user by email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Verify OTP
    const validOTP = await OTP.verifyOTP(email, otp);

    if (!validOTP) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP",
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET
    );

    res.status(200).json({
      success: true,
      message: "Authentication successful",
      data: {
        token,
        user: user,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Handle Google authentication
exports.googleAuth = async (req, res) => {
  try {
    const { email, name, profile_img } = req.body;

    if (!email || !name) {
      return res.status(400).json({
        success: false,
        message: "Email and name are required",
      });
    }

    // Check if user exists
    let user = await User.findOne({ email });

    if (!user) {
      // Create new user
      user = new User({
        name,
        email,
        profile_img,
      });

      await user.save();

      // Create default user settings
      const settings = new UserSettings({
        user_id: user._id,
      });
      await settings.save();
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET
    );

    res.status(200).json({
      success: true,
      message: user._id
        ? "User created successfully"
        : "User logged in successfully",
      data: {
        token,
        user: user,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
