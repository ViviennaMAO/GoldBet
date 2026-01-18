// server/src/controllers/userController.js
const User = require('../models/User');

/**
 * 获取用户统计数据
 */
exports.getUserStats = async (req, res) => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    // 获取用户排名
    const rank = await User.countDocuments({
      points: { $gt: user.points }
    }) + 1;

    res.json({
      success: true,
      data: {
        totalPredictions: user.totalPredictions,
        correctPredictions: user.correctPredictions,
        accuracy: user.accuracy,
        points: user.points,
        consecutiveWins: user.consecutiveWins,
        rank: rank
      }
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      message: '获取用户统计失败'
    });
  }
};

/**
 * 获取用户资料
 */
exports.getUserProfile = async (req, res) => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    res.json({
      success: true,
      data: {
        userId: user._id,
        walletAddress: user.walletAddress,
        username: user.username,
        totalPredictions: user.totalPredictions,
        correctPredictions: user.correctPredictions,
        accuracy: user.accuracy,
        points: user.points,
        consecutiveWins: user.consecutiveWins,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({
      success: false,
      message: '获取用户资料失败'
    });
  }
};

/**
 * 更新用户资料
 */
exports.updateUserProfile = async (req, res) => {
  try {
    const userId = req.userId;
    const { username } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    if (username) {
      user.username = username.trim();
      await user.save();
    }

    res.json({
      success: true,
      data: {
        userId: user._id,
        username: user.username,
        message: '资料更新成功'
      }
    });
  } catch (error) {
    console.error('Update user profile error:', error);
    res.status(500).json({
      success: false,
      message: '更新用户资料失败'
    });
  }
};
