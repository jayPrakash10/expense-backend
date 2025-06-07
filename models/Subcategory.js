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
  }
}, {
  timestamps: true
});

// Index for category_id and name (unique combination)
subcategorySchema.index({ category_id: 1, name: 1 }, { unique: true });

// Method to check if subcategory exists
subcategorySchema.statics.exists = async function(category_id, name) {
  return await this.findOne({ category_id, name }).then(doc => !!doc);
};

module.exports = mongoose.model('Subcategory', subcategorySchema);
