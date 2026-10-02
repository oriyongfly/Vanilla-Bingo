/**
 * One-off script: credits 100 ETB (withdrawable) to every user's wallet.
 * Run from the server/ directory:
 *   node scripts/credit-all-users.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/user');
const Wallet = require('../models/Wallet');

const CREDIT_AMOUNT = 100;

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const users = await User.find({});
  console.log(`Found ${users.length} user(s)`);

  for (const user of users) {
    const wallet = await Wallet.getOrCreate(user._id);
    wallet.withdrawableBalance += CREDIT_AMOUNT;
    await wallet.save();
    console.log(`✅ Credited ${CREDIT_AMOUNT} ETB to ${user.username || user.telegramId} — new balance: ${wallet.balance}`);
  }

  console.log('Done.');
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
