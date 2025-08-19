const express = require('express');
const router = express.Router();
const monthlyIncomeController = require('../controllers/monthlyIncomeController');
const auth = require('../middleware/authMiddleware');

// Get or create current month's income record
router.get('/', auth, monthlyIncomeController.getCurrentMonthIncome);

// Update current month's income
router.put('/', auth, monthlyIncomeController.updateCurrentMonthIncome);

// Get all monthly incomes for a specific year
router.get('/year/:year', auth, monthlyIncomeController.getIncomesForYear);

module.exports = router;
