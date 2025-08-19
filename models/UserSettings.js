const mongoose = require('mongoose');

const userSettingsSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  currency: {
    type: String,
    enum: ['INR', 'USD', 'EUR', 'GBP'],
    default: 'INR'
  },
  language: {
    type: String,
    enum: ['english', 'hindi', 'spanish', 'french', 'german'],
    default: 'english'
  },
  currentIncome: {
    type: Number,
    default: 0,
    min: 0
  },
  quickAdd: [{
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subcategory'
    },
    name: {
      type: String,
      required: true
    },
    color: {
      type: String,
      required: true
    }
  }],
}, {
  timestamps: true
});

// Static method to get or create settings for a user
userSettingsSchema.statics.getOrCreateSettings = async function(user_id) {
  let settings = await this.findOne({ user_id });
  if (!settings) {
    settings = new this({ user_id });
    await settings.save();
  }
  return settings;
};

module.exports = mongoose.model('UserSettings', userSettingsSchema);
