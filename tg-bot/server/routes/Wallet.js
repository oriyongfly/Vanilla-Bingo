// server/routes/Wallet.js
const express = require('express');
const router = express.Router();
const { restAuth } = require('../middleware/auth');
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const Withdrawal = require('../models/Withdrawal');

// All routes require authentication
router.use(restAuth);

/**
 * GET /api/wallet/transactions?page=1&limit=5
 * Find Transaction records for the authenticated user,
 * sorted by createdAt descending, with pagination.
 */
router.get('/transactions', async (req, res) => {
  try {
    const userId = req.user.userId;

    // Parse and sanitize pagination params
    let page = parseInt(req.query.page, 10);
    let limit = parseInt(req.query.limit, 10);

    if (!Number.isFinite(page) || page < 1) page = 1;
    if (!Number.isFinite(limit) || limit < 1) limit = 5;
    if (limit > 100) limit = 100; // safety cap

    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      Transaction.find({ user: userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Transaction.countDocuments({ user: userId }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));

    return res.json({
      data: transactions,
      pagination: {
        page,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });
  } catch (err) {
    console.error('GET /api/wallet/transactions error:', err);
    return res.status(500).json({ message: 'Failed to fetch transactions' });
  }
});

/**
 * GET /api/wallet/withdrawals
 * Find all Withdrawal records for the authenticated user,
 * sorted by createdAt descending.
 */
router.get('/withdrawals', async (req, res) => {
  try {
    const userId = req.user.userId;

    const withdrawals = await Withdrawal.find({ user: userId }).sort({
      createdAt: -1,
    });

    return res.json({ data: withdrawals });
  } catch (err) {
    console.error('GET /api/wallet/withdrawals error:', err);
    return res.status(500).json({ message: 'Failed to fetch withdrawals' });
  }
});

/**
 * POST /api/wallet/withdraw
 * body: { amount, destination_account, bank_name, account_holder_name }
 * Validates: amount >= 50, account number is 13 digits, account name present.
 * Locks the funds and creates both a Withdrawal and a Transaction record.
 */
router.post('/withdraw', async (req, res) => {
  const {
    amount,
    destination_account,
    bank_name,
    account_holder_name,
  } = req.body || {};

  // --- Validation ---
  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount) || numericAmount < 50) {
    return res
      .status(400)
      .json({ message: 'Minimum withdrawal amount is 50' });
  }

  if (
    typeof destination_account !== 'string' ||
    !/^\d{13}$/.test(destination_account.trim())
  ) {
    return res
      .status(400)
      .json({ message: 'Account number must be exactly 13 digits' });
  }

  if (
    typeof account_holder_name !== 'string' ||
    account_holder_name.trim().length === 0
  ) {
    return res
      .status(400)
      .json({ message: 'Account holder name is required' });
  }

  if (typeof bank_name !== 'string' || bank_name.trim().length === 0) {
    return res.status(400).json({ message: 'Bank name is required' });
  }

  const userId = req.user.userId;

  let wallet;
  try {
    wallet = await Wallet.getOrCreate(userId);

    // lockForWithdrawal should throw a descriptive error if balance is insufficient
    await wallet.lockForWithdrawal(numericAmount);
  } catch (err) {
    // Insufficient balance / wallet errors => 400
    if (
      err &&
      (err.code === 'INSUFFICIENT_FUNDS' ||
        /insufficient/i.test(err.message || ''))
    ) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }
    console.error('POST /api/wallet/withdraw (lock) error:', err);
    return res.status(500).json({ message: 'Failed to process withdrawal' });
  }

  // --- Create records ---
  try {
    const withdrawal = await Withdrawal.create({
      user: userId,
      amount: numericAmount,
      destinationAccount: destination_account.trim(),
      bankName: bank_name.trim(),
      accountHolderName: account_holder_name.trim(),
      processed: false,
    });

    await Transaction.create({
      user: userId,
      type: 'withdraw',
      amount: numericAmount,
      status: 'pending',
      reference: withdrawal._id,
      meta: {
        destination_account: destination_account.trim(),
        bank_name: bank_name.trim(),
        account_holder_name: account_holder_name.trim(),
      },
    });

    // Reload wallet to reflect the locked balance
    const freshWallet = await Wallet.getOrCreate(userId);

    return res.json({
      message: 'Withdrawal request submitted',
      wallet: {
        balance: freshWallet.balance,
        locked: freshWallet.locked,
        available:
          typeof freshWallet.available === 'number'
            ? freshWallet.available
            : freshWallet.balance - (freshWallet.locked || 0),
      },
      withdrawal,
    });
  } catch (err) {
    console.error('POST /api/wallet/withdraw (persist) error:', err);
    // Best-effort rollback of the locked funds
    try {
      await wallet.unlockWithdrawal(numericAmount);
    } catch (rollbackErr) {
      console.error('Withdraw rollback failed:', rollbackErr);
    }
    return res.status(500).json({ message: 'Failed to process withdrawal' });
  }
});

/**
 * POST /api/wallet/deposit
 * body: { amount }
 * Validates amount > 9. Calls wallet.deposit directly (test mode).
 * Real payment gateway integration is future work.
 */
router.post('/deposit', async (req, res) => {
  const { amount } = req.body || {};

  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount) || numericAmount <= 9) {
    return res
      .status(400)
      .json({ message: 'Deposit amount must be greater than 9' });
  }

  const userId = req.user.userId;

  try {
    const wallet = await Wallet.getOrCreate(userId);

    // Test mode: credit directly. Replace with payment gateway callback later.
    await wallet.deposit(numericAmount);

    await Transaction.create({
      user: userId,
      type: 'deposit',
      amount: numericAmount,
      status: 'completed',
      meta: { mode: 'test' },
    });

    const freshWallet = await Wallet.getOrCreate(userId);

    return res.json({
      message: 'Deposit successful',
      wallet: {
        balance: freshWallet.balance,
        locked: freshWallet.locked,
        available:
          typeof freshWallet.available === 'number'
            ? freshWallet.available
            : freshWallet.balance - (freshWallet.locked || 0),
      },
    });
  } catch (err) {
    console.error('POST /api/wallet/deposit error:', err);
    return res.status(500).json({ message: 'Failed to process deposit' });
  }
});

module.exports = router;