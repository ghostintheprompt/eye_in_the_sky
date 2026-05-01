const express = require('express');
const router = express.Router();
const incidentController = require('../controllers/incident.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

router.get('/', authenticateToken, incidentController.getIncidents);
router.post('/', authenticateToken, incidentController.addIncident);

module.exports = router;
