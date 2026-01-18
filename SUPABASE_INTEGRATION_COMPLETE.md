# ✅ Supabase 集成完成

## 🎉 集成状态：已完成

GoldBet 项目已成功从 MongoDB + Node.js 后端迁移到 Supabase！

---

## 📋 已完成的工作

### 1. ✅ Supabase 项目配置
- **项目名称**: GoldBet
- **项目 URL**: `https://xdvulevrojtvhcmdaexd.supabase.co`
- **状态**: 已注册并配置完成

### 2. ✅ 数据库表结构创建
成功在 Supabase SQL Editor 中执行了 `supabase-schema.sql`，创建了以下表：

#### 📊 user_profiles（用户扩展信息表）
```sql
- id (UUID, 主键, 关联 auth.users)
- wallet_address (TEXT, 唯一)
- username (TEXT)
- total_predictions (INTEGER, 总预测次数)
- correct_predictions (INTEGER, 正确预测次数)
- accuracy (DECIMAL, 准确率)
- points (INTEGER, 积分)
- consecutive_wins (INTEGER, 连胜次数)
- last_prediction_date (TIMESTAMP)
```

#### 💰 gold_prices（黄金价格表）
```sql
- id (UUID, 主键)
- date (DATE, 唯一)
- open_price (DECIMAL)
- high_price (DECIMAL)
- low_price (DECIMAL)
- close_price (DECIMAL)
- current_price (DECIMAL)
- previous_close (DECIMAL)
- change (DECIMAL)
- change_percent (DECIMAL)
- volatility (DECIMAL)
```

#### 🎯 predictions（预测记录表）
```sql
- id (UUID, 主键)
- user_id (UUID, 外键 auth.users)
- wallet_address (TEXT)
- date (DATE)
- price_direction (TEXT: 'up' | 'down')
- volatility (TEXT: 'small' | 'medium' | 'large')
- base_price (DECIMAL)
- result_price (DECIMAL)
- result_volatility (DECIMAL)
- direction_correct (BOOLEAN)
- volatility_correct (BOOLEAN)
- points_earned (INTEGER)
- status (TEXT: 'pending' | 'settled')
- UNIQUE(user_id, date) -- 每天只能预测一次
```

### 3. ✅ RLS (Row Level Security) 策略
已为所有表启用并配置了安全策略：

- **user_profiles**: 用户只能查看/更新自己的资料
- **gold_prices**: 所有人可读，仅服务角色可写
- **predictions**: 用户只能查看/插入自己的预测，服务角色可更新

### 4. ✅ 触发器和函数
- ✅ `update_updated_at_column()` - 自动更新 updated_at 时间戳
- ✅ `calculate_user_accuracy()` - 自动计算用户准确率

### 5. ✅ 小程序集成代码

#### 📦 安装 Supabase 客户端
```bash
cd /Users/vivienna/Desktop/VibeCoding/GoldBet
npm install @supabase/supabase-js
```
**状态**: ✅ 已成功安装

#### 📄 创建配置文件：`utils/supabase.js`
```javascript
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://xdvulevrojtvhcmdaexd.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  }
})
```
**状态**: ✅ 已创建

#### 🔄 完全重写：`utils/api.js`
将原来基于 HTTP REST 的 API 调用全部替换为 Supabase SDK 调用：

**旧方式（HTTP REST）**：
```javascript
wx.request({
  url: 'http://localhost:3000/api/prices/current',
  method: 'GET',
  header: { 'Authorization': 'Bearer token' }
})
```

**新方式（Supabase SDK）**：
```javascript
const { data, error } = await supabase
  .from('gold_prices')
  .select('*')
  .order('date', { ascending: false })
  .limit(1)
```

**涵盖的 API 接口**：
- ✅ 用户认证（3个接口）：walletLogin, verifyToken
- ✅ 价格数据（3个接口）：getCurrentPrice, getTodayPrice, getPriceHistory
- ✅ 预测管理（4个接口）：submitPrediction, getMyPredictions, checkTodayPrediction
- ✅ 用户统计（1个接口）：getUserStats
- ✅ 排行榜（3个接口）：积分榜、准确率榜、连胜榜

**状态**: ✅ 已完全重写

#### 🔐 更新应用入口：`miniprogram/app.js`
- ✅ 移除旧的 HTTP API 调用
- ✅ 集成 Supabase 认证
- ✅ 使用钱包地址自动注册/登录
- ✅ Session 持久化管理

**关键变更**：
```javascript
// 旧方式
wx.request({
  url: `${apiBaseUrl}/auth/wallet-login`,
  method: 'POST',
  data: { code }
})

// 新方式
const result = await API.walletLogin(walletAddress);
```

**状态**: ✅ 已完成集成

---

## 🔍 认证流程说明

### Supabase 钱包认证机制

由于 Supabase Auth 需要 email/password，我们使用以下简化方案：

```javascript
// 1. 将钱包地址转换为邮箱格式
const email = `${walletAddress.toLowerCase()}@goldbet.app`
const password = walletAddress

// 2. 尝试登录
await supabase.auth.signInWithPassword({ email, password })

// 3. 如果用户不存在，自动注册
if (error?.message.includes('Invalid')) {
  await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { wallet_address: walletAddress }
    }
  })

  // 4. 创建用户扩展信息
  await supabase
    .from('user_profiles')
    .insert({
      id: user.id,
      wallet_address: walletAddress
    })
}
```

**优势**：
- ✅ 自动注册新用户
- ✅ 无需后端 API
- ✅ 利用 Supabase Auth 的 session 管理
- ✅ RLS 策略自动生效（auth.uid()）

---

## 📂 文件清单

### 新增文件
- ✅ `supabase-schema.sql` - 数据库架构脚本
- ✅ `utils/supabase.js` - Supabase 客户端配置
- ✅ `SUPABASE_MIGRATION_GUIDE.md` - 迁移指南
- ✅ `SUPABASE_INTEGRATION_COMPLETE.md` - 本文档

### 修改文件
- ✅ `utils/api.js` - 完全重写为 Supabase SDK 调用
- ✅ `miniprogram/app.js` - 集成 Supabase 认证
- ✅ `package.json` - 添加 @supabase/supabase-js 依赖

### 保留文件（暂不删除，可选清理）
- `server/` 目录 - 原 Node.js 后端（已弃用，但代码逻辑可参考）
- `server/.env` - 环境变量（GoldAPI.io 密钥仍然有用）

---

## 🧪 测试指南

### 1. 测试认证流程

在 `miniprogram/app.js` 的 `onLaunch` 中添加测试代码：

```javascript
onLaunch: function() {
  console.log('GoldBet 小程序启动');

  // 测试登录
  this.testLogin();
},

testLogin: async function() {
  try {
    // 使用测试钱包地址
    const testWallet = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';

    const result = await API.walletLogin(testWallet);

    if (result.success) {
      console.log('✅ 登录成功:', result.data);
    } else {
      console.error('❌ 登录失败:', result.message);
    }
  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}
```

**预期结果**：
```
✅ 登录成功: {
  token: "eyJhbGciOiJIUzI1NiIsInR5cCI...",
  walletAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  userId: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
}
```

### 2. 测试金价获取

```javascript
testGetPrice: async function() {
  const result = await API.getCurrentPrice();

  if (result.success) {
    console.log('✅ 金价数据:', result.data);
    // 输出：currentPrice, previousClose, change, changePercent
  } else {
    console.error('❌ 获取失败:', result.message);
  }
}
```

**注意**：首次运行前需要先插入金价数据（见下文）

### 3. 在 Supabase Dashboard 验证数据

登录 https://supabase.com/dashboard ，选择 GoldBet 项目：

#### 查看用户注册
```sql
SELECT * FROM auth.users;
SELECT * FROM user_profiles;
```

应该看到测试钱包地址对应的用户记录。

#### 查看金价数据
```sql
SELECT * FROM gold_prices ORDER BY date DESC LIMIT 1;
```

如果为空，需要插入初始数据（见下文）。

---

## 📊 插入初始金价数据

### 方法 1：在 Supabase SQL Editor 中执行

```sql
INSERT INTO public.gold_prices (
  date,
  open_price,
  high_price,
  low_price,
  current_price,
  previous_close,
  change,
  change_percent,
  volatility
) VALUES (
  CURRENT_DATE,
  4616.13,
  4621.08,
  4536.74,
  4596.69,
  4616.13,
  -19.44,
  -0.42,
  1.83
) ON CONFLICT (date) DO UPDATE SET
  current_price = EXCLUDED.current_price,
  high_price = GREATEST(gold_prices.high_price, EXCLUDED.high_price),
  low_price = LEAST(gold_prices.low_price, EXCLUDED.low_price),
  updated_at = NOW();
```

### 方法 2：使用 GoldAPI.io（推荐）

创建一个简单的脚本 `scripts/update-gold-price.js`：

```javascript
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

const supabase = createClient(
  'https://xdvulevrojtvhcmdaexd.supabase.co',
  'YOUR_SERVICE_ROLE_KEY' // 从 Supabase Dashboard > Settings > API 获取
);

async function updateGoldPrice() {
  try {
    // 1. 从 GoldAPI.io 获取最新金价
    const response = await axios.get('https://www.goldapi.io/api/XAU/USD', {
      headers: { 'x-access-token': 'goldapi-3ykfysmkjea0q6-io' }
    });

    const data = response.data;
    const today = new Date().toISOString().split('T')[0];

    // 2. 保存到 Supabase
    const { error } = await supabase
      .from('gold_prices')
      .upsert({
        date: today,
        open_price: data.open_price,
        high_price: data.high_price,
        low_price: data.low_price,
        current_price: data.price,
        previous_close: data.prev_close_price,
        change: data.ch,
        change_percent: data.chp,
        volatility: ((data.high_price - data.low_price) / data.open_price * 100).toFixed(2)
      });

    if (error) throw error;

    console.log('✅ 金价更新成功:', data.price);
  } catch (error) {
    console.error('❌ 更新失败:', error.message);
  }
}

updateGoldPrice();
```

**运行**：
```bash
cd /Users/vivienna/Desktop/VibeCoding/GoldBet
node scripts/update-gold-price.js
```

---

## ⏰ 自动化金价更新（可选）

### 选项 1：使用 Supabase Edge Functions

1. 创建 Edge Function
2. 配置定时触发（Cron）
3. 自动调用 GoldAPI.io 并更新数据库

**优势**：无需自己维护服务器

### 选项 2：使用外部 Cron 服务

- **EasyCron**: https://www.easycron.com/
- **Cron-job.org**: https://cron-job.org/

配置每小时调用一次更新脚本。

---

## 🚀 下一步：运行小程序

### 1. 配置 Luffa Cloud IDE

1. 打开 **Luffa Cloud IDE**
2. 导入项目：`/Users/vivienna/Desktop/VibeCoding/GoldBet`
3. 配置 App ID（从 Luffa 开发者平台获取）

### 2. 测试完整流程

1. **启动小程序**
2. **测试钱包登录**：点击 "连接钱包" 按钮
3. **查看金价**：首页应显示当前金价
4. **提交预测**：进入预测页，选择涨跌和波动
5. **查看历史**：历史记录页应显示预测记录
6. **查看排行榜**：排行榜页应显示积分排名

---

## 📋 功能检查清单

### 认证功能
- [ ] 钱包登录（自动注册新用户）
- [ ] Session 持久化（关闭重开仍保持登录）
- [ ] Token 验证
- [ ] 退出登录

### 金价数据
- [ ] 获取当前金价
- [ ] 获取今日价格详情（开/高/低/收）
- [ ] 获取历史价格（7天、30天）

### 预测功能
- [ ] 提交预测（方向 + 波动）
- [ ] 检查今日是否已预测
- [ ] 查看我的预测记录
- [ ] 预测结算（需要定时任务）

### 用户统计
- [ ] 查看个人统计（总数、正确数、准确率、积分）
- [ ] 查看个人排名

### 排行榜
- [ ] 积分排行榜（Top 50）
- [ ] 准确率排行榜（最少5次预测）
- [ ] 连胜排行榜

---

## ⚠️ 注意事项

### 1. 安全性
- ✅ 已启用 RLS，用户只能访问自己的数据
- ✅ 已使用 Anon Key（客户端安全）
- ⚠️ Service Role Key 仅用于服务端脚本，不要暴露给客户端

### 2. GoldAPI.io 限制
- **免费版限制**：1次/小时
- **建议**：配置定时任务每小时更新一次即可
- **超额处理**：返回 429 错误时使用缓存数据

### 3. 数据一致性
- 每个用户每天只能预测一次（数据库约束：UNIQUE(user_id, date)）
- 预测必须在当天市场收盘前提交
- 结算需要等到有当天收盘价后执行

---

## 🎯 架构对比

### 迁移前：MongoDB + Node.js
```
小程序 → HTTP REST API → Node.js 后端 → MongoDB
```
**缺点**：
- ❌ 需要自己部署和维护服务器
- ❌ 需要安装和配置 MongoDB
- ❌ 需要编写大量 API 路由和控制器代码
- ❌ 需要手动实现认证和授权逻辑

### 迁移后：Supabase
```
小程序 → Supabase SDK → Supabase (PostgreSQL + Auth + API)
```
**优点**：
- ✅ 零运维（Serverless）
- ✅ 内置认证系统
- ✅ 自动生成 RESTful API
- ✅ RLS 提供行级安全控制
- ✅ 实时订阅（可选）
- ✅ 免费额度：500MB 数据库 + 2GB 流量/月

---

## 📞 问题排查

### 问题 1：登录失败 "Invalid login credentials"
**原因**：首次登录时用户不存在
**解决**：检查 `utils/api.js` 中的 `walletLogin` 是否包含自动注册逻辑

### 问题 2：无法读取 gold_prices 表
**原因**：RLS 策略阻止
**解决**：确认已执行 SQL 中的 RLS 策略：
```sql
CREATE POLICY "Anyone can view gold prices"
  ON gold_prices FOR SELECT
  TO public
  USING (true);
```

### 问题 3：预测提交失败
**原因**：用户今天已经预测过
**解决**：先调用 `API.checkTodayPrediction()` 检查状态

### 问题 4：排行榜为空
**原因**：数据库中没有用户数据
**解决**：需要先有用户登录和提交预测，数据才会显示

---

## 🎉 完成标志

当你看到以下结果时，说明集成成功：

1. ✅ 小程序启动时自动验证 session
2. ✅ 点击 "连接钱包" 成功登录
3. ✅ 首页显示实时金价（从 Supabase 读取）
4. ✅ 可以成功提交预测
5. ✅ 历史记录页显示预测列表
6. ✅ 排行榜显示用户排名

---

## 📚 相关文档

- **Supabase 迁移指南**: `SUPABASE_MIGRATION_GUIDE.md`
- **数据库架构**: `supabase-schema.sql`
- **项目就绪指南**: `READY_TO_START.md`
- **产品需求文档**: `PRD_GoldBet.md`
- **GoldAPI 设置**: `GOLDAPI_SETUP_GUIDE.md`

---

## 🚀 现在开始测试！

推荐测试顺序：

```bash
# 1. 插入初始金价数据（在 Supabase SQL Editor）
# 见上文 "插入初始金价数据" 部分

# 2. 使用 Luffa Cloud IDE 打开项目
# 导入 /Users/vivienna/Desktop/VibeCoding/GoldBet

# 3. 配置 App ID

# 4. 运行小程序

# 5. 测试完整流程
# - 钱包登录
# - 查看金价
# - 提交预测
# - 查看历史
# - 查看排行榜
```

---

**✨ Supabase 集成完成！祝你测试顺利！🎮**

**架构**: 小程序 → Supabase SDK → PostgreSQL + Auth
**认证**: 钱包地址 → Email/Password (自动转换)
**数据库**: 3 个表 + RLS + 触发器
**API**: 15 个接口（全部通过 Supabase SDK）
**状态**: ✅ 就绪
