const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

// Import the bot initialization function
const { initBot } = require('./bot');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

// Validate required environment variables
if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI is not set in environment variables');
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
app.post('/api/auth/verify', (req, res) => {
  const { initData } = req.body;
  
  if (!initData) {
    return res.status(400).json({ 
      success: false, 
      message: 'initData is required' 
    });
  }

  // TODO: Add validation logic here
  
  res.json({ 
    success: true, 
    message: 'Authentication successful',
    user: {
      id: 123456789,
      first_name: 'John',
      last_name: 'Doe',
      username: 'johndoe',
      photo_url: null
    }
  });
});

// Connect to MongoDB and start the server
async function startServer() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      // Mongoose 6+ defaults to these settings, but we'll be explicit
    });
    
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