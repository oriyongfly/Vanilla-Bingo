const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  telegramId: {
    type: Number,
    required: true,
    unique: true,
    index: true,
    description: 'Telegram user ID - primary lookup key'
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: false,
    trim: true,
    default: null
  },
  username: {
    type: String,
    required: false,
    trim: true,
    lowercase: true,
    default: null,
    description: 'Telegram username (optional, not all users have one)'
  },
  phoneNumber: {
    type: String,
    required: true,
    trim: true,
    description: 'Phone number obtained via Telegram contact sharing'
  },
  registeredAt: {
    type: Date,
    default: Date.now,
    immutable: true,
    description: 'Timestamp when user first registered'
  }
}, {
  timestamps: true, // Adds createdAt and updatedAt automatically
  collection: 'users'
});

// Compound index for faster lookups by username (if needed)
userSchema.index({ username: 1 });

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return this.lastName 
    ? `${this.firstName} ${this.lastName}` 
    : this.firstName;
});

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