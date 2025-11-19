const express = require('express');
const router = express.Router();
const usersCtrl = require('../../controllers/usersControllers');

// Create user
router.post('/', usersCtrl.createUser);

// Get all users with pagination
router.get('/', usersCtrl.getUsers);

// Get user by id
router.get('/:id', usersCtrl.getUserById);

// Update user by id
router.put('/:id', usersCtrl.updateUser);

// Delete user by id
router.delete('/:id', usersCtrl.deleteUser);

module.exports = router;