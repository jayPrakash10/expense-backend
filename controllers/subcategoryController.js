const mongoose = require("mongoose");
const Subcategory = require("../models/Subcategory");
const Category = require("../models/Category");
const { removeSubcategoryFromQuickAdd } = require("../utils/userSettingsUtils");

// Bulk create subcategories
exports.bulkCreateSubcategories = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { category_id, subcategories = [] } = req.body;
    const userId = req.user_id;

    if (!Array.isArray(subcategories) || subcategories.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Subcategories array is required and cannot be empty",
      });
    }

    // Validate categories exist
    const invalidCategories = await Category.findById(category_id);
    if (!!!invalidCategories) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: `Category not found: ${invalidCategories}`,
      });
    }

    // Prepare subcategories for creation
    const subcategoriesToCreate = [];
    const existingSubcategories = [];

    for (const sub of subcategories) {
      if (!sub.name || !sub.color) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({
          success: false,
          message: "Each subcategory must have name, color, and category_id",
        });
      }

      // Check if subcategory already exists for this user and category
      const exists = await Subcategory.findOne({
        category_id,
        name: sub.name,
      });

      if (!!exists) {
        existingSubcategories.push(sub.name);
      } else {
        subcategoriesToCreate.push({
          name: sub.name,
          color: sub.color,
          category_id,
          userId,
        });
      }
    }

    // Create new subcategories
    let createdSubcategories = [];
    if (subcategoriesToCreate.length > 0) {
      createdSubcategories = await Subcategory.insertMany(
        subcategoriesToCreate,
        { session }
      );
    }

    await session.commitTransaction();
    session.endSession();

    const response = {
      success: true,
      message: "Subcategories processed successfully",
      data: {
        created: createdSubcategories.map((sub) => ({
          _id: sub._id,
          name: sub.name,
          color: sub.color,
          category_id: sub.category_id,
        })),
        skipped: existingSubcategories,
      },
    };

    if (existingSubcategories.length > 0) {
      response.message += `, ${existingSubcategories.length} subcategories already exist and were skipped`;
    }

    res.status(201).json(response);
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Create a new subcategory
exports.createSubcategory = async (req, res) => {
  try {
    const { category_id, name, color } = req.body;
    const userId = req.user_id;

    if (!category_id || !name || !color) {
      return res.status(400).json({
        success: false,
        message: "Category ID, name, and color are required",
      });
    }

    // Validate category exists
    const category = await Category.findById(category_id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    // Check if subcategory already exists for this user and category
    const exists = await Subcategory.exists(userId, category_id, name);
    if (exists) {
      return res.status(400).json({
        success: false,
        message: "Subcategory already exists for this category",
      });
    }

    // Create new subcategory
    const subcategory = new Subcategory({
      category_id,
      name,
      color,
      userId,
    });
    await subcategory.save();

    res.status(201).json({
      success: true,
      message: "Subcategory created successfully",
      data: subcategory,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get all subcategories for a category
exports.getSubcategoriesByCategory = async (req, res) => {
  try {
    const { category_id } = req.params;

    // Validate category exists
    const category = await Category.findById(category_id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    const subcategories = await Subcategory.find({ category_id }).sort({
      name: 1,
    });

    res.status(200).json({
      success: true,
      data: subcategories,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get all subcategories grouped by category
exports.getAllSubcategories = async (req, res) => {
  try {
    const userId = req.user_id;
    const subcategories = await Subcategory.aggregate([
      {
        $match: { userId: new mongoose.Types.ObjectId(userId) },
      },
      {
        $lookup: {
          from: "categories",
          localField: "category_id",
          foreignField: "_id",
          as: "category",
        },
      },
      {
        $unwind: "$category",
      },
      {
        $group: {
          _id: "$category_id",
          category_name: { $first: "$category.name" },
          category_color: { $first: "$category.color" },
          subcategories: {
            $push: {
              _id: "$_id",
              name: "$name",
              color: "$color",
            },
          },
        },
      },
      {
        $sort: { category_name: 1 },
      },
    ]);

    res.status(200).json({
      success: true,
      data: subcategories,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get a single subcategory
exports.getSubcategory = async (req, res) => {
  try {
    const subcategory = await Subcategory.findById(req.params.id).populate(
      "category_id",
      "name"
    );

    if (!subcategory) {
      return res.status(404).json({
        success: false,
        message: "Subcategory not found",
      });
    }

    res.status(200).json({
      success: true,
      data: subcategory,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update a subcategory
exports.updateSubcategory = async (req, res) => {
  try {
    const { name, color } = req.body;
    const subcategory = await Subcategory.findById(req.params.id);

    if (!subcategory) {
      return res.status(404).json({
        success: false,
        message: "Subcategory not found",
      });
    }

    if (name) {
      // Check if new name already exists for this category
      const exists = await Subcategory.findOne({
        name,
        _id: req.params.id,
      });
      if (exists) {
        return res.status(400).json({
          success: false,
          message: "Subcategory name already exists for this category",
        });
      }
      subcategory.name = name;
    }

    if (color) {
      subcategory.color = color;
    }

    await subcategory.save();
    res.status(200).json({
      success: true,
      message: "Subcategory updated successfully",
      data: subcategory,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete a subcategory
exports.deleteSubcategory = async (req, res) => {
  try {
    const subcategory = await Subcategory.findById(req.params.id);
    if (!subcategory) {
      return res.status(404).json({
        success: false,
        message: "Subcategory not found",
      });
    }
    // Check if this subcategory belongs to the current user
    if (subcategory.userId.toString() !== req.user_id) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to delete this subcategory",
      });
    }

    await subcategory.deleteOne();
    res.status(200).json({
      success: true,
      message: "Subcategory deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Bulk delete subcategories
exports.bulkDeleteSubcategories = async (req, res) => {
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
        message: "Subcategory IDs array is required and cannot be empty",
      });
    }

    // Validate all subcategories exist and belong to the user
    const subcategories = await Subcategory.find({
      _id: { $in: ids },
      userId,
    }).session(session);

    if (subcategories.length !== ids.length) {
      const foundIds = subcategories.map((sub) => sub._id.toString());
      const notFoundIds = ids.filter((id) => !foundIds.includes(id));

      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: `Some subcategories not found or not authorized: ${notFoundIds.join(
          ", "
        )}`,
      });
    }

    // Delete the subcategories
    const result = await Subcategory.deleteMany({
      _id: { $in: ids },
      userId,
    }).session(session);

    // Remove all deleted subcategories from users' quickAdd arrays
    await Promise.all(ids.map((id) => removeSubcategoryFromQuickAdd(id)));

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      message: `Successfully deleted ${result.deletedCount} subcategories`,
      data: {
        deletedSubcategories: result.deletedCount,
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
