import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';

export function generateToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, email: user.email },
    config.jwtSecret,
    { expiresIn: '7d' }
  );
}
