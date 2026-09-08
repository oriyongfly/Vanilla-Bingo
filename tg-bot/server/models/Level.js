const mongoose = require('mongoose');

const levelSchema = new mongoose.Schema({
  // Minimum required fields
  level: {
    type: Number,
    required: true,
    unique: true,
    index: true,
    min: 1
  },
  requiredPoints: {
    type: Number,
    required: true,
    min: 0,
    index: true
  },
  
  // Additional useful fields (optional but recommended)
  minimumDeposit: {
    type: Number,
    default: 0,
    min: 0
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  rewards: {
    type: {
      bonusPercentage: { type: Number, default: 0, min: 0 },
      cashbackPercentage: { type: Number, default: 0, min: 0 },
      freeSpins: { type: Number, default: 0, min: 0 }
    },
    default: {}
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

// Index for level queries
levelSchema.index({ requiredPoints: 1 });

module.exports = mongoose.model('Level', levelSchema);