const nodemailer = require('nodemailer');

// Create a transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const emailService = {
  sendOTP: async (email, otp) => {
    try {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Expense App - Your OTP',
        text: `Your OTP for Expense App is: ${otp}. This OTP will expire in 5 minutes. Please do not share this OTP with anyone.`,
        html: `
          <h2>Expense App OTP</h2>
          <p>Your One Time Password (OTP) is: <strong>${otp}</strong></p>
          <p>This OTP will expire in 5 minutes.</p>
          <p>Please do not share this OTP with anyone.</p>
        `
      };

      const info = await transporter.sendMail(mailOptions);
      return {
        success: true,
        message: 'OTP sent successfully',
        messageId: info.messageId
      };
    } catch (error) {
      console.error('Email Error:', error);
      throw new Error('Failed to send OTP');
    }
  }
};

module.exports = emailService;
