const express = require('express');
const router = express.Router();

// Import Middlewares
const authenticateJWT = require("./middleware/jwt");
const verifyRoles = require("./middleware/verifyRoles");

// Auth routes

router.use('/login', require('./routes/auth/login'));


// Admin routes (Protected)
router.use('/admin/users', authenticateJWT, verifyRoles(['superadmin', 'admin']), require('./routes/admin/users'));

module.exports = router;
