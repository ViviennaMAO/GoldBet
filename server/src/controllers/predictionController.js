// server/src/controllers/predictionController.js
const Prediction = require('../models/Prediction');
const User = require('../models/User');
const GoldPrice = require('../models/GoldPrice');

/**
 * 提交预测
 */
exports.submitPrediction = async (req, res) => {
  try {
    const { direction, volatility, basePrice } = req.body;
    const userId = req.userId;
    const walletAddress = req.walletAddress;

    // 验证参数
    if (!direction || !volatility) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数'
      });
    }

    if (!['up', 'down'].includes(direction)) {
      return res.status(400).json({
        success: false,
        message: '无效的涨跌预测'
      });
    }

    if (!['small', 'medium', 'large'].includes(volatility)) {
      return res.status(400).json({
        success: false,
        message: '无效的波动预测'
      });
    }

    // 检查今日是否已预测
    const today = new Date();
    const existingPrediction = await Prediction.getTodayPrediction(userId, today);

    if (existingPrediction) {
      return res.status(400).json({
        success: false,
        message: '今日已提交预测'
      });
    }

    // 创建预测记录
    const prediction = new Prediction({
      userId,
      walletAddress,
      date: today,
      priceDirection: direction,
      volatility,
      basePrice: basePrice || 0
    });

    await prediction.save();

    res.json({
      success: true,
      data: {
        predictionId: prediction._id,
        message: '预测提交成功'
      }
    });
  } catch (error) {
    console.error('Submit prediction error:', error);
    res.status(500).json({
      success: false,
      message: '提交预测失败'
    });
  }
};

/**
 * 获取我的预测记录
 */
exports.getMyPredictions = async (req, res) => {
  try {
    const userId = req.userId;
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;

    const skip = (page - 1) * pageSize;

    const predictions = await Prediction.find({ userId })
      .sort({ date: -1 })
      .skip(skip)
      .limit(pageSize);

    const total = await Prediction.countDocuments({ userId });

    // 计算统计数据
    const user = await User.findById(userId);

    res.json({
      success: true,
      data: {
        total: user.totalPredictions,
        correct: user.correctPredictions,
        accuracy: user.accuracy,
        predictions: predictions.map(p => ({
          predictionId: p._id,
          date: p.date,
          priceDirection: p.priceDirection,
          volatility: p.volatility,
          basePrice: p.basePrice,
          resultPrice: p.resultPrice,
          resultVolatility: p.resultVolatility,
          directionCorrect: p.directionCorrect,
          volatilityCorrect: p.volatilityCorrect,
          pointsEarned: p.pointsEarned,
          status: p.status,
          createdAt: p.createdAt
        })),
        pagination: {
          page,
          pageSize,
          totalPages: Math.ceil(total / pageSize)
        }
      }
    });
  } catch (error) {
    console.error('Get my predictions error:', error);
    res.status(500).json({
      success: false,
      message: '获取预测记录失败'
    });
  }
};

/**
 * 检查今日是否已预测
 */
exports.checkTodayPrediction = async (req, res) => {
  try {
    const userId = req.userId;
    const today = new Date();

    const prediction = await Prediction.getTodayPrediction(userId, today);

    if (prediction) {
      res.json({
        success: true,
        data: {
          hasPredicted: true,
          prediction: {
            direction: prediction.priceDirection,
            volatility: prediction.volatility,
            createdAt: prediction.createdAt
          }
        }
      });
    } else {
      res.json({
        success: true,
        data: {
          hasPredicted: false
        }
      });
    }
  } catch (error) {
    console.error('Check today prediction error:', error);
    res.status(500).json({
      success: false,
      message: '检查预测状态失败'
    });
  }
};

/**
 * 获取预测详情
 */
exports.getPredictionDetail = async (req, res) => {
  try {
    const predictionId = req.params.id;
    const userId = req.userId;

    const prediction = await Prediction.findOne({
      _id: predictionId,
      userId
    });

    if (!prediction) {
      return res.status(404).json({
        success: false,
        message: '预测记录不存在'
      });
    }

    res.json({
      success: true,
      data: prediction
    });
  } catch (error) {
    console.error('Get prediction detail error:', error);
    res.status(500).json({
      success: false,
      message: '获取预测详情失败'
    });
  }
};
