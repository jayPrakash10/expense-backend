const Expense = require('../models/Expense');
const User = require('../models/User');
const Subcategory = require('../models/Subcategory');

// Create a new expense
exports.createExpense = async (req, res) => {
  try {
    const { subcategory_id, amount, date, mode_of_payment, notes } = req.body;

    // Validate required fields
    if (!subcategory_id || !amount || !date || !mode_of_payment) {
      return res.status(400).json({
        success: false,
        message: 'All required fields are mandatory'
      });
    }

    // Validate user exists using token user_id
    const user = await User.findById(req.user_id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Validate subcategory exists
    const subcategory = await Subcategory.findById(subcategory_id);
    if (!subcategory) {
      return res.status(404).json({
        success: false,
        message: 'Subcategory not found'
      });
    }

    // Create new expense
    const expense = new Expense({
      user_id: req.user_id,
      subcategory_id,
      amount,
      date,
      mode_of_payment,
      notes
    });

    await expense.save();

    // Get populated expense
    const populatedExpense = await expense.getPopulatedExpense();

    res.status(201).json({
      success: true,
      message: 'Expense created successfully',
      data: populatedExpense
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get all expenses for a user
exports.getUserExpenses = async (req, res) => {
  try {
    const { user_id } = req.params;

    // Validate user exists
    const user = await User.findById(user_id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get query parameters
    const { category_id, subcategory_id, startDate, endDate, page = 1, limit = 10 } = req.query;

    // Build query
    const query = { user_id };
    if (category_id) query.category_id = category_id;
    if (subcategory_id) query.subcategory_id = subcategory_id;
    if (startDate) query.date = { $gte: new Date(startDate) };
    if (endDate) {
      if (!query.date) query.date = {};
      query.date.$lte = new Date(endDate);
    }

    // Get total count
    const total = await Expense.countDocuments(query);

    // Get expenses with pagination
    const expenses = await Expense.find(query)
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('user_id', 'name email profile_img')
      .populate({
        path: 'subcategory_id',
        populate: {
          path: 'category_id',
          select: 'name'
        },
        select: 'name'
      });

    res.status(200).json({
      success: true,
      data: expenses,
      meta: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get a single expense
exports.getExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id)
      .populate('user_id', 'name email profile_img')
      .populate({
        path: 'subcategory_id',
        populate: {
          path: 'category_id',
          select: 'name'
        },
        select: 'name'
      });

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    res.status(200).json({
      success: true,
      data: expense
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update an expense
exports.updateExpense = async (req, res) => {
  try {
    const { subcategory_id, amount, date, mode_of_payment, notes } = req.body;
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    // Validate subcategory if provided
    if (subcategory_id) {
      const subcategory = await Subcategory.findById(subcategory_id);
      if (!subcategory) {
        return res.status(404).json({
          success: false,
          message: 'Subcategory not found'
        });
      }
      expense.subcategory_id = subcategory_id;
    }

    if (amount !== undefined) expense.amount = amount;
    if (date) expense.date = date;
    if (mode_of_payment) expense.mode_of_payment = mode_of_payment;
    if (notes !== undefined) expense.notes = notes;

    await expense.save();

    // Get populated expense
    const populatedExpense = await expense.getPopulatedExpense();

    res.status(200).json({
      success: true,
      message: 'Expense updated successfully',
      data: populatedExpense
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Delete an expense
exports.deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    await expense.deleteOne();
    res.status(200).json({
      success: true,
      message: 'Expense deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
