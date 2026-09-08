const mongoose = require('mongoose');

const wageringTransactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  wageringRequirement: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WageringRequirement',
    required: true,
    index: true
  },
  gameType: {
    type: String,
    required: true
  },
  gameRoundId: {
    type: String
  },
  betAmount: {
    type: Number,
    required: true,
    min: 0
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

// Indexes for queries
wageringTransactionSchema.index({ user: 1, createdAt: -1 });
wageringTransactionSchema.index({ wageringRequirement: 1, createdAt: -1 });

module.exports = mongoose.model('WageringTransaction', wageringTransactionSchema);