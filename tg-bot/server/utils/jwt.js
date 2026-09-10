const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Sign token
const signToken = (payload) => {
  return jwt.sign(
    {
      userId: payload.userId,
      telegramId: payload.telegramId
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// Verify token
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid token');
  }
};

module.exports = {
  signToken,
  verifyToken
};