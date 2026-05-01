const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

/**
 * Handle user login
 * POST /api/auth/login
 */
const login = async (req, res) => {
  try {
    const { password } = req.body;

    // Validate input
    if (!password) {
      return res.status(400).json({ error: 'Password is required' });
    }

    // Compare password with stored hash
    const storedHash = process.env.ADMIN_PASSWORD_HASH;
    if (!storedHash) {
      console.error('ADMIN_PASSWORD_HASH not set in environment variables');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const isValid = await bcrypt.compare(password, storedHash);

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { user: 'admin', iat: Date.now() },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours from now

    res.json({
      token,
      expiresAt,
      user: { username: 'admin' }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
};

/**
 * Handle user logout
 * POST /api/auth/logout
 */
const logout = (req, res) => {
  // For JWT, logout is handled client-side by removing the token
  // This endpoint exists for consistency and future token blacklisting
  res.json({ success: true, message: 'Logged out successfully' });
};

/**
 * Verify token validity
 * GET /api/auth/verify
 */
const verifyToken = (req, res) => {
  // If middleware passed, token is valid
  res.json({
    valid: true,
    user: req.user
  });
};

module.exports = {
  login,
  logout,
  verifyToken
};
