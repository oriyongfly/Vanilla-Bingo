const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const mongoose = require('mongoose');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const { initBot } = require('./bot');
const { setupBingoSocket } = require('./socket/bingo');
const User = require('./models/user');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;
const BOT_TOKEN = process.env.BOT_TOKEN;
const JWT_SECRET = process.env.JWT_SECRET;

// ─── Env validation ───────────────────────────────────────────────────────────

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

// ─── Middleware ───────────────────────────────────────────────────────────────

app.use(cors());
app.use(express.json());

// ─── Routes ───────────────────────────────────────────────────────────────────

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Authentication — verify Telegram initData and issue JWT
app.post('/api/auth/login', async (req, res) => {
  const { initData } = req.body;

  if (!initData) {
    return res.status(400).json({ success: false, message: 'initData is required' });
  }

  try {
    // 1. Parse initData
    const urlParams = new URLSearchParams(initData);
    const params = {};
    let hash = null;

    for (const [key, value] of urlParams.entries()) {
      if (key === 'hash') {
        hash = value;
      } else {
        params[key] = value;
      }
    }

    if (!hash) {
      return res.status(400).json({ success: false, message: 'Missing hash in initData' });
    }

    // 2. Verify HMAC
    const sortedKeys = Object.keys(params).sort();
    const dataCheckString = sortedKeys.map(key => `${key}=${params[key]}`).join('\n');

    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(BOT_TOKEN)
      .digest();

    const calculatedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    if (!crypto.timingSafeEqual(
      Buffer.from(calculatedHash, 'hex'),
      Buffer.from(hash, 'hex')
    )) {
      return res.status(401).json({ success: false, message: 'Invalid initData signature' });
    }

    // 3. Parse Telegram user
    let telegramUserData;
    try {
      telegramUserData = JSON.parse(params.user);
    } catch {
      return res.status(400).json({ success: false, message: 'Invalid user data in initData' });
    }

    const telegramUser = {
      id: telegramUserData.id,
      first_name: telegramUserData.first_name || '',
      last_name: telegramUserData.last_name || '',
      username: telegramUserData.username || '',
    };

    // 4. Upsert user
    let user = await User.findOne({ telegramId: telegramUser.id });

    if (!user) {
      user = new User({
        telegramId: telegramUser.id,
        fName: telegramUser.first_name,
        lName: telegramUser.last_name,
        username: telegramUser.username,
      });
      await user.save();
    }

    // 5. Load wallet + progress
    const Wallet = require('./models/Wallet');
    const UserProgress = require('./models/UserProgress');
    const wallet = await Wallet.getOrCreate(user._id);
    const progress = await UserProgress.getOrCreate(user._id);

    // 6. Sign JWT
    const token = jwt.sign(
      { userId: user._id, telegramId: user.telegramId },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // 7. Respond
    res.json({
      success: true,
      message: 'Authentication successful',
      access_token: token,
      user: {
        id: user._id,
        telegramId: user.telegramId,
        firstName: user.fName || telegramUser.first_name || '',
        lastName: user.lName || telegramUser.last_name || '',
        username: user.username || telegramUser.username || '',
        phone: user.phone || '',
        balance: wallet.balance,
        withdrawableBalance: wallet.withdrawableBalance,
        lockedBalance: wallet.lockedBalance,
        points: progress.totalPoints,
        level: progress.level,
      }
    });

  } catch (error) {
    console.error('Auth verification error:', error);
    return res.status(500).json({ success: false, message: 'Server error during authentication' });
  }
});

// ─── HTTP server + Socket.IO ──────────────────────────────────────────────────

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
});

// Socket.IO authentication middleware
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;

    if (!token) {
      console.warn('⚠️ Socket connection attempt without token');
      return next(new Error('Authentication required'));
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return next(new Error('User not found'));
    }

    socket.user = {
      id: user._id,
      telegramId: user.telegramId,
      username: user.username,
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return next(new Error('Token expired'));
    }
    return next(new Error('Invalid token'));
  }
});

// Bingo socket handlers
setupBingoSocket(io);

// ─── Start server ─────────────────────────────────────────────────────────────

async function startServer() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB connected successfully');

    server.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`✅ Socket.IO attached and listening`);
      console.log(`✅ Socket.IO auth middleware enabled`);
      initBot().catch(err => console.error('❌ Bot failed to start:', err));
    });
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error.message);
    process.exit(1);
  }
}

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ MongoDB disconnected. Attempting to reconnect...');
});

startServer();
