const mongoose = require('mongoose');

const wageringRequirementSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  type: {
    type: String,
    required: true,
    enum: ['deposit', 'bonus']
  },

  sourceAmount: {
    type: Number,
    required: true,
    min: 0
  },

  wageringMultiplier: {
    type: Number,
    default: 1,
    min: 0
  },

  requiredAmount: {
    type: Number,
    required: true,
    min: 0
  },

  wageredAmount: {
    type: Number,
    default: 0,
    min: 0
  },

  remainingAmount: {
    type: Number,
    default: 0
  },

  status: {
    type: String,
    default: 'active',
    enum: ['active', 'completed', 'cancelled', 'expired']
  },

  reference: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction'
  },

  completedAt: {
    type: Date
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


// ============================================================
// INSTANCE METHODS
// ============================================================

// Add wagering amount to this requirement.
wageringRequirementSchema.methods.addWagering = async function(amount) {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error('Amount must be greater than 0');
  }

  this.wageredAmount += amount;

  await this.save();

  if (this.remainingAmount === 0 && this.status === 'active') {
    this.status = 'completed';
    this.completedAt = new Date();

    await this.save();
  }

  return this;
};


// ============================================================
// STATIC METHODS
// ============================================================

// Get all active wagering requirements for a user.
wageringRequirementSchema.statics.getActive = async function(userId) {
  return await this.find({
    user: userId,
    status: 'active'
  });
};


// ============================================================
// PRE-SAVE MIDDLEWARE
// ============================================================

// Calculate remaining amount before saving.
wageringRequirementSchema.pre('save', function(next) {
  this.remainingAmount = Math.max(
    0,
    (this.requiredAmount || 0) - (this.wageredAmount || 0)
  );

  if (this.remainingAmount === 0 && this.status === 'active') {
    this.status = 'completed';
    this.completedAt = new Date();
  }

  next();
});


// ============================================================
// INDEXES
// ============================================================

wageringRequirementSchema.index({ user: 1, status: 1 });
wageringRequirementSchema.index({ expiresAt: 1, status: 1 });


module.exports = mongoose.model(
  'WageringRequirement',
  wageringRequirementSchema
);
