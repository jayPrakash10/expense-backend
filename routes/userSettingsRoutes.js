const express = require('express');
const router = express.Router();
const userSettingsController = require('../controllers/userSettingsController');
const auth = require('../middleware/authMiddleware');

// Get user settings
router.get('/', auth, userSettingsController.getUserSettings);

// Update user settings
router.put('/', auth, userSettingsController.updateUserSettings);

module.exports = router;
