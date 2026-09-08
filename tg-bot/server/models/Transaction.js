const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  type: {
    type: String,
    required: true,
    enum: ['deposit', 'withdraw', 'win', 'lose', 'bonus']
  },

  amount: {
    type: Number,
    required: true,
    min: 0
  },

  status: {
    type: String,
    default: 'pending',
    enum: ['pending', 'completed', 'failed']
  },

  referenceId: {
    type: String,
    unique: true,
    sparse: true
  },

  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },

  paymentMethod: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PaymentMethod'
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


// ============================================================
// STATIC METHODS
// ============================================================

// Create and save a completed transaction record.
transactionSchema.statics.createRecord = async function(
  userId,
  type,
  amount,
  metadata = {}
) {
  return await this.create({
    user: userId,
    type,
    amount,
    status: 'completed',
    metadata
  });
};


// ============================================================
// INDEXES
// ============================================================

// Indexes for better performance
transactionSchema.index({ user: 1, createdAt: -1 });
transactionSchema.index({ status: 1, type: 1 });
transactionSchema.index({ referenceId: 1 }, { unique: true, sparse: true });


module.exports = mongoose.model('Transaction', transactionSchema);
