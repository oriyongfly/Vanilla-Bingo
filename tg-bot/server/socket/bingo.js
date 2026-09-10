/**
 * server/socket/bingo.js
 *
 * Continuous clock architecture — each stake tier runs an infinite cycle:
 *
 *   PICKING phase (50s):
 *     - Server broadcasts bingo:tick every second with timeLeft
 *     - Players join by emitting bingo:join
 *     - At timeLeft = 0, transitions to DRAWING phase
 *
 *   DRAWING phase:
 *     - Server draws one ball every 2s, broadcasts bingo:ball_drawn
 *     - Players claim by emitting bingo:claim
 *     - Server validates claim server-side
 *     - Winner found → broadcasts bingo:winner, waits 5s, starts new cycle
 *     - All 75 balls drawn with no winner → broadcasts bingo:game_over, waits 5s, starts new cycle
 *
 * On bingo:get_status → server responds with current phase, timeLeft, gameId, drawnBalls
 * Stake page uses this to route the player to Pick (join mid-countdown) or Game (spectate)
 *
 * Room broadcast channel (all sockets in a tier receive ticks/balls):
 *   bingo:tier:{stakeAmount}
 *
 * Game room (players + spectators for a specific game):
 *   bingo:stake:{stakeAmount}:game:{gameId}
 */

const Wallet = require('../models/Wallet');
const GameHistory = require('../models/GameHistory');
const Transaction = require('../models/Transaction');
const User = require('../models/user');

// ─── Constants ────────────────────────────────────────────────────────────────

const PICK_DURATION_S = 50;
const DRAW_INTERVAL_MS = 2000;
const ROUND_END_DELAY_MS = 5000;

const LETTERS = ['B', 'I', 'N', 'G', 'O'];
const BALL_RANGES = [[1,15],[16,30],[31,45],[46,60],[61,75]];
const STAKE_TIERS = [5, 10, 20, 50];

// ─── In-memory state ──────────────────────────────────────────────────────────

/**
 * tiers: { [stakeAmount]: TierState }
 *
 * TierState = {
 *   stakeAmount:  number,
 *   phase:        'picking' | 'drawing' | 'ending',
 *   gameId:       string,
 *   roomId:       string,          // bingo:stake:{amount}:game:{gameId}
 *   tierChannel:  string,          // bingo:tier:{amount}  (broadcast to all)
 *   timeLeft:     number,          // seconds remaining in picking phase
 *   players:      Array<PlayerState>,
 *   spectators:   Array<{ socketId }>,
 *   balls:        Array<{ number, letter }>,
 *   drawnBalls:   Array<{ number, letter }>,
 *   tickInterval: Timer | null,
 *   drawInterval: Timer | null,
 * }
 *
 * PlayerState = {
 *   userId:       string (telegramId),
 *   socketId:     string,
 *   cardNumber:   number,
 *   card:         number[][],
 *   betBreakdown: { fromLocked, fromWithdrawable },
 * }
 */
const tiers = {};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateGameId(stakeAmount) {
  const hex = Math.random().toString(16).slice(2, 6).toUpperCase();
  return `BINGO-${stakeAmount}-${hex}`;
}

function generateBalls() {
  const balls = [];
  for (let i = 0; i < 5; i++) {
    const [min, max] = BALL_RANGES[i];
    for (let n = min; n <= max; n++) {
      balls.push({ number: n, letter: LETTERS[i] });
    }
  }
  for (let i = balls.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [balls[i], balls[j]] = [balls[j], balls[i]];
  }
  return balls;
}

function calcEstimatedWin(playerCount, stakeAmount) {
  return Math.floor(playerCount * stakeAmount * 0.8);
}

function validateBingo(card, drawnNumbers) {
  const drawn = new Set(drawnNumbers);
  const hit = (val) => val === '★' || drawn.has(val);

  for (let r = 0; r < 5; r++) {
    if (card[r].every(hit)) return { valid: true, pattern: `Row ${r + 1}` };
  }
  for (let c = 0; c < 5; c++) {
    if (card.every((row) => hit(row[c]))) return { valid: true, pattern: `Column ${c + 1}` };
  }
  if (card.every((row, i) => hit(row[i]))) return { valid: true, pattern: 'Diagonal ↘' };
  if (card.every((row, i) => hit(row[4 - i]))) return { valid: true, pattern: 'Diagonal ↙' };

  return { valid: false, pattern: null };
}

function clearTierTimers(tier) {
  if (tier.tickInterval) { clearInterval(tier.tickInterval); tier.tickInterval = null; }
  if (tier.drawInterval) { clearInterval(tier.drawInterval); tier.drawInterval = null; }
}

// ─── Cycle engine ─────────────────────────────────────────────────────────────

function startPickingPhase(io, tier) {
  clearTierTimers(tier);

  const gameId = generateGameId(tier.stakeAmount);
  const roomId = `bingo:stake:${tier.stakeAmount}:game:${gameId}`;

  tier.phase      = 'picking';
  tier.gameId     = gameId;
  tier.roomId     = roomId;
  tier.timeLeft   = PICK_DURATION_S;
  tier.players    = [];
  tier.spectators = [];
  tier.balls      = generateBalls();
  tier.drawnBalls = [];

  console.log(`🟡 [${tier.stakeAmount} ETB] Picking phase started — ${gameId}`);

  io.to(tier.tierChannel).emit('bingo:phase_changed', {
    phase: 'picking',
    gameId,
    timeLeft: PICK_DURATION_S,
    stakeAmount: tier.stakeAmount,
  });

  tier.tickInterval = setInterval(() => {
    tier.timeLeft -= 1;

    io.to(tier.tierChannel).emit('bingo:tick', {
      gameId: tier.gameId,
      timeLeft: tier.timeLeft,
      stakeAmount: tier.stakeAmount,
      playerCount: tier.players.length,
      estimatedWin: calcEstimatedWin(tier.players.length, tier.stakeAmount),
    });

    if (tier.timeLeft <= 0) {
      clearTierTimers(tier);
      startDrawingPhase(io, tier);
    }
  }, 1000);
}

function startDrawingPhase(io, tier) {
  clearTierTimers(tier);

  if (tier.players.length === 0) {
    // No players — skip drawing, start new round immediately
    console.log(`⏭️  [${tier.stakeAmount} ETB] No players, skipping draw — starting new round`);
    startPickingPhase(io, tier);
    return;
  }

  tier.phase = 'drawing';
  console.log(`▶️  [${tier.stakeAmount} ETB] Drawing started — ${tier.players.length} player(s)`);

  io.to(tier.tierChannel).emit('bingo:phase_changed', {
    phase: 'drawing',
    gameId: tier.gameId,
    stakeAmount: tier.stakeAmount,
    playerCount: tier.players.length,
    estimatedWin: calcEstimatedWin(tier.players.length, tier.stakeAmount),
  });

  tier.drawInterval = setInterval(() => {
    if (tier.balls.length === 0) {
      clearTierTimers(tier);
      finishRound(io, tier, null);
      return;
    }

    const ball = tier.balls.pop();
    tier.drawnBalls.push(ball);

    io.to(tier.tierChannel).emit('bingo:ball_drawn', {
      ball,
      gameId: tier.gameId,
      totalDrawn: tier.drawnBalls.length,
      remaining: tier.balls.length,
      estimatedWin: calcEstimatedWin(tier.players.length, tier.stakeAmount),
    });
  }, DRAW_INTERVAL_MS);
}

async function finishRound(io, tier, winnerInfo) {
  if (tier.phase === 'ending') return;
  tier.phase = 'ending';
  clearTierTimers(tier);

  const prize = winnerInfo
    ? calcEstimatedWin(tier.players.length, tier.stakeAmount)
    : 0;

  if (winnerInfo) {
    io.to(tier.tierChannel).emit('bingo:winner', {
      userId: winnerInfo.userId,
      pattern: winnerInfo.pattern,
      prize,
      gameId: tier.gameId,
    });

    // Credit winner wallet
    try {
      const winnerUser = await User.findOne({ telegramId: winnerInfo.userId });
      if (winnerUser) {
        const wallet = await Wallet.getOrCreate(winnerUser._id);
        const betBreakdown = winnerInfo.betBreakdown || { fromLocked: tier.stakeAmount, fromWithdrawable: 0 };
        await wallet.creditWin(prize, tier.stakeAmount, betBreakdown);

        await Transaction.create({
          user: winnerUser._id,
          type: 'win',
          amount: prize,
          status: 'completed',
          metadata: { gameId: tier.gameId, pattern: winnerInfo.pattern, gameType: 'bingo' },
        });
      }
    } catch (err) {
      console.error('❌ Error crediting winner:', err.message);
    }

    try {
      await GameHistory.create({
        user: winnerInfo.userId,
        game: 'bingo',
        betAmount: tier.stakeAmount,
        gridState: { gameId: tier.gameId, playerCount: tier.players.length },
        spinResult: tier.drawnBalls,
        totalPayout: prize,
      });
    } catch (err) {
      console.error('❌ Error saving game history:', err.message);
    }

  } else {
    io.to(tier.tierChannel).emit('bingo:game_over', {
      gameId: tier.gameId,
      message: 'All 75 balls drawn — no winner this round.',
    });
  }

  console.log(`🏁 [${tier.stakeAmount} ETB] Round ended — ${tier.gameId}`);

  // Wait then start next picking phase
  setTimeout(() => {
    io.to(tier.tierChannel).emit('bingo:round_end', {
      gameId: tier.gameId,
      stakeAmount: tier.stakeAmount,
    });
    startPickingPhase(io, tier);
  }, ROUND_END_DELAY_MS);
}

// ─── Main export ──────────────────────────────────────────────────────────────

function setupBingoSocket(io) {
  // Start the continuous clock for every stake tier
  for (const stakeAmount of STAKE_TIERS) {
    const tierChannel = `bingo:tier:${stakeAmount}`;
    tiers[stakeAmount] = {
      stakeAmount,
      tierChannel,
      phase: 'picking',
      gameId: '',
      roomId: '',
      timeLeft: PICK_DURATION_S,
      players: [],
      spectators: [],
      balls: [],
      drawnBalls: [],
      tickInterval: null,
      drawInterval: null,
    };
    startPickingPhase(io, tiers[stakeAmount]);
  }

  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id} (${socket.user?.telegramId || 'unauth'})`);

    // ── bingo:get_status ────────────────────────────────────────────────────
    // Called by Stake page — returns current phase so client can route correctly
    socket.on('bingo:get_status', ({ stakeAmount }) => {
      const tier = tiers[stakeAmount];
      if (!tier) {
        socket.emit('bingo:status', null);
        return;
      }

      socket.emit('bingo:status', {
        phase: tier.phase,
        gameId: tier.gameId,
        stakeAmount: tier.stakeAmount,
        timeLeft: tier.timeLeft,
        playerCount: tier.players.length,
        estimatedWin: calcEstimatedWin(tier.players.length, tier.stakeAmount),
        drawnBalls: tier.drawnBalls,
        takenCards: tier.players.map((p) => p.cardNumber),
      });
    });

    // ── bingo:subscribe ─────────────────────────────────────────────────────
    // Called when Pick or Game page mounts — subscribes to tick/ball events
    socket.on('bingo:subscribe', ({ stakeAmount }) => {
      const tier = tiers[stakeAmount];
      if (!tier) return;
      socket.join(tier.tierChannel);

      // Send current state immediately so UI syncs
      socket.emit('bingo:status', {
        phase: tier.phase,
        gameId: tier.gameId,
        stakeAmount: tier.stakeAmount,
        timeLeft: tier.timeLeft,
        playerCount: tier.players.length,
        estimatedWin: calcEstimatedWin(tier.players.length, tier.stakeAmount),
        drawnBalls: tier.drawnBalls,
        takenCards: tier.players.map((p) => p.cardNumber),
      });
    });

    // ── bingo:join ──────────────────────────────────────────────────────────
    socket.on('bingo:join', async ({ stakeAmount, cardNumber, card }) => {
      const userId = socket.user?.telegramId;
      if (!userId) {
        socket.emit('bingo:error', { message: 'Authentication required.' });
        return;
      }

      const tier = tiers[stakeAmount];
      if (!tier) {
        socket.emit('bingo:error', { message: 'Invalid stake amount.' });
        return;
      }

      if (tier.phase !== 'picking' && tier.phase !== 'drawing') {
        socket.emit('bingo:error', { message: 'No active game for this stake. Wait for the next round.' });
        return;
      }

      // If drawing has already started, register as spectator only (no stake deducted)
      if (tier.phase === 'drawing') {
        socket.join(tier.tierChannel);
        socket.emit('bingo:room_info', {
          gameId: tier.gameId,
          roomId: tier.roomId,
          stakeAmount: tier.stakeAmount,
          playerCount: tier.players.length,
          estimatedWin: calcEstimatedWin(tier.players.length, tier.stakeAmount),
          cardNumber,
          takenCards: tier.players.map((p) => p.cardNumber),
          lateJoin: true,
        });
        return;
      }

      if (!cardNumber || cardNumber < 1 || cardNumber > 60) {
        socket.emit('bingo:error', { message: 'Invalid card number.' });
        return;
      }

      // Prevent duplicate joins
      if (tier.players.some((p) => p.userId === userId)) {
        socket.emit('bingo:room_info', {
          gameId: tier.gameId,
          roomId: tier.roomId,
          stakeAmount: tier.stakeAmount,
          playerCount: tier.players.length,
          estimatedWin: calcEstimatedWin(tier.players.length, tier.stakeAmount),
          cardNumber,
          takenCards: tier.players.map((p) => p.cardNumber),
        });
        return;
      }

      // Deduct stake
      try {
        const user = await User.findOne({ telegramId: userId });
        if (!user) { socket.emit('bingo:error', { message: 'User not found.' }); return; }

        const wallet = await Wallet.getOrCreate(user._id);
        const betBreakdown = await wallet.deduct(stakeAmount);

        tier.players.push({ userId, socketId: socket.id, cardNumber, card, betBreakdown });

        await Transaction.create({
          user: user._id,
          type: 'lose',
          amount: stakeAmount,
          status: 'completed',
          metadata: { gameId: tier.gameId, gameType: 'bingo', note: 'stake' },
        });
      } catch (err) {
        socket.emit('bingo:error', { message: err.message });
        return;
      }

      socket.join(tier.tierChannel);
      socket.join(tier.roomId);

      const playerCount = tier.players.length;
      const estimatedWin = calcEstimatedWin(playerCount, stakeAmount);

      socket.emit('bingo:room_info', {
        gameId: tier.gameId,
        roomId: tier.roomId,
        stakeAmount: tier.stakeAmount,
        playerCount,
        estimatedWin,
        cardNumber,
        takenCards: tier.players.map((p) => p.cardNumber),
      });

      io.to(tier.tierChannel).emit('bingo:player_joined', {
        playerCount,
        estimatedWin,
        takenCards: tier.players.map((p) => p.cardNumber),
      });

      console.log(`👤 [${stakeAmount} ETB] Player ${userId} joined (card #${cardNumber}, ${playerCount} players)`);
    });

    // ── bingo:claim ─────────────────────────────────────────────────────────
    socket.on('bingo:claim', ({ stakeAmount }) => {
      const userId = socket.user?.telegramId;
      if (!userId) { socket.emit('bingo:error', { message: 'Authentication required.' }); return; }

      const tier = tiers[stakeAmount];
      if (!tier || tier.phase !== 'drawing') {
        socket.emit('bingo:error', { message: 'No active drawing in this tier.' });
        return;
      }

      const player = tier.players.find((p) => p.userId === userId);
      if (!player) { socket.emit('bingo:error', { message: 'You are not in this game.' }); return; }

      const drawnNumbers = tier.drawnBalls.map((b) => b.number);
      const result = validateBingo(player.card, drawnNumbers);

      if (!result.valid) {
        socket.emit('bingo:invalid_claim', { message: 'No Bingo pattern found. Keep playing!' });
        return;
      }

      finishRound(io, tier, {
        userId,
        pattern: result.pattern,
        betBreakdown: player.betBreakdown,
      });
    });

    // ── disconnect ───────────────────────────────────────────────────────────
    socket.on('disconnect', () => {
      console.log(`🔌 Socket disconnected: ${socket.id}`);
      for (const tier of Object.values(tiers)) {
        const index = tier.players.findIndex((p) => p.socketId === socket.id);
        if (index !== -1) {
          tier.players.splice(index, 1);
          console.log(`👤 Player removed from [${tier.stakeAmount} ETB] (${tier.players.length} remaining)`);
          break;
        }
      }
    });
  });
}

module.exports = { setupBingoSocket };