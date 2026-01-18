# 🔧 问题诊断和解决方案

## 🐛 当前错误

```
TypeError: Cannot read properties of undefined (reading 'globalData')
at api.js? [sm]:42
```

## 📊 可能的原因

### 1. **数据库中没有金价数据**（最可能）

Supabase 查询返回空结果时，`.single()` 会抛出错误，导致后续代码执行失败。

**解决方案**：先在 Supabase 中插入测试数据

### 2. **Supabase 客户端库在小程序环境中的兼容性问题**

`@supabase/supabase-js` 可能不完全支持微信小程序环境。

**解决方案**：需要使用小程序适配版本或自定义 HTTP 请求

---

## ✅ 立即解决方案

### 步骤 1：插入测试金价数据

在 **Supabase Dashboard** > **SQL Editor** 中执行：

```sql
-- 插入今天的金价数据
INSERT INTO public.gold_prices (
  date,
  open_price,
  high_price,
  low_price,
  current_price,
  previous_close,
  change,
  change_percent,
  volatility,
  created_at,
  updated_at
) VALUES (
  CURRENT_DATE,
  4616.13,
  4621.08,
  4536.74,
  4596.69,
  4616.13,
  -19.44,
  -0.42,
  1.83,
  NOW(),
  NOW()
) ON CONFLICT (date) DO UPDATE SET
  current_price = EXCLUDED.current_price,
  high_price = GREATEST(gold_prices.high_price, EXCLUDED.high_price),
  low_price = LEAST(gold_prices.low_price, EXCLUDED.low_price),
  updated_at = NOW();
```

执行后，验证数据：

```sql
SELECT * FROM gold_prices ORDER BY date DESC LIMIT 1;
```

应该看到今天的金价记录。

### 步骤 2：验证 Supabase 连接

如果插入数据后仍然报错，问题可能是 Supabase SDK 在小程序环境中的兼容性。

#### 方案 A：使用 Supabase REST API（推荐）

修改 `utils/api.js` 使用原生 `wx.request` 而不是 Supabase SDK：

```javascript
// utils/api.js - 使用 REST API 版本
const SUPABASE_URL = 'https://xdvulevrojtvhcmdaexd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';

const API = {
  getCurrentPrice: async () => {
    return new Promise((resolve, reject) => {
      wx.request({
        url: `${SUPABASE_URL}/rest/v1/gold_prices?order=date.desc&limit=1`,
        method: 'GET',
        header: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        success: (res) => {
          if (res.statusCode === 200 && res.data && res.data.length > 0) {
            const data = res.data[0];
            resolve({
              success: true,
              data: {
                currentPrice: parseFloat(data.current_price),
                previousClose: parseFloat(data.previous_close),
                change: parseFloat(data.change),
                changePercent: parseFloat(data.change_percent),
                updateTime: data.updated_at
              }
            });
          } else {
            reject(new Error('暂无金价数据'));
          }
        },
        fail: (err) => {
          reject(err);
        }
      });
    });
  }
};
```

#### 方案 B：使用小程序适配的 Supabase 客户端

安装小程序专用包：

```bash
npm install @supabase/supabase-js@1.x
```

注意：使用 v1 版本，它对小程序环境支持更好。

---

## 🧪 测试步骤

### 1. 确认数据库有数据

登录 Supabase Dashboard，查看 `gold_prices` 表是否有记录。

### 2. 测试 REST API

在小程序中添加测试函数：

```javascript
// miniprogram/pages/index/index.js
testSupabase: function() {
  wx.request({
    url: 'https://xdvulevrojtvhcmdaexd.supabase.co/rest/v1/gold_prices?order=date.desc&limit=1',
    method: 'GET',
    header: {
      'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
    },
    success: (res) => {
      console.log('✅ Supabase 连接成功:', res.data);
    },
    fail: (err) => {
      console.error('❌ Supabase 连接失败:', err);
    }
  });
}
```

在 `onLoad` 中调用：

```javascript
onLoad: function() {
  this.testSupabase(); // 测试连接
  this.checkLoginStatus();
}
```

---

## 🔄 完整的 REST API 版本

如果 Supabase SDK 确实不兼容，我可以为你重写整个 `utils/api.js` 使用原生的 `wx.request` + Supabase REST API。

这样的好处是：
- ✅ 完全兼容小程序环境
- ✅ 不依赖第三方 SDK
- ✅ 更轻量级
- ✅ 更好的性能

---

## 📝 下一步操作

1. **立即执行**：在 Supabase SQL Editor 中插入测试数据（上面的 SQL）
2. **重新运行小程序**：看看是否还报错
3. **如果仍然报错**：告诉我具体的错误信息，我会重写 API 为 REST 版本

---

## 🎯 快速修复命令

如果你想快速测试，可以执行：

```sql
-- 在 Supabase SQL Editor 中
INSERT INTO gold_prices (date, open_price, high_price, low_price, current_price, previous_close, change, change_percent, volatility)
VALUES (CURRENT_DATE, 4616.13, 4621.08, 4536.74, 4596.69, 4616.13, -19.44, -0.42, 1.83)
ON CONFLICT (date) DO NOTHING;
```

然后重新运行小程序。

---

需要我现在就重写 `utils/api.js` 为 REST API 版本吗？
