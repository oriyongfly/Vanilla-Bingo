const mongoose = require('mongoose');

const userProgressSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },

  totalPoints: {
    type: Number,
    default: 0,
    min: 0
  },

  level: {
    type: Number,
    default: 1,
    min: 1
  },

  totalDeposit: {
    type: Number,
    default: 0,
    min: 0
  },

  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: {
    createdAt: false,
    updatedAt: 'updatedAt'
  }
});


// Method to add points
userProgressSchema.methods.addPoints = async function(points) {
  this.totalPoints += points;

  // Check if level should be updated
  const Level = mongoose.model('Level');

  const nextLevel = await Level.findOne({
    requiredPoints: { $lte: this.totalPoints },
    level: { $gt: this.level }
  }).sort({ level: 1 });

  if (nextLevel) {
    this.level = nextLevel.level;
  }

  this.updatedAt = new Date();

  return this.save();
};


// Static method to find or create user progress
userProgressSchema.statics.getOrCreate = async function(userId) {
  let progress = await this.findOne({ user: userId });

  if (!progress) {
    progress = await this.create({
      user: userId
    });
  }

  return progress;
};


module.exports = mongoose.model('UserProgress', userProgressSchema);
