/**
 * server/socket/bingo.js
 * Socket.IO handler for the Bingo game.
 *
 * Game cycle (per stake tier):
 *  1. First player joins → server generates a gameId, opens a room, starts 1s wait
 *  2. More players join the same room during the wait window
 *  3. Drawing starts — server broadcasts one ball every 2 seconds
 *  4. A player emits bingo:claim → server validates → broadcasts bingo:winner
 *  5. After 5 seconds → broadcasts bingo:round_end → all clients go back to Pick
 *  6. A new gameId is generated for the next round
 *
 * Room name format: bingo:stake:{stakeAmount}:game:{gameId}
 * GameId format:    BINGO-{stakeAmount}-{4 random hex chars uppercase}
 */

const Wallet = require('../models/Wallet');
const GameHistory = require('../models/GameHistory');
const Transaction = require('../models/Transaction');
const User = require('../models/user');

// ─── Constants ────────────────────────────────────────────────────────────────

const DRAW_INTERVAL_MS = 2000;      // ball drawn every 2 seconds
const ROUND_END_DELAY_MS = 5000;    // wait 5s after winner before cycling
const JOIN_WAIT_MS = 1000;          // wait 1s after first player before drawing

const LETTERS = ['B', 'I', 'N', 'G', 'O'];
const BALL_RANGES = [
  [1, 15],
  [16, 30],
  [31, 45],
  [46, 60],
  [61, 75],
];

// Valid stake tiers
const STAKE_TIERS = [100, 500, 1000, 5000];

// ─── In-memory state ──────────────────────────────────────────────────────────

/**
 * rooms: { [roomId]: RoomState }
 *
 * RoomState = {
 *   gameId:       string,
 *   stakeAmount:  number,
 *   roomId:       string,
 *   status:       'waiting' | 'drawing' | 'finished',
 *   players:      Array<{ userId, socketId, cardNumber, card, betBreakdown }>,
 *   balls:        Array<{ number, letter }>,   // full shuffled sequence
 *   drawnBalls:   Array<{ number, letter }>,   // drawn so far
 *   drawInterval: NodeJS.Timer | null,
 *   startTimeout: NodeJS.Timer | null,
 * }
 */
const rooms = {};

/**
 * activeGames: { [stakeAmount]: roomId }
 * Points to the current open room per stake tier.
 */
const activeGames = {};

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
  // Fisher-Yates shuffle
  for (let i = balls.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [balls[i], balls[j]] = [balls[j], balls[i]];
  }
  return balls;
}

function calcEstimatedWin(playerCount, stakeAmount) {
  return Math.floor(playerCount * stakeAmount * 0.2);
}

/**
 * Validate a Bingo claim server-side.
 * card is a 5x5 row-major array (rows 0-4, cols B/I/N/G/O).
 * Returns { valid: boolean, pattern: string | null }
 */
function validateBingo(card, drawnNumbers) {
  const drawn = new Set(drawnNumbers);

  const hit = (val) => val === '★' || drawn.has(val);

  // Rows
  for (let r = 0; r < 5; r++) {
    if (card[r].every(hit)) {
      return { valid: true, pattern: `Row ${r + 1}` };
    }
  }

  // Columns
  for (let c = 0; c < 5; c++) {
    if (card.every((row) => hit(row[c]))) {
      return { valid: true, pattern: `Column ${c + 1}` };
    }
  }

  // Diagonal top-left → bottom-right
  if (card.every((row, i) => hit(row[i]))) {
    return { valid: true, pattern: 'Diagonal' };
  }

  // Diagonal top-right → bottom-left
  if (card.every((row, i) => hit(row[4 - i]))) {
    return { valid: true, pattern: 'Diagonal' };
  }

  return { valid: false, pattern: null };
}

// ─── Room lifecycle ───────────────────────────────────────────────────────────

function createRoom(stakeAmount) {
  const gameId = generateGameId(stakeAmount);
  const roomId = `bingo:stake:${stakeAmount}:game:${gameId}`;

  rooms[roomId] = {
    gameId,
    stakeAmount,
    roomId,
    status: 'waiting',
    players: [],
    balls: generateBalls(),
    drawnBalls: [],
    drawInterval: null,
    startTimeout: null,
  };

  activeGames[stakeAmount] = roomId;
  console.log(`🎱 New room created: ${roomId}`);
  return rooms[roomId];
}

function getOrCreateRoom(stakeAmount) {
  const existingRoomId = activeGames[stakeAmount];

  if (existingRoomId && rooms[existingRoomId]) {
    const room = rooms[existingRoomId];
    if (room.status === 'waiting' || room.status === 'drawing') {
      return room;
    }
  }

  return createRoom(stakeAmount);
}

function clearRoomTimers(room) {
  if (room.drawInterval) {
    clearInterval(room.drawInterval);
    room.drawInterval = null;
  }
  if (room.startTimeout) {
    clearTimeout(room.startTimeout);
    room.startTimeout = null;
  }
}

// ─── Draw logic ───────────────────────────────────────────────────────────────

function startDrawing(io, room) {
  if (room.status !== 'waiting') return;

  room.status = 'drawing';
  console.log(`▶️  Drawing started in ${room.roomId} with ${room.players.length} player(s)`);

  room.drawInterval = setInterval(() => {
    if (room.balls.length === 0) {
      // All 75 balls drawn — no winner
      finishRound(io, room, null);
      return;
    }

    const ball = room.balls.pop();
    room.drawnBalls.push(ball);

    io.to(room.roomId).emit('bingo:ball_drawn', {
      ball,
      totalDrawn: room.drawnBalls.length,
      remaining: room.balls.length,
    });

  }, DRAW_INTERVAL_MS);
}

// ─── Win / round end ──────────────────────────────────────────────────────────

async function finishRound(io, room, winnerInfo) {
  if (room.status === 'finished') return;

  room.status = 'finished';
  clearRoomTimers(room);

  const prize = winnerInfo
    ? calcEstimatedWin(room.players.length, room.stakeAmount)
    : 0;

  if (winnerInfo) {
    io.to(room.roomId).emit('bingo:winner', {
      userId: winnerInfo.userId,
      pattern: winnerInfo.pattern,
      prize,
      gameId: room.gameId,
    });

    // Credit winner's wallet
    try {
      const winnerUser = await User.findOne({ telegramId: winnerInfo.userId });
      if (winnerUser) {
        const wallet = await Wallet.getOrCreate(winnerUser._id);
        const betBreakdown = winnerInfo.betBreakdown || { fromLocked: room.stakeAmount, fromWithdrawable: 0 };
        await wallet.creditWin(prize, room.stakeAmount, betBreakdown);

        // Record transaction
        await Transaction.create({
          user: winnerUser._id,
          type: 'win',
          amount: prize,
          status: 'completed',
          metadata: { gameId: room.gameId, pattern: winnerInfo.pattern, gameType: 'bingo' },
        });
      }
    } catch (err) {
      console.error('❌ Error crediting winner:', err.message);
    }

    // Record game history
    try {
      await GameHistory.create({
        user: winnerInfo.userId,
        game: 'bingo',
        betAmount: room.stakeAmount,
        gridState: { gameId: room.gameId, playerCount: room.players.length },
        spinResult: room.drawnBalls,
        totalPayout: prize,
      });
    } catch (err) {
      console.error('❌ Error saving game history:', err.message);
    }

  } else {
    // No winner — all balls drawn
    io.to(room.roomId).emit('bingo:game_over', {
      gameId: room.gameId,
      message: 'All 75 balls drawn — no winner this round.',
    });
  }

  // After delay, end the round and signal clients to go back to Pick
  setTimeout(() => {
    io.to(room.roomId).emit('bingo:round_end', {
      gameId: room.gameId,
      stakeAmount: room.stakeAmount,
    });

    // Clean up room from memory
    delete rooms[room.roomId];
    delete activeGames[room.stakeAmount];

    console.log(`🏁 Round ended: ${room.gameId}`);
  }, ROUND_END_DELAY_MS);
}

// ─── Main export ──────────────────────────────────────────────────────────────

function setupBingoSocket(io) {
  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id} (User: ${socket.user?.telegramId || 'unauthenticated'})`);

    // ── bingo:join ──────────────────────────────────────────────────────────
    socket.on('bingo:join', async ({ stakeAmount, cardNumber, card }) => {
      // Get userId from authenticated socket
      const userId = socket.user?.telegramId;
      
      if (!userId) {
        socket.emit('bingo:error', { message: 'Authentication required.' });
        return;
      }

      // Validate stake tier
      if (!STAKE_TIERS.includes(stakeAmount)) {
        socket.emit('bingo:error', { message: 'Invalid stake amount.' });
        return;
      }

      if (!cardNumber || cardNumber < 1 || cardNumber > 60) {
        socket.emit('bingo:error', { message: 'Invalid card number.' });
        return;
      }

      const room = getOrCreateRoom(stakeAmount);

      // Prevent duplicate joins
      const alreadyJoined = room.players.some((p) => p.userId === userId);
      if (alreadyJoined) {
        socket.emit('bingo:room_info', {
          gameId: room.gameId,
          roomId: room.roomId,
          stakeAmount: room.stakeAmount,
          playerCount: room.players.length,
          estimatedWin: calcEstimatedWin(room.players.length, room.stakeAmount),
          cardNumber,
        });
        return;
      }

      // Deduct stake from wallet
      try {
        const user = await User.findOne({ telegramId: userId });
        if (!user) {
          socket.emit('bingo:error', { message: 'User not found.' });
          return;
        }

        const wallet = await Wallet.getOrCreate(user._id);
        const betBreakdown = await wallet.deduct(stakeAmount);

        // Store betBreakdown on the player so we can use it when crediting the win
        room.players.push({ userId, socketId: socket.id, cardNumber, card, betBreakdown });

        // Record stake transaction
        await Transaction.create({
          user: user._id,
          type: 'lose',
          amount: stakeAmount,
          status: 'completed',
          metadata: { gameId: room.gameId, gameType: 'bingo', note: 'stake' },
        });

      } catch (err) {
        socket.emit('bingo:error', { message: err.message });
        return;
      }

      socket.join(room.roomId);

      const playerCount = room.players.length;
      const estimatedWin = calcEstimatedWin(playerCount, stakeAmount);

      // Send room info to the joining player
      socket.emit('bingo:room_info', {
        gameId: room.gameId,
        roomId: room.roomId,
        stakeAmount: room.stakeAmount,
        playerCount,
        estimatedWin,
        cardNumber,
      });

      // Broadcast updated player count to everyone in the room
      io.to(room.roomId).emit('bingo:player_joined', {
        playerCount,
        estimatedWin,
      });

      console.log(`👤 Player ${userId} joined ${room.gameId} (card #${cardNumber}, ${playerCount} players)`);

      // If first player — schedule draw start after 1 second
      if (playerCount === 1 && room.status === 'waiting') {
        room.startTimeout = setTimeout(() => {
          startDrawing(io, room);
        }, JOIN_WAIT_MS);
      }
    });

    // ── bingo:claim ─────────────────────────────────────────────────────────
    socket.on('bingo:claim', ({ roomId }) => {
      // Get userId from authenticated socket
      const userId = socket.user?.telegramId;
      
      if (!userId) {
        socket.emit('bingo:error', { message: 'Authentication required.' });
        return;
      }

      const room = rooms[roomId];

      if (!room || room.status !== 'drawing') {
        socket.emit('bingo:error', { message: 'No active game in this room.' });
        return;
      }

      const player = room.players.find((p) => p.userId === userId);
      if (!player) {
        socket.emit('bingo:error', { message: 'You are not in this room.' });
        return;
      }

      const drawnNumbers = room.drawnBalls.map((b) => b.number);
      const result = validateBingo(player.card, drawnNumbers);

      if (!result.valid) {
        socket.emit('bingo:invalid_claim', {
          message: 'No Bingo pattern found. Keep playing!',
        });
        return;
      }

      // Valid Bingo — end the round
      finishRound(io, room, {
        userId,
        pattern: result.pattern,
        betBreakdown: player.betBreakdown,
      });
    });

    // ── disconnect ───────────────────────────────────────────────────────────
    socket.on('disconnect', () => {
      console.log(`🔌 Socket disconnected: ${socket.id}`);

      // Remove player from any room they were in
      for (const roomId of Object.keys(rooms)) {
        const room = rooms[roomId];
        const index = room.players.findIndex((p) => p.socketId === socket.id);

        if (index !== -1) {
          room.players.splice(index, 1);
          console.log(`👤 Player removed from ${roomId} (${room.players.length} remaining)`);

          // If room is now empty and still waiting, clean it up
          if (room.players.length === 0 && room.status === 'waiting') {
            clearRoomTimers(room);
            delete rooms[roomId];
            delete activeGames[room.stakeAmount];
            console.log(`🗑️  Empty room cleaned up: ${roomId}`);
          }

          break;
        }
      }
    });
  });
}

module.exports = { setupBingoSocket };