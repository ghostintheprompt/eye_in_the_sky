const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

// Public routes
router.post('/login', authController.login);

// Protected routes (require authentication)
router.post('/logout', authenticateToken, authController.logout);
router.get('/verify', authenticateToken, authController.verifyToken);

module.exports = router;
