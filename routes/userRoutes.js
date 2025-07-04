const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/authMiddleware');

// Create a new user
router.post('/', userController.createUser);

// Get all users
router.get('/', userController.getAllUsers);

// Get profile
router.get('/profile', auth, userController.getProfile);

// Get a single user by ID
router.get('/:id', userController.getUserById);

// Update a user
router.put('/', auth, userController.updateUser);

// Delete a user
router.delete('/:id', userController.deleteUser);

module.exports = router;
