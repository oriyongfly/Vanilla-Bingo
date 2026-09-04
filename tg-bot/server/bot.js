// ─── Commands ────────────────────────────────────────────────────────────────

// /start command - check if user exists, show appropriate response
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const telegramId = msg.from?.id;
  const firstName = msg.from?.first_name || 'Player';

  try {
    // Check if user is already registered
    const existingUser = await User.findOne({ telegramId });

    if (existingUser) {
      // User exists - welcome back and show main menu
      const displayName = existingUser.firstName || firstName;
      
      await bot.sendMessage(
        chatId,
        `👋 Welcome back, *${displayName}!*\n\nWhat would you like to do?`,
        { 
          parse_mode: 'Markdown',
          ...MAIN_MENU 
        }
      );
    } else {
      // New user - request phone number
      await bot.sendMessage(
        chatId,
        `👋 Welcome, *${firstName}!*\n\nTo get started, please share your phone number by tapping the button below.`,
        { 
          parse_mode: 'Markdown', 
          ...PHONE_REQUEST_KEYBOARD 
        }
      );
    }
  } catch (error) {
    console.error('Error checking user registration:', error);
    await bot.sendMessage(
      chatId,
      `❌ Sorry, there was an error. Please try again later.`,
      { parse_mode: 'Markdown' }
    );
  }
});