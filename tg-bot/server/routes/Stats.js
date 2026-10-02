// server/routes/Stats.js
const express = require('express');
const router = express.Router();
const { restAuth } = require('../middleware/auth');
const GameHistory = require('../models/GameHistory');
const UserProgress = require('../models/UserProgress');
const User = require('../models/user');

// Parse YYYY-MM-DD — falls back to today on invalid input.
const parseDate = (value) => {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-').map(Number);
    const parsed = new Date(year, month - 1, day);
    if (
      parsed.getFullYear() === year &&
      parsed.getMonth() === month - 1 &&
      parsed.getDate() === day
    ) {
      return parsed;
    }
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

/**
 * GET /api/stat/daily-leaderboard?date=YYYY-MM-DD
 *
 * Returns players who played on the given date, ranked by their
 * all-time totalPoints from UserProgress (highest first).
 * Prize pool = sum of all betAmounts played that day.
 * Top 3 split: 50% / 30% / 20%.
 */
router.get('/daily-leaderboard', restAuth, async (req, res) => {
  try {
    const date = parseDate(req.query.date);
    const start = new Date(date); start.setHours(0, 0, 0, 0);
    const end   = new Date(date); end.setHours(23, 59, 59, 999);

    // 1. Find all game records for the day.
    const games = await GameHistory.find({
      createdAt: { $gte: start, $lte: end },
    }).lean();

    if (!games.length) {
      return res.json({ leaderboard: [] });
    }

    // 2. Sum prize pool and collect unique user ObjectIds.
    let prizePool = 0;
    const userIdSet = new Set();

    for (const game of games) {
      prizePool += Number(game.betAmount) || 0;
      if (game.user) userIdSet.add(String(game.user));
    }

    const userIds = Array.from(userIdSet);

    if (!userIds.length) {
      return res.json({ leaderboard: [] });
    }

    // 3. Fetch UserProgress for ranking (totalPoints).
    const progressDocs = await UserProgress.find({
      user: { $in: userIds },
    }).lean();

    const progressByUser = new Map();
    for (const doc of progressDocs) {
      progressByUser.set(String(doc.user), doc);
    }

    // 4. Fetch User display info.
    const userDocs = await User.find({
      _id: { $in: userIds },
    }).lean();

    const userById = new Map();
    for (const doc of userDocs) {
      userById.set(String(doc._id), doc);
    }

    // 5. Build, sort and rank.
    const leaderboard = userIds
      .map((uid) => {
        const user     = userById.get(uid);
        const progress = progressByUser.get(uid);
        const points   = Number(progress?.totalPoints) || 0;
        const name     =
          user?.fName?.trim()     ||
          user?.username?.trim()  ||
          user?.phone             ||
          'User';

        return {
          user_id:      uid,
          fname:        name,
          username:     user?.username  ?? null,
          phone:        user?.phone     ?? null,
          total_points: points,
        };
      })
      .sort((a, b) => b.total_points - a.total_points)
      .map((entry, index) => {
        const rank = index + 1;
        let reward = 0;
        if (rank === 1) reward = prizePool * 0.5;
        else if (rank === 2) reward = prizePool * 0.3;
        else if (rank === 3) reward = prizePool * 0.2;

        return {
          ...entry,
          rank,
          reward: Math.round(reward * 100) / 100,
        };
      });

    return res.json({ leaderboard });
  } catch (err) {
    console.error('daily-leaderboard error:', err);
    return res.status(500).json({ message: 'Failed to load leaderboard' });
  }
});

module.exports = router;
