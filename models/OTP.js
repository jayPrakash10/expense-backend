const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  code: {
    type: String,
    required: true
  },
  expiresAt: {
    type: Date,
    required: true
  },
  used: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// TTL index to automatically delete expired documents
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Indexes
otpSchema.index({ email: 1, expiresAt: -1 });
otpSchema.index({ email: 1, expiresAt: 1 });

// Method to generate new OTP
otpSchema.statics.generateOTP = async function(email) {
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 5); // OTP expires in 5 minutes

  // Remove any existing OTP for this email
  await this.deleteMany({ email });

  const otp = new this({
    email,
    code: otpCode,
    expiresAt
  });

  await otp.save();
  return otp;
};

// Method to verify OTP
otpSchema.statics.verifyOTP = async function(email, otpCode) {
  const otp = await this.findOne({
    email,
    code: otpCode,
    used: false,
    expiresAt: { $gt: new Date() }
  });

  if (!otp) {
    return null;
  }

  // Mark OTP as used
  otp.used = true;
  await otp.save();

  return otp;
};

module.exports = mongoose.model('OTP', otpSchema);
