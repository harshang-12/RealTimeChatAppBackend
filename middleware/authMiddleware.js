// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../Models/User');

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;


  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.SECRET_KEY || 'secretkey');
    
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.user = { userId: user._id, name: user.name }; // Attach user info to request
    next();
  } catch (err) {
    console.error(err);
    res.status(403).json({ error: 'Invalid or expired token' });
  }
};

module.exports = authenticateToken;
