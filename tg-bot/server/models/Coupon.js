const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    index: true
  },

  bonusMultiplier: {
    type: Number,
    default: 2.0,
    min: 1
  },

  maxUses: {
    type: Number,
    min: 1
  },

  usedCount: {
    type: Number,
    default: 0,
    min: 0
  },

  isActive: {
    type: Boolean,
    default: true
  },

  expiresAt: {
    type: Date
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


// Check if coupon is valid
couponSchema.methods.isValid = function() {
  if (!this.isActive) return false;
  if (this.expiresAt && this.expiresAt < new Date()) return false;
  if (this.maxUses && this.usedCount >= this.maxUses) return false;
  return true;
};


// Redeem coupon
couponSchema.methods.redeem = async function() {
  this.usedCount += 1;

  await this.save();

  return this;
};


module.exports = mongoose.model('Coupon', couponSchema);
