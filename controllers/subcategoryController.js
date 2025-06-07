const Subcategory = require('../models/Subcategory');
const Category = require('../models/Category');

// Create a new subcategory
exports.createSubcategory = async (req, res) => {
  try {
    const { category_id, name, color } = req.body;

    if (!category_id || !name || !color) {
      return res.status(400).json({
        success: false,
        message: 'Category ID, name, and color are required'
      });
    }

    // Validate category exists
    const category = await Category.findById(category_id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Check if subcategory already exists for this category
    const exists = await Subcategory.exists(category_id, name);
    if (exists) {
      return res.status(400).json({
        success: false,
        message: 'Subcategory already exists for this category'
      });
    }

    // Create new subcategory
    const subcategory = new Subcategory({
      category_id,
      name,
      color
    });
    await subcategory.save();

    res.status(201).json({
      success: true,
      message: 'Subcategory created successfully',
      data: subcategory
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
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
        message: 'Category not found'
      });
    }

    const subcategories = await Subcategory.find({ category_id })
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      data: subcategories
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get all subcategories grouped by category
exports.getAllSubcategories = async (req, res) => {
  try {
    const subcategories = await Subcategory.aggregate([
      {
        $lookup: {
          from: 'categories',
          localField: 'category_id',
          foreignField: '_id',
          as: 'category'
        }
      },
      {
        $unwind: '$category'
      },
      {
        $group: {
          _id: '$category_id',
          category_name: { $first: '$category.name' },
          category_color: { $first: '$category.color' },
          subcategories: {
            $push: {
              _id: '$_id',
              name: '$name',
              color: '$color'
            }
          }
        }
      },
      {
        $sort: { 'category_name': 1 }
      }
    ]);

    res.status(200).json({
      success: true,
      data: subcategories
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get a single subcategory
exports.getSubcategory = async (req, res) => {
  try {
    const subcategory = await Subcategory.findById(req.params.id)
      .populate('category_id', 'name');

    if (!subcategory) {
      return res.status(404).json({
        success: false,
        message: 'Subcategory not found'
      });
    }

    res.status(200).json({
      success: true,
      data: subcategory
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update a subcategory
exports.updateSubcategory = async (req, res) => {
  try {
    const { category_id, name } = req.body;
    const subcategory = await Subcategory.findById(req.params.id);

    if (!subcategory) {
      return res.status(404).json({
        success: false,
        message: 'Subcategory not found'
      });
    }

    // Validate category exists if category_id is provided
    if (category_id) {
      const category = await Category.findById(category_id);
      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'Category not found'
        });
      }
      subcategory.category_id = category_id;
    }

    if (name) {
      // Check if new name already exists for this category
      const exists = await Subcategory.exists(
        category_id || subcategory.category_id,
        name
      );
      if (exists && exists._id.toString() !== req.params.id) {
        return res.status(400).json({
          success: false,
          message: 'Subcategory name already exists for this category'
        });
      }
      subcategory.name = name;
    }

    await subcategory.save();
    res.status(200).json({
      success: true,
      message: 'Subcategory updated successfully',
      data: subcategory
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
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
        message: 'Subcategory not found'
      });
    }

    await subcategory.deleteOne();
    res.status(200).json({
      success: true,
      message: 'Subcategory deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
