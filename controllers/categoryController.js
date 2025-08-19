const Category = require("../models/Category");
const Subcategory = require("../models/Subcategory");
const { removeSubcategoryFromQuickAdd } = require("../utils/userSettingsUtils");
const mongoose = require("mongoose");

// Create a new category
exports.createCategory = async (req, res) => {
  // Start a session and transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { name, color, subcategories = [] } = req.body;
    const userId = req.user_id;

    // Input validation
    if (!name || !color) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: !name ? "Name is required" : "Color is required",
      });
    }

    // Check if category already exists for this user
    const exists = await Category.exists({ name, userId });
    if (exists) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: "Category already exists",
      });
    }

    // Create new category within the transaction
    const category = await Category.create([{ name, color, userId }], {
      session,
    });
    const createdCategory = category[0];

    // Create subcategories if any
    const createdSubcategories = [];
    if (Array.isArray(subcategories) && subcategories.length > 0) {
      const subcategoryDocs = subcategories
        .filter((sub) => sub.name && sub.color)
        .map((sub) => ({
          name: sub.name,
          color: sub.color,
          category_id: createdCategory._id,
          userId,
        }));

      if (subcategoryDocs.length > 0) {
        const subcategories = await Subcategory.insertMany(subcategoryDocs, {
          session,
        });

        // Format the response
        createdSubcategories.push(
          ...subcategories.map((sub) => ({
            _id: sub._id,
            name: sub.name,
            color: sub.color,
          }))
        );
      }
    }

    // If we got here, everything was successful - commit the transaction
    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      success: true,
      message: "Category createddd successfully",
      data: {
        _id: createdCategory._id,
        category_name: createdCategory.name,
        category_color: createdCategory.color,
        subcategories: createdSubcategories.sort((a, b) =>
          a.name.localeCompare(b.name)
        ),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get all categories
exports.getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get a single category
exports.getCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }
    res.status(200).json({
      success: true,
      data: category,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update a category
exports.updateCategory = async (req, res) => {
  try {
    const { name } = req.body;
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    if (name) {
      // Check if new name already exists
      const exists = await Category.exists(name);
      if (exists && exists._id.toString() !== req.params.id) {
        return res.status(400).json({
          success: false,
          message: "Category name already exists",
        });
      }
      category.name = name;
    }

    await category.save();
    res.status(200).json({
      success: true,
      message: "Category updated successfully",
      data: category,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete a category
exports.deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }
    // Check if this category belongs to the current user
    if (category.userId.toString() !== req.user_id) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to delete this category",
      });
    }

    await category.deleteOne();
    res.status(200).json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete multiple categories and their subcategories
exports.bulkDeleteCategories = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { ids } = req.body;
    const userId = req.user_id;

    // Validate input
    if (!Array.isArray(ids) || ids.length === 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: "Category IDs array is required and cannot be empty",
      });
    }

    // Validate all categories exist and belong to the user
    const categories = await Category.find({
      _id: { $in: ids },
      userId,
    }).session(session);

    if (categories.length !== ids.length) {
      const foundIds = categories.map((cat) => cat._id.toString());
      const notFoundIds = categoryIds.filter((id) => !foundIds.includes(id));

      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: `Some categories not found or not authorized: ${notFoundIds.join(', ')}`,
      });
    }

    // First get all subcategories that will be deleted
    const subcategories = await Subcategory.find({
      category_id: { $in: ids },
      userId,
    }).session(session);

    // Delete all subcategories associated with these categories
    await Subcategory.deleteMany({
      category_id: { $in: ids },
      userId,
    }).session(session);

    // Remove all deleted subcategories from users' quickAdd arrays
    await Promise.all(subcategories.map(sub => removeSubcategoryFromQuickAdd(sub._id)));

    // Delete the categories
    const result = await Category.deleteMany({
      _id: { $in: ids },
      userId,
    }).session(session);

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      message: `Successfully deleted ${result.deletedCount} categories and their subcategories`,
      data: {
        deletedCategories: result.deletedCount,
      },
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
