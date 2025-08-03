const Expense = require("../models/Expense");
const User = require("../models/User");
const Subcategory = require("../models/Subcategory");

// Create a new expense
exports.createExpense = async (req, res) => {
  try {
    const { subcategory_id, amount, date, mode_of_payment, notes } = req.body;

    // Validate required fields
    if (!subcategory_id || !amount || !date || !mode_of_payment) {
      return res.status(400).json({
        success: false,
        message: "All required fields are mandatory",
      });
    }

    // Validate user exists using token user_id
    const user = await User.findById(req.user_id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Validate subcategory exists
    const subcategory = await Subcategory.findById(subcategory_id);
    if (!subcategory) {
      return res.status(404).json({
        success: false,
        message: "Subcategory not found",
      });
    }

    // Create new expense
    const expense = new Expense({
      user_id: req.user_id,
      subcategory_id,
      amount,
      date,
      mode_of_payment,
      notes,
    });

    await expense.save();

    // Get populated expense
    const populatedExpense = await expense.getPopulatedExpense();

    res.status(201).json({
      success: true,
      message: "Expense created successfully",
      data: populatedExpense,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get all expenses for a user
exports.getUserExpenses = async (req, res) => {
  try {
    // Get user_id from middleware
    const user_id = req.user_id;

    // Validate user exists
    const user = await User.findById(user_id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Get query parameters
    const {
      category_id,
      subcategory_id,
      startDate,
      endDate,
      mode_of_payment,
      page = 1,
      limit = 10,
    } = req.query;

    // Build query
    const query = { user_id };
    if (category_id) query.category_id = category_id;
    if (subcategory_id) query.subcategory_id = subcategory_id;
    if (mode_of_payment) query.mode_of_payment = mode_of_payment;
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
      .populate("user_id", "name email profile_img")
      .populate({
        path: "subcategory_id",
        populate: {
          path: "category_id",
          select: "name",
        },
        select: "name",
      });

    res.status(200).json({
      success: true,
      data: expenses,
      meta: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get expenses for a specific year
exports.getExpensesByYear = async (req, res) => {
  try {
    // Get year from query parameters
    const { year } = req.query;

    if (!year) {
      return res.status(400).json({
        success: false,
        message: "Year is required",
      });
    }

    // Validate year
    const yearNum = parseInt(year);
    if (isNaN(yearNum) || yearNum < 2000) {
      return res.status(400).json({
        success: false,
        message: "Invalid year",
      });
    }

    // Get start and end dates for the year
    const startDate = new Date(yearNum, 0, 1); // January 1st
    const endDate = new Date(yearNum, 11, 31); // December 31st

    // Build query
    const query = {
      user_id: req.user_id,
      date: {
        $gte: startDate,
        $lte: endDate,
      },
    };

    // Get expenses with pagination
    const expenses = await Expense.find(query)
      .sort({ date: -1 })
      .populate("user_id", "name email profile_img")
      .populate({
        path: "subcategory_id",
        populate: {
          path: "category_id",
          select: "name",
        },
        select: "name",
      });

    // Calculate total amount for the year
    const totalAmount = expenses.reduce(
      (sum, expense) => sum + expense.amount,
      0
    );

    // Generate analytics data
    const analytics = {
      monthly: {},
      paymentModes: {},
    };

    // Process expenses for analytics
    expenses.forEach((expense) => {
      // Monthly analytics
      const month = new Date(expense.date).getMonth() + 1; // Months are 0-based in JS
      if (!analytics.monthly[month]) {
        analytics.monthly[month] = 0;
      }
      analytics.monthly[month] += expense.amount;

      // Payment mode analytics
      if (!analytics.paymentModes[expense.mode_of_payment]) {
        analytics.paymentModes[expense.mode_of_payment] = 0;
      }
      analytics.paymentModes[expense.mode_of_payment] += expense.amount;
    });

    // Convert monthly analytics to array
    const monthlyAnalytics = [];
    for (let month = 1; month <= 12; month++) {
      monthlyAnalytics.push({
        month,
        amount: analytics.monthly[month] || 0,
      });
    }

    // Convert payment mode analytics to array
    const paymentModeAnalytics = [];
    const modes = Object.keys(analytics.paymentModes);
    modes.forEach((mode) => {
      paymentModeAnalytics.push({
        mode,
        amount: analytics.paymentModes[mode],
      });
    });

    // Calculate most used payment mode by count
    const paymentModeCount = {};
    expenses.forEach((expense) => {
      if (!paymentModeCount[expense.mode_of_payment]) {
        paymentModeCount[expense.mode_of_payment] = 0;
      }
      paymentModeCount[expense.mode_of_payment]++;
    });

    // Find most used payment mode by count
    let mostUsedMode = null;
    let maxCount = 0;
    for (const [mode, count] of Object.entries(paymentModeCount)) {
      if (count > maxCount) {
        maxCount = count;
        mostUsedMode = mode;
      }
    }

    // Find payment mode with highest total amount
    let highestAmountMode = null;
    let maxAmount = 0;
    for (const [mode, amount] of Object.entries(analytics.paymentModes)) {
      if (amount > maxAmount) {
        maxAmount = amount;
        highestAmountMode = mode;
      }
    }

    res.status(200).json({
      success: true,
      data: {
        expenses,
        totalAmount,
        year: yearNum,
        startDate: startDate.toISOString().split("T")[0],
        endDate: endDate.toISOString().split("T")[0],
        analytics: {
          monthly: monthlyAnalytics,
          paymentModes: paymentModeAnalytics,
          mostUsedPaymentMode: {
            mode: mostUsedMode,
            count: maxCount,
          },
          highestAmountPaymentMode: {
            mode: highestAmountMode,
            amount: maxAmount,
          },
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get expenses for a specific month
exports.getExpensesByMonth = async (req, res) => {
  try {
    // Get month and year from query parameters
    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({
        success: false,
        message: "Month and year are required",
      });
    }

    // Validate month and year
    const monthNum = parseInt(month);
    const yearNum = parseInt(year);

    if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      return res.status(400).json({
        success: false,
        message: "Invalid month",
      });
    }

    if (isNaN(yearNum) || yearNum < 2000) {
      return res.status(400).json({
        success: false,
        message: "Invalid year",
      });
    }

    // Get start and end dates for the month
    const startDate = new Date(yearNum, monthNum - 1, 1);
    const endDate = new Date(yearNum, monthNum, 0);
    console.log("========================================");
    console.log(startDate, endDate);

    // Build query
    const query = {
      user_id: req.user_id,
      date: {
        $gte: startDate,
        $lte: endDate,
      },
    };

    // Get expenses with pagination
    const expenses = await Expense.find(query)
      .sort({ date: -1 })
      .populate("user_id", "name email profile_img")
      .populate({
        path: "subcategory_id",
        populate: {
          path: "category_id",
          select: "name",
        },
        select: "name",
      });

    // Calculate total amount for the month
    const totalAmount = expenses.reduce(
      (sum, expense) => sum + expense.amount,
      0
    );

    // Generate analytics data
    const analytics = {
      daily: {},
      paymentModes: {},
    };

    // Process expenses for analytics
    expenses.forEach((expense) => {
      // Daily analytics
      const date = new Date(expense.date);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-indexed
      const day = String(date.getDate()).padStart(2, "0");
      console.log("========================================");
      console.log(year, month, day);

      const dateStr = `${year}-${month}-${day}`;
      if (!analytics.daily[dateStr]) {
        analytics.daily[dateStr] = 0;
      }
      analytics.daily[dateStr] += expense.amount;

      // Payment mode analytics
      if (!analytics.paymentModes[expense.mode_of_payment]) {
        analytics.paymentModes[expense.mode_of_payment] = 0;
      }
      analytics.paymentModes[expense.mode_of_payment] += expense.amount;
    });

    // Convert daily analytics to array
    const dailyAnalytics = [];
    const dates = Object.keys(analytics.daily).sort();
    dates.forEach((date) => {
      dailyAnalytics.push({
        date,
        amount: analytics.daily[date],
      });
    });

    // Convert payment mode analytics to array
    const paymentModeAnalytics = [];
    const modes = Object.keys(analytics.paymentModes);
    modes.forEach((mode) => {
      paymentModeAnalytics.push({
        mode,
        amount: analytics.paymentModes[mode],
      });
    });

    // Calculate most used payment mode by count
    const paymentModeCount = {};
    expenses.forEach((expense) => {
      if (!paymentModeCount[expense.mode_of_payment]) {
        paymentModeCount[expense.mode_of_payment] = 0;
      }
      paymentModeCount[expense.mode_of_payment]++;
    });

    // Find most used payment mode by count
    let mostUsedMode = null;
    let maxCount = 0;
    for (const [mode, count] of Object.entries(paymentModeCount)) {
      if (count > maxCount) {
        maxCount = count;
        mostUsedMode = mode;
      }
    }

    // Find payment mode with highest total amount
    let highestAmountMode = null;
    let maxAmount = 0;
    for (const [mode, amount] of Object.entries(analytics.paymentModes)) {
      if (amount > maxAmount) {
        maxAmount = amount;
        highestAmountMode = mode;
      }
    }

    res.status(200).json({
      success: true,
      data: {
        expenses,
        totalAmount,
        month: monthNum,
        year: yearNum,
        startDate: startDate.toISOString().split("T")[0],
        endDate: endDate.toISOString().split("T")[0],
        analytics: {
          daily: dailyAnalytics,
          paymentModes: paymentModeAnalytics,
          mostUsedPaymentMode: {
            mode: mostUsedMode,
            count: maxCount,
          },
          highestAmountPaymentMode: {
            mode: highestAmountMode,
            amount: maxAmount,
          },
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get a single expense
exports.getExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id)
      .populate("user_id", "name email profile_img")
      .populate({
        path: "subcategory_id",
        populate: {
          path: "category_id",
          select: "name",
        },
        select: "name",
      });

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: "Expense not found",
      });
    }

    res.status(200).json({
      success: true,
      data: expense,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
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
        message: "Expense not found",
      });
    }

    // Validate subcategory if provided
    if (subcategory_id) {
      const subcategory = await Subcategory.findById(subcategory_id);
      if (!subcategory) {
        return res.status(404).json({
          success: false,
          message: "Subcategory not found",
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
      message: "Expense updated successfully",
      data: populatedExpense,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete multiple expenses
exports.deleteMultipleExpenses = async (req, res) => {
  try {
    console.log("expenseIds", req.body);
    const expenseIds = req.body.ids;

    if (!expenseIds || !Array.isArray(expenseIds) || expenseIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Expense IDs are required",
      });
    }

    // Validate all expenses belong to the user
    // const expenses = await Expense.find({
    //   _id: { $in: expenseIds },
    //   user_id: req.user_id
    // });

    // if (expenses.length !== expenseIds.length) {
    //   return res.status(400).json({
    //     success: false,
    //     message: 'Some expenses do not exist or belong to another user'
    //   });
    // }

    // Delete the expenses
    const deleteResult = await Expense.deleteMany({
      _id: { $in: expenseIds },
      user_id: req.user_id,
    });

    res.status(200).json({
      success: true,
      message: "Expenses deleted successfully",
      data: {
        deletedCount: deleteResult.deletedCount,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
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
        message: "Expense not found",
      });
    }

    await expense.deleteOne();
    res.status(200).json({
      success: true,
      message: "Expense deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
