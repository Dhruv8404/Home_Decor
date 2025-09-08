// middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Expect "Bearer TOKEN"
  if (!token) return res.status(401).json({ message: 'No token, authorization denied' });

  try {
    console.log('Auth middleware: Verifying token');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Auth middleware: Token decoded, user ID:', decoded.id);
    const user = await User.findById(decoded.id);
    if (!user) {
      console.log('Auth middleware: User not found for ID:', decoded.id);
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = {
      id: user._id,
      email: user.email,
      name: user.name,
      isAdmin: user.isAdmin
    };
    console.log('Auth middleware: Authentication successful for user:', user.name);
    next();
  } catch (err) {
    console.log('Auth middleware: Token verification failed:', err.message);
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// Admin role check middleware
const adminAuth = async (req, res, next) => {
  try {
    if (!req.user || !req.user.isAdmin) {
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }
    next();
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { auth, adminAuth };
