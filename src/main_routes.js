const express = require('express');
const router = express.Router();

// Import Middlewares
const authenticateJWT = require("./middleware/jwt");
const verifyRoles = require("./middleware/verifyRoles");

// Auth routes

router.use('/login', require('./routes/auth/login'));


// Admin routes
router.use('/admin/users', authenticateJWT, verifyRoles(['admin']), require('./routes/admin/users'));


//superadmin routes
router.use('/superadmin/users', authenticateJWT, verifyRoles(['superadmin']), require('./routes/superadmin/users'));

module.exports = router;
