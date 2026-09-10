// server/socket/bingo.js
const crypto = require('crypto');

// Stake tiers configuration
const STAKE_TIERS = [100, 500, 1000, 5000];

// Phase timing constants
const PICKING_DURATION = 50; // seconds
const DRAW_INTERVAL = 2000; // ms between balls
const CYCLE_COOLDOWN = 5000; // ms after drawing ends before new cycle

// Per-tier runtime state
const tiers = new Map();

// Stake tier key helper
function tierKey(stakeAmount) {
  return `stake_${stakeAmount}`;
}

// Broadcast channel helper
function broadcastChannel(stakeAmount) {
  return `bingo:stake:${stakeAmount}`;
}

// Room id helper
function roomId(stakeAmount, gameId) {
  return `bingo:${stakeAmount}:${gameId}`;
}

// Generate a new gameId
function generateGameId() {
  return crypto.randomBytes(8).toString('hex');
}

// Estimate win based on player count and stake
function estimateWin(stakeAmount, playerCount) {
  // Simple estimate: 90% of total pot returned to winner
  const pot = stakeAmount * playerCount;
  return Math.floor(pot * 0.9);
}

// Run a single cycle for a stake tier
async function runCycle(io, stakeAmount, roomManager) {
  const key = tierKey(stakeAmount);
  const tier = tiers.get(key);
  if (!tier) return;

  // ---- PICKING PHASE ----
  const gameId = generateGameId();
  const currentRoomId = roomId(stakeAmount, gameId);

  tier.phase = 'picking';
  tier.gameId = gameId;
  tier.roomId = currentRoomId;
  tier.timeLeft = PICKING_DURATION;
  tier.players = [];
  tier.spectators = [];

  // Create room in manager
  roomManager.createRoom(currentRoomId, { stakeAmount, gameId });

  io.to(broadcastChannel(stakeAmount)).emit('bingo:phase_changed', {
    phase: 'picking',
    gameId,
    roomId: currentRoomId,
    timeLeft: PICKING_DURATION,
    stakeAmount,
  });

  // Countdown loop (1s ticks)
  await new Promise((resolve) => {
    tier.interval = setInterval(() => {
      tier.timeLeft -= 1;

      io.to(broadcastChannel(stakeAmount)).emit('bingo:tick', {
        gameId,
        timeLeft: tier.timeLeft,
        stakeAmount,
      });

      if (tier.timeLeft <= 0) {
        clearInterval(tier.interval);
        tier.interval = null;
        resolve();
      }
    }, 1000);
  });

  // ---- CHECK FOR PLAYERS ----
  const room = roomManager.getRoom(currentRoomId);
  const playerCount = room ? room.players.length : 0;
  tier.playerCount = playerCount;

  if (playerCount === 0) {
    // Skip drawing, immediately start new cycle
    roomManager.removeRoom(currentRoomId);
    io.to(broadcastChannel(stakeAmount)).emit('bingo:phase_changed', {
      phase: 'idle',
      gameId,
      roomId: currentRoomId,
      timeLeft: 0,
      stakeAmount,
      message: 'No players joined',
    });
    return; // caller will loop
  }

  // ---- DRAWING PHASE ----
  tier.phase = 'drawing';
  io.to(broadcastChannel(stakeAmount)).emit('bingo:phase_changed', {
    phase: 'drawing',
    gameId,
    roomId: currentRoomId,
    stakeAmount,
    playerCount,
    estimatedWin: estimateWin(stakeAmount, playerCount),
  });

  // Draw one ball every 2 seconds until winner or all balls drawn
  const totalBalls = 90;
  let drawnCount = 0;
  let winnerFound = false;

  await new Promise((resolve) => {
    tier.drawInterval = setInterval(() => {
      drawnCount += 1;
      const ball = drawnCount; // simplified sequential draw

      io.to(currentRoomId).emit('bingo:ball_drawn', {
        gameId,
        ball,
        drawnCount,
        stakeAmount,
      });

      // Check for winner via roomManager
      const currentRoom = roomManager.getRoom(currentRoomId);
      if (currentRoom && currentRoom.winner) {
        winnerFound = true;
        clearInterval(tier.drawInterval);
        tier.drawInterval = null;
        io.to(currentRoomId).emit('bingo:winner', {
          gameId,
          winner: currentRoom.winner,
          stakeAmount,
        });
        resolve();
        return;
      }

      if (drawnCount >= totalBalls) {
        clearInterval(tier.drawInterval);
        tier.drawInterval = null;
        io.to(currentRoomId).emit('bingo:no_winner', { gameId, stakeAmount });
        resolve();
      }
    }, DRAW_INTERVAL);
  });

  // ---- COOLDOWN ----
  tier.phase = 'cooldown';
  io.to(broadcastChannel(stakeAmount)).emit('bingo:phase_changed', {
    phase: 'cooldown',
    gameId,
    roomId: currentRoomId,
    stakeAmount,
    winnerFound,
    cooldownMs: CYCLE_COOLDOWN,
  });

  await new Promise((resolve) => setTimeout(resolve, CYCLE_COOLDOWN));

  // Clean up room
  roomManager.removeRoom(currentRoomId);
}

// Continuous loop per tier
async function loopTier(io, stakeAmount, roomManager) {
  while (true) {
    try {
      await runCycle(io, stakeAmount, roomManager);
    } catch (err) {
      console.error(`❌ Error in bingo cycle for stake ${stakeAmount}:`, err);
      // brief pause before retrying to avoid tight error loop
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
}

// Initialize a tier's runtime state
function initTier(stakeAmount) {
  const key = tierKey(stakeAmount);
  if (!tiers.has(key)) {
    tiers.set(key, {
      stakeAmount,
      phase: 'idle',
      gameId: null,
      roomId: null,
      timeLeft: 0,
      playerCount: 0,
      players: [],
      spectators: [],
      interval: null,
      drawInterval: null,
    });
  }
}

// Minimal room manager (placeholder — assumes existing room logic)
// NOTE: Replace this with your actual room manager import/usage.
function createRoomManager() {
  const rooms = new Map();

  return {
    createRoom(id, meta) {
      rooms.set(id, {
        id,
        meta,
        players: [],
        spectators: [],
        winner: null,
        ...meta,
      });
    },
    getRoom(id) {
      return rooms.get(id) || null;
    },
    removeRoom(id) {
      rooms.delete(id);
    },
    addPlayer(id, player) {
      const room = rooms.get(id);
      if (room) room.players.push(player);
    },
    addSpectator(id, spectator) {
      const room = rooms.get(id);
      if (room) room.spectators.push(spectator);
    },
  };
}

function setupBingoSocket(io) {
  const roomManager = createRoomManager();

  // ---- Start continuous cycles for each stake tier ----
  for (const stakeAmount of STAKE_TIERS) {
    initTier(stakeAmount);
    // fire-and-forget continuous loop
    loopTier(io, stakeAmount, roomManager).catch((err) => {
      console.error(`❌ Fatal error in tier loop for ${stakeAmount}:`, err);
    });
  }

  console.log('✅ Bingo cycles started for tiers:', STAKE_TIERS.join(', '));

  io.on('connection', (socket) => {
    const user = socket.user;

    // ---- bingo:get_status ----
    socket.on('bingo:get_status', ({ stakeAmount } = {}, callback) => {
      const tier = tiers.get(tierKey(stakeAmount));
      if (!tier) {
        const response = { error: 'Invalid stake tier' };
        if (typeof callback === 'function') callback(response);
        return;
      }

      const response = {
        phase: tier.phase,
        gameId: tier.gameId,
        roomId: tier.roomId,
        timeLeft: tier.timeLeft,
        stakeAmount,
        playerCount: tier.playerCount,
        estimatedWin: estimateWin(stakeAmount, tier.playerCount || 0),
      };

      if (typeof callback === 'function') callback(response);
      else socket.emit('bingo:status', response);
    });

    // ---- bingo:join (as player) ----
    socket.on('bingo:join', ({ stakeAmount } = {}) => {
      const tier = tiers.get(tierKey(stakeAmount));
      if (!tier || tier.phase !== 'picking' || !tier.roomId) {
        socket.emit('bingo:join_error', { message: 'No active picking phase' });
        return;
      }

      // Subscribe to broadcast channel for future cycles
      socket.join(broadcastChannel(stakeAmount));
      // Join the current room
      socket.join(tier.roomId);

      roomManager.addPlayer(tier.roomId, {
        socketId: socket.id,
        userId: user?.id,
        telegramId: user?.telegramId,
      });

      // Update player count
      const room = roomManager.getRoom(tier.roomId);
      tier.playerCount = room ? room.players.length : 0;

      socket.emit('bingo:joined', {
        gameId: tier.gameId,
        roomId: tier.roomId,
        stakeAmount,
        playerCount: tier.playerCount,
      });

      io.to(tier.roomId).emit('bingo:player_joined', {
        gameId: tier.gameId,
        playerCount: tier.playerCount,
      });
    });

    // ---- bingo:spectate ----
    socket.on('bingo:spectate', ({ stakeAmount } = {}) => {
      const tier = tiers.get(tierKey(stakeAmount));
      if (!tier || !tier.roomId) {
        socket.emit('bingo:spectate_error', { message: 'No active game' });
        return;
      }

      // Spectators join the room but are tracked separately
      socket.join(broadcastChannel(stakeAmount));
      socket.join(tier.roomId);

      roomManager.addSpectator(tier.roomId, {
        socketId: socket.id,
        userId: user?.id,
      });
      tier.spectators.push(socket.id);

      socket.emit('bingo:spectating', {
        gameId: tier.gameId,
        roomId: tier.roomId,
        stakeAmount,
        phase: tier.phase,
      });
    });

    // ---- bingo:claim (only real players) ----
    socket.on('bingo:claim', ({ stakeAmount, gameId } = {}) => {
      const tier = tiers.get(tierKey(stakeAmount));
      if (!tier || tier.gameId !== gameId) return;

      const room = roomManager.getRoom(tier.roomId);
      if (!room) return;

      // Reject spectators
      const isPlayer = room.players.some((p) => p.socketId === socket.id);
      if (!isPlayer) {
        socket.emit('bingo:claim_error', {
          message: 'Spectators cannot claim',
        });
        return;
      }

      // Delegate to room claim logic (placeholder)
      // room.claim(socket.id, ...)
    });

    // ---- disconnect cleanup ----
    socket.on('disconnect', () => {
      for (const tier of tiers.values()) {
        if (!tier.roomId) continue;
        const room = roomManager.getRoom(tier.roomId);
        if (!room) continue;

        room.players = room.players.filter((p) => p.socketId !== socket.id);
        room.spectators = room.spectators.filter(
          (s) => s.socketId !== socket.id
        );
        tier.spectators = tier.spectators.filter((id) => id !== socket.id);
        tier.playerCount = room.players.length;
      }
    });
  });
}

module.exports = { setupBingoSocket };