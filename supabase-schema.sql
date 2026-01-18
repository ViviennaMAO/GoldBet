-- =====================================================
-- GoldBet Supabase 数据库架构
-- =====================================================
-- 执行方法：
-- 1. 在 Supabase Dashboard 中点击左侧 "SQL Editor"
-- 2. 点击 "New query"
-- 3. 复制粘贴这整个文件的内容
-- 4. 点击 "Run" 执行
-- =====================================================

-- =====================================================
-- 1. 用户扩展信息表
-- =====================================================
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_address TEXT UNIQUE,
  username TEXT,
  total_predictions INTEGER DEFAULT 0,
  correct_predictions INTEGER DEFAULT 0,
  accuracy DECIMAL(5,2) DEFAULT 0,
  points INTEGER DEFAULT 0,
  consecutive_wins INTEGER DEFAULT 0,
  last_prediction_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 添加索引
CREATE INDEX IF NOT EXISTS idx_user_profiles_wallet ON user_profiles(wallet_address);
CREATE INDEX IF NOT EXISTS idx_user_profiles_points ON user_profiles(points DESC);
CREATE INDEX IF NOT EXISTS idx_user_profiles_accuracy ON user_profiles(accuracy DESC);
CREATE INDEX IF NOT EXISTS idx_user_profiles_consecutive_wins ON user_profiles(consecutive_wins DESC);

-- 启用 RLS (Row Level Security)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- RLS 策略：用户只能读取自己的数据
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

-- RLS 策略：用户可以更新自己的数据
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id);

-- RLS 策略：允许插入（注册时）
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- =====================================================
-- 2. 黄金价格表
-- =====================================================
CREATE TABLE IF NOT EXISTS public.gold_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE UNIQUE NOT NULL,
  open_price DECIMAL(10,2) NOT NULL,
  high_price DECIMAL(10,2) NOT NULL,
  low_price DECIMAL(10,2) NOT NULL,
  close_price DECIMAL(10,2),
  current_price DECIMAL(10,2) NOT NULL,
  previous_close DECIMAL(10,2),
  change DECIMAL(10,2) DEFAULT 0,
  change_percent DECIMAL(5,2) DEFAULT 0,
  volatility DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_gold_prices_date ON gold_prices(date DESC);

-- 启用 RLS
ALTER TABLE gold_prices ENABLE ROW LEVEL SECURITY;

-- RLS 策略：所有人可读
DROP POLICY IF EXISTS "Anyone can view gold prices" ON gold_prices;
CREATE POLICY "Anyone can view gold prices"
  ON gold_prices FOR SELECT
  TO public
  USING (true);

-- RLS 策略：只有服务角色可以写入
DROP POLICY IF EXISTS "Service role can insert gold prices" ON gold_prices;
CREATE POLICY "Service role can insert gold prices"
  ON gold_prices FOR INSERT
  TO service_role
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can update gold prices" ON gold_prices;
CREATE POLICY "Service role can update gold prices"
  ON gold_prices FOR UPDATE
  TO service_role
  USING (true);

-- =====================================================
-- 3. 预测记录表
-- =====================================================
CREATE TABLE IF NOT EXISTS public.predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  wallet_address TEXT,
  date DATE NOT NULL,
  price_direction TEXT CHECK (price_direction IN ('up', 'down')) NOT NULL,
  volatility TEXT CHECK (volatility IN ('small', 'medium', 'large')) NOT NULL,
  base_price DECIMAL(10,2) NOT NULL,
  result_price DECIMAL(10,2),
  result_volatility DECIMAL(5,2),
  direction_correct BOOLEAN,
  volatility_correct BOOLEAN,
  points_earned INTEGER DEFAULT 0,
  status TEXT CHECK (status IN ('pending', 'settled')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  settled_at TIMESTAMP WITH TIME ZONE,

  -- 确保用户每天只能预测一次
  UNIQUE(user_id, date)
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_predictions_user ON predictions(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_predictions_status ON predictions(status, date);
CREATE INDEX IF NOT EXISTS idx_predictions_date ON predictions(date DESC);

-- 启用 RLS
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;

-- RLS 策略：用户只能查看自己的预测
DROP POLICY IF EXISTS "Users can view own predictions" ON predictions;
CREATE POLICY "Users can view own predictions"
  ON predictions FOR SELECT
  USING (auth.uid() = user_id);

-- RLS 策略：用户可以插入自己的预测
DROP POLICY IF EXISTS "Users can insert own predictions" ON predictions;
CREATE POLICY "Users can insert own predictions"
  ON predictions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS 策略：服务角色可以更新预测（用于结算）
DROP POLICY IF EXISTS "Service role can update predictions" ON predictions;
CREATE POLICY "Service role can update predictions"
  ON predictions FOR UPDATE
  TO service_role
  USING (true);

-- =====================================================
-- 4. 自动更新 updated_at 触发器
-- =====================================================

-- 创建更新函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为 user_profiles 添加触发器
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 为 gold_prices 添加触发器
DROP TRIGGER IF EXISTS update_gold_prices_updated_at ON gold_prices;
CREATE TRIGGER update_gold_prices_updated_at
  BEFORE UPDATE ON gold_prices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 5. 自动计算用户准确率函数
-- =====================================================

-- 创建计算准确率的函数
CREATE OR REPLACE FUNCTION calculate_user_accuracy()
RETURNS TRIGGER AS $$
BEGIN
  -- 只在 total_predictions > 0 时计算准确率
  IF NEW.total_predictions > 0 THEN
    NEW.accuracy = ROUND((NEW.correct_predictions::DECIMAL / NEW.total_predictions::DECIMAL) * 100, 2);
  ELSE
    NEW.accuracy = 0;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为 user_profiles 添加准确率计算触发器
DROP TRIGGER IF EXISTS calculate_accuracy_on_update ON user_profiles;
CREATE TRIGGER calculate_accuracy_on_update
  BEFORE INSERT OR UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION calculate_user_accuracy();

-- =====================================================
-- 6. 插入测试数据（可选）
-- =====================================================

-- 插入当天的初始金价数据（方便测试）
INSERT INTO public.gold_prices (
  date,
  open_price,
  high_price,
  low_price,
  current_price,
  previous_close,
  change,
  change_percent
) VALUES (
  CURRENT_DATE,
  4616.13,
  4621.08,
  4536.74,
  4596.69,
  4616.13,
  -19.44,
  -0.42
) ON CONFLICT (date) DO NOTHING;

-- =====================================================
-- 执行完成！
-- =====================================================
-- 执行完成后，你应该看到：
-- - 3 个表已创建 (user_profiles, gold_prices, predictions)
-- - 多个索引已创建
-- - RLS 策略已设置
-- - 触发器已创建
-- - 测试数据已插入
-- =====================================================
