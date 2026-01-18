// pages/leaderboard/leaderboard.js
const app = getApp();
const { API } = require('../../utils/api.js');
const util = require('../../utils/util.js');

Page({
  data: {
    activeTab: 'points', // points, accuracy, streak
    leaderboard: [],
    myRank: null,
    isRefreshing: false
  },

  onLoad: function () {
    console.log('排行榜页加载');
  },

  onShow: function () {
    this.loadLeaderboard();
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 2
      });
    }
  },

  /**
   * 切换排行榜类型
   */
  switchTab: function (e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({ activeTab: tab });
    this.loadLeaderboard();
  },

  /**
   * 加载排行榜数据
   */
  loadLeaderboard: function () {
    const { activeTab } = this.data;

    let apiCall;
    switch (activeTab) {
      case 'points':
        apiCall = API.getPointsLeaderboard();
        break;
      case 'accuracy':
        apiCall = API.getAccuracyLeaderboard();
        break;
      case 'streak':
        apiCall = API.getStreakLeaderboard();
        break;
      default:
        apiCall = API.getPointsLeaderboard();
    }

    apiCall
      .then(res => {
        const leaderboard = res.data.map(item => {
          return this.formatLeaderboardItem(item);
        });

        this.setData({ leaderboard });
        this.loadMyRank();
      })
      .catch(err => {
        console.error('加载排行榜失败:', err);
        // 使用模拟数据
        this.setData({
          leaderboard: this.getMockLeaderboard()
        });
        this.loadMyRank();
      });
  },

  /**
   * 格式化排行榜项
   */
  formatLeaderboardItem: function (item) {
    const { activeTab } = this.data;
    let value, unit;

    switch (activeTab) {
      case 'points':
        value = item.points;
        unit = '分';
        break;
      case 'accuracy':
        value = item.accuracy;
        unit = '%';
        break;
      case 'streak':
        value = item.consecutiveWins;
        unit = '连胜';
        break;
      default:
        value = item.points;
        unit = '分';
    }

    return {
      userId: item.userId,
      rank: item.rank,
      address: util.formatWalletAddress(item.userId),
      totalPredictions: item.totalPredictions || 0,
      correctPredictions: item.correctPredictions || 0,
      value: value,
      unit: unit
    };
  },

  /**
   * 加载我的排名
   */
  loadMyRank: function () {
    const walletAddress = app.getWalletAddress();
    if (!walletAddress) {
      this.setData({ myRank: null });
      return;
    }

    API.getUserStats()
      .then(res => {
        const stats = res.data;
        const { activeTab } = this.data;

        let value, unit;
        switch (activeTab) {
          case 'points':
            value = stats.points;
            unit = '分';
            break;
          case 'accuracy':
            value = stats.accuracy;
            unit = '%';
            break;
          case 'streak':
            value = stats.consecutiveWins;
            unit = '连胜';
            break;
        }

        this.setData({
          myRank: {
            rank: stats.rank || '-',
            address: util.formatWalletAddress(walletAddress),
            value: value,
            unit: unit
          }
        });
      })
      .catch(err => {
        console.error('加载我的排名失败:', err);
        // 模拟数据
        this.setData({
          myRank: {
            rank: 42,
            address: util.formatWalletAddress(walletAddress),
            value: 150,
            unit: '分'
          }
        });
      });
  },

  /**
   * 获取模拟数据
   */
  getMockLeaderboard: function () {
    const { activeTab } = this.data;

    const mockData = [
      {
        userId: '0xaaa1111',
        rank: 1,
        address: '0xaaa1...1111',
        totalPredictions: 50,
        correctPredictions: 35,
        value: activeTab === 'points' ? 2500 : activeTab === 'accuracy' ? 70 : 15,
        unit: activeTab === 'points' ? '分' : activeTab === 'accuracy' ? '%' : '连胜'
      },
      {
        userId: '0xbbb2222',
        rank: 2,
        address: '0xbbb2...2222',
        totalPredictions: 45,
        correctPredictions: 30,
        value: activeTab === 'points' ? 2100 : activeTab === 'accuracy' ? 67 : 12,
        unit: activeTab === 'points' ? '分' : activeTab === 'accuracy' ? '%' : '连胜'
      },
      {
        userId: '0xccc3333',
        rank: 3,
        address: '0xccc3...3333',
        totalPredictions: 40,
        correctPredictions: 26,
        value: activeTab === 'points' ? 1850 : activeTab === 'accuracy' ? 65 : 10,
        unit: activeTab === 'points' ? '分' : activeTab === 'accuracy' ? '%' : '连胜'
      },
      {
        userId: '0xddd4444',
        rank: 4,
        address: '0xddd4...4444',
        totalPredictions: 35,
        correctPredictions: 22,
        value: activeTab === 'points' ? 1600 : activeTab === 'accuracy' ? 63 : 8,
        unit: activeTab === 'points' ? '分' : activeTab === 'accuracy' ? '%' : '连胜'
      },
      {
        userId: '0xeee5555',
        rank: 5,
        address: '0xeee5...5555',
        totalPredictions: 30,
        correctPredictions: 18,
        value: activeTab === 'points' ? 1400 : activeTab === 'accuracy' ? 60 : 6,
        unit: activeTab === 'points' ? '分' : activeTab === 'accuracy' ? '%' : '连胜'
      }
    ];

    return mockData;
  },

  /**
   * 刷新排行榜
   */
  refreshLeaderboard: function () {
    if (this.data.isRefreshing) return;

    this.setData({ isRefreshing: true });
    this.loadLeaderboard();

    setTimeout(() => {
      this.setData({ isRefreshing: false });
    }, 1000);
  },

  /**
   * 下拉刷新
   */
  onPullDownRefresh: function () {
    this.loadLeaderboard();
    setTimeout(() => {
      wx.stopPullDownRefresh();
    }, 1000);
  }
});
