const mongoose = require('mongoose');

const gameHistorySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  game: {
    type: String,
    default: 'slots'
  },

  betAmount: {
    type: Number,
    required: true,
    min: 0
  },

  gridState: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },

  spinResult: {
    type: mongoose.Schema.Types.Mixed,
    default: []
  },

  totalPayout: {
    type: Number,
    default: 0,
    min: 0
  },

  balanceBefore: {
    type: Number
  },

  balanceAfter: {
    type: Number
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: {
    createdAt: 'createdAt',
    updatedAt: false
  }
});

// Static method for recording a completed game
gameHistorySchema.statics.record = async function (
  userId,
  gameType,
  betAmount,
  result
) {
  const history = new this({
    user: userId,
    game: gameType,
    betAmount,
    balanceBefore: result.balanceBefore,
    balanceAfter: result.balanceAfter,
    totalPayout: result.totalPayout ?? 0,
    gridState: result.gridState,
    spinResult: result.spinResult ?? []
  });

  return history.save();
};

// Indexes for queries
gameHistorySchema.index({ user: 1, createdAt: -1 });
gameHistorySchema.index({ game: 1, createdAt: -1 });

module.exports = mongoose.model('GameHistory', gameHistorySchema);
