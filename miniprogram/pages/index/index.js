// pages/index/index.js
const app = getApp();
const { API } = require('../../utils/api.js');
const util = require('../../utils/util.js');

Page({
  data: {
    isLoggedIn: false,
    walletAddress: '',
    priceData: null,
    userStats: null,
    hasPredicted: false,
    isRefreshing: false,
    // 下注相关
    bettingMode: 'direction', // 'direction' or 'volatility'
    activeTab: 'buy', // 'buy' or 'sell' (reserved)
    betAmount: '',
    betDirection: 'up', // 'up' or 'down'
    betVolatility: 'medium', // 'small', 'medium', 'large'
    balance: '0.00',
    isSubmitting: false,
    volatilityRanges: {
      small: '< 0.5%',
      medium: '0.5% - 2%',
      large: '> 2%'
    }
  },

  onLoad: function () {
    console.log('首页加载');
    this.checkLoginStatus();
  },

  onShow: function () {
    // 每次显示页面时刷新数据
    this.loadPageData();
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 0
      });
    }
  },

  /**
   * 检查登录状态
   */
  checkLoginStatus: function () {
    const isLoggedIn = app.globalData.isLoggedIn;
    const walletAddress = app.getWalletAddress();

    this.setData({
      isLoggedIn: isLoggedIn,
      walletAddress: app.formatWalletAddress(walletAddress)
    });
  },

  /**
   * 加载页面数据
   */
  loadPageData: function () {
    this.checkLoginStatus();
    this.loadGoldPrice();

    // 如果已登录，加载用户数据
    if (app.globalData.isLoggedIn) {
      this.loadUserStats();
      this.checkTodayPrediction();
    }
  },

  /**
   * 加载黄金价格数据
   */
  loadGoldPrice: function () {
    API.getCurrentPrice()
      .then(res => {
        const data = res.data;
        const changeInfo = util.formatPriceChange(data.change, data.changePercent);

        this.setData({
          priceData: {
            currentPrice: util.formatPrice(data.currentPrice),
            previousClose: util.formatPrice(data.previousClose),
            change: data.change,
            changePercent: data.changePercent,
            changeText: changeInfo.text,
            updateTime: util.formatTime(data.updateTime, 'HH:mm:ss')
          }
        });
      })
      .catch(err => {
        console.error('加载金价失败:', err);
        // 使用模拟数据
        this.setData({
          priceData: {
            currentPrice: '$2,045.50',
            previousClose: '$2,038.20',
            change: 7.30,
            changePercent: 0.36,
            changeText: '+$7.30 (+0.36%) ↑',
            updateTime: util.formatTime(new Date(), 'HH:mm:ss')
          }
        });
      });
  },

  /**
   * 加载用户统计数据
   */
  loadUserStats: function () {
    // 检查是否已登录
    if (!app.globalData.isLoggedIn) {
      console.log('未登录，跳过加载用户统计');
      return;
    }

    API.getUserStats()
      .then(res => {
        if (res && res.success && res.data) {
          this.setData({
            userStats: res.data
          });
        } else {
          // 使用默认数据
          this.setData({
            userStats: {
              totalPredictions: 0,
              correctPredictions: 0,
              accuracy: 0,
              points: 0,
              rank: null
            }
          });
        }
      })
      .catch(err => {
        console.error('加载用户统计失败:', err);
        // 使用模拟数据
        this.setData({
          userStats: {
            totalPredictions: 0,
            correctPredictions: 0,
            accuracy: 0,
            points: 0,
            rank: null
          }
        });
      });
  },

  /**
   * 检查今日是否已预测
   */
  checkTodayPrediction: function () {
    // 检查是否已登录
    if (!app.globalData.isLoggedIn) {
      console.log('未登录，跳过检查预测状态');
      return;
    }

    API.checkTodayPrediction()
      .then(res => {
        if (res && res.success && res.data) {
          this.setData({
            hasPredicted: res.data.hasPredicted || false
          });
        }
      })
      .catch(err => {
        console.error('检查预测状态失败:', err);
        // 默认为未预测
        this.setData({
          hasPredicted: false
        });
      });
  },

  /**
   * 刷新价格
   */
  refreshPrice: function () {
    if (this.data.isRefreshing) return;

    this.setData({ isRefreshing: true });

    this.loadGoldPrice();

    // 动画结束后重置状态
    setTimeout(() => {
      this.setData({ isRefreshing: false });
    }, 1000);
  },

  /**
   * 切换下注模式
   */
  switchMode: function (e) {
    const mode = e.currentTarget.dataset.mode;
    this.setData({
      bettingMode: mode,
      betAmount: '' // 切换模式时清空金额
    });
  },

  /**
   * 切换标签页
   */
  switchTab: function (e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({ activeTab: tab });
  },

  /**
   * 选择预测方向
   */
  selectDirection: function (e) {
    const direction = e.currentTarget.dataset.direction;
    this.setData({ betDirection: direction });
  },

  /**
   * 选择波动幅度
   */
  selectVolatility: function (e) {
    const volatility = e.currentTarget.dataset.volatility;
    this.setData({ betVolatility: volatility });
  },

  /**
   * 输入金额
   */
  onAmountInput: function (e) {
    this.setData({ betAmount: e.detail.value });
  },

  /**
   * 快捷添加金额
   */
  addAmount: function (e) {
    const value = e.currentTarget.dataset.value;
    const currentAmount = parseFloat(this.data.betAmount || 0);
    this.setData({ betAmount: (currentAmount + value).toString() });
  },

  /**
   * 设置最大金额
   */
  setMaxAmount: function () {
    this.setData({ betAmount: this.data.balance });
  },

  /**
   * 提交下注
   */
  submitBet: function () {
    if (this.data.isSubmitting) return;

    const amount = parseFloat(this.data.betAmount);
    if (!amount || amount <= 0) {
      wx.showToast({
        title: '请输入有效金额',
        icon: 'none'
      });
      return;
    }

    app.requireLogin()
      .then(() => {
        this.setData({ isSubmitting: true });

        // 模拟提交
        setTimeout(() => {
          wx.showToast({
            title: '下注成功',
            icon: 'success'
          });
          this.setData({
            isSubmitting: false,
            betAmount: ''
          });
          this.loadPageData();
        }, 1500);
      })
      .catch(() => { });
  },

  /**
   * 处理登录
   */
  handleLogin: function () {
    wx.showLoading({
      title: '连接钱包中...',
      mask: true
    });

    app.loginWithLuffaWallet()
      .then(() => {
        wx.hideLoading();
        this.loadPageData();
      })
      .catch(err => {
        wx.hideLoading();
        console.error('登录失败:', err);
      });
  },

  /**
   * 处理退出登录
   */
  handleLogout: function () {
    wx.showModal({
      title: '确认退出',
      content: '确定要断开钱包连接吗？',
      success: (res) => {
        if (res.confirm) {
          app.logout();
          this.setData({
            isLoggedIn: false,
            walletAddress: '',
            userStats: null,
            hasPredicted: false
          });
        }
      }
    });
  },

  /**
   * 跳转到预测页
   */
  goToPredict: function () {
    // 检查是否登录
    app.requireLogin()
      .then(() => {
        wx.navigateTo({
          url: '/pages/predict/predict'
        });
      })
      .catch(err => {
        console.log('用户取消登录');
      });
  },

  /**
   * 跳转到历史记录页
   */
  goToHistory: function () {
    app.requireLogin()
      .then(() => {
        wx.navigateTo({
          url: '/pages/history/history'
        });
      })
      .catch(err => {
        console.log('用户取消登录');
      });
  },

  /**
   * 跳转到排行榜页
   */
  goToLeaderboard: function () {
    wx.navigateTo({
      url: '/pages/leaderboard/leaderboard'
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
