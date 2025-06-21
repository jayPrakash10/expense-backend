const express = require("express");
const router = express.Router();
const expenseController = require("../controllers/expenseController");
const auth = require("../middleware/authMiddleware");

// Create expense
router.post("/", auth, expenseController.createExpense);

// Get all expenses for a user with optional filters
router.get("/", auth, expenseController.getUserExpenses);

// Get expenses for a specific month
router.get("/month", auth, expenseController.getExpensesByMonth);
router.get("/year", auth, expenseController.getExpensesByYear);

// Get single expense
router.get("/:id", auth, expenseController.getExpense);

// Update expense
router.put("/:id", auth, expenseController.updateExpense);

// Delete multiple expenses
router.delete("/bulk", auth, expenseController.deleteMultipleExpenses);

// Delete expense
router.delete("/:id", auth, expenseController.deleteExpense);

module.exports = router;
