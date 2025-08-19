// Exchange rates (as of knowledge cutoff, in terms of 1 USD)
const EXCHANGE_RATES = {
  USD: 1,
  INR: 87.35, // Example rate, replace with current rates
  EUR: 0.85, // Example rate, replace with current rates
  GBP: 0.74, // Example rate, replace with current rates
};

/**
 * Convert amount from one currency to another
 * @param {number} amount - The amount to convert
 * @param {string} fromCurrency - Source currency code (e.g., 'USD', 'INR')
 * @param {string} toCurrency - Target currency code (e.g., 'USD', 'INR')
 * @returns {number} - Converted amount
 */
const convertCurrency = (amount, fromCurrency, toCurrency) => {
  if (fromCurrency === toCurrency) return amount;

  // Convert to USD first, then to target currency
  const amountInUSD = amount / EXCHANGE_RATES[fromCurrency];
  return parseFloat((amountInUSD * EXCHANGE_RATES[toCurrency]).toFixed(2));
};

/**
 * Process expenses to convert amounts to user's preferred currency
 * @param {Object|Array} expenses - Single expense object or array of expenses
 * @param {string} targetCurrency - The user's preferred currency
 * @returns {Object|Array} - Processed expense(s) with converted amounts
 */
const processExpenseCurrency = (expenses, targetCurrency) => {
  if (!expenses) return expenses;

  const processSingleExpense = (expense) => {
    if (!expense || !expense.amount || !expense.currency) return expense;

    if (expense.currency !== targetCurrency) {
      const convertedAmount = convertCurrency(
        expense.amount,
        expense.currency,
        targetCurrency
      );

      return {
        ...(expense.toObject ? expense.toObject() : expense),
        amount: convertedAmount,
        currency: targetCurrency,
      };
    }

    return expense.toObject ? expense.toObject() : expense;
  };

  return Array.isArray(expenses)
    ? expenses.map(processSingleExpense)
    : processSingleExpense(expenses);
};

module.exports = {
  convertCurrency,
  processExpenseCurrency,
};
