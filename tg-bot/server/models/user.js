const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  telegramId: {
    type: Number,
    required: true,
    unique: true,
    index: true
  },
  username: {
    type: String,
    trim: true
  },
  fName: {
    type: String,
    trim: true
  },
  lName: {
    type: String,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  referralId: {
    type: String,
    unique: true,
    sparse: true
  },
  invitedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
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

// Index for better query performance
userSchema.index({ telegramId: 1 });
userSchema.index({ referralId: 1 });

// Compound index for faster lookups by username (if needed)
userSchema.index({ username: 1 });


// Method to get user's display name
userSchema.methods.getDisplayName = function() {
  return this.username 
    ? `@${this.username}` 
    : this.fullName;
};

// Ensure virtuals are included in JSON output
userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

// Export the model
const User = mongoose.model('User', userSchema);

module.exports = User;