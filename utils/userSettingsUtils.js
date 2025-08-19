const UserSettings = require('../models/UserSettings');

/**
 * Removes a subcategory from all users' quickAdd arrays
 * @param {string} subcategoryId - The ID of the subcategory to remove
 */
const removeSubcategoryFromQuickAdd = async (subcategoryId) => {
  try {
    await UserSettings.updateMany(
      { 'quickAdd._id': subcategoryId },
      { $pull: { quickAdd: { _id: subcategoryId } } }
    );
  } catch (error) {
    console.error('Error updating quickAdd in user settings:', error);
    // We don't throw the error here to avoid failing the main operation
    // The quickAdd can be cleaned up later if needed
  }
};

module.exports = {
  removeSubcategoryFromQuickAdd
};
