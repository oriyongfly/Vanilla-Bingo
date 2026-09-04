const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const mongoose = require('mongoose');
require('dotenv').config();

// Import the bot initialization function
const { initBot } = require('./bot');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;
const BOT_TOKEN = process.env.BOT_TOKEN;

// Validate required environment variables
if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI is not set in environment variables');
  process.exit(1);
}

if (!BOT_TOKEN) {
  console.error('❌ BOT_TOKEN is not set in environment variables');
  process.exit(1);
}

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Authentication route
app.post('/api/auth/verify', async (req, res) => {
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
    let userData;
    try {
      userData = JSON.parse(params.user);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user data in initData'
      });
    }
    
    // 9. Extract user fields
    const user = {
      id: userData.id,
      first_name: userData.first_name || '',
      last_name: userData.last_name || '',
      username: userData.username || '',
      photo_url: userData.photo_url || null
    };
    
    // 10. Return success with user data
    res.json({
      success: true,
      message: 'Authentication successful',
      user
    });
    
  } catch (error) {
    console.error('Auth verification error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during authentication'
    });
  }
});
// Connect to MongoDB and start the server
async function startServer() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    
    await mongoose.connect(MONGODB_URI);
    
    console.log('✅ MongoDB connected successfully');
    
    // Start the Express server
    app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
      
      // Initialize the bot only after server is successfully bound
      initBot().catch((err) => {
        console.error('❌ Bot initialization failed:', err);
        // Note: If BOT_TOKEN is missing, bot.js will exit the process
        // This is acceptable behavior for a broken deployment
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
    console.log('✅ MongoDB connection closed through app termination');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error during graceful shutdown:', err);
    process.exit(1);
  }
});

// Start the server
startServer();