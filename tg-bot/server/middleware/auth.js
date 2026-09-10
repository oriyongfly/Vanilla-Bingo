const { verifyToken } = require('../utils/jwt');

const verifyAccessToken = (token) => {
  return verifyToken(token);
};

// REST middleware
const restAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const token = authHeader.substring(7);
    const decoded = verifyAccessToken(token);
    
    req.user = {
      userId: decoded.userId,
      telegramId: decoded.telegramId
    };
    
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
};

// Socket.IO middleware
const socketAuth = (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Unauthorized'));
    }

    const decoded = verifyAccessToken(token);
    
    socket.user = {
      userId: decoded.userId,
      telegramId: decoded.telegramId
    };
    
    next();
  } catch (error) {
    next(new Error('Unauthorized'));
  }
};

module.exports = {
  verifyAccessToken,
  restAuth,
  socketAuth
};