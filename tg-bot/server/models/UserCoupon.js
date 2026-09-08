const mongoose = require('mongoose');

const userCouponSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  coupon: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Coupon',
    required: true,
    index: true
  },
  usedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: {
    createdAt: 'usedAt',
    updatedAt: false
  }
});

// Ensure user can only use same coupon once
userCouponSchema.index({ user: 1, coupon: 1 }, { unique: true });

module.exports = mongoose.model('UserCoupon', userCouponSchema);