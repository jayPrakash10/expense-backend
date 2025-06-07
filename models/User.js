const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    unique: true,
    required: true
  },
  phone: {
    type: String,
    trim: true,
    unique: true,
    sparse: true // This will prevent MongoDB from creating an index for null values
  },
  profile_img: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Custom validation to ensure either email or phone is provided
userSchema.path('email').validate(function(email) {
  return this.email || this.phone;
}, 'Either email or phone is required');

userSchema.path('phone').validate(function(phone) {
  return this.email || this.phone;
}, 'Either email or phone is required');

module.exports = mongoose.model('User', userSchema);
