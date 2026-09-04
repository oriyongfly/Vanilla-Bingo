const express = require('express');
const cors = require('cors');
require('dotenv').config();

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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});