import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiClient from '../utils/ApiClient';

// ─── Icon replacements (emoji-based, no lucide-react needed) ─────────────────

const icons = {
  deposit:     '⬇️',
  withdraw:    '⬆️',
  bet:         '💸',
  win:         '📈',
  wallet:      '💰',
  trophy:      '🏆',
  star:        '⭐',
  chevron:     '›',
  dollar:      '💵',
  check:       '✅',
  clock:       '⏳',
  history:     '📋',
  card:        '🏦',
  sparkles:    '✨',
  cashback:    '📈',
  gift:        '🎁',
  shield:      '🛡️',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getTransactionIcon(type) {
  switch (type) {
    case 'deposit':  return <span className="text-green-400 text-lg">{icons.deposit}</span>;
    case 'withdraw':
    case 'withdrawal': return <span className="text-red-400 text-lg">{icons.withdraw}</span>;
    case 'lose':
    case 'bet':      return <span className="text-blue-400 text-lg">{icons.bet}</span>;
    case 'win':      return <span className="text-purple-400 text-lg">{icons.win}</span>;
    default:         return <span className="text-[#8f98a8] text-lg">{icons.wallet}</span>;
  }
}

function getBenefitIcon(type) {
  switch (type) {
    case 'daily_cashback':  return <span className="text-green-400">{icons.cashback}</span>;
    case 'daily_bonus':     return <span className="text-amber-400">{icons.gift}</span>;
    case 'deposit_bonus':   return <span className="text-blue-400">{icons.dollar}</span>;
    case 'priority_support': return <span className="text-purple-400">{icons.shield}</span>;
    default:                return <span className="text-[#8f98a8]">{icons.sparkles}</span>;
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Spinner() {
  return (
    <div className="flex justify-center py-6">
      <div className="w-6 h-6 border-2 border-[#8b7cff] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function Modal({ open, onClose, title, description, children }) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full max-w-[340px] rounded-3xl bg-[#131926] border border-[#242b39] p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-[#8f98a8] hover:text-white text-xl leading-none"
        >
          ×
        </button>
        <h2 className="text-xl font-bold text-white mb-1">{title}</h2>
        {description && <p className="text-sm text-[#8f98a8] mb-4">{description}</p>}
        {children}
      </div>
    </div>
  );
}

function InlineError({ message }) {
  if (!message) return null;
  return (
    <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-3 py-2 text-sm text-red-400">
      {message}
    </div>
  );
}

function InlineSuccess({ message }) {
  if (!message) return null;
  return (
    <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 text-sm text-emerald-400">
      {message}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // ── Wallet state (refreshed after deposit/withdraw) ──
  const [wallet, setWallet] = useState({
    balance: user?.balance ?? 0,
    withdrawableBalance: user?.withdrawableBalance ?? 0,
    lockedBalance: user?.lockedBalance ?? 0,
  });

  // ── Progress ──
  const level = user?.level ?? 1;
  const points = user?.points ?? 0;

  // ── Transactions ──
  const [transactions, setTransactions] = useState([]);
  const [txLoading, setTxLoading] = useState(true);
  const [txPage, setTxPage] = useState(1);
  const [txPagination, setTxPagination] = useState(null);
  const [txFetching, setTxFetching] = useState(false);

  // ── Withdrawals ──
  const [withdrawals, setWithdrawals] = useState([]);
  const [wdLoading, setWdLoading] = useState(true);

  // ── Active tab ──
  const [activeTab, setActiveTab] = useState('transactions');

  // ── Modal visibility ──
  const [depositOpen, setDepositOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [benefitsOpen, setBenefitsOpen] = useState(false);

  // ── Deposit form ──
  const [depositAmount, setDepositAmount] = useState('');
  const [depositPending, setDepositPending] = useState(false);
  const [depositError, setDepositError] = useState('');
  const [depositSuccess, setDepositSuccess] = useState('');

  // ── Withdraw form ──
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [bankName, setBankName] = useState('CBE');
  const [accountName, setAccountName] = useState('');
  const [withdrawPending, setWithdrawPending] = useState(false);
  const [withdrawError, setWithdrawError] = useState('');
  const [withdrawSuccess, setWithdrawSuccess] = useState('');

  // ── Fetch transactions ──
  const fetchTransactions = useCallback(async (page) => {
    if (page === 1) setTxLoading(true); else setTxFetching(true);
    try {
      const res = await apiClient.get(`/api/wallet/transactions?page=${page}&limit=5`);
      setTransactions(res.data.data ?? []);
      setTxPagination(res.data.pagination ?? null);
    } catch {
      // silently fail — empty list shown
    } finally {
      setTxLoading(false);
      setTxFetching(false);
    }
  }, []);

  // ── Fetch withdrawals ──
  const fetchWithdrawals = useCallback(async () => {
    setWdLoading(true);
    try {
      const res = await apiClient.get('/api/wallet/withdrawals');
      setWithdrawals(res.data.data ?? []);
    } catch {
      // silently fail
    } finally {
      setWdLoading(false);
    }
  }, []);

  useEffect(() => { fetchTransactions(1); }, [fetchTransactions]);
  useEffect(() => { fetchWithdrawals(); }, [fetchWithdrawals]);

  useEffect(() => {
    if (txPage > 1) fetchTransactions(txPage);
  }, [txPage, fetchTransactions]);

  // ── Deposit handler ──
  const handleDeposit = async () => {
    setDepositError('');
    setDepositSuccess('');
    const num = Number(depositAmount);
    if (!Number.isFinite(num) || num <= 9) {
      setDepositError('Minimum deposit is 10 ETB');
      return;
    }
    setDepositPending(true);
    try {
      const res = await apiClient.post('/api/wallet/deposit', { amount: num });
      setWallet({
        balance: res.data.wallet.balance,
        withdrawableBalance: res.data.wallet.withdrawable ?? res.data.wallet.balance,
        lockedBalance: res.data.wallet.locked ?? 0,
      });
      setDepositSuccess(`Deposited ${num} ETB successfully`);
      setDepositAmount('');
      fetchTransactions(1);
      setTxPage(1);
    } catch (err) {
      setDepositError(err.response?.data?.message || 'Deposit failed');
    } finally {
      setDepositPending(false);
    }
  };

  // ── Withdraw handler ──
  const handleWithdraw = async () => {
    setWithdrawError('');
    setWithdrawSuccess('');
    const num = Number(withdrawAmount);
    if (!Number.isFinite(num) || num < 50) {
      setWithdrawError('Minimum withdrawal is 50 ETB');
      return;
    }
    if (wallet.withdrawableBalance < num) {
      setWithdrawError('Insufficient withdrawable balance');
      return;
    }
    if (!/^\d{13}$/.test(accountNumber)) {
      setWithdrawError('Account number must be exactly 13 digits');
      return;
    }
    if (!accountName.trim()) {
      setWithdrawError('Account holder name is required');
      return;
    }
    if (!bankName.trim()) {
      setWithdrawError('Bank name is required');
      return;
    }
    setWithdrawPending(true);
    try {
      const res = await apiClient.post('/api/wallet/withdraw', {
        amount: num,
        destination_account: accountNumber,
        bank_name: bankName,
        account_holder_name: accountName,
      });
      setWallet({
        balance: res.data.wallet.balance,
        withdrawableBalance: res.data.wallet.available ?? res.data.wallet.balance,
        lockedBalance: res.data.wallet.locked ?? 0,
      });
      setWithdrawSuccess(res.data.message || 'Withdrawal request submitted');
      setWithdrawAmount('');
      setAccountNumber('');
      setAccountName('');
      fetchWithdrawals();
      fetchTransactions(1);
      setTxPage(1);
    } catch (err) {
      setWithdrawError(err.response?.data?.message || 'Withdrawal failed');
    } finally {
      setWithdrawPending(false);
    }
  };

  const numericDeposit = Number(depositAmount);
  const depositValid = Number.isFinite(numericDeposit) && numericDeposit > 9;

  const withdrawValid =
    Number(withdrawAmount) >= 50 &&
    /^\d{13}$/.test(accountNumber) &&
    accountName.trim().length > 0 &&
    bankName.trim().length > 0;

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner />
      </div>
    );
  }

  const avatarInitials =
    (user.firstName?.charAt(0) ?? '').toUpperCase() +
    (user.lastName?.charAt(0) ?? '').toUpperCase();

  const pointsPerLevel = 100;
  const pointsProgress = Math.min(((points % pointsPerLevel) / pointsPerLevel) * 100, 100);

  return (
    <div className="min-h-screen bg-[#0d1019] pb-16 px-3 pt-4 text-white font-[Arial,Helvetica,sans-serif]">
      <div className="max-w-sm mx-auto space-y-4">

        {/* ── Profile card ── */}
        <div className="rounded-3xl border border-[#242b39]/60 bg-[#131926] shadow-md overflow-hidden p-4 space-y-4">

          {/* User row */}
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 shrink-0 flex items-center justify-center rounded-full bg-[#8b7cff]/10 border-2 border-[#8b7cff]/20 text-sm font-bold text-[#8b7cff]">
              {avatarInitials || '?'}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h2 className="truncate text-base font-semibold">
                  {user.firstName} {user.lastName}
                </h2>
                <span className="shrink-0 rounded-full bg-[#8b7cff]/10 px-2 py-0.5 text-[9px] font-bold text-[#8b7cff]">
                  Lv.{level}
                </span>
              </div>
              <p className="text-[11px] text-[#8f98a8] truncate">
                @{user.username || 'user'}
              </p>
            </div>
          </div>

          {/* Balance summary */}
          <div className="rounded-2xl bg-gradient-to-br from-[#8b7cff]/10 to-transparent p-4 border border-[#8b7cff]/10">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#8f98a8]">Total Balance</span>
              <span className="text-2xl font-bold tracking-tight">
                {wallet.balance.toFixed(2)}{' '}
                <span className="text-sm font-normal text-[#8f98a8]">ETB</span>
              </span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="bg-[#0d1019]/60 rounded-xl p-2.5 text-center">
                <span className="text-[10px] text-[#8f98a8]">Withdrawable</span>
                <p className="text-base font-bold text-emerald-400">
                  {wallet.withdrawableBalance.toFixed(2)}
                </p>
              </div>
              <div className="bg-[#0d1019]/60 rounded-xl p-2.5 text-center">
                <span className="text-[10px] text-[#8f98a8]">Locked</span>
                <p className="text-base font-bold text-amber-400">
                  {wallet.lockedBalance.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* Level progress */}
          <div className="bg-[#242b39]/20 rounded-2xl p-3 border border-[#242b39]/40">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-[#8b7cff]">{icons.trophy}</span>
                <span className="text-sm font-semibold">Level {level}</span>
                <span className="text-[#8f98a8]">{icons.chevron}</span>
                <span className="text-sm text-[#8f98a8]">{level + 1}</span>
              </div>
              <button
                onClick={() => setBenefitsOpen(true)}
                className="flex items-center gap-1 text-[10px] font-medium text-[#8b7cff] hover:underline"
              >
                {icons.sparkles} Benefits
              </button>
            </div>

            {/* Points progress */}
            <div className="mb-1">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="flex items-center gap-1">
                  {icons.star} Points
                </span>
                <span className="font-medium">{points.toLocaleString()}</span>
              </div>
              <div className="h-2 bg-[#242b39] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#8b7cff]/70 to-[#8b7cff] transition-all duration-500"
                  style={{ width: `${pointsProgress}%` }}
                />
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => { setDepositOpen(true); setDepositError(''); setDepositSuccess(''); }}
              className="h-11 w-full rounded-2xl bg-[#8b7cff] hover:bg-[#7a6bee] text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              {icons.deposit} Deposit
            </button>
            <button
              onClick={() => { setWithdrawOpen(true); setWithdrawError(''); setWithdrawSuccess(''); }}
              className="h-11 w-full rounded-2xl border border-red-500/30 text-red-400 hover:bg-red-500/10 text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              {icons.withdraw} Withdraw
            </button>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="space-y-3">
          {/* Tab bar */}
          <div className="flex w-full h-11 rounded-2xl bg-[#242b39] p-1 gap-1">
            {['transactions', 'withdrawals'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  activeTab === tab
                    ? 'bg-[#0d1019] text-white shadow-sm'
                    : 'text-[#8f98a8] hover:text-white'
                }`}
              >
                {tab === 'transactions' ? `${icons.history} History` : `${icons.card} Withdrawals`}
              </button>
            ))}
          </div>

          {/* Transactions tab */}
          {activeTab === 'transactions' && (
            <div className="space-y-2">
              {txLoading ? (
                <Spinner />
              ) : transactions.length === 0 ? (
                <p className="text-center text-sm text-[#8f98a8] py-6">No transactions yet</p>
              ) : (
                <>
                  {transactions.map((t) => (
                    <div
                      key={t._id}
                      className="rounded-2xl border border-[#242b39]/60 bg-[#131926] hover:bg-[#1a2233] transition cursor-default"
                    >
                      <div className="flex justify-between items-center p-3">
                        <div className="flex items-center gap-3">
                          {getTransactionIcon(t.type)}
                          <div>
                            <p className="text-sm font-medium capitalize">{t.type}</p>
                            <p className="text-[11px] text-[#8f98a8]">{formatDate(t.createdAt)}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold">{t.amount} ETB</p>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                            t.status === 'completed'
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : t.status === 'failed'
                              ? 'bg-red-500/10 text-red-400'
                              : 'bg-amber-500/10 text-amber-400'
                          }`}>
                            {t.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Pagination */}
                  {txPagination && txPagination.totalPages > 1 && (
                    <div className="flex items-center justify-between pt-2">
                      <button
                        disabled={!txPagination.hasPreviousPage || txFetching}
                        onClick={() => setTxPage((p) => Math.max(p - 1, 1))}
                        className="rounded-xl border border-[#242b39] px-4 py-2 text-xs font-medium hover:bg-[#242b39] disabled:opacity-40"
                      >
                        Prev
                      </button>
                      <span className="text-xs text-[#8f98a8]">
                        {txPagination.page} / {txPagination.totalPages}
                      </span>
                      <button
                        disabled={!txPagination.hasNextPage || txFetching}
                        onClick={() => setTxPage((p) => p + 1)}
                        className="rounded-xl border border-[#242b39] px-4 py-2 text-xs font-medium hover:bg-[#242b39] disabled:opacity-40"
                      >
                        Next
                      </button>
                    </div>
                  )}
                  {txFetching && <div className="flex justify-center pt-1"><div className="h-4 w-4 animate-spin rounded-full border-2 border-[#8b7cff] border-t-transparent" /></div>}
                </>
              )}
            </div>
          )}

          {/* Withdrawals tab */}
          {activeTab === 'withdrawals' && (
            <div className="space-y-2">
              {wdLoading ? (
                <Spinner />
              ) : withdrawals.length === 0 ? (
                <p className="text-center text-sm text-[#8f98a8] py-6">No withdrawal requests</p>
              ) : (
                withdrawals.map((w) => (
                  <div key={w._id} className="rounded-2xl border border-[#242b39]/60 bg-[#131926]">
                    <div className="flex justify-between items-center p-3">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{w.processed ? icons.check : icons.clock}</span>
                        <div>
                          <p className="text-sm font-medium">{w.accountHolderName}</p>
                          <p className="text-[11px] text-[#8f98a8]">
                            {w.bankName} • {w.destinationAccount}
                          </p>
                          <p className="text-[10px] text-[#8f98a8]">{formatDate(w.createdAt)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-red-400">- {w.amount} ETB</p>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                          w.processed
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-amber-500/10 text-amber-400'
                        }`}>
                          {w.processed ? 'Completed' : 'Pending'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Deposit modal ── */}
      <Modal
        open={depositOpen}
        onClose={() => setDepositOpen(false)}
        title="Add Funds"
        description="Enter amount (10–5,000 ETB)"
      >
        <div className="space-y-3">
          <InlineError message={depositError} />
          <InlineSuccess message={depositSuccess} />
          <div className="relative">
            <input
              type="number"
              placeholder="Amount"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              className="w-full h-12 rounded-2xl bg-[#0d1019] border border-[#242b39] px-4 pr-14 text-base text-white placeholder-[#8f98a8] focus:outline-none focus:border-[#8b7cff]"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-[#8f98a8]">ETB</span>
          </div>
          <button
            disabled={!depositValid || depositPending}
            onClick={handleDeposit}
            className="h-12 w-full rounded-2xl bg-[#8b7cff] hover:bg-[#7a6bee] disabled:opacity-50 text-white text-base font-semibold transition-colors"
          >
            {depositPending ? 'Processing…' : `Deposit ${depositValid ? numericDeposit : ''} ETB`}
          </button>
        </div>
      </Modal>

      {/* ── Withdraw modal ── */}
      <Modal
        open={withdrawOpen}
        onClose={() => setWithdrawOpen(false)}
        title="Withdraw Funds"
        description="Enter bank details (min 50 ETB)"
      >
        <div className="space-y-3">
          <InlineError message={withdrawError} />
          <InlineSuccess message={withdrawSuccess} />
          <input
            type="number"
            placeholder="Amount"
            min={50}
            value={withdrawAmount}
            onChange={(e) => setWithdrawAmount(e.target.value)}
            className="w-full h-12 rounded-2xl bg-[#0d1019] border border-[#242b39] px-4 text-white placeholder-[#8f98a8] focus:outline-none focus:border-[#8b7cff]"
          />
          <input
            type="text"
            inputMode="numeric"
            placeholder="Account number (13 digits)"
            maxLength={13}
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
            className="w-full h-12 rounded-2xl bg-[#0d1019] border border-[#242b39] px-4 text-white placeholder-[#8f98a8] focus:outline-none focus:border-[#8b7cff]"
          />
          <input
            type="text"
            placeholder="Bank name"
            value={bankName}
            onChange={(e) => setBankName(e.target.value)}
            className="w-full h-12 rounded-2xl bg-[#0d1019] border border-[#242b39] px-4 text-white placeholder-[#8f98a8] focus:outline-none focus:border-[#8b7cff]"
          />
          <input
            type="text"
            placeholder="Account holder name"
            value={accountName}
            onChange={(e) => setAccountName(e.target.value)}
            className="w-full h-12 rounded-2xl bg-[#0d1019] border border-[#242b39] px-4 text-white placeholder-[#8f98a8] focus:outline-none focus:border-[#8b7cff]"
          />
          <button
            disabled={!withdrawValid || withdrawPending}
            onClick={handleWithdraw}
            className="h-12 w-full rounded-2xl bg-[#8b7cff] hover:bg-[#7a6bee] disabled:opacity-50 text-white text-base font-semibold transition-colors"
          >
            {withdrawPending ? 'Processing…' : 'Confirm'}
          </button>
        </div>
      </Modal>

      {/* ── Benefits modal ── */}
      <Modal
        open={benefitsOpen}
        onClose={() => setBenefitsOpen(false)}
        title={`${icons.trophy} Level Benefits`}
        description="Perks at your current level"
      >
        <div className="space-y-3">
          <div className="bg-[#242b39]/20 rounded-2xl p-4 border border-[#242b39]/40">
            <h4 className="text-sm font-semibold mb-2">Level {level}</h4>
            <p className="text-[11px] text-[#8f98a8]">
              Keep playing to earn more points and unlock higher level rewards.
            </p>
            <div className="mt-2 space-y-1">
              <div className="flex items-center gap-2 text-xs text-[#8f98a8]">
                <span>{icons.star}</span> {points.toLocaleString()} points earned
              </div>
              <div className="flex items-center gap-2 text-xs text-[#8f98a8]">
                <span>{icons.trophy}</span> Current level: {level}
              </div>
            </div>
          </div>
          <button
            onClick={() => setBenefitsOpen(false)}
            className="w-full rounded-2xl border border-[#242b39] px-8 py-2 text-sm font-semibold text-white hover:bg-[#242b39] transition-colors"
          >
            Close
          </button>
        </div>
      </Modal>
    </div>
  );
}
