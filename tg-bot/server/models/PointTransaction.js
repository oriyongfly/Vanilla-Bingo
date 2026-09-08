const mongoose = require('mongoose');

const pointTransactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  points: {
    type: Number,
    required: true,
    min: 1
  },
  type: {
    type: String,
    required: true,
    enum: ['gameplay', 'deposit', 'bonus', 'referral', 'admin']
  },
  gameType: {
    type: String
  },
  gameRoundId: {
    type: String
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

// Indexes for better performance
pointTransactionSchema.index({ user: 1, createdAt: -1 });
pointTransactionSchema.index({ type: 1, createdAt: -1 });

module.exports = mongoose.model('PointTransaction', pointTransactionSchema);