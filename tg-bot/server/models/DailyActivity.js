const mongoose = require('mongoose');

const dailyActivitySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  activityDate: {
    type: Date,
    required: true,
    default: () => new Date().setHours(0, 0, 0, 0)
  },

  played: {
    type: Boolean,
    default: false
  },

  deposited: {
    type: Boolean,
    default: false
  },

  invited: {
    type: Boolean,
    default: false
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


// Get or create today's activity record for a user
dailyActivitySchema.statics.getOrCreateToday = async function(userId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let activity = await this.findOne({
    user: userId,
    activityDate: today
  });

  if (!activity) {
    activity = await this.create({
      user: userId,
      activityDate: today
    });
  }

  return activity;
};


// Unique compound index for user and date
dailyActivitySchema.index(
  { user: 1, activityDate: 1 },
  { unique: true }
);


// Index for date queries
dailyActivitySchema.index({ activityDate: 1, played: 1 });


module.exports = mongoose.model('DailyActivity', dailyActivitySchema);
