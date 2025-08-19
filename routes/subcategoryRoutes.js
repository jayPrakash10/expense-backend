const express = require("express");
const router = express.Router();
const subcategoryController = require("../controllers/subcategoryController");
const auth = require("../middleware/authMiddleware");

// Create subcategory
router.post("/", auth, subcategoryController.createSubcategory);

// Bulk create subcategories for a category
router.post("/bulk", auth, subcategoryController.bulkCreateSubcategories);

// Get all subcategories for a category
router.get(
  "/category/:category_id",
  auth,
  subcategoryController.getSubcategoriesByCategory
);

// Get all subcategories
router.get("/", auth, subcategoryController.getAllSubcategories);

// Get single subcategory
router.get("/:id", auth, subcategoryController.getSubcategory);

// Update subcategory
router.put("/:id", auth, subcategoryController.updateSubcategory);

// Delete subcategory
router.delete("/:id", auth, subcategoryController.deleteSubcategory);

// Bulk delete subcategories
router.delete("/", auth, subcategoryController.bulkDeleteSubcategories);

module.exports = router;
