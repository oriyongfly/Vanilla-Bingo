const mongoose = require('mongoose');

const withdrawalSchema = new mongoose.Schema({
  transaction: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction',
    unique: true,
    sparse: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  destinationAccount: {
    type: String,
    required: true,
    trim: true
  },
  bankName: {
    type: String,
    trim: true
  },
  accountHolderName: {
    type: String,
    required: true,
    trim: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  processed: {
    type: Boolean,
    default: false
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

// Index for processed status
withdrawalSchema.index({ processed: 1, createdAt: -1 });
withdrawalSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Withdrawal', withdrawalSchema);