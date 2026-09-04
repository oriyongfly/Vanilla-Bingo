const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Import the bot initialization function
const { initBot } = require('./bot');

const app = express();
const PORT = process.env.PORT || 5000;

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

// Start the server and bot
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  
  // Initialize the bot only after server is successfully bound
  initBot().catch((err) => {
    console.error('❌ Bot initialization failed:', err);
    // Note: If BOT_TOKEN is missing, bot.js will exit the process
    // This is acceptable behavior for a broken deployment
  });
});