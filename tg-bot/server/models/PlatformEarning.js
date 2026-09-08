const mongoose = require('mongoose');

const platformEarningSchema = new mongoose.Schema({
  amount: {
    type: Number,
    min: 0
  },
  source: {
    type: String,
    trim: true
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

// Index for date range queries
platformEarningSchema.index({ createdAt: -1 });

module.exports = mongoose.model('PlatformEarning', platformEarningSchema);