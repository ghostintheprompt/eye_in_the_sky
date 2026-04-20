const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const authRoutes = require('./routes/auth.routes');
const cameraRoutes = require('./routes/camera.routes');
const streamRoutes = require('./routes/stream.routes');
const controlRoutes = require('./routes/control.routes');
const { errorHandler, notFoundHandler } = require('./middleware/error.middleware');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/cameras', cameraRoutes);
app.use('/api/streams', streamRoutes);
app.use('/api/control', controlRoutes);

// Serve static files from frontend build (in production)
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '..', 'frontend', 'dist')));

  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'dist', 'index.html'));
  });
}

// Error handlers (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log('\n===========================================');
  console.log(`Electric Eye - Backend Server`);
  console.log('===========================================');
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`API endpoint: http://localhost:${PORT}/api`);
  console.log('===========================================\n');

  // Validate environment variables
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'your-super-secret-jwt-key-change-this-to-something-random') {
    console.warn('WARNING: Please change JWT_SECRET in .env file!');
  }
  if (!process.env.ADMIN_PASSWORD_HASH) {
    console.warn('WARNING: ADMIN_PASSWORD_HASH not set in .env file!');
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\nSIGINT received, shutting down gracefully...');
  process.exit(0);
});

module.exports = app;
