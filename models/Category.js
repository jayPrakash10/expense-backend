const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  color: {
    type: String,
    required: true,
    trim: true
  }
}, {
  timestamps: true
});

// Method to check if category name exists
categorySchema.statics.exists = async function({ name }) {
  return await this.findOne({ name }).then(doc => !!doc);
};

module.exports = mongoose.model('Category', categorySchema);
