// server/src/controllers/leaderboardController.js
const User = require('../models/User');

/**
 * 获取积分排行榜
 */
exports.getPointsLeaderboard = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;

    const leaderboard = await User.getLeaderboard('points', limit);

    const data = leaderboard.map((user, index) => ({
      rank: index + 1,
      userId: user.walletAddress,
      points: user.points,
      totalPredictions: user.totalPredictions,
      correctPredictions: user.correctPredictions
    }));

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Get points leaderboard error:', error);
    res.status(500).json({
      success: false,
      message: '获取排行榜失败'
    });
  }
};

/**
 * 获取准确率排行榜
 */
exports.getAccuracyLeaderboard = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;

    // 只统计预测次数≥5的用户
    const leaderboard = await User.find({
      totalPredictions: { $gte: 5 }
    })
      .sort({ accuracy: -1 })
      .limit(limit)
      .select('-__v');

    const data = leaderboard.map((user, index) => ({
      rank: index + 1,
      userId: user.walletAddress,
      accuracy: user.accuracy,
      totalPredictions: user.totalPredictions,
      correctPredictions: user.correctPredictions
    }));

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Get accuracy leaderboard error:', error);
    res.status(500).json({
      success: false,
      message: '获取排行榜失败'
    });
  }
};

/**
 * 获取连胜排行榜
 */
exports.getStreakLeaderboard = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;

    const leaderboard = await User.getLeaderboard('consecutiveWins', limit);

    const data = leaderboard.map((user, index) => ({
      rank: index + 1,
      userId: user.walletAddress,
      consecutiveWins: user.consecutiveWins,
      totalPredictions: user.totalPredictions,
      points: user.points
    }));

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Get streak leaderboard error:', error);
    res.status(500).json({
      success: false,
      message: '获取排行榜失败'
    });
  }
};
