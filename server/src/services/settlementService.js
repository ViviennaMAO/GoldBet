// server/src/services/settlementService.js
const Prediction = require('../models/Prediction');
const User = require('../models/User');
const GoldPrice = require('../models/GoldPrice');
const priceService = require('./priceService');

/**
 * 检查并结算预测
 */
exports.checkAndSettle = async () => {
  try {
    console.log('Checking for settlements...');

    // 检查是否到收盘时间
    if (!isMarketClosed()) {
      console.log('Market is still open, skipping settlement');
      return;
    }

    // 获取昨天的日期
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    // 设置昨日收盘价
    const yesterdayPrice = await GoldPrice.findOne({ date: yesterday });
    if (yesterdayPrice && !yesterdayPrice.closePrice) {
      await priceService.setClosePrice(yesterdayPrice.currentPrice);
    }

    // 获取昨日待结算的预测
    const pendingPredictions = await Prediction.getPendingPredictions(yesterday);

    if (pendingPredictions.length === 0) {
      console.log('No predictions to settle');
      return;
    }

    console.log(`Found ${pendingPredictions.length} predictions to settle`);

    // 获取今日价格数据
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayPrice = await GoldPrice.findOne({ date: today });

    if (!todayPrice) {
      console.log('Today price data not available yet');
      return;
    }

    // 结算每个预测
    for (const prediction of pendingPredictions) {
      await settlePrediction(prediction, todayPrice);
    }

    console.log('Settlement completed');
  } catch (error) {
    console.error('Settlement check error:', error);
    throw error;
  }
};

/**
 * 结算单个预测
 */
async function settlePrediction(prediction, todayPrice) {
  try {
    const actualPrice = todayPrice.closePrice || todayPrice.currentPrice;
    const actualVolatility = todayPrice.volatility;

    // 调用预测模型的结算方法
    await prediction.settle(actualPrice, actualVolatility);

    // 更新用户统计
    const user = await User.findById(prediction.userId);
    if (user) {
      const isCorrect = prediction.directionCorrect && prediction.volatilityCorrect;
      await user.incrementPredictions(isCorrect);

      if (prediction.pointsEarned > 0) {
        await user.addPoints(prediction.pointsEarned);
      }

      // 更新最后预测日期
      user.lastPredictionDate = prediction.date;
      await user.save();

      console.log(`Settled prediction for user ${user.walletAddress}: ${isCorrect ? 'correct' : 'incorrect'}, earned ${prediction.pointsEarned} points`);
    }
  } catch (error) {
    console.error('Settle prediction error:', error);
    throw error;
  }
}

/**
 * 检查市场是否收盘
 */
function isMarketClosed() {
  const now = new Date();
  const closeHour = parseInt(process.env.MARKET_CLOSE_HOUR) || 20; // UTC时间
  const closeMinute = parseInt(process.env.MARKET_CLOSE_MINUTE) || 0;

  // 简化版：只检查是否过了收盘时间
  const currentHour = now.getUTCHours();
  const currentMinute = now.getUTCMinutes();

  if (currentHour > closeHour) {
    return true;
  } else if (currentHour === closeHour && currentMinute >= closeMinute) {
    return true;
  }

  return false;
}
