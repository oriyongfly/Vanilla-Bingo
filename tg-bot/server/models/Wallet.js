const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  // Deposits land here — must complete wagering requirement to become withdrawable
  lockedBalance: {
    type: Number,
    default: 0,
    min: 0
  },
  // Winnings from withdrawable-funded bets, and wagering-cleared deposits
  withdrawableBalance: {
    type: Number,
    default: 0,
    min: 0
  },
  // Total = lockedBalance + withdrawableBalance (computed, never set directly)
  balance: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true
});

// ─── Middleware ────────────────────────────────────────────────────────────────

walletSchema.pre('save', function (next) {
  this.balance = (this.lockedBalance || 0) + (this.withdrawableBalance || 0);
  next();
});

// ─── Instance Methods ──────────────────────────────────────────────────────────

/**
 * Deposit — funds land in lockedBalance.
 * User must complete wagering requirement before funds become withdrawable.
 */
walletSchema.methods.deposit = async function (amount) {
  if (amount <= 0) throw new Error('Deposit amount must be greater than 0');
  this.lockedBalance += amount;
  return this.save();
};

/**
 * Deduct a game stake.
 * Takes from lockedBalance first, then withdrawableBalance for any remainder.
 * Returns a breakdown { fromLocked, fromWithdrawable } so the caller knows
 * where the bet came from — this determines where the win is credited.
 */
walletSchema.methods.deduct = async function (amount) {
  if (amount <= 0) throw new Error('Deduct amount must be greater than 0');
  if (this.balance < amount) throw new Error('Insufficient balance');

  const fromLocked = Math.min(this.lockedBalance, amount);
  const fromWithdrawable = amount - fromLocked;

  this.lockedBalance -= fromLocked;
  this.withdrawableBalance -= fromWithdrawable;

  await this.save();

  // Return the breakdown so the game can credit the win correctly
  return { fromLocked, fromWithdrawable };
};

/**
 * Credit a game win.
 * Wins are split back to the same pools the bet came from:
 *   - portion funded by lockedBalance → back to lockedBalance (still needs wagering)
 *   - portion funded by withdrawableBalance → to withdrawableBalance (freely withdrawable)
 *
 * @param {number} winAmount - total win amount
 * @param {number} betAmount - original bet amount (used to calculate the ratio)
 * @param {object} betBreakdown - { fromLocked, fromWithdrawable } returned by deduct()
 */
walletSchema.methods.creditWin = async function (winAmount, betAmount, betBreakdown) {
  if (winAmount <= 0) throw new Error('Win amount must be greater than 0');
  if (!betBreakdown) throw new Error('betBreakdown is required to credit a win correctly');

  const { fromLocked, fromWithdrawable } = betBreakdown;

  if (betAmount <= 0 || (fromLocked === 0 && fromWithdrawable === 0)) {
    // Fallback: no bet breakdown — credit entirely to withdrawable
    this.withdrawableBalance += winAmount;
  } else {
    // Split win proportionally based on where the bet came from
    const lockedRatio = fromLocked / betAmount;
    const withdrawableRatio = fromWithdrawable / betAmount;

    const winToLocked = Math.round(winAmount * lockedRatio * 100) / 100;
    const winToWithdrawable = winAmount - winToLocked; // avoids floating point drift

    this.lockedBalance += winToLocked;
    this.withdrawableBalance += winToWithdrawable * withdrawableRatio;

    // Edge case: rounding may leave a tiny remainder — add it to withdrawable
    const accounted = winToLocked + (winToWithdrawable * withdrawableRatio);
    const remainder = Math.round((winAmount - accounted) * 100) / 100;
    if (remainder > 0) {
      this.withdrawableBalance += remainder;
    }
  }

  return this.save();
};

/**
 * Release wagered amount from lockedBalance to withdrawableBalance.
 * Called by the wagering system when a requirement is fully completed.
 */
walletSchema.methods.releaseWagered = async function (amount) {
  if (amount <= 0) throw new Error('Release amount must be greater than 0');
  if (this.lockedBalance < amount) throw new Error('Not enough locked balance to release');
  this.lockedBalance -= amount;
  this.withdrawableBalance += amount;
  return this.save();
};

/**
 * Lock withdrawable funds for a pending withdrawal request.
 * Moves from withdrawableBalance → lockedBalance.
 */
walletSchema.methods.lockForWithdrawal = async function (amount) {
  if (amount <= 0) throw new Error('Amount must be greater than 0');
  if (this.withdrawableBalance < amount) throw new Error('Insufficient withdrawable balance');
  this.withdrawableBalance -= amount;
  this.lockedBalance += amount;
  return this.save();
};

/**
 * Unlock funds when a withdrawal is cancelled or rejected.
 * Moves from lockedBalance → withdrawableBalance.
 */
walletSchema.methods.unlockWithdrawal = async function (amount) {
  if (amount <= 0) throw new Error('Amount must be greater than 0');
  if (this.lockedBalance < amount) throw new Error('Not enough locked balance to unlock');
  this.lockedBalance -= amount;
  this.withdrawableBalance += amount;
  return this.save();
};

/**
 * Finalise a processed withdrawal — removes amount from lockedBalance entirely.
 * Called when the bank transfer is confirmed.
 */
walletSchema.methods.finaliseWithdrawal = async function (amount) {
  if (amount <= 0) throw new Error('Amount must be greater than 0');
  if (this.lockedBalance < amount) throw new Error('Not enough locked balance to finalise');
  this.lockedBalance -= amount;
  return this.save();
};

// ─── Static Methods ────────────────────────────────────────────────────────────

/**
 * Find the wallet for a user or create a new empty one if it doesn't exist.
 */
walletSchema.statics.getOrCreate = async function (userId) {
  let wallet = await this.findOne({ user: userId });
  if (!wallet) {
    wallet = await this.create({ user: userId });
  }
  return wallet;
};

module.exports = mongoose.model('Wallet', walletSchema);
