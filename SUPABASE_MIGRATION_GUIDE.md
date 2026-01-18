# 🚀 GoldBet 迁移到 Supabase 指南

## 为什么选择 Supabase？

### ✅ 优势
- **免费数据库**：500MB PostgreSQL，够用
- **免费认证**：自带用户认证系统
- **自动 API**：无需编写 CRUD 代码
- **实时功能**：数据变更实时同步
- **无需服务器**：0运维成本
- **全球 CDN**：访问速度快

### 架构对比

#### 原方案（复杂）
```
小程序 → Node.js 后端 → MongoDB → 定时任务
         ↓
    需要部署服务器
    需要运维维护
```

#### Supabase 方案（简单）
```
小程序 → Supabase → PostgreSQL + Auth + Storage
         ↓
    全托管，无需服务器
    自动扩展
```

---

## 📋 迁移步骤

### 第一步：注册 Supabase（5分钟）

1. 访问：https://supabase.com/
2. 点击 **"Start your project"**
3. 使用 GitHub 账号登录（推荐）或邮箱注册
4. 创建新项目：
   - Organization: 选择或创建
   - Project Name: `goldbet`
   - Database Password: 设置强密码（记住！）
   - Region: 选择 **Northeast Asia (Tokyo)** 或 **Southeast Asia (Singapore)**
   - Pricing Plan: **Free** (免费版)

5. 等待项目创建（约2分钟）

### 第二步：创建数据表（10分钟）

#### 1. 用户表 (users)

Supabase 自带 `auth.users` 表，我们创建扩展信息表：

```sql
-- 在 Supabase SQL Editor 中执行

-- 创建用户扩展信息表
CREATE TABLE public.user_profiles (
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
CREATE INDEX idx_user_profiles_wallet ON user_profiles(wallet_address);
CREATE INDEX idx_user_profiles_points ON user_profiles(points DESC);
CREATE INDEX idx_user_profiles_accuracy ON user_profiles(accuracy DESC);

-- 启用 RLS (Row Level Security)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- RLS 策略：用户只能读取自己的数据
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

-- RLS 策略：用户可以更新自己的数据
CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id);
```

#### 2. 黄金价格表 (gold_prices)

```sql
-- 黄金价格表
CREATE TABLE public.gold_prices (
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
CREATE INDEX idx_gold_prices_date ON gold_prices(date DESC);

-- RLS：所有人可读
ALTER TABLE gold_prices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view gold prices"
  ON gold_prices FOR SELECT
  TO public
  USING (true);

-- 只有服务角色可以写入（通过 Service Key）
CREATE POLICY "Service role can insert gold prices"
  ON gold_prices FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can update gold prices"
  ON gold_prices FOR UPDATE
  TO service_role
  USING (true);
```

#### 3. 预测记录表 (predictions)

```sql
-- 预测记录表
CREATE TABLE public.predictions (
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
CREATE INDEX idx_predictions_user ON predictions(user_id, date DESC);
CREATE INDEX idx_predictions_status ON predictions(status, date);

-- RLS
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own predictions"
  ON predictions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own predictions"
  ON predictions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can update predictions"
  ON predictions FOR UPDATE
  TO service_role
  USING (true);
```

#### 4. 自动更新时间戳触发器

```sql
-- 创建自动更新 updated_at 的函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为各表添加触发器
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gold_prices_updated_at
  BEFORE UPDATE ON gold_prices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### 第三步：配置 Supabase 客户端（5分钟）

#### 1. 获取项目凭证

在 Supabase Dashboard：
1. 点击左侧 **"Project Settings"**（齿轮图标）
2. 点击 **"API"**
3. 复制：
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon/public key**: `eyJhbG...` (公开密钥，用于前端)
   - **service_role key**: `eyJhbG...` (私密密钥，用于后端定时任务)

#### 2. 安装 Supabase 客户端

```bash
# 在小程序项目根目录（不是 server 目录）
npm install @supabase/supabase-js
```

#### 3. 创建 Supabase 配置文件

创建 `utils/supabase.js`：

```javascript
// utils/supabase.js
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://xxxxx.supabase.co'  // 替换为你的 URL
const SUPABASE_ANON_KEY = 'eyJhbG...'  // 替换为你的 anon key

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
```

### 第四步：修改小程序代码（15分钟）

#### 1. 修改 `utils/api.js`

```javascript
// utils/api.js
import { supabase } from './supabase.js'

const API = {
  // ==================== 用户认证 ====================

  // 钱包登录（使用 Supabase Auth）
  walletLogin: async (walletAddress) => {
    // 使用钱包地址作为邮箱（临时方案）
    const email = `${walletAddress}@goldbet.app`
    const password = walletAddress // 简化版，生产环境需改进

    // 尝试登录或注册
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error && error.message.includes('Invalid login')) {
      // 用户不存在，创建新用户
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password
      })

      if (signUpError) throw signUpError

      // 创建用户扩展信息
      await supabase.from('user_profiles').insert({
        id: signUpData.user.id,
        wallet_address: walletAddress
      })

      return signUpData
    }

    if (error) throw error
    return data
  },

  // ==================== 价格数据 ====================

  // 获取当前金价
  getCurrentPrice: async () => {
    const { data, error } = await supabase
      .from('gold_prices')
      .select('*')
      .order('date', { ascending: false })
      .limit(1)
      .single()

    if (error) throw error
    return { success: true, data }
  },

  // 获取今日价格
  getTodayPrice: async () => {
    const today = new Date().toISOString().split('T')[0]

    const { data, error } = await supabase
      .from('gold_prices')
      .select('*')
      .eq('date', today)
      .single()

    if (error) throw error
    return { success: true, data }
  },

  // ==================== 预测管理 ====================

  // 提交预测
  submitPrediction: async (direction, volatility, basePrice) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('未登录')

    const today = new Date().toISOString().split('T')[0]

    const { data, error } = await supabase
      .from('predictions')
      .insert({
        user_id: user.id,
        date: today,
        price_direction: direction,
        volatility: volatility,
        base_price: basePrice
      })
      .select()
      .single()

    if (error) throw error
    return { success: true, data }
  },

  // 获取我的预测记录
  getMyPredictions: async (page = 1, pageSize = 10) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('未登录')

    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    const { data, error, count } = await supabase
      .from('predictions')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .range(from, to)

    if (error) throw error

    // 获取用户统计
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    return {
      success: true,
      data: {
        total: profile?.total_predictions || 0,
        correct: profile?.correct_predictions || 0,
        accuracy: profile?.accuracy || 0,
        predictions: data,
        pagination: {
          page,
          pageSize,
          totalPages: Math.ceil(count / pageSize)
        }
      }
    }
  },

  // 检查今日是否已预测
  checkTodayPrediction: async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('未登录')

    const today = new Date().toISOString().split('T')[0]

    const { data, error } = await supabase
      .from('predictions')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', today)
      .single()

    if (error && error.code !== 'PGRST116') throw error

    return {
      success: true,
      data: {
        hasPredicted: !!data,
        prediction: data
      }
    }
  },

  // ==================== 用户统计 ====================

  getUserStats: async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('未登录')

    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error) throw error

    // 获取排名
    const { count } = await supabase
      .from('user_profiles')
      .select('*', { count: 'exact', head: true })
      .gt('points', data.points)

    return {
      success: true,
      data: {
        ...data,
        rank: (count || 0) + 1
      }
    }
  },

  // ==================== 排行榜 ====================

  getPointsLeaderboard: async (limit = 50) => {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('wallet_address, points, total_predictions, correct_predictions')
      .order('points', { ascending: false })
      .limit(limit)

    if (error) throw error

    return {
      success: true,
      data: data.map((item, index) => ({
        rank: index + 1,
        userId: item.wallet_address,
        ...item
      }))
    }
  },

  getAccuracyLeaderboard: async (limit = 50) => {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('wallet_address, accuracy, total_predictions, correct_predictions')
      .gte('total_predictions', 5)
      .order('accuracy', { ascending: false })
      .limit(limit)

    if (error) throw error

    return {
      success: true,
      data: data.map((item, index) => ({
        rank: index + 1,
        userId: item.wallet_address,
        ...item
      }))
    }
  },

  getStreakLeaderboard: async (limit = 50) => {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('wallet_address, consecutive_wins, total_predictions, points')
      .order('consecutive_wins', { ascending: false })
      .limit(limit)

    if (error) throw error

    return {
      success: true,
      data: data.map((item, index) => ({
        rank: index + 1,
        userId: item.wallet_address,
        ...item
      }))
    }
  }
}

export { API }
```

### 第五步：设置定时任务（价格更新）

#### 方案A：使用 Supabase Edge Functions

创建 Edge Function 来获取金价：

```bash
# 安装 Supabase CLI
npm install -g supabase

# 登录
supabase login

# 创建 Edge Function
supabase functions new update-gold-price
```

编辑 `supabase/functions/update-gold-price/index.ts`：

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    // 创建 Supabase 客户端（使用 service role key）
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 从 GoldAPI.io 获取金价
    const goldApiKey = Deno.env.get('GOLD_API_KEY')
    const response = await fetch('https://www.goldapi.io/api/XAU/USD', {
      headers: {
        'x-access-token': goldApiKey,
        'Content-Type': 'application/json'
      }
    })

    const priceData = await response.json()

    // 保存到数据库
    const today = new Date().toISOString().split('T')[0]

    const { data, error } = await supabase
      .from('gold_prices')
      .upsert({
        date: today,
        open_price: priceData.open_price,
        high_price: priceData.high_price,
        low_price: priceData.low_price,
        current_price: priceData.price,
        change: priceData.ch,
        change_percent: priceData.chp
      }, {
        onConflict: 'date'
      })

    if (error) throw error

    return new Response(
      JSON.stringify({ success: true, data }),
      { headers: { "Content-Type": "application/json" } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
})
```

部署：

```bash
supabase functions deploy update-gold-price
```

然后在 **GitHub Actions** 或 **Vercel Cron** 中每小时调用一次这个函数。

#### 方案B：保留简单的 Node.js Cron（更简单）

保留现有的 `server` 目录，但只用于定时任务：

1. 修改 `server/src/services/priceService.js` 保存到 Supabase
2. 部署到任意服务器或 Vercel
3. 设置 Cron 每小时运行

---

## 📊 迁移对比

### 数据库映射

| MongoDB Collection | Supabase Table | 说明 |
|-------------------|----------------|------|
| users | user_profiles | 用户扩展信息 |
| - | auth.users | Supabase 自带认证表 |
| goldprices | gold_prices | 黄金价格 |
| predictions | predictions | 预测记录 |

### API 调用对比

#### 旧方式（自建后端）
```javascript
wx.request({
  url: 'http://localhost:3000/api/prices/current',
  method: 'GET',
  header: { 'Authorization': 'Bearer token' }
})
```

#### 新方式（Supabase）
```javascript
const { data } = await supabase
  .from('gold_prices')
  .select('*')
  .order('date', { ascending: false })
  .limit(1)
```

---

## ✅ 迁移后的优势

1. **零运维** - 不需要管理服务器
2. **自动扩展** - Supabase 自动处理扩展
3. **实时更新** - 支持实时数据订阅
4. **免费额度足够** - 小项目完全免费
5. **全球 CDN** - 访问速度快
6. **自带备份** - 数据自动备份

---

## 🎯 下一步

1. ✅ 注册 Supabase
2. ✅ 创建项目和数据表
3. ✅ 配置小程序客户端
4. ✅ 修改 API 调用
5. ✅ 测试功能
6. ✅ 部署定时任务（可选）

---

**需要帮助？**参考 Supabase 官方文档：https://supabase.com/docs
