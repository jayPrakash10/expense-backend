const UserSettings = require('../models/UserSettings');

// Get user settings
exports.getUserSettings = async (req, res) => {
  try {
    const settings = await UserSettings.findOne({ user_id: req.user_id });

    if (!settings) {
      return res.status(404).json({
        success: false,
        message: 'Settings not found'
      });
    }

    res.status(200).json({
      success: true,
      data: settings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update user settings
exports.updateUserSettings = async (req, res) => {
  try {
    const { currency, language } = req.body;

    // Validate inputs
    if (currency && !['rupees', 'dollars', 'euros', 'pounds'].includes(currency)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid currency'
      });
    }

    if (language && !['english', 'hindi', 'spanish', 'french', 'german'].includes(language)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid language'
      });
    }

    // Get or create settings
    let settings = await UserSettings.findOne({ user_id: req.user_id });
    if (!settings) {
      settings = new UserSettings({ user_id: req.user_id });
    }

    // Update settings
    if (currency !== undefined) settings.currency = currency;
    if (language !== undefined) settings.language = language;

    await settings.save();

    res.status(200).json({
      success: true,
      message: 'Settings updated successfully',
      data: settings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
