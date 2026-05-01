const express = require('express');
const router = express.Router();
const recordingController = require('../controllers/recording.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

router.get('/', authenticateToken, recordingController.getRecordings);
router.post('/start/:id', authenticateToken, recordingController.startRecording);
router.get('/download/:filename', authenticateToken, recordingController.downloadRecording);

module.exports = router;
