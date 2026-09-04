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