const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const streamController = require('../controllers/stream.controller');

// We use token in query param for <img /> src tags
router.get('/:id', (req, res, next) => {
  const token = req.query.token;
  if (!token) return res.status(401).json({ message: 'Orbit access denied' });
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Orbit link invalid or expired' });
  }
}, streamController.streamCamera);

module.exports = router;
