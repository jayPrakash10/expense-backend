const mongoose = require("mongoose");

const monthlyIncomeSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    year: {
      type: Number,
      required: true,
    },
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },
    income: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    currency: {
      type: String,
      required: true,
      enum: ["INR", "USD", "EUR", "GBP"],
    },
    updated_at: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Index to ensure unique income record per user per month
monthlyIncomeSchema.index({ user_id: 1, year: 1, month: 1 }, { unique: true });

// Static method to get or create income record for current month
monthlyIncomeSchema.statics.getOrCreateCurrentMonthIncome = async function (
  user_id,
  check_year = new Date().getFullYear(),
  check_month = new Date().getMonth() + 1
) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // Months are 0-indexed

  let income = await this.findOne({
    user_id,
    year: check_year,
    month: check_month,
  });
  if (!income && check_year === year && check_month === month) {
    // Get user's currency setting and current income
    const settings = await mongoose.model("UserSettings").findOne({ user_id });
    const currency = settings?.currency || "INR";
    const incomeAmount = settings?.currentIncome || 0;

    income = new this({
      user_id,
      year,
      month,
      income: incomeAmount,
      currency,
    });
    await income.save();
  }
  return income;
};

// Static method to get income records for a specific year
monthlyIncomeSchema.statics.getIncomesForYear = async function (user_id, year) {
  return this.find({ user_id, year })
    .sort({ month: 1 })
    .select("-_id -__v -createdAt -updatedAt");
};

module.exports = mongoose.model("MonthlyIncome", monthlyIncomeSchema);
