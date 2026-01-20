// app.js
const { API } = require('./utils/api.js');

App({
  globalData: {
    userInfo: null,
    walletAddress: null,
    isLoggedIn: false
  },

  onLaunch: function () {
    console.log('GoldBet 小程序启动');

    // 检查本地存储的登录状态
    this.checkLoginStatus();

    // 尝试自动登录
    this.autoLogin();
  },

  /**
   * 检查登录状态
   */
  checkLoginStatus: function () {
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
  autoLogin: async function () {
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
   * Luffa钱包登录
   * 使用 Luffa 提供的 invokeNativePlugin 接口
   */
  loginWithLuffaWallet: function () {
    return new Promise((resolve, reject) => {
      // 检查是否支持 invokeNativePlugin
      if (!wx.invokeNativePlugin) {
        console.error('当前环境不支持 wx.invokeNativePlugin');
        wx.showToast({
          title: '请在 Luffa App 中打开',
          icon: 'none'
        });
        reject(new Error('不支持的环境'));
        return;
      }

      const uuid = this.create16String();
      console.log('开始 Luffa 钱包连接，UUID:', uuid);

      const opts = {
        api_name: 'luffaWebRequest',
        data: {
          uuid: uuid,
          methodName: "connect",
          initData: {
            network: "endless", // Luffa 主网链名
          },
          metadata: {
            superBox: true,
            url: "https://goldbet.app",
          },
          from: "",
          data: {},
        },
        success: (res) => {
          console.log('Luffa 钱包连接成功，返回数据:', JSON.stringify(res));

          try {
            // 检查返回数据结构
            if (!res || !res.data) {
              console.error('返回数据格式错误:', res);
              throw new Error('返回数据格式错误');
            }

            const { address, nickname, avatar, uid, cid } = res.data;

            // 验证必需的钱包地址
            if (!address) {
              console.error('未获取到钱包地址，返回数据:', res.data);
              throw new Error('未获取到钱包地址');
            }

            console.log('成功获取钱包信息:', {
              address: address,
              nickname: nickname,
              uid: uid
            });

            // 调用处理函数，传入完整的用户信息
            this.handleWalletLogin(address, resolve, reject, {
              nickname: nickname,
              avatar: avatar,
              uid: uid,
              cid: cid
            });

          } catch (error) {
            console.error('处理 Luffa 返回数据失败:', error);
            wx.hideLoading();
            wx.showToast({
              title: error.message || '连接失败',
              icon: 'none'
            });
            reject(error);
          }
        },
        fail: (err) => {
          console.error('Luffa 钱包连接失败:', err);
          wx.hideLoading();
          wx.showToast({
            title: '连接钱包失败',
            icon: 'none'
          });
          reject(err);
        }
      };

      // 调用原生插件
      wx.invokeNativePlugin(opts);
    });
  },

  /**
   * 生成16位随机字符串 (Luffa API 要求)
   */
  create16String: function () {
    const len = 16;
    const strVals = 'ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz2345678';
    const maxLen = strVals.length;
    let randomStr = '';
    for (let i = 0; i < len; i++) {
      randomStr += strVals.charAt(Math.floor(Math.random() * maxLen));
    }
    return randomStr;
  },

  /**
   * 通用Web3钱包登录（临时方案）
   */
  loginWithWeb3Wallet: async function (resolve, reject) {
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
  handleWalletLogin: async function (walletAddress, resolve, reject, luffaUserInfo) {
    try {
      console.log('开始处理钱包登录，地址:', walletAddress);

      // 调用 Supabase 钱包登录
      const result = await API.walletLogin(walletAddress);

      wx.hideLoading();

      if (result.success) {
        const { token, walletAddress: address, userId } = result.data;

        console.log('Supabase 登录成功，用户ID:', userId);

        // 保存登录信息（增加错误处理）
        try {
          wx.setStorageSync('userToken', token);
          wx.setStorageSync('walletAddress', address);
          wx.setStorageSync('userId', userId);
          wx.setStorageSync('supabaseToken', token); // 保存 Supabase token

          // 如果有 Luffa 用户信息，也保存
          if (luffaUserInfo) {
            wx.setStorageSync('luffaUserInfo', JSON.stringify(luffaUserInfo));
            console.log('保存 Luffa 用户信息:', luffaUserInfo);
          }

          console.log('本地存储保存成功');
        } catch (storageError) {
          console.error('保存到本地存储失败:', storageError);
          // 即使存储失败，也继续登录流程
        }

        // 更新全局状态
        this.globalData.isLoggedIn = true;
        this.globalData.walletAddress = address;
        this.globalData.userInfo = {
          ...result.data,
          luffa: luffaUserInfo // 添加 Luffa 用户信息
        };

        console.log('全局状态更新完成');

        wx.showToast({
          title: '登录成功',
          icon: 'success',
          duration: 2000
        });

        resolve({
          ...result.data,
          luffa: luffaUserInfo
        });
      } else {
        console.error('Supabase 登录失败:', result.message);
        wx.showToast({
          title: result.message || '登录失败',
          icon: 'none',
          duration: 2000
        });
        reject(new Error(result.message));
      }
    } catch (err) {
      console.error('钱包登录异常:', err);
      wx.hideLoading();
      wx.showToast({
        title: '网络错误',
        icon: 'none',
        duration: 2000
      });
      reject(err);
    }
  },

  /**
   * 退出登录
   */
  logout: function () {
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
  requireLogin: function () {
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
  getUserToken: function () {
    return wx.getStorageSync('userToken');
  },

  /**
   * 获取钱包地址
   */
  getWalletAddress: function () {
    return this.globalData.walletAddress || wx.getStorageSync('walletAddress');
  },

  /**
   * 格式化钱包地址（简短显示）
   */
  formatWalletAddress: function (address) {
    if (!address) return '';
    if (address.length <= 10) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }
});
