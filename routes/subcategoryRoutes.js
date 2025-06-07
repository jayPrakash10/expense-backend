const express = require('express');
const router = express.Router();
const subcategoryController = require('../controllers/subcategoryController');

// Create subcategory
router.post('/', subcategoryController.createSubcategory);

// Get all subcategories for a category
router.get('/category/:category_id', subcategoryController.getSubcategoriesByCategory);

// Get all subcategories
router.get('/', subcategoryController.getAllSubcategories);

// Get single subcategory
router.get('/:id', subcategoryController.getSubcategory);

// Update subcategory
router.put('/:id', subcategoryController.updateSubcategory);

// Delete subcategory
router.delete('/:id', subcategoryController.deleteSubcategory);

module.exports = router;
