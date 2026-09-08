const mongoose = require('mongoose');

const paymentMethodSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['TELEBIRR', 'CBE']
  },
  accountName: {
    type: String,
    required: true,
    trim: true
  },
  accountNumber: {
    type: String,
    required: true,
    trim: true
  },
  minAmount: {
    type: Number,
    default: 10,
    min: 0
  },
  maxAmount: {
    type: Number,
    default: 1000,
    min: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: {
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  }
});

// Index for active payment methods
paymentMethodSchema.index({ isActive: 1, type: 1 });

module.exports = mongoose.model('PaymentMethod', paymentMethodSchema);