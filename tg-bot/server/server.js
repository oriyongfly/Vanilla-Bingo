// server.js
const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const mongoose = require('mongoose');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Import the bot initialization function
const { initBot } = require('./bot');

// Import socket handler
const { setupBingoSocket } = require('./socket/bingo');

// Import User model
const User = require('./models/user');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;
const BOT_TOKEN = process.env.BOT_TOKEN;
const JWT_SECRET = process.env.JWT_SECRET;

// Validate required environment variables
if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI is not set in environment variables');
  process.exit(1);
}

if (!BOT_TOKEN) {
  console.error('❌ BOT_TOKEN is not set in environment variables');
  process.exit(1);
}

if (!JWT_SECRET) {
  console.error('❌ JWT_SECRET is not set in environment variables');
  process.exit(1);
}

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Authentication route - changed from /api/auth/verify to /api/auth/login
app.post('/api/auth/login', async (req, res) => {
  const { initData } = req.body;
  
  if (!initData) {
    return res.status(400).json({ 
      success: false, 
      message: 'initData is required' 
    });
  }

  try {
    // 1. Parse initData as URL query string
    const urlParams = new URLSearchParams(initData);
    const params = {};
    let hash = null;
    
    // Extract all parameters and remove hash for verification
    for (const [key, value] of urlParams.entries()) {
      if (key === 'hash') {
        hash = value;
      } else {
        params[key] = value;
      }
    }
    
    // 2. Verify hash exists
    if (!hash) {
      return res.status(400).json({
        success: false,
        message: 'Missing hash in initData'
      });
    }
    
    // 3. Sort remaining keys alphabetically
    const sortedKeys = Object.keys(params).sort();
    
    // 4. Create data check string (key=value lines separated by newline)
    const dataCheckString = sortedKeys
      .map(key => `${key}=${params[key]}`)
      .join('\n');
    
    // 5. Derive secret key: HMAC-SHA256 of "WebAppData" using bot token
    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(BOT_TOKEN)
      .digest();
    
    // 6. Compute HMAC-SHA256 of data check string using derived secret key
    const calculatedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');
    
    // 7. Compare calculated hash with provided hash
    if (calculatedHash !== hash) {
      return res.status(401).json({
        success: false,
        message: 'Invalid initData signature'
      });
    }
    
    // 8. Parse user data from params
    let telegramUserData;
    try {
      telegramUserData = JSON.parse(params.user);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user data in initData'
      });
    }
    
    // 9. Extract Telegram user fields
    const telegramUser = {
      id: telegramUserData.id,
      first_name: telegramUserData.first_name || '',
      last_name: telegramUserData.last_name || '',
      username: telegramUserData.username || '',
      photo_url: telegramUserData.photo_url || null
    };
    
    // 10. Look up user in MongoDB by telegramId
    let user = await User.findOne({ telegramId: telegramUser.id });
    
    if (!user) {
      // Create new user if doesn't exist
      user = new User({
        telegramId: telegramUser.id,
        fName: telegramUser.first_name,
        lName: telegramUser.last_name,
        username: telegramUser.username,
      });
      await user.save();
    }

    // Load wallet balance and user progress
    const Wallet = require('./models/Wallet');
    const UserProgress = require('./models/UserProgress');
    const wallet = await Wallet.getOrCreate(user._id);
    const progress = await UserProgress.getOrCreate(user._id);
    
    // 11. Sign JWT with { userId, telegramId }
    const token = jwt.sign(
      { 
        userId: user._id,
        telegramId: user.telegramId 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    // 12. Return { access_token, user } - user includes wallet balance
    res.json({
      success: true,
      message: 'Authentication successful',
      access_token: token,
      user: {
        id: user._id,
        telegramId: user.telegramId,
        firstName: user.fName,
        lastName: user.lName,
        username: user.username,
        phone: user.phone,
        balance: wallet.balance,
        withdrawableBalance: wallet.withdrawableBalance,
        lockedBalance: wallet.lockedBalance,
        points: progress.totalPoints,
        level: progress.level,
      }
    });
    
  } catch (error) {
    console.error('Auth verification error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during authentication'
    });
  }
});

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

// Socket.IO authentication middleware
io.use(async (socket, next) => {
  try {
    // Get token from handshake auth
    const token = socket.handshake.auth.token;
    
    if (!token) {
      console.warn('⚠️ Socket connection attempt without token');
      return next(new Error('Authentication required'));
    }
    
    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Find user in database
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      console.warn(`⚠️ Socket connection attempt with invalid userId: ${decoded.userId}`);
      return next(new Error('User not found'));
    }
    
    // Attach user to socket
    socket.user = {
      id: user._id,
      telegramId: user.telegramId,
      username: user.username,
      walletBalance: user.walletBalance
    };
    
    console.log(`✅ Socket authenticated for user: ${user.telegramId} (${user.username || 'no username'})`);
    next();
    
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      console.warn('⚠️ Socket connection attempt with invalid JWT');
      return next(new Error('Invalid token'));
    } else if (error.name === 'TokenExpiredError') {
      console.warn('⚠️ Socket connection attempt with expired JWT');
      return next(new Error('Token expired'));
    }
    console.error('❌ Socket auth middleware error:', error);
    next(new Error('Authentication error'));
  }
});

// Setup Bingo socket handlers (with authenticated socket.user available)
setupBingoSocket(io);

// Connect to MongoDB and start the server
async function startServer() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    
    await mongoose.connect(MONGODB_URI);
    
    console.log('✅ MongoDB connected successfully');
    
    // Start the Express server with Socket.IO
    server.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`✅ Socket.IO attached and listening`);
      console.log(`✅ Socket.IO auth middleware enabled`);
      
      // Initialize the bot only after server is successfully bound
      initBot().catch((err) => {
        console.error('❌ Bot initialization failed:', err);
      });
    });
    
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error.message);
    console.error('Database connection error details:', error);
    process.exit(1);
  }
}

// Handle MongoDB connection errors after initial connection
mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err.message);
});

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ MongoDB disconnected. Attempting to reconnect...');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  try {
    await mongoose.connection.close();
    io.close(() => {
      console.log('✅ Socket.IO closed');
    });
    console.log('✅ MongoDB connection closed through app termination');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error during graceful shutdown:', err);
    process.exit(1);
  }
});

// Start the server
startServer();