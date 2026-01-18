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
      console.warn('⚠️  GOLD_API_KEY not set, using mock data');
      console.warn('📝 Please register at https://www.goldapi.io/ to get your free API key');
      return generateMockPrice();
    }

    const url = 'https://www.goldapi.io/api/XAU/USD';

    console.log('📡 Fetching gold price from GoldAPI.io...');

    const response = await axios.get(url, {
      headers: {
        'x-access-token': apiKey,
        'Content-Type': 'application/json'
      },
      timeout: 10000 // 10秒超时
    });

    const data = response.data;

    console.log('✅ Gold price fetched successfully:', data.price);

    return {
      currentPrice: data.price,
      openPrice: data.open_price || data.price,
      highPrice: data.high_price || data.price,
      lowPrice: data.low_price || data.price,
      previousClose: data.prev_close_price || data.price,
      change: data.ch || 0,
      changePercent: data.chp || 0,
      timestamp: new Date(data.timestamp * 1000)
    };
  } catch (error) {
    console.error('❌ GoldAPI fetch error:', error.message);

    // 检查错误类型
    if (error.response) {
      // API返回了错误响应
      console.error('API Error Status:', error.response.status);
      console.error('API Error Message:', error.response.data);

      if (error.response.status === 401) {
        console.error('⚠️  Invalid API key. Please check your GOLD_API_KEY in .env file');
      } else if (error.response.status === 429) {
        console.error('⚠️  Rate limit exceeded. Free plan allows 1 request per hour');
      }
    }

    // 如果API调用失败，使用备选方案
    console.log('🔄 Trying backup data source...');
    return await fetchFromBackupSource();
  }
}

/**
 * 备选数据源 - Metals.dev
 */
async function fetchFromBackupSource() {
  try {
    const apiKey = process.env.METALS_API_KEY;

    if (!apiKey) {
      console.warn('⚠️  METALS_API_KEY not set, using mock data');
      return generateMockPrice();
    }

    const url = `https://api.metals.dev/v1/latest?api_key=${apiKey}&currency=USD&unit=toz`;

    console.log('📡 Fetching from Metals.dev (backup)...');

    const response = await axios.get(url, { timeout: 10000 });
    const price = response.data.metals.gold;

    console.log('✅ Backup price fetched:', price);

    return {
      currentPrice: price,
      openPrice: price,
      highPrice: price,
      lowPrice: price,
      previousClose: price,
      change: 0,
      changePercent: 0,
      timestamp: new Date(response.data.timestamp * 1000)
    };
  } catch (error) {
    console.error('❌ Backup API fetch error:', error.message);
    console.log('🎲 Using mock data as fallback');
    return generateMockPrice();
  }
}

/**
 * 生成模拟价格（开发测试用）
 */
function generateMockPrice() {
  const basePrice = 2040;
  const variation = Math.random() * 20 - 10; // -10 到 +10
  const price = parseFloat((basePrice + variation).toFixed(2));

  const open = parseFloat((price - Math.random() * 5).toFixed(2));
  const high = parseFloat((price + Math.random() * 5).toFixed(2));
  const low = parseFloat((price - Math.random() * 5).toFixed(2));
  const prevClose = parseFloat((price - (Math.random() * 10 - 5)).toFixed(2));

  const change = parseFloat((price - prevClose).toFixed(2));
  const changePercent = parseFloat(((change / prevClose) * 100).toFixed(2));

  console.log('🎲 Generated mock price:', price);

  return {
    currentPrice: price,
    openPrice: open,
    highPrice: high,
    lowPrice: low,
    previousClose: prevClose,
    change: change,
    changePercent: changePercent,
    timestamp: new Date()
  };
}

/**
 * 从第三方API获取并保存黄金价格
 */
exports.fetchAndSavePrice = async () => {
  try {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('⏰ Running price update job...');
    console.log('🕐 Time:', new Date().toISOString());

    const priceData = await fetchGoldPriceFromAPI();

    if (!priceData) {
      throw new Error('Failed to fetch gold price from all sources');
    }

    // 获取或创建今日价格记录
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let todayPrice = await GoldPrice.findOne({ date: today });

    if (todayPrice) {
      // 更新现有记录
      console.log('📝 Updating existing price record...');

      todayPrice.currentPrice = priceData.currentPrice;
      todayPrice.highPrice = Math.max(todayPrice.highPrice, priceData.highPrice);
      todayPrice.lowPrice = Math.min(todayPrice.lowPrice, priceData.lowPrice);

      // 更新变动数据
      if (todayPrice.previousClose) {
        todayPrice.change = priceData.currentPrice - todayPrice.previousClose;
        todayPrice.changePercent = (todayPrice.change / todayPrice.previousClose) * 100;
      }
    } else {
      // 创建新记录
      console.log('✨ Creating new price record for today...');

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

    console.log('✅ Gold price saved successfully');
    console.log('💰 Current Price:', todayPrice.currentPrice, 'USD/oz');
    console.log('📊 Open:', todayPrice.openPrice, '| High:', todayPrice.highPrice, '| Low:', todayPrice.lowPrice);
    console.log('📈 Change:', todayPrice.change, '(', todayPrice.changePercent.toFixed(2), '%)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    return todayPrice;
  } catch (error) {
    console.error('❌ Fetch and save price error:', error.message);
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    throw error;
  }
};

/**
 * 设置今日收盘价
 */
exports.setClosePrice = async (price) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayPrice = await GoldPrice.findOne({ date: today });

    if (todayPrice) {
      todayPrice.closePrice = price || todayPrice.currentPrice;
      await todayPrice.save();

      console.log('✅ Close price set:', todayPrice.closePrice, 'USD/oz');
      return todayPrice;
    }

    console.warn('⚠️  No price record found for today');
    return null;
  } catch (error) {
    console.error('❌ Set close price error:', error.message);
    throw error;
  }
};

/**
 * 手动触发价格更新（用于测试）
 */
exports.manualUpdate = async () => {
  console.log('🔄 Manual price update triggered...');
  return await exports.fetchAndSavePrice();
};
