const MonthlyIncome = require('../models/MonthlyIncome');

// Get or create current month's income record
exports.getCurrentMonthIncome = async (req, res) => {
  try {
    const income = await MonthlyIncome.getOrCreateCurrentMonthIncome(req.user_id);
    res.status(200).json({
      success: true,
      data: {
        year: income.year,
        month: income.month,
        income: income.income,
        currency: income.currency,
        updated_at: income.updated_at
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update current month's income
exports.updateCurrentMonthIncome = async (req, res) => {
  try {
    const { income } = req.body;
    if (typeof income !== 'number' || income < 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid income amount'
      });
    }

    const incomeRecord = await MonthlyIncome.getOrCreateCurrentMonthIncome(req.user_id);
    incomeRecord.income = income;
    incomeRecord.updated_at = new Date();
    await incomeRecord.save();

    res.status(200).json({
      success: true,
      message: 'Income updated successfully',
      data: {
        year: incomeRecord.year,
        month: incomeRecord.month,
        income: incomeRecord.income,
        currency: incomeRecord.currency,
        updated_at: incomeRecord.updated_at
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get all monthly incomes for a specific year
exports.getIncomesForYear = async (req, res) => {
  try {
    const { year } = req.params;
    if (!year || isNaN(year)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid year'
      });
    }

    const incomes = await MonthlyIncome.getIncomesForYear(req.user_id, parseInt(year));
    res.status(200).json({
      success: true,
      data: incomes
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
