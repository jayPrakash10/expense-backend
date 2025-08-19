const mongoose = require('mongoose');

const subcategorySchema = new mongoose.Schema({
  category_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
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

// Index for user, category_id, and name (unique combination)
subcategorySchema.index({ userId: 1, category_id: 1, name: 1 }, { unique: true });

// Method to check if subcategory exists for a user
subcategorySchema.statics.exists = async function(userId, category_id, name) {
  return await this.findOne({ userId, category_id, name }).then(doc => !!doc);
};

module.exports = mongoose.model('Subcategory', subcategorySchema);
