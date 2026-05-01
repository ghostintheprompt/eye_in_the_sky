const express = require('express');
const router = express.Router();
const controlController = require('../controllers/control.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

router.use(authenticateToken);

router.post('/:id', controlController.controlCamera);

module.exports = router;
