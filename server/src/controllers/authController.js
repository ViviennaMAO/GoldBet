// server/src/controllers/authController.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Luffa钱包登录
 * TODO: 集成实际的Luffa钱包验证逻辑
 */
exports.walletLogin = async (req, res) => {
  try {
    const { code, walletType } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: '缺少登录凭证'
      });
    }

    // TODO: 调用Luffa API验证code，获取钱包地址
    // 目前使用模拟逻辑
    const walletAddress = await verifyLuffaCode(code);

    if (!walletAddress) {
      return res.status(401).json({
        success: false,
        message: '钱包验证失败'
      });
    }

    // 查找或创建用户
    let user = await User.findByWallet(walletAddress);

    if (!user) {
      user = new User({
        walletAddress: walletAddress.toLowerCase()
      });
      await user.save();
    }

    // 生成JWT token
    const token = jwt.sign(
      { userId: user._id, walletAddress: user.walletAddress },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      data: {
        token,
        userId: user._id,
        walletAddress: user.walletAddress,
        totalPredictions: user.totalPredictions,
        points: user.points
      }
    });
  } catch (error) {
    console.error('Wallet login error:', error);
    res.status(500).json({
      success: false,
      message: '登录失败'
    });
  }
};

/**
 * 验证Token
 */
exports.verifyToken = async (req, res) => {
  try {
    const user = req.user;

    res.json({
      success: true,
      data: {
        userId: user._id,
        walletAddress: user.walletAddress,
        totalPredictions: user.totalPredictions,
        correctPredictions: user.correctPredictions,
        accuracy: user.accuracy,
        points: user.points
      }
    });
  } catch (error) {
    console.error('Verify token error:', error);
    res.status(500).json({
      success: false,
      message: '验证失败'
    });
  }
};

/**
 * 退出登录
 */
exports.logout = async (req, res) => {
  try {
    // JWT是无状态的，客户端删除token即可
    res.json({
      success: true,
      message: '已退出登录'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: '退出失败'
    });
  }
};

/**
 * 验证Luffa登录凭证（模拟实现）
 * TODO: 替换为实际的Luffa API调用
 */
async function verifyLuffaCode(code) {
  // 模拟异步验证过程
  return new Promise((resolve) => {
    setTimeout(() => {
      // 这里应该调用Luffa API验证code
      // 目前返回一个模拟的钱包地址
      const mockWalletAddress = `0x${code.substring(0, 40).padEnd(40, '0')}`;
      resolve(mockWalletAddress);
    }, 100);
  });
}
