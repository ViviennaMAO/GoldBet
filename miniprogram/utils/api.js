// utils/api-rest.js - Supabase REST API 版本（小程序完全兼容）

// Supabase 配置
const SUPABASE_URL = 'https://xdvulevrojtvhcmdaexd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhkdnVsZXZyb2p0dmhjbWRhZXhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3MTQzNTksImV4cCI6MjA4NDI5MDM1OX0.g77x_IbCvHFRd0v2Np9AAizZHctkV0oE-hgotwzkyNA';

/**
 * 通用请求函数
 */
function request(options) {
  return new Promise((resolve, reject) => {
    const { url, method = 'GET', data = null, needAuth = false } = options;

    const header = {
      'apikey': SUPABASE_ANON_KEY,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    };

    // 如果需要认证，添加 Authorization header
    if (needAuth) {
      const token = wx.getStorageSync('supabaseToken');
      if (token) {
        header['Authorization'] = `Bearer ${token}`;
      } else {
        header['Authorization'] = `Bearer ${SUPABASE_ANON_KEY}`;
      }
    } else {
      header['Authorization'] = `Bearer ${SUPABASE_ANON_KEY}`;
    }

    wx.request({
      url: `${SUPABASE_URL}${url}`,
      method: method,
      data: data,
      header: header,
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data);
        } else {
          console.error('API 请求失败:', res);
          reject(new Error(res.data?.message || `请求失败: ${res.statusCode}`));
        }
      },
      fail: (err) => {
        console.error('网络请求失败:', err);
        reject(err);
      }
    });
  });
}

/**
 * Supabase Auth API 请求
 */
function authRequest(endpoint, data) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${SUPABASE_URL}/auth/v1${endpoint}`,
      method: 'POST',
      data: data,
      header: {
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json'
      },
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data);
        } else {
          reject(new Error(res.data?.msg || res.data?.error_description || '认证失败'));
        }
      },
      fail: (err) => {
        reject(err);
      }
    });
  });
}

/**
 * API 接口定义
 */
const API = {
  // ==================== 用户认证 ====================

  /**
   * 钱包登录（自动注册）
   */
  walletLogin: async (walletAddress) => {
    try {
      const email = `${walletAddress.toLowerCase()}@goldbet.app`;
      const password = walletAddress;

      // 尝试登录
      let authData;
      try {
        authData = await authRequest('/token?grant_type=password', {
          email: email,
          password: password
        });
      } catch (loginError) {
        // 登录失败，尝试注册
        console.log('用户不存在，开始注册...');

        authData = await authRequest('/signup', {
          email: email,
          password: password,
          data: {
            wallet_address: walletAddress
          }
        });

        // 注册成功后，创建用户扩展信息
        if (authData.user) {
          try {
            await request({
              url: '/rest/v1/user_profiles',
              method: 'POST',
              data: {
                id: authData.user.id,
                wallet_address: walletAddress
              },
              needAuth: false
            });
          } catch (profileError) {
            console.error('创建用户资料失败:', profileError);
            // 不影响登录流程
          }
        }
      }

      // 保存 token
      if (authData.access_token) {
        wx.setStorageSync('supabaseToken', authData.access_token);
      }

      return {
        success: true,
        data: {
          token: authData.access_token,
          walletAddress: walletAddress,
          userId: authData.user?.id
        }
      };
    } catch (error) {
      console.error('钱包登录失败:', error);
      return {
        success: false,
        message: error.message || '登录失败'
      };
    }
  },

  /**
   * 验证 Token
   */
  verifyToken: async () => {
    try {
      const token = wx.getStorageSync('supabaseToken');
      if (!token) {
        return {
          success: false,
          message: '未登录'
        };
      }

      const userData = await authRequest('/user', {});

      return {
        success: true,
        data: {
          userId: userData.id,
          email: userData.email
        }
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Token 验证失败'
      };
    }
  },

  // ==================== 价格数据 ====================

  /**
   * 获取当前金价
   */
  getCurrentPrice: async () => {
    try {
      const data = await request({
        url: '/rest/v1/gold_prices?order=date.desc&limit=1',
        method: 'GET'
      });

      if (!data || data.length === 0) {
        throw new Error('暂无金价数据');
      }

      const priceData = data[0];

      return {
        success: true,
        data: {
          currentPrice: parseFloat(priceData.current_price),
          previousClose: parseFloat(priceData.previous_close),
          change: parseFloat(priceData.change),
          changePercent: parseFloat(priceData.change_percent),
          updateTime: priceData.updated_at
        }
      };
    } catch (error) {
      console.error('获取金价失败:', error);
      return {
        success: false,
        message: error.message || '获取金价失败'
      };
    }
  },

  /**
   * 获取今日价格数据
   */
  getTodayPrice: async () => {
    try {
      const today = new Date().toISOString().split('T')[0];

      const data = await request({
        url: `/rest/v1/gold_prices?date=eq.${today}`,
        method: 'GET'
      });

      if (!data || data.length === 0) {
        throw new Error('今日暂无金价数据');
      }

      const priceData = data[0];

      return {
        success: true,
        data: {
          date: priceData.date,
          openPrice: parseFloat(priceData.open_price),
          highPrice: parseFloat(priceData.high_price),
          lowPrice: parseFloat(priceData.low_price),
          closePrice: priceData.close_price ? parseFloat(priceData.close_price) : null,
          currentPrice: parseFloat(priceData.current_price),
          previousClose: parseFloat(priceData.previous_close),
          change: parseFloat(priceData.change),
          changePercent: parseFloat(priceData.change_percent),
          volatility: parseFloat(priceData.volatility)
        }
      };
    } catch (error) {
      console.error('获取今日金价失败:', error);
      return {
        success: false,
        message: error.message || '获取今日金价失败'
      };
    }
  },

  /**
   * 获取历史价格数据
   */
  getPriceHistory: async (days = 7) => {
    try {
      const data = await request({
        url: `/rest/v1/gold_prices?order=date.desc&limit=${days}`,
        method: 'GET'
      });

      return {
        success: true,
        data: data.map(item => ({
          date: item.date,
          openPrice: parseFloat(item.open_price),
          highPrice: parseFloat(item.high_price),
          lowPrice: parseFloat(item.low_price),
          closePrice: item.close_price ? parseFloat(item.close_price) : null,
          volatility: parseFloat(item.volatility)
        }))
      };
    } catch (error) {
      console.error('获取历史价格失败:', error);
      return {
        success: false,
        message: error.message || '获取历史价格失败'
      };
    }
  },

  // ==================== 预测管理 ====================

  /**
   * 提交预测
   */
  submitPrediction: async (direction, volatility, basePrice) => {
    try {
      const token = wx.getStorageSync('supabaseToken');
      if (!token) {
        return {
          success: false,
          message: '请先登录'
        };
      }

      const today = new Date().toISOString().split('T')[0];
      const userId = wx.getStorageSync('userId');
      const walletAddress = wx.getStorageSync('walletAddress');

      const data = await request({
        url: '/rest/v1/predictions',
        method: 'POST',
        data: {
          user_id: userId,
          wallet_address: walletAddress,
          date: today,
          price_direction: direction,
          volatility: volatility,
          base_price: basePrice
        },
        needAuth: true
      });

      return {
        success: true,
        data: {
          predictionId: data[0]?.id,
          message: '预测提交成功'
        }
      };
    } catch (error) {
      console.error('提交预测失败:', error);
      return {
        success: false,
        message: error.message || '提交预测失败'
      };
    }
  },

  /**
   * 获取我的预测记录
   */
  getMyPredictions: async (page = 1, pageSize = 10) => {
    try {
      const userId = wx.getStorageSync('userId');
      if (!userId) {
        return {
          success: false,
          message: '请先登录'
        };
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      // 获取预测记录
      const predictions = await request({
        url: `/rest/v1/predictions?user_id=eq.${userId}&order=date.desc&limit=${pageSize}&offset=${from}`,
        method: 'GET',
        needAuth: true
      });

      // 获取用户统计
      const profiles = await request({
        url: `/rest/v1/user_profiles?id=eq.${userId}&select=total_predictions,correct_predictions,accuracy`,
        method: 'GET',
        needAuth: true
      });

      const profile = profiles[0] || {};

      return {
        success: true,
        data: {
          total: profile.total_predictions || 0,
          correct: profile.correct_predictions || 0,
          accuracy: profile.accuracy || 0,
          predictions: predictions.map(p => ({
            predictionId: p.id,
            date: p.date,
            priceDirection: p.price_direction,
            volatility: p.volatility,
            basePrice: parseFloat(p.base_price),
            resultPrice: p.result_price ? parseFloat(p.result_price) : null,
            resultVolatility: p.result_volatility ? parseFloat(p.result_volatility) : null,
            directionCorrect: p.direction_correct,
            volatilityCorrect: p.volatility_correct,
            pointsEarned: p.points_earned,
            status: p.status,
            createdAt: p.created_at
          })),
          pagination: {
            page,
            pageSize,
            totalPages: Math.ceil((profile.total_predictions || 0) / pageSize)
          }
        }
      };
    } catch (error) {
      console.error('获取预测记录失败:', error);
      return {
        success: false,
        message: error.message || '获取预测记录失败'
      };
    }
  },

  /**
   * 检查今日是否已预测
   */
  checkTodayPrediction: async () => {
    try {
      const userId = wx.getStorageSync('userId');
      if (!userId) {
        return {
          success: false,
          message: '请先登录'
        };
      }

      const today = new Date().toISOString().split('T')[0];

      const data = await request({
        url: `/rest/v1/predictions?user_id=eq.${userId}&date=eq.${today}`,
        method: 'GET',
        needAuth: true
      });

      const prediction = data[0];

      return {
        success: true,
        data: {
          hasPredicted: !!prediction,
          prediction: prediction ? {
            direction: prediction.price_direction,
            volatility: prediction.volatility,
            createdAt: prediction.created_at
          } : null
        }
      };
    } catch (error) {
      console.error('检查预测状态失败:', error);
      return {
        success: false,
        message: error.message || '检查预测状态失败'
      };
    }
  },

  // ==================== 用户统计 ====================

  /**
   * 获取用户统计数据
   */
  getUserStats: async () => {
    try {
      const userId = wx.getStorageSync('userId');
      if (!userId) {
        return {
          success: false,
          message: '请先登录'
        };
      }

      const profiles = await request({
        url: `/rest/v1/user_profiles?id=eq.${userId}`,
        method: 'GET',
        needAuth: true
      });

      const profile = profiles[0];
      if (!profile) {
        throw new Error('用户资料不存在');
      }

      // 获取排名（比当前用户积分高的用户数量 + 1）
      const higherScores = await request({
        url: `/rest/v1/user_profiles?points=gt.${profile.points}&select=id`,
        method: 'GET'
      });

      return {
        success: true,
        data: {
          totalPredictions: profile.total_predictions,
          correctPredictions: profile.correct_predictions,
          accuracy: parseFloat(profile.accuracy),
          points: profile.points,
          consecutiveWins: profile.consecutive_wins,
          rank: higherScores.length + 1
        }
      };
    } catch (error) {
      console.error('获取用户统计失败:', error);
      return {
        success: false,
        message: error.message || '获取用户统计失败'
      };
    }
  },

  // ==================== 排行榜 ====================

  /**
   * 获取积分排行榜
   */
  getPointsLeaderboard: async (limit = 50) => {
    try {
      const data = await request({
        url: `/rest/v1/user_profiles?select=wallet_address,points,total_predictions,correct_predictions&order=points.desc&limit=${limit}`,
        method: 'GET'
      });

      return {
        success: true,
        data: data.map((item, index) => ({
          rank: index + 1,
          userId: item.wallet_address || 'Anonymous',
          points: item.points,
          totalPredictions: item.total_predictions,
          correctPredictions: item.correct_predictions
        }))
      };
    } catch (error) {
      console.error('获取积分榜失败:', error);
      return {
        success: false,
        message: error.message || '获取积分榜失败'
      };
    }
  },

  /**
   * 获取准确率排行榜
   */
  getAccuracyLeaderboard: async (limit = 50) => {
    try {
      const data = await request({
        url: `/rest/v1/user_profiles?select=wallet_address,accuracy,total_predictions,correct_predictions&total_predictions=gte.5&order=accuracy.desc&limit=${limit}`,
        method: 'GET'
      });

      return {
        success: true,
        data: data.map((item, index) => ({
          rank: index + 1,
          userId: item.wallet_address || 'Anonymous',
          accuracy: parseFloat(item.accuracy),
          totalPredictions: item.total_predictions,
          correctPredictions: item.correct_predictions
        }))
      };
    } catch (error) {
      console.error('获取准确率榜失败:', error);
      return {
        success: false,
        message: error.message || '获取准确率榜失败'
      };
    }
  },

  /**
   * 获取连胜排行榜
   */
  getStreakLeaderboard: async (limit = 50) => {
    try {
      const data = await request({
        url: `/rest/v1/user_profiles?select=wallet_address,consecutive_wins,total_predictions,points&order=consecutive_wins.desc&limit=${limit}`,
        method: 'GET'
      });

      return {
        success: true,
        data: data.map((item, index) => ({
          rank: index + 1,
          userId: item.wallet_address || 'Anonymous',
          consecutiveWins: item.consecutive_wins,
          totalPredictions: item.total_predictions,
          points: item.points
        }))
      };
    } catch (error) {
      console.error('获取连胜榜失败:', error);
      return {
        success: false,
        message: error.message || '获取连胜榜失败'
      };
    }
  }
};

module.exports = {
  API
};
