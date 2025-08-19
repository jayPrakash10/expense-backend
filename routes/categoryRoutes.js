const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const auth = require('../middleware/authMiddleware');

// Create category
router.post('/', auth, categoryController.createCategory);

// Get all categories
router.get('/', auth, categoryController.getAllCategories);

// Get single category
router.get('/:id', auth, categoryController.getCategory);

// Update category
router.put('/:id', auth, categoryController.updateCategory);

// Delete category
router.delete('/:id', auth, categoryController.deleteCategory);

// Bulk delete categories
router.delete('/', auth, categoryController.bulkDeleteCategories);

module.exports = router;
