// pages/history/history.js
const app = getApp();
const { API } = require('../../utils/api.js');
const util = require('../../utils/util.js');

Page({
  data: {
    stats: null,
    predictions: [],
    loading: false
  },

  onLoad: function () {
    console.log('历史记录页加载');
  },

  onShow: function () {
    this.loadPageData();
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 1
      });
    }
  },

  /**
   * 加载页面数据
   */
  loadPageData: function () {
    this.loadUserStats();
    this.loadPredictions();
  },

  /**
   * 加载用户统计
   */
  loadUserStats: function () {
    API.getUserStats()
      .then(res => {
        this.setData({
          stats: res.data
        });
      })
      .catch(err => {
        console.error('加载统计数据失败:', err);
        // 使用模拟数据
        this.setData({
          stats: {
            totalPredictions: 0,
            correctPredictions: 0,
            accuracy: 0,
            points: 0,
            consecutiveWins: 0
          }
        });
      });
  },

  /**
   * 加载预测记录
   */
  loadPredictions: function () {
    this.setData({ loading: true });

    API.getMyPredictions()
      .then(res => {
        const predictions = res.data.predictions.map(item => {
          return this.formatPrediction(item);
        });

        this.setData({
          predictions: predictions,
          loading: false
        });
      })
      .catch(err => {
        console.error('加载预测记录失败:', err);
        this.setData({ loading: false });

        // 使用模拟数据
        this.setData({
          predictions: this.getMockPredictions()
        });
      });
  },

  /**
   * 格式化预测记录
   */
  formatPrediction: function (item) {
    const directionMap = {
      'up': 'UP',
      'down': 'DOWN'
    };

    const volatilityMap = {
      'small': 'LOW',
      'medium': 'MID',
      'large': 'HIGH'
    };

    return {
      id: item.predictionId,
      date: util.formatDate(item.date),
      direction: item.priceDirection,
      directionText: directionMap[item.priceDirection],
      volatility: item.volatility,
      volatilityText: volatilityMap[item.volatility],
      basePrice: util.formatPrice(item.basePrice),
      resultPrice: item.resultPrice ? util.formatPrice(item.resultPrice) : '-',
      resultVolatility: item.resultVolatility || 0,
      resultVolatilityText: item.resultVolatility
        ? `${item.resultVolatility.toFixed(2)}%`
        : '-',
      directionCorrect: item.directionCorrect,
      volatilityCorrect: item.volatilityCorrect,
      pointsEarned: item.pointsEarned || 0,
      status: item.status
    };
  },

  /**
   * 获取模拟数据
   */
  getMockPredictions: function () {
    return [
      {
        id: 'mock1',
        date: '2026-01-16',
        direction: 'up',
        directionText: '📈 看涨',
        volatility: 'medium',
        volatilityText: '🟡 中度',
        basePrice: '$2,038.20',
        resultPrice: '$2,045.50',
        resultVolatility: 0.83,
        resultVolatilityText: '0.83%',
        directionCorrect: true,
        volatilityCorrect: true,
        pointsEarned: 15,
        status: 'settled'
      },
      {
        id: 'mock2',
        date: '2026-01-15',
        direction: 'down',
        directionText: '📉 看跌',
        volatility: 'small',
        volatilityText: '🟢 小幅',
        basePrice: '$2,042.10',
        resultPrice: '$2,038.20',
        resultVolatility: 0.35,
        resultVolatilityText: '0.35%',
        directionCorrect: true,
        volatilityCorrect: true,
        pointsEarned: 15,
        status: 'settled'
      },
      {
        id: 'mock3',
        date: '2026-01-14',
        direction: 'up',
        directionText: '📈 看涨',
        volatility: 'large',
        volatilityText: '🔴 大幅',
        basePrice: '$2,050.00',
        resultPrice: '$2,042.10',
        resultVolatility: 1.2,
        resultVolatilityText: '1.20%',
        directionCorrect: false,
        volatilityCorrect: false,
        pointsEarned: 0,
        status: 'settled'
      }
    ];
  },

  /**
   * 跳转到预测页
   */
  goToPredict: function () {
    wx.switchTab({
      url: '/pages/index/index'
    });
  },

  /**
   * 下拉刷新
   */
  onPullDownRefresh: function () {
    this.loadPageData();
    setTimeout(() => {
      wx.stopPullDownRefresh();
    }, 1000);
  }
});
