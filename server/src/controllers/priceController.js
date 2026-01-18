// server/src/controllers/priceController.js
const GoldPrice = require('../models/GoldPrice');

/**
 * 获取当前金价
 */
exports.getCurrentPrice = async (req, res) => {
  try {
    const latestPrice = await GoldPrice.getLatestPrice();

    if (!latestPrice) {
      return res.status(404).json({
        success: false,
        message: '暂无价格数据'
      });
    }

    res.json({
      success: true,
      data: {
        currentPrice: latestPrice.currentPrice,
        previousClose: latestPrice.previousClose,
        change: latestPrice.change,
        changePercent: latestPrice.changePercent,
        updateTime: latestPrice.updatedAt
      }
    });
  } catch (error) {
    console.error('Get current price error:', error);
    res.status(500).json({
      success: false,
      message: '获取价格失败'
    });
  }
};

/**
 * 获取今日价格数据
 */
exports.getTodayPrice = async (req, res) => {
  try {
    const todayPrice = await GoldPrice.getTodayPrice();

    if (!todayPrice) {
      return res.status(404).json({
        success: false,
        message: '暂无今日价格数据'
      });
    }

    res.json({
      success: true,
      data: {
        date: todayPrice.date,
        openPrice: todayPrice.openPrice,
        highPrice: todayPrice.highPrice,
        lowPrice: todayPrice.lowPrice,
        closePrice: todayPrice.closePrice,
        currentPrice: todayPrice.currentPrice,
        previousClose: todayPrice.previousClose,
        change: todayPrice.change,
        changePercent: todayPrice.changePercent,
        volatility: todayPrice.volatility
      }
    });
  } catch (error) {
    console.error('Get today price error:', error);
    res.status(500).json({
      success: false,
      message: '获取今日价格失败'
    });
  }
};

/**
 * 获取历史价格数据
 */
exports.getPriceHistory = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;

    if (days < 1 || days > 30) {
      return res.status(400).json({
        success: false,
        message: '天数必须在1-30之间'
      });
    }

    const history = await GoldPrice.getPriceHistory(days);

    res.json({
      success: true,
      data: history.map(item => ({
        date: item.date,
        openPrice: item.openPrice,
        highPrice: item.highPrice,
        lowPrice: item.lowPrice,
        closePrice: item.closePrice,
        volatility: item.volatility
      }))
    });
  } catch (error) {
    console.error('Get price history error:', error);
    res.status(500).json({
      success: false,
      message: '获取历史价格失败'
    });
  }
};
