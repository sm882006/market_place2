import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.warn('[AUTH WARNING] JWT_SECRET is not set in environment! Fallback temporary secret active.');
}
const SECRET_KEY = JWT_SECRET || 'pict_campus_marketplace_super_secret_jwt_key_2026';

export const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication required. Please log in.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, SECRET_KEY);

    const user = await User.findById(decoded.id || decoded._id);
    if (!user) {
      return res.status(401).json({ message: 'User account no longer exists.' });
    }

    req.user = {
      _id: user._id.toString(),
      id: user._id.toString(),
      username: user.username,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
      blockedUsers: user.blockedUsers || [],
    };
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired session token. Please log in again.' });
  }
};

export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, SECRET_KEY);
      const user = await User.findById(decoded.id || decoded._id);
      if (user) {
        req.user = {
          _id: user._id.toString(),
          id: user._id.toString(),
          username: user.username,
          email: user.email,
          role: user.role,
          isVerified: user.isVerified,
          blockedUsers: user.blockedUsers || [],
        };
      }
    }
  } catch (err) {
    // Ignore invalid token in optional auth
  }
  next();
};

export const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied: Admin privileges required.' });
  }
  next();
};

export const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
    },
    SECRET_KEY,
    { expiresIn: '7d' }
  );
};
