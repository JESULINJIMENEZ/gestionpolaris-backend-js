const express = require('express');
const router = express.Router();

// Import Middlewares
const authenticateJWT = require("./middleware/jwt");
const verifyRoles = require("./middleware/verifyRoles");

// Auth routes

router.use('/login', require('./routes/auth/login'));


// Admin routes
router.use('/admin/users', authenticateJWT, verifyRoles(['admin']), require('./routes/admin/users'));
router.use('/admin/point-votes', authenticateJWT, verifyRoles(['admin']), require('./routes/admin/pointVote'));


//superadmin routes
router.use('/superadmin/users', authenticateJWT, verifyRoles(['superadmin']), require('./routes/superadmin/users'));
router.use('/superadmin/point-votes', authenticateJWT, verifyRoles(['superadmin']), require('./routes/superadmin/pointVote'));

module.exports = router;
