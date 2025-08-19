const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  subcategory_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subcategory',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  date: {
    type: Number,
    required: true,
    default: Date.now(),
    get: function(timestamp) {
      return new Date(timestamp);
    },
    set: function(date) {
      return date instanceof Date ? date.getTime() : date;
    }
  },
  mode_of_payment: {
    type: String,
    required: true,
    enum: ['cash', 'card', 'upi', 'net_banking', 'other']
  },
  notes: {
    type: String,
  },
  currency: {
    type: String,
    required: true,
    enum: ['INR', 'USD', 'EUR', 'GBP'],
    default: 'INR'
  },
}, {
  timestamps: true
});

// Indexes
expenseSchema.index({ user_id: 1, date: -1 }); // For user-specific expense queries sorted by date
expenseSchema.index({ subcategory_id: 1, date: -1 }); // For subcategory-specific expense queries

// Method to get expense with populated references
expenseSchema.methods.getPopulatedExpense = async function() {
  return await this.model('Expense')
    .findById(this._id)
    .populate('user_id', 'name email profile_img')
    .populate({
      path: 'subcategory_id',
      populate: {
        path: 'category_id',
        select: 'name'
      },
      select: 'name'
    });
};

module.exports = mongoose.model('Expense', expenseSchema);
