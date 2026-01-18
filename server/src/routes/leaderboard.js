// server/src/routes/leaderboard.js
const express = require('express');
const router = express.Router();
const leaderboardController = require('../controllers/leaderboardController');

/**
 * GET /api/leaderboard/points
 * 获取积分排行榜
 */
router.get('/points', leaderboardController.getPointsLeaderboard);

/**
 * GET /api/leaderboard/accuracy
 * 获取准确率排行榜
 */
router.get('/accuracy', leaderboardController.getAccuracyLeaderboard);

/**
 * GET /api/leaderboard/streak
 * 获取连胜排行榜
 */
router.get('/streak', leaderboardController.getStreakLeaderboard);

module.exports = router;
