# 黄金价格数据集成方案

## 🎯 推荐方案：TradingView Widget + 免费API

### 方案优势
- ✅ 完全免费，无需付费API
- ✅ TradingView提供专业图表展示
- ✅ 免费API提供具体数值用于预测结算
- ✅ 用户体验好，数据可靠

---

## 📊 方案一：TradingView Widget（推荐用于展示）

### 在小程序中使用 web-view 嵌入 TradingView

**注意**：Luffa SuperBox 需要支持 web-view 组件。如果不支持，可以跳到方案二。

#### 1. 创建 TradingView 图表页面

创建 `pages/chart/chart.wxml`：

```xml
<!-- pages/chart/chart.wxml -->
<web-view src="{{chartUrl}}"></web-view>
```

创建 `pages/chart/chart.js`：

```javascript
Page({
  data: {
    chartUrl: ''
  },

  onLoad: function() {
    // TradingView Widget HTML页面URL
    // 需要部署在你的服务器上
    this.setData({
      chartUrl: 'https://your-domain.com/tradingview-chart.html'
    });
  }
});
```

#### 2. 创建 TradingView HTML页面

在你的服务器上创建 `tradingview-chart.html`：

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Gold Price Chart</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, sans-serif;
        }
        #tradingview-widget {
            width: 100%;
            height: 100vh;
        }
    </style>
</head>
<body>
    <!-- TradingView Widget BEGIN -->
    <div class="tradingview-widget-container">
        <div id="tradingview-widget"></div>
    </div>

    <script type="text/javascript" src="https://s3.tradingview.com/tv.js"></script>
    <script type="text/javascript">
        new TradingView.widget({
            "width": "100%",
            "height": "100%",
            "symbol": "OANDA:XAUUSD",  // 黄金/美元
            "interval": "D",            // 日线
            "timezone": "Asia/Shanghai",
            "theme": "light",
            "style": "1",
            "locale": "zh_CN",
            "toolbar_bg": "#f1f3f6",
            "enable_publishing": false,
            "hide_top_toolbar": false,
            "hide_legend": false,
            "save_image": false,
            "container_id": "tradingview-widget"
        });
    </script>
    <!-- TradingView Widget END -->
</body>
</html>
```

#### 3. 或者使用 iframe（更简单）

如果支持iframe，直接在首页添加：

```xml
<!-- 在首页价格卡片后添加图表 -->
<view class="chart-card card">
  <view class="chart-header">
    <text class="chart-title">📈 黄金走势图</text>
  </view>
  <view class="chart-container">
    <web-view src="https://www.tradingview.com/widgetembed/?symbol=OANDA%3AXAUUSD&interval=D&hidesidetoolbar=0&symboledit=0&saveimage=0&toolbarbg=f1f3f6&studies=%5B%5D&theme=light&style=1&timezone=Asia%2FShanghai&locale=zh_CN"></web-view>
  </view>
</view>
```

---

## 💰 方案二：免费金价API（推荐用于数据获取）

### 推荐的免费API

#### 1. **GoldAPI.io** （推荐 ⭐⭐⭐⭐⭐）

**免费额度**：1次/小时，足够我们的需求

**注册地址**：https://www.goldapi.io/

**API示例**：
```javascript
// server/src/services/priceService.js

async function fetchGoldPriceFromAPI() {
  try {
    const apiKey = process.env.GOLD_API_KEY; // 在 GoldAPI.io 注册获取
    const url = 'https://www.goldapi.io/api/XAU/USD';

    const response = await axios.get(url, {
      headers: {
        'x-access-token': apiKey
      }
    });

    const data = response.data;

    return {
      currentPrice: data.price,           // 当前价格
      openPrice: data.open_price,         // 开盘价
      highPrice: data.high_price,         // 最高价
      lowPrice: data.low_price,           // 最低价
      previousClose: data.prev_close_price, // 昨日收盘
      timestamp: new Date(data.price_gram_24k)
    };
  } catch (error) {
    console.error('GoldAPI fetch error:', error);
    return null;
  }
}
```

**响应示例**：
```json
{
  "timestamp": 1737115200,
  "metal": "XAU",
  "currency": "USD",
  "exchange": "OANDA",
  "symbol": "OANDA:XAUUSD",
  "prev_close_price": 2038.20,
  "open_price": 2040.00,
  "low_price": 2038.10,
  "high_price": 2055.20,
  "price": 2045.50,
  "ch": 7.30,
  "chp": 0.36
}
```

#### 2. **Metals.dev API** （备选 ⭐⭐⭐⭐）

**免费额度**：50次/月

**注册地址**：https://metals.dev/

**API示例**：
```javascript
async function fetchGoldPriceFromAPI() {
  try {
    const apiKey = process.env.GOLD_API_KEY;
    const url = `https://api.metals.dev/v1/latest?api_key=${apiKey}&currency=USD&unit=toz`;

    const response = await axios.get(url);
    const data = response.data;

    return {
      currentPrice: data.metals.gold,
      timestamp: new Date(data.timestamp * 1000)
    };
  } catch (error) {
    console.error('Metals.dev fetch error:', error);
    return null;
  }
}
```

#### 3. **免费爬虫方案** （最后备选）

如果不想注册API，可以爬取公开网站数据：

**数据源**：
- 金价网：https://www.jinjiawang.com/
- Kitco：https://www.kitco.com/
- Investing.com：https://www.investing.com/

**爬虫示例**（使用 axios + cheerio）：

```javascript
const axios = require('axios');
const cheerio = require('cheerio');

async function fetchGoldPriceFromWeb() {
  try {
    // 以金价网为例
    const response = await axios.get('https://www.jinjiawang.com/');
    const $ = cheerio.load(response.data);

    // 根据实际页面结构调整选择器
    const priceText = $('.gold-price .price').text();
    const currentPrice = parseFloat(priceText.replace(/[^0-9.]/g, ''));

    return {
      currentPrice: currentPrice,
      timestamp: new Date()
    };
  } catch (error) {
    console.error('Web scraping error:', error);
    return null;
  }
}
```

---

## 🔧 完整实现方案

### 修改后端价格服务

更新 `server/src/services/priceService.js`：

```javascript
// server/src/services/priceService.js
const axios = require('axios');
const GoldPrice = require('../models/GoldPrice');

/**
 * 从GoldAPI.io获取黄金价格
 */
async function fetchGoldPriceFromAPI() {
  try {
    const apiKey = process.env.GOLD_API_KEY;

    if (!apiKey) {
      console.warn('GOLD_API_KEY not set, using mock data');
      return generateMockPrice();
    }

    const url = 'https://www.goldapi.io/api/XAU/USD';

    const response = await axios.get(url, {
      headers: {
        'x-access-token': apiKey
      }
    });

    const data = response.data;

    return {
      currentPrice: data.price,
      openPrice: data.open_price || data.price,
      highPrice: data.high_price || data.price,
      lowPrice: data.low_price || data.price,
      previousClose: data.prev_close_price || data.price,
      timestamp: new Date()
    };
  } catch (error) {
    console.error('GoldAPI fetch error:', error);

    // 如果API调用失败，使用备选方案
    return await fetchFromBackupSource();
  }
}

/**
 * 备选数据源
 */
async function fetchFromBackupSource() {
  try {
    // 使用Metals.dev作为备选
    const apiKey = process.env.METALS_API_KEY;
    const url = `https://api.metals.dev/v1/latest?api_key=${apiKey}&currency=USD&unit=toz`;

    const response = await axios.get(url);
    const price = response.data.metals.gold;

    return {
      currentPrice: price,
      openPrice: price,
      highPrice: price,
      lowPrice: price,
      previousClose: price,
      timestamp: new Date()
    };
  } catch (error) {
    console.error('Backup API fetch error:', error);
    return generateMockPrice();
  }
}

/**
 * 生成模拟价格（开发测试用）
 */
function generateMockPrice() {
  const basePrice = 2040;
  const variation = Math.random() * 20 - 10; // -10 到 +10
  const price = basePrice + variation;

  return {
    currentPrice: price,
    openPrice: price - Math.random() * 5,
    highPrice: price + Math.random() * 5,
    lowPrice: price - Math.random() * 5,
    previousClose: price - Math.random() * 10,
    timestamp: new Date()
  };
}

/**
 * 从第三方API获取并保存黄金价格
 */
exports.fetchAndSavePrice = async () => {
  try {
    console.log('Fetching gold price...');

    const priceData = await fetchGoldPriceFromAPI();

    if (!priceData) {
      throw new Error('Failed to fetch gold price');
    }

    // 获取或创建今日价格记录
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let todayPrice = await GoldPrice.findOne({ date: today });

    if (todayPrice) {
      // 更新现有记录
      todayPrice.currentPrice = priceData.currentPrice;
      todayPrice.highPrice = Math.max(todayPrice.highPrice, priceData.highPrice);
      todayPrice.lowPrice = Math.min(todayPrice.lowPrice, priceData.lowPrice);
    } else {
      // 创建新记录
      const previousPrice = await GoldPrice.getLatestPrice();

      todayPrice = new GoldPrice({
        date: today,
        openPrice: priceData.openPrice,
        highPrice: priceData.highPrice,
        lowPrice: priceData.lowPrice,
        currentPrice: priceData.currentPrice,
        previousClose: previousPrice ? previousPrice.closePrice : priceData.previousClose
      });
    }

    await todayPrice.save();
    console.log('Gold price saved:', priceData.currentPrice);

    return todayPrice;
  } catch (error) {
    console.error('Fetch and save price error:', error);
    throw error;
  }
};

// 其他方法保持不变...
```

### 更新环境变量

修改 `server/.env.example`：

```bash
# 黄金价格API配置

# 方案1: GoldAPI.io (推荐)
GOLD_API_KEY=your_goldapi_io_key
GOLD_API_URL=https://www.goldapi.io/api/XAU/USD

# 方案2: Metals.dev (备选)
METALS_API_KEY=your_metals_dev_key

# 数据更新频率
PRICE_UPDATE_INTERVAL=0 */1 * * *  # 每小时更新一次（GoldAPI免费1次/小时）
```

---

## 📱 小程序端集成

### 选项1：在首页添加"查看图表"按钮

```xml
<!-- pages/index/index.wxml -->
<!-- 在价格卡片后添加 -->
<view class="chart-link card" bindtap="goToChart">
  <view class="chart-icon">📈</view>
  <view class="chart-text">
    <text class="chart-title">查看实时图表</text>
    <text class="chart-desc">TradingView专业K线图</text>
  </view>
  <view class="chart-arrow">→</view>
</view>
```

```javascript
// pages/index/index.js
goToChart: function() {
  wx.navigateTo({
    url: '/pages/chart/chart'
  });
}
```

### 选项2：在首页直接显示简化版价格

保持当前设计，只显示数值，用户体验更好：

```xml
<!-- 保持现有设计 -->
<view class="price-card card">
  <view class="current-price">
    <text class="price">{{priceData.currentPrice}}</text>
    <text class="price-unit">USD/盎司</text>
  </view>
  <!-- ... -->
</view>
```

---

## 🎯 最终推荐方案

### 方案组合
1. **数据获取**：GoldAPI.io（1次/小时，完全够用）
2. **图表展示**：可选添加TradingView链接或web-view
3. **小程序展示**：简洁的数值展示（当前设计）

### 优点
- ✅ 完全免费
- ✅ 数据可靠
- ✅ 易于实现
- ✅ 用户体验好

### 实施步骤

1. **注册 GoldAPI.io**
   - 访问：https://www.goldapi.io/
   - 免费注册账户
   - 获取API Key

2. **配置环境变量**
   ```bash
   GOLD_API_KEY=your_goldapi_io_key_here
   PRICE_UPDATE_INTERVAL=0 */1 * * *
   ```

3. **替换价格服务代码**
   - 使用上面提供的 `priceService.js` 代码

4. **测试**
   ```bash
   npm run dev
   # 观察控制台输出，确认价格获取成功
   ```

5. **（可选）添加TradingView图表**
   - 如果Luffa支持web-view，添加图表页面
   - 如果不支持，保持当前简洁设计

---

## 📊 数据更新策略

### 定时任务设置

```javascript
// server/src/index.js

// GoldAPI.io 免费版：1次/小时
// 设置每小时更新一次
cron.schedule('0 */1 * * *', async () => {
  console.log('Running hourly price update...');
  try {
    await priceService.fetchAndSavePrice();
  } catch (error) {
    console.error('Price update failed:', error);
  }
});
```

### 前端缓存策略

```javascript
// pages/index/index.js

loadGoldPrice: function() {
  // 检查缓存
  const cachedPrice = wx.getStorageSync('cachedPrice');
  const cacheTime = wx.getStorageSync('cacheTime');
  const now = Date.now();

  // 如果缓存未过期（5分钟内），使用缓存
  if (cachedPrice && cacheTime && (now - cacheTime < 5 * 60 * 1000)) {
    this.setData({ priceData: cachedPrice });
    return;
  }

  // 否则从服务器获取
  API.getCurrentPrice()
    .then(res => {
      // 保存到缓存
      wx.setStorageSync('cachedPrice', res.data);
      wx.setStorageSync('cacheTime', now);

      this.setData({ priceData: res.data });
    });
}
```

---

## 💡 总结

**推荐使用**：
- **GoldAPI.io** - 免费、可靠、每小时1次足够使用
- **简洁的数值展示** - 保持当前设计，用户体验更好
- **可选TradingView图表** - 如果需要高级图表功能

**不推荐使用**：
- ~~Alpha Vantage~~ - 需要付费
- ~~复杂爬虫~~ - 不稳定，可能违反网站条款

你觉得这个方案如何？需要我帮你实现哪部分代码？
