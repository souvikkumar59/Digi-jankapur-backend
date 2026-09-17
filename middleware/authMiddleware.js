const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  // Check if token exists in the Request Headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Split "Bearer <token_string>" to extract just the token string
      token = req.headers.authorization.split(' ')[1];

      // Verify token signature against your secret key
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Fetch user data from DB (excluding password) and attach to request object
      req.user = await User.findById(decoded.id).select('-password');

      // Pass control to the next block (the controller)
      return next();
    } catch (error) {
      return res.status(401).json({ success: false, message: 'Not authorized, token verification failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no security token provided' });
  }
};

module.exports = { protect };
