const mongoose = require('mongoose');

const depositSchema = new mongoose.Schema({
  transaction: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction',
    unique: true,
    sparse: true
  },
  paymentMethod: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PaymentMethod'
  },
  bankReference: {
    type: String,
    unique: true,
    sparse: true
  },
  verified: {
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

// Index for verification status
depositSchema.index({ verified: 1, createdAt: -1 });
depositSchema.index({ bankReference: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Deposit', depositSchema);