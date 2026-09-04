const TelegramBot = require('node-telegram-bot-api');
const dotenv = require('dotenv');
const User = require('./models/User');

// Load environment variables at module scope (always runs)
dotenv.config();

const BOT_TOKEN = process.env.BOT_TOKEN;
const WEB_APP_URL = process.env.WEB_APP_URL || 'http://localhost:3000';

if (!BOT_TOKEN) {
  console.error('❌ BOT_TOKEN is not set in environment variables');
  process.exit(1);
}

// Check if URL uses HTTPS (required for web_app)
const isHttps = WEB_APP_URL.startsWith('https://');

// Play Bingo button - uses web_app if HTTPS, otherwise callback
const playButton = isHttps
  ? { text: '🎮 Play Bingo', web_app: { url: WEB_APP_URL } }
  : { text: '🎮 Play Bingo', callback_data: 'cmd:play' };

// Main menu buttons (inline keyboard)
const MAIN_MENU = {
  reply_markup: {
    inline_keyboard: [
      [playButton],
      [
        { text: '💰 Balance', callback_data: 'cmd:balance' },
        { text: '📥 Deposit', callback_data: 'cmd:deposit' },
      ],
      [
        { text: '📤 Withdraw', callback_data: 'cmd:withdraw' },
        { text: '🔄 Transfer', callback_data: 'cmd:transfer' },
      ],
      [
        { text: '👥 Invite', callback_data: 'cmd:invite' },
        { text: '📖 Instructions', callback_data: 'cmd:instructions' },
      ],
      [{ text: '🆘 Support', callback_data: 'cmd:support' }],
    ],
  },
};

// Reply keyboard for phone number sharing
const PHONE_REQUEST_KEYBOARD = {
  reply_markup: {
    keyboard: [
      [{ text: '📱 Share Phone Number', request_contact: true }]
    ],
    resize_keyboard: true,
    one_time_keyboard: true
  }
};

// ─── Bot initialization function ────────────────────────────────────────────────

async function initBot() {
  const bot = new TelegramBot(BOT_TOKEN, { polling: true });

  console.log('🤖 Bot starting...');

  // ─── Commands ────────────────────────────────────────────────────────────────

  // /start command - show phone number request
  bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    const firstName = msg.from?.first_name || 'Player';

    await bot.sendMessage(
      chatId,
      `👋 Welcome, *${firstName}!*\n\nTo get started, please share your phone number by tapping the button below.`,
      { 
        parse_mode: 'Markdown', 
        ...PHONE_REQUEST_KEYBOARD 
      }
    );
  });

  // /menu command - only works for registered users
  bot.onText(/\/menu/, async (msg) => {
    const chatId = msg.chat.id;
    const telegramId = msg.from?.id;

    // Check if user exists
    const user = await User.findOne({ telegramId });
    
    if (!user) {
      await bot.sendMessage(
        chatId,
        `Please register first by sending /start and sharing your phone number.`,
        { parse_mode: 'Markdown' }
      );
      return;
    }

    await bot.sendMessage(
      chatId,
      `What would you like to do?`,
      { parse_mode: 'Markdown', ...MAIN_MENU }
    );
  });

  // ─── Contact message handler (phone number sharing) ──────────────────────

  bot.on('contact', async (msg) => {
    const chatId = msg.chat.id;
    const contact = msg.contact;
    const from = msg.from;

    // Validate that the contact belongs to the user
    if (contact.user_id !== from.id) {
      await bot.sendMessage(
        chatId,
        `❌ Please share your own phone number.`,
        { parse_mode: 'Markdown' }
      );
      return;
    }

    try {
      // Extract user data
      const telegramId = from.id;
      const firstName = from.first_name || 'Unknown';
      const lastName = from.last_name || null;
      const username = from.username || null;
      const phoneNumber = contact.phone_number;

      // Register or update user in database
      const user = await User.findOneAndUpdate(
        { telegramId },
        {
          telegramId,
          firstName,
          lastName,
          username,
          phoneNumber
        },
        { 
          upsert: true, 
          new: true, 
          setDefaultsOnInsert: true 
        }
      );

      console.log(`✅ User registered/updated: ${telegramId} (${firstName} ${lastName || ''})`);

      // Confirm registration
      await bot.sendMessage(
        chatId,
        `✅ You're registered, *${firstName}!*\n\nYour phone number has been saved successfully.`,
        { parse_mode: 'Markdown' }
      );

      // Remove the reply keyboard
      await bot.sendMessage(
        chatId,
        `What would you like to do?`,
        {
          parse_mode: 'Markdown',
          reply_markup: {
            remove_keyboard: true
          }
        }
      );

      // Show the main menu
      await bot.sendMessage(
        chatId,
        `Choose an option:`,
        { parse_mode: 'Markdown', ...MAIN_MENU }
      );

    } catch (error) {
      console.error('Error registering user:', error);
      await bot.sendMessage(
        chatId,
        `❌ Sorry, there was an error registering you. Please try again later.`,
        { parse_mode: 'Markdown' }
      );
    }
  });

  // ─── Callback queries (button clicks) ──────────────────────────────────────

  bot.on('callback_query', async (query) => {
    const chatId = query.message?.chat.id;
    const messageId = query.message?.message_id;
    const data = query.data;
    const telegramId = query.from?.id;

    if (!chatId || !messageId) return;

    // For all menu commands, check if user is registered
    const user = await User.findOne({ telegramId });
    
    if (!user) {
      await bot.answerCallbackQuery(query.id, {
        text: 'Please register first by sending /start and sharing your phone number.',
        show_alert: true,
      });
      return;
    }

    switch (data) {
      case 'cmd:play':
        await bot.answerCallbackQuery(query.id, {
          text: `Open the app to play: ${WEB_APP_URL}`,
          show_alert: true,
        });
        break;

      case 'cmd:balance':
        await bot.editMessageText('💰 *Balance*\n\nYour balance will appear here.', {
          chat_id: chatId,
          message_id: messageId,
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [[{ text: '« Back to Menu', callback_data: 'cmd:menu' }]],
          },
        });
        break;

      case 'cmd:deposit':
        await bot.editMessageText('📥 *Deposit*\n\nDeposit instructions will appear here.', {
          chat_id: chatId,
          message_id: messageId,
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [[{ text: '« Back to Menu', callback_data: 'cmd:menu' }]],
          },
        });
        break;

      case 'cmd:withdraw':
        await bot.editMessageText('📤 *Withdraw*\n\nWithdrawal instructions will appear here.', {
          chat_id: chatId,
          message_id: messageId,
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [[{ text: '« Back to Menu', callback_data: 'cmd:menu' }]],
          },
        });
        break;

      case 'cmd:transfer':
        await bot.editMessageText('🔄 *Transfer*\n\nTransfer instructions will appear here.', {
          chat_id: chatId,
          message_id: messageId,
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [[{ text: '« Back to Menu', callback_data: 'cmd:menu' }]],
          },
        });
        break;

      case 'cmd:invite':
        await bot.editMessageText('👥 *Invite*\n\nInvite link will appear here.', {
          chat_id: chatId,
          message_id: messageId,
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [[{ text: '« Back to Menu', callback_data: 'cmd:menu' }]],
          },
        });
        break;

      case 'cmd:instructions':
        await bot.editMessageText('📖 *Instructions*\n\nGame instructions will appear here.', {
          chat_id: chatId,
          message_id: messageId,
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [[{ text: '« Back to Menu', callback_data: 'cmd:menu' }]],
          },
        });
        break;

      case 'cmd:support':
        await bot.editMessageText('🆘 *Support*\n\nSupport information will appear here.', {
          chat_id: chatId,
          message_id: messageId,
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [[{ text: '« Back to Menu', callback_data: 'cmd:menu' }]],
          },
        });
        break;

      case 'cmd:menu':
        await bot.editMessageText(
          `What would you like to do?`,
          {
            chat_id: chatId,
            message_id: messageId,
            parse_mode: 'Markdown',
            ...MAIN_MENU,
          }
        );
        break;

      default:
        await bot.answerCallbackQuery(query.id);
        break;
    }
  });

  // ─── Error handling ─────────────────────────────────────────────────────────

  bot.on('polling_error', (err) => {
    console.error('Polling error:', err.message);
  });

  console.log('✅ Bot is running and listening for commands');

  return bot;
}

// ─── Export the bot initialization function ────────────────────────────────────

module.exports = { initBot };

// ─── Auto-start if run directly ──────────────────────────────────────────────

if (require.main === module) {
  initBot().catch((err) => {
    console.error('❌ Failed to start bot:', err);
    process.exit(1);
  });
}