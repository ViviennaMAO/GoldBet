// app.js
const { API } = require('./utils/api.js');

App({
  globalData: {
    userInfo: null,
    walletAddress: null,
    isLoggedIn: false
  },

  onLaunch: function() {
    console.log('GoldBet 小程序启动');

    // 检查本地存储的登录状态
    this.checkLoginStatus();

    // 尝试自动登录
    this.autoLogin();
  },

  /**
   * 检查登录状态
   */
  checkLoginStatus: function() {
    const token = wx.getStorageSync('userToken');
    const walletAddress = wx.getStorageSync('walletAddress');

    if (token && walletAddress) {
      this.globalData.isLoggedIn = true;
      this.globalData.walletAddress = walletAddress;
      console.log('已登录，钱包地址:', walletAddress);
    }
  },

  /**
   * 自动登录（如果有缓存的 Supabase session）
   */
  autoLogin: async function() {
    const walletAddress = wx.getStorageSync('walletAddress');

    if (walletAddress) {
      // 验证 Supabase session 是否有效
      const result = await API.verifyToken();

      if (result.success) {
        console.log('Session验证成功，自动登录');
        this.globalData.isLoggedIn = true;
        this.globalData.walletAddress = walletAddress;
        this.globalData.userInfo = result.data;
      } else {
        // Session失效，清除本地数据
        this.logout();
      }
    }
  },

  /**
   * Luffa钱包登录（预留接口）
   * TODO: 替换为实际的Luffa钱包登录API
   */
  loginWithLuffaWallet: function() {
    return new Promise((resolve, reject) => {
      // 方案1: Luffa官方API（待Luffa提供文档后替换）
      // wx.luffa.login({
      //   success: (res) => {
      //     this.handleWalletLogin(res.code, resolve, reject);
      //   },
      //   fail: reject
      // });

      // 方案2: 通用Web3钱包方案（临时使用）
      this.loginWithWeb3Wallet(resolve, reject);
    });
  },

  /**
   * 通用Web3钱包登录（临时方案）
   */
  loginWithWeb3Wallet: async function(resolve, reject) {
    // 模拟Web3钱包连接流程
    wx.showLoading({
      title: '连接钱包中...',
      mask: true
    });

    // 这里使用微信登录作为临时方案
    // 实际项目中应该调用Web3钱包SDK
    wx.login({
      success: async (res) => {
        if (res.code) {
          // 使用微信 code 生成模拟钱包地址（临时方案）
          // 实际应该调用 Web3 钱包 SDK 获取真实地址
          const mockWalletAddress = `0x${res.code.substring(0, 40).padEnd(40, '0')}`;

          await this.handleWalletLogin(mockWalletAddress, resolve, reject);
        } else {
          wx.hideLoading();
          reject(new Error('获取登录凭证失败'));
        }
      },
      fail: (err) => {
        wx.hideLoading();
        reject(err);
      }
    });
  },

  /**
   * 处理钱包登录（使用 Supabase）
   */
  handleWalletLogin: async function(walletAddress, resolve, reject) {
    try {
      // 调用 Supabase 钱包登录
      const result = await API.walletLogin(walletAddress);

      wx.hideLoading();

      if (result.success) {
        const { token, walletAddress: address, userId } = result.data;

        // 保存登录信息
        wx.setStorageSync('userToken', token);
        wx.setStorageSync('walletAddress', address);
        wx.setStorageSync('userId', userId);

        // 更新全局状态
        this.globalData.isLoggedIn = true;
        this.globalData.walletAddress = address;
        this.globalData.userInfo = result.data;

        wx.showToast({
          title: '登录成功',
          icon: 'success',
          duration: 2000
        });

        resolve(result.data);
      } else {
        wx.showToast({
          title: result.message || '登录失败',
          icon: 'error',
          duration: 2000
        });
        reject(new Error(result.message));
      }
    } catch (err) {
      wx.hideLoading();
      wx.showToast({
        title: '网络错误',
        icon: 'error',
        duration: 2000
      });
      reject(err);
    }
  },

  /**
   * 退出登录
   */
  logout: function() {
    // 清除本地存储
    wx.removeStorageSync('userToken');
    wx.removeStorageSync('walletAddress');
    wx.removeStorageSync('userId');

    // 重置全局状态
    this.globalData.isLoggedIn = false;
    this.globalData.walletAddress = null;
    this.globalData.userInfo = null;

    wx.showToast({
      title: '已退出登录',
      icon: 'success',
      duration: 1500
    });

    // 跳转到首页
    wx.reLaunch({
      url: '/pages/index/index'
    });
  },

  /**
   * 检查是否登录，未登录则引导登录
   */
  requireLogin: function() {
    return new Promise((resolve, reject) => {
      if (this.globalData.isLoggedIn) {
        resolve(true);
      } else {
        wx.showModal({
          title: '需要登录',
          content: '请先连接钱包以使用完整功能',
          confirmText: '去登录',
          cancelText: '取消',
          success: (res) => {
            if (res.confirm) {
              this.loginWithLuffaWallet()
                .then(() => resolve(true))
                .catch(reject);
            } else {
              reject(new Error('用户取消登录'));
            }
          }
        });
      }
    });
  },

  /**
   * 获取用户Token
   */
  getUserToken: function() {
    return wx.getStorageSync('userToken');
  },

  /**
   * 获取钱包地址
   */
  getWalletAddress: function() {
    return this.globalData.walletAddress || wx.getStorageSync('walletAddress');
  },

  /**
   * 格式化钱包地址（简短显示）
   */
  formatWalletAddress: function(address) {
    if (!address) return '';
    if (address.length <= 10) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }
});
