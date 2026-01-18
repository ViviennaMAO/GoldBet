// utils/api.js - API请求封装（Supabase 版本）
const { supabase } = require('./supabase.js');

/**
 * API接口定义（使用 Supabase）
 */
const API = {
  // ==================== 用户认证 ====================

  /**
   * 钱包登录（简化版）
   * 使用钱包地址作为唯一标识
   */
  walletLogin: async (walletAddress) => {
    try {
      // 使用钱包地址创建邮箱（临时方案）
      const email = `${walletAddress.toLowerCase()}@goldbet.app`;
      const password = walletAddress; // 简化版密码

      // 尝试登录
      let { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      // 如果用户不存在，则注册
      if (error && error.message.includes('Invalid')) {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              wallet_address: walletAddress
            }
          }
        });

        if (signUpError) throw signUpError;

        // 创建用户扩展信息
        const { error: profileError } = await supabase
          .from('user_profiles')
          .insert({
            id: signUpData.user.id,
            wallet_address: walletAddress
          });

        if (profileError) {
          console.error('创建用户资料失败:', profileError);
        }

        data = signUpData;
      }

      if (error) throw error;

      return {
        success: true,
        data: {
          token: data.session?.access_token,
          walletAddress: walletAddress,
          userId: data.user?.id
        }
      };
    } catch (error) {
      console.error('钱包登录失败:', error);
      return {
        success: false,
        message: error.message
      };
    }
  },

  /**
   * 验证Token
   */
  verifyToken: async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error) throw error;

      return {
        success: true,
        data: {
          userId: user.id,
          email: user.email
        }
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  },

  // ==================== 价格数据 ====================

  /**
   * 获取当前金价
   */
  getCurrentPrice: async () => {
    try {
      const { data, error } = await supabase
        .from('gold_prices')
        .select('*')
        .order('date', { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;

      return {
        success: true,
        data: {
          currentPrice: parseFloat(data.current_price),
          previousClose: parseFloat(data.previous_close),
          change: parseFloat(data.change),
          changePercent: parseFloat(data.change_percent),
          updateTime: data.updated_at
        }
      };
    } catch (error) {
      console.error('获取金价失败:', error);
      return {
        success: false,
        message: error.message
      };
    }
  },

  /**
   * 获取今日价格数据
   */
  getTodayPrice: async () => {
    try {
      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('gold_prices')
        .select('*')
        .eq('date', today)
        .single();

      if (error) throw error;

      return {
        success: true,
        data: {
          date: data.date,
          openPrice: parseFloat(data.open_price),
          highPrice: parseFloat(data.high_price),
          lowPrice: parseFloat(data.low_price),
          closePrice: data.close_price ? parseFloat(data.close_price) : null,
          currentPrice: parseFloat(data.current_price),
          previousClose: parseFloat(data.previous_close),
          change: parseFloat(data.change),
          changePercent: parseFloat(data.change_percent),
          volatility: parseFloat(data.volatility)
        }
      };
    } catch (error) {
      console.error('获取今日金价失败:', error);
      return {
        success: false,
        message: error.message
      };
    }
  },

  /**
   * 获取历史价格数据
   */
  getPriceHistory: async (days = 7) => {
    try {
      const { data, error } = await supabase
        .from('gold_prices')
        .select('*')
        .order('date', { ascending: false })
        .limit(days);

      if (error) throw error;

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
        message: error.message
      };
    }
  },

  // ==================== 预测管理 ====================

  /**
   * 提交预测
   */
  submitPrediction: async (direction, volatility, basePrice) => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('未登录');

      const today = new Date().toISOString().split('T')[0];

      // 获取钱包地址
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('wallet_address')
        .eq('id', user.id)
        .single();

      const { data, error } = await supabase
        .from('predictions')
        .insert({
          user_id: user.id,
          wallet_address: profile?.wallet_address,
          date: today,
          price_direction: direction,
          volatility: volatility,
          base_price: basePrice
        })
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data: {
          predictionId: data.id,
          message: '预测提交成功'
        }
      };
    } catch (error) {
      console.error('提交预测失败:', error);
      return {
        success: false,
        message: error.message
      };
    }
  },

  /**
   * 获取我的预测记录
   */
  getMyPredictions: async (page = 1, pageSize = 10) => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('未登录');

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, error, count } = await supabase
        .from('predictions')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .range(from, to);

      if (error) throw error;

      // 获取用户统计
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('total_predictions, correct_predictions, accuracy')
        .eq('id', user.id)
        .single();

      return {
        success: true,
        data: {
          total: profile?.total_predictions || 0,
          correct: profile?.correct_predictions || 0,
          accuracy: profile?.accuracy || 0,
          predictions: data.map(p => ({
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
            totalPages: Math.ceil((count || 0) / pageSize)
          }
        }
      };
    } catch (error) {
      console.error('获取预测记录失败:', error);
      return {
        success: false,
        message: error.message
      };
    }
  },

  /**
   * 检查今日是否已预测
   */
  checkTodayPrediction: async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('未登录');

      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('predictions')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .maybeSingle();

      if (error) throw error;

      return {
        success: true,
        data: {
          hasPredicted: !!data,
          prediction: data ? {
            direction: data.price_direction,
            volatility: data.volatility,
            createdAt: data.created_at
          } : null
        }
      };
    } catch (error) {
      console.error('检查预测状态失败:', error);
      return {
        success: false,
        message: error.message
      };
    }
  },

  // ==================== 用户统计 ====================

  /**
   * 获取用户统计数据
   */
  getUserStats: async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('未登录');

      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      // 获取排名
      const { count } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true })
        .gt('points', data.points || 0);

      return {
        success: true,
        data: {
          totalPredictions: data.total_predictions,
          correctPredictions: data.correct_predictions,
          accuracy: parseFloat(data.accuracy),
          points: data.points,
          consecutiveWins: data.consecutive_wins,
          rank: (count || 0) + 1
        }
      };
    } catch (error) {
      console.error('获取用户统计失败:', error);
      return {
        success: false,
        message: error.message
      };
    }
  },

  // ==================== 排行榜 ====================

  /**
   * 获取积分排行榜
   */
  getPointsLeaderboard: async (limit = 50) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('wallet_address, points, total_predictions, correct_predictions')
        .order('points', { ascending: false })
        .limit(limit);

      if (error) throw error;

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
        message: error.message
      };
    }
  },

  /**
   * 获取准确率排行榜
   */
  getAccuracyLeaderboard: async (limit = 50) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('wallet_address, accuracy, total_predictions, correct_predictions')
        .gte('total_predictions', 5)
        .order('accuracy', { ascending: false })
        .limit(limit);

      if (error) throw error;

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
        message: error.message
      };
    }
  },

  /**
   * 获取连胜排行榜
   */
  getStreakLeaderboard: async (limit = 50) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('wallet_address, consecutive_wins, total_predictions, points')
        .order('consecutive_wins', { ascending: false })
        .limit(limit);

      if (error) throw error;

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
        message: error.message
      };
    }
  }
};

module.exports = {
  API
};
