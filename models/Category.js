const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  color: {
    type: String,
    required: true,
    trim: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

categorySchema.index({ name: 1, userId: 1 }, { unique: true });

// Method to check if category name exists for a user
categorySchema.statics.exists = async function({ name, userId }) {
  return await this.findOne({ name, userId }).then(doc => !!doc);
};

module.exports = mongoose.model('Category', categorySchema);
