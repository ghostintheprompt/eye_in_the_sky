const express = require('express');
const router = express.Router();
const cameraController = require('../controllers/camera.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

router.use(authenticateToken);

router.get('/', cameraController.getCameras);
router.post('/', cameraController.addCamera);
router.delete('/:id', cameraController.deleteCamera);

module.exports = router;
