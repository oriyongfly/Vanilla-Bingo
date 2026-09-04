const TelegramBot = require('node-telegram-bot-api');
const dotenv = require('dotenv');

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

// Main menu buttons
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

// ─── Bot initialization function ────────────────────────────────────────────────

async function initBot() {
  const bot = new TelegramBot(BOT_TOKEN, { polling: true });

  console.log('🤖 Bot starting...');

  // ─── Commands ────────────────────────────────────────────────────────────────

  // /start command
  bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    const firstName = msg.from?.first_name || 'Player';

    await bot.sendMessage(
      chatId,
      `👋 Welcome, *${firstName}!*\n\nWhat would you like to do?`,
      { parse_mode: 'Markdown', ...MAIN_MENU }
    );
  });

  // /menu command
  bot.onText(/\/menu/, async (msg) => {
    const chatId = msg.chat.id;

    await bot.sendMessage(
      chatId,
      `What would you like to do?`,
      { parse_mode: 'Markdown', ...MAIN_MENU }
    );
  });

  // ─── Callback queries (button clicks) ──────────────────────────────────────

  bot.on('callback_query', async (query) => {
    const chatId = query.message?.chat.id;
    const messageId = query.message?.message_id;
    const data = query.data;

    if (!chatId || !messageId) return;

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